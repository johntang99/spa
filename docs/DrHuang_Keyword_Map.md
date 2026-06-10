# Dr. Huang Clinic — Master Keyword Map
## System A (TCM) — Middletown, NY

> **Version:** 1.0
> **Date:** March 2026
> **Site:** drhuangclinic.com
> **Industry:** Traditional Chinese Medicine / Acupuncture
> **Purpose:** Planning document for SEO retrofit. Feed this to Claude Code as context for every build session.
> **Pipeline B note:** All content marked with `{{variable}}` will be substituted per client during onboarding (O4/O5 steps).

---

## Keyword Research Summary

**Primary city:** Middletown, NY
**Service area cities:** Goshen NY, Newburgh NY, Wallkill NY, Middletown NY
**Primary service:** Acupuncture
**Secondary services:** Chinese Herbal Medicine, Cupping, Moxibustion, Tui Na
**Practitioner:** Dr. Huang

**Google Search Console signal (March 2026):**
- "acupuncture middletown" → 110 impressions/month, position 14, CTR 3.2%
- Site is relevant in Google's eyes but not yet on page 1
- Building the core landing page is the single action most likely to push this to top 5

---

## Master Keyword Map Table

| # | Cluster | Representative Phrase | Canonical URL | Page Type | Title Tag (≤60 chars) | H1 | Meta Description (≤155 chars) | Schema | Priority | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Core local service | acupuncture middletown ny | `/en/acupuncture-middletown-ny` | Core landing | Acupuncture in Middletown, NY \| Dr. Huang Clinic | Acupuncture in Middletown, NY | Expert acupuncture & TCM in Middletown, NY. Back pain, insomnia, stress & more. Book your first visit with Dr. Huang today. | LocalBusiness, Service, BreadcrumbList | **P1** | Build |
| 2 | Condition — pain | acupuncture for back pain middletown ny | `/en/acupuncture-for-back-pain-middletown-ny` | Condition | Acupuncture for Back Pain in Middletown, NY | Acupuncture for Back Pain in Middletown, NY | Relieve back pain naturally with acupuncture at Dr. Huang Clinic in Middletown, NY. Proven results, personalized care. Book today. | Service, FAQPage, BreadcrumbList | **P1** | Build |
| 3 | Condition — sleep | acupuncture for insomnia middletown ny | `/en/acupuncture-for-insomnia-middletown-ny` | Condition | Acupuncture for Insomnia in Middletown, NY | Acupuncture for Insomnia in Middletown, NY | Struggling with sleep? Acupuncture at Dr. Huang Clinic in Middletown, NY helps restore natural sleep patterns. Book a visit today. | Service, FAQPage, BreadcrumbList | **P1** | Build |
| 4 | Condition — anxiety | acupuncture for anxiety middletown ny | `/en/acupuncture-for-anxiety-middletown-ny` | Condition | Acupuncture for Anxiety in Middletown, NY | Acupuncture for Anxiety in Middletown, NY | Find calm with acupuncture at Dr. Huang Clinic in Middletown, NY. Natural relief for anxiety, stress & nervous tension. Book today. | Service, FAQPage, BreadcrumbList | **P1** | Build |
| 5 | Resource — cost | acupuncture cost middletown ny | `/en/acupuncture-cost-middletown-ny` | Resource | Acupuncture Cost in Middletown, NY | How Much Does Acupuncture Cost in Middletown, NY? | Acupuncture costs $75–$150/session in Middletown, NY. See what's included, insurance options & first-visit specials at Dr. Huang Clinic. | FAQPage, BreadcrumbList | **P2** | Build |
| 6 | TCM service | chinese herbal medicine middletown ny | `/en/chinese-herbal-medicine-middletown-ny` | Service | Chinese Herbal Medicine in Middletown, NY | Chinese Herbal Medicine in Middletown, NY | Traditional Chinese herbal medicine at Dr. Huang Clinic in Middletown, NY. Custom formulas for pain, digestion, immunity & more. | Service, BreadcrumbList | **P2** | Build |
| 7 | Condition — fertility | fertility acupuncture middletown ny | `/en/fertility-acupuncture-middletown-ny` | Condition | Fertility Acupuncture in Middletown, NY | Fertility Acupuncture in Middletown, NY | Support your fertility journey with acupuncture at Dr. Huang Clinic in Middletown, NY. Natural, evidence-based care. Book today. | Service, FAQPage, BreadcrumbList | **P2** | Build |
| 8 | Resource — first visit | first acupuncture visit middletown ny | `/en/first-acupuncture-visit-middletown-ny` | Resource | Your First Acupuncture Visit in Middletown | Your First Acupuncture Visit at Dr. Huang Clinic | Not sure what to expect? Learn what happens at your first acupuncture visit at Dr. Huang Clinic in Middletown, NY. | FAQPage, BreadcrumbList | **P2** | Build |
| 9 | Near-location | acupuncture goshen ny | `/en/acupuncture-goshen-ny` | Near-location | Acupuncture Near Goshen, NY \| Dr. Huang | Acupuncture Near Goshen, NY | Dr. Huang Clinic serves patients from Goshen, NY. Expert acupuncture & TCM just minutes away in Middletown. Book today. | LocalBusiness, Service, BreadcrumbList | **P3** | Phase 2 |
| 10 | Near-location | acupuncture newburgh ny | `/en/acupuncture-newburgh-ny` | Near-location | Acupuncture Near Newburgh, NY \| Dr. Huang | Acupuncture Near Newburgh, NY | Dr. Huang Clinic serves patients from Newburgh, NY. Expert acupuncture & TCM conveniently located in Middletown. Book today. | LocalBusiness, Service, BreadcrumbList | **P3** | Phase 2 |
| 11 | Homepage | dr huang clinic / acupuncture middletown | `/en` | Homepage | Dr. Huang Clinic — Acupuncture & TCM, Middletown NY | (existing H1 — optimize if needed) | (existing — optimize if needed) | LocalBusiness, MedicalClinic, BreadcrumbList | Optimize | Audit |

---

## Dynamic Service Pages (Per-Site)

> **Requirement (V3.9):** Every service/modality offered by a site **must** have its own SEO landing page. This is not optional — all services get pages at launch.
>
> - The **primary service** (e.g., Acupuncture) maps to the `seo-local-landing` core page
> - Every **secondary service** gets a dedicated `seo-service` page
> - All pages are registered in the `site_seo_pages` DB table
> - The dynamic `[slug]` route renders all SEO pages
> - The homepage and services page auto-link to SEO service pages via `getServiceSEOLinks()`
> - Sites without `site_seo_pages` entries fall back to `/services#id` links (no broken links)

### How It Works

1. During onboarding, the intake form declares the site's services in `intake.services.modalities[]`
2. The `seed-seo-pages.mjs` script generates one `seo-service` page per secondary modality (primary service = core landing page)
3. Each page targets the keyword cluster `[service] [city] [state]`

### Slug Pattern

```
/en/[service-slug]-[city-slug]-[state-lower]
```

### Example: Dr. Huang Clinic (5 services → 5 service pages)

| Service | Slug | Title Tag | H1 |
|---------|------|-----------|-----|
| Acupuncture | `/en/acupuncture-middletown-ny` | Acupuncture in Middletown, NY \| Dr. Huang Clinic | Acupuncture in Middletown, NY |
| Chinese Herbal Medicine | `/en/chinese-herbal-medicine-middletown-ny` | Chinese Herbal Medicine in Middletown, NY \| Dr. Huang | Chinese Herbal Medicine in Middletown, NY |
| Cupping Therapy | `/en/cupping-therapy-middletown-ny` | Cupping Therapy in Middletown, NY \| Dr. Huang Clinic | Cupping Therapy in Middletown, NY |
| Moxibustion | `/en/moxibustion-middletown-ny` | Moxibustion in Middletown, NY \| Dr. Huang Clinic | Moxibustion in Middletown, NY |
| Tui Na Massage | `/en/tui-na-massage-middletown-ny` | Tui Na Massage in Middletown, NY \| Dr. Huang Clinic | Tui Na Massage in Middletown, NY |

> **Note:** The core landing page (`acupuncture-middletown-ny`) already exists as `seo-local-landing`. The additional service pages use page type `seo-service` and cover the non-primary modalities.

### SEO Object Template (Service Page)

```json
{
  "seo": {
    "title": "{{SERVICE_NAME}} in {{CITY_STATE}} | {{CLINIC_NAME}}",
    "description": "{{SERVICE_NAME}} at {{CLINIC_NAME}} in {{CITY_STATE}}. [condition benefits]. Book today.",
    "h1": "{{SERVICE_NAME}} in {{CITY_STATE}}",
    "canonicalUrl": "/en/{{SERVICE_SLUG}}-{{CITY_SLUG}}-{{STATE_LOWER}}",
    "schema": ["Service", "FAQPage", "BreadcrumbList"],
    "noindex": false,
    "priority": 0.8
  }
}
```

### Content Shape (seo-service)

```
{
  pageType: 'seo-service',
  service: string,             // e.g., 'chinese-herbal-medicine'
  seo: { ... },
  hero: { h1, description, ctaLabel, ctaHref },
  whatIsIt: { heading, body },           // What is [service]?
  whatItTreats: { heading, conditions[] },  // What conditions does [service] treat?
  howItWorks: { heading, body },         // How does [service] work?
  whatToExpect: { heading, body },       // What to expect during a session
  faq: { heading, items[] },             // 4 FAQs specific to this service
  cta: { label, href }
}
```

### Pipeline B Behavior

- `intake.services.modalities` lists all services offered
- The primary service (usually Acupuncture) maps to the existing `seo-local-landing` page
- Each additional service generates a new `seo-service` page
- All service pages link back to the core landing page
- Core landing page services section links to each service page

### Intake Field

```json
{
  "services": {
    "primary": "acupuncture",
    "modalities": [
      { "name": "Chinese Herbal Medicine", "slug": "chinese-herbal-medicine" },
      { "name": "Cupping Therapy", "slug": "cupping-therapy" },
      { "name": "Moxibustion", "slug": "moxibustion" },
      { "name": "Tui Na Massage", "slug": "tui-na-massage" }
    ]
  }
}
```

---

## Internal Link Architecture

```
Homepage (/en)
  └── Core Landing Page (/en/acupuncture-middletown-ny)        ← P1
        ├── Condition: Back Pain                                ← P1
        ├── Condition: Insomnia                                ← P1
        ├── Condition: Anxiety                                 ← P1
        ├── Condition: Fertility                               ← P2
        ├── Service: Chinese Herbal Medicine                   ← P2 (dynamic)
        ├── Service: Cupping Therapy                           ← P2 (dynamic)
        ├── Service: Moxibustion                               ← P2 (dynamic)
        ├── Service: Tui Na Massage                            ← P2 (dynamic)
        ├── Resource: Cost                                     ← P2
        ├── Resource: First Visit                              ← P2
        ├── Near-location: Goshen                             ← P3
        └── Near-location: Newburgh                           ← P3
```

**Required link rules:**
- Homepage → Core Landing Page: anchor = "Acupuncture in Middletown, NY"
- Core Landing Page → all condition pages: anchor = condition name
- Core Landing Page → all service pages: anchor = service name
- All condition pages → Core Landing Page: anchor = "acupuncture in Middletown, NY"
- All service pages → Core Landing Page: anchor = "acupuncture in Middletown, NY"
- All condition/service pages → /contact: anchor = "Book Your Appointment"
- All pages → footer with NAP block matching GBP exactly

---

## Pipeline B Template Variables

All SEO content must use these variables so Pipeline B can substitute per client:

| Variable | DrHuang Value | Pipeline B Source |
|---|---|---|
| `{{CLINIC_NAME}}` | Dr. Huang Clinic | `intake.business.name` |
| `{{PRACTITIONER_NAME}}` | Dr. Huang | `intake.business.ownerName` |
| `{{CITY}}` | Middletown | `intake.location.city` |
| `{{STATE}}` | NY | `intake.location.state` |
| `{{CITY_STATE}}` | Middletown, NY | `intake.location.city` + `intake.location.state` |
| `{{PHONE}}` | (845) XXX-XXXX | `intake.location.phone` |
| `{{ADDRESS}}` | 123 Main St | `intake.location.address` |
| `{{PRIMARY_SERVICE}}` | Acupuncture | `intake.services.primary` |
| `{{SERVICE_AREA}}` | Goshen, Newburgh, Wallkill | `intake.seo.serviceAreaCities` |

---

## GBP Keyword-Cluster Mapping

| Cluster | GBP Action |
|---|---|
| Core service | Primary category = Acupuncturist. Description includes "acupuncture" + "Middletown" + "NY" |
| Back pain | Service: "Pain Management Acupuncture". Post: "Treating back pain with acupuncture" |
| Insomnia | Service: "Sleep & Insomnia Acupuncture". Post: "Acupuncture for better sleep" |
| Anxiety | Service: "Stress & Anxiety Acupuncture". Post: "Find calm with acupuncture" |
| Fertility | Service: "Fertility Acupuncture". Post: "Supporting fertility naturally" |
| Cost / first visit | Q&A: "How much does acupuncture cost?" + "What happens at my first visit?" |
| Chinese Herbal Medicine | Service: "Chinese Herbal Medicine". Secondary category: "Herbalist" |

---

## SEO Object Templates (for content contracts)

### Core Landing Page
```json
{
  "seo": {
    "title": "Acupuncture in {{CITY_STATE}} | {{CLINIC_NAME}}",
    "description": "Expert acupuncture & TCM in {{CITY_STATE}}. Back pain, insomnia, stress & more. Book your first visit with {{PRACTITIONER_NAME}} today.",
    "h1": "Acupuncture in {{CITY_STATE}}",
    "canonicalUrl": "/en/acupuncture-{{CITY_SLUG}}-{{STATE_LOWER}}",
    "schema": ["LocalBusiness", "Service", "BreadcrumbList"],
    "noindex": false,
    "changefreq": "monthly",
    "priority": 0.9
  }
}
```

### Condition Page (back pain example)
```json
{
  "seo": {
    "title": "Acupuncture for Back Pain in {{CITY_STATE}} | {{CLINIC_NAME}}",
    "description": "Relieve back pain naturally with acupuncture at {{CLINIC_NAME}} in {{CITY_STATE}}. Proven results, personalized care. Book today.",
    "h1": "Acupuncture for Back Pain in {{CITY_STATE}}",
    "canonicalUrl": "/en/acupuncture-for-back-pain-{{CITY_SLUG}}-{{STATE_LOWER}}",
    "schema": ["Service", "FAQPage", "BreadcrumbList"],
    "noindex": false,
    "changefreq": "monthly",
    "priority": 0.8
  }
}
```

### Resource Page (cost)
```json
{
  "seo": {
    "title": "Acupuncture Cost in {{CITY_STATE}} | {{CLINIC_NAME}}",
    "description": "Acupuncture costs $75–$150/session in {{CITY_STATE}}. See what's included, insurance options & first-visit specials at {{CLINIC_NAME}}.",
    "h1": "How Much Does Acupuncture Cost in {{CITY_STATE}}?",
    "canonicalUrl": "/en/acupuncture-cost-{{CITY_SLUG}}-{{STATE_LOWER}}",
    "schema": ["FAQPage", "BreadcrumbList"],
    "noindex": false,
    "changefreq": "monthly",
    "priority": 0.7
  }
}
```
