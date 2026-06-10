# Acu-Flushing — SEO Implementation Plan
## Site: acupunctureflushing.com (site_id: acu-flushing)

| | |
|---|---|
| **Date** | March 25, 2026 |
| **Business** | Flushing Acupuncture & TCM |
| **Practitioner** | Dr. Li, L.Ac., DAOM |
| **Location** | 143-26 41st Ave, Flushing, NY 11355 |
| **Phone** | (718) 888-9512 |
| **Languages** | English, Mandarin Chinese |
| **System** | Same codebase as DrHuangClinic (multi-site, Supabase, dynamic [slug] route) |

---

## Current Status vs Dr. Huang (Reference Site)

| SEO Component | Dr. Huang (done) | Acu-Flushing (current) | Gap |
|--------------|------------------|----------------------|-----|
| site_seo_pages registered | 9 slugs | 5 slugs | Missing 4 service pages |
| Core landing page | ✓ acupuncture-middletown-ny | ✓ acupuncture-flushing-ny | Done |
| Condition pages (3) | ✓ back pain, insomnia, anxiety | ✓ back pain, insomnia, anxiety | Done |
| Resource page (cost) | ✓ acupuncture-cost-middletown-ny | ✓ acupuncture-cost-flushing-ny | Done |
| Service pages (4) | ✓ herbal medicine, cupping, moxibustion, tui na | ✗ None | **Build** |
| ZH locale pages | ✓ 5 pages (partial) | ✗ 0 pages | **Build** |
| seo objects on existing pages | ✓ home, about, services, contact | ✗ None | **Add** |
| Homepage SEO hub section | ✓ "Everything You Need to Know" | ✗ None | **Add** |
| Footer SEO columns | ✓ Resources + Service Areas | ✗ None | **Add** |
| Header nav link to core page | ✓ | ✗ | **Add** |
| FAQ schema on pages | ✓ All SEO pages | ✓ (via layouts) | Done |
| Internal links (product → landing) | ✓ Visible section | ✗ Not applicable (different page structure) | — |
| Sitemap includes SEO pages | ✓ | ✓ (via site_seo_pages query) | Done |
| GSC submitted | ✓ | ✗ | **Manual** |

---

## Implementation Phases

| Phase | What | Effort | Timeline |
|-------|------|--------|----------|
| **Phase 1** | Run pipeline: generate 4 service pages + ZH locale for all 9 pages | Automated — 5 min | Now |
| **Phase 2** | Add seo objects to existing pages (home, about, services, contact) | Automated — 5 min | Now |
| **Phase 3** | Add homepage SEO hub + footer columns + header nav link | Code + DB update — 15 min | Now |
| **Phase 4** | Verify all pages render correctly | Test — 10 min | Now |
| **Phase 5** | Submit sitemap + URLs to GSC | Manual — 15 min | After deploy |
| **Phase 6** | GBP optimization + reviews + backlinks | Manual — ongoing | After Phase 5 |

---

## Phase 1 — Generate Missing SEO Pages (Automated)

### 1.1 Generate 4 Service Pages

Run the pipeline to generate service pages for the 4 modalities in intake.json:

```bash
node scripts/seed-seo-pages.mjs acu-flushing
```

This will create:

| Page | Slug | Type |
|------|------|------|
| Chinese Herbal Medicine | `chinese-herbal-medicine-flushing-ny` | seo-service |
| Cupping Therapy | `cupping-therapy-flushing-ny` | seo-service |
| Moxibustion | `moxibustion-flushing-ny` | seo-service |
| Tui Na Massage | `tui-na-massage-flushing-ny` | seo-service |

Plus ZH versions of all 9 pages (5 existing + 4 new).

### 1.2 Expected Result After Pipeline

| Type | Count | Slugs |
|------|-------|-------|
| seo-local-landing | 1 | acupuncture-flushing-ny |
| seo-condition | 3 | back pain, insomnia, anxiety |
| seo-resource | 1 | acupuncture-cost-flushing-ny |
| seo-service | 4 | herbal medicine, cupping, moxibustion, tui na |
| **Total** | **9 slugs × 2 locales = 18 pages** | |

---

## Phase 2 — Add SEO Objects to Existing Pages

Update content_entries for existing pages to add `seo` objects:

| Page | seo.title | Priority |
|------|-----------|----------|
| home | Already in seo.json — needs sync to DB | P1 |
| about | Already in seo.json — needs sync to DB | P1 |
| services | Already in seo.json — needs sync to DB | P1 |
| contact | Already in seo.json — needs sync to DB | P1 |

---

## Phase 3 — Internal Link Rewiring + Navigation Updates

> **Critical step:** All existing pages (homepage, services, conditions) must link to SEO pages instead of anchor links. This is what drives internal link authority to the SEO pages.

### 3.1 Homepage — Services Section Links

Rewrite `services.services[].link` and `services.featured.link` in `pages/home.json` DB content:

| Service | Before | After |
|---------|--------|-------|
| Acupuncture (featured) | `/en/services#acupuncture` | `/en/acupuncture-flushing-ny` |
| Chinese Herbal Medicine | `/en/services#herbs` | `/en/chinese-herbal-medicine-flushing-ny` |
| Cupping Therapy | `/en/services#cupping` | `/en/cupping-therapy-flushing-ny` |
| Moxibustion | `/en/services#moxibustion` | `/en/moxibustion-flushing-ny` |
| Tui Na Massage | `/en/services#tuina` | `/en/tui-na-massage-flushing-ny` |
| Gua Sha | `/en/services#gua-sha` | stays (no SEO page) |

### 3.2 Homepage — Conditions Section Links

Rewrite `conditions.conditions[].link` in `pages/home.json` DB content:

| Condition | Before | After |
|-----------|--------|-------|
| Back Pain | `/en/conditions#back-pain` | `/en/acupuncture-for-back-pain-flushing-ny` |
| Anxiety & Panic | `/en/conditions#anxiety` | `/en/acupuncture-for-anxiety-flushing-ny` |
| Others without SEO pages | anchor links | stay as-is |

### 3.3 Services Page (`pages/services.json`) — Add Links

Update `servicesList.items[].link` — each service with an SEO page gets a link:

| Service ID | Link Added |
|------------|-----------|
| acupuncture | `/en/acupuncture-flushing-ny` |
| chinese-herbal-medicine | `/en/chinese-herbal-medicine-flushing-ny` |
| cupping-therapy | `/en/cupping-therapy-flushing-ny` |
| moxibustion | `/en/moxibustion-flushing-ny` |
| tuina-massage | `/en/tui-na-massage-flushing-ny` |

> The `ServicesSection` component already renders "Learn More →" links when `service.link` exists (added during Dr. Huang retrofit).

### 3.4 Conditions Page (`pages/conditions.json`) — Add Links

Update `conditions[].link` for conditions that have SEO pages:

| Condition | Link Added |
|-----------|-----------|
| Back Pain (+ neck/shoulder, arthritis) | `/en/acupuncture-for-back-pain-flushing-ny` |
| Anxiety & Panic | `/en/acupuncture-for-anxiety-flushing-ny` |
| Insomnia & Sleep | `/en/acupuncture-for-insomnia-flushing-ny` |

### 3.5 Homepage — seoLink to Core Landing Page

Add `services.seoLink` to homepage content:
```json
{ "url": "/en/acupuncture-flushing-ny", "text": "Acupuncture in Flushing, NY" }
```

### 3.6 Header Navigation — Core Landing Page

Add "Acupuncture" nav item linking to `/en/acupuncture-flushing-ny` after "Home".

### 3.7 Footer — Resources + Service Areas Columns

Add to `footer.json` DB content:

| Column | Links |
|--------|-------|
| **Resources** | Acupuncture Cost → `/en/acupuncture-cost-flushing-ny` |
| | Acupuncture in Flushing → `/en/acupuncture-flushing-ny` |
| **Service Areas** | Flushing, NY → `/en/acupuncture-flushing-ny` |
| | Back Pain Treatment → `/en/acupuncture-for-back-pain-flushing-ny` |
| | Insomnia Treatment → `/en/acupuncture-for-insomnia-flushing-ny` |
| | Anxiety Treatment → `/en/acupuncture-for-anxiety-flushing-ny` |

---

## Phase 4 — Verification

Run verify script:
```bash
node scripts/verify-site.mjs acu-flushing
```

Then run pipeline in QA mode:
```bash
node scripts/seo-pipeline.mjs acu-flushing --skip-generation
```

### Done-Gate
- [ ] 9 site_seo_pages rows (all active)
- [ ] 18 content_entries (9 EN + 9 ZH)
- [ ] All pages return HTTP 200 via [slug] route
- [ ] All titles ≤ 60 chars, descriptions ≤ 155 chars
- [ ] All H1s unique
- [ ] FAQPage schema on all SEO pages
- [ ] Homepage hub section links to all 9 pages
- [ ] Footer has Resources column
- [ ] Header has core landing page link
- [ ] No TypeScript errors

---

## Phase 5 — Google Search Console (Manual)

### Sitemap
```
https://www.acupunctureflushing.com/sitemap.xml
```

### English URLs (Already Submitted — No Action Needed)
```
https://www.acupunctureflushing.com/en/acupuncture-flushing-ny
https://www.acupunctureflushing.com/en/acupuncture-for-back-pain-flushing-ny
https://www.acupunctureflushing.com/en/acupuncture-for-insomnia-flushing-ny
https://www.acupunctureflushing.com/en/acupuncture-for-anxiety-flushing-ny
https://www.acupunctureflushing.com/en/acupuncture-cost-flushing-ny
https://www.acupunctureflushing.com/en/chinese-herbal-medicine-flushing-ny
https://www.acupunctureflushing.com/en/cupping-therapy-flushing-ny
https://www.acupunctureflushing.com/en/moxibustion-flushing-ny
https://www.acupunctureflushing.com/en/tui-na-massage-flushing-ny
```

### Chinese URLs to Request Indexing (Added April 2026) — SUBMIT THESE ONLY
```
https://www.acupunctureflushing.com/zh/法拉盛中医针灸
https://www.acupunctureflushing.com/zh/法拉盛针灸治腰痛
https://www.acupunctureflushing.com/zh/法拉盛失眠针灸
https://www.acupunctureflushing.com/zh/法拉盛针灸治焦虑
https://www.acupunctureflushing.com/zh/法拉盛中药
https://www.acupunctureflushing.com/zh/法拉盛拔罐
https://www.acupunctureflushing.com/zh/法拉盛艾灸
https://www.acupunctureflushing.com/zh/法拉盛推拿
https://www.acupunctureflushing.com/zh/法拉盛针灸费用
```

### GSC Step-by-Step

**1. Submit sitemap:**
- GSC → Sitemaps → enter `sitemap.xml` → Submit
- Verify status shows "Success" and URL count includes Chinese pages

**2. Request indexing (priority order):**
- GSC → URL Inspection → paste each URL → Request Indexing
- Do core landing pages first (English + Chinese), then conditions, then services
- Google allows ~10 requests/day

**3. Verify redirects:**
- GSC → URL Inspection → enter old zh URL (e.g., `/zh/acupuncture-flushing-ny`)
- Should show "Page with redirect" status pointing to new Chinese URL
- All 9 old zh URLs redirect via 308 permanent

**4. Monitor hreflang:**
- GSC → URL Inspection → check each Chinese page
- Verify "Alternate page" shows the English equivalent
- e.g., `法拉盛中医针灸` ↔ `acupuncture-flushing-ny`

**5. Performance filters for Chinese SEO:**
- GSC → Performance → filter by Page containing `法拉盛`
- GSC → Performance → filter by Query containing `针灸` or `中医` or `法拉盛`
- Track: Impressions, Clicks, CTR, Average Position

### GSC Monitoring Schedule

| When | What to Check |
|------|---------------|
| **Week 1** | Sitemap submitted, indexing requested, no crawl errors |
| **Week 2-3** | Pages → new URLs appearing as "Indexed" |
| **Month 1** | Performance → first impressions for Chinese queries |
| **Month 2-3** | Performance → ranking stabilization, initial traffic |
| **Monthly** | Top queries review, new keyword opportunities, Core Web Vitals |

---

## Phase 6 — Ongoing (Manual)

| Task | Priority | Frequency |
|------|----------|-----------|
| Optimize GBP listing (add Chinese description) | High | Once |
| Set up review collection system (encourage Chinese reviews) | High | Once + ongoing |
| Monthly GSC review (both EN + ZH performance) | Medium | Monthly |
| Monthly AI citation monitoring | Medium | Monthly |
| Blog posts targeting long-tail keywords (EN + ZH) | Medium | 2/month |
| Backlink building (EN sites + Chinese directories) | Medium | Ongoing |
| GBP posts (alternate EN/ZH) | Low | Weekly |
| Submit to Chinese business directories | Medium | Once |

### Chinese Business Directories

| Directory | Priority |
|---|---|
| 大众点评 (US) - dianping.com | High |
| 华人黄页 - huarenyellowpage.com | High |
| Local WeChat groups (manual outreach) | High |
| 58同城海外 | Medium |
| 华人头条 - 52hrtt.com | Medium |

---

## Phase 7 — Chinese SEO (Completed April 2026)

> **Status: DONE** — All items below completed April 15-17, 2026.

### What Was Built

| Item | Status |
|------|--------|
| 9 Chinese-character SEO pages created | ✅ |
| 9 permanent redirects (old EN slugs → new CN slugs) | ✅ |
| Redirect logic in `[slug]/page.tsx` (fires before DB lookup) | ✅ |
| URL decoding fix for Next.js 14 (`decodeURIComponent`) | ✅ |
| URL encoding fix for HTTP Location header | ✅ |
| hreflang alternates (EN ↔ ZH) via `redirects.json` | ✅ |
| `getServiceSEOLinks()` updated for locale-specific content lookup | ✅ |
| Homepage + services "Learn More" → direct Chinese URLs | ✅ |
| `seo.json` (zh) — all metadata translated to Chinese | ✅ |
| Homepage "Why Choose Us" translated to Chinese | ✅ |
| Sitemap updated (Chinese URLs included, old redirects excluded) | ✅ |
| `site_seo_pages` table — 9 Chinese pages registered | ✅ |
| Old zh English-slug DB entries cleaned up | ✅ |

### Chinese Page Inventory

| Chinese URL | English Equivalent | Type |
|---|---|---|
| `法拉盛中医针灸` | `acupuncture-flushing-ny` | seo-local-landing |
| `法拉盛针灸治腰痛` | `acupuncture-for-back-pain-flushing-ny` | seo-condition |
| `法拉盛失眠针灸` | `acupuncture-for-insomnia-flushing-ny` | seo-condition |
| `法拉盛针灸治焦虑` | `acupuncture-for-anxiety-flushing-ny` | seo-condition |
| `法拉盛中药` | `chinese-herbal-medicine-flushing-ny` | seo-service |
| `法拉盛拔罐` | `cupping-therapy-flushing-ny` | seo-service |
| `法拉盛艾灸` | `moxibustion-flushing-ny` | seo-service |
| `法拉盛推拿` | `tui-na-massage-flushing-ny` | seo-service |
| `法拉盛针灸费用` | `acupuncture-cost-flushing-ny` | seo-resource |

### Key Files Changed

| File | Change |
|------|--------|
| `app/[locale]/[slug]/page.tsx` | Added `decodeURIComponent`, redirect-before-DB-lookup, hreflang metadata |
| `lib/redirects.ts` | New — per-site redirect + hreflang lookup with caching |
| `lib/seo-pages.ts` | Added `getServiceSEOLinksFromContent()` for locale-specific service link resolution |
| `app/api/admin/content/export/route.ts` | Fixed theme.json sync across locales, excluded from backfill |
| `app/api/admin/content/import/route.ts` | Fixed theme check to only check requested locale |
| `app/sitemap.ts` | Added filesystem SEO page discovery, redirect exclusion, non-ASCII locale filtering |
| `content/acu-flushing/redirects.json` | New — 9 redirects + 9 hreflang mappings |
| `content/acu-flushing/zh/seo.json` | All metadata translated to Chinese |
| `content/acu-flushing/zh/pages/home.json` | "Why Choose Us" translated to Chinese |

### Future Chinese Pages to Consider

Based on Chinese search patterns (build when GSC data confirms demand):

| Potential Page | Target Keyword | When to Build |
|---|---|---|
| `法拉盛针灸师` | Practitioner intent | If GSC shows "针灸师" queries |
| `法拉盛中医诊所` | Clinic intent | If GSC shows "诊所" queries |
| `法拉盛痛症针灸` | Pain-focused | If GSC shows "痛症" queries |
| `法拉盛妇科中医` | Gynecology | If GSC shows "妇科" queries |
| `法拉盛老中医` | Trust signal | If GSC shows "老中医" queries |

---

## Key Advantage: Pipeline Automation

Since Acu-Flushing uses the same codebase as Dr. Huang, all the infrastructure is already in place:
- `[slug]/page.tsx` dynamic route ✓
- `SEO*Layout.tsx` components ✓
- `site_seo_pages` DB table ✓
- `seed-seo-pages.mjs` pipeline ✓
- `getServiceSEOLinks()` auto-linking (now locale-aware) ✓
- `lib/redirects.ts` per-site redirect system ✓
- Chinese-character URL support ✓

**Phase 1–4 can be completed in ~30 minutes** by running the pipeline + a few DB updates. No new code needed.

**Phase 7 (Chinese SEO) adds ~45 minutes** per site: create Chinese pages, set up redirects, translate seo.json, register in DB.

---

*Acu-Flushing SEO Implementation Plan — March 25, 2026*
*Updated: April 17, 2026 — Added Phase 7 (Chinese SEO), updated Phase 5 (GSC) with Chinese URLs*
*Ref: BAAM SEO Playbook | DrHuang retrofit as reference implementation*
