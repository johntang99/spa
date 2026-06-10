// Seed/sync: walk content/spa-paradise/{en,zh}/**.json -> content_entries (DB).
// Root-level theme.json / intake.json are applied to all locales (platform convention).
// Idempotent upsert on (site_id, locale, path). Run: node scripts/seed-spa-content.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// --- env ---
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[m[1]]) process.env[m[1]] = v;
}
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const SITE = 'spa-paradise';
const LOCALES = ['en', 'zh'];
const ROOT = path.join(process.cwd(), 'content', SITE);

function walk(dir, base) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (entry.name.endsWith('.json')) out.push({ full, rel: path.relative(base, full) });
  }
  return out;
}

async function upsert(locale, relPath, data, updatedBy) {
  const { error } = await supabase.from('content_entries').upsert(
    { site_id: SITE, locale, path: relPath.split(path.sep).join('/'), data, updated_by: updatedBy },
    { onConflict: 'site_id,locale,path' }
  );
  if (error) throw new Error(`${locale}/${relPath}: ${error.message}`);
}

async function main() {
  let count = 0;
  // Per-locale files
  for (const locale of LOCALES) {
    const dir = path.join(ROOT, locale);
    if (!fs.existsSync(dir)) continue;
    for (const { full, rel } of walk(dir, dir)) {
      const data = JSON.parse(fs.readFileSync(full, 'utf-8'));
      await upsert(locale, rel, data, 'seed-0D');
      count++;
    }
  }
  // Root-level shared files (theme.json, intake.json) -> all locales
  for (const name of ['theme.json', 'intake.json']) {
    const full = path.join(ROOT, name);
    if (!fs.existsSync(full)) continue;
    const data = JSON.parse(fs.readFileSync(full, 'utf-8'));
    for (const locale of LOCALES) { await upsert(locale, name, data, 'seed-0D'); count++; }
  }

  // Verify counts in DB
  const { count: dbCount } = await supabase
    .from('content_entries')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', SITE);

  console.log(`Seeded/synced ${count} file-entries to content_entries.`);
  console.log(`content_entries rows for ${SITE}: ${dbCount}`);
}

main().catch((e) => { console.error('Seed error:', e.message); process.exit(1); });
