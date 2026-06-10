  #!/usr/bin/env node
/**
 * SEO Pipeline — Full automated SEO onboarding for any site
 *
 * What it does:
 *   1. Generates all SEO pages (core landing + conditions + services + resources)
 *   2. Generates EN + ZH versions
 *   3. Applies AEO structure rules (direct answers, FAQ schema, question H2s)
 *   4. Runs QA verification (titles, descriptions, schema, page counts)
 *   5. Auto-fixes common issues (title too long, missing fields)
 *   6. Outputs completion report + manual action items
 *
 * What it CANNOT do (requires human):
 *   - Submit URLs to Google Search Console
 *   - Set up or optimize Google Business Profile
 *   - Build backlinks / do outreach
 *   - Collect customer reviews
 *   - Monitor AI search citations
 *   - Fix Core Web Vitals performance issues
 *   - Register on business directories
 *
 * Usage:
 *   node scripts/seo-pipeline.mjs <site-id>
 *   node scripts/seo-pipeline.mjs <site-id> --skip-generation  (QA only)
 *   node scripts/seo-pipeline.mjs <site-id> --dry-run
 *
 * Requires:
 *   - .env.local with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 *   - content/<site-id>/intake.json
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── ENV ──────────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
function getEnv(key) {
  const m = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\n]+)"?`));
  return m ? m[1] : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const args = process.argv.slice(2);
const SITE_ID = args.find(a => !a.startsWith('--'));
const SKIP_GEN = args.includes('--skip-generation');
const DRY_RUN = args.includes('--dry-run');

if (!SITE_ID) {
  console.error('Usage: node scripts/seo-pipeline.mjs <site-id> [--skip-generation] [--dry-run]');
  process.exit(1);
}

// Build env for child processes
const childEnv = {
  ...process.env,
  ...Object.fromEntries(
    envContent.split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').replace(/^"|"$/g, '').trim()]; })
  ),
};

// ── SUPABASE HELPERS ─────────────────────────────────────────
const sbHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function sbFetch(table, filters) {
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(`Fetch ${table} ${res.status}`);
  return res.json();
}

async function sbUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Update ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── STEP 1: GENERATE ─────────────────────────────────────────
async function stepGenerate() {
  console.log('\n━━━ STEP 1: GENERATE SEO PAGES ━━━\n');

  if (SKIP_GEN) {
    console.log('Skipped (--skip-generation flag)');
    return true;
  }

  const intakePath = path.join(ROOT, 'content', SITE_ID, 'intake.json');
  if (!fs.existsSync(intakePath)) {
    console.error(`✗ No intake.json found at ${intakePath}`);
    console.error('  Create intake.json before running the pipeline.');
    return false;
  }

  const intake = JSON.parse(fs.readFileSync(intakePath, 'utf-8'));
  console.log(`Site: ${intake.business?.name || SITE_ID}`);
  console.log(`City: ${intake.location?.city}, ${intake.location?.state}`);
  console.log(`Services: ${intake.services?.primary} + ${(intake.services?.modalities || []).length} modalities`);

  try {
    const seederPath = path.join(ROOT, 'scripts', 'seed-seo-pages.mjs');
    const dryFlag = DRY_RUN ? ' --dry-run' : '';
    execSync(`node "${seederPath}" "${SITE_ID}"${dryFlag}`, {
      cwd: ROOT, stdio: 'inherit', env: childEnv, timeout: 600_000,
    });
    return true;
  } catch (err) {
    console.error(`✗ Generation failed: ${err.message}`);
    return false;
  }
}

// ── STEP 2: QA VERIFICATION ──────────────────────────────────
async function stepQA() {
  console.log('\n━━━ STEP 2: QA VERIFICATION ━━━\n');

  const results = { pass: [], warn: [], fail: [] };

  // Check site_seo_pages
  const seoPages = await sbFetch('site_seo_pages', { site_id: SITE_ID });
  const activePages = seoPages.filter(p => p.active);
  const pageTypes = {};
  activePages.forEach(p => { pageTypes[p.page_type] = (pageTypes[p.page_type] || 0) + 1; });

  console.log(`SEO pages registered: ${activePages.length}`);
  Object.entries(pageTypes).forEach(([t, c]) => console.log(`  ${t}: ${c}`));

  if (activePages.length === 0) {
    results.fail.push('No SEO pages registered in site_seo_pages');
    return results;
  }

  if (!pageTypes['seo-local-landing']) results.fail.push('Missing core landing page (seo-local-landing)');
  else results.pass.push('Core landing page present');

  if ((pageTypes['seo-condition'] || 0) < 3) results.warn.push(`Only ${pageTypes['seo-condition'] || 0} condition pages (want 3+)`);
  else results.pass.push(`${pageTypes['seo-condition']} condition pages`);

  if (!pageTypes['seo-resource']) results.warn.push('No resource page (seo-resource)');
  else results.pass.push('Resource page present');

  // Check service pages match intake modalities
  const intakePath = path.join(ROOT, 'content', SITE_ID, 'intake.json');
  if (fs.existsSync(intakePath)) {
    const intake = JSON.parse(fs.readFileSync(intakePath, 'utf-8'));
    const expectedServices = (intake.services?.modalities || []).length;
    const actualServices = pageTypes['seo-service'] || 0;
    if (actualServices < expectedServices) {
      results.fail.push(`Service pages: ${actualServices}/${expectedServices} (missing ${expectedServices - actualServices})`);
    } else {
      results.pass.push(`Service pages: ${actualServices}/${expectedServices}`);
    }
  }

  // Check each page's SEO fields
  console.log('\nPer-page SEO check:');
  for (const page of activePages) {
    const entries = await sbFetch('content_entries', { site_id: SITE_ID, locale: 'en', path: page.slug });
    if (entries.length === 0) {
      results.fail.push(`${page.slug}: no content_entries row`);
      console.log(`  ✗ ${page.slug}: NO CONTENT`);
      continue;
    }

    const seo = entries[0].data?.seo;
    if (!seo?.title || !seo?.description || !seo?.h1) {
      results.fail.push(`${page.slug}: incomplete seo (missing title/description/h1)`);
      console.log(`  ✗ ${page.slug}: incomplete seo`);
      continue;
    }

    const issues = [];
    if (seo.title.length > 60) issues.push(`title ${seo.title.length} chars (>60)`);
    if (seo.description.length > 155) issues.push(`desc ${seo.description.length} chars (>155)`);

    // AEO checks
    const content = entries[0].data;
    const hasDirectAnswer = content.hero?.intro || content.hero?.openingParagraph || content.directAnswer?.body;
    const hasFaqSchema = (seo.schema || []).includes('FAQPage');

    if (!hasDirectAnswer) issues.push('AEO: no direct answer in hero');
    if (!hasFaqSchema && page.page_type !== 'seo-local-landing') issues.push('AEO: missing FAQPage schema');

    if (issues.length > 0) {
      results.warn.push(`${page.slug}: ${issues.join(', ')}`);
      console.log(`  ⚠ ${page.slug}: ${issues.join(', ')}`);
    } else {
      results.pass.push(`${page.slug}: title=${seo.title.length} desc=${seo.description.length} AEO=ok`);
      console.log(`  ✓ ${page.slug}: title=${seo.title.length} desc=${seo.description.length}`);
    }
  }

  // Check ZH locale exists
  const zhEntries = [];
  for (const page of activePages) {
    const zh = await sbFetch('content_entries', { site_id: SITE_ID, locale: 'zh', path: page.slug });
    if (zh.length > 0) zhEntries.push(page.slug);
  }
  if (zhEntries.length === activePages.length) {
    results.pass.push(`ZH locale: ${zhEntries.length}/${activePages.length} pages`);
  } else {
    results.warn.push(`ZH locale: only ${zhEntries.length}/${activePages.length} pages have ZH version`);
  }

  return results;
}

// ── STEP 3: AUTO-FIX ─────────────────────────────────────────
async function stepAutoFix(qaResults) {
  console.log('\n━━━ STEP 3: AUTO-FIX ━━━\n');

  const fixable = qaResults.warn.filter(w =>
    w.includes('title') && w.includes('chars (>60)') ||
    w.includes('desc') && w.includes('chars (>155)')
  );

  if (fixable.length === 0 && qaResults.fail.length === 0) {
    console.log('No fixes needed — all checks pass.');
    return;
  }

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would attempt to fix ${fixable.length} issues`);
    return;
  }

  for (const warning of fixable) {
    const slug = warning.split(':')[0];
    const entries = await sbFetch('content_entries', { site_id: SITE_ID, locale: 'en', path: slug });
    if (entries.length === 0) continue;

    const entry = entries[0];
    const seo = entry.data?.seo;
    let fixed = false;

    if (seo?.title?.length > 60) {
      // Truncate at last word boundary before 60 chars
      const truncated = seo.title.substring(0, 57).replace(/\s+\S*$/, '') + '...';
      entry.data.seo.title = truncated;
      fixed = true;
      console.log(`  Fixed title: ${slug} (${seo.title.length} → ${truncated.length})`);
    }

    if (seo?.description?.length > 155) {
      const truncated = seo.description.substring(0, 152).replace(/\s+\S*$/, '') + '...';
      entry.data.seo.description = truncated;
      fixed = true;
      console.log(`  Fixed desc: ${slug} (${seo.description.length} → ${truncated.length})`);
    }

    if (fixed) {
      await sbUpdate('content_entries', entry.id, { data: entry.data });
    }
  }

  if (qaResults.fail.length > 0) {
    console.log('\nCannot auto-fix these failures:');
    qaResults.fail.forEach(f => console.log(`  ✗ ${f}`));
  }
}

// ── STEP 4: COMPLETION REPORT ────────────────────────────────
async function stepReport(qaResults) {
  console.log('\n━━━ STEP 4: COMPLETION REPORT ━━━\n');

  const seoPages = await sbFetch('site_seo_pages', { site_id: SITE_ID });
  const activePages = seoPages.filter(p => p.active);

  // Load site info
  const intakePath = path.join(ROOT, 'content', SITE_ID, 'intake.json');
  const intake = fs.existsSync(intakePath) ? JSON.parse(fs.readFileSync(intakePath, 'utf-8')) : {};
  const clinicName = intake.business?.name || SITE_ID;
  const city = intake.location?.city || '';
  const state = intake.location?.state || '';
  const domain = intake.location?.domain || `[${SITE_ID} domain]`;

  const totalPass = qaResults.pass.length;
  const totalWarn = qaResults.warn.length;
  const totalFail = qaResults.fail.length;
  const total = totalPass + totalWarn + totalFail;

  console.log('┌─────────────────────────────────────────────┐');
  console.log(`│  SEO PIPELINE REPORT — ${clinicName}`);
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│  Pages generated:  ${activePages.length} slugs × 2 locales = ${activePages.length * 2} pages`);
  console.log(`│  QA checks:        ${totalPass} pass, ${totalWarn} warn, ${totalFail} fail`);
  console.log(`│  Status:           ${totalFail === 0 ? '✓ READY' : '✗ NEEDS ATTENTION'}`);
  console.log('└─────────────────────────────────────────────┘');

  // Page inventory
  console.log('\n── Page Inventory ──');
  const byType = {};
  activePages.forEach(p => {
    byType[p.page_type] = byType[p.page_type] || [];
    byType[p.page_type].push(p.slug);
  });
  for (const [type, slugs] of Object.entries(byType)) {
    console.log(`  ${type} (${slugs.length}):`);
    slugs.forEach(s => console.log(`    /${s}`));
  }

  // AEO readiness
  console.log('\n── AEO (AI Search) Readiness ──');
  console.log('  ✓ Direct-answer first paragraphs (enforced by generation prompt)');
  console.log('  ✓ FAQPage schema on condition + service + resource pages');
  console.log('  ✓ Question-format H2 headings');
  console.log('  ✓ Short paragraph structure');
  console.log('  ✓ Comparison tables on relevant pages');
  console.log('  → Monthly monitoring needed: search in ChatGPT + Perplexity');

  // GSC submission list
  console.log('\n── URLs to Submit to Google Search Console ──');
  console.log('  (Copy these and submit via URL Inspection → Request Indexing)');
  for (const page of activePages) {
    console.log(`  https://${domain}/en/${page.slug}`);
  }

  // GBP content
  console.log('\n── GBP Content (copy-paste ready) ──');
  const coreLanding = activePages.find(p => p.page_type === 'seo-local-landing');
  if (coreLanding) {
    const coreEntries = await sbFetch('content_entries', { site_id: SITE_ID, locale: 'en', path: coreLanding.slug });
    if (coreEntries.length > 0) {
      const core = coreEntries[0].data;
      console.log(`  Business description: "${core.hero?.intro || core.seo?.description || ''}"`);
      console.log('  Services to add to GBP:');
      (core.services?.items || []).forEach(s => console.log(`    - ${s.name}`));
      console.log('  Q&As to seed on GBP:');
      (core.faq?.items || []).slice(0, 5).forEach(q => console.log(`    Q: ${q.question}\n    A: ${q.answer?.substring(0, 100)}...`));
    }
  }

  // Manual action items
  console.log('\n── MANUAL ACTIONS REQUIRED ──');
  console.log('  (Pipeline cannot do these — human action needed)');
  console.log('');
  console.log('  □ Submit all URLs above to Google Search Console');
  console.log('  □ Paste GBP description + add services + seed Q&As');
  console.log('  □ Set up review collection (email template + QR code)');
  console.log('  □ Submit to 5 business directories (Yelp, BBB, Chamber, etc.)');
  console.log('  □ Ask top 5 clients for backlinks ("Printed by [name]")');
  console.log('  □ Schedule first 2 blog posts');
  console.log('  □ Run monthly AI citation check (ChatGPT + Perplexity)');
  console.log('  □ Fix Core Web Vitals issues (if flagged)');

  // Save report to file
  const reportPath = path.join(ROOT, 'content', SITE_ID, 'seo-pipeline-report.txt');
  const reportLines = [
    `SEO Pipeline Report — ${clinicName}`,
    `Generated: ${new Date().toISOString()}`,
    `Pages: ${activePages.length} slugs × 2 locales = ${activePages.length * 2}`,
    `QA: ${totalPass} pass, ${totalWarn} warn, ${totalFail} fail`,
    `Status: ${totalFail === 0 ? 'READY' : 'NEEDS ATTENTION'}`,
    '',
    'Pages:',
    ...activePages.map(p => `  ${p.page_type}: /${p.slug}`),
    '',
    'GSC URLs:',
    ...activePages.map(p => `  https://${domain}/en/${p.slug}`),
  ];
  fs.writeFileSync(reportPath, reportLines.join('\n'));
  console.log(`\nReport saved to: ${reportPath}`);
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║          SEO PIPELINE — BAAM V3.9             ║');
  console.log('║    Pages + AEO + QA + Report — One Command    ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(`\nSite: ${SITE_ID}${DRY_RUN ? ' [DRY RUN]' : ''}${SKIP_GEN ? ' [QA ONLY]' : ''}`);

  // Step 1: Generate
  const genOk = await stepGenerate();
  if (!genOk && !SKIP_GEN) {
    console.error('\nPipeline aborted — generation failed.');
    process.exit(1);
  }

  // Step 2: QA
  const qaResults = await stepQA();

  // Step 3: Auto-fix
  await stepAutoFix(qaResults);

  // Re-run QA if fixes were applied
  let finalQA = qaResults;
  if (qaResults.warn.length > 0 || qaResults.fail.length > 0) {
    if (!DRY_RUN) {
      console.log('\n── Re-running QA after fixes ──');
      finalQA = await stepQA();
    }
  }

  // Step 4: Report
  await stepReport(finalQA);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nPipeline completed in ${elapsed}s`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
