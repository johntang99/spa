#!/usr/bin/env node
/**
 * Site Deletion Script
 *
 * Deletes a site and all associated data from DB, storage, and local files.
 * Every destructive step requires explicit confirmation.
 *
 * Usage:
 *   node scripts/delete-site.mjs <site-id>
 *   node scripts/delete-site.mjs <site-id> --dry-run
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

// ── Parse arguments ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const siteId = args.find((a) => !a.startsWith('--'));
const DRY_RUN = args.includes('--dry-run');

if (!siteId) {
  console.error('Usage: node scripts/delete-site.mjs <site-id> [--dry-run]');
  process.exit(1);
}

// ── Load environment ─────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\n]+)"?`));
  return match ? match[1] : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const STORAGE_BUCKET = getEnv('SUPABASE_STORAGE_BUCKET') || getEnv('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET') || '';

if (!KEY) { console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found'); process.exit(1); }

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// ── Helpers ──────────────────────────────────────────────────────────
async function fetchRows(table, filters) {
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Fetch ${table} failed (${res.status})`);
  return res.json();
}

async function countRows(table, filterCol, filterVal) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filterCol}=eq.${encodeURIComponent(filterVal)}`, {
    method: 'HEAD',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' },
  });
  const range = res.headers.get('content-range');
  if (!range) return 0;
  const match = range.match(/\/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function deleteFrom(table, filterCol, filterVal) {
  if (DRY_RUN) { console.log(`  [DRY-RUN] Would delete from ${table} where ${filterCol} = ${filterVal}`); return 0; }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filterCol}=eq.${encodeURIComponent(filterVal)}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=representation' },
  });
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data.length : 0;
}

async function listStorageFiles(prefix) {
  if (!STORAGE_BUCKET) return [];
  const files = [];
  const queue = [prefix];
  while (queue.length > 0) {
    const currentPrefix = queue.shift();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${STORAGE_BUCKET}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prefix: currentPrefix, limit: 1000, offset: 0 }),
    });
    if (!res.ok) break;
    const items = await res.json();
    for (const item of items) {
      const fullPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;
      if (item.id) files.push(fullPath);
      else queue.push(fullPath);
    }
  }
  return files;
}

async function deleteStorageFiles(filePaths) {
  if (DRY_RUN) { console.log(`  [DRY-RUN] Would delete ${filePaths.length} storage files`); return 0; }
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ prefixes: filePaths }),
  });
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data.length : 0;
}

async function confirm(question) {
  if (DRY_RUN) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n  ⚠️  ${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function dirExists(dirPath) {
  try { await fsPromises.access(dirPath); return true; } catch { return false; }
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SITE DELETION: ${siteId}${DRY_RUN ? ' [DRY RUN]' : ''}`);
  console.log(`${'='.repeat(60)}`);

  // ── Verify site exists ─────────────────────────────────────────────
  const siteRows = await fetchRows('sites', { id: siteId });
  if (siteRows.length === 0) {
    console.log(`\n  Site "${siteId}" not found in database.`);
    console.log('  Checking for leftover local files...\n');
  } else {
    console.log(`\n  Site found: "${siteRows[0].name}" (${siteRows[0].domain || 'no domain'})`);
  }

  // ── Inventory ──────────────────────────────────────────────────────
  console.log('\n── Inventory ──');

  const contentCount = await countRows('content_entries', 'site_id', siteId);
  const mediaCount = await countRows('media_assets', 'site_id', siteId);
  const domainRows = await fetchRows('site_domains', { site_id: siteId });
  const storageFiles = await listStorageFiles(siteId);
  const hasLocalUploads = await dirExists(path.join(ROOT, 'public', 'uploads', siteId));
  const hasLocalContent = await dirExists(path.join(CONTENT_DIR, siteId));
  const sitesJson = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, '_sites.json'), 'utf-8'));
  const domainsJson = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, '_site-domains.json'), 'utf-8'));
  const inSitesJson = sitesJson.sites.some((s) => s.id === siteId);
  const inDomainsJson = domainsJson.domains.filter((d) => d.siteId === siteId).length;

  console.log(`  DB sites:            ${siteRows.length} row(s)`);
  console.log(`  DB content_entries:  ${contentCount} rows`);
  console.log(`  DB media_assets:     ${mediaCount} rows`);
  console.log(`  DB site_domains:     ${domainRows.length} rows`);
  domainRows.forEach((d) => console.log(`    - ${d.domain} (${d.environment})`));
  console.log(`  Storage bucket:      ${storageFiles.length} files`);
  console.log(`  Local uploads:       ${hasLocalUploads ? 'EXISTS' : 'not found'}`);
  console.log(`  Local content:       ${hasLocalContent ? 'EXISTS' : 'not found'}`);
  console.log(`  _sites.json:         ${inSitesJson ? 'FOUND' : 'not found'}`);
  console.log(`  _site-domains.json:  ${inDomainsJson} entries`);

  const totalItems = siteRows.length + contentCount + mediaCount + domainRows.length +
    storageFiles.length + (hasLocalUploads ? 1 : 0) + (hasLocalContent ? 1 : 0) +
    (inSitesJson ? 1 : 0) + inDomainsJson;

  if (totalItems === 0) {
    console.log('\n  Nothing to delete. Site is already fully removed.\n');
    process.exit(0);
  }

  // ── Confirm start ──────────────────────────────────────────────────
  if (!DRY_RUN) {
    const proceed = await confirm(`Delete ALL data for "${siteId}"? This cannot be undone.`);
    if (!proceed) { console.log('\n  Aborted.\n'); process.exit(0); }
  }

  // ── Step 1: content_entries ────────────────────────────────────────
  if (contentCount > 0) {
    console.log(`\n── Step 1: Delete ${contentCount} content entries ──`);
    const ok = await confirm(`Delete ${contentCount} content_entries for "${siteId}"?`);
    if (ok) {
      const deleted = await deleteFrom('content_entries', 'site_id', siteId);
      console.log(`  Deleted ${deleted} rows from content_entries`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 2: media_assets ───────────────────────────────────────────
  if (mediaCount > 0) {
    console.log(`\n── Step 2: Delete ${mediaCount} media asset records ──`);
    const ok = await confirm(`Delete ${mediaCount} media_assets for "${siteId}"?`);
    if (ok) {
      const deleted = await deleteFrom('media_assets', 'site_id', siteId);
      console.log(`  Deleted ${deleted} rows from media_assets`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 3: site_domains ───────────────────────────────────────────
  if (domainRows.length > 0) {
    console.log(`\n── Step 3: Delete ${domainRows.length} domain aliases ──`);
    domainRows.forEach((d) => console.log(`    ${d.domain} (${d.environment})`));
    const ok = await confirm(`Delete these ${domainRows.length} domain alias(es)?`);
    if (ok) {
      const deleted = await deleteFrom('site_domains', 'site_id', siteId);
      console.log(`  Deleted ${deleted} rows from site_domains`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 4: sites ──────────────────────────────────────────────────
  if (siteRows.length > 0) {
    console.log(`\n── Step 4: Delete site record ──`);
    console.log(`    "${siteRows[0].name}" (id: ${siteId})`);
    const ok = await confirm(`Delete the master site record for "${siteId}"?`);
    if (ok) {
      const deleted = await deleteFrom('sites', 'id', siteId);
      console.log(`  Deleted ${deleted} row(s) from sites`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 5: Storage bucket ─────────────────────────────────────────
  if (storageFiles.length > 0) {
    console.log(`\n── Step 5: Delete ${storageFiles.length} files from storage bucket ──`);
    console.log(`    Bucket: ${STORAGE_BUCKET}/${siteId}/`);
    const ok = await confirm(`Delete ${storageFiles.length} files from storage bucket "${STORAGE_BUCKET}/${siteId}/"?`);
    if (ok) {
      const deleted = await deleteStorageFiles(storageFiles);
      console.log(`  Deleted ${deleted} storage files`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 6: Local uploads ──────────────────────────────────────────
  if (hasLocalUploads) {
    const uploadsPath = path.join(ROOT, 'public', 'uploads', siteId);
    console.log(`\n── Step 6: Delete local uploads ──`);
    console.log(`    ${uploadsPath}`);
    const ok = await confirm(`Delete local directory "public/uploads/${siteId}/"?`);
    if (ok) {
      if (!DRY_RUN) await fsPromises.rm(uploadsPath, { recursive: true, force: true });
      console.log(`  Deleted public/uploads/${siteId}/`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 7: Local content ──────────────────────────────────────────
  if (hasLocalContent) {
    const contentPath = path.join(CONTENT_DIR, siteId);
    console.log(`\n── Step 7: Delete local content ──`);
    console.log(`    ${contentPath}`);
    const ok = await confirm(`Delete local directory "content/${siteId}/"?`);
    if (ok) {
      if (!DRY_RUN) await fsPromises.rm(contentPath, { recursive: true, force: true });
      console.log(`  Deleted content/${siteId}/`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 8: _sites.json ────────────────────────────────────────────
  if (inSitesJson) {
    console.log(`\n── Step 8: Remove from _sites.json ──`);
    const ok = await confirm(`Remove "${siteId}" from _sites.json?`);
    if (ok) {
      if (!DRY_RUN) {
        sitesJson.sites = sitesJson.sites.filter((s) => s.id !== siteId);
        fs.writeFileSync(path.join(CONTENT_DIR, '_sites.json'), JSON.stringify(sitesJson, null, 2) + '\n');
      }
      console.log(`  Removed from _sites.json`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Step 9: _site-domains.json ─────────────────────────────────────
  if (inDomainsJson > 0) {
    console.log(`\n── Step 9: Remove ${inDomainsJson} entries from _site-domains.json ──`);
    const ok = await confirm(`Remove ${inDomainsJson} domain entries for "${siteId}" from _site-domains.json?`);
    if (ok) {
      if (!DRY_RUN) {
        domainsJson.domains = domainsJson.domains.filter((d) => d.siteId !== siteId);
        fs.writeFileSync(path.join(CONTENT_DIR, '_site-domains.json'), JSON.stringify(domainsJson, null, 2) + '\n');
      }
      console.log(`  Removed from _site-domains.json`);
    } else {
      console.log('  Skipped.');
    }
  }

  // ── Verification ───────────────────────────────────────────────────
  if (!DRY_RUN) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('  VERIFICATION');
    console.log(`${'='.repeat(60)}\n`);

    const vSites = await fetchRows('sites', { id: siteId });
    const vContent = await countRows('content_entries', 'site_id', siteId);
    const vMedia = await countRows('media_assets', 'site_id', siteId);
    const vDomains = await fetchRows('site_domains', { site_id: siteId });
    const vStorage = await listStorageFiles(siteId);
    const vUploads = await dirExists(path.join(ROOT, 'public', 'uploads', siteId));
    const vContentDir = await dirExists(path.join(CONTENT_DIR, siteId));
    const vSitesJson = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, '_sites.json'), 'utf-8'));
    const vDomainsJson = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, '_site-domains.json'), 'utf-8'));

    const checks = [
      ['DB sites', vSites.length === 0],
      ['DB content_entries', vContent === 0],
      ['DB media_assets', vMedia === 0],
      ['DB site_domains', vDomains.length === 0],
      ['Storage bucket', vStorage.length === 0],
      ['Local uploads', !vUploads],
      ['Local content', !vContentDir],
      ['_sites.json', !vSitesJson.sites.some((s) => s.id === siteId)],
      ['_site-domains.json', !vDomainsJson.domains.some((d) => d.siteId === siteId)],
    ];

    let allClean = true;
    for (const [name, ok] of checks) {
      console.log(`  ${ok ? '✓' : '✗'} ${name}: ${ok ? 'gone' : 'STILL EXISTS'}`);
      if (!ok) allClean = false;
    }

    console.log(allClean
      ? `\n  ✓ Site "${siteId}" fully deleted.\n`
      : `\n  ⚠️ Some items remain. Check skipped steps above.\n`
    );
  } else {
    console.log(`\n  [DRY-RUN] No changes were made.\n`);
  }
}

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
