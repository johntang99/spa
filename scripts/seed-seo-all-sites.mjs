#!/usr/bin/env node
/**
 * Seed SEO pages for ALL enabled sites that have intake.json
 *
 * Usage:
 *   node scripts/seed-seo-all-sites.mjs [--dry-run]
 *
 * This is a convenience wrapper around seed-seo-pages.mjs.
 * It finds all sites with intake.json and runs the seeder for each.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DRY_RUN = process.argv.includes('--dry-run');

// Load env
const envPath = path.join(ROOT, '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
function getEnv(key) {
  const m = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\n]+)"?`));
  return m ? m[1] : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

async function getEnabledSites() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sites?enabled=eq.true&select=id,name`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch sites: ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`\n═══ SEO Page Seeder — ALL SITES ═══${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const sites = await getEnabledSites();
  console.log(`Found ${sites.length} enabled sites\n`);

  const results = [];

  for (const site of sites) {
    const intakePath = path.join(CONTENT_DIR, site.id, 'intake.json');
    const hasIntake = fs.existsSync(intakePath);

    if (!hasIntake) {
      console.log(`⊘ ${site.id} (${site.name}) — no intake.json, skipping`);
      results.push({ site: site.id, status: 'skipped', reason: 'no intake.json' });
      continue;
    }

    console.log(`▶ ${site.id} (${site.name})`);

    if (DRY_RUN) {
      const intake = JSON.parse(fs.readFileSync(intakePath, 'utf-8'));
      const modalities = intake.services?.modalities || [];
      console.log(`  Would generate: 5 core + ${modalities.length} service pages × 2 locales`);
      results.push({ site: site.id, status: 'dry-run', pages: 5 + modalities.length });
      continue;
    }

    try {
      const seederPath = path.join(ROOT, 'scripts', 'seed-seo-pages.mjs');
      execSync(`node "${seederPath}" "${site.id}"`, {
        cwd: ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          ...Object.fromEntries(
            envContent.split('\n')
              .filter(l => l.includes('=') && !l.startsWith('#'))
              .map(l => {
                const [k, ...v] = l.split('=');
                return [k.trim(), v.join('=').replace(/^"|"$/g, '').trim()];
              })
          ),
        },
        timeout: 600_000,
      });
      results.push({ site: site.id, status: 'success' });
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      results.push({ site: site.id, status: 'failed', error: err.message });
    }

    console.log('');
  }

  // Summary
  console.log('═══ Summary ═══');
  const succeeded = results.filter(r => r.status === 'success').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`  Success: ${succeeded}  Skipped: ${skipped}  Failed: ${failed}`);
  if (failed > 0) {
    console.log('  Failed sites:');
    results.filter(r => r.status === 'failed').forEach(r => console.log(`    - ${r.site}: ${r.error}`));
  }
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
