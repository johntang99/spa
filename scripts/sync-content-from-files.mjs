#!/usr/bin/env node
/**
 * Push filesystem JSON under content/<site-id>/ into Supabase content_entries.
 * Mirrors the file layout used by app/api/admin/content/import (collectImportCandidates).
 *
 * Usage:
 *   node scripts/sync-content-from-files.mjs <site-id> [--dry-run]
 *
 * Requires: .env.local with SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const LOCALES = ['en', 'zh'];
const KNOWN_ROOT_ENTRIES = new Set(['pages', 'blog', 'blog-scheduled', '_history']);

const envPath = path.join(ROOT, '.env.local');
const envRaw = (await fs.readFile(envPath, 'utf-8').catch(() => '')) || '';
function getEnv(key) {
  const m = envRaw.match(new RegExp(`^${key}\\s*=\\s*(?:["']?)([^"'\n]+)(?:["']?)`, 'm'));
  return m ? m[1].trim() : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const args = process.argv.slice(2);
const SITE_ID = args.find((a) => !a.startsWith('--'));
const DRY_RUN = args.includes('--dry-run');

if (!SITE_ID) {
  console.error('Usage: node scripts/sync-content-from-files.mjs <site-id> [--dry-run]');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local)');
  process.exit(1);
}

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal',
};

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function collectCandidates(siteId) {
  const out = [];

  async function add(locale, contentPath, filePath) {
    const [data, stat] = await Promise.all([readJson(filePath), fs.stat(filePath)]);
    out.push({ locale, path: contentPath, data, filePath, mtimeMs: stat.mtimeMs });
  }

  for (const locale of LOCALES) {
    const localeRoot = path.join(CONTENT_DIR, siteId, locale);
    try {
      const rootEntries = await fs.readdir(localeRoot);
      for (const entry of rootEntries) {
        const fullPath = path.join(localeRoot, entry);
        const stat = await fs.stat(fullPath);
        if (!stat.isFile()) continue;
        if (entry === 'theme.json') continue;

        if (entry.endsWith('.json')) {
          await add(locale, entry, fullPath);
          continue;
        }

        // SEO pages are root-level JSON files without extension.
        if (entry.includes('.') || KNOWN_ROOT_ENTRIES.has(entry)) continue;
        try {
          await add(locale, entry, fullPath);
        } catch {
          /* skip non-JSON root file */
        }
      }
    } catch {
      /* missing locale */
    }

    const pagesDir = path.join(localeRoot, 'pages');
    try {
      const pageFiles = await fs.readdir(pagesDir);
      for (const file of pageFiles.filter((f) => f.endsWith('.json'))) {
        await add(locale, `pages/${file}`, path.join(pagesDir, file));
      }
    } catch {
      /* no pages */
    }

    const blogDir = path.join(localeRoot, 'blog');
    try {
      const blogFiles = await fs.readdir(blogDir);
      for (const file of blogFiles.filter((f) => f.endsWith('.json'))) {
        await add(locale, `blog/${file}`, path.join(blogDir, file));
      }
    } catch {
      /* no blog */
    }
  }

  const themePath = path.join(CONTENT_DIR, siteId, 'theme.json');
  try {
    const [themeData, themeStat] = await Promise.all([readJson(themePath), fs.stat(themePath)]);
    for (const locale of LOCALES) {
      out.push({
        locale,
        path: 'theme.json',
        data: themeData,
        filePath: themePath,
        mtimeMs: themeStat.mtimeMs,
      });
    }
  } catch {
    /* no root theme */
  }

  const intakePath = path.join(CONTENT_DIR, siteId, 'intake.json');
  try {
    const [intakeData, intakeStat] = await Promise.all([
      readJson(intakePath),
      fs.stat(intakePath),
    ]);
    out.push({
      locale: 'en',
      path: 'intake.json',
      data: intakeData,
      filePath: intakePath,
      mtimeMs: intakeStat.mtimeMs,
    });
  } catch {
    /* no site-level intake */
  }

  return out;
}

async function sbUpsertRows(rows) {
  const url = `${SUPABASE_URL}/rest/v1/content_entries?on_conflict=site_id,locale,path`;
  const res = await fetch(url, {
    method: 'POST',
    headers: sbHeaders,
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Upsert content_entries ${res.status}: ${await res.text()}`);
}

const candidates = await collectCandidates(SITE_ID);
console.log(`Site ${SITE_ID}: ${candidates.length} JSON paths to sync.`);

if (DRY_RUN) {
  console.log('Dry run — no DB writes.');
  process.exit(0);
}

const UPDATED_BY = 'sync-content-from-files';
const batchSize = 25;
let written = 0;

for (let i = 0; i < candidates.length; i += batchSize) {
  const batch = candidates.slice(i, i + batchSize);
  const rows = batch.map((c) => ({
    site_id: SITE_ID,
    locale: c.locale,
    path: c.path,
    data: c.data,
    updated_by: UPDATED_BY,
  }));
  await sbUpsertRows(rows);
  written += batch.length;
  console.log(`  Upserted ${written}/${candidates.length}`);
}

console.log(`Done. ${written} rows upserted into content_entries.`);
