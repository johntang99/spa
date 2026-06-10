#!/usr/bin/env node
/**
 * Smoke check for onboarding O5B rewrite quality.
 *
 * Assertions:
 * 1) services+conditions change ratio is above threshold
 * 2) forbidden terms are absent from applied rewrite items
 * 3) if critical validation failures exist, job status must not be completed
 */

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
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
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile(path.join(ROOT, '.env.local'));

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const baseUrl = process.env.ONBOARD_BASE_URL || 'http://localhost:3003';
  const templateSiteId = process.env.O5B_TEMPLATE_SITE_ID || 'acupuncture-flushing';
  const minServicesRatio = Number(process.env.O5B_MIN_SERVICES_RATIO || 0.55);
  const minConditionsRatio = Number(process.env.O5B_MIN_CONDITIONS_RATIO || 0.55);
  const forbiddenTerms = ['cure', 'guaranteed', 'miracle', 'risk-free'];

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: admins, error: adminError } = await supabase
    .from('admin_users')
    .select('id,email,role')
    .limit(20);
  if (adminError || !admins || admins.length === 0) {
    throw new Error(adminError?.message || 'No admin users found');
  }
  const admin = admins.find((row) => row.role === 'super_admin') || admins[0];
  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role },
    jwtSecret,
    { expiresIn: '7d' }
  );
  const cookie = `admin-token=${token}`;

  const siteId = `o5b-qa-${Date.now().toString().slice(-8)}`;
  const intake = {
    clientId: siteId,
    templateSiteId,
    skipAi: false,
    rewriteMode: 'aggressive',
    rewriteStrictness: 'strict-medical',
    rewriteAutoApply: true,
    locales: { default: 'en', supported: ['en'] },
    domains: {
      production: `${siteId}.example.com`,
      dev: `${siteId}.local`,
    },
    business: {
      name: `O5B QA Clinic ${Date.now().toString().slice(-4)}`,
      ownerName: 'Dr. Quinn Park',
      ownerNameWithCredentials: 'Dr. Quinn Park, L.Ac.',
      ownerTitle: 'Licensed Acupuncturist',
      ownerLanguages: ['English', 'Mandarin'],
      foundedYear: 2017,
      yearsExperience: '10+',
      description: 'Holistic TCM care focused on root-cause healing.',
      tagline: 'Whole-person healing care',
      ownerCredentials: ['NCCAOM Diplomate'],
      ownerCertifications: ['NCCAOM'],
      ownerSpecializations: ['Pain relief', "Women's health"],
    },
    location: {
      address: '88 Northern Blvd',
      city: 'Flushing',
      state: 'NY',
      zip: '11354',
      phone: '(917) 555-0110',
      email: 'hello@o5bqa.example.com',
      addressMapUrl: 'https://maps.google.com/?q=88+Northern+Blvd+Flushing+NY+11354',
    },
    services: {
      enabled: [
        'acupuncture',
        'chinese-herbal-medicine',
        'cupping-therapy',
        'moxibustion',
        'tuina-massage',
      ],
    },
    contentTone: {
      voice: 'warm-professional',
      targetDemographic: 'Adults and families',
      uniqueSellingPoints: ['Whole-person treatment', 'Modern clean clinic'],
    },
  };

  const response = await fetch(`${baseUrl}/api/admin/onboarding`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      cookie,
    },
    body: JSON.stringify(intake),
  });
  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(`Onboarding failed (${response.status}): ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';
  let completeEvent = null;
  let errorEvent = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let index;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).replace(/\r$/, '');
      buffer = buffer.slice(index + 1);

      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (currentEvent === 'complete') completeEvent = data;
        if (currentEvent === 'error') errorEvent = data;
      } else if (!line) {
        currentEvent = '';
      }
    }
  }

  if (errorEvent) {
    throw new Error(`Onboarding pipeline error: ${JSON.stringify(errorEvent)}`);
  }
  if (!completeEvent) {
    throw new Error('Onboarding stream ended without complete event');
  }

  const { data: jobs, error: jobsError } = await supabase
    .from('rewrite_jobs')
    .select('id,status,error')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (jobsError || !jobs || jobs.length === 0) {
    throw new Error(jobsError?.message || 'No rewrite job found for new site');
  }
  const job = jobs[0];

  const { data: items, error: itemsError } = await supabase
    .from('rewrite_items')
    .select('path,rewritten_text,validation_passed,risk_flags,validation')
    .eq('job_id', job.id)
    .limit(5000);
  if (itemsError) {
    throw new Error(itemsError.message);
  }
  const allItems = items || [];
  const servicesItems = allItems.filter((item) => item.path === 'pages/services.json');
  const conditionsItems = allItems.filter((item) => item.path === 'pages/conditions.json');
  const computePassRatio = (rows) => {
    if (rows.length === 0) return 0;
    const changed = rows.filter((row) => {
      const ratio =
        row.validation && typeof row.validation === 'object' && typeof row.validation.changeRatio === 'number'
          ? row.validation.changeRatio
          : 0;
      return ratio >= 0.25;
    }).length;
    return changed / rows.length;
  };
  const servicesRatio = computePassRatio(servicesItems);
  const conditionsRatio = computePassRatio(conditionsItems);
  if (servicesRatio < minServicesRatio) {
    throw new Error(`services change ratio too low: ${servicesRatio.toFixed(3)} < ${minServicesRatio}`);
  }
  if (conditionsRatio < minConditionsRatio) {
    throw new Error(`conditions change ratio too low: ${conditionsRatio.toFixed(3)} < ${minConditionsRatio}`);
  }

  const forbiddenHits = [];
  for (const item of allItems) {
    const text = String(item.rewritten_text || '').toLowerCase();
    for (const term of forbiddenTerms) {
      if (text.includes(term.toLowerCase())) {
        forbiddenHits.push(term);
      }
    }
  }
  if (forbiddenHits.length > 0) {
    throw new Error(`Forbidden terms found in rewrites: ${Array.from(new Set(forbiddenHits)).join(', ')}`);
  }

  const criticalRisk = (allItems || []).filter(
    (item) =>
      item.validation_passed !== true ||
      (Array.isArray(item.risk_flags) &&
        item.risk_flags.some((flag) =>
          [
            'forbidden_terms_present',
            'missing_required_terms',
            'rewrite_too_similar',
            'empty_rewrite',
            'length_delta_too_high',
          ].includes(flag)
        ))
  );
  if (criticalRisk.length > 0 && job.status === 'completed') {
    throw new Error(
      `Rewrite job is completed despite ${criticalRisk.length} critical validation failures`
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        siteId,
        completeEvent,
        rewriteJob: job,
        metrics: {
          servicesChangeRatio: Number(servicesRatio.toFixed(4)),
          conditionsChangeRatio: Number(conditionsRatio.toFixed(4)),
          totalItems: allItems.length,
          criticalRiskItems: criticalRisk.length,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`\nO5B quality smoke test failed: ${error.message}\n`);
  process.exit(1);
});
