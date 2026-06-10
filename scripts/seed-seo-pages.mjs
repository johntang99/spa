#!/usr/bin/env node
/**
 * Pipeline B — Seed SEO Pages for a TCM Site (v2 architecture)
 *
 * Generates SEO page content via Claude API, then upserts into:
 *   - content_entries (page content JSON keyed by slug)
 *   - site_seo_pages (registry for [slug] route resolution)
 *
 * Usage:
 *   node scripts/seed-seo-pages.mjs <site-id> [--dry-run]
 *
 * Requires:
 *   - .env.local with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 *   - Site must already exist in sites table
 *   - Intake data stored in content_entries path = 'intake.json' (or passed inline)
 *
 * Example:
 *   node scripts/seed-seo-pages.mjs acu-flushing
 *   node scripts/seed-seo-pages.mjs acu-flushing --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── ENV ──────────────────────────────────────────────────────

const envPath = path.join(ROOT, '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\n]+)"?`));
  return match ? match[1] : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const ANTHROPIC_KEY = getEnv('ANTHROPIC_API_KEY');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const SITE_ID = args.find(a => !a.startsWith('--'));
const DRY_RUN = args.includes('--dry-run');

if (!SITE_ID) {
  console.error('Usage: node scripts/seed-seo-pages.mjs <site-id> [--dry-run]');
  process.exit(1);
}

// ── SUPABASE HELPERS ─────────────────────────────────────────

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

async function sbFetch(table, filters) {
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Fetch ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbUpsert(table, rows, onConflict) {
  const url = onConflict
    ? `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`
    : `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, { method: 'POST', headers: sbHeaders, body: JSON.stringify(rows) });
  if (!res.ok) throw new Error(`Upsert ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── LOAD INTAKE + SITE INFO ──────────────────────────────────

async function loadIntake(siteId) {
  // Try DB first
  const rows = await sbFetch('content_entries', { site_id: siteId, locale: 'en', path: 'intake.json' });
  if (rows.length > 0 && rows[0].data) return rows[0].data;

  // Fallback to filesystem
  const filePath = path.join(ROOT, 'content', siteId, 'intake.json');
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  return null;
}

async function loadSiteInfo(siteId) {
  // Pull real address, phone, hours, map from site.json and contact.json
  const siteRows = await sbFetch('content_entries', { site_id: siteId, locale: 'en', path: 'site.json' });
  const contactRows = await sbFetch('content_entries', { site_id: siteId, locale: 'en', path: 'pages/contact.json' });

  const site = siteRows[0]?.data || {};
  const contact = contactRows[0]?.data || {};

  return {
    phone: site.phone || '',
    email: site.email || '',
    address: site.address || '',
    city: site.city || '',
    state: site.state || '',
    zip: site.zip || '',
    mapEmbedUrl: contact.map?.embedUrl || site.addressMapUrl
      ? `https://www.google.com/maps?q=${encodeURIComponent((site.address || '') + ', ' + (site.city || '') + ', ' + (site.state || '') + ' ' + (site.zip || ''))}&output=embed`
      : '',
    hours: (contact.hours?.schedule || []).map(h => ({
      day: h.day,
      hours: h.time || (h.isOpen === false ? 'Closed' : '[HOURS]'),
    })),
  };
}

// ── GENERATE SEO CONTENT ─────────────────────────────────────

async function generateSEOContent(intake) {
  const promptTemplate = fs.readFileSync(
    path.join(ROOT, 'scripts/onboard/prompts/chinese-medicine/seo-pages.md'),
    'utf-8'
  );

  const vars = {
    clinicName: intake.business?.name || intake.clinicName || SITE_ID,
    practitionerName: intake.business?.ownerName || intake.practitionerName || 'the practitioner',
    city: intake.location?.city || intake.city || '',
    state: intake.location?.state || intake.state || '',
    cityState: `${intake.location?.city || intake.city}, ${intake.location?.state || intake.state}`,
    specialties: (intake.seo?.specialties || intake.specialties || ['back pain', 'insomnia', 'anxiety']).join(', '),
    languages: (intake.business?.languages || intake.languages || ['English']).join(', '),
    yearsInPractice: intake.business?.foundedYear || intake.yearsInPractice || '10+',
    credentials: intake.business?.credentials || intake.credentials || 'L.Ac.',
  };

  let prompt = promptTemplate;
  for (const [key, val] of Object.entries(vars)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }

  if (!ANTHROPIC_KEY) {
    console.error('No ANTHROPIC_API_KEY — cannot generate content. Use --dry-run to skip generation.');
    process.exit(1);
  }

  console.log(`Calling Claude API to generate SEO content for ${vars.clinicName} in ${vars.cityState}...`);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      system: 'You are an expert local SEO content writer for TCM clinics. Output only valid JSON. No markdown, no backticks, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content[0].text;

  try {
    return JSON.parse(text);
  } catch {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }
}

// ── LOCALE LABELS ────────────────────────────────────────────

const LABELS = {
  en: {
    bookFirstVisit: 'Book Your First Visit',
    bookAppointment: 'Book Your Appointment',
    bookConsultation: 'Book a Consultation',
    conditionsHeading: 'What Conditions Can Acupuncture Help With?',
    conditionsIntro: 'Acupuncture treats the root cause, not just the symptom.',
    servicesHeadingTpl: (name) => `Acupuncture & TCM Services at ${name}`,
    whyChooseHeadingTpl: (name, cityState) => `Why Patients Choose ${name} in ${cityState}`,
    faqHeadingTpl: (cityState) => `Frequently Asked Questions About Acupuncture in ${cityState}`,
    locationHeadingTpl: (name, cityState) => `Visit ${name} in ${cityState}`,
    hoursLabel: 'Hours',
    realResultsTpl: (city) => `Real Results for ${city} Patients`,
    relatedHeadingTpl: (name) => `Other Conditions We Treat at ${name}`,
    costCommonQ: 'Acupuncture Cost — Common Questions',
    conditions: {
      'Back Pain': 'Back Pain', 'Insomnia': 'Insomnia', 'Anxiety & Stress': 'Anxiety & Stress',
      'Fertility Support': 'Fertility Support', 'Neck Pain': 'Neck Pain',
      'Digestive Issues': 'Digestive Issues', 'Headaches': 'Headaches', 'Fatigue': 'Fatigue',
    },
    services: {
      acupuncture: { name: 'Acupuncture', desc: 'Precision needle therapy targeting specific points to restore balance and relieve pain.' },
      herbs: { name: 'Chinese Herbal Medicine', desc: 'Custom herbal formulas prescribed to support treatment between sessions.' },
      cupping: { name: 'Cupping Therapy', desc: 'Suction cups to improve circulation and release muscle tension.' },
      moxa: { name: 'Moxibustion', desc: 'Warming therapy using dried mugwort to stimulate healing.' },
      tuina: { name: 'Tui Na', desc: 'Chinese therapeutic massage targeting meridians and acupressure points.' },
    },
    faqQuestions: {
      cost: (cityState) => `How much does acupuncture cost in ${cityState}?`,
      painful: 'Is acupuncture painful?',
      sessions: 'How many sessions will I need?',
      insurance: (state) => `Does insurance cover acupuncture in ${state}?`,
      firstVisit: 'What should I expect at my first visit?',
      languages: 'Do you offer treatment in other languages?',
    },
    conditionFaqQuestions: {
      'back-pain': ['Can acupuncture fix back pain permanently?', 'How many sessions do I need for back pain?', 'Is acupuncture better than physiotherapy for back pain?', 'Does acupuncture for back pain hurt?'],
      'insomnia': ['How quickly does acupuncture work for insomnia?', 'Can acupuncture replace sleep medication?', 'Is acupuncture or herbal medicine better for sleep?', 'What TCM patterns cause insomnia?'],
      'anxiety': ['How many sessions does it take to help anxiety?', 'Can acupuncture help panic attacks?', 'Is acupuncture safe alongside anti-anxiety medication?', 'What does acupuncture feel like for an anxious person?'],
    },
    costFaqQuestions: [
      'How many acupuncture sessions will I need?',
      (state) => `Is acupuncture covered by health insurance in ${state}?`,
      'Can I use my HSA or FSA for acupuncture?',
      'Do you offer a first-visit discount?',
      'What is the difference between the initial visit and a follow-up?',
    ],
    seeFullCost: 'See our full cost breakdown',
    pricingHeadingTpl: (name) => `${name} Acupuncture Pricing`,
    whatAffectsCostTpl: (state) => `What Affects Acupuncture Costs in ${state}?`,
    insuranceHeadingTpl: (state) => `Does Insurance Cover Acupuncture in ${state}?`,
    worthItHeading: 'Is Acupuncture Worth the Cost?',
    conditionFaqHeading: {
      'back-pain': 'Back Pain Acupuncture — Common Questions',
      'insomnia': 'Acupuncture for Sleep — Common Questions',
      'anxiety': 'Acupuncture for Anxiety — Common Questions',
    },
    siblingLabels: { 'back-pain': 'Acupuncture for Back Pain', 'insomnia': 'Acupuncture for Insomnia', 'anxiety': 'Acupuncture for Anxiety' },
    fertilityLabel: 'Fertility Acupuncture',
  },
  zh: {
    bookFirstVisit: '预约首次就诊',
    bookAppointment: '预约就诊',
    bookConsultation: '预约咨询',
    conditionsHeading: '针灸可以帮助哪些症状？',
    conditionsIntro: '针灸治疗根本原因，而不仅仅是缓解症状。',
    servicesHeadingTpl: (name) => `${name}的中医治疗项目`,
    whyChooseHeadingTpl: (name, cityState) => `为什么选择${cityState}的${name}`,
    faqHeadingTpl: (cityState) => `关于${cityState}针灸的常见问题`,
    locationHeadingTpl: (name, cityState) => `访问${cityState}的${name}`,
    hoursLabel: '营业时间',
    realResultsTpl: (city) => `${city}患者的真实反馈`,
    relatedHeadingTpl: (name) => `${name}治疗的其他病症`,
    costCommonQ: '针灸费用 — 常见问题',
    conditions: {
      'Back Pain': '腰背疼痛', 'Insomnia': '失眠', 'Anxiety & Stress': '焦虑与压力',
      'Fertility Support': '助孕支持', 'Neck Pain': '颈部疼痛',
      'Digestive Issues': '消化问题', 'Headaches': '头痛', 'Fatigue': '疲劳',
    },
    services: {
      acupuncture: { name: '针灸', desc: '通过刺激特定穴位来恢复身体平衡、缓解疼痛。' },
      herbs: { name: '中药', desc: '根据个人体质开具的中药方剂，支持治疗效果。' },
      cupping: { name: '拔罐', desc: '促进血液循环、缓解肌肉紧张。' },
      moxa: { name: '艾灸', desc: '温热疗法，使用艾草刺激穴位促进愈合。' },
      tuina: { name: '推拿', desc: '中医治疗性按摩，针对经络和穴位。' },
    },
    faqQuestions: {
      cost: (cityState) => `在${cityState}做针灸要多少钱？`,
      painful: '针灸会痛吗？',
      sessions: '我需要做多少次治疗？',
      insurance: (state) => `${state}的保险覆盖针灸吗？`,
      firstVisit: '第一次就诊需要注意什么？',
      languages: '诊所提供中文服务吗？',
    },
    conditionFaqQuestions: {
      'back-pain': ['针灸能根治腰痛吗？', '腰痛需要做多少次针灸？', '针灸和理疗哪个更适合治疗腰痛？', '针灸治疗腰痛会痛吗？'],
      'insomnia': ['针灸治疗失眠多快见效？', '针灸能替代安眠药吗？', '针灸和中药哪个更适合治疗失眠？', '中医认为失眠的原因是什么？'],
      'anxiety': ['针灸治疗焦虑需要多少次？', '针灸能帮助恐慌发作吗？', '针灸可以和抗焦虑药同时使用吗？', '焦虑患者做针灸是什么感觉？'],
    },
    costFaqQuestions: [
      '我需要做多少次针灸治疗？',
      (state) => `${state}的健康保险覆盖针灸吗？`,
      '可以用HSA或FSA支付针灸费用吗？',
      '首次就诊有优惠吗？',
      '初诊和复诊有什么区别？',
    ],
    seeFullCost: '查看详细费用',
    pricingHeadingTpl: (name) => `${name}针灸收费标准`,
    whatAffectsCostTpl: (state) => `${state}针灸费用的影响因素`,
    insuranceHeadingTpl: (state) => `${state}的保险是否覆盖针灸？`,
    worthItHeading: '针灸值得投资吗？',
    conditionFaqHeading: {
      'back-pain': '腰痛针灸 — 常见问题',
      'insomnia': '失眠针灸 — 常见问题',
      'anxiety': '焦虑针灸 — 常见问题',
    },
    siblingLabels: { 'back-pain': '针灸治疗腰痛', 'insomnia': '针灸治疗失眠', 'anxiety': '针灸治疗焦虑' },
    fertilityLabel: '助孕针灸',
  },
};

// ── BUILD PAGE CONTENT ───────────────────────────────────────

function buildCoreLandingPage(gen, intake, siteInfo, locale = 'en') {
  const city = intake.location?.city || intake.city;
  const state = intake.location?.state || intake.state;
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateLower = state.toLowerCase();
  const clinicName = intake.business?.name || intake.clinicName;
  const phone = siteInfo?.phone || intake.location?.phone || intake.phone || '';
  const address = siteInfo?.address || intake.location?.address || intake.address || '';
  const zip = siteInfo?.zip || intake.location?.zip || intake.zip || '';
  const email = siteInfo?.email || intake.location?.email || '';
  const mapEmbedUrl = siteInfo?.mapEmbedUrl || '';
  const hours = siteInfo?.hours?.length > 0 ? siteInfo.hours : [
    { day: 'Monday–Friday', hours: '[HOURS]' },
    { day: 'Saturday', hours: '[HOURS]' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  const L = LABELS[locale] || LABELS.en;
  const cityState = `${city}, ${state}`;
  const slug = `acupuncture-${citySlug}-${stateLower}`;
  const svc = L.services;

  return {
    slug,
    pageType: 'seo-local-landing',
    content: {
      pageType: 'seo-local-landing',
      seo: {
        title: gen.title, description: gen.description,
        h1: gen.h1, canonicalUrl: `/${locale}/${slug}`,
        schema: ['LocalBusiness', 'Service', 'BreadcrumbList'],
        noindex: false, priority: 0.9,
      },
      hero: {
        h1: gen.h1,
        subheading: `${clinicName} — Traditional Chinese Medicine & Acupuncture`,
        intro: gen.heroIntro,
        ctaLabel: L.bookFirstVisit, ctaHref: `/${locale}/contact`,
        trustItems: gen.trustItems || [],
      },
      conditions: {
        heading: L.conditionsHeading,
        intro: L.conditionsIntro,
        items: [
          { name: L.conditions['Back Pain'], slug: `acupuncture-for-back-pain-${citySlug}-${stateLower}` },
          { name: L.conditions['Insomnia'], slug: `acupuncture-for-insomnia-${citySlug}-${stateLower}` },
          { name: L.conditions['Anxiety & Stress'], slug: `acupuncture-for-anxiety-${citySlug}-${stateLower}` },
          { name: L.conditions['Fertility Support'], slug: 'conditions#gynecology' },
          { name: L.conditions['Neck Pain'], slug },
          { name: L.conditions['Digestive Issues'], slug },
          { name: L.conditions['Headaches'], slug },
          { name: L.conditions['Fatigue'], slug },
        ],
      },
      services: {
        heading: L.servicesHeadingTpl(clinicName),
        items: [
          { name: svc.acupuncture.name, description: svc.acupuncture.desc },
          ...((intake.services?.modalities || []).map(mod => {
            const svcKey = { 'chinese-herbal-medicine': 'herbs', 'cupping-therapy': 'cupping', 'moxibustion': 'moxa', 'tui-na-massage': 'tuina' }[mod.slug];
            const localSvc = svcKey && svc[svcKey] ? svc[svcKey] : null;
            return {
              name: localSvc?.name || mod.name,
              description: localSvc?.desc || '',
              link: `/${locale}/${mod.slug}-${citySlug}-${stateLower}`,
            };
          })),
        ],
      },
      whyChooseUs: {
        heading: L.whyChooseHeadingTpl(clinicName, cityState),
        items: gen.whyChooseUs || [],
        testimonial: gen.testimonial || null,
      },
      faq: {
        heading: L.faqHeadingTpl(cityState),
        items: [
          { question: L.faqQuestions.cost(cityState), answer: gen.faqAnswers?.cost || '', linkText: L.seeFullCost, linkHref: `/${locale}/acupuncture-cost-${citySlug}-${stateLower}` },
          { question: L.faqQuestions.painful, answer: gen.faqAnswers?.painful || '' },
          { question: L.faqQuestions.sessions, answer: gen.faqAnswers?.sessions || '' },
          { question: L.faqQuestions.insurance(state), answer: gen.faqAnswers?.insurance || '' },
          { question: L.faqQuestions.firstVisit, answer: gen.faqAnswers?.firstVisit || '' },
          { question: L.faqQuestions.languages, answer: gen.faqAnswers?.languages || '' },
        ],
      },
      location: {
        heading: L.locationHeadingTpl(clinicName, cityState),
        intro: gen.locationIntro || '',
        mapEmbedUrl,
        nap: { name: clinicName, address, city, state, zip, phone, email },
        hours,
        hoursLabel: L.hoursLabel,
        ctaLabel: L.bookAppointment, ctaHref: `/${locale}/contact`,
      },
    },
  };
}

function buildConditionPage(gen, condition, intake, locale = 'en') {
  const L = LABELS[locale] || LABELS.en;
  const city = intake.location?.city || intake.city;
  const state = intake.location?.state || intake.state;
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateLower = state.toLowerCase();
  const clinicName = intake.business?.name || intake.clinicName;

  const condSlugMap = {
    'back-pain': `acupuncture-for-back-pain-${citySlug}-${stateLower}`,
    'insomnia': `acupuncture-for-insomnia-${citySlug}-${stateLower}`,
    'anxiety': `acupuncture-for-anxiety-${citySlug}-${stateLower}`,
  };
  const slug = condSlugMap[condition];

  const siblings = Object.entries(condSlugMap)
    .filter(([k]) => k !== condition)
    .map(([k, s]) => ({ label: L.siblingLabels[k] || k, slug: s }));
  siblings.push({ label: L.fertilityLabel, slug: 'conditions#gynecology' });

  const condFaqQuestions = L.conditionFaqQuestions[condition] || [];

  return {
    slug,
    pageType: 'seo-condition',
    content: {
      pageType: 'seo-condition',
      condition,
      seo: {
        title: gen.title, description: gen.description,
        h1: gen.h1, canonicalUrl: `/${locale}/${slug}`,
        schema: ['Service', 'FAQPage', 'BreadcrumbList'],
        noindex: false, priority: 0.8,
      },
      hero: { h1: gen.h1, openingParagraph: gen.openingParagraph, ctaLabel: L.bookConsultation, ctaHref: `/${locale}/contact` },
      howItWorks: { heading: gen.howItWorksBody ? (gen.h1 || '').replace(/in .+/, '— How It Works').replace('Acupuncture for ', 'How Acupuncture Treats ') : '', body: gen.howItWorksBody },
      whatToExpect: { heading: locale === 'zh' ? `${clinicName}的治疗流程` : `What to Expect at ${clinicName}`, body: gen.whatToExpectBody },
      testimonial: { heading: L.realResultsTpl(city), ...(gen.testimonial || {}) },
      faq: {
        heading: L.conditionFaqHeading[condition] || '',
        items: Object.values(gen.faqAnswers || {}).map((answer, i) => ({
          question: condFaqQuestions[i] || `Question ${i + 1}`,
          answer,
        })),
      },
      relatedConditions: { heading: L.relatedHeadingTpl(clinicName), links: siblings },
      cta: { label: L.bookAppointment, href: `/${locale}/contact` },
    },
  };
}

function buildCostPage(gen, intake, locale = 'en') {
  const L = LABELS[locale] || LABELS.en;
  const city = intake.location?.city || intake.city;
  const state = intake.location?.state || intake.state;
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateLower = state.toLowerCase();
  const clinicName = intake.business?.name || intake.clinicName;
  const slug = `acupuncture-cost-${citySlug}-${stateLower}`;

  return {
    slug,
    pageType: 'seo-resource',
    content: {
      pageType: 'seo-resource',
      resourceType: 'cost',
      seo: {
        title: gen.title, description: gen.description,
        h1: gen.h1, canonicalUrl: `/${locale}/${slug}`,
        schema: ['FAQPage', 'BreadcrumbList'],
        noindex: false, priority: 0.7,
      },
      directAnswer: { h1: gen.h1, body: gen.directAnswer, ctaLabel: locale === 'zh' ? '查看新患者优惠' : 'See New Patient Specials', ctaHref: `/${locale}/contact` },
      priceBreakdown: {
        heading: L.pricingHeadingTpl(clinicName),
        items: [
          { label: locale === 'zh' ? '初诊咨询+治疗（90分钟）' : 'Initial Consultation + Treatment (90 min)', price: '$[X]' },
          { label: locale === 'zh' ? '复诊治疗（60分钟）' : 'Follow-up Session (60 min)', price: '$[X]' },
          { label: locale === 'zh' ? '复诊治疗（45分钟）' : 'Follow-up Session (45 min)', price: '$[X]' },
          { label: locale === 'zh' ? '5次疗程套餐' : 'Package of 5 Sessions', price: '$[X]' },
          { label: locale === 'zh' ? '中药处方（如需）' : 'Chinese Herbal Medicine (if prescribed)', price: '$[X]/formula' },
        ],
      },
      whatAffectsCost: { heading: L.whatAffectsCostTpl(state), body: gen.whatAffectsCost },
      insurance: { heading: L.insuranceHeadingTpl(state), body: gen.insuranceBody },
      worthIt: {
        heading: L.worthItHeading,
        body: gen.worthItBody,
        testimonial: gen.testimonial || null,
      },
      faq: {
        heading: L.costCommonQ,
        items: L.costFaqQuestions.map((q, i) => ({
          question: typeof q === 'function' ? q(state) : q,
          answer: Object.values(gen.faqAnswers || {})[i] || '',
        })),
      },
      cta: { label: L.bookFirstVisit, href: `/${locale}/contact` },
    },
  };
}

// ── SERVICE PAGE GENERATION ──────────────────────────────────

async function generateServicePageContent(serviceName, intake, locale = 'en') {
  if (!ANTHROPIC_KEY) return null;

  const clinicName = intake.business?.name || intake.clinicName;
  const city = intake.location?.city || intake.city;
  const state = intake.location?.state || intake.state;
  const practitioner = intake.business?.ownerName || 'the practitioner';

  let prompt;
  if (locale === 'zh') {
    prompt = `Generate SEO content for a ${serviceName} service page at a Traditional Chinese Medicine clinic in ${city}, ${state}. The clinic is ${clinicName}, practitioner is ${practitioner}. Write entirely in Chinese (Simplified). Keep clinic name, city, and practitioner name in original form. Output ONLY valid JSON:

{
  "title": "[max 60 chars Chinese] ${serviceName}相关标题",
  "description": "[max 155 chars Chinese]",
  "h1": "[Chinese H1 including ${city}, ${state}]",
  "heroDescription": "[80-120 words Chinese]",
  "whatIsItBody": "[150-200 words Chinese explaining this modality]",
  "whatItTreatsConditions": ["[condition 1 Chinese]","[condition 2]","[condition 3]","[condition 4]","[condition 5]","[condition 6]"],
  "howItWorksBody": "[120-160 words Chinese explaining treatment process]",
  "faqItems": [
    { "question": "[Chinese question about how this differs from acupuncture]", "answer": "[60-80 words Chinese]" },
    { "question": "[Chinese question about pain/feeling]", "answer": "[60-80 words Chinese]" },
    { "question": "[Chinese question about session count]", "answer": "[60-80 words Chinese]" },
    { "question": "[Chinese question about combining with other TCM]", "answer": "[60-80 words Chinese]" }
  ]
}`;
  } else {
    const promptTemplate = fs.readFileSync(
      path.join(ROOT, 'scripts/onboard/prompts/chinese-medicine/seo-service-page.md'), 'utf-8'
    );
    prompt = promptTemplate
      .replace(/\{\{clinicName\}\}/g, clinicName)
      .replace(/\{\{practitionerName\}\}/g, practitioner)
      .replace(/\{\{city\}\}/g, city)
      .replace(/\{\{state\}\}/g, state)
      .replace(/\{\{cityState\}\}/g, `${city}, ${state}`)
      .replace(/\{\{serviceName\}\}/g, serviceName);
  }

  const messages = locale === 'zh'
    ? [{ role: 'user', content: prompt }, { role: 'assistant', content: '{' }]
    : [{ role: 'user', content: prompt }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: locale === 'zh'
        ? 'You are a native Chinese speaker and TCM content expert. Output only valid JSON. No markdown, no backticks.'
        : 'You are an expert local SEO content writer for TCM clinics. Output only valid JSON. No markdown, no backticks, no explanation.',
      messages,
    }),
  });

  if (!res.ok) { console.error(`Service page API error (${locale}): ${res.status}`); return null; }
  const data = await res.json();
  const rawText = locale === 'zh' ? '{' + data.content[0].text : data.content[0].text;
  const text = rawText.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`  Service page JSON parse error (${locale}): ${e.message}`);
    return null;
  }
}

function buildServicePage(gen, serviceSlug, serviceName, intake, locale = 'en') {
  const L = LABELS[locale] || LABELS.en;
  const city = intake.location?.city || intake.city;
  const state = intake.location?.state || intake.state;
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateLower = state.toLowerCase();
  const clinicName = intake.business?.name || intake.clinicName;
  const slug = `${serviceSlug}-${citySlug}-${stateLower}`;
  const coreLandingSlug = `acupuncture-${citySlug}-${stateLower}`;

  const conditionItems = (gen.whatItTreatsConditions || []).map(name => ({ name }));

  return {
    slug,
    pageType: 'seo-service',
    content: {
      pageType: 'seo-service',
      service: serviceSlug,
      seo: {
        title: gen.title,
        description: gen.description,
        h1: gen.h1,
        canonicalUrl: `/${locale}/${slug}`,
        schema: ['Service', 'FAQPage', 'BreadcrumbList'],
        noindex: false,
        priority: 0.8,
      },
      hero: {
        h1: gen.h1,
        description: gen.heroDescription,
        ctaLabel: locale === 'zh' ? `预约${serviceName}咨询` : `Book a ${serviceName} Consultation`,
        ctaHref: `/${locale}/contact`,
      },
      whatIsIt: {
        heading: locale === 'zh' ? `什么是${serviceName}？` : `What Is ${serviceName}?`,
        body: gen.whatIsItBody,
      },
      whatItTreats: {
        heading: locale === 'zh' ? `${serviceName}可以治疗哪些病症` : `Conditions Treated with ${serviceName}`,
        conditions: conditionItems,
      },
      howItWorks: {
        heading: locale === 'zh'
          ? `在${clinicName}体验${serviceName}`
          : `What to Expect During ${serviceName} at ${clinicName}`,
        body: gen.howItWorksBody,
      },
      faq: {
        heading: locale === 'zh' ? `${serviceName} — 常见问题` : `${serviceName} — Common Questions`,
        items: (gen.faqItems || []).map(item => ({
          question: item.question,
          answer: item.answer,
        })),
      },
      cta: {
        label: L.bookAppointment,
        href: `/${locale}/contact`,
        backLink: {
          text: locale === 'zh'
            ? `了解更多${city}针灸服务`
            : `Learn more about acupuncture in ${city}, ${state}`,
          href: `/${locale}/${coreLandingSlug}`,
        },
      },
    },
  };
}

// ── ZH LOCALE GENERATION ─────────────────────────────────────

async function generateZHContent(intake) {
  if (!ANTHROPIC_KEY) return null;

  const clinicName = intake.business?.name || intake.clinicName;
  const city = intake.location?.city || intake.city;
  const state = intake.location?.state || intake.state;
  const practitioner = intake.business?.ownerName || 'the practitioner';

  const prompt = `Translate and localize the following SEO page content for a Traditional Chinese Medicine clinic into Chinese (Simplified). The clinic serves Chinese-speaking patients in ${city}, ${state}.

Clinic: ${clinicName}
Practitioner: ${practitioner}
City: ${city}, ${state}

Generate a JSON object with the same structure as the English SEO pages but fully in Chinese. Keep brand names (clinic name, practitioner name, city) in their original form or provide both English and Chinese where natural.

Output ONLY valid JSON with these keys:
{
  "coreLanding": { "title": "max 60 chars Chinese", "description": "max 155 chars", "h1": "...", "heroIntro": "2 sentences", "faqAnswers": { "cost": "...", "painful": "...", "sessions": "...", "insurance": "...", "firstVisit": "...", "languages": "..." }, "locationIntro": "..." },
  "conditionBackPain": { "title": "...", "description": "...", "h1": "...", "openingParagraph": "100-130 words", "howItWorksBody": "120-150 words", "whatToExpectBody": "80-100 words", "faqAnswers": { "permanent": "...", "sessions": "...", "vsPhysio": "...", "hurt": "..." } },
  "conditionInsomnia": { "title": "...", "description": "...", "h1": "...", "openingParagraph": "...", "howItWorksBody": "...", "whatToExpectBody": "...", "faqAnswers": { "howQuickly": "...", "replaceMedication": "...", "vsHerbal": "...", "tcmPatterns": "..." } },
  "conditionAnxiety": { "title": "...", "description": "...", "h1": "...", "openingParagraph": "...", "howItWorksBody": "...", "whatToExpectBody": "...", "faqAnswers": { "howMany": "...", "panicAttacks": "...", "withMedication": "...", "whatItFeels": "..." } },
  "resourceCost": { "title": "...", "description": "...", "h1": "...", "directAnswer": "...", "whatAffectsCost": "...", "insuranceBody": "...", "worthItBody": "...", "faqAnswers": { "howMany": "...", "insurance": "...", "hsaFsa": "...", "firstVisitDiscount": "...", "initialVsFollowup": "..." } }
}

Rules:
- Titles ≤ 60 characters, descriptions ≤ 155 characters
- Write naturally for Chinese-speaking patients in the US
- Keep medical terms accurate in Chinese
- City and clinic names can stay in English where natural`;

  console.log('Generating ZH (Chinese) SEO content...');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      system: 'You are a native Chinese speaker and TCM content expert. Output only valid JSON. No markdown, no backticks.',
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '{' },
      ],
    }),
  });

  if (!res.ok) { console.error(`ZH generation failed: ${res.status}`); return null; }
  const data = await res.json();
  const rawText = '{' + data.content[0].text;
  const text = rawText.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`ZH JSON parse error: ${e.message}`);
    console.error('Raw text (first 300 chars):', text.substring(0, 300));
    return null;
  }
}

// ── MAIN ─────────────────────────────────────────────────────

async function main() {
  console.log(`\n═══ SEO Page Seeder (v2) ═══`);
  console.log(`Site: ${SITE_ID}${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Load intake + site info
  const intake = await loadIntake(SITE_ID);
  if (!intake) {
    console.error(`No intake data found for ${SITE_ID}. Create content_entries path='intake.json' or content/${SITE_ID}/intake.json`);
    process.exit(1);
  }
  console.log(`Intake loaded: ${intake.business?.name || intake.clinicName} in ${intake.location?.city || intake.city}`);

  const siteInfo = await loadSiteInfo(SITE_ID);
  if (siteInfo.phone) {
    console.log(`Site info loaded: ${siteInfo.address}, ${siteInfo.city}, ${siteInfo.state} ${siteInfo.zip} | ${siteInfo.phone}`);
    console.log(`  Hours: ${siteInfo.hours.length} entries | Map: ${siteInfo.mapEmbedUrl ? 'yes' : 'no'}`);
  } else {
    console.log('Site info: not found (will use intake data)');
  }

  // Generate EN content
  const generated = await generateSEOContent(intake);
  console.log(`EN content generated for ${Object.keys(generated).length} page types`);

  // Generate ZH content (with retry)
  let zhGenerated = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    zhGenerated = await generateZHContent(intake);
    if (zhGenerated) {
      console.log(`ZH content generated for ${Object.keys(zhGenerated).length} page types`);
      break;
    }
    if (attempt < 3) console.log(`ZH attempt ${attempt} failed, retrying...`);
    else console.log('ZH generation failed after 3 attempts — EN pages only.');
  }

  // Build EN pages
  const pages = [
    buildCoreLandingPage(generated.coreLanding, intake, siteInfo),
    buildConditionPage(generated.conditionBackPain, 'back-pain', intake),
    buildConditionPage(generated.conditionInsomnia, 'insomnia', intake),
    buildConditionPage(generated.conditionAnxiety, 'anxiety', intake),
    buildCostPage(generated.resourceCost, intake),
  ];

  // Build ZH pages (same slugs, different locale + content)
  const zhPages = zhGenerated ? [
    buildCoreLandingPage(zhGenerated.coreLanding, intake, siteInfo, 'zh'),
    buildConditionPage(zhGenerated.conditionBackPain, 'back-pain', intake, 'zh'),
    buildConditionPage(zhGenerated.conditionInsomnia, 'insomnia', intake, 'zh'),
    buildConditionPage(zhGenerated.conditionAnxiety, 'anxiety', intake, 'zh'),
    buildCostPage(zhGenerated.resourceCost, intake, 'zh'),
  ] : [];

  // ── Service Pages (dynamic per modality) ──
  const modalities = intake.services?.modalities || [];
  const servicePages = [];
  const zhServicePages = [];

  if (modalities.length > 0) {
    console.log(`\nGenerating service pages for ${modalities.length} modalities...`);
    for (const mod of modalities) {
      // EN
      console.log(`  EN: ${mod.name}...`);
      const enGen = await generateServicePageContent(mod.name, intake, 'en');
      if (enGen) {
        servicePages.push(buildServicePage(enGen, mod.slug, mod.name, intake, 'en'));
      } else {
        console.log(`  ⚠ EN generation failed for ${mod.name}`);
      }

      // ZH
      console.log(`  ZH: ${mod.name}...`);
      let zhGen = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        zhGen = await generateServicePageContent(mod.name, intake, 'zh');
        if (zhGen) break;
        if (attempt < 2) console.log(`    ZH retry for ${mod.name}...`);
      }
      if (zhGen) {
        zhServicePages.push(buildServicePage(zhGen, mod.slug, mod.name, intake, 'zh'));
      } else {
        console.log(`  ⚠ ZH generation failed for ${mod.name}`);
      }
    }
    console.log(`Service pages generated: ${servicePages.length} EN, ${zhServicePages.length} ZH`);
  }

  // Combine all pages
  const allEnPages = [...pages, ...servicePages];
  const allZhPages = [...zhPages, ...zhServicePages];

  // Upsert EN
  console.log('\n── EN Pages ──');
  for (const page of allEnPages) {
    console.log(`${DRY_RUN ? '[DRY] ' : ''}Seeding: ${page.slug} (${page.pageType})`);

    if (!DRY_RUN) {
      await sbUpsert('content_entries', [{
        site_id: SITE_ID, locale: 'en', path: page.slug,
        data: page.content, updated_at: new Date().toISOString(),
      }], 'site_id,locale,path');

      await sbUpsert('site_seo_pages', [{
        site_id: SITE_ID, slug: page.slug,
        page_type: page.pageType, active: true,
      }], 'site_id,slug');
    }
  }

  // Upsert ZH
  if (allZhPages.length > 0) {
    console.log('\n── ZH Pages ──');
    for (const page of allZhPages) {
      console.log(`${DRY_RUN ? '[DRY] ' : ''}Seeding ZH: ${page.slug} (${page.pageType})`);

      if (!DRY_RUN) {
        await sbUpsert('content_entries', [{
          site_id: SITE_ID, locale: 'zh', path: page.slug,
          data: page.content, updated_at: new Date().toISOString(),
        }], 'site_id,locale,path');
      }
    }
  }

  // Verify
  if (!DRY_RUN) {
    const seoPages = await sbFetch('site_seo_pages', { site_id: SITE_ID });
    const activePages = seoPages.filter(p => p.active);
    console.log(`\n✓ ${activePages.length} SEO slugs registered for ${SITE_ID}`);
    activePages.forEach(p => console.log(`  ${p.slug} (${p.page_type})`));

    console.log(`\n── SEO Audit (EN) ──`);
    for (const page of allEnPages) {
      const seo = page.content.seo;
      const tLen = seo.title.length;
      const dLen = seo.description.length;
      const pass = tLen <= 60 && dLen <= 155;
      console.log(`  ${page.slug}: title=${tLen} desc=${dLen} ${pass ? '✓' : '⚠ FIX NEEDED'}`);
    }

    if (allZhPages.length > 0) {
      console.log(`\n── SEO Audit (ZH) ──`);
      for (const page of allZhPages) {
        const seo = page.content.seo;
        const tLen = seo.title.length;
        const dLen = seo.description.length;
        const pass = tLen <= 60 && dLen <= 155;
        console.log(`  ${page.slug}: title=${tLen} desc=${dLen} ${pass ? '✓' : '⚠ FIX NEEDED'}`);
      }
    }
  }

  console.log(`\n═══ Done ═══\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
