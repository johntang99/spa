// 0D: generate site_seo_pages — core local landing + 19 service + 4 condition pages.
// Writes per-locale content (section outline + COMPLETE seo object) to content_entries
// at seo-pages/<slug>.json, and registers each slug+page_type in the site_seo_pages table.
// Bodies are outline-level (Phase 1I/2D complete them); seo objects are final (0D gate).
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue; let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[m[1]]) process.env[m[1]] = v;
}
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SITE = 'spa-paradise';
const cat = {
  en: JSON.parse(fs.readFileSync('content/spa-paradise/en/collections/services.json', 'utf-8')),
  zh: JSON.parse(fs.readFileSync('content/spa-paradise/zh/collections/services.json', 'utf-8')),
};
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

const pages = []; // { slug, pageType, serviceRef?, townSlug?, en:{...}, zh:{...} }

// ---- 1 core local landing ----
pages.push({
  slug: 'massage-middletown-ny', pageType: 'seo-local-landing',
  en: { h1: 'Massage in Middletown, NY', title: 'Massage in Middletown, NY | Spa Paradise',
        desc: 'Licensed massage in Middletown, NY — Swedish, deep tissue, hot stone, couples & more. Transparent pricing, open every day, English & 中文.',
        kw: ['massage middletown ny', 'massage near me middletown', 'day spa middletown ny'], cluster: 'local-massage-middletown' },
  zh: { h1: '纽约米德尔敦按摩', title: '纽约米德尔敦按摩 | 天堂水疗',
        desc: '米德尔敦的持牌按摩——瑞典式、深层组织、热石、情侣按摩等。价格透明，每天营业，提供中英文服务。',
        kw: ['米德尔敦按摩', '米德尔敦水疗'], cluster: 'local-massage-middletown' },
});

// ---- 19 service pages (one per catalog service) ----
const enServices = cat.en.services, zhById = Object.fromEntries(cat.zh.services.map((s) => [s.id, s]));
for (const s of enServices) {
  const z = zhById[s.id];
  pages.push({
    slug: `${s.slug}-middletown-ny`, pageType: 'seo-service', serviceRef: s.id,
    en: { h1: `${s.name} in Middletown, NY`, title: clip(`${s.name} in Middletown, NY | Spa Paradise`, 60),
          desc: clip(`${s.short} ${s.name} in Middletown, NY at Spa Paradise — licensed therapists, transparent pricing, online booking.`, 155),
          kw: [`${s.name.toLowerCase()} middletown ny`, `${s.name.toLowerCase()} near me`, 'spa paradise'], cluster: `service-${s.id}` },
    zh: { h1: `纽约米德尔敦${z.name}`, title: clip(`纽约米德尔敦${z.name} | 天堂水疗`, 60),
          desc: clip(`${z.short} 天堂水疗的${z.name}——持牌理疗师、价格透明、在线预约。`, 155),
          kw: [`米德尔敦${z.name}`, `${z.name}`], cluster: `service-${s.id}` },
  });
}

// ---- 4 launch condition pages ----
const conditions = [
  { slug: 'back-pain', en: 'Back Pain', zh: '背部疼痛', svc: 'deep-tissue-massage' },
  { slug: 'neck-shoulder-tension', en: 'Neck & Shoulder Tension', zh: '颈肩紧绷', svc: 'deep-tissue-massage' },
  { slug: 'prenatal-comfort', en: 'Prenatal Comfort', zh: '孕期舒缓', svc: 'prenatal-massage' },
  { slug: 'stress-relief', en: 'Stress Relief', zh: '舒缓压力', svc: 'swedish-massage' },
  { slug: 'tension-headaches', en: 'Tension Headaches', zh: '紧张性头痛', svc: 'deep-tissue-massage' },
  { slug: 'sports-recovery', en: 'Sports Recovery', zh: '运动恢复', svc: 'sports-massage' },
  { slug: 'tired-feet', en: 'Tired, Aching Feet', zh: '足部疲劳酸痛', svc: 'foot-reflexology' },
  { slug: 'desk-posture-tension', en: 'Desk & Posture Tension', zh: '久坐姿势性紧绷', svc: 'deep-tissue-massage' },
  { slug: 'better-sleep', en: 'Better Sleep & Relaxation', zh: '改善睡眠与放松', svc: 'aromatherapy-massage' },
  { slug: 'muscle-soreness', en: 'Muscle Soreness', zh: '肌肉酸痛', svc: 'hot-stone-massage' },
];
for (const c of conditions) {
  pages.push({
    slug: `massage-for-${c.slug}-middletown-ny`, pageType: 'seo-condition', serviceRef: c.svc,
    en: { h1: `Massage for ${c.en} in Middletown, NY`, title: clip(`Massage for ${c.en} in Middletown, NY`, 60),
          desc: clip(`Soothing, licensed massage in Middletown, NY for ${c.en.toLowerCase()}. Wellness-focused relief — book online, English & 中文.`, 155),
          kw: [`massage for ${c.en.toLowerCase()} middletown ny`, `${c.en.toLowerCase()} massage near me`], cluster: `condition-${c.slug}` },
    zh: { h1: `纽约米德尔敦${c.zh}按摩`, title: clip(`纽约米德尔敦${c.zh}按摩`, 60),
          desc: clip(`米德尔敦针对${c.zh}的舒缓持牌按摩。以放松与舒缓为本——在线预约，提供中英文服务。`, 155),
          kw: [`${c.zh}按摩`, `米德尔敦${c.zh}`], cluster: `condition-${c.slug}` },
  });
}

function buildContent(p, loc) {
  const d = p[loc];
  const seo = {
    title: d.title, description: d.desc, h1: d.h1,
    canonicalUrl: `/${loc}/${p.slug}`, schema: p.pageType === 'seo-condition' ? ['Service', 'FAQPage'] : ['Service', 'Offer', 'FAQPage'],
    keywords: d.kw, noindex: false, changefreq: 'monthly', priority: 0.7,
    keywordCluster: d.cluster, pageType: p.pageType,
  };
  // Outline section stack (Phase 1I/2D complete bodies).
  const sections = p.pageType === 'seo-condition'
    ? [{ hero: { variant: 'empathy', headline: d.h1, subline: '' } }, { richText: { variant: 'howHelps', body: '' } }, { protectedNotice: { variant: 'seeDoctor', body: 'If your symptoms are severe, worsening, or new, please see a doctor first. Massage is a wellness service and not a substitute for medical care.', locked: true } }]
    : [{ hero: { variant: 'service', headline: d.h1, subline: '', serviceRef: p.serviceRef } }, { richText: { variant: 'whatItIs', body: '' } }, { menuTable: { variant: 'compact', serviceRef: p.serviceRef, showAddOns: false } }];
  return { slug: p.slug, pageType: p.pageType, serviceRef: p.serviceRef || null, sections, seo, published: true };
}

async function main() {
  let rows = 0, entries = 0;
  for (const p of pages) {
    // registry row
    const { error: regErr } = await supabase.from('site_seo_pages').upsert(
      { site_id: SITE, slug: p.slug, page_type: p.pageType, active: true }, { onConflict: 'site_id,slug' });
    if (regErr) throw new Error(`registry ${p.slug}: ${regErr.message}`);
    rows++;
    // per-locale content
    for (const loc of ['en', 'zh']) {
      const data = buildContent(p, loc);
      const { error } = await supabase.from('content_entries').upsert(
        { site_id: SITE, locale: loc, path: `seo-pages/${p.slug}.json`, data, updated_by: 'seed-0D' },
        { onConflict: 'site_id,locale,path' });
      if (error) throw new Error(`${loc}/${p.slug}: ${error.message}`);
      entries++;
    }
  }
  const counts = pages.reduce((a, p) => ((a[p.pageType] = (a[p.pageType] || 0) + 1), a), {});
  console.log(`Registered ${rows} site_seo_pages rows + ${entries} content entries.`);
  console.log('By type:', JSON.stringify(counts));
}
main().catch((e) => { console.error('SEO seed error:', e.message); process.exit(1); });
