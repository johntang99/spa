#!/usr/bin/env node
/**
 * End-to-end authenticated onboarding test for a realistic sample business.
 *
 * Creates a new site with complete intake data, runs the full onboarding SSE
 * pipeline (including AI + O5B rewrite), then verifies DB + route output.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();

function loadEnvFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) return;
  const raw = fs.readFileSync(abs, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function must(value, name) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compactProgress(progressByStep) {
  return Object.entries(progressByStep)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([step, payload]) => ({
      step,
      status: payload.status,
      message: payload.message,
      duration: payload.duration ?? null,
    }));
}

async function main() {
  loadEnvFile(path.join(ROOT, '.env.local'));

  const supabaseUrl = must(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL'
  );
  const serviceKey = must(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  const baseUrl = process.env.ONBOARD_BASE_URL || 'http://localhost:3080';
  const templateSiteId = process.env.ONBOARD_TEMPLATE_SITE_ID || 'spa-paradise';

  const stamp = Date.now().toString().slice(-8);
  const siteId = `golden-practice-brooklyn-${stamp}`;
  const productionDomain = `${siteId}.example.com`;
  const devDomain = `${siteId}.local`;
  const businessName = 'Golden Practice';

  const intake = {
    clientId: siteId,
    templateSiteId,
    skipAi: false,
    rewriteMode: 'aggressive',
    rewriteStrictness: 'strict-medical',
    rewriteAutoApply: true,
    rewriteProvider: process.env.OPENAI_API_KEY ? 'openai' : 'claude',
    industry: 'chinese-medicine',
    locales: { default: 'en', supported: ['en', 'zh'] },
    domains: {
      production: productionDomain,
      dev: devDomain,
    },
    business: {
      name: businessName,
      ownerName: 'Dr. Mei Lin',
      ownerNameWithCredentials: 'Dr. Mei Lin, L.Ac., MSTCM',
      ownerTitle: 'Founder and Lead Therapist',
      ownerLanguages: ['English', 'Chinese'],
      foundedYear: 2015,
      yearsExperience: '12+',
      description:
        'Golden Practice offers therapeutic massage and wellness-focused bodywork with transparent pricing and bilingual service in Brooklyn.',
      tagline: 'Calm care for modern city life.',
      ownerCredentials: [
        { credential: 'MSTCM', institution: 'Pacific College', year: '2013', location: 'New York' },
        { credential: 'L.Ac.', institution: 'NYS Board', year: '2014', location: 'New York' },
      ],
      ownerCertifications: ['NCCAOM', 'NY State Licensed Acupuncturist'],
      ownerSpecializations: ['Stress Recovery', 'Chronic Pain Support', 'Sleep and Fatigue Care'],
      teamMembers: [
        {
          name: 'Jenna Huang',
          title: 'Senior Therapist',
          role: 'Massage Therapist',
          languages: ['English', 'Chinese'],
          specializations: ['Deep Tissue', 'Prenatal Massage'],
        },
      ],
    },
    location: {
      address: '245 Atlantic Ave Suite 3B',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11201',
      phone: '(718) 555-2901',
      email: 'hello@goldenpractice.example.com',
      phoneEmergency: '(718) 555-2911',
      emailAppointments: 'appointments@goldenpractice.example.com',
      addressMapUrl: 'https://maps.google.com/?q=245+Atlantic+Ave+Brooklyn+NY+11201',
    },
    media: {
      logoImageUrl:
        'https://images.unsplash.com/photo-1620194545737-6df87c1f46ef?auto=format&fit=crop&w=400&q=80',
      homeHeroImageUrl:
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80',
      aboutBioImageUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    },
    hours: {
      monday: '10:00 AM - 8:00 PM',
      tuesday: '10:00 AM - 8:00 PM',
      wednesday: '10:00 AM - 8:00 PM',
      thursday: '10:00 AM - 8:00 PM',
      friday: '10:00 AM - 8:00 PM',
      saturday: '9:00 AM - 7:00 PM',
      sunday: '10:00 AM - 6:00 PM',
    },
    services: {
      enabled: [
        'acupuncture',
        'chinese-herbal-medicine',
        'cupping-therapy',
        'moxibustion',
        'tuina-massage',
        'gua-sha',
      ],
    },
    brand: {
      variant: 'teal-gold',
      primaryColor: '#8A5A2B',
      secondaryColor: '#CFA96A',
      fonts: { display: 'Playfair Display', body: 'Inter' },
    },
    contentTone: {
      voice: 'warm-professional',
      targetDemographic: 'Working adults, parents, and wellness-focused professionals in Brooklyn',
      uniqueSellingPoints: [
        'Evening and weekend availability',
        'Bilingual English/Chinese communication',
        'Personalized care plans with clear next-step guidance',
      ],
    },
    social: {
      facebook: 'https://facebook.com/goldenpracticebrooklyn',
      instagram: 'https://instagram.com/goldenpracticebk',
      google: 'https://g.page/r/golden-practice-brooklyn',
      youtube: 'https://youtube.com/@goldenpracticebrooklyn',
      wechat: 'GoldenPracticeBK',
    },
    insurance: {
      acceptsInsurance: true,
      inNetworkNote: 'Selected plans accepted for therapeutic acupuncture services.',
      financingNote: 'Package plans and monthly wellness memberships available.',
      membershipEnabled: true,
      membershipName: 'Golden Balance Membership',
    },
    booking: { onlineBookingEnabled: true, bookingUrl: '/book' },
    stats: [
      { icon: 'calendar', number: '12+', label: 'Years Experience' },
      { icon: 'users', number: '8,500+', label: 'Sessions Completed' },
      { icon: 'star', number: '4.9', label: 'Guest Rating' },
      { icon: 'award', number: '7', label: 'Signature Treatments' },
    ],
  };

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const loginCandidates = [
    {
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
    },
    { email: 'admin@spaparadise.local', password: 'SpaParadise!2026' },
    { email: 'admin@spa.com', password: 'admin123' },
    { email: 'admin@example.com', password: 'admin123' },
  ].filter((row) => row.email && row.password);

  let authCookie = '';
  let loginMatchedEmail = '';
  for (const creds of loginCandidates) {
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: creds.email,
        password: creds.password,
      }),
    });
    if (!loginRes.ok) continue;
    const setCookie = loginRes.headers.get('set-cookie') || '';
    const match = setCookie.match(/admin-token=([^;]+)/);
    if (!match) continue;
    authCookie = `admin-token=${match[1]}`;
    loginMatchedEmail = String(creds.email);
    break;
  }
  assert(authCookie, 'Unable to log in with any known admin credential');

  const response = await fetch(`${baseUrl}/api/admin/onboarding`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      cookie: authCookie,
    },
    body: JSON.stringify(intake),
  });

  if (!response.ok || !response.body) {
    const body = await response.text();
    throw new Error(`Onboarding start failed (${response.status}): ${body}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';
  let completeEvent = null;
  let errorEvent = null;
  const progressByStep = {};

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).replace(/\r$/, '');
      buffer = buffer.slice(idx + 1);

      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const payload = JSON.parse(line.slice(6));
        if (currentEvent === 'progress' && payload?.step) {
          progressByStep[payload.step] = payload;
        } else if (currentEvent === 'complete') {
          completeEvent = payload;
        } else if (currentEvent === 'error') {
          errorEvent = payload;
        }
      } else if (!line) {
        currentEvent = '';
      }
    }
  }

  if (errorEvent) {
    throw new Error(`Onboarding pipeline error: ${JSON.stringify(errorEvent)}`);
  }
  if (!completeEvent) {
    throw new Error('Onboarding stream ended without a complete event');
  }
  assert(
    Array.isArray(completeEvent.errors) && completeEvent.errors.length === 0,
    `Onboarding completed with verification errors: ${JSON.stringify(completeEvent.errors || [])}`
  );
  const warnings = Array.isArray(completeEvent.warnings) ? completeEvent.warnings : [];
  const blockingWarnings = warnings.filter((warning) => !String(warning).startsWith('O5B rewrite'));
  assert(
    blockingWarnings.length === 0,
    `Onboarding completed with blocking warnings: ${JSON.stringify(blockingWarnings)}`
  );

  for (const step of ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7']) {
    assert(progressByStep[step]?.status === 'done', `${step} did not finish as done`);
  }

  let siteRows = null;
  let domainRows = null;
  let entries = null;
  let siteError = null;
  let domainError = null;
  let entriesError = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [siteRes, domainRes, entriesRes] = await Promise.all([
      supabase.from('sites').select('id,name,default_locale,supported_locales').eq('id', siteId).limit(1),
      supabase.from('site_domains').select('domain,environment,enabled').eq('site_id', siteId),
      supabase.from('content_entries').select('locale,path,data').eq('site_id', siteId),
    ]);

    siteRows = siteRes.data;
    siteError = siteRes.error;
    domainRows = domainRes.data;
    domainError = domainRes.error;
    entries = entriesRes.data;
    entriesError = entriesRes.error;

    if ((siteRows?.length || 0) > 0 && (entries?.length || 0) > 0) break;
    await sleep(1200);
  }

  if (siteError) throw new Error(siteError.message);
  if (domainError) throw new Error(domainError.message);
  if (entriesError) throw new Error(entriesError.message);

  assert(
    siteRows && siteRows.length === 1,
    `Expected exactly one site row (siteId=${siteId}) but got: ${JSON.stringify(siteRows)}`
  );
  assert(siteRows[0].name === businessName, 'Site name mismatch');
  assert(Array.isArray(domainRows) && domainRows.length >= 2, 'Expected at least 2 domain aliases');
  assert(Array.isArray(entries) && entries.length > 0, 'No content entries created');

  const index = new Map(entries.map((row) => [`${row.locale}:${row.path}`, row.data]));
  const requiredPaths = [
    'site.json',
    'header.json',
    'footer.json',
    'navigation.json',
    'seo.json',
    'pages/home.json',
    'pages/services.json',
    'pages/about.json',
    'pages/contact.json',
  ];

  for (const locale of ['en', 'zh']) {
    for (const pathKey of requiredPaths) {
      assert(index.has(`${locale}:${pathKey}`), `Missing required content: ${locale}/${pathKey}`);
    }
  }

  const enSite = index.get('en:site.json');
  const zhSite = index.get('zh:site.json');
  const enHome = index.get('en:pages/home.json');
  const zhHome = index.get('zh:pages/home.json');
  const enServices = index.get('en:pages/services.json');

  assert(String(enSite?.clinicName || '').trim() === businessName, 'EN clinicName not updated');
  assert(String(zhSite?.clinicName || '').trim() === businessName, 'ZH clinicName not updated');
  assert(String(enSite?.city || '').trim() === 'Brooklyn', 'EN city not updated');
  assert(String(zhSite?.city || '').trim() === 'Brooklyn', 'ZH city not updated');
  assert(String(enSite?.phone || '').trim().length > 0, 'EN site phone is empty');
  assert(String(zhSite?.phone || '').trim().length > 0, 'ZH site phone is empty');
  assert(String(enSite?.email || '').trim().length > 0, 'EN site email is empty');
  assert(String(zhSite?.email || '').trim().length > 0, 'ZH site email is empty');

  assert(String(enHome?.hero?.headline || '').trim().length > 0, 'EN home hero headline is empty');
  assert(String(zhHome?.hero?.headline || '').trim().length > 0, 'ZH home hero headline is empty');
  const servicesListCount = Array.isArray(enServices?.servicesList?.items)
    ? enServices.servicesList.items.length
    : null;
  const hasSpaServicesStructure =
    enServices && typeof enServices === 'object' && !!enServices.hero && !!enServices.categoryGrid;
  assert(
    servicesListCount !== null || hasSpaServicesStructure,
    'EN services payload missing expected structures'
  );
  if (servicesListCount !== null) {
    assert(servicesListCount === intake.services.enabled.length, 'EN services count mismatch after prune');
  }

  const hostHtml = execSync(
    `curl -s -H "Host: ${productionDomain}" ${baseUrl}/en`,
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
  assert(
    hostHtml.includes('Golden Practice'),
    'Host-routed page did not render the onboarded business name'
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        siteId,
        templateSiteId,
        baseUrl,
        businessName,
        loginEmailUsed: loginMatchedEmail,
        onboardingResult: completeEvent,
        progress: compactProgress(progressByStep),
        verification: {
          domainCount: domainRows.length,
          entryCount: entries.length,
          requiredLocales: ['en', 'zh'],
          requiredPathsChecked: requiredPaths.length,
          hostPreview: `http://${productionDomain}:3080/en`,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`\nGolden Practice onboarding E2E test failed: ${error.message}\n`);
  process.exit(1);
});
