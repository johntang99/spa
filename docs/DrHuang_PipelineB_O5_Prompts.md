# Pipeline B — O5 Extended Prompts
## System A (TCM): SEO Page Content Generation

> **Version:** 1.1  
> **Date:** March 2026  
> **Used in:** Pipeline B Step O5 (AI Content Generation) + O1/O4 onboarding hardening (see below)  
> **SEO prompt on disk (live):** `scripts/onboard/prompts/chinese-medicine/seo.md` (O5 loads this path from `app/api/admin/onboarding/route.ts`)  
> **Model:** claude-sonnet-4-20250514  
> **Purpose:** After DrHuang retrofit, these prompts generate city-specific SEO page content for every new TCM client onboarded via Pipeline B. Acu-Flushing, Acu-Shi, and all future TCM clients get fully populated SEO pages on day 1.

---

## O1 & O4 — Site-wide NAP, domains, and SEO registry (v1.1)

**Implementation:** `app/api/admin/onboarding/route.ts`

Pipeline B is not only O5 copy generation. **O1 (clone)** and **O4 (content replacement)** must align **all** template artifacts with the new client: core pages, header/footer, blog, **SEO landing JSON**, the **`site_seo_pages`** registry, and stored **intake**.

### O1 — Clone extensions

| Addition | Purpose |
|----------|---------|
| **Clone `site_seo_pages`** from `templateSiteId` → new `site_id` | Powers **sitemap** (`getSEOPagesForSite`) and **`getServiceSEOLinks`** so service/home links resolve to SEO URLs instead of `#` anchors. |
| **Upsert `content_entries` path `intake.json`** (default locale) | Persists the submitted intake for **`scripts/seed-seo-pages.mjs`**, QA, and traceability. |

SEO page **content** still comes from cloned template `content_entries` rows (slug = row `path`, e.g. `acupuncture-middletown-ny`).

### O4 — Replacement + SEO slug remap + NAP patch

1. **Geo slug remap (when template city/state ≠ intake)**  
   - **Template suffix** is resolved from template `intake.json` → `location`, or from template **`site_seo_pages`** core landing slug (`acupuncture-{suffix}`).  
   - **New suffix** = `{citySlug}-{state}` — same convention as `scripts/seed-seo-pages.mjs` (`citySlug` from `intake.location.citySlug` or slugified `city`; state = first two letters, lowercased).  
   - If old ≠ new: **rename** all `content_entries` whose `path` ends with the old suffix; **rename** matching **`site_seo_pages.slug`**; add string replacement pairs so internal links and canonical paths stay consistent.

2. **`augmentReplacementsFromTemplateSite`**  
   Loads the **template’s** `site.json` (en) and **`sites.domain`**, and adds replace pairs for **phone**, **email**, **full address lines**, and **production domain** (including `www.`), so deep-replace works even when the template is not the hard-coded Middletown/Flushing examples.

3. **Existing O4 behavior** (unchanged in spirit)  
   Doctor/clinic term sets, hardcoded fallback NAP swaps, **`drhuangclinic.com` → production domain**, full **`deepReplace`** over all non-`theme.json` entries, then structural updates to **`site.json`**, **`header.json`**, **`footer.json`**, **`pages/about.json`**, **`pages/home.json`**, **`pages/contact.json`**, **`pages/blog.json`**, blog articles.

4. **`patchAllSeoContentEntries` (after deep replace)**  
   For every row with `data.pageType` starting with **`seo-`**: refresh **`location` / `location.nap`**, **map embed + directions URLs**, **`location.hours`** from **`intake.hours`** when present, and **hero `secondaryCta`** (phone text + `tel:`), with EN vs ZH phone label.

### Rendering note — condition page breadcrumbs

**`components/seo/SEOConditionLayout.tsx`:** `BreadcrumbList` JSON-LD no longer hardcodes a single city slug. It uses **`backLink.url`** when present, otherwise infers the core landing path from the condition **`seo.canonicalUrl`** (`acupuncture-for-…-{city}-{st}` → `acupuncture-{city}-{st}`).

### Intake fields to require for clean SEO onboarding

- **`location.city`**, **`location.state`** (two-letter, e.g. `NY`) — required for geo suffix and maps.  
- **`location.citySlug`** (optional) — if omitted, city is slugified (spaces → hyphens).  
- **`location.address`**, **`zip`**, **`phone`**, **`email`**, **`addressMapUrl`** (optional) — drive NAP + embeds.  
- **`hours`** (optional) — copied into SEO **`location.hours`** where the patch applies.

If the template has **no** `site_seo_pages` rows, clone still succeeds; run **`node scripts/seed-seo-pages.mjs <site-id>`** after onboarding (intake is available in DB).

---

## How O5 Uses These Prompts

O5 makes two API calls per client onboarding:
- **Call 1:** Content (hero, bios, testimonials) — existing prompt, unchanged
- **Call 2:** SEO (page titles, meta, body copy) — **this file extends Call 2**

The SEO call now generates content for all new page types built in the DrHuang retrofit. Variables are interpolated from the intake form before the prompt is sent.

---

## O5 Input Variables (from intake form)

```json
{
  "clinicName": "{{intake.business.name}}",
  "practitionerName": "{{intake.business.ownerName}}",
  "city": "{{intake.location.city}}",
  "state": "{{intake.location.state}}",
  "cityState": "{{intake.location.city}}, {{intake.location.state}}",
  "phone": "{{intake.location.phone}}",
  "address": "{{intake.location.address}}",
  "zip": "{{intake.location.zip}}",
  "primaryService": "acupuncture",
  "specialties": "{{intake.seo.specialties}}",
  "serviceAreaCities": "{{intake.seo.serviceAreaCities}}",
  "languages": "{{intake.business.languages}}",
  "yearsInPractice": "{{intake.business.foundedYear}}",
  "credentials": "{{intake.business.credentials}}"
}
```

---

## SEO Generation Prompt (Call 2 — Extended)

**System prompt:**
```
You are an expert local SEO content writer specializing in Traditional Chinese Medicine and acupuncture clinics. You write people-first content that ranks well in Google and converts visitors into patients. You never make diagnostic claims or promise cures. You always write naturally — city and practitioner name appear where they sound organic, not mechanically repeated. You output only valid JSON with no markdown, no preamble, no explanation.
```

**User prompt template** (variables interpolated before sending):

```
Generate SEO content for a Traditional Chinese Medicine clinic. Output ONLY a JSON object with the exact structure shown below. No markdown, no explanation, no backticks.

Clinic information:
- Clinic name: {{clinicName}}
- Practitioner: {{practitionerName}}
- City: {{city}}
- State: {{state}}
- Specialties: {{specialties}}
- Languages: {{languages}}
- Years in practice: {{yearsInPractice}}

Generate the following JSON structure exactly:

{
  "seoPages": {
    "coreLanding": {
      "title": "[Service] in [City], [State] | [Clinic Name] — max 60 chars",
      "description": "[150 chars max — primary keyword + city + CTA]",
      "h1": "Acupuncture in {{cityState}}",
      "heroIntro": "[2 sentences, 40-60 words. Mention city, practitioner name, and 2-3 conditions treated. Natural tone.]",
      "trustBarText": "[1 sentence about years of practice and number of patients served in the city]",
      "whyChooseUs": [
        {"title": "[Trust point 1]", "body": "[1-2 sentences — specific to this clinic and city]"},
        {"title": "[Trust point 2]", "body": "[1-2 sentences]"},
        {"title": "[Trust point 3]", "body": "[1-2 sentences]"}
      ],
      "testimonial": {
        "quote": "[2-3 sentences. Mentions a specific condition, improvement, practitioner name, city. Sounds authentic.]",
        "attribution": "[First name], {{city}}"
      },
      "faqAnswers": {
        "cost": "[50-80 words. Mention $75-$150 range, what's included, link hint to cost page. Natural.]",
        "painful": "[50-80 words. Reassuring, honest about fine gauge needles, most patients relax.]",
        "sessions": "[50-80 words. Typical 6-10 sessions, varies by condition, initial consultation determines plan.]",
        "insurance": "[50-80 words. Honest about NY coverage, check with insurer, HSA/FSA accepted.]",
        "firstVisit": "[50-80 words. Intake, diagnosis, treatment on first visit, what to wear, how to prepare.]",
        "languages": "[30-50 words. Mention {{languages}} spoken at the clinic.]"
      },
      "locationIntro": "[1 sentence welcoming patients from {{city}} and surrounding area to the clinic.]"
    },
    "conditionBackPain": {
      "title": "Acupuncture for Back Pain in {{cityState}} | {{clinicName}} — max 60 chars",
      "description": "[150 chars max — back pain + city + natural relief + CTA]",
      "h1": "Acupuncture for Back Pain in {{cityState}}",
      "openingParagraph": "[100-130 words. Back pain prevalence, how acupuncture addresses root causes (tension, circulation, pain response), mention {{clinicName}} in {{city}}, mention {{practitionerName}} has helped patients reduce/eliminate back pain without medication.]",
      "howItWorksBody": "[120-150 words. Mechanism of action, types of back pain treated (lower, upper, sciatica, disc, muscle spasm), what a treatment session involves, realistic outcomes.]",
      "whatToExpectBody": "[80-100 words. Step-by-step: intake, diagnosis, needle placement, rest period, follow-up plan. Address fear of needles — fine gauge, most patients relax.]",
      "testimonial": {
        "quote": "[2-3 sentences. Mentions back pain specifically, duration of suffering, improvement, {{practitionerName}}, {{city}}.]",
        "attribution": "[First name], {{city}}"
      },
      "faqAnswers": {
        "permanent": "[60-80 words. Honest — many patients achieve lasting relief, maintenance sessions help, lifestyle factors matter.]",
        "sessions": "[50-70 words. Typically 6-10 for back pain, initial consultation determines plan.]",
        "vsPhysio": "[60-80 words. Complementary not competing, acupuncture excellent for root-cause treatment, some patients do both.]",
        "hurt": "[50-70 words. Fine gauge needles, most patients feel minimal discomfort, many find it deeply relaxing.]"
      }
    },
    "conditionInsomnia": {
      "title": "Acupuncture for Insomnia in {{cityState}} | {{clinicName}} — max 60 chars",
      "description": "[150 chars max — sleep/insomnia + city + natural + CTA]",
      "h1": "Acupuncture for Insomnia in {{cityState}}",
      "openingParagraph": "[100-130 words. Insomnia affects 1 in 3 adults, difficulty falling/staying asleep, TCM treats root cause not symptoms, mention {{clinicName}} in {{city}}, {{practitionerName}} uses acupuncture and herbal support.]",
      "howItWorksBody": "[120-150 words. TCM patterns causing insomnia in plain language, how acupuncture regulates cortisol/melatonin/nervous system, role of herbal medicine.]",
      "whatToExpectBody": "[80-100 words. Sleep diary, lifestyle assessment, treatment plan 6-8 sessions, most notice improvement in 3-4 sessions.]",
      "testimonial": {
        "quote": "[2-3 sentences. Mentions sleep problems, how long suffered, improvement, {{practitionerName}}, {{city}}.]",
        "attribution": "[First name], {{city}}"
      },
      "faqAnswers": {
        "howQuickly": "[60-80 words. Many notice improvement in 3-4 sessions, full results typically 6-8 sessions.]",
        "replaceMedication": "[60-80 words. Complementary approach, do not stop medication without doctor, acupuncture can reduce dependence over time.]",
        "vsHerbal": "[60-80 words. Often combined for best results, acupuncture immediate calming effect, herbs support between sessions.]",
        "tcmPatterns": "[60-80 words. Heart-Kidney disharmony, Liver Qi stagnation explained in plain language.]"
      }
    },
    "conditionAnxiety": {
      "title": "Acupuncture for Anxiety in {{cityState}} | {{clinicName}} — max 60 chars",
      "description": "[150 chars max — anxiety/stress + city + calm/natural + CTA]",
      "h1": "Acupuncture for Anxiety in {{cityState}}",
      "openingParagraph": "[100-130 words. Anxiety symptoms (racing thoughts, tight chest, worry), TCM view of root causes, acupuncture regulates nervous system, mention {{clinicName}} in {{city}}, structured treatment plan.]",
      "howItWorksBody": "[120-150 words. Reduces sympathetic nervous system activity, increases parasympathetic response, TCM view of Liver Qi and Heart Yin, role of herbs.]",
      "whatToExpectBody": "[80-100 words. Intake covers anxiety triggers, sleep, digestion, treatment 8-12 sessions, what patients feel during/after.]",
      "testimonial": {
        "quote": "[2-3 sentences. Mentions anxiety/stress, what changed, {{practitionerName}}, {{city}}.]",
        "attribution": "[First name], {{city}}"
      },
      "faqAnswers": {
        "howMany": "[60-80 words. Typically 8-12 sessions, depends on severity and duration.]",
        "panicAttacks": "[60-80 words. Acupuncture can reduce frequency and intensity, not a crisis intervention tool.]",
        "withMedication": "[60-80 words. Generally safe alongside medication, always inform both practitioners, may reduce need over time.]",
        "whatItFeels": "[60-80 words. For anxious patients — fine needles, most find deeply calming, many fall asleep during treatment.]"
      }
    },
    "resourceCost": {
      "title": "Acupuncture Cost in {{cityState}} | {{clinicName}} — max 60 chars",
      "description": "[150 chars max — cost range + city + insurance mention + CTA]",
      "h1": "How Much Does Acupuncture Cost in {{cityState}}?",
      "directAnswer": "[60-80 words. State the price range ($75-$150) in first sentence. What the initial consultation includes vs follow-up. Most patients need 6-10 sessions. Mention {{clinicName}} in {{city}}.]",
      "whatAffectsCost": "[80-100 words. Session length, condition complexity, number of sessions, whether herbs are included, individual variation.]",
      "insuranceBody": "[80-100 words. Honest about NY coverage — some plans cover, many don't, always check with insurer. HSA/FSA accepted. What codes to ask insurer about.]",
      "worthItBody": "[60-80 words. Value framing — cost of ongoing medication/pain management vs course of acupuncture. Most patients need 6-10 sessions for lasting results. Total cost context.]",
      "testimonial": {
        "quote": "[2 sentences. Mentions value received, condition improved, {{city}}. No price specifics.]",
        "attribution": "[First name], {{city}}"
      },
      "faqAnswers": {
        "howMany": "[50-70 words. Typically 6-10 for most conditions, initial consultation determines plan.]",
        "insurance": "[60-80 words. Some NY plans cover, check your plan, we can provide receipts for reimbursement.]",
        "hsaFsa": "[40-60 words. Yes, HSA and FSA accepted, acupuncture is a qualified medical expense.]",
        "firstVisitDiscount": "[40-60 words. New patient special — mention if clinic offers one, or direct to contact page.]",
        "initialVsFollowup": "[50-70 words. Initial is longer (90 min) includes full intake and diagnosis. Follow-ups are 45-60 min.]"
      }
    }
  }
}
```

---

## O5 Code Implementation

**Production:** O5 (Claude content + `seo.md`, structured file updates) lives in **`app/api/admin/onboarding/route.ts`** — not a separate `o5-ai-content.mjs` step file. The block below is a **reference sketch** for the same responsibilities if splitting into a script later.

```javascript
// Call 2B — SEO page content generation (extended in V3.9)
async function generateSEOPageContent(intake) {
  const prompt = loadPromptTemplate('tcm/seo.md', intake);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: `You are an expert local SEO content writer for TCM clinics.
             Output only valid JSON. No markdown, no backticks, no explanation.`,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;

  try {
    return JSON.parse(text);
  } catch (e) {
    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }
}

// Apply generated SEO content to all page JSON files
async function applySEOContent(siteId, locale, seoContent) {
  const { seoPages } = seoContent;

  const pageUpdates = [
    {
      path: `pages/acupuncture-${intake.location.citySlug}-${intake.location.stateLower}.json`,
      contentKey: 'coreLanding',
      merge: (existing, generated) => ({
        ...existing,
        hero: {
          ...existing.hero,
          headline: generated.h1,
          subline: generated.heroIntro,
          trustText: generated.trustBarText
        },
        whyChooseUs: { items: generated.whyChooseUs },
        testimonials: { items: [generated.testimonial] },
        faq: { items: buildFaqItems(generated.faqAnswers) },
        location: { intro: generated.locationIntro },
        seo: {
          title: generated.title,
          description: generated.description,
          h1: generated.h1,
          canonicalUrl: `/en/acupuncture-${intake.location.citySlug}-${intake.location.stateLower}`,
          schema: ['LocalBusiness', 'Service', 'BreadcrumbList'],
          noindex: false,
          priority: 0.9
        }
      })
    },
    {
      path: `pages/acupuncture-for-back-pain-${intake.location.citySlug}.json`,
      contentKey: 'conditionBackPain',
      merge: buildConditionPageMerge('conditionBackPain', 'back-pain', intake)
    },
    {
      path: `pages/acupuncture-for-insomnia-${intake.location.citySlug}.json`,
      contentKey: 'conditionInsomnia',
      merge: buildConditionPageMerge('conditionInsomnia', 'insomnia', intake)
    },
    {
      path: `pages/acupuncture-for-anxiety-${intake.location.citySlug}.json`,
      contentKey: 'conditionAnxiety',
      merge: buildConditionPageMerge('conditionAnxiety', 'anxiety', intake)
    },
    {
      path: `pages/acupuncture-cost-${intake.location.citySlug}.json`,
      contentKey: 'resourceCost',
      merge: buildResourcePageMerge('resourceCost', 'cost', intake)
    }
  ];

  for (const update of pageUpdates) {
    const existing = await getContentEntry(siteId, locale, update.path);
    const generated = seoPages[update.contentKey];
    const merged = update.merge(existing, generated);
    await upsertContentEntry(siteId, locale, update.path, merged);
  }
}
```

---

## O7 Verify — Add SEO Page Checks

**Production:** Post-onboarding checks can be run with **`node scripts/verify-site.mjs <site-id>`** (includes `site_seo_pages` row counts). The snippet below is a **reference** for dedicated O7 step logic or extensions.

Add to `scripts/onboard/steps/o7-verify.mjs` (if maintained separately):

```javascript
// V3.9 — SEO page verification
const SEO_PAGE_PATHS = [
  `pages/acupuncture-${citySlug}-${stateLower}.json`,
  `pages/acupuncture-for-back-pain-${citySlug}.json`,
  `pages/acupuncture-for-insomnia-${citySlug}.json`,
  `pages/acupuncture-for-anxiety-${citySlug}.json`,
  `pages/acupuncture-cost-${citySlug}.json`
];

for (const pagePath of SEO_PAGE_PATHS) {
  const entry = await getContentEntry(siteId, locale, pagePath);

  if (!entry) {
    results.errors.push(`MISSING SEO PAGE: ${pagePath}`);
    continue;
  }

  const seo = entry?.seo;
  if (!seo?.title || !seo?.description || !seo?.h1 || !seo?.canonicalUrl) {
    results.warnings.push(`INCOMPLETE SEO OBJECT: ${pagePath} — missing title/description/h1/canonicalUrl`);
  }

  if (seo?.title?.length > 60) {
    results.warnings.push(`SEO TITLE TOO LONG: ${pagePath} — ${seo.title.length} chars`);
  }

  if (seo?.description?.length > 155) {
    results.warnings.push(`SEO DESCRIPTION TOO LONG: ${pagePath} — ${seo.description.length} chars`);
  }
}
```

---

## Testing the Extended O5

After implementing, test with a minimal Acu-Flushing intake:

```json
{
  "clientId": "acu-flushing-test",
  "templateSiteId": "dr-huang-clinic",
  "industry": "tcm",
  "business": {
    "name": "Flushing Acupuncture & TCM",
    "ownerName": "Dr. Li",
    "credentials": "L.Ac., DAOM",
    "languages": ["English", "Chinese", "Mandarin"]
  },
  "location": {
    "city": "Flushing",
    "state": "NY",
    "citySlug": "flushing",
    "stateLower": "ny",
    "address": "123 Main Street",
    "zip": "11354",
    "phone": "(718) 555-0000"
  },
  "seo": {
    "primaryService": "acupuncture",
    "specialties": ["back pain", "insomnia", "fertility", "anxiety"],
    "serviceAreaCities": ["Flushing", "Queens", "Forest Hills", "Jamaica"]
  }
}
```

Expected result: All 5 SEO pages generated with Flushing-specific content, all seo objects populated, O7 passes with zero errors.

**After onboarding (v1.1), also verify:**

- **`content_entries`** includes **`intake.json`** for the new `site_id`.  
- **`site_seo_pages`** has the expected rows for that `site_id` (cloned from template or created by `seed-seo-pages.mjs`).  
- Spot-check one **SEO slug** URL: `location` block shows the **new** address, phone, and map embed (not template NAP).  
- Run **`node scripts/verify-site.mjs <site-id>`** when Supabase is configured.
