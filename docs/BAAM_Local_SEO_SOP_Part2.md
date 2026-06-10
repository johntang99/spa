# BAAM Local SEO & Page Authority SOP
## Part 2 — Master Plan Integration Layer

> **Version:** 1.0
> **Author:** BAAM Platform Team
> **Date:** March 2026
> **Scope:** Defines exactly where the SEO SOP (Part 1) connects to the BAAM Master Plan V3.4+
> **Core principle:** SEO is not a parallel workstream. It is embedded in Stage A, realized in Stage B, and automated in Pipeline B.

---

## Table of Contents

1. Why SEO Must Live Inside the Master Plan
2. The Integration Model — Where SEO Maps to the Build Pipeline
3. Stage A SEO Additions (New Required Artifacts)
4. Stage B SEO Additions (Phase-Level Integration)
5. Pipeline B SEO Automation
6. New Content Contract Fields (Phase 0)
7. SEO Governance — Sign-Off Gates
8. Master Plan Amendment Summary

---

## 1. Why SEO Must Live Inside the Master Plan

### The Problem With "SEO After Build"

The BAAM Master Plan currently treats SEO as a Phase 3 task ("Admin Hardening + SEO"). This creates a critical structural problem:

**Phase 3 SEO assumes the pages are already built.** But the most important SEO pages — core landing pages, condition pages, near-location pages, resource pages — are not generic pages the Master Plan includes by default. They are *specific* pages whose existence, URL, and content are determined by the keyword map.

If keyword research happens in Phase 3, these pages must be retrofitted:
- New routes must be added to an already-built system
- Content contracts (JSON schemas) must be extended
- Navigation and internal links must be redesigned
- Admin content editors may not support the new page types

**The fix:** SEO research must happen in Stage A so that the pages it requires are part of the site architecture from day one.

### The Correct Mental Model

```
Stage A: SEO research defines what pages exist
Stage B: Those pages get built as first-class citizens
Pipeline B: Per-client SEO content is generated automatically
Phase 3: SEO becomes validation + configuration, not discovery
```

---

## 2. The Integration Model

### 2.1 Full Pipeline Mapping

| SEO Step (Part 1) | Where It Lives in Master Plan | Output |
|---|---|---|
| Business Truth Collection | A1: Industry Deep Dive | Business Truth Document |
| Keyword Research | A1: Industry Deep Dive | Keyword universe (industry-level) |
| Competitor SEO Audit | A1: Industry Deep Dive | SEO Gap Map |
| Intent Clustering | A1: Industry Deep Dive | 5-bucket keyword taxonomy |
| Keyword-to-Page Mapping | A3: Site Architecture | Master Keyword Map (new required artifact) |
| URL Structure | A3: Site Architecture | Canonical URL list |
| On-Page SEO Packaging | A6: Content Strategy | SEO Package per page (title, H1, meta, schema) |
| Content Briefs | A6: Content Strategy | Per-page content briefs |
| Technical SEO Audit | Phase 4: QA + Pre-Launch | Technical SEO Checklist |
| Schema Implementation | Phase 3: Admin + SEO | Schema deployment |
| Sitemap + Search Console | Phase 4: QA + Pre-Launch | Verified sitemap + GSC setup |
| GBP Integration | Phase 5: Business Growth | GBP optimization + posting calendar |
| Review System | Phase 5: Business Growth | Review collection SOP |
| Citation Building | Phase 5: Business Growth | Citation tracking sheet |
| Monthly Monitoring | Phase 5: Business Growth | Search Console monthly playbook |
| Per-client keyword content | Pipeline B: O4 (AI Content) | Auto-generated SEO page copy |

---

## 3. Stage A SEO Additions

### 3.1 A1: Industry Deep Dive — SEO Research Addition

**Current A1 scope:** Competitor analysis, customer research, industry norms.

**New SEO additions to A1:**

#### A1-SEO-1: Industry Keyword Universe

Before building the site architecture for any new industry template, the team must complete keyword research at the *industry level* (not yet client-specific). This defines the full universe of keyword types that clients in this industry will target.

**Deliverable: Industry Keyword Universe Document**

Includes:
- All five keyword buckets populated with representative phrases for this industry
- Page type requirements (which page types are required to compete in this industry)
- Schema types required for this industry
- GBP primary and secondary categories for this industry
- Top directory/citation sources for this industry

**Example — System A (TCM/Medical):**

| Bucket | Representative Phrases | Page Type Required |
|--------|----------------------|-------------------|
| Core service | acupuncture [city], acupuncturist [city] | Core landing page |
| Problem/condition | acupuncture for back pain [city], acupuncture for insomnia [city] | Condition pages |
| Decision/trust | acupuncture cost [city], first acupuncture visit | Resource pages |
| Brand/trust | [clinic name] reviews, [practitioner name] | Homepage, About page |
| Near-location | acupuncture [nearby city] | Near-location pages |

#### A1-SEO-2: SEO Competitor Audit (Industry Level)

Audit 3–5 top-performing local businesses in this industry nationally (not client-specific). This reveals what page types, content depth, and schema the best-performing sites in the industry use.

**Deliverable: Industry SEO Benchmark**

- What pages do the best-ranking sites have?
- What schema do they implement?
- What GBP strategies do they use?
- What review volumes do top-ranked businesses have?

This benchmark becomes the standard the master template is built to exceed.

### 3.2 A3: Site Architecture — Keyword-to-Page Map Addition

**Current A3 scope:** Page map, navigation, URL structure.

**New SEO addition: Master Keyword Map as Required Artifact**

A3 must now produce a Master Keyword Map as one of its primary outputs. This map directly drives the page architecture.

**Rule:** No page type should appear in the site architecture that is not justified by the keyword map. No keyword cluster should exist in the map without a corresponding page in the architecture.

**A3 Output: Canonical URL List with SEO Package**

Every URL in the site architecture must be accompanied by:

| Field | Required |
|-------|----------|
| Canonical URL | Yes |
| Page type | Yes |
| Primary keyword cluster | Yes |
| Title tag | Yes |
| H1 | Yes |
| Meta description | Yes |
| Schema type(s) | Yes |
| Internal links in (which pages link to this page) | Yes |
| Internal links out (which pages this page links to) | Yes |
| GBP tie-in | Yes |
| Content brief reference | Yes |

**This table becomes the single source of truth for every SEO decision made during build.**

### 3.3 A6: Content Strategy — SEO Content Brief Addition

**Current A6 scope:** Conversion funnel, content types, tone of voice.

**New SEO addition: Per-Page Content Briefs**

A6 must now produce a content brief for every money page identified in the keyword map.

**Content Brief Template:**

```
Page: [URL]
Page Type: [Core landing / Service / Condition / Resource]
Primary Keyword: [exact phrase]
Secondary Keywords: [2-3 supporting phrases]
Target Word Count: [minimum — target range]
H1: [approved H1]
H2 Headings (suggested): [list]
FAQ Questions (from People Also Ask): [list 4-6]
Key Trust Elements: [credentials, reviews, specific differentiators to include]
CTA: [primary call to action text and destination]
Internal Links Required: [which pages must be linked from this page]
Schema: [required schema types]
GBP Post Tie-In: [related GBP post topic]
```

### 3.4 A-P: Prototype Design — SEO Page Inclusion

**Current A-P scope:** Premium HTML prototypes for key pages.

**New SEO addition:** Prototypes must include at least one condition page and one resource page — not only the homepage and core service pages. These are the highest-volume SEO pages and their layout must be validated before implementation.

**P-Gate addition:** Before any prototype is approved, verify that:
- [ ] The H1 of every prototype page contains the primary keyword
- [ ] Every prototype money page has a visible CTA above the fold
- [ ] Every prototype includes a NAP block in the footer
- [ ] The prototype's URL matches the canonical URL defined in the keyword map

---

## 4. Stage B SEO Additions

### 4.1 Phase 0: Infrastructure + Content Contracts — SEO Metadata Fields

**Current Phase 0 scope:** File structure, JSON content contracts, routing.

**New SEO additions:**

Every page-level JSON content contract must include an `seo` object with these fields:

```json
{
  "seo": {
    "title": "Acupuncture in Middletown, NY | Dr. Huang Clinic",
    "description": "Expert acupuncture, herbal medicine & TCM in Middletown, NY. Book your first visit with Dr. Huang today.",
    "h1": "Acupuncture in Middletown, NY",
    "canonicalUrl": "/en/acupuncture-middletown-ny",
    "schema": ["LocalBusiness", "Service", "BreadcrumbList"],
    "keywords": ["acupuncture middletown ny", "acupuncturist middletown ny"],
    "ogTitle": "Acupuncture in Middletown, NY | Dr. Huang Clinic",
    "ogDescription": "Expert acupuncture, herbal medicine & TCM in Middletown, NY.",
    "ogImage": "/images/og/acupuncture-middletown.jpg",
    "noindex": false,
    "changefreq": "monthly",
    "priority": 0.8
  }
}
```

**This object is required on ALL page content contracts.** It is the source of truth for the Next.js `<head>` metadata and the sitemap generator.

**Sitemap generator rule:** The sitemap must be built from content contract `seo` objects — not hardcoded. When a new page's JSON is added, it automatically appears in the sitemap on next build.

### 4.2 Phase 1: Core Pages — SEO Integration

**Current Phase 1 scope:** Homepage, main navigation, core service pages.

**New SEO requirements for Phase 1:**

- [ ] All Phase 1 pages must have `seo` objects populated in their JSON contracts before the page is built
- [ ] The core landing page (`/en/[service]-[city]`) must be built in Phase 1 — not Phase 3
- [ ] Internal link structure from homepage → core landing page must be implemented in Phase 1
- [ ] NAP block in footer must be wired to content contract (not hardcoded) in Phase 1

**Phase 1 SEO gate:** Before moving to Phase 2, all Phase 1 pages must pass:
- [ ] Title tag, H1, and meta description are present and correct
- [ ] Pages are crawlable (not blocked by robots.txt or noindex)
- [ ] Internal links from homepage to core landing page are working

### 4.3 Phase 2: Conversion + Content Pages — SEO Page Build

**Current Phase 2 scope:** Contact, booking, testimonials, blog framework.

**New SEO requirement for Phase 2:**

Condition pages, near-location pages, and resource pages must be built in Phase 2 — not deferred to Phase 3. These are the pages that generate the majority of SEO-driven traffic.

**Phase 2 SEO deliverables:**
- [ ] All condition pages built and wired to content contracts
- [ ] All resource pages built (cost, first visit, FAQ)
- [ ] Near-location pages built (if applicable to industry)
- [ ] All condition/resource pages linked from core landing page and service pages
- [ ] FAQ schema implemented on FAQ and resource pages

### 4.4 Phase 3: Admin Hardening + SEO — Redefined Scope

**Phase 3 SEO is now validation and configuration — not discovery.**

Since keyword research happened in Stage A and pages were built in Phases 1–2, Phase 3 SEO focuses on:

- [ ] Schema validation: Run all pages through Rich Results Test, fix all errors
- [ ] Title/meta audit: Verify all pages have unique, correct title tags and meta descriptions
- [ ] Internal link audit: Verify all pages are correctly linked per the keyword map
- [ ] Sitemap generation and verification
- [ ] robots.txt review
- [ ] Image alt text audit — all images have descriptive alt text with keyword context
- [ ] Canonical tag audit
- [ ] hreflang audit (for multi-language BAAM sites)
- [ ] Admin SEO editor: Verify admin interface allows content editors to update `seo.title`, `seo.description`, and `seo.h1` per page without developer involvement

**Admin SEO editor requirement:**

Every BAAM admin panel must expose SEO fields for every content-managed page:

```
Page SEO Settings
  ├── SEO Title (character counter, 60-char limit warning)
  ├── Meta Description (character counter, 155-char limit warning)
  ├── H1 Override (optional — defaults to page title)
  ├── Canonical URL (auto-set, editable for special cases)
  ├── noindex toggle (default: off)
  └── OG Image (upload or select from media library)
```

### 4.5 Phase 4: QA + Pre-Launch — SEO Pre-Launch Gates

Add these SEO gates to the existing Phase 4 QA checklist. Site must not launch without passing:

- [ ] Google Search Console domain property verified
- [ ] Sitemap submitted to Search Console
- [ ] All key pages return HTTP 200
- [ ] All key pages indexed (or submitted for indexing)
- [ ] PageSpeed Insights mobile score ≥ 85 on core landing page
- [ ] All schema validates in Rich Results Test
- [ ] robots.txt is correct
- [ ] GBP is 100% complete before or on launch day
- [ ] NAP in footer matches GBP exactly
- [ ] Redirects in place for any URL that changed during build

---

## 5. Pipeline B SEO Automation

### 5.1 Current Pipeline B (O4: AI Content & SEO Generation)

Pipeline B step O4 currently generates basic content for client sites during onboarding. This step must be expanded to generate full SEO content packages per client.

### 5.2 Per-Client SEO Generation at Onboarding (⚡ V3.9)

When a new client is onboarded via Pipeline B, the system auto-generates all SEO pages. This is implemented and operational.

**Client-specific SEO inputs required from the intake form (O1):**

```json
{
  "business": {
    "name": "Dr. Huang Clinic",
    "ownerName": "Dr. Huang",
    "credentials": "L.Ac., MSTCM",
    "languages": ["English", "Mandarin Chinese"],
    "foundedYear": "20+"
  },
  "location": {
    "city": "Middletown",
    "state": "NY",
    "address": "71 East Main Street",
    "zip": "10940",
    "phone": "(845) 381-1106"
  },
  "services": {
    "primary": "acupuncture",
    "modalities": [
      { "name": "Chinese Herbal Medicine", "slug": "chinese-herbal-medicine" },
      { "name": "Cupping Therapy", "slug": "cupping-therapy" },
      { "name": "Moxibustion", "slug": "moxibustion" },
      { "name": "Tui Na Massage", "slug": "tui-na-massage" }
    ]
  },
  "seo": {
    "specialties": ["back pain", "insomnia", "anxiety", "fertility"],
    "serviceAreaCities": ["Goshen", "Newburgh", "Wallkill"]
  }
}
```

**Auto-generated SEO outputs per client:**

| Output | How Generated | DB Table |
|--------|--------------|----------|
| Core landing page (primary service + city) | `seed-seo-pages.mjs` → Claude API → `seo-pages.md` prompt | `content_entries` + `site_seo_pages` |
| **Service landing pages (one per modality)** | `seed-seo-pages.mjs` → Claude API → `seo-service-page.md` prompt | `content_entries` + `site_seo_pages` |
| 3 condition pages (back pain, insomnia, anxiety) | `seed-seo-pages.mjs` → Claude API → `seo-pages.md` prompt | `content_entries` + `site_seo_pages` |
| 1 resource page (cost) | `seed-seo-pages.mjs` → Claude API → `seo-pages.md` prompt | `content_entries` + `site_seo_pages` |
| All page `seo` objects (title, H1, meta, canonical) | Generated per page per locale | Embedded in `content_entries.data.seo` |
| ZH locale versions of all pages | `seed-seo-pages.mjs` → separate Claude API call | `content_entries` (locale='zh') |

**Implementation files:**

| File | Purpose |
|------|---------|
| `scripts/seed-seo-pages.mjs` | Generates + upserts all SEO pages for one site |
| `scripts/seed-seo-all-sites.mjs` | Runs seeder for all sites with `intake.json` |
| `scripts/onboard/prompts/chinese-medicine/seo-pages.md` | Prompt for core + condition + cost pages |
| `scripts/onboard/prompts/chinese-medicine/seo-service-page.md` | Prompt for per-service pages |
| `lib/seo-pages.ts` | `getSEOPagesForSite()`, `getServiceSEOLinks()`, `registerSEOPage()` |
| `app/[locale]/[slug]/page.tsx` | Dynamic route rendering all SEO page types |
| `components/seo/SEO*Layout.tsx` | 4 layout components (Landing, Condition, Resource, Service) |

**DB architecture:**

| Table | Purpose |
|-------|---------|
| `site_seo_pages` | Registry of all SEO slugs per site — `(site_id, slug, page_type, active)` |
| `content_entries` | Full page content JSON — `(site_id, locale, path, data)` |

**Link resolution:** `getServiceSEOLinks(siteId, locale)` returns a Map of service-id → SEO page URL. The homepage and services page call this at render time. If SEO pages exist → links point to dedicated pages. If not → links fall back to `/services#id`. Zero broken links across all sites.

### 5.3 SEO Quality Gate in Pipeline B (O6: Post-Onboarding Verification)

Verified by `node scripts/verify-site.mjs <site-id>`:

- [ ] All page `seo` objects populated (title ≤60, description ≤155, h1 unique)
- [ ] `site_seo_pages` has rows for: 1 core landing + N service pages + 3 conditions + 1 resource
- [ ] **Service page count matches `intake.services.modalities` count** (⚡ V3.9)
- [ ] All SEO slugs return HTTP 200
- [ ] Sitemap includes all SEO slugs
- [ ] Core landing page is submitted for indexing in GSC
- [ ] EN + ZH versions exist for all SEO pages

---

## 6. New Content Contract Fields (Phase 0 Reference)

This section defines the complete SEO contract that every page JSON must support. This is the technical specification for developers implementing Phase 0.

### 6.1 Page-Level SEO Object (Required on All Pages)

```typescript
interface PageSEO {
  // Core — required on every page
  title: string;           // Max 60 chars — used in <title> tag
  description: string;     // Max 155 chars — used in <meta name="description">
  h1: string;              // The visible H1 on the page
  canonicalUrl: string;    // Relative URL — e.g. "/en/acupuncture-middletown-ny"
  noindex: boolean;        // Default: false. True for admin, thank-you, draft pages

  // Open Graph — required for social sharing
  ogTitle?: string;        // Defaults to title if not set
  ogDescription?: string;  // Defaults to description if not set
  ogImage?: string;        // Absolute path to OG image (1200x630)

  // Schema — array of schema types to apply
  schema: SchemaType[];    // e.g. ["LocalBusiness", "Service", "BreadcrumbList"]

  // Sitemap control
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;       // 0.0 to 1.0 — homepage: 1.0, core landing: 0.9, others: 0.7-0.8

  // Internal tracking (not rendered)
  keywordCluster?: string; // e.g. "core-local-service" — for admin reporting
  pageType?: string;       // e.g. "landing" | "service" | "condition" | "resource"
}
```

### 6.2 Site-Level SEO Object (Required in Site Config)

```typescript
interface SiteSEO {
  siteName: string;           // "Dr. Huang Clinic"
  siteUrl: string;            // "https://drhuangclinic.com"
  defaultOgImage: string;     // Fallback OG image for pages without one
  twitterHandle?: string;
  googleVerification?: string;
  bingVerification?: string;

  // NAP — must match GBP exactly
  nap: {
    name: string;             // "Dr. Huang Clinic"
    address: string;          // "123 Main Street"
    city: string;             // "Middletown"
    state: string;            // "NY"
    zip: string;              // "10940"
    phone: string;            // "(845) 555-0000"
    hours: BusinessHours[];
  };

  // LocalBusiness schema defaults (applied site-wide)
  localBusiness: {
    type: string;             // "MedicalClinic" | "Restaurant" | etc.
    priceRange?: string;      // "$$"
    areaServed: string[];     // ["Middletown", "Goshen", "Newburgh"]
  };
}
```

---

## 7. SEO Governance — Sign-Off Gates

### 7.1 Stage A SEO Gate (New)

Before Stage A is approved and Stage B begins, the following SEO artifacts must be complete and signed off:

- [ ] Industry Keyword Universe Document complete
- [ ] SEO Competitor Audit (industry level) complete
- [ ] Master Keyword Map complete (all target pages with full SEO packages)
- [ ] Content briefs written for all money pages
- [ ] A-P prototypes reviewed for SEO compliance (H1, CTA, NAP)

**Sign-off required from:** BAAM Lead + Client (for client-specific keyword map)

### 7.2 Phase 0 SEO Gate (New)

Before any page is built, the following must be in place:

- [ ] Page-level `seo` object schema defined in TypeScript types
- [ ] Sitemap generator wired to content contract `seo` objects
- [ ] Admin SEO editor fields present in admin panel
- [ ] All target page JSON files created with `seo` objects populated (even if body content is placeholder)

### 7.3 Phase 3 SEO Validation Gate (Existing — Expanded)

Before Phase 4 (QA + Pre-Launch):

- [ ] All pages pass schema validation
- [ ] All pages have unique title tags and meta descriptions
- [ ] Internal link audit complete and documented
- [ ] Admin SEO editor tested and working
- [ ] Sitemap verified in Search Console

### 7.4 Pre-Launch SEO Gate (Phase 4 — Existing + Expanded)

As defined in Section 4.5 above. No exceptions.

---

## 8. Master Plan Amendment Summary

This section summarizes all changes to the BAAM Master Plan V3.4 required by this SEO integration.

| Section | Type | Change |
|---------|------|--------|
| A1: Industry Deep Dive | Addition | Industry Keyword Universe + SEO Competitor Audit required outputs |
| A3: Site Architecture | Addition | Master Keyword Map is now a required A3 artifact |
| A6: Content Strategy | Addition | Per-page content briefs with SEO packaging required |
| A-P: Prototype Design | Addition | Condition and resource page prototypes required; P-Gate SEO checks added |
| Phase 0 | Addition | `seo` object required in all page content contracts; sitemap generator wired to contracts |
| Phase 1 | Addition | Core landing page built in Phase 1 (not Phase 3); Phase 1 SEO gate added |
| Phase 2 | Addition | Condition, near-location, and resource pages built in Phase 2; schema implemented |
| Phase 3 | Redefinition | SEO scope is now validation + configuration only — not discovery |
| Phase 4 | Addition | SEO pre-launch gates added to QA checklist |
| Phase 5 | Addition | GBP calendar, review system, citation building, Search Console monitoring added |
| Pipeline B O1 | Addition | SEO inputs added to intake form schema |
| Pipeline B O4 | Addition | Per-client keyword map + page SEO objects auto-generated |
| Pipeline B O6 | Addition | SEO quality gate added to post-onboarding verification |
| Admin Panel | Addition | SEO editor fields required in admin for all content-managed pages |

---

## Appendix — Quick Reference: Stage A SEO Outputs

This is the complete list of SEO artifacts that must exist before Stage B begins.

| Artifact | Owner | Used In |
|----------|-------|---------|
| Industry Keyword Universe | BAAM Lead | A3 page mapping, A6 content briefs, Pipeline B templates |
| SEO Competitor Audit | BAAM Lead | Gap map, keyword prioritization |
| Master Keyword Map | BAAM Lead + Client | Phase 0 contracts, Phase 1-2 build, Pipeline B generation |
| Per-Page SEO Packages (title/H1/meta/schema) | BAAM Lead | Phase 0 JSON contracts, admin population |
| Content Briefs | BAAM Lead | Phase 2 content build, Pipeline B AI prompts |
| GBP Keyword-Cluster Map | BAAM Lead | Phase 5 GBP optimization |
| A-P Prototypes (SEO-compliant) | BAAM Lead | Cursor implementation prompts |

---

*End of Part 2 — BAAM Master Plan SEO Integration Layer*

*See Part 1 for the full SEO SOP | See Part 3 for Site SEO Completion Report*
