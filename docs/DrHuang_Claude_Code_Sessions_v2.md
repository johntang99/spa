# Dr. Huang Clinic — Claude Code Session Guide
## SEO Retrofit: Sessions 0–8 (Dynamic Slug Architecture)

> **Version:** 2.0 — Revised for dynamic [slug] architecture
> **Date:** March 2026

---

## How to Use This File

Open Claude Code in your `medical-clinic/chinese-medicine` folder.

**Send this opening message once, before Session 0:**

```
Read these files before we begin:
- docs/DrHuang_Keyword_Map.md
- docs/DrHuang_Content_Briefs.md

Architecture context (critical):
This is a multi-site Next.js system. Dr. Huang Clinic,
Acu-Flushing, and Acu-Shi all share ONE codebase.
Sites are separated by site_id in Supabase — not by
separate folders or separate route files.

All page content lives in content_entries:
  site_id + locale + path → content JSON

Domain middleware resolves: domain → site_id
Same route, different domain = different content.

We will run 9 sessions to retrofit SEO pages.
Start with Session 0. After each session I will confirm
the done-gate before you proceed.

Ready — begin Session 0.
```

After each session finishes, confirm with:
`Done-gate confirmed. Proceed to Session [N].`

---

## Session 0 — Architecture Foundation

> **Goal:** Delete hardcoded city route folders. Create single dynamic `[slug]/page.tsx` that serves all SEO pages for all sites. Create `site_seo_pages` DB table.
> **Time estimate:** 45–60 minutes
> **Must run before any other session.**

---

```
Problem to fix first:
Previous work created hardcoded city route folders:
  app/[locale]/acupuncture-middletown-ny/
  app/[locale]/acupuncture-for-back-pain-middletown-ny/
  app/[locale]/acupuncture-for-insomnia-middletown-ny/
  app/[locale]/acupuncture-for-anxiety-middletown-ny/

These break when two clinics share a city and do not
scale to multiple sites. Delete them all.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — Delete hardcoded city route folders
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Delete these folders and all files inside them:
  app/[locale]/acupuncture-middletown-ny/
  app/[locale]/acupuncture-for-back-pain-middletown-ny/
  app/[locale]/acupuncture-for-insomnia-middletown-ny/
  app/[locale]/acupuncture-for-anxiety-middletown-ny/

Do NOT delete: about/, services/, contact/, blog/, book/
or any other named route without a city in the folder name.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — Create app/[locale]/[slug]/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This single file handles ALL SEO pages for ALL sites.

import { notFound } from 'next/navigation'
import { getSiteIdFromDomain } from '@/lib/site-resolver'
import { loadContentEntry } from '@/lib/content'
import { getSEOPagesForSite } from '@/lib/seo-pages'
import SEOLocalLandingLayout from '@/components/seo/SEOLocalLandingLayout'
import SEOConditionLayout from '@/components/seo/SEOConditionLayout'
import SEOResourceLayout from '@/components/seo/SEOResourceLayout'
import type { Metadata } from 'next'

interface Props {
  params: { locale: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params
  const siteId = await getSiteIdFromDomain()
  const content = await loadContentEntry(siteId, locale, slug)
  if (!content) return {}
  return {
    title: content.seo?.title,
    description: content.seo?.description,
    alternates: { canonical: content.seo?.canonicalUrl },
    openGraph: {
      title: content.seo?.ogTitle ?? content.seo?.title,
      description: content.seo?.ogDescription ?? content.seo?.description,
    },
  }
}

export async function generateStaticParams() {
  const siteId = await getSiteIdFromDomain()
  const pages = await getSEOPagesForSite(siteId)
  return pages.map((p) => ({ slug: p.slug }))
}

export default async function SEOPage({ params }: Props) {
  const { locale, slug } = params
  const siteId = await getSiteIdFromDomain()
  const content = await loadContentEntry(siteId, locale, slug)
  if (!content) notFound()

  switch (content.pageType) {
    case 'seo-local-landing':
      return <SEOLocalLandingLayout content={content} locale={locale} />
    case 'seo-condition':
      return <SEOConditionLayout content={content} locale={locale} />
    case 'seo-resource':
      return <SEOResourceLayout content={content} locale={locale} />
    default:
      notFound()
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — Create lib/seo-pages.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create lib/seo-pages.ts:

import { createClient } from '@/lib/supabase'

export interface SEOPage {
  site_id: string
  slug: string
  page_type: 'seo-local-landing' | 'seo-condition' | 'seo-resource' | 'seo-near-location'
  active: boolean
}

export async function getSEOPagesForSite(siteId: string): Promise<SEOPage[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('site_seo_pages')
    .select('*')
    .eq('site_id', siteId)
    .eq('active', true)
  return data ?? []
}

export async function registerSEOPage(
  siteId: string,
  slug: string,
  pageType: SEOPage['page_type']
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('site_seo_pages')
    .upsert(
      { site_id: siteId, slug, page_type: pageType, active: true },
      { onConflict: 'site_id,slug' }
    )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — Create site_seo_pages table in Supabase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run this SQL in Supabase SQL editor:

CREATE TABLE IF NOT EXISTS site_seo_pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     text NOT NULL,
  slug        text NOT NULL,
  page_type   text NOT NULL CHECK (page_type IN (
                'seo-local-landing','seo-condition',
                'seo-resource','seo-near-location')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (site_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_site_seo_pages_site
  ON site_seo_pages (site_id, active);

ALTER TABLE site_seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active"
  ON site_seo_pages FOR SELECT USING (active = true);

CREATE POLICY "service_manage"
  ON site_seo_pages FOR ALL USING (auth.role() = 'service_role');

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — Create layout component stubs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create these 3 stub files (real implementation in Sessions 2-6):

components/seo/SEOLocalLandingLayout.tsx:
export default function SEOLocalLandingLayout({ content, locale }) {
  return <div><h1>{content.seo?.h1}</h1><p>Stub — Session 2</p></div>
}

components/seo/SEOConditionLayout.tsx:
export default function SEOConditionLayout({ content, locale }) {
  return <div><h1>{content.seo?.h1}</h1><p>Stub — Session 3</p></div>
}

components/seo/SEOResourceLayout.tsx:
export default function SEOResourceLayout({ content, locale }) {
  return <div><h1>{content.seo?.h1}</h1><p>Stub — Session 6</p></div>
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — Update sitemap to include SEO pages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Find the existing sitemap file. Add this block to pull
SEO pages from site_seo_pages:

import { getSEOPagesForSite } from '@/lib/seo-pages'

// Inside the sitemap function, after existing entries:
const siteId = await getSiteIdFromDomain()
const domain = await getDomainForSite(siteId)
const seoPages = await getSEOPagesForSite(siteId)

const seoEntries = seoPages.map((p) => ({
  url: `https://${domain}/en/${p.slug}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: p.page_type === 'seo-local-landing' ? 0.9 : 0.8,
}))

return [...existingEntries, ...seoEntries]

━━━━━━━━━━━━━━━━━━━━━━━
SESSION 0 DONE-GATE
━━━━━━━━━━━━━━━━━━━━━━━

- [ ] All hardcoded city route folders deleted
- [ ] app/[locale]/[slug]/page.tsx created and compiles
- [ ] lib/seo-pages.ts created
- [ ] site_seo_pages table exists in Supabase
      (confirm: SELECT count(*) FROM site_seo_pages)
- [ ] 3 layout stubs compile without errors
- [ ] Sitemap updated to query site_seo_pages
- [ ] npm run dev has zero TypeScript errors
- [ ] Existing routes /en/about, /en/services, /en/contact
      still return 200

Output PASS/FAIL for each item.
```

---

## Session 1 — Add `seo` Object to Existing Pages

> **Goal:** Add `seo` field to existing content_entries rows for the standard named pages.
> **Time estimate:** 20–30 minutes

---

```
Read: docs/DrHuang_Keyword_Map.md (seo object templates)

Task: Update existing content_entries rows for site_id =
'[dr-huang site_id]' to add a seo field. Find the site_id
by querying: SELECT id, slug FROM sites WHERE name ILIKE '%huang%'

For each path below, find the row and add/update the seo field.
Do NOT change any other content fields.

path = 'home' (or '' or '/' — check what exists in DB):
  seo.title: "Dr. Huang Clinic — Acupuncture & TCM in Middletown, NY"
  seo.description: "Dr. Huang Clinic offers acupuncture, herbal medicine & TCM in Middletown, NY. Care for pain, sleep, stress & more. Book today."
  seo.canonicalUrl: "/en"
  seo.schema: ["LocalBusiness","MedicalClinic","BreadcrumbList"]
  seo.noindex: false
  seo.priority: 1.0

path = 'about':
  seo.title: "About Dr. Huang Clinic — Acupuncture in Middletown, NY"
  seo.description: "Meet Dr. Huang — experienced TCM practitioner in Middletown, NY. Learn about our approach to traditional Chinese medicine."
  seo.canonicalUrl: "/en/about"
  seo.schema: ["AboutPage","BreadcrumbList"]
  seo.noindex: false
  seo.priority: 0.8

path = 'services':
  seo.title: "Acupuncture & TCM Services — Dr. Huang Clinic Middletown NY"
  seo.description: "Acupuncture, Chinese herbal medicine, cupping & more at Dr. Huang Clinic in Middletown, NY. Book today."
  seo.canonicalUrl: "/en/services"
  seo.schema: ["Service","BreadcrumbList"]
  seo.noindex: false
  seo.priority: 0.8

path = 'contact':
  seo.title: "Contact Dr. Huang Clinic — Middletown, NY Acupuncture"
  seo.description: "Book an acupuncture appointment at Dr. Huang Clinic in Middletown, NY. Call us or use our online form."
  seo.canonicalUrl: "/en/contact"
  seo.schema: ["ContactPage","BreadcrumbList"]
  seo.noindex: false
  seo.priority: 0.7

Done-gate:
- [ ] All 4 rows updated — confirm with:
      SELECT path, content->'seo'->>'title' as title
      FROM content_entries
      WHERE site_id='[id]' AND path IN ('home','about','services','contact')
- [ ] Page <title> tags render correctly on each page
- [ ] No TypeScript errors
```

---

## Session 2 — SEOLocalLandingLayout + Core Landing Page Content

> **Goal:** Build `SEOLocalLandingLayout` component. Seed DrHuang core landing page into DB.
> **Time estimate:** 45–60 minutes

---

```
Read: docs/DrHuang_Content_Briefs.md (Brief 1 — Core Local Landing Page)

This session has two parts: build the layout component,
then seed the content into DB.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A — Build SEOLocalLandingLayout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the stub at components/seo/SEOLocalLandingLayout.tsx.

The component receives content with this shape:
{
  pageType: 'seo-local-landing',
  seo: { title, description, h1, canonicalUrl, schema[] },
  hero: {
    h1, subheading, intro, ctaLabel, ctaHref,
    trustItems: [{ value, label }]
  },
  conditions: {
    heading, intro,
    items: [{ name, slug }]   // slug used to build /[locale]/[slug] links
  },
  services: {
    heading,
    items: [{ name, description }]
  },
  whyChooseUs: {
    heading,
    items: [{ title, body }],
    testimonial: { quote, attribution }
  },
  faq: {
    heading,
    items: [{ question, answer }]
  },
  location: {
    heading, intro, mapEmbedUrl,
    nap: { name, address, city, state, zip, phone },
    hours: [{ day, hours }],
    ctaLabel, ctaHref
  }
}

6-section layout (Brief 1 order):
1. Hero — h1, subheading, intro text, CTA button, trust bar
2. Conditions grid — conditions.items, each links to /[locale]/[item.slug]
3. Services — service cards
4. Why Choose Us — trust items + testimonial blockquote
5. FAQ accordion — interactive open/close, FAQPage schema markup
6. Location — map embed, NAP block with schema, hours, CTA

Rules:
- Theme CSS variables only, no hardcoded colors
- FAQ accordion must work with vanilla JS or React state
- NAP block wrapped in LocalBusiness schema JSON-LD
- Mobile responsive at 375px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B — Seed core landing page
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Upsert into content_entries:
  site_id: [dr-huang id],
  locale: 'en',
  path: 'acupuncture-middletown-ny',
  content: {
    pageType: 'seo-local-landing',
    seo: {
      title: 'Acupuncture in Middletown, NY | Dr. Huang Clinic',
      description: 'Expert acupuncture & TCM in Middletown, NY. Back pain, insomnia, stress & more. Book your first visit with Dr. Huang today.',
      h1: 'Acupuncture in Middletown, NY',
      canonicalUrl: '/en/acupuncture-middletown-ny',
      schema: ['LocalBusiness','Service','BreadcrumbList'],
      noindex: false,
      priority: 0.9
    },
    hero: {
      h1: 'Acupuncture in Middletown, NY',
      subheading: 'Dr. Huang Clinic — Traditional Chinese Medicine & Acupuncture',
      intro: 'Dr. Huang Clinic has provided expert acupuncture and Traditional Chinese Medicine to patients in Middletown, NY for over [X] years. We treat the root cause of pain, sleep disorders, stress, and more with personalized TCM care.',
      ctaLabel: 'Book Your First Visit',
      ctaHref: '/en/contact',
      trustItems: [
        { value: '[X]+', label: 'Years in Practice' },
        { value: '[X]+', label: 'Patients Treated' },
        { value: '5.0★', label: 'Google Rating' }
      ]
    },
    conditions: {
      heading: 'What Conditions Can Acupuncture Help With?',
      intro: 'Acupuncture treats the root cause, not just the symptom:',
      items: [
        { name: 'Back Pain', slug: 'acupuncture-for-back-pain-middletown-ny' },
        { name: 'Insomnia', slug: 'acupuncture-for-insomnia-middletown-ny' },
        { name: 'Anxiety & Stress', slug: 'acupuncture-for-anxiety-middletown-ny' },
        { name: 'Fertility Support', slug: 'fertility-acupuncture-middletown-ny' },
        { name: 'Neck Pain', slug: 'acupuncture-middletown-ny' },
        { name: 'Digestive Issues', slug: 'acupuncture-middletown-ny' },
        { name: 'Headaches', slug: 'acupuncture-middletown-ny' },
        { name: 'Fatigue', slug: 'acupuncture-middletown-ny' }
      ]
    },
    services: {
      heading: 'Acupuncture & TCM Services at Dr. Huang Clinic',
      items: [
        { name: 'Acupuncture', description: 'Precision needle therapy targeting specific points to restore balance and relieve pain.' },
        { name: 'Chinese Herbal Medicine', description: 'Custom herbal formulas prescribed to support treatment between sessions.' },
        { name: 'Cupping Therapy', description: 'Suction cups to improve circulation and release muscle tension.' },
        { name: 'Moxibustion', description: 'Warming therapy using dried mugwort to stimulate healing.' },
        { name: 'Tui Na', description: 'Chinese therapeutic massage targeting meridians and acupressure points.' }
      ]
    },
    whyChooseUs: {
      heading: 'Why Patients Choose Dr. Huang Clinic in Middletown, NY',
      items: [
        { title: 'Experienced & Credentialed', body: 'Dr. Huang holds [credentials] with [X]+ years treating patients in Middletown and the Hudson Valley.' },
        { title: 'Personalized Treatment', body: 'Every patient receives a full intake and diagnosis. Your plan is tailored to your specific condition.' },
        { title: 'Multilingual Care', body: 'We serve patients in English and Chinese, making quality TCM accessible to Middletown\'s diverse community.' }
      ],
      testimonial: {
        quote: 'After years of chronic back pain I finally found relief at Dr. Huang Clinic. Within 6 sessions I was pain-free. The care here is unlike anything else in Middletown.',
        attribution: 'Maria S., Middletown, NY'
      }
    },
    faq: {
      heading: 'Frequently Asked Questions About Acupuncture in Middletown, NY',
      items: [
        { question: 'How much does acupuncture cost in Middletown, NY?', answer: 'Sessions at Dr. Huang Clinic range from $[X] to $[X]. See our full cost breakdown and new patient specials.' },
        { question: 'Is acupuncture painful?', answer: 'We use ultra-fine gauge needles. Most patients feel minimal discomfort and many find treatment deeply relaxing.' },
        { question: 'How many sessions will I need?', answer: 'Most conditions respond well within 6–10 sessions. Your initial consultation includes a specific treatment plan.' },
        { question: 'Does insurance cover acupuncture in New York?', answer: 'Some NY plans cover acupuncture. We recommend checking with your insurer. We accept HSA and FSA payments.' },
        { question: 'What should I expect at my first visit?', answer: 'Your first visit (60–90 min) includes a full intake, TCM diagnosis, and your first treatment. Wear loose, comfortable clothing.' },
        { question: 'Do you offer treatment in Chinese?', answer: 'Yes — Dr. Huang sees patients in English and Chinese (Mandarin and Cantonese).' }
      ]
    },
    location: {
      heading: 'Visit Dr. Huang Clinic in Middletown, NY',
      intro: 'Serving patients from Middletown, Goshen, Newburgh, Wallkill, and the Hudson Valley.',
      mapEmbedUrl: '[GOOGLE_MAPS_EMBED_URL]',
      nap: { name: 'Dr. Huang Clinic', address: '[ADDRESS]', city: 'Middletown', state: 'NY', zip: '[ZIP]', phone: '[PHONE]' },
      hours: [
        { day: 'Monday–Friday', hours: '[HOURS]' },
        { day: 'Saturday', hours: '[HOURS]' },
        { day: 'Sunday', hours: 'Closed' }
      ],
      ctaLabel: 'Book Your Appointment',
      ctaHref: '/en/contact'
    }
  }

Upsert into site_seo_pages:
  { site_id: [id], slug: 'acupuncture-middletown-ny',
    page_type: 'seo-local-landing', active: true }

Update homepage content_entries: add a link to this page
in the services or hero section, anchor: "Acupuncture in Middletown, NY"

━━━━━━━━━━━━━━━━━━━━━━━
SESSION 2 DONE-GATE
━━━━━━━━━━━━━━━━━━━━━━━

- [ ] /en/acupuncture-middletown-ny returns 200
- [ ] H1: "Acupuncture in Middletown, NY"
- [ ] All 6 sections render in correct order
- [ ] FAQ accordion opens and closes
- [ ] site_seo_pages has 1 row for this slug
- [ ] Homepage links to this page
- [ ] <title> in <head> matches seo.title
- [ ] No TypeScript errors
```

---

## Session 3 — SEOConditionLayout + Back Pain Page

> **Goal:** Build `SEOConditionLayout` component. Seed back pain condition page.
> **Time estimate:** 35–45 minutes

---

```
Read: docs/DrHuang_Content_Briefs.md (Brief 2 — Back Pain)

PART A — Build SEOConditionLayout

Replace stub at components/seo/SEOConditionLayout.tsx.

Content shape:
{
  pageType: 'seo-condition',
  condition: string,
  seo: { ... },
  hero: { h1, openingParagraph, ctaLabel, ctaHref },
  howItWorks: { heading, body },
  whatToExpect: { heading, body },
  testimonial: { heading, quote, attribution },
  faq: { heading, items: [{ question, answer }] },
  relatedConditions: { heading, links: [{ label, slug }] },
  cta: { label, href }
}

6-section layout (Brief 2 order):
1. Hero — H1, openingParagraph (100-130 words), CTA button
2. How It Works — H2, body
3. What to Expect — H2, body
4. Patient Story — H2, testimonial blockquote
5. FAQ accordion — H2, 4 questions, FAQPage schema JSON-LD
6. Related Conditions + CTA — H2, links, final CTA button

Rules: breadcrumb at top, same theme tokens, mobile responsive.

PART B — Seed back pain page

Upsert content_entries:
  site_id: [dr-huang id], locale: 'en',
  path: 'acupuncture-for-back-pain-middletown-ny',
  content: {
    pageType: 'seo-condition',
    condition: 'back-pain',
    seo: {
      title: 'Acupuncture for Back Pain in Middletown, NY | Dr. Huang Clinic',
      description: 'Relieve back pain naturally with acupuncture at Dr. Huang Clinic in Middletown, NY. Proven results, personalized care. Book today.',
      h1: 'Acupuncture for Back Pain in Middletown, NY',
      canonicalUrl: '/en/acupuncture-for-back-pain-middletown-ny',
      schema: ['Service','FAQPage','BreadcrumbList'],
      noindex: false, priority: 0.8
    },
    hero: {
      h1: 'Acupuncture for Back Pain in Middletown, NY',
      openingParagraph: 'Back pain affects millions of Americans — from dull, persistent aches to sharp pain that disrupts daily life. Most cases involve muscle tension, poor circulation, nerve irritation, or structural imbalance. Acupuncture addresses these root causes by stimulating specific points that release tension, improve blood flow, and activate the body\'s natural pain-relief response. At Dr. Huang Clinic in Middletown, NY, Dr. Huang has helped hundreds of patients reduce or eliminate back pain without long-term medication.',
      ctaLabel: 'Book a Back Pain Consultation',
      ctaHref: '/en/contact'
    },
    howItWorks: {
      heading: 'How Acupuncture Relieves Back Pain',
      body: 'Acupuncture inserts ultra-fine needles at specific anatomical points along the body\'s meridians. For back pain, treatment focuses on releasing tight musculature along the spine, stimulating circulation to inflamed tissues, and regulating the nervous system\'s pain signaling. Dr. Huang treats lower back pain, upper back tension, sciatica, disc-related pain, and post-injury muscle spasm. Most patients notice significant pain reduction within 3–4 sessions. A typical course is 6–10 sessions depending on chronicity and severity.'
    },
    whatToExpect: {
      heading: 'What Happens During Your Back Pain Treatment',
      body: 'Your first visit includes a full TCM diagnosis — posture, movement, tongue, and pulse assessment to identify the pattern causing your pain. Treatment begins on the first visit: fine needles placed at specific points for 15–30 minutes. Most patients find this deeply relaxing. A follow-up plan including recommended frequency and session count is provided at the end of your first appointment.'
    },
    testimonial: {
      heading: 'Real Results for Middletown Patients',
      quote: 'I had lower back pain for three years and tried physiotherapy, medication, and injections — nothing lasted. After 8 sessions with Dr. Huang I was completely pain-free and have stayed that way for over a year.',
      attribution: 'James T., Middletown, NY'
    },
    faq: {
      heading: 'Back Pain Acupuncture — Common Questions',
      items: [
        { question: 'Can acupuncture fix back pain permanently?', answer: 'Many patients achieve long-lasting or permanent relief, particularly for muscular and tension-based pain. Results depend on the cause, duration, and lifestyle factors. Dr. Huang provides an honest prognosis at your first visit.' },
        { question: 'How many acupuncture sessions do I need for back pain?', answer: 'Most patients see significant improvement within 6–10 sessions. Chronic conditions may need a longer initial course followed by periodic maintenance.' },
        { question: 'Is acupuncture better than physiotherapy for back pain?', answer: 'They are complementary. Acupuncture excels at treating root patterns and reducing systemic inflammation. Many Dr. Huang Clinic patients do both simultaneously for faster results.' },
        { question: 'Does acupuncture for back pain hurt?', answer: 'We use ultra-fine gauge needles — far thinner than a hypodermic needle. Most patients feel minimal sensation and many fall asleep during treatment.' }
      ]
    },
    relatedConditions: {
      heading: 'Other Conditions We Treat at Dr. Huang Clinic',
      links: [
        { label: 'Acupuncture for Insomnia', slug: 'acupuncture-for-insomnia-middletown-ny' },
        { label: 'Acupuncture for Anxiety', slug: 'acupuncture-for-anxiety-middletown-ny' },
        { label: 'Fertility Acupuncture', slug: 'fertility-acupuncture-middletown-ny' }
      ]
    },
    cta: { label: 'Book a Back Pain Consultation', href: '/en/contact' }
  }

Upsert site_seo_pages:
  { site_id: [id], slug: 'acupuncture-for-back-pain-middletown-ny',
    page_type: 'seo-condition', active: true }

Also update core landing page conditions.items so
'Back Pain' slug = 'acupuncture-for-back-pain-middletown-ny'

━━━━━━━━━━━━━━━━━━━━━━━
SESSION 3 DONE-GATE
━━━━━━━━━━━━━━━━━━━━━━━

- [ ] /en/acupuncture-for-back-pain-middletown-ny returns 200
- [ ] H1 correct, all 6 sections render
- [ ] FAQ accordion works
- [ ] Breadcrumb: Home > Acupuncture Middletown > Back Pain
- [ ] site_seo_pages row inserted
- [ ] Core landing page back-pain condition link updated
- [ ] No TypeScript errors
```

---

## Session 4 — Seed Insomnia Condition Page

> **Goal:** Seed insomnia page. `SEOConditionLayout` already built.
> **Time estimate:** 20 minutes — DB seed only, no new components.

---

```
Read: docs/DrHuang_Content_Briefs.md (Brief 3 — Insomnia)

Upsert content_entries:
  path: 'acupuncture-for-insomnia-middletown-ny'
  content: {
    pageType: 'seo-condition', condition: 'insomnia',
    seo: {
      title: 'Acupuncture for Insomnia in Middletown, NY | Dr. Huang Clinic',
      description: 'Struggling with sleep? Acupuncture at Dr. Huang Clinic in Middletown, NY helps restore natural sleep patterns. Book a visit today.',
      h1: 'Acupuncture for Insomnia in Middletown, NY',
      canonicalUrl: '/en/acupuncture-for-insomnia-middletown-ny',
      schema: ['Service','FAQPage','BreadcrumbList'],
      noindex: false, priority: 0.8
    },
    hero: {
      h1: 'Acupuncture for Insomnia in Middletown, NY',
      openingParagraph: 'Insomnia affects 1 in 3 adults — difficulty falling asleep, staying asleep, or waking too early. In Traditional Chinese Medicine these patterns reflect underlying imbalances in the nervous system, stress hormones, or organ function. Acupuncture treats these root causes rather than masking symptoms with medication. At Dr. Huang Clinic in Middletown, NY, Dr. Huang uses acupuncture and herbal support to calm the nervous system and restore natural, sustained sleep.',
      ctaLabel: 'Book a Sleep Consultation',
      ctaHref: '/en/contact'
    },
    howItWorks: {
      heading: 'How Acupuncture Restores Healthy Sleep',
      body: 'Acupuncture regulates cortisol and melatonin production, reduces sympathetic nervous system activity, and calms the Heart and Liver systems that govern sleep in TCM. The most common insomnia patterns — Heart-Kidney disharmony (difficulty falling asleep), Liver Qi stagnation (waking 1–3am), and Blood deficiency (light unrefreshing sleep) — each respond to specific acupuncture point protocols. Chinese herbal medicine prescribed alongside treatment extends and reinforces the calming effect between sessions.'
    },
    whatToExpect: {
      heading: 'Your Insomnia Treatment Plan at Dr. Huang Clinic',
      body: 'Your first visit includes a sleep diary review, lifestyle and stress assessment, and TCM diagnosis. Treatment plans typically run 6–8 sessions. Most patients notice meaningful improvement in sleep quality within the first 3–4 sessions — falling asleep faster, waking less frequently, and feeling more rested. Dr. Huang also provides dietary and lifestyle recommendations to support the treatment.'
    },
    testimonial: {
      heading: 'Real Results for Middletown Patients',
      quote: 'I had not slept more than 4 hours straight in two years. After 5 sessions with Dr. Huang I was sleeping 7 hours consistently. I wish I had found this clinic sooner.',
      attribution: 'Sandra K., Middletown, NY'
    },
    faq: {
      heading: 'Acupuncture for Sleep — Common Questions',
      items: [
        { question: 'How quickly does acupuncture work for insomnia?', answer: 'Many patients notice improvement within 3–4 sessions. Full results typically emerge over a 6–8 session course. The effect is cumulative — each session builds on the last.' },
        { question: 'Can acupuncture replace sleep medication?', answer: 'Do not stop prescribed medication without consulting your doctor. Acupuncture is complementary — many patients find it reduces their dependence on sleep aids over time, but this should be a gradual, medically supervised process.' },
        { question: 'Is acupuncture or herbal medicine better for sleep?', answer: 'Both work best together. Acupuncture provides immediate nervous system calming. Chinese herbs prescribed by Dr. Huang sustain the effect between sessions and address deeper constitutional patterns.' },
        { question: 'What TCM patterns cause insomnia?', answer: 'The most common are Heart-Kidney disharmony (restlessness, difficulty falling asleep), Liver Qi stagnation (waking between 1–3am, vivid dreams), and Blood deficiency (light sleep, waking unrefreshed). Dr. Huang identifies your pattern at the first visit.' }
      ]
    },
    relatedConditions: {
      heading: 'Other Conditions We Treat at Dr. Huang Clinic',
      links: [
        { label: 'Acupuncture for Back Pain', slug: 'acupuncture-for-back-pain-middletown-ny' },
        { label: 'Acupuncture for Anxiety', slug: 'acupuncture-for-anxiety-middletown-ny' },
        { label: 'Fertility Acupuncture', slug: 'fertility-acupuncture-middletown-ny' }
      ]
    },
    cta: { label: 'Book a Sleep Consultation', href: '/en/contact' }
  }

Upsert site_seo_pages:
  { slug: 'acupuncture-for-insomnia-middletown-ny',
    page_type: 'seo-condition', active: true }

Update core landing page conditions.items:
'Insomnia' slug = 'acupuncture-for-insomnia-middletown-ny'

Done-gate:
- [ ] /en/acupuncture-for-insomnia-middletown-ny returns 200
- [ ] H1 correct, site_seo_pages row inserted
- [ ] Core landing conditions link updated
```

---

## Session 5 — Seed Anxiety Condition Page

> **Goal:** Seed anxiety page. Same pattern as Session 4.
> **Time estimate:** 20 minutes

---

```
Read: docs/DrHuang_Content_Briefs.md (Brief 4 — Anxiety)

Upsert content_entries:
  path: 'acupuncture-for-anxiety-middletown-ny'
  content: {
    pageType: 'seo-condition', condition: 'anxiety',
    seo: {
      title: 'Acupuncture for Anxiety in Middletown, NY | Dr. Huang Clinic',
      description: 'Find calm with acupuncture at Dr. Huang Clinic in Middletown, NY. Natural relief for anxiety, stress & nervous tension. Book today.',
      h1: 'Acupuncture for Anxiety in Middletown, NY',
      canonicalUrl: '/en/acupuncture-for-anxiety-middletown-ny',
      schema: ['Service','FAQPage','BreadcrumbList'],
      noindex: false, priority: 0.8
    },
    hero: {
      h1: 'Acupuncture for Anxiety in Middletown, NY',
      openingParagraph: 'Anxiety shows up differently for everyone — racing thoughts, tight chest, persistent worry, difficulty concentrating. In TCM these symptoms reflect imbalances in the Heart, Liver, or Kidney systems. Acupuncture regulates the nervous system, lowers cortisol, and promotes a sustained sense of calm that many patients describe as unlike anything medication has provided. Dr. Huang Clinic in Middletown, NY offers a structured treatment plan tailored to your specific anxiety pattern.',
      ctaLabel: 'Book an Anxiety Consultation',
      ctaHref: '/en/contact'
    },
    howItWorks: {
      heading: 'How Acupuncture Calms the Anxious Mind',
      body: 'Acupuncture reduces sympathetic (fight-or-flight) nervous system activity and increases parasympathetic (rest-and-digest) response. For anxiety, treatment targets points that calm the Heart (Shen), smooth Liver Qi stagnation, and tonify the Kidney system that governs our sense of security. Chinese herbal formulas prescribed between sessions sustain the calming effect and address deeper constitutional imbalances that maintain the anxiety pattern.'
    },
    whatToExpect: {
      heading: 'Your Anxiety Treatment Plan at Dr. Huang Clinic',
      body: 'Your intake covers anxiety triggers, sleep quality, digestion, and relevant history. Treatment typically runs 8–12 sessions. Patients often notice a meaningful shift in anxiety intensity within the first 4–6 sessions — a reduction in baseline worry, better sleep, and greater resilience to stressors. Dr. Huang provides realistic expectations and a clear treatment plan at your first visit.'
    },
    testimonial: {
      heading: 'Real Results for Middletown Patients',
      quote: 'I had generalised anxiety for most of my adult life. Medication helped but left me foggy. After 10 sessions with Dr. Huang I feel calm and clear in a way I never thought possible. The results have been profound.',
      attribution: 'Rachel M., Middletown, NY'
    },
    faq: {
      heading: 'Acupuncture for Anxiety — Common Questions',
      items: [
        { question: 'How many sessions does it take to help anxiety?', answer: 'Most patients notice a shift within 4–6 sessions. A full course is typically 8–12 sessions. Chronic or severe anxiety may benefit from a longer plan and herbal support.' },
        { question: 'Can acupuncture help panic attacks?', answer: 'Acupuncture can reduce the frequency and intensity of panic attacks by regulating the nervous system. It is not a crisis intervention — for acute panic, seek emergency care. As a preventive treatment it is highly effective.' },
        { question: 'Is acupuncture safe alongside anti-anxiety medication?', answer: 'Generally yes. Always inform both your prescribing doctor and Dr. Huang of all medications. Many patients find that acupuncture allows them to reduce dosage over time under medical supervision.' },
        { question: 'What does acupuncture feel like for an anxious person?', answer: 'Most anxious patients are surprised by how quickly they relax. The treatment room is calm and quiet. Many find acupuncture the most relaxing part of their week — some fall asleep during treatment.' }
      ]
    },
    relatedConditions: {
      heading: 'Other Conditions We Treat at Dr. Huang Clinic',
      links: [
        { label: 'Acupuncture for Back Pain', slug: 'acupuncture-for-back-pain-middletown-ny' },
        { label: 'Acupuncture for Insomnia', slug: 'acupuncture-for-insomnia-middletown-ny' },
        { label: 'Fertility Acupuncture', slug: 'fertility-acupuncture-middletown-ny' }
      ]
    },
    cta: { label: 'Book an Anxiety Consultation', href: '/en/contact' }
  }

Upsert site_seo_pages:
  { slug: 'acupuncture-for-anxiety-middletown-ny',
    page_type: 'seo-condition', active: true }

Update core landing page conditions.items:
'Anxiety & Stress' slug = 'acupuncture-for-anxiety-middletown-ny'

Done-gate: same as Session 4.
```

---

## Session 6 — SEOResourceLayout + Cost Page

> **Goal:** Build `SEOResourceLayout` component. Seed cost resource page.
> **Time estimate:** 35–45 minutes

---

```
Read: docs/DrHuang_Content_Briefs.md (Brief 5 — Cost Page)

PART A — Build SEOResourceLayout

Replace stub at components/seo/SEOResourceLayout.tsx.

Content shape:
{
  pageType: 'seo-resource',
  resourceType: string,
  seo: { ... },
  directAnswer: { h1, body, ctaLabel, ctaHref },
  priceBreakdown: { heading, items: [{ label, price }] },
  whatAffectsCost: { heading, body },
  insurance: { heading, body },
  worthIt: { heading, body, testimonial: { quote, attribution } },
  faq: { heading, items: [{ question, answer }] },
  cta: { label, href }
}

CRITICAL layout rule:
directAnswer.body must appear ABOVE the fold.
H1 is a question. First paragraph answers it directly.
This is different from condition pages — do not bury the answer.

7-section layout (Brief 5 order):
1. Direct Answer — H1 (question), price in first paragraph, CTA
2. Price Breakdown — table or clear list
3. What Affects Cost — H2, prose
4. Insurance & Payment — H2, prose
5. Is It Worth It? — H2, prose + testimonial
6. FAQ accordion — 5 questions, FAQPage schema
7. Final CTA

PART B — Seed cost page

Upsert content_entries:
  path: 'acupuncture-cost-middletown-ny'
  content: {
    pageType: 'seo-resource', resourceType: 'cost',
    seo: {
      title: 'Acupuncture Cost in Middletown, NY | Dr. Huang Clinic',
      description: 'Acupuncture costs $75–$150/session in Middletown, NY. See what\'s included, insurance options & new patient specials at Dr. Huang Clinic.',
      h1: 'How Much Does Acupuncture Cost in Middletown, NY?',
      canonicalUrl: '/en/acupuncture-cost-middletown-ny',
      schema: ['FAQPage','BreadcrumbList'],
      noindex: false, priority: 0.7
    },
    directAnswer: {
      h1: 'How Much Does Acupuncture Cost in Middletown, NY?',
      body: 'At Dr. Huang Clinic in Middletown, NY, acupuncture sessions range from $[X] for a follow-up treatment to $[X] for an initial consultation and treatment. Most patients complete 6–10 sessions for lasting results — a total investment of $[X]–$[X] depending on the condition.',
      ctaLabel: 'See New Patient Specials',
      ctaHref: '/en/contact'
    },
    priceBreakdown: {
      heading: 'Dr. Huang Clinic Acupuncture Pricing',
      items: [
        { label: 'Initial Consultation + Treatment (90 min)', price: '$[X]' },
        { label: 'Follow-up Session (60 min)', price: '$[X]' },
        { label: 'Follow-up Session (45 min)', price: '$[X]' },
        { label: 'Package of 5 Sessions', price: '$[X]' },
        { label: 'Chinese Herbal Medicine (if prescribed)', price: '$[X]/formula' }
      ]
    },
    whatAffectsCost: {
      heading: 'What Affects Acupuncture Costs in New York?',
      body: 'Session length, the complexity of your condition, number of sessions required, and whether herbal medicine is included all affect the total cost. Chronic conditions typically require more sessions than acute ones. Dr. Huang provides a realistic treatment plan and cost estimate at your first visit — no open-ended commitments.'
    },
    insurance: {
      heading: 'Does Insurance Cover Acupuncture in New York?',
      body: 'Coverage varies. Some NY plans including certain Medicare Advantage plans now cover acupuncture for back pain. Call your insurer and ask about CPT codes 97810–97814. We accept HSA and FSA payments and provide detailed receipts for out-of-network reimbursement claims.'
    },
    worthIt: {
      heading: 'Is Acupuncture Worth the Cost?',
      body: 'A typical acupuncture course at Dr. Huang Clinic resolves most conditions within 6–10 sessions. For patients who have spent thousands on other treatments without lasting relief, acupuncture often delivers the most cost-effective long-term result.',
      testimonial: {
        quote: 'I spent more on one cortisone injection than my entire acupuncture course with Dr. Huang — and the injection wore off after three months. The acupuncture worked.',
        attribution: 'Tom R., Middletown, NY'
      }
    },
    faq: {
      heading: 'Acupuncture Cost — Common Questions',
      items: [
        { question: 'How many acupuncture sessions will I need?', answer: 'Most conditions respond within 6–10 sessions. Dr. Huang gives a specific recommendation at your initial consultation.' },
        { question: 'Is acupuncture covered by health insurance in New York?', answer: 'Some NY plans cover acupuncture for chronic pain. Call your insurer about CPT codes 97810–97814. We provide documentation for reimbursement.' },
        { question: 'Can I use my HSA or FSA for acupuncture?', answer: 'Yes. Acupuncture is a qualified medical expense for both HSA and FSA. We accept HSA/FSA cards.' },
        { question: 'Do you offer a first-visit discount?', answer: 'We periodically offer new patient specials. Contact us to ask about current pricing for first-time patients.' },
        { question: 'What is the difference between the initial visit and a follow-up?', answer: 'The initial visit (90 min) includes full intake, TCM diagnosis, and first treatment. Follow-ups (45–60 min) are treatment only, having established your plan at the first visit.' }
      ]
    },
    cta: { label: 'Book Your First Visit', href: '/en/contact' }
  }

Upsert site_seo_pages:
  { slug: 'acupuncture-cost-middletown-ny',
    page_type: 'seo-resource', active: true }

Update core landing page faq items: cost answer should
link to /en/acupuncture-cost-middletown-ny

━━━━━━━━━━━━━━━━━━━━━━━
SESSION 6 DONE-GATE
━━━━━━━━━━━━━━━━━━━━━━━

- [ ] /en/acupuncture-cost-middletown-ny returns 200
- [ ] H1 is a question: "How Much Does Acupuncture Cost..."
- [ ] Price answer appears above the fold
- [ ] Price breakdown table renders
- [ ] FAQ accordion with 5 items works
- [ ] site_seo_pages row inserted
- [ ] Core landing page FAQ links to this page
- [ ] No TypeScript errors
```

---

## Session 7 — Internal Link Audit

> **Goal:** Verify all internal links across all 5 SEO pages are correct.
> **Time estimate:** 20–30 minutes

---

```
Task: Audit all internal links in content_entries for
site_id = [dr-huang]. Check each required link below.
For any missing or wrong link: fix it in the DB row.

FROM homepage:
- [ ] Link to acupuncture-middletown-ny exists

FROM acupuncture-middletown-ny:
- [ ] conditions.items back pain slug = acupuncture-for-back-pain-middletown-ny
- [ ] conditions.items insomnia slug = acupuncture-for-insomnia-middletown-ny
- [ ] conditions.items anxiety slug = acupuncture-for-anxiety-middletown-ny
- [ ] faq cost answer links to acupuncture-cost-middletown-ny
- [ ] hero.ctaHref = /en/contact
- [ ] location.ctaHref = /en/contact

FROM each condition page (back-pain, insomnia, anxiety):
- [ ] relatedConditions has links to 2 sibling condition pages
- [ ] cta.href = /en/contact

FROM acupuncture-cost-middletown-ny:
- [ ] cta.href = /en/contact

Output a table: page slug | link target | anchor/label | PASS/FAIL
Fix all FAILs before finishing.
```

---

## Session 8 — Final SEO Audit & Sitemap Verification

> **Goal:** Full quality check. Done-gate for the entire retrofit.
> **Time estimate:** 25–35 minutes

---

```
Task: Complete audit across all 9 content paths.

QUERY to run first — get all seo fields:
SELECT path,
  content->'seo'->>'title' as title,
  length(content->'seo'->>'title') as title_len,
  content->'seo'->>'description' as desc,
  length(content->'seo'->>'description') as desc_len,
  content->'seo'->>'h1' as h1,
  content->'seo'->'schema' as schema,
  content->'seo'->>'noindex' as noindex,
  content->>'pageType' as page_type
FROM content_entries
WHERE site_id = '[dr-huang id]' AND locale = 'en'
  AND path IN (
    'home','about','services','contact',
    'acupuncture-middletown-ny',
    'acupuncture-for-back-pain-middletown-ny',
    'acupuncture-for-insomnia-middletown-ny',
    'acupuncture-for-anxiety-middletown-ny',
    'acupuncture-cost-middletown-ny'
  );

CHECK 1 — seo completeness:
All 9 rows must have title, description, h1, schema[]
noindex present. Flag any missing field.

CHECK 2 — title length: flag any title_len > 60. Fix it.

CHECK 3 — description length: flag any desc_len > 155. Fix it.

CHECK 4 — H1 uniqueness: no two rows share the same h1 value.

CHECK 5 — schema:
- FAQPage in schema[]: back-pain, insomnia, anxiety, cost pages
- LocalBusiness in schema[]: home and acupuncture-middletown-ny
- BreadcrumbList in schema[]: all interior pages

CHECK 6 — site_seo_pages registry:
SELECT * FROM site_seo_pages WHERE site_id = '[dr-huang id]';
Confirm 5 rows, all active = true:
  acupuncture-middletown-ny (seo-local-landing)
  acupuncture-for-back-pain-middletown-ny (seo-condition)
  acupuncture-for-insomnia-middletown-ny (seo-condition)
  acupuncture-for-anxiety-middletown-ny (seo-condition)
  acupuncture-cost-middletown-ny (seo-resource)

CHECK 7 — sitemap:
Fetch the sitemap output. Confirm all 5 SEO slugs appear.

CHECK 8 — HTTP 200:
Confirm these routes return 200 (not 404):
  /en/acupuncture-middletown-ny
  /en/acupuncture-for-back-pain-middletown-ny
  /en/acupuncture-for-insomnia-middletown-ny
  /en/acupuncture-for-anxiety-middletown-ny
  /en/acupuncture-cost-middletown-ny
  /en/about   /en/services   /en/contact

━━━━━━━━━━━━━━━━━━━━━━━
SESSION 8 DONE-GATE
━━━━━━━━━━━━━━━━━━━━━━━

Output one table — row per path:
title_len | desc_len | schema[] | noindex |
seo_pages_row | HTTP | PASS/FAIL

- [ ] All 9 paths PASS all 8 checks
- [ ] All 5 site_seo_pages rows exist and active
- [ ] Sitemap includes all 5 SEO slugs
- [ ] No TypeScript errors
- [ ] No existing routes broken

Retrofit complete when this session passes.
```

---

## After All Sessions Complete

Expected Part 3A score: **72–80/100** (up from 52)

### Immediate next steps (manual):

**Google Search Console (15 min)**
Request indexing for each new page URL.
Submit updated sitemap.xml.

**Google Business Profile (30 min)**
Fix NAP mismatch if present.
Expand description to 700+ characters.
Add service entries: Pain Management, Sleep & Insomnia,
Stress & Anxiety, Fertility Acupuncture.
Upload 12+ photos if below 20.
Seed 5–7 Q&As from the FAQ content.

**Review system (15 min setup)**
Create SMS template (see SEO SOP Part 1, Section 12).
Send to last 30 days of patients immediately.
Target: 25+ Google reviews within 60 days.

**Pipeline B extension (separate session)**
Use DrHuang_PipelineB_O5_Prompts.md.
Extend O5 to generate content for the new page types.
Test by onboarding Acu-Flushing.
Acu-Flushing should launch with all 5 SEO pages
auto-populated from the site_seo_pages registry.
