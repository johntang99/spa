# Acu-Gangshi — SEO Implementation Plan
## Site: shiacupuncture.com (site_id: acu-gangshi)

| | |
|---|---|
| **Date** | March 30, 2026 |
| **Business** | Gang Shi Acupuncture |
| **Practitioner** | Dr. Gang Shi |
| **Location** | 935 Northern Boulevard, Suite 303, Great Neck, NY 11021 |
| **Primary phone (canonical)** | (516) 466-4018 |
| **Languages** | English, Mandarin Chinese |
| **System** | Same codebase as Dr. Huang / Acu-Flushing (multi-site, Supabase, dynamic `[slug]` route) |

**References:** This plan aligns with `BAAM_Local_SEO_SOP_Part1.md` (business truth, keyword buckets, GBP, on-page discipline), `BAAM_Local_SEO_SOP_Part2.md` (Stage A/B intake → pipeline → `site_seo_pages`), and uses `BAAM_SEO_Completion_Report_Generic.md` as the done-gate scorecard for keyword architecture, technical checks, GBP, reviews, and GSC. Structural template: `AcuFlushing_SEO_Implementation_Plan.md`.

---

## Prerequisites and content QA (before pipeline)

### Phase 0 — Create `intake.json` (blocking)

`seed-seo-pages.mjs` expects `content/acu-gangshi/intake.json`. **This file does not exist yet** (unlike `acu-flushing` and `dr-huang-clinic`). Create it using `content/dr-huang-clinic/intake.json` as a schema reference.

Suggested shape:

- **location:** `city: "Great Neck"`, `state: "NY"`, `citySlug: "great-neck"`, `address` / `zip` from `en/site.json`, **phone:** `(516) 466-4018`.
- **services.modalities:** mirror the four modality slugs used elsewhere for automated service pages: Chinese Herbal Medicine (`chinese-herbal-medicine`), Cupping (`cupping-therapy`), Moxibustion (`moxibustion`), Tui Na (`tuina-massage`). Match **`servicesList.items[].id`** in `en/pages/services.json` for slug alignment with the live services page.
- **seo.primaryService:** `acupuncture`
- **seo.specialties:** align with the first three condition landing pages you register (below) and BAAM “money intents” (e.g. back pain, insomnia, anxiety — confirm with client keyword map).
- **seo.serviceAreaCities:** honest adjacent demand (e.g. Manhasset, Roslyn, New Hyde Park, Lake Success, Port Washington) — do not claim towns you do not serve; use for **internal / GBP service areas**, not spammy keyword stuffing.

After `intake.json` exists, register **`site_id: acu-gangshi`** in Supabase (same pattern as other sites) so `site_seo_pages` rows can be created.

### NAP and trust signals (fix drift)

Several content files still carry **placeholder or wrong phone numbers** compared to `en/seo.json` / `en/site.json`:

| File / area | Issue |
|-------------|--------|
| `en/pages/services.json` — CTA `tel:` | Uses `845-381-1106` (wrong) |
| `en/pages/about.json` — CTA `tel:` | Uses `+1 917…` (wrong) |
| `en/site.json` — `addressMapUrl` | Points to unrelated address (NYC placeholder) |

Unify **one** canonical `tel:` (E.164: `+15164664018`) across header, footer, CTAs, and JSON-LD when those are wired. Fix the maps URL to the **Great Neck suite** address. These fixes support **E-E-A-T**, consistent **GBP ↔ website** matching, and conversion — per BAAM local SOP “business truth first.”

---

## Current status vs reference sites

| SEO Component | Dr. Huang / Acu-Flushing (reference) | Acu-Gangshi (current) | Gap |
|---------------|--------------------------------------|------------------------|-----|
| `intake.json` | Present | **Missing** | **Create (Phase 0)** |
| `site_seo_pages` registered | Multiple slugs | TBD / likely none or partial | **Run pipeline after intake** |
| Core landing | `acupuncture-*-ny` | TBD | **Target** `acupuncture-great-neck-ny` |
| Condition pages (3) | back, insomnia, anxiety | TBD | **Target** `*-great-neck-ny` slugs |
| Resource (cost) | `acupuncture-cost-*-ny` | TBD | **Target** `acupuncture-cost-great-neck-ny` |
| Service pages (4 modalities) | herbal, cupping, moxa, tui na | TBD | **Generate via pipeline** |
| ZH locale for SEO slugs | Dr. Huang / Flushing pattern | TBD | **Generate via pipeline** |
| `seo` on hub pages synced to DB | Reference sites | Verify `home` / `about` / `services` / `contact` | **Sync** per Phase 2 |
| Homepage SEO hub + footer columns + header link | Reference sites | Likely missing until retrofit | **Phase 3** |
| GSC / sitemap | Reference sites | Manual after deploy | **Phase 5** |

Exact row counts should be confirmed in Supabase for `acu-gangshi` before calling Phase 1 “done.”

---

## Target slug set (English) — Great Neck, NY

Once intake and DB registration are in place, the **default stack** mirrors Acu-Flushing (9 EN slugs × 2 locales = 18 pages, if ZH is enabled for all):

| Type | Example slug |
|------|----------------|
| Local landing | `acupuncture-great-neck-ny` |
| Condition | `acupuncture-for-back-pain-great-neck-ny`, `acupuncture-for-insomnia-great-neck-ny`, `acupuncture-for-anxiety-great-neck-ny` |
| Resource | `acupuncture-cost-great-neck-ny` |
| Service | `chinese-herbal-medicine-great-neck-ny`, `cupping-therapy-great-neck-ny`, `moxibustion-great-neck-ny`, `tui-na-massage-great-neck-ny` |

**Note:** `gua-sha`, herbal patches, and lifestyle counseling appear on the **services** page but are **not** in the standard four-modality service SEO set unless you extend the pipeline contract.

---

## Implementation phases

| Phase | What | Effort | Timeline |
|-------|------|--------|----------|
| **Phase 0** | Add `intake.json`, fix NAP/maps/CTA phones, confirm `site_seo_pages` site binding | Content + DB — 30–60 min | First |
| **Phase 1** | Run pipeline: 4 service pages + ZH for all SEO slugs | Automated — ~5 min | After Phase 0 |
| **Phase 2** | Ensure `seo` objects on hub pages (`home`, `about`, `services`, `contact`) are synced to DB | Automated or CMS — ~5 min | After Phase 1 |
| **Phase 3** | Homepage SEO hub + footer resources + header link to core landing; rewire internal links from anchors to SEO URLs | Code + content — ~15–30 min | After Phase 2 |
| **Phase 4** | Verify rendering, titles, H1s, FAQ schema | Script + QA — ~15 min | Before prod |
| **Phase 5** | Submit sitemap + priority URLs in Google Search Console | Manual — ~15 min | After deploy |
| **Phase 6** | GBP, reviews, citations, content cadence | Manual — ongoing | After Phase 5 |

---

## Phase 1 — Generate SEO pages (automated)

```bash
node scripts/seed-seo-pages.mjs acu-gangshi
```

Expected outputs (subject to your DB template): **1** local landing, **3** conditions, **1** cost resource, **4** service modality pages; plus **ZH** counterparts if the pipeline is configured for `zh`.

---

## Phase 2 — SEO objects on existing pages

Sync or add `seo.title` / `seo.description` for `home`, `about`, `services`, and `contact` so they match **Great Neck** positioning and stay within title/description length limits from the completion report checklist.

---

## Phase 3 — Internal link rewiring + navigation

Apply the same **authority flow** as Acu-Flushing: high-traffic hubs should link to **programmatic SEO URLs**, not only anchor fragments.

### 3.1 Homepage — services section

| Service | Target link (EN) |
|---------|------------------|
| Acupuncture (featured) | `/en/acupuncture-great-neck-ny` |
| Chinese Herbal Medicine | `/en/chinese-herbal-medicine-great-neck-ny` |
| Cupping | `/en/cupping-therapy-great-neck-ny` |
| Moxibustion | `/en/moxibustion-great-neck-ny` |
| Tui Na | `/en/tui-na-massage-great-neck-ny` |
| Gua Sha / patches / lifestyle | keep deep links or anchors until dedicated SEO pages exist |

### 3.2 Homepage — conditions section

Point conditions with SEO coverage to:

- `/en/acupuncture-for-back-pain-great-neck-ny`
- `/en/acupuncture-for-insomnia-great-neck-ny`
- `/en/acupuncture-for-anxiety-great-neck-ny`

### 3.3 `pages/services.json` — `servicesList.items[].link`

Add `link` for each item that has a matching SEO slug (component already supports “Learn more” when `link` is set).

### 3.4 `pages/conditions.json` — condition cards

Add links for the three condition stacks above.

### 3.5 Homepage `seoLink` + header

- `seoLink`: e.g. `{ "url": "/en/acupuncture-great-neck-ny", "text": "Acupuncture in Great Neck, NY" }`
- Header: optional **Acupuncture** item → core landing (matches SOP “core money page in nav”).

### 3.6 Footer — Resources + service areas

| Column | Example links |
|--------|----------------|
| **Resources** | Cost → `/en/acupuncture-cost-great-neck-ny`; core landing → `/en/acupuncture-great-neck-ny` |
| **Service areas** | Great Neck + condition pages as appropriate |

Use **honest** neighborhood names; optional “near me” language belongs in copy, not doorway pages, unless you extend the product with additional approved slugs.

---

## Phase 4 — Verification

```bash
node scripts/verify-site.mjs acu-gangshi
```

```bash
node scripts/seo-pipeline.mjs acu-gangshi --skip-generation
```

### Done-gate (adapted from completion report + Flushing plan)

- [ ] `site_seo_pages`: all target slugs active for `acu-gangshi`
- [ ] `content_entries`: EN + ZH counts match expectations
- [ ] All SEO routes return **200**
- [ ] Titles ≤ ~60 chars, meta descriptions ≤ ~155 chars
- [ ] Unique H1 per page; FAQ / relevant schema present per layout
- [ ] Homepage hub (if implemented) links to priority SEO pages
- [ ] Footer resources + header core link present
- [ ] **NAP** consistent sitewide; maps URL correct
- [ ] No TypeScript or build errors

---

## Phase 5 — Google Search Console

Use the **production** host (confirm `www` vs apex in Vercel / DNS).

### Sitemap

```
https://www.shiacupuncture.com/sitemap.xml
```

(Adjust if production uses `www`.)

### English URLs to request indexing

```
https://www.shiacupuncture.com/en/acupuncture-great-neck-ny
https://www.shiacupuncture.com/en/acupuncture-for-back-pain-great-neck-ny
https://www.shiacupuncture.com/en/acupuncture-for-insomnia-great-neck-ny
https://www.shiacupuncture.com/en/acupuncture-for-anxiety-great-neck-ny
https://www.shiacupuncture.com/en/acupuncture-cost-great-neck-ny
https://www.shiacupuncture.com/en/chinese-herbal-medicine-great-neck-ny
https://www.shiacupuncture.com/en/cupping-therapy-great-neck-ny
https://www.shiacupuncture.com/en/moxibustion-great-neck-ny
https://www.shiacupuncture.com/en/tui-na-massage-great-neck-ny
```

### Chinese URLs to request indexing (shipped April 2026)

```
https://www.shiacupuncture.com/zh/大颈中医针灸
https://www.shiacupuncture.com/zh/大颈针灸治腰痛
https://www.shiacupuncture.com/zh/大颈失眠针灸
https://www.shiacupuncture.com/zh/大颈针灸治焦虑
https://www.shiacupuncture.com/zh/大颈中药
https://www.shiacupuncture.com/zh/大颈拔罐
https://www.shiacupuncture.com/zh/大颈艾灸
https://www.shiacupuncture.com/zh/大颈推拿
https://www.shiacupuncture.com/zh/大颈针灸费用
```

### GSC submit priority (recommended)

1. `/zh/大颈中医针灸` (core landing)
2. `/zh/大颈针灸治腰痛`
3. `/zh/大颈失眠针灸`
4. `/zh/大颈针灸治焦虑`
5. `/zh/大颈针灸费用`
6. Remaining service pages

### Redirect verification in GSC

Verify these old zh URLs report **Page with redirect**:

- `/zh/acupuncture-great-neck-ny` → `/zh/大颈中医针灸`
- `/zh/acupuncture-for-back-pain-great-neck-ny` → `/zh/大颈针灸治腰痛`
- `/zh/acupuncture-for-insomnia-great-neck-ny` → `/zh/大颈失眠针灸`
- `/zh/acupuncture-for-anxiety-great-neck-ny` → `/zh/大颈针灸治焦虑`
- `/zh/chinese-herbal-medicine-great-neck-ny` → `/zh/大颈中药`
- `/zh/cupping-therapy-great-neck-ny` → `/zh/大颈拔罐`
- `/zh/moxibustion-great-neck-ny` → `/zh/大颈艾灸`
- `/zh/tui-na-massage-great-neck-ny` → `/zh/大颈推拿`
- `/zh/acupuncture-cost-great-neck-ny` → `/zh/大颈针灸费用`

---

## Phase 7 — Chinese SEO (Completed April 2026)

> **Status: DONE** (filesystem + DB migration completed).

### What was completed

- 9 Chinese-character SEO pages created under `content/acu-gangshi/zh/`
- 9 permanent redirects added in `content/acu-gangshi/redirects.json`
- EN↔ZH hreflang mappings added for all 9 SEO slugs
- Homepage/services/conditions/header/footer zh links rewired to Chinese URLs
- `zh/seo.json` metadata translated to Chinese
- Old zh English-slug SEO files removed
- Old zh English-slug `content_entries` rows deleted from Supabase
- 9 Chinese slugs registered in `site_seo_pages`

### Chinese slug inventory

| Chinese URL | English Equivalent | Type |
|---|---|---|
| `大颈中医针灸` | `acupuncture-great-neck-ny` | seo-local-landing |
| `大颈针灸治腰痛` | `acupuncture-for-back-pain-great-neck-ny` | seo-condition |
| `大颈失眠针灸` | `acupuncture-for-insomnia-great-neck-ny` | seo-condition |
| `大颈针灸治焦虑` | `acupuncture-for-anxiety-great-neck-ny` | seo-condition |
| `大颈中药` | `chinese-herbal-medicine-great-neck-ny` | seo-service |
| `大颈拔罐` | `cupping-therapy-great-neck-ny` | seo-service |
| `大颈艾灸` | `moxibustion-great-neck-ny` | seo-service |
| `大颈推拿` | `tui-na-massage-great-neck-ny` | seo-service |
| `大颈针灸费用` | `acupuncture-cost-great-neck-ny` | seo-resource |

---

## Phase 6 — Ongoing (manual)

| Task | Priority | Frequency |
|------|----------|-----------|
| Google Business Profile: categories, services, photos, hours, UTM-free website URL | High | Once + updates |
| Review generation + response workflow | High | Ongoing |
| GSC performance and coverage review | Medium | Monthly |
| Citation / AI overview spot-checks | Medium | Monthly |
| Blog / guides for long-tail intents (Great Neck + condition modifiers) | Medium | Per content calendar |
| Ethical digital PR / local partnerships | Medium | Ongoing |

---

## Key advantage: same pipeline as Acu-Flushing

Infrastructure (`SEO*Layout`, dynamic slug route, `site_seo_pages`, `seed-seo-pages.mjs`, `verify-site.mjs`) is shared. The original Phase 0 blocker (`intake.json` + DB site binding) has been cleared, and the Chinese SEO migration now follows the same production pattern as Acu-Flushing.

---

*Acu-Gangshi SEO Implementation Plan — March 30, 2026*  
*Ref: BAAM Local SEO SOP Part 1 & 2, BAAM SEO Completion Report (generic), AcuFlushing implementation plan*
