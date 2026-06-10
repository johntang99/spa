#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ENV_PATH = path.join(ROOT, '.env.local');

const envRaw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
const envMap = {};
for (const line of envRaw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
  const idx = trimmed.indexOf('=');
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim();
  envMap[key] = value.replace(/^['"]+|['"]+$/g, '');
}

const getEnv = (key) => (envMap[key] || process.env[key] || '').trim();

const SUPABASE_URL =
  getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const SITE_ID = 'goshen-acupuncture';
const LOCALE = 'en';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

function toTitle(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function collectText(value, acc = []) {
  if (value == null) return acc;
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, acc);
    return acc;
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value)) collectText(nested, acc);
  }
  return acc;
}

function countWords(value) {
  const text = collectText(value).join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

function dedupeByQuestion(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = (item?.question || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function strengthenLocalLanding(data, city, state, clinicName) {
  data.hero.intro =
    `${clinicName} provides acupuncture care for families and working adults throughout ${city}, ${state}, with treatment plans that are practical, measurable, and customized to each patient. ` +
    `Instead of using a one-size-fits-all protocol, we begin with a complete intake that reviews symptom patterns, sleep quality, stress load, recovery history, and day-to-day triggers. ` +
    `That evaluation helps us prioritize the right treatment sequence, whether you need pain-focused support, nervous system regulation, sleep restoration, or whole-body maintenance care. ` +
    `Our goal is simple: help you feel better in daily life, not just during the hour after treatment.`;

  data.conditions.intro =
    `Patients in ${city} commonly visit us for musculoskeletal pain, stress-related symptoms, sleep disruption, and chronic tension that has not fully improved with short-term approaches. ` +
    `Each condition page below explains where acupuncture and integrative Chinese medicine can fit into a realistic care plan, what timeline to expect, and how progress is tracked over time.`;

  const serviceDescriptionByName = {
    Acupuncture:
      `Precision point-based treatment used to reduce pain, calm stress response, improve circulation, and support recovery without relying on medication-first strategies.`,
    'Chinese Herbal Medicine':
      `Customized herbal formulas selected by pattern diagnosis to support sleep, digestion, hormonal balance, and long-term recovery between office visits.`,
    'Cupping Therapy':
      `Targeted soft-tissue decompression that helps release stubborn muscle tension, improve local blood flow, and support post-activity or post-work recovery.`,
    Moxibustion:
      `Gentle therapeutic heat used to warm cold or deficient patterns, improve comfort, and support circulation in patients with chronic fatigue or pain sensitivity.`,
    'Tui Na Massage':
      `Manual Chinese medicine bodywork that improves mobility, reduces guarding, and supports musculoskeletal function through structured soft-tissue techniques.`,
  };

  data.services.items = (Array.isArray(data.services.items) ? data.services.items : []).map((item) => {
    const mapped = serviceDescriptionByName[item.name];
    if (!mapped) return item;
    return {
      ...item,
      description:
        `${mapped} ` +
        `For patients in ${city}, we often combine this with a staged plan so treatment intensity can match symptom severity and response.`,
    };
  });

  data.whyChooseUs.items = [
    {
      title: 'Clinical Evaluation First',
      body:
        `Every plan starts with a detailed intake and pattern assessment so treatment choices are based on your current presentation, not generic symptom labels.`,
    },
    {
      title: 'Progress-Focused Care Plans',
      body:
        `We define short-term and mid-term goals, then adjust frequency, modalities, and home-care steps as your function improves and flare-ups decrease.`,
    },
    {
      title: 'Local, Practical Access',
      body:
        `${city} patients receive clear scheduling guidance, transparent communication, and treatment pacing that fits real family and work demands.`,
    },
  ];

  data.faq.items = dedupeByQuestion([
    {
      question: `How many sessions does acupuncture usually take in ${city}?`,
      answer:
        `Most patients begin with a short intensive phase of 1-2 visits per week for 2-4 weeks, then taper as symptoms stabilize. ` +
        `Acute issues may respond faster, while long-standing conditions often require a longer care arc. We review progress regularly and adjust the plan based on objective changes in pain, sleep, mobility, and daily function.`,
    },
    {
      question: 'Can I combine acupuncture with my current medical treatment?',
      answer:
        `Yes. Many patients use acupuncture alongside primary care, physical therapy, orthopedic care, or behavioral health support. ` +
        `Our team focuses on complementary care and encourages coordinated communication so your broader treatment plan remains aligned and safe.`,
    },
    {
      question: 'What should I expect after my first visit?',
      answer:
        `You may feel immediate relief, deeper relaxation, or gradual change over 24-72 hours. ` +
        `Some patients notice temporary soreness or fatigue after initial sessions, which generally resolves quickly. We provide post-visit guidance so you can monitor response and recover comfortably.`,
    },
    {
      question: `Do you treat only pain-related cases in ${city}?`,
      answer:
        `No. While pain care is common, we also support stress and anxiety patterns, sleep issues, headache frequency, and recovery-related fatigue. ` +
        `Treatment recommendations are tailored to your goals and health history rather than limited to one symptom category.`,
    },
    {
      question: 'How do you personalize treatment plans?',
      answer:
        `We personalize by combining your symptom timeline, trigger patterns, constitutional findings, and treatment response from prior sessions. ` +
        `This allows us to adapt point selection, modality mix, and visit frequency as your condition evolves.`,
    },
    {
      question: 'Is acupuncture safe for older adults?',
      answer:
        `When performed by a licensed provider using sterile single-use needles, acupuncture is generally well tolerated across age groups. ` +
        `For older adults or medically complex patients, we adjust technique and intensity to prioritize comfort and safety.`,
    },
    {
      question: 'Can treatment help reduce stress-related physical symptoms?',
      answer:
        `Yes. Many patients seek care for jaw tension, neck/shoulder tightness, sleep disruption, and fatigue linked to prolonged stress load. ` +
        `Our protocols focus on calming the nervous system while improving circulation and physical recovery.`,
    },
    {
      question: 'When should I schedule maintenance visits?',
      answer:
        `After your primary goals are met, many patients shift to maintenance every 2-6 weeks depending on stress load, activity level, and recurrence history. ` +
        `Maintenance helps preserve gains and reduce severe flare-ups over time.`,
    },
  ]);

  data.location.intro =
    `Our clinic serves patients from ${city} and nearby Orange County communities who want structured, conservative, and personalized care. ` +
    `If you are comparing providers, contact us for a consultation to discuss your goals, expected timeline, and the treatment approach that best fits your case.`;
}

function strengthenConditionPage(data, city, state, clinicName) {
  const conditionName = toTitle(data.condition || '');
  const shortCondition = conditionName.replace(/\s+/g, ' ').trim();

  data.hero.openingParagraph =
    `${shortCondition} can affect concentration, sleep quality, activity tolerance, and overall confidence in daily life. ` +
    `At ${clinicName}, we use acupuncture and integrative Chinese medicine strategies in ${city}, ${state} to reduce symptom intensity while improving resilience between flare-ups. ` +
    `Your treatment plan is tailored to your symptom history, trigger profile, and recovery goals, so care remains specific and actionable rather than generic. ` +
    `Patients receive clear milestone checkpoints so progress is easy to evaluate and adjust.`;

  data.howItWorks.body =
    `Acupuncture for ${shortCondition.toLowerCase()} focuses on improving circulation, regulating nervous system overactivation, and reducing inflammatory or stress-related amplification patterns that can keep symptoms persistent.\n\n` +
    `In clinical practice, we combine point selection with treatment pacing based on how your body responds week to week. Early sessions often prioritize symptom reduction, while later sessions emphasize stability and recurrence prevention.\n\n` +
    `When appropriate, we also include adjunctive methods and home-care guidance so improvements continue outside the clinic, especially for patients managing high workloads, poor sleep, or repeated stress exposure.\n\n` +
    `This layered approach helps improve consistency so gains are not dependent on one single treatment day.`;

  data.whatToExpect.body =
    `Your first visit includes a full intake, timeline review, and treatment plan discussion so expectations are clear from day one.\n\n` +
    `Most sessions last about 45-60 minutes including reassessment. Depending on severity and chronicity, we may recommend a short intensive phase before spacing visits farther apart.\n\n` +
    `Progress is evaluated using practical outcomes: symptom frequency, symptom intensity, sleep quality, mobility, and day-to-day function. If response is slower than expected, we refine protocol instead of repeating the same approach.\n\n` +
    `Our emphasis is on predictable, steady progress that remains workable with your real-life schedule.`;

  data.testimonial.quote =
    `After weeks of inconsistent relief, I finally had a plan that made sense. The team explained each step, adjusted treatment as my symptoms changed, and I began noticing steadier progress in my daily routine.`;

  data.faq.items = dedupeByQuestion([
    ...(Array.isArray(data.faq.items) ? data.faq.items : []),
    {
      question: `How quickly can acupuncture help ${shortCondition.toLowerCase()}?`,
      answer:
        `Response speed varies by severity, chronicity, sleep quality, stress load, and overall health history. ` +
        `Some patients feel early improvement in the first few sessions, while complex or long-standing cases usually require a structured multi-week plan.`,
    },
    {
      question: `Will I need ongoing care for ${shortCondition.toLowerCase()}?`,
      answer:
        `Not always. Many patients complete a focused treatment phase and then transition to maintenance only as needed. ` +
        `The goal is to build durable improvement and reduce relapse frequency, not keep you on an indefinite intensive schedule.`,
    },
    {
      question: `What signs show that treatment for ${shortCondition.toLowerCase()} is working?`,
      answer:
        `Positive signs include lower symptom intensity, fewer flare-ups, better sleep quality, improved daily activity tolerance, and reduced fear of triggering episodes. ` +
        `We track these markers over time to ensure progress is practical and meaningful.`,
    },
    {
      question: `Can lifestyle changes improve outcomes for ${shortCondition.toLowerCase()}?`,
      answer:
        `Yes. Sleep regularity, stress regulation, movement pacing, and hydration can significantly improve treatment carryover. ` +
        `We provide simple, realistic guidance to reinforce your in-clinic progress.`,
    },
  ]);
}

function strengthenServicePage(data, city, state, clinicName) {
  const serviceName = toTitle(data.service || '').replace('Tui Na Massage', 'Tui Na Massage');
  const serviceBodyBySlug = {
    'chinese-herbal-medicine':
      `Chinese herbal medicine uses formula design based on pattern differentiation rather than symptom-only matching. ` +
      `Formulas are selected and adjusted to support systems such as digestion, sleep, stress adaptation, and recovery resilience.\n\n` +
      `At our clinic, herbal planning is practical and staged: we review your response, refine dosing strategy, and adapt formulas as your presentation shifts. ` +
      `This helps patients avoid static one-time plans that do not match real recovery changes over time.\n\n` +
      `For patients in ${city}, herbal care is often combined with acupuncture so treatment gains can continue between visits and remain stable through workload or seasonal stress changes.`,
    'cupping-therapy':
      `Cupping therapy applies controlled decompression to improve local circulation, reduce tissue guarding, and support myofascial recovery in overused areas. ` +
      `It is frequently used for neck, shoulder, back, and postural tension patterns that accumulate from repetitive work or prolonged sitting.\n\n` +
      `The treatment intensity is adjusted based on sensitivity and recovery goals. In acute cases we focus on short-term reduction of pain and tightness; in chronic cases we pair decompression with staged follow-up care for durability.\n\n` +
      `In ${city}, many patients choose cupping as part of a broader musculoskeletal plan that includes acupuncture and movement guidance to reduce recurrence.`,
    moxibustion:
      `Moxibustion provides therapeutic warmth to support circulation, reduce cold-pattern discomfort, and improve tolerance in patients with fatigue-related or chronic pain presentations. ` +
      `It is especially useful when symptoms are aggravated by cold exposure, low energy states, or prolonged deficiency patterns.\n\n` +
      `Treatment is dosed carefully to balance comfort and effectiveness. We reassess response each visit and adjust location, duration, and treatment frequency so progress remains steady.\n\n` +
      `For ${city} patients, moxibustion is often integrated with acupuncture to improve recovery momentum in cases where symptoms fluctuate with weather or stress load.`,
    'tui-na-massage':
      `Tui Na massage is a structured Chinese medicine bodywork method that combines soft-tissue release, joint mobilization, and channel-based manual techniques. ` +
      `It helps reduce pain sensitivity, improve movement quality, and restore tolerance for normal daily activity.\n\n` +
      `Rather than generalized massage pressure, treatment is selected by pattern and tissue response. Sessions can be calming and restorative or more corrective depending on your current presentation and recovery goals.\n\n` +
      `In ${city}, Tui Na is frequently paired with acupuncture for patients managing recurring neck, shoulder, and low-back strain who need better long-term functional stability.`,
  };

  data.hero.description =
    `${serviceName} at ${clinicName} in ${city}, ${state} is delivered as part of a structured care plan designed around your symptoms, recovery goals, and treatment tolerance. ` +
    `We focus on practical outcomes such as pain reduction, better mobility, improved sleep, and lower day-to-day symptom burden, then adjust the plan based on your actual response. ` +
    `This approach gives patients a clear roadmap instead of open-ended trial-and-error care.`;

  data.whatIsIt.body =
    `${serviceName} is used in Chinese medicine as a targeted intervention to improve function and reduce symptom burden through individualized treatment design.\n\n` +
    `Rather than applying the same protocol to every patient, we evaluate symptom patterns, progression history, stress load, and recovery capacity before determining the right treatment intensity and frequency.\n\n` +
    `This individualized model helps patients in ${city} receive care that is both clinically focused and practical for real-world schedules.\n\n` +
    (serviceBodyBySlug[data.service] || '');

  data.howItWorks.body =
    `Treatment begins with a focused reassessment at each visit so adjustments can be made in real time based on progress and symptom change.\n\n` +
    `Early sessions prioritize stabilization and symptom relief. As symptoms improve, care shifts toward function restoration, relapse prevention, and sustainable self-management strategies.\n\n` +
    `When appropriate, we combine modalities and home-care guidance to improve carryover between visits and support longer-lasting results.\n\n` +
    `If progress slows, we re-evaluate diagnosis assumptions and treatment pacing rather than repeating static protocols. ` +
    `That responsiveness is a key part of achieving durable outcomes in both acute and chronic cases.`;

  const conditionLinks = [
    { name: 'Back Pain', slug: 'acupuncture-for-back-pain-goshen-ny' },
    { name: 'Insomnia', slug: 'acupuncture-for-insomnia-goshen-ny' },
    { name: 'Anxiety', slug: 'acupuncture-for-anxiety-goshen-ny' },
    { name: 'Neck and Shoulder Tension' },
    { name: 'Stress-Related Headache' },
    { name: 'Recovery Fatigue' },
    { name: 'General Muscle Tightness' },
    { name: 'Postural Strain' },
  ];
  data.whatItTreats.conditions = conditionLinks;

  const baseFaq = Array.isArray(data.faq.items) ? data.faq.items : [];
  data.faq.items = dedupeByQuestion([
    ...baseFaq,
    {
      question: `How many ${serviceName.toLowerCase()} sessions are usually needed?`,
      answer:
        `Session count depends on symptom severity, chronicity, and treatment goals. ` +
        `Many patients start with a short concentrated phase, then taper frequency as outcomes improve and remain stable. ` +
        `Most plans are reviewed every few visits so frequency can be reduced when function and symptom control are consistent.`,
    },
    {
      question: `Can ${serviceName.toLowerCase()} be combined with other treatments?`,
      answer:
        `Yes. We frequently integrate this service with acupuncture, movement-based rehab, and medical care plans when appropriate. ` +
        `Combining methods can improve durability when treatment goals are clearly coordinated.`,
    },
    {
      question: `Is ${serviceName.toLowerCase()} safe for sensitive patients?`,
      answer:
        `In most cases, yes. Technique, intensity, and session pacing are adjusted for comfort, age, medical complexity, and symptom sensitivity. ` +
        `We use a conservative start when needed and increase intensity only when response supports it.`,
    },
    {
      question: `What should I do between ${serviceName.toLowerCase()} sessions?`,
      answer:
        `Between visits, simple actions such as hydration, sleep consistency, mobility work, and trigger management can improve carryover. ` +
        `We provide brief home-care guidance tailored to your case so gains are reinforced between appointments.`,
    },
  ]);
}

function strengthenResourcePage(data, city, state, clinicName) {
  data.directAnswer.body =
    `In ${city}, ${state}, acupuncture pricing typically depends on provider experience, visit length, treatment complexity, and whether care is part of a short-term or longer-term plan. ` +
    `Most patients should expect a range rather than one flat number, because the first visit and follow-up phases are often structured differently. ` +
    `At ${clinicName}, we emphasize transparent pricing discussions so you can understand expected total cost before beginning care. ` +
    `This helps patients compare options based on total value and outcomes, not headline pricing alone.`;

  data.priceBreakdown.items = [
    { label: 'Initial consultation and first treatment', price: '$120-$180' },
    { label: 'Standard follow-up treatment', price: '$85-$130' },
    { label: 'Extended complex follow-up (when needed)', price: '$120-$160' },
    { label: 'Focused short treatment visit', price: '$65-$95' },
    { label: 'Package pricing per visit (when offered)', price: '$70-$110' },
    { label: 'Insurance-adjusted patient responsibility', price: 'Varies by plan' },
  ];

  data.whatAffectsCost.body =
    `Total cost is influenced by more than per-session price. Key factors include condition complexity, number of areas treated, visit frequency during the initial phase, and whether additional modalities are incorporated.\n\n` +
    `Patients with long-standing symptoms often need a more structured early schedule, while newer issues may require fewer sessions. ` +
    `Progress reviews help determine when spacing visits farther apart is appropriate.\n\n` +
    `Choosing care based only on the lowest sticker price can lead to higher total cost if treatment planning is not personalized or adjusted as symptoms evolve.`;

  data.insurance.body =
    `Coverage for acupuncture varies by insurer and plan design. Some plans cover specific diagnoses, while others require referrals, prior authorization, or in-network providers.\n\n` +
    `Before your first visit, verify benefits such as deductible status, co-pay/co-insurance responsibility, visit limits, and any diagnosis restrictions. ` +
    `If needed, we can provide billing documentation or visit summaries to support reimbursement workflows.\n\n` +
    `If your plan has limited coverage, we can discuss practical self-pay pacing so treatment remains sustainable while still clinically effective.`;

  data.worthIt.body =
    `For many patients, the value of acupuncture is measured by function: better sleep, reduced pain medication reliance, improved work tolerance, and fewer high-severity flare-ups. ` +
    `When treatment is individualized and progress is reviewed regularly, patients often see stronger long-term return than short-cycle symptom suppression alone.\n\n` +
    `The most cost-effective plan is usually the one that balances clinical progress, sustainable scheduling, and clear communication about expected timelines.`;

  data.faq.items = dedupeByQuestion([
    ...(Array.isArray(data.faq.items) ? data.faq.items : []),
    {
      question: 'How can I estimate my total treatment cost?',
      answer:
        `Estimate based on three parts: initial visit pricing, expected follow-up frequency for the first month, and your insurance or self-pay structure. ` +
        `A realistic estimate should include reassessment points where frequency can be reduced as symptoms improve.`,
    },
    {
      question: 'Is package pricing always the best option?',
      answer:
        `Not always. Packages can reduce per-visit cost, but value depends on whether the treatment plan matches your actual needs. ` +
        `We recommend selecting packages only after discussing expected frequency and clinical goals.`,
    },
    {
      question: 'How often should pricing be re-evaluated during treatment?',
      answer:
        `Pricing strategy should be revisited whenever visit frequency changes, insurance status changes, or major symptom milestones are reached. ` +
        `Regular review helps keep care both clinically appropriate and financially predictable.`,
    },
  ]);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} :: ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const activePages = await fetchJson(
    `${SUPABASE_URL}/rest/v1/site_seo_pages?site_id=eq.${encodeURIComponent(SITE_ID)}&active=eq.true&select=slug,page_type&order=slug.asc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );

  const localLandingRow = await fetchJson(
    `${SUPABASE_URL}/rest/v1/content_entries?site_id=eq.${encodeURIComponent(SITE_ID)}&locale=eq.${LOCALE}&path=eq.acupuncture-goshen-ny&select=data`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  const localLandingData = localLandingRow[0]?.data || {};
  const city = localLandingData?.location?.nap?.city || 'Goshen';
  const state = localLandingData?.location?.nap?.state || 'NY';
  const clinicName = localLandingData?.location?.nap?.name || 'Kingsfoil Acupuncture';

  const updatedRows = [];
  const stats = [];

  for (const page of activePages) {
    const rows = await fetchJson(
      `${SUPABASE_URL}/rest/v1/content_entries?site_id=eq.${encodeURIComponent(SITE_ID)}&locale=eq.${LOCALE}&path=eq.${encodeURIComponent(page.slug)}&select=path,data`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    const row = rows[0];
    if (!row?.data) continue;

    const beforeWords = countWords(row.data);
    const next = JSON.parse(JSON.stringify(row.data));

    if (page.page_type === 'seo-local-landing') {
      strengthenLocalLanding(next, city, state, clinicName);
    } else if (page.page_type === 'seo-condition') {
      strengthenConditionPage(next, city, state, clinicName);
    } else if (page.page_type === 'seo-service') {
      strengthenServicePage(next, city, state, clinicName);
    } else if (page.page_type === 'seo-resource') {
      strengthenResourcePage(next, city, state, clinicName);
    }

    const afterWords = countWords(next);
    stats.push({
      slug: page.slug,
      type: page.page_type,
      beforeWords,
      afterWords,
      delta: afterWords - beforeWords,
      faqCount: Array.isArray(next?.faq?.items) ? next.faq.items.length : 0,
    });

    updatedRows.push({
      site_id: SITE_ID,
      locale: LOCALE,
      path: page.slug,
      data: next,
      updated_by: 'cursor-seo-strengthen-en',
    });
  }

  if (updatedRows.length === 0) {
    console.log('No rows updated.');
    return;
  }

  await fetchJson(
    `${SUPABASE_URL}/rest/v1/content_entries?on_conflict=site_id,locale,path`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(updatedRows),
    },
  );

  const totalBefore = stats.reduce((sum, item) => sum + item.beforeWords, 0);
  const totalAfter = stats.reduce((sum, item) => sum + item.afterWords, 0);

  console.log(`Updated ${updatedRows.length} EN SEO pages for ${SITE_ID}.`);
  console.log(`Total words: ${totalBefore} -> ${totalAfter} (delta ${totalAfter - totalBefore})`);
  for (const item of stats) {
    console.log(
      `${item.slug} | ${item.type} | ${item.beforeWords} -> ${item.afterWords} | delta ${item.delta} | faq ${item.faqCount}`,
    );
  }
}

main().catch((error) => {
  console.error('Failed to strengthen SEO content:', error);
  process.exit(1);
});
