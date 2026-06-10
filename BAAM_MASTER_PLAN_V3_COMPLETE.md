# BAAM Master Plan — Industry Site Build (Complete)

> **Version:** 3.4 — Complete Edition (with Governance, Architecture, Operations & Pipeline B)
> **Author:** BAAM Platform Team
> **Date:** March 2026
> **Key insight:** A premium, industry-specific site requires deep DESIGN work before any IMPLEMENTATION.
> **Three stages:** Stage A (Strategy & Design) produces the blueprint. Stage B (Implementation) builds the master template. Pipeline B (Client Onboarding) clones that template for each new client.
> **The quality of Stage A determines the quality of the final site.**
> **V3.1 additions:** Admin collection editors, governance model, dual timelines, automation checks, rollback SOP.
> **V3.2 additions:** Platform Guardrails (Julia Studio Learnings): public/admin API boundary, host-based site resolution, import/export direction rules, slug integrity, sync observability.
> **V3.3 additions:** Phase File Generation Protocol — phase implementation files must be generated ONE BY ONE (one file per phase, never bundled). Industry-Specific Plan Document structure updated to match this standard. Reference build: BAAM System D (Dental).
> **V3.4 additions:** Pipeline B — Client Onboarding SOP. Complete automated pipeline for cloning master templates into production-ready client sites. 7-step pipeline (O1–O7), intake form schema, brand variant system, AI content/SEO generation, admin onboarding UI with SSE progress, industry extension guide. Reference implementation: BAAM System D (Dental).

---

## Table of Contents

### Stage A — Strategy & Design
- [1. Why Two Stages](#1-why-two-stages)
- [2. Stage A Overview](#2-stage-a-overview)
- [3. A1: Industry Deep Dive](#3-a1-industry-deep-dive)
- [4. A2: Brand Positioning & Differentiation](#4-a2-brand-positioning--differentiation)
- [5. A3: Site Architecture & Page Design](#5-a3-site-architecture--page-design)
- [6. A4: Component Inventory & Unique Features](#6-a4-component-inventory--unique-features)
- [7. A5: Visual Design Direction](#7-a5-visual-design-direction)
- [8. A6: Content Strategy & Conversion Funnel](#8-a6-content-strategy--conversion-funnel)
- [9. Stage A Output Summary](#9-stage-a-output-summary)

### Stage B — Implementation
- [10. Stage B Overview & Methodology](#10-stage-b-overview--methodology)
- [10.5 Phase File Generation Protocol ⚡ NEW V3.3](#105-phase-file-generation-protocol)
- [11. Phase 0: Infrastructure + Content Contracts](#11-phase-0-infrastructure--content-contracts)
- [12. Phase 1: Core Pages — Build / Wire / Verify](#12-phase-1-core-pages--build--wire--verify)
- [13. Phase 2: Conversion + Content Pages + Polish](#13-phase-2-conversion--content-pages--polish)
- [14. Phase 3: Admin Hardening + SEO](#14-phase-3-admin-hardening--seo)
- [15. Phase 4: QA + Pre-Launch + Deploy](#15-phase-4-qa--pre-launch--deploy)

### Phase 5 — Business Growth
- [16. Phase 5: 12-Month Business Growth Plan](#16-phase-5-12-month-business-growth-plan)

### Pipeline B — Client Onboarding
- [30. Pipeline B Overview](#30-pipeline-b-overview)
- [31. 7-Step Pipeline (O1–O7)](#31-7-step-pipeline-o1o7)
- [32. Intake Form Schema](#32-intake-form-schema)
- [33. Brand Variant System](#33-brand-variant-system)
- [34. AI Content & SEO Generation](#34-ai-content--seo-generation)
- [35. Deep Replacement Algorithm](#35-deep-replacement-algorithm)
- [36. Service Pruning Logic](#36-service-pruning-logic)
- [37. Admin Onboarding UI](#37-admin-onboarding-ui)
- [38. Local Domain Alias System](#38-local-domain-alias-system)
- [39. Post-Onboarding Verification](#39-post-onboarding-verification)
- [40. Cost & Performance Model](#40-cost--performance-model)
- [41. Industry Extension Guide](#41-industry-extension-guide)
- [42. Centralized Theme Token + Preset System (Cross-Industry Standard)](#42-centralized-theme-token--preset-system-cross-industry-standard)

### Reference
- [17. Admin Content Coverage SOP](#17-admin-content-coverage-sop)
- [18. Admin Architecture: Collection Editors](#18-admin-architecture-collection-editors)
- [19. Governance & Sign-Off](#19-governance--sign-off)
- [20. Dual Timeline: Lean vs Full Launch](#20-dual-timeline-lean-vs-full-launch)
- [21. Minimum Automation Checks](#21-minimum-automation-checks)
- [22. Rollback & Incident SOP](#22-rollback--incident-sop)
- [23. Content Creation Templates](#23-content-creation-templates)
- [24. Anti-Patterns & Lessons Learned](#24-anti-patterns--lessons-learned)
- [25. Process Summary Diagram](#25-process-summary-diagram)
- [26. Theme Token Normalization Playbook](#26-theme-token-normalization-playbook)
- [27. Platform Guardrails (Julia Studio Learnings)](#27-platform-guardrails-julia-studio-learnings)
- [28. REB Admin Reuse for New Site Setup](#28-reb-admin-reuse-for-new-site-setup)
- [29. Admin Certification SOP (One-Pass Cursor Checklist)](#29-admin-certification-sop-one-pass-cursor-checklist)
- [BAAM Theme System SOP (Cross-Site)](../BAAM_THEME_SYSTEM_SOP.md)

---

## 1. Why Two Stages

Proload Express works because it was designed as an LTL freight authority site — not a medical site with different colors. The components (savings calculator, coverage map, testimonial wall, rate request form), the conversion funnel (visit → impressed → sign up → quote → customer), the content strategy (case studies, blog authority, price leadership messaging) — all of these were industry-specific design decisions made BEFORE implementation.

If you skip Stage A and jump to implementation, you get:

- A generic site that looks like every other template
- Missing industry-specific features that competitors have
- Content that doesn't speak to the target customer's pain points
- A conversion funnel that doesn't match how the industry buys
- Components inherited from the medical system instead of designed for the industry

**Stage A is where the site becomes special. Stage B is where it gets built.**

### Lessons from Previous Builds

| Build | What Went Right | What Could Improve |
|-------|----------------|-------------------|
| Medical (System A) | Solid admin CMS, multi-site, bilingual | Admin was built alongside — good integration |
| Epoch Press (System C) | Frontend-first proved design before backend | Admin wiring was a large Phase 3 task |
| Proload Express (System E) | Premium, industry-specific, conversion-focused | Admin deferred to late phase caused back-and-forth |

The universal fix: **design the full site before coding, integrate admin into every build step.**

---

## 2. Stage A Overview

**Duration:** 1-2 weeks
**Tool:** Claude (strategic thinking, research, design decisions)
**Output:** 6 artifacts that form the complete site blueprint

| Step | Focus | Deliverable |
|------|-------|-------------|
| A1 | Industry Deep Dive | Industry Research Brief |
| A2 | Brand Positioning | Brand Positioning Document |
| A3 | Site Architecture | Page Design Document |
| A4 | Component Inventory | Component Inventory (NEW vs REUSE) |
| A5 | Visual Design | Visual Design Brief |
| A6 | Content Strategy | Content Strategy & Conversion Funnel |

---

## 3. A1: Industry Deep Dive

**Objective:** Understand the industry so well that the site feels like it was built by an insider.

### 3.1 Competitor Analysis

Study 8-12 top competitors in the industry:

- Screenshot their home pages, key pages, forms, pricing pages
- Document: what they do well, what they do poorly, what's missing
- Note: page count, content depth, unique features, conversion methods
- Identify: what would make a visitor choose them vs others

**Competitor analysis template:**

| Competitor | URL | Strengths | Weaknesses | Unique Features | Conversion Method | Page Count |
|-----------|-----|-----------|------------|-----------------|-------------------|------------|
| [Name] | [URL] | | | | | |

### 3.2 Customer Research

Understand who visits and what they need:

- Who is the buyer? (title, company size, pain points, decision criteria)
- What are their top 3 questions when they land on a site?
- What makes them trust a company in this industry?
- What's their buying journey? (research → compare → contact → decide)
- What conversion action do they prefer? (form, phone, chat, signup, booking)

### 3.3 Industry-Specific Requirements

- Compliance/credentials that must be displayed (licenses, certifications, insurance)
- Industry terminology and jargon the site must use
- Trust signals specific to this industry
- Seasonal patterns or timing considerations
- Common objections and how to overcome them on the site

### 3.4 SEO Landscape

- Top keywords and search volume
- What types of content rank well in this industry
- Programmatic page opportunities (location, service, comparison)
- Content gap analysis: what competitors aren't covering

**Deliverable:** Industry Research Brief (3-5 pages)

---

## 4. A2: Brand Positioning & Differentiation

**Objective:** Define exactly why a visitor should choose this company over every competitor.

### 4.1 Core Positioning Statement

Format: "[Company] is the [superlative] [service] for [audience] because [reason]."

**Examples from BAAM builds:**
- Medical: "Dr. Huang Clinic is the premier Traditional Chinese Medicine practice in Flushing, combining 20+ years of expertise with personalized acupuncture care."
- Printing: "Epoch Press is the quality-first commercial printing partner for businesses nationwide, delivering newspaper, magazine, and book printing with competitive pricing."
- Logistics: "Proload Express is the most competitive LTL freight solution for US businesses because we leverage 200+ carriers to guarantee the lowest rates."

### 4.2 Five Pillars of Differentiation

Define 5 reasons someone should choose this company. For each pillar:

- What is the claim? (e.g., "Lowest prices")
- How does the site communicate it? (e.g., price comparison section, savings calculator)
- What evidence supports it? (e.g., "Average 23% savings", customer testimonials about cost)

### 4.3 Scale Perception Strategy

- What numbers communicate size? (customers, projects, years, employees, locations)
- What social proof is needed? (testimonial count, case study count, logos, awards)
- What volume of content signals authority? (blog posts, guides, resources)

### 4.4 Conversion Path

- Primary conversion: what is it? (quote request, booking, signup, phone call)
- Secondary conversion: what is it? (account creation, newsletter, download)
- What's the promise? ("Quote in 2 hours", "Free consultation", "See pricing instantly")
- What trust signals surround the conversion point?

**Deliverable:** Brand Positioning Document (2-3 pages)

---

## 5. A3: Site Architecture & Page Design

**Objective:** Design every page with its purpose, content, sections, and conversion role — before any code exists.

### 5.1 Page Design Template

For each page, define:

```
Page: [Name]
Route: /[path]
Purpose: [Why this page exists — what it does for the business]
Conversion role: [How this page drives leads — hook/educate/convince/convert/retain]
Target visitor: [Who lands on this page and what they're looking for]

Sections (in order):
1. [Section name] — [What it shows] — [Why it matters]
2. [Section name] — [What it shows] — [Why it matters]
...

Content requirements:
- [Specific content needed: stats, testimonials, case studies, etc.]
- [Media needed: photos, icons, videos, maps, etc.]

CTA strategy:
- Primary CTA: [label] → [destination]
- Secondary CTA: [label] → [destination]

SEO:
- Target keyword: [keyword]
- Title: [page title]
- Description: [meta description]
```

### 5.2 Page Tiers

**Tier 1 — Core (must-have at launch):**
- Home (the hook — first impression, scale, differentiation)
- Services / What We Do (detailed service breakdown)
- Why Us / Differentiator (the convincer — comparison, proof, calculator)
- About (trust — company story, team, credentials, scale numbers)
- Primary Conversion Page (quote/booking/contact form)
- Contact (backup conversion — phone, email, address)

**Tier 2 — Authority & Social Proof:**
- Case Studies / Portfolio / Projects (deep proof of results)
- Testimonials / Reviews (volume of social proof)
- Blog (thought leadership + SEO engine)
- Resources / Guides (educational content + SEO)
- FAQ (objection handling + SEO)

**Tier 3 — Specialized:**
- Industry-specific pages (whatever the industry demands)
- Account signup / Client portal
- Tracking / Status page
- Careers
- Partners / Vendors

**Tier 4 — Programmatic SEO:**
- Service × Location pages
- Service × Industry pages
- Route / Comparison / Guide pages

**Deliverable:** Complete Page Design Document — every page fully designed with sections, content, CTAs, and purpose.

---

## 6. A4: Component Inventory & Unique Features

**Objective:** Identify which components are industry-standard reuse and which are UNIQUE to this industry.

### 6.1 Component Classification

| Component | Industry-Specific? | Description | Comparable Medical Component |
|-----------|-------------------|-------------|------------------------------|
| Hero | Reuse (adapt) | Bold hero with CTA | Same pattern, different content |
| Service Cards | Reuse (adapt) | Service type grid | Similar to Services section |
| Stats Counter | Reuse (adapt) | Animated numbers | Similar to Stats section |
| Process Timeline | Reuse (adapt) | How-it-works steps | Similar to HowItWorks |
| CTA Banner | Reuse (adapt) | Conversion banner | Same pattern |
| FAQ Accordion | Reuse (adapt) | Expandable Q&A | Same pattern |
| Testimonials | Reuse (adapt) | Customer quotes | Similar but often different layout |
| [Industry NEW] | NEW | [Describe] | No equivalent |

### 6.2 New Component Requirements

For each NEW component, define:

- What does it do?
- Why does this industry need it?
- What data does it consume? (JSON shape)
- What are the variant options?
- What competitor sites have a good version to reference?

**Examples of industry-specific NEW components from previous builds:**

| Industry | NEW Components |
|----------|---------------|
| Printing | ProductSpecBlock, PriceTierTable, QuoteForm, FileUploadGuide, EquipmentShowcase |
| Logistics | CoverageMap, RateRequestForm, SavingsCalculator, TransitTimeTable, ComparisonTable, TrustLogoTicker, TestimonialWall, SignUpForm |
| Restaurant | MenuDisplay, OnlineOrderForm, ReservationWidget, PhotoGallery, ChefProfile |
| Legal | PracticeAreaCards, CaseResultsTicker, ConsultationForm, AttorneyProfiles |

**Deliverable:** Component Inventory with clear NEW vs REUSE classification.

---

## 7. A5: Visual Design Direction

**Objective:** Define the visual identity before any code.

### 7.1 Color Palette

- Primary color and why (industry association or brand emotion)
- Secondary/accent color and why
- Supporting colors (success, warning, neutral, dark sections, light sections)
- Color psychology rationale for this industry

**Examples from BAAM builds:**

| System | Primary | Secondary | Rationale |
|--------|---------|-----------|-----------|
| Medical | Earth green (#2D5016) | Warm gold (#8B7355) | Natural, healing, traditional |
| Printing | Deep navy (#0F1B2D) | Warm gold (#B8860B) | Premium, sophisticated, craftsmanship |
| Logistics | Deep navy (#0A2463) | Vibrant orange (#FF6B35) | Authority/trust + energy/urgency |

### 7.2 Typography

- Font family and why (modern, traditional, technical, friendly)
- Weight hierarchy (headlines, subheads, body, captions)
- Size scale (display, heading, subheading, body, small)

### 7.3 Photography & Visual Style

- What images does this industry need? (equipment, people, locations, products, processes)
- Stock photo direction (realistic, professional, diverse, action-oriented)
- Image treatment (dark overlays, bright and clean, moody, high-contrast)

### 7.4 Layout Principles

- Dense vs spacious (busy professionals need dense info; luxury brands need space)
- Dark vs light dominant (authority/premium vs clean/approachable)
- Animation level (minimal for professional, moderate for modern tech-forward)

### 7.5 Competitor Visual Comparison

- What do top competitors look like?
- How should this site feel different?
- What visual cues signal industry authority?

### 7.6 Design Reference Sites

List 3-5 sites (from any industry) that capture the right feel, with what specifically to reference from each.

**Deliverable:** Visual Design Brief

---

## 8. A6: Content Strategy & Conversion Funnel

**Objective:** Plan the content that makes the site an authority and drives conversions.

### 8.1 Launch Content Requirements

- How many testimonials at launch? (target: 20-50 for scale perception)
- How many case studies? (target: 6-12 for credibility)
- How many blog posts? (target: 6-10 for authority signal)
- What resource/guide pages? (industry-specific educational content)

### 8.2 Conversion Funnel Map

```
Awareness: Blog post / SEO page / Ad
   ↓
Interest: Home page / Services page / Why Us page
   ↓
Consideration: Case Studies / Testimonials / Comparison page
   ↓
Decision: Quote form / Pricing / Signup
   ↓
Action: Submit quote / Create account / Call
   ↓
Retention: Dashboard / Email nurture / Account manager
```

### 8.3 CTA Placement Strategy

- Which CTA appears on which pages?
- Primary vs secondary CTA per page
- "Get a Quote" always accessible? Phone number always visible?
- Sticky elements? (floating CTA, chat widget)

### 8.4 Social Proof Strategy

- Where do testimonials appear? (home, every page, dedicated page)
- Where do case studies appear? (home highlight, dedicated hub)
- Where do trust logos appear? (hero, footer, throughout)
- Where do stats/numbers appear? (hero, about, throughout)

### 8.5 Post-Launch Content Velocity

- Blog cadence (posts per week)
- Case study pipeline (per month)
- Testimonial collection method
- Programmatic page expansion timeline

**Deliverable:** Content Strategy & Conversion Funnel Document

---

## 9. Stage A Output Summary

At the end of Stage A, you have a complete blueprint:

| Artifact | Content |
|----------|---------|
| **Industry Research Brief** | Competitors, customers, requirements, SEO landscape |
| **Brand Positioning Document** | Positioning, 5 pillars, scale strategy, conversion path |
| **Page Design Document** | Every page: purpose, sections, content, CTAs, SEO |
| **Component Inventory** | NEW vs REUSE, data requirements, variant options |
| **Visual Design Brief** | Colors, typography, photography, layout, references |
| **Content Strategy & Funnel** | Launch content, funnel map, CTA strategy, post-launch plan |

**This blueprint is what makes the Cursor prompts precise and the final site premium.**

Without this blueprint, Cursor guesses. With it, Cursor executes.

**Stage A is done with Claude (strategic thinking). Stage B is done with Cursor (code execution).**

### Stage A Acceptance Gates

Stage B must NOT begin until ALL gates pass. This prevents the most common failure: starting to build before the design is complete.

| Gate | Criteria | Pass/Fail |
|------|----------|-----------|
| **A-Gate-1: Page Map** | Every launch page has: route, purpose, conversion role, section list, CTA strategy, SEO target. No TBD sections. | |
| **A-Gate-2: Conversion Funnel** | Full funnel mapped (Awareness → Action). Primary + secondary CTA defined per page. CTA placement approved. | |
| **A-Gate-3: Content Contracts** | JSON schema defined for 100% of launch pages. All section types have typed fields. No "placeholder shape" sections. | |
| **A-Gate-4: Variant Registry** | Every section that supports variants has: variant IDs, descriptions, and confirmed frontend rendering plan. | |
| **A-Gate-5: Content Minimums** | Confirmed counts: testimonials (min 20), case studies (min 6), blog posts (min 6), FAQ items (min 20). Content either exists or has creation plan with dates. | |
| **A-Gate-6: Visual Direction** | Color palette, typography, photography style, layout principles documented. At least 3 reference sites identified. | |
| **A-Gate-7: Component Inventory** | Every component classified NEW vs REUSE. NEW components have: data shape, variant options, competitor reference. | |

**Rule: If any gate is "Fail," resolve it before writing code. No exceptions.**

---

## 10. Stage B Overview & Methodology

**Duration:** 5 weeks
**Tool:** Cursor AI (Sonnet 4.6 Agent) for code execution
**Input:** Stage A blueprint (all 6 artifacts)

> **⚡ V3.3 Rule:** Phase implementation files are generated **one file per phase**, never bundled. See [Section 10.5 — Phase File Generation Protocol](#105-phase-file-generation-protocol) for the full standard.

### 10.1 Core Methodology: Contract-First + Admin Done-Gate

Two principles govern all of Stage B:

**Contract-First:** Define JSON schema + variants + form fields BEFORE coding each page. The content contract (from Stage A's Page Design Document) is translated into a concrete JSON shape, variant registry entries, and admin form field definitions at the start of Phase 0 — not discovered during implementation.

**Admin Done-Gate:** A page is only "done" when it passes all three steps:

1. **BUILD** — Page UI coded, consuming data from DB-first content loader, variant-aware, theme-token colors only
2. **WIRE** — Admin Form mode shows correct fields, JSON mode shows full contract, variant dropdown present
3. **VERIFY** — Roundtrip test passes: edit in admin Form mode → save → check frontend updated; switch variant → save → check layout changed; edit in JSON mode → save → confirm Form mode synced

### 10.2 Architecture Principles

1. **DB-First Always:** Frontend reads from Supabase `content_entries`. Local JSON is development fallback only.
2. **Theme Tokens Only:** No hardcoded hex colors in page components. Everything through `theme.json` CSS variables.
3. **Editor Boundaries:** Content Editor for pages and site settings. Blog Posts Editor for blog entries. No overlap.
4. **Site-Scoped Isolation:** Content, media, and settings scoped by `site_id`. One codebase, clean tenant separation.
5. **Media via Supabase Storage:** All images through storage bucket with provider import (Unsplash/Pexels). No local filesystem in production.

### 10.3 Phase Overview

| Phase | Duration | Focus | Admin Integration | Phase File |
|-------|----------|-------|-------------------|------------|
| **Phase 0** | Day 1-3 | Infrastructure + Content Contracts | Define ALL contracts, variants, form fields | `[SYSTEM]_PHASE_0.md` |
| **Phase 1** | Week 1-2 | Core Pages (frontend + admin wiring) | Build → Wire → Verify per page | `[SYSTEM]_PHASE_1.md` |
| **Phase 2** | Week 3 | Conversion + Content + Polish | Same pattern for remaining pages | `[SYSTEM]_PHASE_2.md` |
| **Phase 3** | Week 4 | Admin Hardening + SEO | Gap closure + programmatic pages | `[SYSTEM]_PHASE_3.md` |
| **Phase 3.5** | 1-2 days | Admin Certification SOP | One-pass checklist + fix sweep before launch | *(included in Phase 3 file)* |
| **Phase 4** | Week 5 | QA + Deploy | Acceptance testing + production launch | `[SYSTEM]_PHASE_4.md` |

> Each phase file is generated separately and attached to Cursor only for the relevant phase. See [Section 10.5 — Phase File Generation Protocol](#105-phase-file-generation-protocol).

---

## 10.5 Phase File Generation Protocol

> **⚡ V3.3 Rule — Non-negotiable for all BAAM builds**

### 10.5.1 The Rule

**Phase implementation files are ALWAYS generated one file per phase. Never bundle multiple phases into a single document.**

Every BAAM industry build produces exactly **6 phase files** as separate outputs:

| File | Covers |
|---|---|
| `[SYSTEM]_PHASE_0.md` | Infrastructure + Content Contracts |
| `[SYSTEM]_PHASE_1.md` | Core Pages |
| `[SYSTEM]_PHASE_2.md` | Conversion + Content Pages + Admin Editors |
| `[SYSTEM]_PHASE_3.md` | Admin Hardening + SEO |
| `[SYSTEM]_PHASE_4.md` | QA + Launch |
| `[SYSTEM]_PHASE_5.md` | 12-Month Growth Plan |

**Naming convention:** `[SYSTEM_CODE]_PHASE_[N].md`  
Example (Dental): `DENTAL_PHASE_0.md`, `DENTAL_PHASE_1.md`, ..., `DENTAL_PHASE_5.md`

### 10.5.2 Why One File Per Phase

**In Cursor:** You attach only the files relevant to the current work session. If all phases are in one file, every Cursor session loads the full document — wasting context window, slowing prompts, and burying the active phase in irrelevant content.

**In operations:** Each phase file has its own completion gate. Once Phase 0 is done and committed, that file is closed. You never need to re-open it during Phase 3. Separate files enforce this cleanly.

**In iteration:** If Phase 2 needs to be revised (new service pages added, admin editors redesigned), only `PHASE_2.md` changes. The other phase files stay stable and unaffected.

**In team handoff:** A developer picking up Phase 3 receives exactly one file. No scanning through 50 pages to find where Phase 3 starts.

### 10.5.3 What Each Phase File Must Contain

Every phase file is **self-contained** and includes:

```
# [SYSTEM] — Phase [N]: [Phase Name]

> System, reference files, prerequisite, method

---

## Phase N: [Name]

**Duration:** [estimate]
**Goal:** [one-sentence goal]

### Prompt Index
[table of all prompts in this phase with estimated time]

---

### Prompt [NA] — [Name]

**Goal:** [what this prompt accomplishes]
**Steps:** [numbered list]
**Done-gate:**
- [ ] [check 1]
- [ ] [check 2]
- [ ] Git commit: `feat: phase-[NA] — [description]`

[...repeat for every prompt in the phase...]

---

## Phase [N] Completion Gate

[table of all requirements that must pass before moving to Phase N+1]
```

**Minimum required sections per phase file:**
- Phase header with duration, goal, and prerequisite
- Prompt index table
- One section per prompt with: goal, steps, done-gate, git commit
- Phase completion gate table at the bottom

### 10.5.4 Generation Order

When generating phase files for a new industry build:

1. Generate `PHASE_0.md` → review → confirm → then generate `PHASE_1.md`
2. Do NOT generate all 6 files at once
3. Each file is generated after the previous one is confirmed correct
4. This allows learnings from one phase definition to inform the next

**Claude instruction:** When asked to generate phase files for a BAAM build, always ask "Which phase?" or start with Phase 0 only. Never output multiple phases in a single response unless explicitly instructed.

### 10.5.5 Reference Build: BAAM System D (Dental)

The Dental build (February 2026) established this standard. Its phase files serve as the canonical template for structure and depth:

| File | Sections | Key features |
|---|---|---|
| `DENTAL_PHASE_0.md` | 5 prompts (0A–0E) | Fork + strip SOP, design token table, 17 service file list, collection seed spec |
| `DENTAL_PHASE_1.md` | 8 prompts (1A–1H) | Section-by-section home page spec, 4-language i18n routing, emergency page urgency requirements |
| `DENTAL_PHASE_2.md` | 13 prompts (2A–2M) | Full 17-service page build, BeforeAfterSlider spec, appointment form DB schema, 7 admin editors |
| `DENTAL_PHASE_3.md` | 5 prompts (3A–3E) | Coverage matrix template, 8-city location pages, 6 schema.org types, HIPAA checklist |
| `DENTAL_PHASE_4.md` | 4 prompts (4A–4D) | 60-row QA checklist across pages/components/languages, content swap checklist, GSC/GBP setup |
| `DENTAL_PHASE_5.md` | 5 periods | Month-by-month KPI targets, multilingual SEO actions, template extraction SOP |

Use these files as the depth benchmark. A phase file that only lists prompt names without step-level detail is not sufficient.

### 10.5.6 Cursor Attachment Protocol

When working in Cursor, attach phase files as follows:

| Work being done | Files to attach |
|---|---|
| Phase 0 work | `@[SYSTEM]_COMPLETE_PLAN.md` + `@[SYSTEM]_CONTENT_CONTRACTS.md` + `@[SYSTEM]_PHASE_0.md` |
| Phase 1 work | `@[SYSTEM]_COMPLETE_PLAN.md` + `@[SYSTEM]_CONTENT_CONTRACTS.md` + `@[SYSTEM]_PHASE_1.md` |
| Phase 2 work | `@[SYSTEM]_PHASE_2.md` (+ content contracts if service/collection work) |
| Phase 3 work | `@[SYSTEM]_PHASE_3.md` |
| Phase 4 work | `@[SYSTEM]_PHASE_4.md` |

**Never attach all phase files simultaneously.** The active phase file plus the plan and contracts is all Cursor needs.

---



**Duration:** Day 1-3
**Input:** All 6 Stage A artifacts

### 11.1 Project Setup (Prompt 0A)

1. Duplicate medical codebase OR clean BAAM starter template
2. Strip previous industry-specific code:
   - Remove old content directories
   - Remove industry-specific section components
   - Remove booking system (if not needed for this industry)
   - Remove unused locale content (if English-only)
3. Keep intact:
   - Admin CMS (ContentEditor, SiteSettings, Media, Variants, Users, Sites)
   - Content loading system (`lib/content.ts`, `lib/contentDb.ts`)
   - Media system (upload, list, delete, provider search/import, URL normalization)
   - Theme system (`theme.json` → CSS variables)
   - Domain routing middleware
   - Import/export system
   - Auth and RBAC
4. Create new Supabase project (fully isolated — never reuse another project's DB)
5. Run schema SQL in order:
   - Admin + content tables
   - RLS policies
6. Create storage bucket (`media`)
7. Set all environment variables (Supabase, JWT, Resend, Unsplash, Pexels)
8. Configure site entry in `_sites.json`
9. Set up local domain alias

### 11.2 Theme Setup (Prompt 0B)

Implement the Visual Design Brief from Stage A:

1. Create `theme.json` with industry color palette, typography, font configuration
2. Update Tailwind config to extend with industry colors
3. Import fonts via `next/font`
4. Populate global settings files:
   - `site.json` — company info, contact, tagline
   - `header.json` — nav items, CTA button, logo config
   - `footer.json` — columns, links, compliance info
   - `seo.json` — default title template, meta description
   - `navigation.json` — full nav structure

### 11.3 Content Contracts (THE KEY STEP — Prompt 0C)

**Before writing any page code, define the complete content model.**

Translate the Page Design Document from Stage A into three concrete artifacts:

**Artifact 1 — Page Inventory & Content Contract Map**

| Page | Route | Content Path | Sections | Has Layout? | Has Collection? |
|------|-------|-------------|----------|-------------|-----------------|
| Home | / | pages/home.json | hero, valueProposition, services, testimonials, howItWorks, caseStudies, coverage, blog, cta | Yes | No |
| Services | /services | pages/services.json | hero, serviceDetails, accessorials, industries, cta | Yes | No |
| Blog Hub | /blog | pages/blog.json | hero, featured, grid, newsletter, cta | Yes | Collection: blog/*.json |
| ... | ... | ... | ... | ... | ... |

**Artifact 2 — Section Contract + Variant + Form Field Definition**

For EVERY section type used across the site:

```
## Section: hero

### Variants:
- centered: centered text, full-width background
- split-image: text left, image right
- video-bg: text overlay on video background
- animated-stats: text + animated stat counters

### JSON Contract:
{
  "hero": {
    "variant": "animated-stats",
    "headline": "string (required)",
    "subline": "string (required)",
    "stats": [{ "value": "string", "label": "string" }],
    "ctaPrimary": { "label": "string", "href": "string" },
    "ctaSecondary": { "label": "string", "href": "string" },
    "backgroundImage": "string (url, optional)"
  }
}

### Form Fields:
- headline: text, required
- subline: textarea, required
- variant: select [centered, split-image, video-bg, animated-stats]
- stats: array → { value: text, label: text }
- ctaPrimary.label: text; ctaPrimary.href: text
- backgroundImage: image picker
```

**Artifact 3 — Global Settings Contract**

Exact JSON shape for: site.json, header.json, footer.json, seo.json, theme.json, navigation.json.

Implementation note: for clone-friendly admin scaling, follow [18.7 Site-Clone Ready Method (ContentEditor Modular Pattern)](#187-site-clone-ready-method-contenteditor-modular-pattern).

### 11.4 Seed Baseline Content (Prompt 0D)

1. Create ALL JSON files with realistic placeholder content matching contracts
2. Create ALL `.layout.json` files defining section order per page
3. Seed everything into Supabase `content_entries` via seed script
4. Register all variant definitions in admin Variants panel
5. Create admin form field definitions for all sections

### 11.5 Phase 0 Done-Gate

- [ ] App boots without errors
- [ ] Admin login works
- [ ] ALL content contracts defined (Artifacts 1-3 complete)
- [ ] ALL JSON files seeded in Supabase `content_entries`
- [ ] Content Editor shows all page files with form panels
- [ ] Variant dropdowns populated for all applicable sections
- [ ] Theme variables injected into CSS
- [ ] Media upload works (Supabase Storage bucket active)
- [ ] Git committed and tagged

---

## 12. Phase 1: Core Pages — Build / Wire / Verify

**Duration:** Week 1-2
**Method:** One Cursor conversation per page. Each page follows the Build → Wire → Verify cycle.

### 12.1 Cursor Prompt Structure

Every Phase 1-2 Cursor prompt should follow this template:

```
Build the [Page Name] page at /[route].

**Content source:**
This page loads from content path: pages/[slug].json
Use loadPageContent() to fetch from Supabase (DB-first, file fallback).
Layout controlled by pages/[slug].layout.json

**Sections (in order):**
1. [Section] — [Description with all fields from contract]
2. [Section] — [Description]
...

**Design requirements:**
- Colors: use theme CSS variables (--color-primary, --color-secondary, etc.)
- Typography: use theme font variables
- NO hardcoded hex colors in any component

**Variant support:**
- [Section] supports variants: [list]
- Render using switch/conditional on section.variant field

**After building, verify (Admin Done-Gate):**
- Page renders correctly from DB content
- Edit content in admin Form mode → save → frontend updated
- Switch variant in admin → save → layout changes
- Edit in JSON mode → save → Form mode synced
- Change section order in layout.json → save → render order changes

Reference @IMPLEMENTATION_PLAN.md and @content-contracts/[page].json
```

### 12.2 Phase 1 Build Order

| # | Prompt | Page | Key Sections | Complexity |
|---|--------|------|-------------|------------|
| 1 | Home Page | / | Hero, value proposition, services, testimonials, process, case study highlight, coverage teaser, blog preview, CTA | High — most sections, sets design system |
| 2 | Header + Footer | Layout | Nav, CTA button, logo, columns, compliance info | Medium — shared components |
| 3 | Services / What We Do | /services | Hero, service details, additional services, industries served, CTA | Medium |
| 4 | Why Us / Differentiator | /why-us | Hero, value props, comparison table, calculator/interactive, testimonials, awards, CTA | High — interactive elements |
| 5 | About | /about | Hero, company story, stats, team, values, certifications, CTA | Medium |
| 6 | Coverage / Locations | /coverage | Hero, map/regions, transit/details, key items, CTA | Medium-High — map component |

### 12.3 Build → Wire → Verify Checklist (per page)

| Check | Description | Pass? |
|-------|-------------|-------|
| Frontend renders | Page loads and displays correctly from DB content | |
| Form edit | Edit a field in admin Form mode → save → frontend shows change | |
| JSON edit | Edit in JSON tab → save → Form mode synced | |
| Variant switch | Change variant in admin → save → layout visually changes | |
| Layout reorder | Change section order in .layout.json → save → page reorders | |
| Theme compliance | No hardcoded hex — all colors from theme tokens | |
| Media fields | Image picker works for hero/media fields | |

### 12.4 Phase 1 Done-Gate

- [ ] 6-8 core pages built and rendering from DB content
- [ ] ALL pages editable in admin Content Editor (Form + JSON mode)
- [ ] Variant switching works on all sections that support variants
- [ ] Layout reordering works on all pages
- [ ] Theme tokens used everywhere (no hardcoded colors)
- [ ] Header and Footer render from global settings (header.json, footer.json)
- [ ] Design system locked: colors, typography, spacing, animation patterns consistent
- [ ] **SEO baseline per page:** unique title, meta description, canonical URL, OG tags (shift-left — don't defer all SEO to Phase 3)
- [ ] Git tagged: `v0.1-core-pages`

---

## 13. Phase 2: Conversion + Content Pages + Polish

**Duration:** Week 3
**Method:** Same Build → Wire → Verify for all remaining pages.

### 13.1 Phase 2 Build Order

| # | Prompt | Page | Key Notes |
|---|--------|------|-----------|
| 7 | Primary Conversion Form | /quote or /get-started | Industry-specific form fields, trust sidebar, validation, confirmation screen |
| 8 | Secondary Conversion | /signup or /book | Account creation or booking form, benefit sidebar |
| 9 | Case Studies / Portfolio | /case-studies + /[slug] | Hub page with grid/filter + individual detail template. Collection pattern. |
| 10 | Testimonials / Reviews | /testimonials | Wall/masonry layout for volume display. 30-50 testimonials. |
| 11 | Blog System | /blog + /blog/[slug] | Hub + post template. **Blog Posts Editor (NOT Content Editor).** |
| 12 | Resources / Guides | /resources | Industry educational content, glossary, downloadable templates |
| 13 | Contact | /contact | Form, direct info, map, quick action cards |
| 14 | FAQ | /faq | Accordion with categories, 25+ questions |
| 15 | Responsive Polish | All pages | Mobile/tablet/desktop, performance, accessibility |

### 13.2 Blog Editor Boundary

This is critical to enforce correctly:

- **Blog posts** → managed in `Admin > Blog Posts` editor (create/edit/delete)
- **Blog hub page settings** (hero, featured config, CTA) → managed in `Content Editor` at `pages/blog.json`
- **No blog entries should appear in Content Editor**
- **No page settings should appear in Blog Posts Editor**

Verify: creating a blog post in Blog Posts Editor → it appears on /blog hub and /blog/[slug].

### 13.3 Form Submission Setup

For quote/contact/signup forms:

1. Form validation with inline error messages
2. Loading state on submit button
3. Submission via Supabase Edge Function → Resend email notification
4. Store submissions in Supabase table (e.g., `quote_requests`)
5. Confirmation screen with next steps and secondary CTA
6. Test: submit form → email arrives → entry stored in DB

### 13.4 Responsive Polish Checklist

- Mobile (< 768px): hamburger nav, single column, thumb-friendly CTAs (44px+), clickable phone numbers
- Tablet (768-1024px): 2-column where appropriate
- Desktop (1024px+): max-width 1280px, trust sidebars on conversion pages
- No horizontal overflow anywhere
- All interactive elements have hover/focus states
- WCAG AA color contrast verified (especially accent colors on white)
- Semantic HTML throughout

### 13.5 Phase 2 Done-Gate

- [ ] ALL pages built and admin-editable (Form + JSON mode)
- [ ] Blog posts manageable through Blog Posts Editor (create/edit/delete)
- [ ] Case studies / portfolio manageable through Content Editor
- [ ] All forms submit correctly with email notification and DB storage
- [ ] Mobile responsive on all pages (tested at 375px, 768px, 1440px)
- [ ] No editor overlap (Content Editor vs Blog Posts Editor)
- [ ] All interactive elements working (calculator, accordion, carousel, etc.)
- [ ] Git tagged: `v0.2-complete-frontend`

---

## 14. Phase 3: Admin Hardening + SEO

**Duration:** Week 4
**Note:** Phase 3 is NOT first-time admin wiring. If Phase 1-2 followed the Build → Wire → Verify pattern, this phase should be gap closure and SEO expansion — not a major rework.

### 14.1 Admin Gap Audit

Run through every public route and check:

| Route | Content in DB? | Form fields complete? | JSON synced? | Variant works? | Theme tokens? | Media fields? | Layout.json? | PASS? |
|-------|---------------|----------------------|-------------|---------------|--------------|--------------|-------------|-------|
| / | | | | | | | | |
| /services | | | | | | | | |
| ... | | | | | | | | |

Fix any gaps found. Target: 100% coverage.
When closing admin gaps, keep/extend the modular editor pattern from [18.7 Site-Clone Ready Method (ContentEditor Modular Pattern)](#187-site-clone-ready-method-contenteditor-modular-pattern).

### 14.2 Programmatic SEO Pages

Build dynamic page templates from Stage A's SEO landscape research:

**Service × Location Pages:**
- Dynamic route: `/[service]/[location]/page.tsx`
- Location data file with cities, states, regions
- Each page: unique H1, intro paragraphs, local relevance, service details, testimonial, CTA
- `generateStaticParams()` for all combinations
- ISR revalidation: 86400s (24 hours)
- Unique meta title and description per page

**Route / Industry / Comparison Pages** (if applicable):
- Separate dynamic routes for each type
- Content from data files or content_entries
- Unique content per page (not thin duplicates)

**Internal Linking:**
- Each programmatic page links to: main service page, nearby locations, related services
- Add "Serving [Region]" sections with cross-links

### 14.3 Schema.org Structured Data

Create utility at `/lib/schema.ts` with helpers:

| Page Type | Schema |
|-----------|--------|
| Site-wide | LocalBusiness, Organization |
| Service pages | Service, Offer |
| Blog posts | BlogPosting, BreadcrumbList |
| FAQ | FAQPage |
| Case studies | Article |
| Location pages | Service with areaServed |
| Testimonials | AggregateRating |

Implement via Next.js metadata API + JSON-LD script tags.

### 14.4 Technical SEO

- **Sitemap.xml** — Dynamic, includes all URLs (core + blog + case studies + programmatic)
- **Robots.txt** — Allow all public, disallow /admin/ and /api/admin/
- **IndexNow** — Integration for Bing/Yandex notification on content publish
- **Canonical URLs** — On all pages, especially programmatic
- **OG tags + Twitter cards** — Every page with appropriate images

### 14.5 Performance Optimization

- **Images:** next/image everywhere, priority on hero, lazy load below-fold, WebP
- **Fonts:** next/font, font-display: swap, subset to latin
- **JavaScript:** Server-render static content, dynamic import interactive components
- **Caching:** ISR 3600s core pages, 86400s programmatic, dynamic for forms
- **Core Web Vitals:** LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Lighthouse audit:** Run on Home, Service page, Conversion page, Blog post, Location page — all scores > 90

### 14.6 Phase 3 Done-Gate

- [ ] Admin gap matrix: 100% coverage (every page editable)
- [ ] Programmatic SEO pages built and generating static paths
- [ ] Schema.org validates on key pages (Rich Results Test)
- [ ] Sitemap includes all URLs (count verified)
- [ ] Lighthouse scores > 90 on all categories
- [ ] IndexNow integration working
- [ ] Canonical URLs correct on all pages
- [ ] Git tagged: `v0.3-launch-ready`

---

## 15. Phase 4: QA + Pre-Launch + Deploy

**Duration:** Week 5

### 15.1 Full Acceptance Testing

**Admin roundtrip — every page:**

| Page | Form Edit | JSON Edit | Variant Switch | Layout Reorder | Media | Blog Create | PASS? |
|------|-----------|-----------|----------------|----------------|-------|-------------|-------|
| Home | | | | | | N/A | |
| Services | | | | | | N/A | |
| Why Us | | | | | | N/A | |
| About | | | | | | N/A | |
| Coverage | | | | | | N/A | |
| Quote | | | | | | N/A | |
| Case Studies | | | | | | N/A | |
| Testimonials | | | | | | N/A | |
| Blog Hub | | | | | | ✓ Test | |
| Resources | | | | | | N/A | |
| Contact | | | | | | N/A | |
| FAQ | | | | | | N/A | |

### 15.2 Content Quality Check

- [ ] All placeholder content replaced with real or high-quality realistic content
- [ ] All images loaded from Supabase Storage (no broken images)
- [ ] Phone, email, address correct (or clearly marked for replacement)
- [ ] Compliance/credentials accurate (licenses, certifications, MC#, DOT#, etc.)
- [ ] No lorem ipsum, "TODO", or "[placeholder]" text remaining
- [ ] Testimonials feel authentic and varied
- [ ] Case studies have realistic metrics
- [ ] Blog posts have substantial content (3+ paragraphs each)

### 15.3 Technical Check

- [ ] No console errors on any page
- [ ] No broken links (run link checker)
- [ ] All forms submit and show confirmation
- [ ] Keyboard-only navigation works across header, forms, and CTA flows
- [ ] Skip link exists and moves focus to primary content container
- [ ] All form controls have programmatic labels (`label` + `htmlFor`/`id`)
- [ ] Form success/error feedback uses screen-reader announcements (`role="status"`/`role="alert"`)
- [ ] All embedded iframes include meaningful `title` attributes
- [ ] Informative images include meaningful alt text (decorative images use empty alt)
- [ ] 404 page styled
- [ ] Favicon and app icons set
- [ ] Privacy Policy and Terms of Service pages exist
- [ ] SSL will be active on production domain

### 15.4 Production Deploy

1. Create new Vercel project (separate from other BAAM systems)
2. Set production environment variables
3. Deploy and verify on Vercel preview URL
4. Configure custom domain in Vercel + DNS
5. Enable SSL (automatic via Vercel)
6. Verify domain routing: production domain → correct site_id → freight frontend
7. Test admin on production
8. Run Lighthouse on production URL

### 15.5 Search Engine Submission

1. Google Search Console: verify domain, submit sitemap
2. Bing Webmaster Tools: submit sitemap
3. Trigger IndexNow for all URLs
4. Google Business Profile: create/claim if applicable

### 15.6 Content Backup

- Export full site content as JSON via admin Import/Export
- Commit as release snapshot
- Document any known limitations or manual steps

### 15.7 Phase 4 Done-Gate

- [ ] All acceptance tests pass
- [ ] Production URL live and accessible with SSL
- [ ] All pages render correctly on production
- [ ] Accessibility quick audit (WCAG 2.1 AA baseline) passes on core routes
- [ ] Admin works on production
- [ ] Sitemap submitted to Google and Bing
- [ ] Content backup exported and committed
- [ ] Git tagged: `v1.0-production`

---

## 16. Phase 5: 12-Month Business Growth Plan

### 16.1 Month 1-2: Launch Foundation

**Content velocity:**
- Publish 8-10 blog posts (launch burst — signals active, authoritative site)
- Collect first 5 real testimonials from actual customers
- Create first 2 real case studies with verified metrics
- Expand programmatic pages to 100+

**Monitoring setup:**
- Vercel Analytics or GA4 enabled
- Google Search Console monitored weekly
- Track: conversions (form submissions, signups), phone calls, organic traffic, pages indexed

**Weekly rhythm:**

| Day | Action |
|-----|--------|
| Mon | Check weekend conversions, plan week's content |
| Tue | Publish blog post |
| Wed | Outreach for testimonials and case studies |
| Thu | Publish blog post |
| Fri | Weekly metrics review, publish blog post if ready |

**Monthly targets:**
- 8-10 blog posts published
- 5+ testimonials collected
- 2+ case studies published
- 100+ programmatic pages live
- Google Search Console: pages beginning to index

### 16.2 Month 3-4: Optimization

**SEO analysis:**
- Which pages are ranking? Double down with related content.
- Which aren't? Improve content, add internal links, re-submit.
- Which keywords get impressions but low clicks? Optimize titles and descriptions.
- Add 30-50 more programmatic pages based on Search Console data.

**Conversion optimization:**
- Review form completion rates — simplify if drop-off is high
- Test CTA copy variations (manual A/B: change monthly, compare results)
- Review bounce rates: Home (target <50%), Conversion page (target <40%)
- Consider: live chat widget if phone/form conversion is low

**Monthly targets:**
- 20+ blog posts total
- 10+ testimonials total
- 5+ case studies total
- 150+ programmatic pages
- Organic traffic: measurable and growing

### 16.3 Month 5-6: Scaling

**Paid acquisition (if organic is growing):**
- Google Ads: target high-intent keywords (e.g., "[industry] quotes near me")
- LinkedIn Ads: target decision-makers in relevant industries (B2B)
- Retargeting: show ads to site visitors who didn't convert
- Budget: start small ($500-1000/month), measure cost-per-lead

**Content authority:**
- Guest posts on industry publications
- Social media presence (LinkedIn primary for B2B, Instagram for visual industries)
- Consider: industry report or whitepaper for lead generation
- Consider: webinar or video content

**Operational improvements:**
- Automate quote/lead response (if volume justifies)
- CRM integration for lead tracking
- Email nurture sequence for signups who haven't converted yet

### 16.4 Month 7-9: Compounding

**By now you should have:**
- 50+ blog posts
- 20+ testimonials
- 10+ case studies
- 200+ total pages (including programmatic)
- Steady organic traffic growth
- Predictable conversion rate

**Focus on:**
- Highest-converting pages → create more similar content
- Lowest-performing pages → update, consolidate, or remove
- Customer retention: check-in emails, loyalty incentives, upsell
- Referral program: incentivize existing customers to refer new business
- Seasonal content: plan for industry-specific peaks

### 16.5 Month 10-12: BAAM Template Extraction

**Template creation:**
1. Document which components, layouts, and content patterns worked best
2. Extract reusable template: same admin backend, templatized frontend
3. Register as BAAM System [X] for this industry
4. Pricing: $20/month per client site

**New client onboarding:** Use **Pipeline B** (Sections 30–41) to automate new client site creation. Pipeline B takes an intake form and produces a fully customized, production-ready site in under 2 minutes:

1. Fill out intake form in Admin Onboarding UI (`/admin/onboarding`) or prepare intake JSON
2. Pipeline runs 7 automated steps: Clone → Brand → Prune → Replace → AI Content → Cleanup → Verify
3. Configure production domain + DNS
4. Deploy to Vercel
5. Train client on admin CMS basics
6. Go live

> **See [Section 30: Pipeline B Overview](#30-pipeline-b-overview) for the complete SOP.**

### 16.6 Growth Targets by Month 12

| Metric | Target |
|--------|--------|
| Organic monthly traffic | 2,000-5,000 visits |
| Monthly conversions (quotes/signups) | 50-100 |
| Blog posts published | 80+ |
| Case studies | 15+ |
| Testimonials displayed | 50+ |
| Programmatic pages | 200+ |
| Total indexed pages | 300+ |
| BAAM template clients | 3-5 |

---

## 17. Admin Content Coverage SOP

### Quick Checklist (for any BAAM industry site)

1. Audit all routes → map to content files → identify gaps
2. Build complete page contracts + layout contracts (Phase 0)
3. Wire frontend to DB-first content loaders (Phase 1-2)
4. Enforce editor boundaries: Content Editor for pages/settings, Blog Posts Editor for blog entries
5. Complete Form mode fields per page (Phase 1-2 done-gates)
6. Activate section variants with real frontend rendering
7. Tokenize theme usage — remove all hardcoded color literals
8. Run QA matrix and sign-off (Phase 4)

### Editor Boundaries

| Editor | Manages | Does NOT Manage |
|--------|---------|-----------------|
| Content Editor | Page content (pages/*.json), page layouts (*.layout.json), site settings (site.json, header.json, footer.json, seo.json, navigation.json, theme.json) | Blog entries |
| Blog Posts Editor | Blog entries (blog/*.json) — create, edit, delete | Page content, site settings |

### Protected Files (non-deletable)

- theme.json
- site.json
- navigation.json
- header.json
- footer.json
- seo.json

---

## 18. Admin Architecture: Collection Editors

### 18.1 The Problem

As BAAM grows, the Content Editor file list becomes unwieldy. Looking at the Proload Express admin, the Content panel lists: About, About.Layout, Blog, Blog.Layout, Case Studies, Case Studies.Layout, Compare, Contact, Contact.Layout, Coverage... and continues. Every page, layout, and collection item appears in one flat list.

This is manageable with 5 pages. It's painful with 12. It's unusable with 20+ pages and dozens of case studies, testimonials, and FAQ items.

### 18.2 The Solution: Dedicated Collection Editors

Extend the Blog Posts pattern to other collection types. Each high-volume content type gets its own dedicated sidebar nav item with purpose-built UI.

**Admin sidebar navigation (target architecture):**

```
Admin Dashboard
├── Sites
├── Site Settings
├── Content              ← Page content ONLY (pages/*.json, *.layout.json, site settings)
├── Blog Posts           ← Already done. Blog entries only (blog/*.json)
├── Case Studies         ← NEW. case-studies/*.json, purpose-built form
├── Testimonials         ← NEW. Dedicated list/edit UI for testimonials array
├── FAQ                  ← NEW. Dedicated list/edit UI for FAQ items
├── [Industry-Specific]  ← Optional: Bookings, Products, Menu Items, etc.
├── Media
├── Components
├── Variants
├── Users
├── Settings
```

### 18.3 What Each Editor Manages

| Editor | Content Scope | CRUD | Purpose-Built Features |
|--------|--------------|------|----------------------|
| **Content** | pages/*.json, *.layout.json, globals (site, header, footer, seo, nav, theme) | Edit only (no create/delete for protected files) | Form + JSON tabs, variant selector, layout editor |
| **Blog Posts** | blog/*.json | Create, Edit, Duplicate, Delete | Title/slug auto-generation, category picker, publish date, featured toggle, rich text |
| **Case Studies** | case-studies/*.json | Create, Edit, Duplicate, Delete | Industry picker, metrics fields, results array, client quote, related case studies |
| **Testimonials** | testimonials.json (array items) | Add, Edit, Remove, Reorder | Star rating, industry tag, featured toggle, drag-to-reorder |
| **FAQ** | faq-items.json (array items) OR pages/faq.json subsection | Add, Edit, Remove, Reorder | Category assignment, drag-to-reorder, expand/collapse preview |

### 18.4 ContentEditor.tsx Refactoring

The current ContentEditor.tsx is too large. Refactor into:

```
components/admin/
├── ContentEditor/
│   ├── index.tsx              ← Orchestrator (file list + active editor)
│   ├── FileList.tsx           ← Left panel: filtered file list
│   ├── FormEditor.tsx         ← Form mode rendering
│   ├── JsonEditor.tsx         ← JSON mode rendering
│   ├── LayoutEditor.tsx       ← Layout section ordering
│   └── VariantSelector.tsx    ← Variant dropdown per section
├── BlogPostsEditor/
│   ├── index.tsx              ← Blog list + active post editor
│   ├── PostList.tsx           ← Left panel: post list with status/date
│   ├── PostForm.tsx           ← Blog-specific form fields
│   └── PostPreview.tsx        ← Live preview
├── CaseStudiesEditor/
│   ├── index.tsx
│   ├── StudyList.tsx
│   └── StudyForm.tsx
├── TestimonialsEditor/
│   ├── index.tsx
│   └── TestimonialForm.tsx
├── FaqEditor/
│   ├── index.tsx
│   └── FaqItemForm.tsx
```

**Key principles:**
- ContentEditor shrinks by extracting sub-components and removing collection logic
- Each collection editor is self-contained with its own list, form, and CRUD operations
- Shared utilities (save, load, media picker, variant selector) remain in common lib
- File filter in Content Editor excludes blog/*, case-studies/*, and any collection-managed paths

### 18.5 Implementation Priority

| Priority | Editor | Effort | Impact |
|----------|--------|--------|--------|
| ✅ Done | Blog Posts | — | Blog management separated |
| High | ContentEditor refactor | 2-3 days | Smaller file, better maintainability |
| High | Case Studies | 1-2 days | Frequent CRUD, industry-specific fields |
| Medium | Testimonials | 1 day | Array management with reorder |
| Medium | FAQ | 1 day | Array management with categories |
| Low | Industry-specific | As needed | Bookings (medical), Products (printing), etc. |

### 18.6 Impact on Phase Template

In the BAAM phase template, Phase 0 should now include:

- Identify which content types need dedicated editors (blog is always yes; case studies and testimonials typically yes; others vary by industry)
- Plan collection editor UI in content architecture step
- In Phase 1-2, build collection editors alongside the pages that use them
- Content Editor file list should never show collection-managed entries

### 18.7 Site-Clone Ready Method (ContentEditor Modular Pattern)

When duplicating BAAM for a new site, keep the refactored `ContentEditor` architecture and only swap site contracts/options. Do **not** return to a monolithic editor file.

**Required structure (recommended baseline):**

```
components/admin/
├── ContentEditor.tsx                    # Orchestrator only (load/save/list/routing)
└── panels/
    ├── SeoPanel.tsx
    ├── HeaderPanel.tsx
    ├── ThemePanel.tsx
    ├── BlogPostItemPanel.tsx
    ├── PortfolioItemPanel.tsx
    ├── ShopProductItemPanel.tsx
    ├── JournalItemPanel.tsx
    └── CollectionItemPanel.tsx
```

**Rules for all future site clones:**
- `ContentEditor.tsx` handles orchestration only: file list, active file, save/delete/duplicate, mode switch, shared callbacks.
- Each panel owns only its own UI fields and receives all state/actions via props.
- Site-specific differences are configured through content contracts + option sources (for example: `pages/portfolio.json`, `pages/shop.json`, `pages/journal.json`).
- Keep shared action APIs stable (`updateFormValue`, `openImagePicker`, `toggleSelection`, etc.) so panels are portable.
- Add new panel files for new collection types instead of adding large inline blocks.

**Clone workflow (fast and safe):**
1. Copy the admin panel structure as-is.
2. Update content contracts for the new industry/site.
3. Update option loaders (category/style/room sources) to new contract paths.
4. Enable/disable panel routes by file path prefix mapping.
5. Run Admin Done-Gate: create/edit/duplicate/delete + preview + JSON roundtrip for every enabled panel.

**Acceptance target for maintainability:**
- `ContentEditor.tsx` should remain an orchestrator (roughly under 1000 lines target).
- Complex forms should be extracted to `components/admin/panels/*`.
- New site customization should mostly touch panel files and contract config, not core orchestration flow.

---

## 19. Governance & Sign-Off

### 19.1 RACI Matrix

For a solo developer / small team BAAM build:

| Activity | Responsible | Accountable | Consulted | Informed |
|----------|-------------|-------------|-----------|----------|
| Stage A: Strategy & design | Developer + Claude | Founder (John) | Client (business owner) | — |
| Stage A gates: approve blueprint | — | Founder | Client | — |
| Phase 0: Infra + contracts | Developer + Cursor | Founder | — | Client |
| Phase 1-2: Build/Wire/Verify | Developer + Cursor | Founder | — | Client (preview links) |
| Phase 1-2: Per-page done-gate | Developer | Founder (spot-check) | — | — |
| Phase 3: SEO + hardening | Developer + Cursor | Founder | — | — |
| Phase 4: QA + launch | Developer | Founder | Client (UAT) | — |
| Phase 4: Go-live sign-off | — | Client + Founder | — | — |
| Phase 5: Content creation | Claude Teams + Developer | Founder | Client | — |
| Phase 5: Growth decisions | Founder | Founder | Client | — |

**For client projects (BAAM as service):**
- Client provides: business info, real content (testimonials, case studies, photos), approval
- Founder provides: strategy, technical execution, quality control
- AI provides: code generation (Cursor), content drafting (Claude), research

### 19.2 Phase Gate Sign-Off Protocol

Each phase ends with a gate review. For a solo/small team, this is a 15-30 minute self-review:

| Gate | Who Signs Off | What They Review |
|------|--------------|-----------------|
| Stage A complete | Founder | All 7 A-Gates pass (see Section 9) |
| Phase 0 complete | Founder | App boots, contracts seeded, admin shows files |
| Phase 1 complete | Founder | Core pages live, admin roundtrip works, design locked |
| Phase 2 complete | Founder + Client preview | All pages, forms work, mobile responsive |
| Phase 3 complete | Founder | Gap matrix 100%, Lighthouse >90, SEO elements in place |
| Phase 4 complete | Founder + Client | UAT pass, content swapped, production URL works |

**Rule: Don't skip gate reviews even on solo projects. A 15-minute checklist review catches issues that cost days later.**

---

## 20. Dual Timeline: Lean vs Full Launch

### 20.1 Lean Launch (Minimum Viable Site — 4 weeks)

For projects with tight deadlines or limited content availability:

| Phase | Duration | Scope |
|-------|----------|-------|
| Stage A | 3-4 days | Abbreviated: page map + contracts + visual direction only |
| Phase 0 | Day 1-2 | Infra + theme + contracts for Tier 1 pages only |
| Phase 1 | Week 1 | 5-6 core pages (Home, Services, About, Contact, Quote/Conversion) |
| Phase 2 | Week 2 | Blog hub (no posts yet), FAQ, responsive polish |
| Phase 3-4 | Week 3-4 | Admin wiring, basic SEO (sitemap, meta), deploy |

**What's deferred to post-launch:**
- Case studies (add as they come in)
- Testimonials page (build once 10+ collected)
- Programmatic SEO pages (Month 2-3)
- Blog content (publish post-launch)
- Comparison pages (Month 3+)
- Full performance optimization (Month 2)

**Lean launch content minimums:**
- 0 blog posts (hub exists, empty)
- 5-10 testimonials (embedded on Home/About only)
- 0 case studies (page exists, "Coming soon" or hidden)
- 15 FAQ items

### 20.2 Full Launch (Premium Site — 7 weeks)

The standard timeline from this plan:

| Phase | Duration | Scope |
|-------|----------|-------|
| Stage A | 1-2 weeks | Complete: all 6 artifacts, all 7 A-Gates |
| Phase 0 | Day 1-3 | Full infra + all contracts + all variants + seed |
| Phase 1 | Week 1-2 | 6-8 core pages + collection editors |
| Phase 2 | Week 3 | All remaining pages + forms + blog + polish |
| Phase 3 | Week 4 | Admin hardening + programmatic SEO + performance |
| Phase 4 | Week 5 | Full QA + content swap + production deploy |

**Full launch content minimums:**
- 6-10 blog posts published
- 20-30 testimonials displayed
- 6+ case studies with detail pages
- 25+ FAQ items
- 50+ programmatic SEO pages

### 20.3 Decision Criteria

Choose **Lean** when:
- Client needs to go live ASAP (e.g., business already operating, no web presence)
- Real content (testimonials, case studies) doesn't exist yet
- Budget is constrained
- Site is proof-of-concept for BAAM template viability

Choose **Full** when:
- The site IS the business (e.g., lead generation is primary revenue driver)
- Enough real content exists or can be created in time
- Competitive market where perceived scale matters (like LTL freight)
- This will become the BAAM template for the industry

---

## 21. Minimum Automation Checks

### 21.1 Why Automation

The QA matrix in Phase 4 is manual-heavy. For a solo developer, manual QA on 12+ pages with multiple checks per page is error-prone and tedious. Basic automated checks catch regressions early.

### 21.2 Automated Check Suite

Create `/scripts/qa-checks.ts` (or equivalent) that runs these checks:

**Schema Validation:**
- For every content JSON file, validate against its TypeScript interface
- Check: all required fields present, correct types, no unexpected keys
- Run: `npm run qa:schema`

**Route Smoke Tests:**
- For every public route, make an HTTP request and verify:
  - Response status 200
  - HTML contains expected `<h1>` text
  - HTML contains `<title>` tag (not empty)
  - HTML contains canonical URL
  - No console errors in server log
- Run: `npm run qa:routes`

**SEO Metadata Checks:**
- For every public route, verify:
  - `<title>` is unique and non-empty
  - `<meta name="description">` exists and is non-empty
  - `<link rel="canonical">` is present and correct
  - `og:title` and `og:description` present
  - `<h1>` exists and is unique on page
- Run: `npm run qa:seo`

**Link Checker:**
- Crawl all internal links, verify no 404s
- Run: `npm run qa:links`

**Content Completeness:**
- For each content JSON, check: no "[placeholder]", "TODO", "lorem ipsum" strings
- Check: all image URLs resolve (no broken images)
- Run: `npm run qa:content`

**Accessibility Baseline (WCAG 2.1 AA Quick Checks):**
- Verify keyboard navigation for primary flows (home, services, contact, booking)
- Verify skip-link visibility and behavior
- Verify form label associations and live-region announcements
- Verify all embedded iframes have a `title` and all meaningful images have alt text
- Run: `npm run qa:a11y`

### 21.3 When to Run

| Check | When |
|-------|------|
| Schema validation | After every Phase 0 seed, after any content edit |
| Route smoke tests | End of Phase 1, end of Phase 2, before Phase 4 launch |
| SEO metadata | End of Phase 1 (core), end of Phase 3 (all pages) |
| Link checker | Before Phase 4 launch |
| Content completeness | Before Phase 4 content swap |

### 21.4 Phase 4 Integration

Add to Phase 4 done-gate:
- [ ] `npm run qa:schema` — 0 errors
- [ ] `npm run qa:routes` — all routes return 200
- [ ] `npm run qa:seo` — all pages have unique title + description + canonical
- [ ] `npm run qa:links` — 0 broken links
- [ ] `npm run qa:content` — 0 placeholder strings remaining
- [ ] `npm run qa:a11y` — no critical accessibility violations on core routes

---

## 22. Rollback & Incident SOP

### 22.1 Deploy Rollback

**Vercel rollback (instant):**
1. Go to Vercel dashboard → Deployments
2. Find last known good deployment (green checkmark)
3. Click "..." → "Promote to Production"
4. Site rolls back within seconds

**Git rollback:**
```bash
# Identify last good tag
git tag --list 'v*'

# Roll back to last good state
git revert HEAD    # If single bad commit
git reset --hard v0.3-launch-ready   # If need full rollback

# Force deploy
git push --force-with-lease
```

**Rule: Always tag before risky operations (Phase 3 SEO changes, Phase 4 content swap, any production deploy).**

### 22.2 Content Rollback

**Bad content push (wrong data saved in admin):**
1. Go to admin → Import/Export
2. Import last known good content export (use "overwrite" mode for affected files only)
3. Verify frontend reflects restored content
4. Re-export and commit new backup

**Prevention:**
- Export content snapshot before every Phase gate
- Export before any bulk content operations
- Store exports in git as versioned JSON

### 22.3 Database Incident

**Supabase data corruption or accidental deletion:**
1. Supabase dashboard → Database → Backups (automatic daily backups)
2. Restore from most recent backup
3. Re-seed any content changes made after backup timestamp
4. Verify admin and frontend both work

**Prevention:**
- Never run raw SQL on production without a backup
- Use seed scripts with UPSERT (not DELETE + INSERT)
- Test destructive operations on local/staging first

### 22.4 Incident Response Protocol

| Severity | Symptoms | Response Time | Action |
|----------|----------|--------------|--------|
| **P0 — Site down** | Production URL returns error | Immediate | Vercel rollback to last good deploy |
| **P1 — Major feature broken** | Forms not submitting, pages crashing | Within 1 hour | Identify bad commit, revert, redeploy |
| **P2 — Content error** | Wrong text, broken images, missing sections | Within 4 hours | Fix in admin or content rollback |
| **P3 — Minor visual issue** | Spacing off, color wrong, mobile glitch | Within 24 hours | Fix in next deploy cycle |

### 22.5 Post-Incident Checklist

After any P0 or P1 incident:
- [ ] Root cause identified
- [ ] Fix deployed and verified
- [ ] Added to anti-patterns list (Section 24)
- [ ] Prevention added to QA checks or Phase done-gates

---

## 23. Content Creation Templates

### Blog Post Brief (for Claude Teams)

```
Industry: [industry]
Topic: [topic]
Target keyword: [primary keyword]
Audience: [who reads this]
Tone: Professional, authoritative, practical — not salesy
Length: 800-1200 words
Structure: H1 title, intro paragraph, 3-5 H2 sections, conclusion with CTA
Include: Actionable advice, specific data points, brief company mention (1-2 sentences)
CTA: "[Action] — get a free [quote/consultation/demo]"
```

### Case Study Brief

```
Client: [industry, size, location]
Challenge: [problem they faced]
Solution: [how we helped]
Results: [specific metrics — savings %, time improvement, satisfaction rate]
Quote: [approved client testimonial]
Format: Overview → Challenge → Solution → Results → Testimonial → CTA
Length: 400-600 words
```

### Testimonial Collection Email

```
Subject: Quick feedback? (30 seconds)
Body:
Thanks for [working with us / using our service].
Could you share 1-2 sentences about your experience?
- What made you choose us?
- How do we compare to alternatives?
- Would you recommend us?
We'd feature your quote on our site with permission.
Just reply — even a one-liner helps.
```

### Programmatic Page Content Brief

```
Page type: [location / route / industry / comparison]
Target keyword: [e.g., "LTL freight in Chicago"]
Unique content: 2-3 paragraphs specific to this [location/route/industry]
Include: Service description, local relevance, transit/details, testimonial, CTA
Avoid: Duplicate content from other programmatic pages
```

---

## 28. REB Admin Reuse for New Site Setup

### 28.1 Decision

Yes, the REB admin improvements are **highly useful** for generating and setting up future sites.  
This work should be treated as a **reusable platform baseline**, not a one-off patch set.

### 28.2 What Can Be Reused Without Rebuilding

The following capabilities are now clone-ready and should carry forward as-is:

- Full collection lifecycle actions across key content types: `New Item`, `Save`, `Duplicate`, `Delete`
- Import/export and diff operations across sidebar content types: `Check Update From DB`, `Overwrite Import`, `Export JSON`
- JSON/form parity and richer form coverage for site settings and collections
- Dedicated table syncing for collections that require DB-backed runtime pages (for example `agents`, `events`, `new-construction`)
- Slug/path synchronization behavior for create/duplicate flows
- Media sync/import foundations so Media reflects content image usage
- RBAC updates for broker-level operational workflows in admin

### 28.3 What Is Still One-Time Per New Site

You still need per-site setup, but this is configuration, not feature re-implementation:

1. New Supabase project and schema migration (first template only — subsequent clients share the project)
2. Environment variables and storage bucket configuration (first template only)
3. Site/domain records and route mapping (`siteId`, locale/domain bindings)
4. Initial content import (source-of-truth decision: DB vs files)
5. Theme/branding content update (`site.json`, `header.json`, `footer.json`, `seo.json`, `theme.json`)

> **Note:** Items 3–5 are fully automated by **Pipeline B** (see [Section 30](#30-pipeline-b-overview)). For sites within the same Supabase project, Pipeline B handles everything from clone to verification — no manual setup needed beyond intake form submission.

### 28.4 Rule for Future Projects

For every new BAAM site, **do not rebuild admin behavior from scratch**.  
Clone this admin baseline first, then perform only:

- site-specific content contract adjustments
- option list/data mapping changes
- project-level configuration and QA verification

### 28.5 Acceptance for Clone Readiness

Before declaring a cloned site ready, run one runtime sweep on 2-3 representative sections (for example `agents`, `events`, `guides`) and confirm:

- `Create -> Save -> Duplicate -> Delete` passes
- `Check Update From DB / Overwrite Import / Export JSON` are coherent
- DB tables and file content remain in sync after operations

---

## 29. Admin Certification SOP (One-Pass Cursor Checklist)

### 29.1 Purpose

This SOP is a single-run admin verification + remediation phase so Cursor can:

1. check all critical admin behaviors end-to-end,
2. fix issues in grouped batches,
3. re-run the same checklist,
4. finish with one final pass/fail report.

Goal: avoid one-by-one issue discovery and repeated back-and-forth.

### 29.2 When To Run

Run this as **Phase 3.5** (after Phase 3 hardening, before Phase 4 launch) and also:

- after major admin refactors,
- after adding new content types to sidebar,
- after RBAC/schema changes,
- after import/export or media pipeline changes.

### 29.3 Scope (What Must Be Certified)

The certification must cover:

- all left-sidebar content sections,
- all core admin actions (`New Item`, `Save`, `Duplicate`, `Delete`, `Format`),
- all sync actions (`Check Update From DB`, `Overwrite Import`, `Export JSON`),
- JSON/Form parity and field completeness,
- DB/file sync (including dedicated tables),
- media visibility/sync behavior,
- RBAC behavior for target roles,
- no destructive side effects after test cleanup.

### 29.4 Sidebar Coverage Matrix (Required)

Cursor must test each section below and mark `PASS` or `FAIL`:

- `site settings` (`site.json`, `header.json`, `footer.json`, `seo.json`, `theme.json`)
- `pages/*`
- `blog/*` (via Blog Posts editor boundary)
- `portfolio/*`
- `shop-products/*`
- `journal/*`
- `collections/*`
- `testimonials`
- `properties/*`
- `neighborhoods/*`
- `market-reports/*`
- `agents/*`
- `knowledge-center/*`
- `new-construction/*`
- `events/*`
- `guides/*`

### 29.5 Action Checklist Per Section

For each section/content type, execute this exact checklist:

1. Open a known file/item.
2. `Format` works and keeps valid JSON.
3. `Save` succeeds (expect `PUT` success).
4. `New Item` works (use disposable slug).
5. `Duplicate` works (new slug generated correctly).
6. `Delete` works for disposable item (expect `DELETE` success).
7. JSON tab edit and Form tab edit stay in sync after save.
8. If section is non-deletable/protected, verify correct guard message.

If browser prompt flows are automation-limited, use API-driven disposable create/duplicate fallback but still validate save/delete in runtime UI.

### 29.6 Sync Integrity Checklist (Global)

Run these once per locale/site combination:

1. `Check Update From DB` dry-run shows clear diff counts and changed paths.
2. `Overwrite Import` applies source-of-truth correctly (DB -> files).
3. `Export JSON` applies source-of-truth correctly (files -> DB).
4. Re-run `Check Update From DB` to verify no unexpected residual diffs.
5. Verify collection dirs are included in diff (`agents`, `knowledge-center`, `new-construction`, `events`, `guides`, etc.).
6. Verify slug-path consistency after create/duplicate across collection folders.

### 29.7 Dedicated Table + Content Entry Consistency

For relevant types (`agents`, `new-construction`, `events`):

- create/update/delete from admin must reflect in both:
  - `content_entries` path row
  - dedicated table row (`site_id + slug`)
- duplicate must write correct slug in both stores
- delete must remove from both stores

Record result as `PASS` only if both layers are consistent.

### 29.8 Media Checklist

Verify:

1. Media panel lists content-used images after sync/import.
2. URL normalization works for bucket and external-origin paths per policy.
3. Image picker updates content JSON and persists after save.
4. No broken media references in sampled pages/collections.

### 29.9 RBAC Checklist

At minimum test these roles on target site:

- `super_admin`
- `broker_admin`
- `site_admin` (if used)
- `editor` (write scope only where intended)

For each role validate visibility + action permission on:

- users, sites/domains, content actions, media actions, import/export actions.

### 29.10 Cursor One-Pass Execution Flow

Use this execution order in one Cursor run:

1. **Discover**: collect all sidebar sections and action handlers.
2. **Baseline**: run quick pass/fail matrix without edits.
3. **Batch Fix A**: action wiring bugs (`New/Save/Duplicate/Delete/Format`).
4. **Batch Fix B**: sync pipeline bugs (`check/import/export`, diff observability).
5. **Batch Fix C**: DB schema compatibility + dedicated table sync.
6. **Batch Fix D**: JSON/Form parity and panel completeness.
7. **Batch Fix E**: media sync/listing/normalization.
8. **Re-test Full Matrix**: same checklist, fresh pass.
9. **Cleanup**: remove disposable QA items.
10. **Report**: final pass/fail matrix + residual risks.

### 29.11 Required Deliverables

After this SOP run, Cursor must provide:

1. **Admin Certification Matrix** (section x action pass/fail).
2. **Sync Matrix** (`check/import/export` pass/fail with notes).
3. **RBAC Matrix** (role x capability pass/fail).
4. **Fix Log** (files changed + what issue each fixed).
5. **Residual Risk List** (if any) with owner and next action.

### 29.12 Exit Criteria (Phase 3.5 Complete)

Phase 3.5 is complete only when:

- all targeted sections pass action checklist,
- sync actions pass with no unexplained diffs,
- dedicated table/content consistency passes,
- JSON/Form parity passes for key settings and collections,
- media checks pass,
- disposable QA artifacts are cleaned up,
- final report contains zero P0/P1 admin defects.

---

## 26. Theme Token Normalization Playbook

Quick link: see `THEME_NORMALIZATION_SOP.md` for the daily execution checklist used in Cursor prompts and QA passes.

This section defines how to normalize `theme.json` and related styling work across every new BAAM site so design decisions are centralized, predictable, and admin-safe.

### 26.1 Goal

Create **one source of truth** for visual decisions:

- `theme.json` stores tokens (color, typography, radius, spacing rhythm, effects, detail layout)
- `[locale]/layout.tsx` maps tokens to CSS variables
- `styles/globals.css` provides defaults + utility/semantic classes consuming CSS vars
- page/components consume only utilities/CSS vars (no hardcoded visual literals)

If a style value appears more than once, it should become a token candidate.

### 26.2 Token Layers (Required)

For each site, keep these layers in `theme.json`:

1. **Foundation tokens**
   - `colors`, `typography`, `borderRadius`
2. **Behavior/effect tokens**
   - `opacity`, `effects` (hero overlays, media dim, card overlays, text shadows)
3. **Layout tokens**
   - global + section spacing, sticky offsets, detail-page structure
4. **Component tokens**
   - buttons, chips, media badges, card widths, recurring block patterns

Rule: foundation is generic, behavior/layout/component are allowed to be site-specific.

### 26.3 Naming Rules

- Use lowercase camelCase in JSON keys.
- Use semantic names first (`heroContentBottom`, `relatedGridLarge`) not implementation names (`gap7`).
- CSS variables use kebab-case with clear prefix:
  - `--detail-*` for detail-page tokens
  - `--hero-*` for hero/effect tokens
  - `--on-dark-*` for dark-surface text system
- Keep fallback values in CSS var mapping, not in page JSX.

### 26.4 Required Mapping Flow

Every tokenized value must follow this pipeline:

1. Add token in `theme.json`
2. Inject CSS variable in `app/[locale]/layout.tsx`
3. Add default fallback in `styles/globals.css`
4. Consume through:
   - semantic utility class preferred (`detail-section-title`, `detail-card-meta`)
   - direct `style={{ ...var(...) }}` only when utility is not appropriate

Never skip step 2 or 3.

### 26.5 Page Implementation Rules

- No hardcoded color hex in page components.
- No raw `rgba(...)` in page components when an effect token exists.
- Repeated spacing/gap/rhythm classes should be converted into semantic utility classes.
- Prefer semantic classes over long class chains:
  - `detail-back-link` instead of repeated `inline-flex items-center ...`
  - `detail-section-title` instead of repeated heading size/weight/margin/color bundles
  - `detail-card-title` and `detail-card-price` for repeated card metadata

### 26.6 Admin + Content Editor Compatibility

- `theme.json` remains editable from Content Editor (`site settings` scope).
- Any new token group added must:
  - preserve backward fallback behavior
  - not break existing pages if the token is missing
- Protected files list should continue to include `theme.json`.

### 26.7 Normalization Workflow (for each new build)

Run this in Phase 0 and continue during Phase 1-3:

1. **Audit**
   - scan target pages for hardcoded visual values (color, opacity, spacing, radius, shadows)
2. **Cluster**
   - group repeated values into candidate tokens
3. **Promote**
   - add tokens to `theme.json` using semantic naming
4. **Map**
   - wire into `layout.tsx` CSS variable injection
5. **Apply**
   - replace page literals with semantic utility classes
6. **Consolidate**
   - remove redundant micro utility classes when semantic class exists
7. **Verify**
   - lint, visual spot-check, admin roundtrip edit test

### 26.8 Done-Gate: Theme Normalization

Before Phase 3 is marked complete:

- [ ] Top pages + detail pages have no hardcoded visual literals that are already tokenized
- [ ] `theme.json` covers colors, typography, radii, effects, layout spacing, and key component sizing
- [ ] `layout.tsx` injects all active token groups with safe fallbacks
- [ ] `globals.css` contains semantic utilities for repeated patterns
- [ ] No duplicate utility classes for the same purpose
- [ ] Lint passes, and core pages visually match pre-normalization intent

### 26.9 Anti-Drift Rule

Any PR that introduces new hardcoded visual values must either:

1. justify why it is intentionally one-off, or
2. add/update tokens and utilities in the same PR.

This keeps BAAM sites maintainable and prevents style drift over time.

---

## 27. Platform Guardrails (Julia Studio Learnings)

This addendum captures implementation-level rules derived from Julia Studio production work. Keep these as non-optional guardrails for future BAAM builds.

### 27.1 Public vs Admin Data Access

- Public pages must never depend on `/api/admin/*` routes.
- Visitor-facing content should use public content loaders/endpoints only.
- Reason: admin auth/rbac behavior in production can return empty responses and make public pages appear blank.

### 27.2 Site Resolution in Multi-Site Environments

- Do not hardcode `siteId` in public client fetches.
- Resolve site context from host/domain by default, with explicit override only when required.
- Public APIs should accept optional `siteId` and safely infer from request host when absent.

### 27.3 Content Sync Direction (Import vs Export)

- **Import (overwrite):** DB -> local files.
- **Export:** local files -> DB.
- Before running either action, require an explicit source-of-truth decision for this operation.
- If `DB newer conflicts = 0` and DB is authoritative, import is the default safe path.

### 27.4 Slug Integrity Contract

- For collection entries, `slug` must always equal filename stem (path-derived slug).
- Create, save, and duplicate flows must enforce slug/path synchronization automatically.
- Diff tooling must include collection directories so slug mismatches are always detected.

### 27.5 Diff Observability Standard

- "Check Update From DB" outputs must include:
  - total changed file counts (`create`, `update`, `conflicts`)
  - folder-level breakdown (`portfolio`, `journal`, `shop-products`, etc.)
  - sample changed paths for rapid diagnosis
- Goal: make operator decisions obvious before any overwrite action.

### 27.6 Theme Token Governance

- Visual changes (font, color, radius, shadow, overlay, spacing rhythm) must be token-first:
  1. define in `theme.json`
  2. map to CSS variables in layout
  3. consume via semantic classes/utilities
- Avoid one-off visual literals in page components when a tokenized equivalent exists.

### 27.7 Admin Form Completeness Rule

- Complex content contracts (for example testimonials/services) require dedicated panel components, not monolithic inline editors.
- Required capabilities: add/remove/reorder, constrained options (dropdowns), media field support, and JSON/Form roundtrip parity.

### 27.8 Pre-Deploy Operational Checklist (Minimum)

- Run production build (`npm run build`) and ensure zero type/lint failures.
- Smoke test core listing pages (`portfolio`, `collections`, `shop`, `journal`) on target domain and both locales.
- Run sync dry-run and resolve direction (`import` vs `export`) before content operations.
- Spot-check at least one collection file for slug/path consistency after duplicate/create flows.

### 27.9 Content Sync Safety Rule (Single-File by Default)

- Default operation is single-file sync (`Sync Current File to DB`) with required `includePaths`.
- Locale-wide import in `missing` mode is blocked at API level when `includePaths` is empty.
- Locale-wide overwrite is allowed only from explicit `Overwrite Import` UI flow (`source = admin-overwrite-button`).
- Production overwrite requires break-glass env + token:
  - `ALLOW_PROD_OVERWRITE_IMPORT=true`
  - `PROD_IMPORT_GUARD_TOKEN` present and matched by request `guardToken`
- Operational rule: vague "sync to DB" commands must never trigger full-locale write.

---

## 24. Anti-Patterns & Lessons Learned

| Anti-Pattern | Why It Hurts | Prevention |
|---|---|---|
| **Bundle all phases into one file** | Cursor context bloat, can't attach only the active phase, no clean completion boundary per phase | Generate one file per phase (see Section 10.5). Never write PHASE_0 through PHASE_5 in a single document. |
| Skip Stage A (design) | Generic site, missing industry features, poor conversion | Always complete all 6 Stage A artifacts + 7 A-Gates before coding |
| Defer admin to late phase | Massive rework, content shape mismatches | Build → Wire → Verify per page in Phase 1-2 |
| Hardcode colors in components | Theme changes don't propagate | Theme tokens only, audit in Phase 0 |
| Manage blog in Content Editor | Editor confusion, filter bugs | Strict editor boundaries from Phase 0 |
| One giant ContentEditor.tsx | Hard to maintain, slow to add features | Refactor into sub-components, extract collection editors |
| All collections in Content Editor | Overwhelming file list, no purpose-built UI | Dedicated editors for blog, case studies, testimonials, FAQ |
| Build page without content contract | Frontend and admin shapes diverge | Contract-first: define JSON before coding UI |
| Placeholder JSON stubs in production | Admin shows empty/broken forms | Full realistic content in all JSON files |
| Skip roundtrip testing | "Works in JSON but not Form mode" | Done-gate requires Form → JSON → Save → Preview |
| Mix Supabase + local JSON sources | Inconsistent data, stale content | DB-first always, filesystem fallback only |
| Defer ALL SEO to Phase 3 | Core pages launch without meta/canonical | Shift-left: basic SEO metadata in Phase 1 for core pages |
| Programmatic pages before core works | SEO pages inherit bugs from templates | Core pages first (Phase 1-2), programmatic in Phase 3 |
| Skip performance audit | Slow site, poor Core Web Vitals | Lighthouse audit mandatory in Phase 3 |
| Launch with placeholder content | Looks fake, destroys trust | Content swap checklist + automated content check in Phase 4 |
| Reuse Supabase project across systems | Cross-client data leakage | Always create new Supabase project per system |
| Copy medical structure to new industry | Loses industry-specific features | Stage A designs industry-native architecture |
| No deploy rollback plan | Bad deploy stays live for hours | Tag before every deploy, know Vercel rollback steps |
| Manual-only QA | Regressions slip through | Minimum automated checks (schema, routes, SEO, links) |
| No content backup before changes | Lost work, no recovery | Export content snapshot at every Phase gate |
| **Manual client onboarding via admin CMS** | Hours of manual editing per client, inconsistent results, template contamination | Use Pipeline B (Section 30). Admin "New Site" is only O1 (clone) — 6 more steps are needed. |
| **Hardcode template strings in pipeline** | New industry requires rewriting the pipeline | Use intake-driven replacement pairs + industry config. Pipeline orchestration is shared, only catalogs/prompts change. |
| **Skip AI content for production clients** | Site launches with template hero/bios/testimonials | Only skip AI for testing. Production clients need unique content ($0.13/client is negligible). |
| **Forget replacement pair ordering** | Partial matches corrupt content (e.g., "NY" replaced inside "Middletown, NY") | Always replace longest strings first. Sort pairs by length descending. |
| **Share Supabase project across industries** | Different schema needs, data leakage, migration conflicts | One Supabase project per industry template. Multiple clients share the same project within an industry. |

---

## 25. Process Summary Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  STAGE A: Strategy & Design (1-2 weeks) — with Claude        │
│                                                              │
│  A1: Industry Deep Dive (competitors, customers, SEO)        │
│  A2: Brand Positioning (differentiation, 5 pillars)          │
│  A3: Page Design (every page, every section, every CTA)      │
│  A4: Component Inventory (NEW vs REUSE)                      │
│  A5: Visual Design Direction (colors, type, photos)          │
│  A6: Content Strategy & Funnel (conversion map, content plan)│
│                                                              │
│  ► 7 Acceptance Gates must pass before Stage B begins        │
│                                                              │
│  Output: 6 artifacts = Complete site blueprint               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  STAGE B: Implementation (5 weeks) — with Cursor             │
│                                                              │
│  ⚡ Phase files generated ONE AT A TIME (V3.3 Rule)           │
│     [SYSTEM]_PHASE_0.md → [SYSTEM]_PHASE_1.md → ...         │
│     Each file generated after the previous is confirmed.     │
│     Attach ONLY the active phase file in Cursor sessions.    │
│                                                              │
│  Phase 0: Infra + Content Contracts (Day 1-3)                │
│           └── Supabase, theme, contracts, seed, variants     │
│           └── Collection editor plan (which types get own UI)│
│                                                              │
│  Phase 1: Core Pages — Build/Wire/Verify (Week 1-2)          │
│           └── 6-8 core pages, all admin-editable             │
│           └── SEO baseline: meta + canonical + OG per page   │
│                                                              │
│  Phase 2: All Pages + Conversion + Polish (Week 3)           │
│           └── Forms, blog, case studies, testimonials, mobile │
│           └── Collection editors built (case studies, etc.)   │
│                                                              │
│  Phase 3: Admin Hardening + SEO (Week 4)                     │
│           └── Gap audit, programmatic pages, schema, sitemap │
│           └── Automated QA checks created and passing        │
│                                                              │
│  Phase 4: QA + Launch (Week 5)                               │
│           └── Acceptance tests (manual + automated)          │
│           └── Content swap, deploy, submit, rollback plan    │
│                                                              │
│  Output: Live master template site (BAAM System [X])         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PIPELINE B: Client Onboarding (per client, <2 min)  ⚡V3.4  │
│                                                              │
│  Input:  Intake form (business info, services, brand)        │
│  Method: Admin UI wizard OR CLI script                       │
│                                                              │
│  O1: Clone    — Copy content, media assets & uploads to new  │
│  O2: Brand    — Apply color palette + font pairing           │
│  O3: Prune    — Remove disabled services (5 files)           │
│  O4: Replace  — Deep string replacement (NAP, 17 pairs)     │
│  O5: AI       — Generate hero, bios, testimonials, SEO       │
│  O6: Cleanup  — Delete unsupported locale entries            │
│  O7: Verify   — Required paths + contamination scan          │
│                                                              │
│  Output: Production-ready client site (~$0.13/client)        │
│                                                              │
│  Repeat for each new client. Same template, unique content.  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PHASE 5: Business Growth (12 months)        [PHASE_5.md]   │
│                                                              │
│  Month 1-2:   Launch burst + monitoring setup                │
│  Month 3-4:   SEO optimization + conversion improvement      │
│  Month 5-6:   Scale (paid acquisition + authority content)   │
│  Month 7-9:   Compound growth + retention                    │
│  Month 10-12: BAAM template extraction + first clients       │
│                                                              │
│  Output: Revenue-generating site + reusable industry template│
│                                                              │
└──────────────────────────────────────────────────────────────┘

Lean launch: Stage A (3-4 days) + Stage B (3 weeks) = 4 weeks
Full launch: Stage A (1-2 wk) + Stage B (5 wk) = 7 weeks
Pipeline B: <2 min per client (after master template is built)
Phase 5: 12 months to mature BAAM template

The lifecycle: Stage A designs → Stage B builds → Pipeline B scales
Each new client = Pipeline B run, not a new Stage A/B cycle.

Reference build: BAAM System D (Dental) — March 2026
Phase files: DENTAL_PHASE_0.md through DENTAL_PHASE_5.md
Pipeline B SOP: Client_Onboarding_Master_Plan.md
```

---

## 30. Pipeline B Overview

> **⚡ V3.4 — This section defines the complete client onboarding pipeline.**
> Industry-specific implementation details belong in the per-industry `Client_Onboarding_Master_Plan.md`.
> This section is the **industry-agnostic framework** that all implementations follow.

### 30.1 Where Pipeline B Fits

```
Stage A (Design)  →  Stage B (Build)  →  Pipeline B (Scale)
   1-2 weeks            5 weeks            <2 min per client
   One time             One time           Repeatable
```

- **Stage A** designs the industry (research, positioning, page architecture, visual direction)
- **Stage B** builds the master template site (Phases 0-4 → production-ready template)
- **Pipeline B** clones that template for each new client (intake form → 7 automated steps → live site)

**Stage A and B happen once per industry. Pipeline B runs once per client.**

### 30.2 What Pipeline B Does

Takes a **client intake form** (JSON) and a **master template site** and produces a **fully customized, production-ready client site** in under 2 minutes.

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Intake Form     │ ──→ │  Pipeline B   │ ──→ │  New Client Site     │
│  (JSON)          │     │  (7 steps)    │     │  (ready to launch)   │
└─────────────────┘     └──────────────┘     └─────────────────────┘
```

### 30.3 What Changes Per Client

| Category | What Changes | Method |
|----------|-------------|--------|
| **NAP** | Name, Address, Phone, Email | Deterministic string replacement (O4) |
| **Brand** | Colors, fonts, visual identity | Variant selection + overrides (O2) |
| **Services** | Which services/products are offered | Pruning — delete disabled (O3) |
| **Content** | Hero tagline, bios, testimonials, about story | AI generation via Claude API (O5) |
| **SEO** | Page titles, meta descriptions | AI generation via Claude API (O5) |
| **Team** | Owner profile, team member profiles | Structural rebuild + AI bios (O4/O5) |
| **Hours** | Business operating hours | Deterministic from intake (O4) |
| **Social** | Facebook, Instagram, Google, Yelp links | Deterministic from intake (O4) |
| **Locales** | Which languages supported | Cleanup — delete unsupported (O6) |
| **Domain** | Production URL, dev alias | Domain registration (O1) |
| **Layout** | Section ordering per page | Cloned from template (editable after) |

### 30.4 What Stays the Same (cloned from template)

- Page structure and React components
- Blog posts and case studies (template content)
- Gallery images
- UI components and styling system
- Admin dashboard functionality
- API endpoints
- Layout files (section ordering per page)

### 30.5 Execution Methods

| Method | When to Use | Interface |
|--------|------------|-----------|
| **Admin Onboarding UI** | Production use — browser-based form at `/admin/onboarding` | See [Section 37](#37-admin-onboarding-ui) |
| **CLI Script** | Development/testing — `node scripts/onboard-client.mjs {client-id}` | JSON intake file + terminal |

Both methods execute the same 7-step pipeline. The admin UI streams progress via SSE; the CLI logs to terminal.

**Utility Scripts:**

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/verify-site.mjs` | Post-onboarding verification across all layers (DB, storage, local, JSON) | `node scripts/verify-site.mjs {site-id} [template-id]` |
| `scripts/delete-site.mjs` | Interactive site deletion with per-step confirmation | `node scripts/delete-site.mjs {site-id} [--dry-run]` |
| `scripts/test-onboard-tcm-hub.mjs` | Reference test script for manual onboarding testing | `node scripts/test-onboard-tcm-hub.mjs` |

See [SITE_ONBOARDING_SOP.md](SITE_ONBOARDING_SOP.md) for the full onboarding procedure and [SITE_DELETION_SOP.md](SITE_DELETION_SOP.md) for the full deletion procedure.

### 30.6 Prerequisites

| Requirement | Detail |
|-------------|--------|
| Master template site | Fully built (Stage B complete), all content synced to Supabase |
| Supabase tables | `sites`, `site_domains`, `content_entries`, `media_assets` |
| Supabase Storage bucket | Bucket with template media files (e.g., `chinesemedicine-media`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project REST API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for DB operations |
| `SUPABASE_STORAGE_BUCKET` or `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Storage bucket name for media files |
| `ANTHROPIC_API_KEY` | Claude API key (required for AI steps; skippable with `--skip-ai`) |

### 30.7 Pipeline B Done-Gate (per industry)

Before declaring Pipeline B operational for a new industry:

- [ ] Master template fully built and synced (Stage B Phase 4 complete)
- [ ] Pipeline runs end-to-end with 0 errors, 0 warnings
- [ ] Media assets cloned and uploads directory copied (no broken images)
- [ ] Brand variant selection produces visually correct themes
- [ ] Service pruning removes correct entries from all 5 file types
- [ ] Deep replacement eliminates ALL template NAP strings
- [ ] AI content generates unique, industry-appropriate copy
- [ ] AI SEO generates correct per-page titles and descriptions
- [ ] Locale cleanup removes only unsupported locale entries
- [ ] Verification catches known failure modes (missing paths, contamination)
- [ ] Admin Onboarding UI tested end-to-end with SSE progress
- [ ] At least one full test client created and visually verified

---

## 31. 7-Step Pipeline (O1–O7)

### Overview

| Step | Name | Duration | Method |
|------|------|----------|--------|
| O1 | Clone | ~15s | Copy content entries, media assets DB records, storage bucket files, and local uploads to new site_id |
| O2 | Brand | <1s | Apply color palette + font pairing |
| O3 | Prune | ~3s | Remove disabled services from 5 content files |
| O4 | Replace | ~5s | Deep string replacement + structural file rebuilds |
| O5 | AI Content | ~15-25s | Claude API generates unique copy + SEO |
| O6 | Cleanup | <1s | Delete entries for unsupported locales |
| O7 | Verify | <1s | Required paths + contamination + service count checks |

**Total: ~30-50 seconds with AI, ~15 seconds without.**

### O1: CLONE — Create Site & Copy Content

| Action | Detail |
|--------|--------|
| Check if site exists | Query `sites` table by `clientId` |
| Create site record | Insert into `sites`: id, name, domain, enabled, locales |
| Clone content entries | Copy ALL entries from template → new site_id (batch 50) |
| Register domains | Upsert production + dev domains to `site_domains` table |
| Clone media assets | Copy `media_assets` DB records, remap URLs from `/{template}/` → `/{new}/` (handles both `/uploads/` and Supabase Storage bucket paths) (batch 100) |
| Copy storage bucket files | List all files under `{bucket}/{template}/` via Storage API, copy each to `{bucket}/{new}/` (concurrency 5) |
| Copy uploads directory | `public/uploads/{template}/` → `public/uploads/{new}/` (local fallback images) |
| Copy content directory | `content/{template}/` → `content/{new}/` (file-based fallbacks) |
| Update local files | Append to `_sites.json` and `_site-domains.json` |

**Idempotent:** Uses `ON CONFLICT (site_id, locale, path)` merge-duplicates for content and `ON CONFLICT (site_id, path)` for media. Storage copy ignores "already exists" errors. File copy uses `errorOnExist: false`. Safe to re-run.

### O2: BRAND — Apply Theme

| Action | Detail |
|--------|--------|
| Load variant | Select from `brand-variants.json` by `intake.brand.variant` |
| Override primary color | If `primaryColor` set: generate dark/light/50/100 shades |
| Override secondary color | If `secondaryColor` set: same shade generation |
| Override fonts | If `fonts.display` or `fonts.body` set: replace in typography |
| Upsert theme.json | Single entry to `content_entries` |

**Color shade generation algorithm:**
- `dark` = darken by 12% lightness
- `light` = lighten by 18% lightness
- `50` = lighten by 42% lightness (very pale)
- `100` = lighten by 32% lightness

### O3: PRUNE — Remove Disabled Services

For each disabled service (not in `intake.services.enabled`), remove from 5 files:

| File Updated | What's Removed |
|-------------|---------------|
| `services/{slug}.json` | Entire entry deleted |
| `navigation.json` | Service link removed from mega-menu; empty category headers removed |
| `pages/services.json` | Service removed from `servicesList.items`; empty categories removed |
| `pages/home.json` | Service removed from homepage services section |
| `footer.json` | Service link removed from footer service list |

### O4: REPLACE — Deterministic NAP + Structural Updates

**Phase A: Deep String Replacement.** Applies to ALL content entries (except theme.json). Recursive replacement through every string value in every JSON entry.

**Replacement pair rules:**
1. Template-specific strings are paired with intake values
2. Longer strings are replaced first to avoid partial matches (e.g., "Middletown, NY 10940" before "Middletown")
3. Only pairs with non-empty replacement values are applied (empty intake fields → template value preserved)

**Typical replacement pairs (17 for dental, varies by industry):**
- Business name (full → short)
- Domain
- Phone (formatted + digits + tel: link)
- Email (info + mailto: + appointments)
- Address (full → street → city-state-zip → city-state → city → state-zip → zip)

**Phase B: Structural File Updates.** These files get specific structural rebuilds beyond string replacement:

| File | Key Changes |
|------|-------------|
| `site.json` | Full rebuild: all NAP fields, hours, social, booking, insurance, display, languages |
| `header.json` | logoText, CTA phone link, announcement bar |
| `footer.json` | Brand section, contact section, hours array, copyright |
| Contact page JSON | Contact methods, map embed URL, emergency phone |
| Doctor/team JSONs | Delete template profiles, create new from intake |

**Conditional behavior:** If an intake field is empty/missing, the template's original value is preserved. Only fields with actual data trigger replacement.

### O5: AI CONTENT — Generate Unique Copy

**Duration:** ~15–25 seconds (2 API calls)
**Cost:** ~$0.10–0.15 per client
**Model:** claude-sonnet-4-20250514
**Skippable:** `--skip-ai` flag (uses template content as-is)

**Call 1 — Content generation:**

| Content | Target | Length |
|---------|--------|--------|
| Hero tagline | Homepage hero | 6–8 words |
| Hero description | Homepage hero | 1–2 sentences |
| About story | About page | 3 paragraphs (~200 words) |
| Owner bio | About page + doctor profile | 3 paragraphs (~250 words) |
| Owner quote | About page | 1 sentence |
| Team bios | Doctor profiles | 2 paragraphs each (~150 words) |
| Why Choose Us | Homepage features | 5 items (icon + title + description) |
| Testimonials | Testimonials section | 5 reviews (name + text + category + rating) |
| Announcement | Header bar | ~15 words |

**Call 2 — SEO generation:**

| Content | Target |
|---------|--------|
| Site title | `seo.json` → `title` |
| Site description | `seo.json` → `description` |
| Per-page titles | `seo.json` → `pages.{page}.title` (all pages) |
| Per-page descriptions | `seo.json` → `pages.{page}.description` (all pages) |

**Prompt template system:** Prompts live at `scripts/onboard/prompts/{industry}/content.md` and `seo.md`. Variables are interpolated with `{{variable}}` syntax from intake data.

### O6: CLEANUP — Remove Unsupported Locales

- Compare content entry locales against `intake.locales.supported`
- Delete all entries for unsupported locales (default locale is always kept)
- Example: Template has en/zh/es/ko → Client wants en/ko → Delete zh/es entries

### O7: VERIFY — Integrity Checks

| Check | Pass Criteria | Level |
|-------|--------------|-------|
| Required paths | Core files exist per locale (site, header, footer, nav, seo, home, services, about, contact) | ERROR |
| Template contamination | No entries contain template business name, phone, or address | WARNING |
| Service count | Actual service entries = intake services enabled count | WARNING |
| Domain aliases | At least 1 domain registered in `site_domains` | ERROR |

ERROR-level failures stop the pipeline. WARNING-level issues are reported but the pipeline completes.

---

## 32. Intake Form Schema

The intake JSON is the single source of truth for client customization. Every field drives one or more pipeline steps.

### Required Fields

| Field | Type | Example | Drives Step |
|-------|------|---------|-------------|
| `clientId` | string | `"bright-smile-dental"` | O1 (site_id) |
| `templateSiteId` | string | `"alex-dental"` | O1 (clone source) |
| `industry` | string | `"dental"` | O5 (prompt selection) |
| `business.name` | string | `"Bright Smile Dental"` | O4 (replacement) |
| `services.enabled` | string[] | `["cleanings-and-exams", ...]` | O3 (pruning) |

### Optional Fields (preserve template value when empty)

| Section | Key Fields | Drives Step |
|---------|-----------|-------------|
| `business` | ownerName, ownerTitle, credentials, certifications, specializations, languages, teamMembers, foundedYear | O4, O5 |
| `location` | address, city, state, zip, phone, email, lat/lng, mapsEmbedUrl | O4 |
| `hours` | monday–sunday, emergencyNote | O4 |
| `social` | facebook, instagram, google, yelp, youtube | O4 |
| `domains` | production, dev | O1 |
| `locales` | default, supported[] | O1, O6 |
| `brand` | variant, primaryColor, secondaryColor, fonts.display, fonts.body | O2 |
| `insurance` | acceptsInsurance, inNetworkNote, financingNote, membershipEnabled | O4 |
| `booking` | onlineBookingEnabled, bookingUrl, preferredContactMethod | O4 |
| `display` | showLanguageSwitcher, showEmergencyBanner, emergencyBannerText | O4 |
| `contentTone` | voice, uniqueSellingPoints[], targetDemographic | O5 |
| `stats` | array of { icon, number, label } | O4 |

### Industry-Specific Extensions

Each industry can extend the intake schema with additional fields. The pipeline ignores unknown fields, so extensions are additive:

| Industry | Extension Fields |
|----------|-----------------|
| Dental | `insurance.membershipPlanName`, `business.ownerCredentials[]` |
| Restaurant | `menu.categories[]`, `cuisine.type`, `reservations.provider` |
| Med-Spa | `treatments[]`, `providers[]`, `booking.depositRequired` |
| Legal | `practiceAreas[]`, `barAdmissions[]`, `caseResults[]` |

---

## 33. Brand Variant System

### 33.1 Predefined Palettes

Each BAAM industry ships with 5 predefined brand variants. These are stored in `scripts/onboard/brand-variants.json`.

| Variant | Primary | Secondary | Display Font | Body Font | Feel |
|---------|---------|-----------|-------------|-----------|------|
| **teal-gold** | #0D6E6E | #C9A84C | Playfair Display | Inter | Premium, traditional |
| **blue-silver** | #2563EB | #94A3B8 | Montserrat | Open Sans | Modern, clinical |
| **green-cream** | #2D6A4F | #DDA15E | Lora | Source Sans 3 | Natural, warm |
| **purple-rose** | #6D28D9 | #EC4899 | Cormorant Garamond | Nunito Sans | Luxurious, bold |
| **navy-copper** | #1E3A5F | #B87333 | DM Serif Display | DM Sans | Authoritative, classic |

### 33.2 Theme JSON Structure

```json
{
  "colors": {
    "primary": { "DEFAULT": "#hex", "dark": "#hex", "light": "#hex", "50": "#hex", "100": "#hex" },
    "secondary": { "DEFAULT": "#hex", "dark": "#hex", "light": "#hex", "50": "#hex" },
    "backdrop": { "primary": "#hex", "secondary": "#hex" }
  },
  "typography": {
    "fonts": {
      "display": "'FontName', fallback",
      "heading": "'FontName', fallback",
      "body": "'FontName', fallback",
      "small": "'FontName', fallback"
    },
    "display": "3rem",
    "heading": "2.25rem",
    "subheading": "1.25rem",
    "body": "1rem",
    "small": "0.875rem"
  }
}
```

### 33.3 Override Mechanism

1. Start with base variant (e.g., blue-silver)
2. If `intake.brand.primaryColor` provided → regenerate all primary shades using lightness math
3. If `intake.brand.secondaryColor` provided → same shade generation
4. If `intake.brand.fonts.display` provided → override display + heading fonts
5. If `intake.brand.fonts.body` provided → override body + small fonts

### 33.4 Shade Generation Algorithm

Convert hex → HSL, adjust lightness, convert back to hex:

| Shade | Lightness Adjustment |
|-------|---------------------|
| `dark` | Darken by 12% |
| `light` | Lighten by 18% |
| `50` | Lighten by 42% (very pale, for backgrounds) |
| `100` | Lighten by 32% |

### 33.5 Industry Customization

The same 5 palettes work across all industries. If an industry needs different palettes, create an industry-specific `brand-variants.json` and update the pipeline config. The palette structure and shade algorithm remain the same.

---

## 34. AI Content & SEO Generation

### 34.1 Architecture

```
scripts/onboard/prompts/{industry}/
├── content.md     ← AI content prompt template
└── seo.md         ← AI SEO prompt template
```

Each prompt uses `{{variable}}` interpolation from intake data. The pipeline makes 2 Claude API calls per client:

1. **Content call** → unique hero, about story, bios, testimonials, features
2. **SEO call** → site title, description, per-page titles and descriptions

### 34.2 Template Variables

All prompts have access to these variables (populated from intake):

| Variable | Source |
|----------|--------|
| `{{businessName}}` | `business.name` |
| `{{ownerName}}` | `business.ownerName` |
| `{{ownerTitle}}` | `business.ownerTitle` |
| `{{city}}` | `location.city` |
| `{{state}}` | `location.state` |
| `{{foundedYear}}` | `business.foundedYear` |
| `{{yearsExperience}}` | `business.yearsExperience` |
| `{{languages}}` | `business.ownerLanguages` (joined) |
| `{{uniqueSellingPoints}}` | `contentTone.uniqueSellingPoints` (bulleted) |
| `{{targetDemographic}}` | `contentTone.targetDemographic` |
| `{{voice}}` | `contentTone.voice` |
| `{{servicesList}}` | `services.enabled` (joined) |
| `{{teamMembers}}` | Formatted team member details |

### 34.3 Content Generation Output

The AI returns JSON with these fields:

```json
{
  "hero": { "tagline": "...", "description": "..." },
  "aboutStory": "3 paragraphs...",
  "ownerBio": "3 paragraphs...",
  "ownerQuote": "1 sentence...",
  "teamBios": [{ "slug": "dr-jay-lee", "bio": "2 paragraphs..." }],
  "whyChooseUs": [{ "icon": "award", "title": "...", "description": "..." }],
  "testimonials": [{ "patientName": "...", "text": "...", "serviceCategory": "...", "rating": 5 }],
  "announcementBar": "..."
}
```

### 34.4 SEO Generation Output

```json
{
  "title": "Site Title | City, State",
  "description": "150-160 chars with city, services, and call-to-action",
  "home": { "title": "...", "description": "..." },
  "pages": {
    "about": { "title": "...", "description": "..." },
    "services": { "title": "...", "description": "..." }
  }
}
```

**SEO rules enforced in prompt:**
- Every title includes business name
- Every description includes city name
- Home page targets "[City] [Industry]" keyword pattern
- Descriptions are 150–160 characters with call-to-action

### 34.5 Cost Model

| Resource | Cost | Duration |
|----------|------|----------|
| Claude API — Content (sonnet) | ~$0.08 | ~12s |
| Claude API — SEO (sonnet) | ~$0.05 | ~8s |
| **Total per client** | **~$0.13** | **~20s** |

### 34.6 Skip-AI Mode

For testing or when template content is acceptable:
- CLI: `--skip-ai` flag
- Admin UI: "Skip AI" checkbox
- Template content is preserved as-is (still gets NAP replacement in O4)

---

## 35. Deep Replacement Algorithm

### 35.1 How It Works

Recursively walks every string value in every content entry JSON and applies ordered find-replace pairs.

```
for each content_entry (except theme.json):
  data = JSON.parse(entry.data)
  data = deepReplace(data, replacementPairs)
  upsert(entry with new data)
```

### 35.2 Replacement Pair Ordering

**Critical rule: Longer strings are replaced first.** This prevents partial matches.

Example (dental):

| # | Find (Template Value) | Replace With | Source Field |
|---|----------------------|--------------|-------------|
| 1 | `Alex Dental Clinic` | Business name | `business.name` |
| 2 | `Alex Dental` | Short name | derived |
| 3 | `Dr. Alex Chen` | Owner name | `business.ownerName` |
| 4 | `alex-dental.com` | Production domain | `domains.production` |
| 5 | `(845) 555-0180` | Phone formatted | `location.phone` |
| 6 | `+18455550180` | Phone digits | derived |
| 7 | `tel:+18455550180` | Tel link | derived |
| 8 | `info@alex-dental.com` | Email | `location.email` |
| 9 | `85 Crystal Run Road, Middletown, NY 10940` | Full address | derived |
| ... | (progressively shorter address fragments) | ... | ... |
| 17 | `10940` | Zip code | `location.zip` |

### 35.3 Conditional Replacement

If an intake field is empty/missing, that replacement pair is **skipped entirely**. The template value remains intact. This ensures:

- Empty owner name → template doctor names stay
- Empty phone → template phone stays
- Empty address → template address stays

### 35.4 Industry Adaptation

Each industry defines its own replacement pairs based on the template's known strings. The algorithm is the same — only the pair table changes.

---

## 36. Service Pruning Logic

### 36.1 Concept

Every industry template ships with a full catalog of services/products. The intake form specifies which ones the client offers. Pipeline step O3 removes everything NOT in the enabled list.

### 36.2 Files Affected (5 per disabled service)

| File | What's Removed |
|-------------|---------------|
| Individual service file | Entire content entry deleted |
| Navigation JSON | Service link removed from menu; empty categories removed |
| Services page JSON | Service removed from list; empty categories removed |
| Homepage JSON | Service removed from featured services section |
| Footer JSON | Service link removed from footer service list |

### 36.3 Service Catalog Structure

Each industry defines a catalog grouped by category:

```javascript
const SERVICE_CATALOG = {
  category1: [
    { slug: 'service-slug', label: 'Service Name' },
    // ...
  ],
  category2: [/* ... */],
};
```

The catalog drives:
- Admin form checkbox grid (grouped by category)
- Pruning logic (which files to delete)
- Verification (expected service count)

### 36.4 Empty Category Handling

When all services in a category are disabled, the category header itself is removed from navigation, services page, and footer. No empty category sections remain.

---

## 37. Admin Onboarding UI

### 37.1 Overview

The admin UI at `/admin/onboarding` provides a browser-based onboarding wizard that replaces the CLI script. Super-admin access required.

### 37.2 Files

| File | Lines | Purpose |
|------|-------|---------|
| `app/admin/(dashboard)/onboarding/page.tsx` | ~30 | Server component — auth check, loads template sites |
| `components/admin/OnboardingWizard.tsx` | ~1100 | Client component — form + SSE progress + done/error panels |
| `app/api/admin/onboarding/route.ts` | ~1100 | SSE endpoint — all 7 pipeline steps + Supabase Storage helpers |
| `components/admin/AdminSidebar.tsx` | +1 line | "Onboarding" nav item |

### 37.3 Form Layout

**Required sections (expanded by default):**

1. **Identity & Template** — Business Name (auto-generates site ID, domain, email), Clone From dropdown
2. **Business Info** — Owner, credentials, team members (dynamic add/remove)
3. **Location & Contact** — Address, city, state, zip, phone, email
4. **Hours** — 7-day grid with sensible defaults
5. **Services** — Checkbox grid grouped by category, Select All/Deselect All per category
6. **Brand** — 5 radio variants with color swatches, optional primary color override
7. **Locales & Domain** — Locale checkboxes, production/dev domain inputs

**Optional sections (collapsed by default):**

8. **Content Tone** — Voice select, target demographic, USPs
9. **Social Media** — Facebook, Instagram, Google, Yelp, YouTube
10. **Insurance & Booking** — Insurance settings, membership plan, booking URL
11. **Stats** — Dynamic stat list (icon, number, label)

### 37.4 Auto-Generation Helpers

When the user types a business name, these fields auto-populate:

| Field | Generated From | Example |
|-------|---------------|---------|
| Site ID | `slugify(businessName)` | "Park Dental Studio" → `park-dental-studio` |
| Production domain | `{siteId}.com` | `park-dental-studio.com` |
| Dev domain | `{first-words}.local` | `park-dental.local` |
| Email | `info@{prodDomain}` | `info@park-dental-studio.com` |
| Appointments email | `appointments@{prodDomain}` | `appointments@park-dental-studio.com` |

### 37.5 SSE Progress Streaming

When "Generate Site" is clicked, the form transitions to a progress panel. The API route uses **Server-Sent Events** for real-time progress:

```
POST /api/admin/onboarding
Cookie: admin-token (super_admin required)
Body: intake JSON
Response: text/event-stream
```

**SSE events:**

| Event | When | Data |
|-------|------|------|
| `progress` | Step starts/completes | `{ step, label, status, message, duration }` |
| `complete` | All 7 steps done | `{ siteId, entries, services, domains, errors, warnings }` |
| `error` | Pipeline fails | `{ message }` |

**SSE streaming pattern (Next.js API route):**
```typescript
const stream = new ReadableStream({
  async start(controller) {
    const emit = (event: string, data: any) => {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    };
    // Run pipeline steps, emit progress for each...
    controller.close();
  }
});
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
});
```

### 37.6 Done Panel

On success, displays:
- Green success banner with site name
- Stats grid: Entries, Services, Locales, Domains
- Verification errors/warnings (if any)
- Action buttons: **View in Content Editor**, **Preview Site**, **Onboard Another Client**

### 37.7 Adapting for New Industries

The wizard component needs these industry-specific constants updated:

| Constant | What to Change |
|----------|---------------|
| `SERVICE_CATALOG` | Industry-specific services grouped by category |
| `BRAND_VARIANTS` | Update labels/descriptions if palettes change |
| Template doctor slugs | In API route — template-specific strings to match |
| Replacement pairs | In API route — template NAP strings |

The form layout, SSE streaming, progress panel, and done panel are industry-agnostic and reusable as-is.

---

## 38. Local Domain Alias System

### 38.1 Problem

Multiple client sites run on the same Next.js dev server (single port). The app resolves `site_id` by reading the HTTP `Host` header → looking up `site_domains` table.

### 38.2 Solution: `.local` Domain Aliases

Each client gets a `.local` dev domain that maps to `127.0.0.1` in `/etc/hosts`.

### 38.3 Setup Steps (per client)

```bash
# 1. Add to /etc/hosts
sudo sh -c 'echo "127.0.0.1 {alias}.local" >> /etc/hosts'

# 2. Flush DNS cache (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# 3. Register in site_domains (automated by Pipeline O1)
# 4. Update _site-domains.json (automated by Pipeline O1)
```

### 38.4 How It Works

1. Browser requests `http://{alias}.local:{port}/en`
2. `/etc/hosts` resolves `{alias}.local` → `127.0.0.1`
3. Next.js receives request with `Host: {alias}.local:{port}`
4. `resolveSiteId()` strips port → queries `site_domains` → returns `site_id`
5. All content loads for that `site_id`

### 38.5 Important Notes

- `.local` is reserved for mDNS on macOS but works via `/etc/hosts` override
- Single dev server serves all client sites (no separate processes)
- `normalizeHost()` strips port before DB lookup
- If Host contains "localhost" or "127.0.0.1", it short-circuits to default site
- `/etc/hosts` entry is the only manual step — pipeline automates DB registration

---

## 39. Post-Onboarding Verification

### 39.1 Automated Checks (O7)

These run automatically as the final pipeline step:

| Check | Level | Auto-fix |
|-------|-------|----------|
| Required content paths exist per locale | ERROR | No — pipeline halts |
| No template contamination in content entries | WARNING | No — reported only |
| Service count matches intake | WARNING | No — reported only |
| Domain registered in `site_domains` | ERROR | No — pipeline halts |
| Media assets cloned for new site_id | WARNING | No — reported only |
| Uploads directory exists for new site_id | WARNING | No — reported only |

### 39.2 Manual Verification Checklist

After pipeline completes, verify:

- [ ] Site appears in admin: `/admin/sites`
- [ ] Content entries exist: query `content_entries` for new site_id
- [ ] Media assets exist: query `media_assets` for new site_id, verify URLs point to `/uploads/{new-site-id}/`
- [ ] Uploads directory exists: `public/uploads/{new-site-id}/` with copied images
- [ ] No template contamination: search for template business name
- [ ] Theme colors/fonts correct (check hero background, buttons, headings)
- [ ] Local dev domain resolves: `http://{alias}.local:{port}`
- [ ] Homepage loads with correct business name, tagline, hero
- [ ] About page shows correct owner bio, credentials, photo placeholder
- [ ] Contact page shows correct phone, address, map embed
- [ ] Footer shows correct hours, social links, copyright
- [ ] SEO titles/descriptions are client-specific (view page source)
- [ ] Navigation only shows enabled services
- [ ] Layout files exist (verify section ordering)
- [ ] AI-generated content reads naturally (if AI was not skipped)
- [ ] Language switcher works for all enabled locales

### 39.3 Verification Script

`scripts/verify-site.mjs` automates the data-layer checks across all 4 layers:

```bash
node scripts/verify-site.mjs {site-id} [template-id]
```

| Layer | What It Checks | Pass Criteria |
|-------|---------------|---------------|
| **DB** | `sites` row exists | 1 row |
| **DB** | `content_entries` count matches template | Exact match |
| **DB** | `media_assets` count matches template | Exact match |
| **DB** | `site_domains` registered | ≥2 rows (prod + dev) |
| **DB** | URL contamination (media URLs referencing template) | 0 matches |
| **Storage** | Files in `{bucket}/{site-id}/` | Count matches template |
| **Local** | `public/uploads/{site-id}/` exists | ≥1 file |
| **Local** | `content/{site-id}/` exists | ≥1 file |
| **JSON** | Entry in `_sites.json` | Found |
| **JSON** | Entry in `_site-domains.json` | ≥1 entry |

Output: per-check ✓/✗ with row/file counts, final COMPLETE or NEEDS ATTENTION summary.

---

## 40. Cost & Performance Model

### 40.1 Per-Client Onboarding Cost

| Resource | With AI | Without AI |
|----------|---------|------------|
| Supabase operations | Free (within tier) | Free |
| Claude API — Content | ~$0.08 | $0 |
| Claude API — SEO | ~$0.05 | $0 |
| **Total** | **~$0.13** | **$0** |

### 40.2 Duration Benchmarks

| Configuration | Duration |
|--------------|----------|
| Full pipeline (with AI) | ~30–50 seconds |
| Skip-AI mode | ~15 seconds |
| Admin UI overhead (form submission + SSE) | ~1 second |

### 40.3 Scaling Considerations

| Metric | Current | At Scale |
|--------|---------|----------|
| Clients per Supabase project | Tested: 2 | Expected: 50+ |
| Content entries per client | ~50-120 | Same |
| Pipeline concurrency | Sequential (1 at a time) | Could parallelize with queue |
| Storage | Shared bucket | May need per-client folders at scale |

### 40.4 Monthly Operational Cost (per client)

| Resource | Monthly Cost |
|----------|-------------|
| Supabase (shared project, free tier) | $0 |
| Vercel hosting (shared project) | $0 (hobby) or $20/mo (pro, shared) |
| Domain (client provides) | $0 |
| **BAAM platform fee** | **$20/month** |

---

## 41. Industry Extension Guide

### 41.1 Adding a New Industry

To extend Pipeline B to a new industry (e.g., Restaurant, Med-Spa, Legal):

**Step 1: Build Master Template (Stage A + B)**
- Complete Stage A design for the new industry
- Build master template through Stage B (Phases 0-4)
- Sync all content to Supabase
- Verify template works end-to-end

**Step 2: Create Industry Prompt Templates**
```
scripts/onboard/prompts/{industry}/
├── content.md     ← AI content prompt for this industry
└── seo.md         ← AI SEO prompt for this industry
```

**Step 3: Define Service/Product Catalog**
```javascript
const CATALOG = {
  category1: [{ slug: 'service-slug', label: 'Service Name' }],
  category2: [/* ... */],
};
```

**Step 4: Define Replacement Pairs**
Map template-specific strings to intake field paths. Order by string length (longest first).

**Step 5: Create Example Intake**
```
scripts/intake/example-{industry}.json
```

**Step 6: Update Pipeline Config**
Set `intake.industry: "{industry}"` — pipeline auto-selects correct prompts and catalog.

### 41.2 What's Shared Across All Industries

| Component | Location | Reusable? |
|-----------|----------|-----------|
| Pipeline orchestration (O1-O7) | API route / CLI script | 100% |
| Brand variant system (5 palettes) | `brand-variants.json` | 100% (can add industry variants) |
| Domain alias system | `/etc/hosts` + `site_domains` | 100% |
| Layout system | `{page}.layout.json` | 100% |
| Supabase operations | Clone/upsert/delete helpers | 100% |
| Verification framework | O7 checks | 100% |
| Deep replace algorithm | `deepReplace()` | 100% |
| Admin Onboarding UI structure | Wizard form + SSE | 95% (update service catalog constant) |
| SSE streaming pattern | API route | 100% |
| Shade generation algorithm | `hexToHsl` / `hslToHex` | 100% |

### 41.3 What's Industry-Specific

| Component | What Changes |
|-----------|-------------|
| Service/product catalog | Categories + slugs + labels |
| AI prompt templates | `content.md` + `seo.md` per industry |
| Replacement pairs | Template NAP strings → intake field mapping |
| Intake schema extensions | Industry-specific fields (menu, treatments, practice areas) |
| Template doctor/team slugs | Names of template profiles to delete/replace |

### 41.4 Estimated Effort Per New Industry

| Task | Effort |
|------|--------|
| Stage A (industry research + design) | 1-2 weeks |
| Stage B (build master template) | 5 weeks |
| Pipeline B adaptation (prompts, catalog, pairs) | 1-2 days |
| Testing + verification | 1 day |
| **Total to add Pipeline B to existing template** | **2-3 days** |
| **Total including master template build** | **7-9 weeks** |

### 41.5 Industry Roadmap

| Industry | System Code | Template Status | Pipeline B Status |
|----------|-------------|----------------|------------------|
| Traditional Chinese Medicine | System A | Complete | **Complete** (onboarding + deletion + verification scripts) |
| Commercial Printing | System C | Complete | Not built |
| Dental | System D | Complete | **Complete** (reference implementation) |
| LTL Freight | System E | Complete | Not built |
| Restaurant | System F | Planned | Planned |
| Real Estate | System G | In progress | Planned |

**The dental Pipeline B implementation is the reference for all future industries.** Files: `Client_Onboarding_Master_Plan.md`, admin UI at `/admin/onboarding`, API route at `/api/admin/onboarding`.

---

## 41.6 Site Lifecycle Management

### Disabling vs Deleting

| Action | Use When | Reversible | Method |
|--------|----------|-----------|--------|
| **Disable** | Client pauses service, temporary takedown | Yes | Set `enabled: false` in `sites` table |
| **Delete** | Client permanently leaves, test site cleanup | **No** | Full 9-layer deletion (see below) |

### Deletion Order (9 Layers)

Foreign key dependencies require children-first deletion:

| Step | Layer | Target | Why |
|------|-------|--------|-----|
| 1 | DB | `content_entries` | Bulk content (most rows) |
| 2 | DB | `media_assets` | Media URL records |
| 3 | DB | `site_domains` | Domain alias mappings |
| 4 | DB | `sites` | Parent record — delete last |
| 5 | Storage | `{bucket}/{site-id}/` | Actual image files in Supabase Storage |
| 6 | Local | `public/uploads/{site-id}/` | Local image cache |
| 7 | Local | `content/{site-id}/` | Local content fallback files |
| 8 | JSON | `content/_sites.json` | Local site registry |
| 9 | JSON | `content/_site-domains.json` | Local domain registry |

### Deletion Methods

| Method | Command | Features |
|--------|---------|----------|
| **Script (recommended)** | `node scripts/delete-site.mjs {site-id}` | Interactive confirmation per step, inventory audit, post-deletion verification |
| **Dry run** | `node scripts/delete-site.mjs {site-id} --dry-run` | Shows what would be deleted, changes nothing |
| **Manual** | Supabase Dashboard + terminal | Step-by-step with screenshots — see SOP |

Full procedure documented in [SITE_DELETION_SOP.md](SITE_DELETION_SOP.md).

### Post-Deletion Verification

After deletion, all 9 layers should return empty/missing:

```bash
node scripts/verify-site.mjs {deleted-site-id}
# Expected: all checks show ✗, confirming complete removal
```

### Emergency Recovery

- **DB content** — Supabase PITR backup (if enabled), otherwise unrecoverable
- **Storage files** — No automatic backup, permanently deleted
- **Local files** — Restore from git history or Time Machine
- **Fastest path** — Re-run onboarding pipeline from template (loses post-onboarding customizations)

> **Template sites (e.g., `dr-huang-clinic`) must NEVER be deleted.** They are required for onboarding new clients.

---

## 42. Centralized Theme Token + Preset System (Cross-Industry Standard)

### 42.1 Objective

Provide a reusable, centralized style control system for every template family (medical, restaurant, real estate, legal, etc.) that allows:

- one-click preset application
- per-site customization after preset apply
- strict token-based rendering in shared components
- backward compatibility with older theme files

Core principle: **presets are copied, not linked**. Each site owns its own `theme.json`.

### 42.2 Canonical Theme Contract

Each site-level `theme.json` should support:

- `colors` (primary, secondary, backdrop)
- `typography` (sizes + fonts)
- `shape` (radius, shadow)
- `layout` (spacingDensity; optional visual variant hints)
- `_preset` metadata (id, name, category, description)

Backward compatibility requirements:

- Existing keys (`typography.display`, etc.) remain valid.
- New keys are optional and receive runtime defaults if missing.

### 42.3 Runtime Token Injection Contract

Every template must map theme values to CSS variables in the locale/layout injector (SSR-safe).

Minimum required variables:

- `--text-display`, `--text-heading`, `--text-subheading`, `--text-body`, `--text-small`
- `--font-display`, `--font-heading`, `--font-subheading`, `--font-body`, `--font-small`
- `--primary`, `--primary-dark`, `--primary-light`, `--primary-50`, `--primary-100`
- `--secondary`, `--secondary-dark`, `--secondary-light`, `--secondary-50`
- `--backdrop-primary`, `--backdrop-secondary`
- `--radius-base`
- `--shadow-base`
- `--section-padding-y`

`spacingDensity` mapping standard:

- `compact` -> `3rem`
- `comfortable` -> `5rem`
- `spacious` -> `8rem`

### 42.4 Admin UX Standard (Theme Editor)

Theme editing UI must expose three modes:

1. **Presets** (visual cards, category grouping, apply + confirm)
2. **Form** (field-level editing)
3. **JSON** (raw editing)

Behavior rules:

- Presets tab appears only for `theme.json`.
- Applying a preset updates in-memory editor state immediately.
- Persist occurs only after explicit Save.
- Non-theme files keep their existing form/json behavior unchanged.

### 42.5 Preset Library Standard

Maintain curated preset JSON files in repo-level preset library.

Recommended categories:

- Luxury
- Warm
- Bold
- Classic
- Fresh

Each preset must include:

- complete token payload for colors/typography/shape/layout
- `_preset` metadata
- accessible color contrast targets for primary text/button states

### 42.6 Component Tokenization Rules

Shared components must consume CSS vars instead of fixed visual constants.

Priority migration order:

1. UI primitives (`Button`, `Card`, `Input`, `Select`, `Textarea`, `Modal`, `Tabs`, etc.)
2. Hero and section wrappers
3. Repeating content cards (services, testimonials, blog/event cards)
4. Remaining page-specific sections

Required replacement patterns:

- hardcoded radius classes -> `var(--radius-base)`
- hardcoded shadows -> `var(--shadow-base)`
- hardcoded vertical section spacing -> `var(--section-padding-y)`

### 42.7 Adoption Checklist (Any Template)

- [ ] Extend theme type/schema with optional `shape`, `layout`, `_preset`.
- [ ] Add preset library JSON files and typed loader.
- [ ] Add `Presets` tab in admin theme editor.
- [ ] Inject new CSS variables in locale/layout runtime.
- [ ] Add fallback variables in global stylesheet.
- [ ] Migrate shared UI components to token usage.
- [ ] Migrate high-traffic sections (hero/services/testimonials).
- [ ] Validate backward compatibility with legacy `theme.json`.
- [ ] Run type-check + lint + visual smoke tests.

### 42.8 QA Gates

Release is complete only when all pass:

- preset apply/save/reload works across DB-first + file fallback
- legacy site themes render without missing-token regressions
- non-theme admin editing flows unaffected
- no critical contrast regressions in primary CTAs and heading/body text

### 42.9 Governance

- No new shared component may ship with hardcoded brand radius/shadow/section spacing.
- Theme token additions require update to this master section and migration note.
- New template onboarding must include theme tokenization compliance review.

### 42.10 Theme-Required Layout Structure for New Sites (Mandatory)

This is required for every new site bootstrap to avoid large post-build visual debugging cycles.

**A) Required content contracts before page build**

- `theme.json` must include `colors`, `typography`, `shape`, `layout`, `_preset`.
- Every route must have `{page}.json` + `{page}.layout.json` defined before UI implementation.
- Hero content contract must include:
  - `variant`
  - `title`
  - `subtitle`
  - `backgroundImage` (optional)

**B) Required wrapper standards for all page-level heroes**

- Top spacing via header-aware class (transparent vs default menu).
- Bottom spacing from token only: `--section-padding-y`.
- Hero media containers (image/video/card) must use:
  - `--radius-base` for corners
  - `--shadow-base` for elevation
- No page-specific hardcoded `rounded-*`/`shadow-*` values on hero media.

**C) Required section standards**

- Section vertical rhythm must use `--section-padding-y` (or documented multiplier).
- Reusable cards and callouts must inherit `--radius-base`/`--shadow-base`.
- Typography sizes must use theme token classes (`text-display`, `text-heading`, `text-subheading`, `text-body`, `text-small`).

**D) Required admin wiring before QA**

- Theme Form includes `shape.radius`, `shape.shadow`, `layout.spacingDensity`.
- `theme.json` normalization writes missing defaults on load/save.
- Preset apply flow is available and verified for the site.

### 42.11 New Site Pre-Launch Visual Consistency Gate

A new site cannot pass launch QA unless all checks below are green:

- [ ] All page heroes follow the same wrapper contract (header-aware top spacing + tokenized bottom spacing).
- [ ] All hero media use tokenized radius/shadow (no page-by-page exceptions).
- [ ] All core sections use tokenized spacing and tokenized typography classes.
- [ ] Theme preset can be applied and then manually adjusted without schema loss.
- [ ] Zero critical contrast regressions on heading/body/button text.

Enforcement note: this gate is mandatory specifically to prevent the multi-page manual cleanup pattern seen in late-stage template debugging.
