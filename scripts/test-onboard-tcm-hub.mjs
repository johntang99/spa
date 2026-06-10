#!/usr/bin/env node
/**
 * Test onboarding script for tcm-hub site.
 * Exercises O1 (Clone) with media + uploads cloning.
 *
 * Usage: node scripts/test-onboard-tcm-hub.mjs
 *        node scripts/test-onboard-tcm-hub.mjs --skip-ai
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

// ── Load environment ─────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\n]+)"?`));
  return match ? match[1] : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const STORAGE_BUCKET = getEnv('SUPABASE_STORAGE_BUCKET') || getEnv('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET') || 'chinesemedicine-media';

if (!KEY) { console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found'); process.exit(1); }

const TEMPLATE_ID = 'dr-huang-clinic';
const SITE_ID = 'tcm-hub';
const LOCALES = ['en', 'zh'];
const DEFAULT_LOCALE = 'en';

const supaHeaders = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

// ── Supabase REST helpers ────────────────────────────────────────────
async function upsert(table, rows, onConflict) {
  const url = onConflict
    ? `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`
    : `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, { method: 'POST', headers: supaHeaders, body: JSON.stringify(rows) });
  if (!res.ok) throw new Error(`Upsert ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function fetchRows(table, filters) {
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Fetch ${table} failed (${res.status})`);
  return res.json();
}

// ── Supabase Storage helpers ─────────────────────────────────────────
const storageHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function listStorageFiles(prefix) {
  const files = [];
  let offset = 0;
  const limit = 1000;
  // Recursively list all files under prefix
  const queue = [prefix];
  while (queue.length > 0) {
    const currentPrefix = queue.shift();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${STORAGE_BUCKET}`, {
      method: 'POST',
      headers: { ...storageHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: currentPrefix, limit, offset: 0 }),
    });
    if (!res.ok) throw new Error(`Storage list failed (${res.status}): ${await res.text()}`);
    const items = await res.json();
    for (const item of items) {
      const fullPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;
      if (item.id) {
        // It's a file
        files.push(fullPath);
      } else {
        // It's a folder — recurse
        queue.push(fullPath);
      }
    }
  }
  return files;
}

async function copyStorageFile(fromPath, toPath) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/copy`, {
    method: 'POST',
    headers: { ...storageHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucketId: STORAGE_BUCKET,
      sourceKey: fromPath,
      destinationKey: toPath,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    // Ignore "already exists" errors for idempotency
    if (body.includes('already exists')) return true;
    throw new Error(`Storage copy failed (${res.status}): ${body}`);
  }
  return true;
}

// ── Directory copy helper ────────────────────────────────────────────
async function copyDirIfExists(src, dest) {
  try {
    await fsPromises.access(src);
  } catch {
    return false;
  }
  await fsPromises.mkdir(path.dirname(dest), { recursive: true });
  await fsPromises.cp(src, dest, { recursive: true, errorOnExist: false });
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  O1: CLONE — ${TEMPLATE_ID} → ${SITE_ID}`);
  console.log(`${'='.repeat(60)}\n`);

  const start = Date.now();

  // 1. Create site record
  const existing = await fetchRows('sites', { id: SITE_ID });
  if (existing.length === 0) {
    console.log(`  Creating site: ${SITE_ID}`);
    await upsert('sites', [{
      id: SITE_ID,
      name: 'TCM Hub',
      domain: 'tcmhub.com',
      enabled: true,
      default_locale: DEFAULT_LOCALE,
      supported_locales: LOCALES,
    }], 'id');
  } else {
    console.log(`  Site "${SITE_ID}" already exists — re-cloning content...`);
  }

  // 2. Clone content entries
  console.log(`  Fetching template content from "${TEMPLATE_ID}"...`);
  const templateEntries = await fetchRows('content_entries', { site_id: TEMPLATE_ID });
  console.log(`  Template has ${templateEntries.length} content entries`);

  const cloned = templateEntries.map((e) => ({
    site_id: SITE_ID,
    locale: e.locale,
    path: e.path,
    data: e.data,
    updated_by: 'onboard-test',
  }));

  const BATCH = 50;
  for (let i = 0; i < cloned.length; i += BATCH) {
    await upsert('content_entries', cloned.slice(i, i + BATCH), 'site_id,locale,path');
  }
  console.log(`  Cloned ${cloned.length} content entries`);

  // 3. Register domain aliases
  const domainRows = [
    { site_id: SITE_ID, domain: 'tcmhub.com', environment: 'prod', enabled: true },
    { site_id: SITE_ID, domain: 'tcm-hub.local', environment: 'dev', enabled: true },
  ];
  await upsert('site_domains', domainRows, 'site_id,domain,environment');
  console.log(`  Registered ${domainRows.length} domain aliases`);

  // 4. Clone media assets DB records
  console.log(`  Fetching template media assets...`);
  const templateMedia = await fetchRows('media_assets', { site_id: TEMPLATE_ID });
  console.log(`  Template has ${templateMedia.length} media asset records`);

  if (templateMedia.length > 0) {
    const mediaBatchSize = 100;
    for (let i = 0; i < templateMedia.length; i += mediaBatchSize) {
      const batch = templateMedia.slice(i, i + mediaBatchSize);
      const clonedMedia = batch.map((item) => ({
        site_id: SITE_ID,
        path: item.path,
        url: (item.url || '')
          .replace(`/uploads/${TEMPLATE_ID}/`, `/uploads/${SITE_ID}/`)
          .replace(`/${TEMPLATE_ID}/`, `/${SITE_ID}/`),
        updated_at: new Date().toISOString(),
      }));
      await upsert('media_assets', clonedMedia, 'site_id,path');
    }
    console.log(`  Cloned ${templateMedia.length} media asset records`);
  } else {
    console.log('  No media assets to clone');
  }

  // 5. Copy files in Supabase Storage bucket
  console.log(`  Listing storage files under "${TEMPLATE_ID}/"...`);
  const storageFiles = await listStorageFiles(TEMPLATE_ID);
  console.log(`  Found ${storageFiles.length} files in storage bucket`);

  if (storageFiles.length > 0) {
    let copied = 0;
    let failed = 0;
    const CONCURRENCY = 5;
    for (let i = 0; i < storageFiles.length; i += CONCURRENCY) {
      const batch = storageFiles.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((filePath) => {
          const destPath = filePath.replace(`${TEMPLATE_ID}/`, `${SITE_ID}/`);
          return copyStorageFile(filePath, destPath);
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') copied++;
        else { failed++; console.log(`    WARN: ${r.reason.message}`); }
      }
    }
    console.log(`  Storage copy: ${copied} succeeded, ${failed} failed`);
  }

  // 6. Copy local uploads directory
  const uploadsRoot = path.join(ROOT, 'public', 'uploads');
  const srcUploads = path.join(uploadsRoot, TEMPLATE_ID);
  const destUploads = path.join(uploadsRoot, SITE_ID);
  const copiedUploads = await copyDirIfExists(srcUploads, destUploads);
  if (copiedUploads) {
    console.log(`  Copied uploads/${TEMPLATE_ID}/ → uploads/${SITE_ID}/`);
  } else {
    console.log(`  WARNING: uploads/${TEMPLATE_ID}/ not found — skipped`);
  }

  // 7. Copy local content directory
  const srcContent = path.join(CONTENT_DIR, TEMPLATE_ID);
  const destContent = path.join(CONTENT_DIR, SITE_ID);
  const copiedContent = await copyDirIfExists(srcContent, destContent);
  if (copiedContent) {
    console.log(`  Copied content/${TEMPLATE_ID}/ → content/${SITE_ID}/`);
  } else {
    console.log(`  WARNING: content/${TEMPLATE_ID}/ not found — skipped`);
  }

  // 8. Update local _sites.json
  const sitesFile = path.join(CONTENT_DIR, '_sites.json');
  try {
    const sitesData = JSON.parse(fs.readFileSync(sitesFile, 'utf-8'));
    if (!sitesData.sites.find((s) => s.id === SITE_ID)) {
      sitesData.sites.push({
        id: SITE_ID,
        name: 'TCM Hub',
        domain: 'tcmhub.com',
        enabled: true,
        defaultLocale: DEFAULT_LOCALE,
        supportedLocales: LOCALES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      fs.writeFileSync(sitesFile, JSON.stringify(sitesData, null, 2) + '\n');
      console.log('  Updated _sites.json');
    }
  } catch (e) { console.log(`  WARNING: Could not update _sites.json: ${e.message}`); }

  // 9. Update local _site-domains.json
  const domainsFile = path.join(CONTENT_DIR, '_site-domains.json');
  try {
    const domainsData = JSON.parse(fs.readFileSync(domainsFile, 'utf-8'));
    for (const dr of domainRows) {
      if (!domainsData.domains.find((d) => d.siteId === dr.site_id && d.domain === dr.domain)) {
        domainsData.domains.push({ siteId: dr.site_id, domain: dr.domain, environment: dr.environment, enabled: true });
      }
    }
    fs.writeFileSync(domainsFile, JSON.stringify(domainsData, null, 2) + '\n');
    console.log('  Updated _site-domains.json');
  } catch (e) { console.log(`  WARNING: Could not update _site-domains.json: ${e.message}`); }

  const elapsed = Date.now() - start;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  DONE in ${elapsed}ms`);
  console.log(`${'='.repeat(60)}`);

  // ── Verification summary ──────────────────────────────────────────
  console.log('\n── Verification ──');

  // Check DB content entries
  const newEntries = await fetchRows('content_entries', { site_id: SITE_ID });
  console.log(`  content_entries for "${SITE_ID}": ${newEntries.length} rows`);

  // Check DB media assets
  const newMedia = await fetchRows('media_assets', { site_id: SITE_ID });
  console.log(`  media_assets for "${SITE_ID}": ${newMedia.length} rows`);

  // Check DB domains
  const newDomains = await fetchRows('site_domains', { site_id: SITE_ID });
  console.log(`  site_domains for "${SITE_ID}": ${newDomains.length} rows`);

  // Check file-based uploads
  try {
    const uploadFiles = await fsPromises.readdir(destUploads, { recursive: true });
    const imageFiles = uploadFiles.filter(f => !f.startsWith('.'));
    console.log(`  uploads/${SITE_ID}/: ${imageFiles.length} files`);
  } catch { console.log(`  uploads/${SITE_ID}/: NOT FOUND`); }

  // Check file-based content
  try {
    const contentFiles = await fsPromises.readdir(destContent, { recursive: true });
    const realFiles = contentFiles.filter(f => !f.startsWith('.'));
    console.log(`  content/${SITE_ID}/: ${realFiles.length} files`);
  } catch { console.log(`  content/${SITE_ID}/: NOT FOUND`); }

  // Sample media URL check
  if (newMedia.length > 0) {
    const sample = newMedia[0];
    const hasOldRef = sample.url?.includes(`/uploads/${TEMPLATE_ID}/`);
    const hasNewRef = sample.url?.includes(`/uploads/${SITE_ID}/`);
    console.log(`  Media URL sample: ${sample.url}`);
    console.log(`    Contains old template ref: ${hasOldRef ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`    Contains new site ref: ${hasNewRef ? 'YES ✓' : 'NO ⚠️'}`);
  }

  // Check for template contamination in media URLs
  const contaminated = newMedia.filter(m => m.url?.includes(`/uploads/${TEMPLATE_ID}/`));
  if (contaminated.length > 0) {
    console.log(`  ⚠️ ${contaminated.length} media URLs still reference template "${TEMPLATE_ID}"`);
  } else if (newMedia.length > 0) {
    console.log(`  ✓ All media URLs correctly remapped to "${SITE_ID}"`);
  }

  console.log('\nDone! You can now verify in Supabase and the local filesystem.\n');
}

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
