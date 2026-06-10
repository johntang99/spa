// One-time Phase 0A bootstrap: seed the spa-paradise site row, dev domain,
// and the first super_admin user into the isolated baam-spa Supabase project.
// Also verifies DB connectivity and the `media` storage bucket.
//
// Usage: node scripts/bootstrap-spa-admin.mjs
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.

import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// --- minimal .env.local loader (no dotenv dep needed) ---
const envPath = path.join(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@spaparadise.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'SpaParadise!2026';
const ADMIN_NAME = 'Spa Paradise Admin';

async function main() {
  const results = [];

  // 1. Connectivity check
  {
    const { error } = await supabase.from('sites').select('id').limit(1);
    results.push(['DB connectivity (sites table)', error ? `FAIL: ${error.message}` : 'OK']);
    if (error) throw new Error('Cannot reach DB / schema not applied. Aborting.');
  }

  // 2. Upsert site row
  {
    const { error } = await supabase.from('sites').upsert(
      {
        id: 'spa-paradise',
        name: 'Spa Paradise',
        domain: '',
        enabled: true,
        default_locale: 'en',
        supported_locales: ['en', 'zh'],
      },
      { onConflict: 'id' }
    );
    results.push(['Upsert sites.spa-paradise', error ? `FAIL: ${error.message}` : 'OK']);
  }

  // 3. Upsert dev domain alias
  {
    const { error } = await supabase.from('site_domains').upsert(
      {
        site_id: 'spa-paradise',
        domain: 'spaparadise.local',
        environment: 'dev',
        is_primary: true,
        enabled: true,
      },
      { onConflict: 'site_id,domain,environment' }
    );
    results.push(['Upsert site_domains spaparadise.local', error ? `FAIL: ${error.message}` : 'OK']);
  }

  // 4. Create first super_admin (idempotent)
  {
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id,email')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle();
    if (existing) {
      results.push(['Admin user', `EXISTS (${existing.email}) — left unchanged`]);
    } else {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const { error } = await supabase.from('admin_users').insert({
        id: `user-${Date.now()}`,
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        role: 'super_admin',
        sites: ['spa-paradise'],
        password_hash: passwordHash,
      });
      results.push([
        'Create super_admin',
        error ? `FAIL: ${error.message}` : `OK (${ADMIN_EMAIL} / ${ADMIN_PASSWORD})`,
      ]);
    }
  }

  // 5. Storage bucket check
  {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      results.push(['Storage buckets', `FAIL: ${error.message}`]);
    } else {
      const media = (data || []).find((b) => b.name === 'media');
      results.push([
        'Storage bucket "media"',
        media ? `OK (public=${media.public})` : 'MISSING — create a public bucket named "media"',
      ]);
    }
  }

  console.log('\n=== Phase 0A bootstrap results ===');
  for (const [k, v] of results) console.log(`  ${v.startsWith('OK') || v.startsWith('EXISTS') ? '✓' : '✗'} ${k}: ${v}`);
  console.log('');
}

main().catch((e) => {
  console.error('Bootstrap error:', e.message);
  process.exit(1);
});
