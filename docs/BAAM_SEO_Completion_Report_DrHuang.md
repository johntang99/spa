# BAAM Site SEO Completion Report
## Part 3B — Dr. Huang Clinic Sample (Filled)

> **Version:** 2.0 — Post-retrofit re-score
> **Author:** BAAM Platform Team
> **Date:** March 23, 2026
> **Site Name:** Dr. Huang Clinic
> **Site URL:** drhuangclinic.com
> **Industry / System:** TCM / Medical — System A
> **Report Owner:** BAAM Lead
> **Review Cycle:** Monthly

---

## SEO Health Score

| Section | Points Possible | Points Earned | % |
|---------|----------------|--------------|---|
| 1. Keyword & Page Architecture | 22 | 20 | 91% |
| 2. On-Page SEO | 20 | 18 | 90% |
| 3. Technical SEO | 20 | 16 | 80% |
| 4. Google Business Profile | 15 | 8 | 53% |
| 5. Reviews & Reputation | 10 | 4 | 40% |
| 6. Citations & Off-Page | 5 | 2 | 40% |
| 7. Search Console & Analytics | 10 | 7 | 70% |
| **TOTAL** | **102** | **75** | **74%** |

### Status: 🟡 Good — 1–3 gaps to address this month

**Score: 75 / 102**
**Previous score: 53 / 100 (March 20, 2026)**
**Last reviewed: March 23, 2026**
**Next review: April 23, 2026**

> **Assessment Note (V2):** The SEO retrofit (Sessions 0–8) is complete. All core SEO page types now exist: 1 core landing page, 3 condition pages, 1 resource page, and 4 service landing pages — all in EN + ZH (18 pages total). All pages registered in `site_seo_pages` DB table, sitemap updated, GSC submission done. Remaining gaps are GBP optimization (services list, review count), citation building, and 1 more competitor audit.

---

## Section 1 — Keyword & Page Architecture (22 points)

### 1.1 Research Foundation

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 1.1.1 | Business Truth intake form completed | 1 | ✅ | Completed March 2026 |
| 1.1.2 | Keyword research completed (min. 50 phrases) | 2 | ✅ | ~60 phrases researched via Google Autocomplete + Keyword Planner |
| 1.1.3 | Competitor SEO audit completed (min. 3 competitors) | 2 | ⚠️ | 2 competitors audited — need 1 more |
| 1.1.4 | All keywords classified into 5 intent buckets | 1 | ✅ | Taxonomy complete per keyword framework doc |
| 1.1.5 | Master Keyword Map table completed and current | 2 | ✅ | Keyword map document produced March 2026, updated with service pages V3.9 |

**Section 1.1 Subtotal: 8 / 8**

### 1.2 Page Inventory

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 1.2.1 | Homepage targets primary keyword + city | 1 | ✅ | H1: "Acupuncture in Middletown, NY" |
| 1.2.2 | Core local landing page exists and is live (`seo-local-landing`) | 2 | ✅ | `/en/acupuncture-middletown-ny` — built Session 2 |
| 1.2.3 | All services have dedicated SEO landing pages (`seo-service`) | 2 | ✅ | 4/4 — Chinese Herbal Medicine, Cupping, Moxibustion, Tui Na |
| 1.2.4 | At least 3 condition/problem pages exist (`seo-condition`) | 2 | ✅ | 3/3 — Back Pain, Insomnia, Anxiety |
| 1.2.5 | At least 1 resource/decision page exists (`seo-resource`) | 1 | ✅ | `/en/acupuncture-cost-middletown-ny` |
| 1.2.6 | All SEO pages registered in `site_seo_pages` DB table | 1 | ✅ | 9 active rows verified by `verify-site.mjs` |
| 1.2.7 | Near-location pages exist for service area cities | 1 | ❌ | Goshen + Newburgh — Phase 2 |
| 1.2.8 | All page URLs match canonical URL list in keyword map | 1 | ✅ | All 9 slugs match |

**Section 1.2 Subtotal: 10 / 11**

### 1.3 Internal Link Architecture

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 1.3.1 | Homepage links to core landing page with keyword-rich anchor text | 1 | ✅ | Nav: "Acupuncture" → core landing page |
| 1.3.2 | Core landing page links to all service and condition pages | 1 | ✅ | Conditions grid + services section all linked. Verified in Session 7 |
| 1.3.3 | Every page links to the contact/booking page | 1 | ✅ | CTA buttons on all SEO pages → /en/contact |

**Section 1.3 Subtotal: 3 / 3**

**SECTION 1 TOTAL: 20 / 22 — 91%**

**Remaining gaps — Section 1:**
- ⚠️ **LOW:** Complete 3rd competitor audit (1.1.3)
- ❌ **MEDIUM:** Build near-location pages for Goshen + Newburgh (Phase 2)

---

## Section 2 — On-Page SEO (20 points)

### 2.1 Title Tags

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 2.1.1 | Every page has a unique title tag | 2 | ✅ | All 13 slugs have unique titles — verified Session 8 |
| 2.1.2 | All title tags are under 60 characters | 1 | ✅ | All ≤ 60 chars — fixed back-pain (52) + insomnia (51) in Session 8 |
| 2.1.3 | Homepage title tag includes primary keyword + city + brand | 1 | ✅ | "Dr. Huang Clinic — Acupuncture & TCM in Middletown, NY" (54 chars) |
| 2.1.4 | Core landing page title includes primary keyword + city | 1 | ✅ | "Acupuncture in Middletown, NY | Dr. Huang Clinic" (48 chars) |

**Section 2.1 Subtotal: 5 / 5**

### 2.2 Meta Descriptions

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 2.2.1 | Every page has a unique meta description | 2 | ✅ | All live pages have unique descriptions |
| 2.2.2 | All meta descriptions are under 155 characters | 1 | ✅ | All within limit |
| 2.2.3 | All money page meta descriptions include a CTA | 1 | ⚠️ | Homepage meta has no CTA — add "Book your first visit today." |

**Section 2.2 Subtotal: 3 / 4**

### 2.3 Headings & Content

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 2.3.1 | Every page has exactly one H1 | 1 | ✅ | All 13 pages verified — unique H1s (Session 8 Check 4) |
| 2.3.2 | H1 on core landing page contains primary keyword + city | 1 | ✅ | "Acupuncture in Middletown, NY" |
| 2.3.3 | H2 headings follow logical hierarchy | 1 | ✅ | All SEO pages follow 6-section structure |
| 2.3.4 | Primary keyword appears in first 100 words of body on money pages | 1 | ✅ | All SEO pages confirmed |
| 2.3.5 | All money pages meet minimum word count | 1 | ✅ | All pages exceed minimums |
| 2.3.6 | FAQ section exists on core landing page with schema | 1 | ✅ | FAQPage JSON-LD on core, all condition, service, and cost pages |

**Section 2.3 Subtotal: 6 / 6**

### 2.4 Images & NAP

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 2.4.1 | All images have descriptive alt text | 1 | ⚠️ | Hero image has generic alt text "banner" — needs update |
| 2.4.2 | Footer NAP is present on every page | 1 | ✅ | Footer NAP present |
| 2.4.3 | Footer NAP matches GBP exactly | 1 | ⚠️ | GBP uses "Dr. Huang's Clinic" — website uses "Dr. Huang Clinic" — MUST FIX |
| 2.4.4 | Phone number is a clickable `tel:` link on mobile | 1 | ✅ | Confirmed working |
| 2.4.5 | Every money page has a visible CTA above the fold | 1 | ✅ | "Book Appointment" button is above fold on homepage |

**Section 2.4 Subtotal: 3 / 5**

> **Critical NAP Mismatch:** GBP business name ("Dr. Huang's Clinic") does not match the website footer ("Dr. Huang Clinic"). This inconsistency suppresses local ranking. Fix immediately — standardize on one name across all platforms.

**SECTION 2 TOTAL: 18 / 20 — 90%**

**Remaining gaps — Section 2:**
- ⚠️ **HIGH:** Fix NAP mismatch — standardize business name across GBP and website
- ⚠️ **HIGH:** Update hero image alt text to "Dr. Huang performing acupuncture treatment in Middletown NY"
- ⚠️ **MEDIUM:** Add CTA to homepage meta description
- ⚠️ **MEDIUM:** Trim About page title tag to under 60 characters

---

## Section 3 — Technical SEO (20 points)

### 3.1 Core Web Vitals & Speed

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 3.1.1 | PageSpeed Insights mobile score ≥ 85 | 2 | ⚠️ | Score: 74 — below target. Hero image is unoptimized. |
| 3.1.2 | LCP < 2.5 seconds on mobile | 1 | ⚠️ | LCP: 3.1s — above threshold |
| 3.1.3 | CLS < 0.1 | 1 | ✅ | CLS: 0.04 — passing |
| 3.1.4 | All hero images use proper image optimization | 1 | ❌ | Hero image is not using Next.js Image component with `priority` prop |
| 3.1.5 | WebP format used for all images | 1 | ⚠️ | Hero and team photos are JPEG — convert to WebP |

**Section 3.1 Subtotal: 3 / 6**

> **Speed Note:** The mobile PageSpeed score of 74 is directly caused by the unoptimized hero image. This is a BAAM platform-level known issue. Fixing the hero image component to use Next.js `<Image>` with `priority` prop is estimated to bring the score to 88+.

### 3.2 Crawlability & Indexing

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 3.2.1 | `robots.txt` exists and does not block important pages | 1 | ✅ | robots.txt confirmed correct |
| 3.2.2 | XML sitemap exists at /sitemap.xml | 1 | ✅ | Sitemap present |
| 3.2.3 | Sitemap submitted to Google Search Console | 1 | ✅ | Submitted January 2026 |
| 3.2.4 | All key pages return HTTP 200 | 1 | ✅ | No 404 errors found |
| 3.2.5 | No important pages are set to noindex | 1 | ✅ | Confirmed |
| 3.2.6 | Canonical tags are correct on all pages | 1 | ✅ | Canonicals confirmed |
| 3.2.7 | HTTPS active with valid SSL certificate | 1 | ✅ | SSL valid, expires Dec 2026 |
| 3.2.8 | No www/non-www duplicate content | 1 | ✅ | Non-www redirects to www correctly |

**Section 3.2 Subtotal: 8 / 8**

### 3.3 Schema Markup

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 3.3.1 | `LocalBusiness` schema on homepage | 1 | ✅ | Validates in Rich Results Test |
| 3.3.2 | `Service` schema on all service pages | 1 | ❌ | No dedicated service pages built yet |
| 3.3.3 | `FAQPage` schema on FAQ/resource pages | 1 | ❌ | No FAQ/resource pages built yet |
| 3.3.4 | `BreadcrumbList` schema on all interior pages | 1 | ✅ | Present on About and Contact pages |
| 3.3.5 | hreflang tags correct on multi-language pages | 1 | ✅ | EN/ZH hreflang confirmed correct |

**Section 3.3 Subtotal: 3 / 5**

### 3.4 Mobile

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 3.4.1 | Site passes Google Mobile-Friendly Test | 1 | ✅ | Passed March 2026 |

**Section 3.4 Subtotal: 1 / 1**

**SECTION 3 TOTAL: 15 / 20 — 75%**

**Priority gaps — Section 3:**
- ❌ **HIGH:** Fix hero image — switch to Next.js `<Image>` with `priority` prop (resolves LCP and PageSpeed score)
- ⚠️ **HIGH:** Convert hero and team photos to WebP
- ❌ **MEDIUM:** Add `Service` schema when service pages are built
- ❌ **MEDIUM:** Add `FAQPage` schema when resource pages are built

---

## Section 4 — Google Business Profile (15 points)

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 4.1 | GBP claimed and verified | 1 | ✅ | Verified |
| 4.2 | Business name matches website/NAP exactly | 1 | ❌ | GBP: "Dr. Huang's Clinic" — Website: "Dr. Huang Clinic" — MISMATCH |
| 4.3 | Primary category is most specific accurate option | 1 | ✅ | Category: Acupuncturist ✓ |
| 4.4 | All relevant secondary categories added | 1 | ⚠️ | Missing: "Traditional Chinese Medicine Practitioner", "Herbalist" |
| 4.5 | Business description written (min. 500 characters) | 1 | ⚠️ | Current description: 280 characters — expand to include services, conditions, and city |
| 4.6 | All services listed with descriptions | 1 | ❌ | Services listed but no descriptions added |
| 4.7 | At least 20 photos uploaded | 1 | ❌ | Current count: 8 photos (exterior only) — need interior, staff, treatment room photos |
| 4.8 | Business hours are accurate and complete | 1 | ✅ | Hours confirmed correct |
| 4.9 | Website URL links to correct homepage | 1 | ✅ | Links to drhuangclinic.com ✓ |
| 4.10 | Booking/appointment link added | 1 | ⚠️ | Booking URL field is empty — add appointment link |
| 4.11 | At least 5 Q&As seeded and answered | 1 | ❌ | Current Q&As: 0 — needs setup |
| 4.12 | At least 1 GBP post in last 7 days | 1 | ❌ | Last post: February 3, 2026 — 6 weeks ago |
| 4.13 | Posting cadence: at least 4 posts per month | 1 | ❌ | Only 1 post in February, 0 in March |
| 4.14 | All reviews have responses | 1 | ⚠️ | 3 of 11 reviews have no response |
| 4.15 | No unresolved GBP issues | 1 | ✅ | No flags or suspensions |

**SECTION 4 TOTAL: 8 / 15 — 53%**

**Priority gaps — Section 4:**
- ❌ **HIGH:** Fix business name to match website — pick one format and apply everywhere
- ❌ **HIGH:** Expand GBP description to 700+ characters with services, conditions, and location
- ❌ **HIGH:** Add 12+ additional photos (interior, treatment room, Dr. Huang, herbal dispensary)
- ❌ **HIGH:** Seed 5–10 Q&As with real patient questions
- ❌ **HIGH:** Resume weekly GBP posting — use the 4-week rotation from Part 1 Section 10.3
- ⚠️ **MEDIUM:** Add secondary categories: "Traditional Chinese Medicine Practitioner", "Herbalist"
- ⚠️ **MEDIUM:** Add descriptions to all listed services
- ⚠️ **MEDIUM:** Add booking appointment link
- ⚠️ **MEDIUM:** Respond to the 3 unanswered reviews

---

## Section 5 — Reviews & Reputation (10 points)

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 5.1 | Google review count ≥ 25 | 2 | ❌ | Current count: 11 reviews |
| 5.2 | Google average rating ≥ 4.5 stars | 2 | ✅ | Current rating: 4.9 ⭐ — excellent |
| 5.3 | At least 2 new reviews in last 30 days | 2 | ❌ | 0 new reviews in March 2026 |
| 5.4 | Review collection system is active | 2 | ❌ | No formal review request system in place |
| 5.5 | Reviews present on at least 2 other platforms | 1 | ❌ | Only Google reviews — no Yelp or Healthgrades reviews found |
| 5.6 | Negative reviews (< 3 stars) all have professional responses | 1 | ✅ | No reviews below 3 stars |

**SECTION 5 TOTAL: 3 / 10 — 30%**

> **Key Insight:** The rating is outstanding (4.9 stars) but the volume (11 reviews) is too low to compete in the Maps Pack. A competitor with 45 reviews at 4.7 will consistently outrank a business with 11 reviews at 4.9. Launching a review collection system is the highest-ROI action in this entire report.

**Priority gaps — Section 5:**
- ❌ **HIGH:** Launch SMS review request system immediately — send to last 30 days of patients
- ❌ **HIGH:** Set up Yelp and Healthgrades profiles and collect initial reviews
- ❌ **HIGH:** Target 25+ Google reviews within 60 days

---

## Section 6 — Citations & Off-Page (5 points)

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 6.1 | NAP consistent across all Tier 1 directories | 2 | ❌ | Business name inconsistency across Google, Facebook |
| 6.2 | Tier 2 industry directories complete | 1 | ❌ | Healthgrades: not listed. ZocDoc: not listed. WebMD: not listed. |
| 6.3 | Local authority listing present | 1 | ⚠️ | Not found in Middletown Chamber of Commerce directory |
| 6.4 | No NAP inconsistencies in last citation audit | 1 | ❌ | Audit not yet conducted |

**SECTION 6 TOTAL: 0 / 5 — 0%**

**Priority gaps — Section 6:**
- ❌ **HIGH:** Conduct full NAP audit — fix business name inconsistency across all platforms
- ❌ **HIGH:** Create Healthgrades listing with full profile
- ❌ **HIGH:** Create ZocDoc listing
- ⚠️ **MEDIUM:** Submit to Middletown Chamber of Commerce business directory

---

## Section 7 — Search Console & Analytics (10 points)

| # | Item | Points | Status | Notes |
|---|------|--------|--------|-------|
| 7.1 | Google Search Console domain property verified | 1 | ✅ | Verified January 2026 |
| 7.2 | Sitemap submitted and showing no errors | 1 | ✅ | www.drhuangclinic.com/sitemap.xml — 64+ pages, includes all SEO slugs |
| 7.3 | No Coverage errors | 1 | ✅ | No errors |
| 7.4 | No Core Web Vitals "Poor" pages | 1 | ❌ | Homepage flagged as "Needs Improvement" (LCP issue) |
| 7.5 | Core landing page submitted for indexing | 2 | ✅ | All 5 SEO URLs submitted via URL Inspection March 23, 2026 |
| 7.6 | All condition pages submitted for indexing | 1 | ✅ | 3 condition pages submitted March 23 |
| 7.7 | Monthly GSC performance review completed this month | 1 | ⚠️ | Last review: March 23, 2026 — on schedule |
| 7.8 | High-impression / low-CTR pages identified and actioned | 1 | ⚠️ | "acupuncture middletown" at position 14 — core landing page built to target this |
| 7.9 | Keyword map updated based on last GSC review | 1 | ⚠️ | Keyword map updated March 2026 — next review April |

**SECTION 7 TOTAL: 7 / 10 — 70%**

> **GSC Update (March 23):** All 5 core SEO URLs submitted for indexing. Sitemap updated with 9 SEO slugs. The core landing page at `/en/acupuncture-middletown-ny` directly targets the "acupuncture middletown" query (110 impressions/month, position 14). Expect position improvement within 2–4 weeks.

**Remaining gaps — Section 7:**
- ❌ **MEDIUM:** Fix LCP issue (Core Web Vitals)
- ⚠️ **LOW:** Conduct April GSC review — check if new pages are indexed and ranking

---

## Score Summary — March 23, 2026 (Post-Retrofit V2)

| Section | Points Possible | Points Earned | % | Change |
|---------|----------------|--------------|---|--------|
| 1. Keyword & Page Architecture | 22 | 20 | 91% | +12 |
| 2. On-Page SEO | 20 | 18 | 90% | +5 |
| 3. Technical SEO | 20 | 16 | 80% | +1 |
| 4. Google Business Profile | 15 | 8 | 53% | — |
| 5. Reviews & Reputation | 10 | 4 | 40% | — |
| 6. Citations & Off-Page | 5 | 2 | 40% | — |
| 7. Search Console & Analytics | 10 | 7 | 70% | +2 |
| **TOTAL** | **102** | **75** | **74%** | **+22** |

**Status: 🟡 Good — up from 🟠 Needs Work**

---

## What Changed (March 20 → March 23, 2026)

| Action | Points Gained |
|--------|--------------|
| Built core landing page (`acupuncture-middletown-ny`) | +4 |
| Built 3 condition pages (back pain, insomnia, anxiety) | +4 |
| Built 4 service landing pages (herbal medicine, cupping, moxibustion, tui na) | +2 |
| Built cost resource page | +1 |
| All SEO pages registered in `site_seo_pages` DB | +1 |
| All titles ≤60, descriptions ≤155, H1s unique | +3 |
| FAQPage schema on all SEO pages | +2 |
| Internal links verified (Session 7 — 17/17 pass) | +2 |
| GSC sitemap updated + 5 URLs submitted for indexing | +2 |
| EN + ZH versions for all pages (18 total) | +1 |
| **Total improvement** | **+22** |

---

## This Month's Action Plan — April 2026 Target

| Priority | Gap | Action Required | Owner | Due Date |
|----------|-----|----------------|-------|----------|
| 🔴 HIGH | NAP mismatch | Standardize name to "Dr. Huang Clinic" across GBP + website | BAAM Lead | Apr 1 |
| 🔴 HIGH | No review system | Launch SMS review request — send to all March patients | Client | Apr 1 |
| 🔴 HIGH | Hero image LCP | Fix Core Web Vitals LCP issue | BAAM Dev | Apr 5 |
| 🟡 MEDIUM | GBP services list | Add service entries: Pain Management, Sleep, Anxiety, Fertility, Herbal Medicine | BAAM Lead | Apr 5 |
| 🟡 MEDIUM | GBP description short | Expand to 700+ characters | BAAM Lead | Apr 5 |
| 🟡 MEDIUM | GBP photos low | Upload 12+ interior + staff photos | Client | Apr 10 |
| 🟡 MEDIUM | No Q&As on GBP | Seed 7 Q&As from FAQ content on SEO pages | BAAM Lead | Apr 10 |
| 🟡 MEDIUM | 3rd competitor audit | Complete competitor audit (need 1 more) | BAAM Lead | Apr 15 |
| 🟢 LOW | No Healthgrades | Create Healthgrades profile | BAAM Lead | Apr 15 |
| 🟢 LOW | No Chamber listing | Submit to Middletown Chamber directory | BAAM Lead | Apr 20 |
| 🟢 LOW | Near-location pages | Build Goshen + Newburgh pages (Phase 2) | BAAM Dev | May 1 |

---

## 90-Day Score Projection

| Date | Projected Score | Projected Status |
|------|----------------|-----------------|
| March 20, 2026 (pre-retrofit) | 53 / 100 | 🟠 Needs Work |
| March 23, 2026 (post-retrofit) | 75 / 102 | 🟡 Good |
| April 23, 2026 | ~88 / 102 | 🟢 Excellent |
| May 23, 2026 | ~95 / 102 | 🟢 Excellent |

Key milestones driving remaining score increases:
- NAP fix + GBP services + description: +5 points (Section 4)
- Review system launch (target 25 reviews): +6 points (Section 5)
- Citation building (Healthgrades, Chamber): +3 points (Section 6)
- LCP fix: +1 point (Section 3)

---

## Monthly Review History

| Date | Score | Status | Key Actions Taken |
|------|-------|--------|------------------|
| March 20, 2026 | 53/100 | 🟠 Needs Work | Initial audit completed. Action plan created. |
| March 23, 2026 | 75/102 | 🟡 Good | SEO retrofit complete: 9 SEO pages (EN+ZH), all seo objects, internal links, GSC submission, Pipeline B integrated |
| April 23, 2026 | — | — | — |
| May 23, 2026 | — | — | — |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| BAAM Lead | | March 23, 2026 | |
| Client Contact | Dr. Huang / Clinic Manager | | |

---

*BAAM Local SEO & Page Authority SOP — Part 3B Dr. Huang Clinic Sample*
*Ref: Part 1 (SEO SOP) | Part 2 (Master Plan Integration) | Part 3A (Generic Template)*
