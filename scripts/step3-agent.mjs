#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

function readArgValue(flag, fallback = '') {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseSites() {
  const raw = readArgValue('--sites', '');
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function loadDotEnvLocal(projectRoot) {
  const envPath = path.join(projectRoot, '.env.local');
  let raw = '';
  try {
    raw = await fs.readFile(envPath, 'utf-8');
  } catch {
    return;
  }

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function resolveSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_PROD_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROD_URL ||
    ''
  );
}

function resolveServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PROD_SERVICE_ROLE_KEY ||
    ''
  );
}

function resolveBucket() {
  return (
    process.env.SUPABASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    ''
  );
}

async function loadVariantRegistry(projectRoot) {
  const registryPath = path.join(projectRoot, 'scripts', 'step3-variant-registry.json');
  const raw = await fs.readFile(registryPath, 'utf-8');
  return JSON.parse(raw);
}

async function loadFormCoveredPathPrefixes(projectRoot) {
  const filePath = path.join(projectRoot, 'components', 'admin', 'ContentEditor.tsx');
  const source = await fs.readFile(filePath, 'utf-8');
  const regex = /updateFormValue\(\[([^\]]+)\]/g;
  const prefixes = new Set();
  let match = regex.exec(source);
  while (match) {
    const inside = match[1];
    const tokenRegex = /'([^']+)'/g;
    const tokens = [];
    let tokenMatch = tokenRegex.exec(inside);
    while (tokenMatch) {
      tokens.push(tokenMatch[1]);
      tokenMatch = tokenRegex.exec(inside);
    }
    if (tokens.length > 0) {
      prefixes.add(tokens.join('.'));
      prefixes.add(tokens[0]);
    }
    match = regex.exec(source);
  }

  // Common form-visible sections rendered by shared panels.
  ['hero', 'profile', 'introduction', 'images', 'cta'].forEach((value) =>
    prefixes.add(value)
  );
  [
    'slug',
    'title',
    'image',
    'author',
    'excerpt',
    'publishDate',
    'category',
    'tags',
    'readingTime',
    'contentMarkdown',
    'seoTitle',
    'seoDescription',
    'status',
    'featured',
  ].forEach((value) => prefixes.add(value));
  return Array.from(prefixes).sort((a, b) => a.localeCompare(b));
}

function walkStrings(input, callback) {
  if (typeof input === 'string') {
    callback(input);
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) walkStrings(item, callback);
    return;
  }
  if (input && typeof input === 'object') {
    for (const value of Object.values(input)) {
      walkStrings(value, callback);
    }
  }
}

function classifyImageLikeString(value, bucket) {
  if (value.startsWith('/uploads/')) return 'legacy_upload_path';
  if (!/^https?:\/\//i.test(value)) return null;
  if (
    bucket &&
    value.includes('/storage/v1/object/public/') &&
    value.includes(`/${bucket}/`)
  ) {
    return 'bucket_url';
  }
  const lower = value.toLowerCase();
  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.avif')
  ) {
    return 'external_image_url';
  }
  return null;
}

function bucketBaseUrl(supabaseUrl, bucket) {
  if (!supabaseUrl || !bucket) return '';
  return `${new URL(supabaseUrl).origin}/storage/v1/object/public/${bucket}`;
}

function legacyUploadsToBucketUrl(value, supabaseUrl, bucket) {
  if (!value.startsWith('/uploads/')) return value;
  const base = bucketBaseUrl(supabaseUrl, bucket);
  if (!base) return value;
  return `${base}/${value.slice('/uploads/'.length)}`;
}

function collectVariantFindings(input, currentPath, registry, out) {
  if (Array.isArray(input)) {
    input.forEach((item, index) =>
      collectVariantFindings(item, `${currentPath}[${index}]`, registry, out)
    );
    return;
  }
  if (!input || typeof input !== 'object') return;

  for (const [key, value] of Object.entries(input)) {
    const nextPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof value === 'string' && key.toLowerCase().endsWith('variant')) {
      const parentSection = currentPath
        ? currentPath.split('.').filter(Boolean).slice(-1)[0]
        : '';
      const sectionKeyFromField =
        key.toLowerCase() === 'variant' ? parentSection : key.slice(0, -'variant'.length);
      const candidateKeys = [sectionKeyFromField, key, parentSection].filter(Boolean);
      const registryKey =
        candidateKeys.find((candidate) =>
          Object.prototype.hasOwnProperty.call(registry, candidate)
        ) || null;

      if (!registryKey) {
        out.push({
          type: 'unknown_variant_key',
          path: nextPath,
          key,
          value,
        });
      } else if (!registry[registryKey].includes(value)) {
        out.push({
          type: 'unsupported_variant_value',
          path: nextPath,
          key,
          value,
          allowed: registry[registryKey],
        });
      }
    }
    collectVariantFindings(value, nextPath, registry, out);
  }
}

function flattenLeafPaths(input, currentPath, out) {
  if (Array.isArray(input)) {
    if (input.length === 0) {
      out.push(currentPath);
      return;
    }
    input.forEach((item, index) =>
      flattenLeafPaths(item, `${currentPath}[${index}]`, out)
    );
    return;
  }
  if (input && typeof input === 'object') {
    const entries = Object.entries(input);
    if (entries.length === 0) {
      out.push(currentPath);
      return;
    }
    for (const [key, value] of entries) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      flattenLeafPaths(value, nextPath, out);
    }
    return;
  }
  out.push(currentPath);
}

function pathCoveredByForm(pathValue, coveredPrefixes) {
  return coveredPrefixes.some(
    (prefix) =>
      pathValue === prefix ||
      pathValue.startsWith(`${prefix}.`) ||
      pathValue.startsWith(`${prefix}[`)
  );
}

function looksLikeFormManagedFile(filePath, data) {
  if (filePath === 'seo.json' || filePath === 'header.json' || filePath === 'theme.json') {
    return true;
  }
  if (filePath === 'pages/home.json' || filePath === 'pages/conditions.json' || filePath === 'pages/case-studies.json') {
    return true;
  }
  if (filePath.startsWith('blog/')) {
    return true;
  }
  if (!data || typeof data !== 'object') return false;
  const keys = Object.keys(data);
  return ['hero', 'introduction', 'cta', 'profile', 'images'].some((key) =>
    keys.includes(key)
  );
}

async function checkUrlReachability(urls) {
  const results = [];
  const concurrency = 10;
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      const url = urls[index];
      try {
        const headRes = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        });
        if (headRes.ok) {
          results.push({ url, ok: true, status: headRes.status });
          continue;
        }
        if (headRes.status === 405 || headRes.status === 403) {
          const getRes = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(8000),
          });
          results.push({ url, ok: getRes.ok, status: getRes.status });
        } else {
          results.push({ url, ok: false, status: headRes.status });
        }
      } catch (error) {
        results.push({ url, ok: false, status: 0, error: String(error) });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

async function fetchAllEntriesForSite(supabase, siteId) {
  const allRows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('content_entries')
      .select('id,site_id,locale,path,data,updated_at')
      .eq('site_id', siteId)
      .order('locale', { ascending: true })
      .order('path', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data || [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return allRows;
}

async function countMediaRows(supabase, siteId) {
  const { count, error } = await supabase
    .from('media_assets')
    .select('*', { head: true, count: 'exact' })
    .eq('site_id', siteId);
  if (error) throw new Error(error.message);
  return Number(count || 0);
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', env: process.env });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
      }
    });
  });
}

async function main() {
  const projectRoot = process.cwd();
  await loadDotEnvLocal(projectRoot);
  const variantRegistry = await loadVariantRegistry(projectRoot);
  const formCoveredPrefixes = await loadFormCoveredPathPrefixes(projectRoot);

  const sites = parseSites();
  const fix = hasFlag('--fix');
  const skipMigration = hasFlag('--skip-migration');
  const skipNormalize = hasFlag('--skip-normalize');
  const failOnBroken = hasFlag('--fail-on-broken');
  const failOnVariant = hasFlag('--fail-on-variant');

  if (!sites.length) {
    console.error('Missing required --sites argument (comma-separated).');
    process.exit(1);
  }

  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();
  const bucket = resolveBucket();
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('=== Step 3 Agent ===');
  console.log(`Target: ${new URL(supabaseUrl).host}`);
  console.log(`Bucket: ${bucket || '(not set)'}`);
  console.log(`Sites: ${sites.join(', ')}`);
  console.log(`Mode: ${fix ? 'FIX + AUDIT' : 'AUDIT ONLY'}`);
  console.log(`Gate: fail-on-broken=${failOnBroken} fail-on-variant=${failOnVariant}`);
  console.log('====================');

  if (fix) {
    if (!skipMigration) {
      await runCommand('node', ['scripts/migrate-media-to-supabase.mjs', '--sites', sites.join(',')], projectRoot);
    }
    if (!skipNormalize) {
      await runCommand(
        'node',
        ['scripts/normalize-content-media-urls.mjs', '--sites', sites.join(',')],
        projectRoot
      );
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: fix ? 'fix+audit' : 'audit',
    targetHost: new URL(supabaseUrl).host,
    bucket,
    checks: {
      urlReachability: true,
      variantCompatibility: true,
      adminFormCoverage: true,
    },
    gate: {
      failOnBroken,
      failOnVariant,
      failed: false,
      reasons: [],
    },
    formCoveredPrefixes,
    sites: [],
  };

  for (const siteId of sites) {
    const rows = await fetchAllEntriesForSite(supabase, siteId);
    const mediaAssetsCount = await countMediaRows(supabase, siteId);

    let legacyUploadPathCount = 0;
    let bucketUrlCount = 0;
    let externalImageUrlCount = 0;
    let variantKeyCount = 0;
    const variantIssues = [];
    const formCoverageMismatches = [];
    const filesWithLegacyPaths = new Set();
    const urlSet = new Set();

    for (const row of rows) {
      walkStrings(row.data, (value) => {
        const bucketHint = bucket || '';
        const category = classifyImageLikeString(value, bucketHint);
        if (category === 'legacy_upload_path') {
          legacyUploadPathCount += 1;
          filesWithLegacyPaths.add(`${row.locale}:${row.path}`);
          const normalizedUrl = legacyUploadsToBucketUrl(value, supabaseUrl, bucket);
          if (/^https?:\/\//i.test(normalizedUrl)) {
            urlSet.add(normalizedUrl);
          }
        } else if (category === 'bucket_url') {
          bucketUrlCount += 1;
          urlSet.add(value);
        } else if (category === 'external_image_url') {
          externalImageUrlCount += 1;
          urlSet.add(value);
        }
      });

      const countVariants = (input) => {
        if (Array.isArray(input)) {
          for (const item of input) countVariants(item);
          return;
        }
        if (input && typeof input === 'object') {
          for (const [key, value] of Object.entries(input)) {
            if (key.toLowerCase().endsWith('variant') && typeof value === 'string') {
              variantKeyCount += 1;
            }
            countVariants(value);
          }
        }
      };
      countVariants(row.data);
      collectVariantFindings(row.data, '', variantRegistry, variantIssues);

      if (looksLikeFormManagedFile(row.path, row.data)) {
        const leafPaths = [];
        flattenLeafPaths(row.data, '', leafPaths);
        const missing = leafPaths
          .filter((entry) => entry && !pathCoveredByForm(entry, formCoveredPrefixes))
          .slice(0, 15);
        if (missing.length > 0) {
          formCoverageMismatches.push({
            file: `${row.locale}:${row.path}`,
            missingPaths: missing,
          });
        }
      }
    }

    const urlCheckResults = await checkUrlReachability(Array.from(urlSet));
    const brokenUrls = urlCheckResults.filter((item) => !item.ok);

    report.sites.push({
      siteId,
      contentEntries: rows.length,
      mediaAssets: mediaAssetsCount,
      imageRefs: {
        legacyUploadPathCount,
        bucketUrlCount,
        externalImageUrlCount,
      },
      variantKeyCount,
      variantIssuesCount: variantIssues.length,
      variantIssuesPreview: variantIssues.slice(0, 40),
      urlReachability: {
        checked: urlCheckResults.length,
        broken: brokenUrls.length,
        brokenPreview: brokenUrls.slice(0, 40),
      },
      formCoverage: {
        filesFlagged: formCoverageMismatches.length,
        mismatchesPreview: formCoverageMismatches.slice(0, 25),
      },
      filesWithLegacyPathsPreview: Array.from(filesWithLegacyPaths).slice(0, 30),
    });
  }

  const reportsDir = path.join(projectRoot, 'reports');
  await fs.mkdir(reportsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDir, `step3-agent-${ts}.json`);
  const mdPath = path.join(reportsDir, `step3-agent-${ts}.md`);
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

  const lines = [];
  lines.push('# Step 3 Agent Report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Mode: ${report.mode}`);
  lines.push(`- Target: ${report.targetHost}`);
  lines.push(`- Bucket: ${report.bucket || '(not set)'}`);
  lines.push('');
  for (const site of report.sites) {
    lines.push(`## ${site.siteId}`);
    lines.push(`- content entries: ${site.contentEntries}`);
    lines.push(`- media_assets rows: ${site.mediaAssets}`);
    lines.push(`- image refs (bucket URL): ${site.imageRefs.bucketUrlCount}`);
    lines.push(`- image refs (legacy /uploads): ${site.imageRefs.legacyUploadPathCount}`);
    lines.push(`- image refs (external URL): ${site.imageRefs.externalImageUrlCount}`);
    lines.push(`- variant key occurrences: ${site.variantKeyCount}`);
    lines.push(`- variant compatibility issues: ${site.variantIssuesCount}`);
    lines.push(
      `- URL reachability: checked ${site.urlReachability.checked}, broken ${site.urlReachability.broken}`
    );
    lines.push(`- admin form coverage files flagged: ${site.formCoverage.filesFlagged}`);

    if (site.variantIssuesPreview.length > 0) {
      lines.push('- variant issues preview:');
      for (const issue of site.variantIssuesPreview.slice(0, 10)) {
        lines.push(`  - ${issue.type}: ${issue.path} = "${issue.value}"`);
      }
    } else {
      lines.push('- variant issues preview: none');
    }

    if (site.urlReachability.brokenPreview.length > 0) {
      lines.push('- broken URL preview:');
      for (const item of site.urlReachability.brokenPreview.slice(0, 10)) {
        lines.push(`  - [${item.status}] ${item.url}`);
      }
    } else {
      lines.push('- broken URL preview: none');
    }

    if (site.formCoverage.mismatchesPreview.length > 0) {
      lines.push('- form mismatch preview:');
      for (const entry of site.formCoverage.mismatchesPreview.slice(0, 8)) {
        lines.push(`  - ${entry.file}`);
        entry.missingPaths.slice(0, 5).forEach((pathValue) => {
          lines.push(`    - ${pathValue}`);
        });
      }
    } else {
      lines.push('- form mismatch preview: none');
    }

    if (site.filesWithLegacyPathsPreview.length > 0) {
      lines.push('- files with legacy paths (preview):');
      for (const filePath of site.filesWithLegacyPathsPreview) {
        lines.push(`  - ${filePath}`);
      }
    } else {
      lines.push('- files with legacy paths (preview): none');
    }
    lines.push('');
  }

  await fs.writeFile(mdPath, `${lines.join('\n')}\n`);

  const totalBrokenUrls = report.sites.reduce(
    (sum, site) => sum + Number(site.urlReachability?.broken || 0),
    0
  );
  const totalVariantIssues = report.sites.reduce(
    (sum, site) => sum + Number(site.variantIssuesCount || 0),
    0
  );

  if (failOnBroken && totalBrokenUrls > 0) {
    report.gate.failed = true;
    report.gate.reasons.push(
      `Broken URL gate failed: ${totalBrokenUrls} broken URLs detected.`
    );
  }
  if (failOnVariant && totalVariantIssues > 0) {
    report.gate.failed = true;
    report.gate.reasons.push(
      `Variant gate failed: ${totalVariantIssues} variant compatibility issues detected.`
    );
  }

  if (report.gate.failed) {
    lines.push('## Gate Result');
    lines.push('- Failed');
    for (const reason of report.gate.reasons) {
      lines.push(`- ${reason}`);
    }
    await fs.writeFile(mdPath, `${lines.join('\n')}\n`);
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  }

  console.log('\nStep 3 agent completed.');
  console.log(`JSON report: ${jsonPath}`);
  console.log(`MD report: ${mdPath}`);

  if (report.gate.failed) {
    console.error('\nStep 3 gate failed:');
    for (const reason of report.gate.reasons) {
      console.error(`- ${reason}`);
    }
    process.exit(2);
  }
}

main().catch((error) => {
  console.error('Step 3 agent failed:', error);
  process.exit(1);
});
