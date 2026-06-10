// Phase 3E — minimum automation check suite. Validates the seeded content + SEO pages
// against the System S contract rules. Run: npm run check:all (tsx). Exits non-zero on
// any failure so CI can gate. Reads from Supabase content_entries + site_seo_pages.
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { passesClaimsCheck } from '../../lib/contracts/claims-validator';

// --- env ---
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[m[1]]) process.env[m[1]] = v;
}
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const SITE = 'spa-paradise';

type Row = { locale: string; path: string; data: any };
const fail: string[] = [];
const warn: string[] = [];
const summary: Array<[string, string]> = [];

function record(name: string, errs: string[], warns: string[] = []) {
  fail.push(...errs.map((e) => `[${name}] ${e}`));
  warn.push(...warns.map((e) => `[${name}] ${e}`));
  summary.push([name, errs.length ? `FAIL (${errs.length})` : warns.length ? `warn (${warns.length})` : 'PASS']);
}

// flatten all string values
function strings(data: any, acc: string[] = []): string[] {
  if (typeof data === 'string') acc.push(data);
  else if (Array.isArray(data)) data.forEach((v) => strings(v, acc));
  else if (data && typeof data === 'object') Object.values(data).forEach((v) => strings(v, acc));
  return acc;
}
function trigramSim(a: string, b: string): number {
  const grams = (s: string) => { const g = new Set<string>(); const t = s.toLowerCase().replace(/\s+/g, ' '); for (let i = 0; i < t.length - 2; i++) g.add(t.slice(i, i + 3)); return g; };
  const ga = grams(a), gb = grams(b); if (!ga.size || !gb.size) return 0;
  let inter = 0; ga.forEach((g) => { if (gb.has(g)) inter++; });
  return inter / Math.min(ga.size, gb.size);
}

async function main() {
  const { data: entries } = await supabase.from('content_entries').select('locale,path,data').eq('site_id', SITE);
  const rows = (entries || []) as Row[];
  const { data: seoReg } = await supabase.from('site_seo_pages').select('slug,page_type,active').eq('site_id', SITE);

  // page JSONs with a seo object (under pages/, excludes settings like intake.json)
  const seoBearing = rows.filter((r) => r.path.startsWith('pages/') && !r.path.includes('.layout') && r.data?.seo);
  const seoPages = rows.filter((r) => r.path.startsWith('seo-pages/'));

  // 1. check:seo — completeness + length + cluster
  {
    const errs: string[] = [];
    for (const r of [...seoBearing, ...seoPages]) {
      const seo = r.data.seo;
      if (!seo) continue;
      if (!seo.title) errs.push(`${r.locale}/${r.path}: missing seo.title`);
      else if (seo.title.length > 60) errs.push(`${r.locale}/${r.path}: title ${seo.title.length}>60`);
      if (!seo.description) errs.push(`${r.locale}/${r.path}: missing seo.description`);
      else if (seo.description.length > 155) errs.push(`${r.locale}/${r.path}: description ${seo.description.length}>155`);
      if (!seo.h1) errs.push(`${r.locale}/${r.path}: missing seo.h1`);
      if (!seo.keywordCluster) errs.push(`${r.locale}/${r.path}: missing keywordCluster`);
    }
    record('check:seo', errs);
  }

  // 2. check:seo-unique — title uniqueness within a locale
  {
    const errs: string[] = [];
    for (const loc of ['en', 'zh']) {
      const titles = new Map<string, number>();
      for (const r of [...seoBearing, ...seoPages].filter((r) => r.locale === loc)) {
        const t = r.data.seo?.title; if (!t) continue;
        titles.set(t, (titles.get(t) || 0) + 1);
      }
      for (const [t, n] of titles) if (n > 1) errs.push(`${loc}: duplicate title "${t.slice(0, 40)}…" (${n}×)`);
    }
    record('check:seo-unique', errs);
  }

  // 3. check:cluster — keywordCluster uniqueness (anti-cannibalization), per locale, among seo-pages
  {
    const errs: string[] = [];
    for (const loc of ['en', 'zh']) {
      const cl = new Map<string, number>();
      for (const r of seoPages.filter((r) => r.locale === loc)) {
        const c = r.data.seo?.keywordCluster; if (!c) continue;
        cl.set(c, (cl.get(c) || 0) + 1);
      }
      for (const [c, n] of cl) if (n > 1) errs.push(`${loc}: cluster "${c}" used ${n}×`);
    }
    record('check:cluster', errs);
  }

  // 4. check:locale-parity — every en path has a zh twin and vice versa
  {
    const en = new Set(rows.filter((r) => r.locale === 'en').map((r) => r.path));
    const zh = new Set(rows.filter((r) => r.locale === 'zh').map((r) => r.path));
    const errs: string[] = [];
    for (const p of en) if (!zh.has(p)) errs.push(`missing zh twin: ${p}`);
    for (const p of zh) if (!en.has(p)) errs.push(`missing en twin: ${p}`);
    record('check:locale-parity', errs);
  }

  // 5. check:claims — wellness medical-claim hard-block across all content
  {
    const errs: string[] = [];
    for (const r of rows) {
      const { ok, matches } = passesClaimsCheck(r.data);
      if (!ok) for (const m of matches) errs.push(`${r.locale}/${r.path} @ ${m.path}: "${m.term}" (${m.reason})`);
    }
    record('check:claims', errs);
  }

  // 6. check:nap — NAP consistent across site/header/footer (per locale)
  {
    const errs: string[] = [];
    for (const loc of ['en', 'zh']) {
      const site = rows.find((r) => r.locale === loc && r.path === 'site.json')?.data;
      const footer = rows.find((r) => r.locale === loc && r.path === 'footer.json')?.data;
      const phone = site?.phone;
      if (phone && footer?.contact?.phone && footer.contact.phone !== phone) errs.push(`${loc}: footer phone "${footer.contact.phone}" != site "${phone}"`);
      if (site?.address && footer?.contact?.addressLines && !footer.contact.addressLines.join(' ').includes('12 Grove St')) errs.push(`${loc}: footer address missing NAP street`);
    }
    record('check:nap', errs);
  }

  // 7. check:prices — no literal $ prices in page/seo content JSON (prices live in catalog)
  {
    const errs: string[] = [];
    const priceRe = /\$\s?\d{2,4}\b/;
    for (const r of [...seoBearing, ...seoPages]) {
      for (const s of strings(r.data)) {
        if (priceRe.test(s) && !/\(845\)/.test(s)) { errs.push(`${r.locale}/${r.path}: literal price in content "${s.slice(0, 40)}…"`); break; }
      }
    }
    record('check:prices', errs, []);
  }

  // 8. check:uniqueness — near-location driveContext < 60% similarity
  {
    const towns = seoPages.filter((r) => r.locale === 'en' && r.data.pageType === 'seo-near-location');
    const bodies = towns.map((r) => ({ slug: r.path, text: (r.data.sections || []).map((s: any) => s.richText?.body).filter(Boolean).join(' ') }));
    const errs: string[] = [];
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const sim = trigramSim(bodies[i].text, bodies[j].text);
      if (sim > 0.6) errs.push(`${bodies[i].slug} ~ ${bodies[j].slug}: ${(sim * 100).toFixed(0)}% similar`);
    }
    record('check:uniqueness', errs);
  }

  // 9. check:sitemap-registry — every active site_seo_pages slug has content both locales
  {
    const errs: string[] = [];
    const byPath = new Set(seoPages.map((r) => `${r.locale}:${r.path}`));
    for (const reg of (seoReg || []) as any[]) {
      if (!reg.active) continue;
      for (const loc of ['en', 'zh']) if (!byPath.has(`${loc}:seo-pages/${reg.slug}.json`)) errs.push(`${reg.slug}: missing ${loc} content`);
    }
    record('check:registry', errs);
  }

  // --- report ---
  console.log('\n=== check:all — System S content integrity ===');
  for (const [name, status] of summary) console.log(`  ${status.startsWith('FAIL') ? '✗' : status.startsWith('warn') ? '!' : '✓'} ${name.padEnd(22)} ${status}`);
  if (warn.length) { console.log('\nWarnings:'); warn.slice(0, 20).forEach((w) => console.log('  ! ' + w)); }
  if (fail.length) {
    console.log(`\n${fail.length} failure(s):`);
    fail.slice(0, 40).forEach((f) => console.log('  ✗ ' + f));
    process.exit(1);
  }
  console.log('\nALL CHECKS PASSED ✓\n');
}

main().catch((e) => { console.error('check:all error:', e.message); process.exit(2); });
