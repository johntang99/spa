# Goshen Acupuncture — SEO Implementation Plan
## Site: goshenacupuncture.com (site_id: goshen-acupuncture)

| | |
|---|---|
| **Date** | May 11, 2026 |
| **Business** | Kingsfoil Acupuncture |
| **Primary Location** | Goshen, NY 10924 |
| **Phone** | (845) 682-0809 |
| **Languages** | English + Chinese |
| **System** | BAAM Chinese-medicine multi-site SEO pipeline (`site_seo_pages` + dynamic `[slug]` route) |

---

## Review Basis

This implementation follows:
- `docs/BAAM_Local_SEO_SOP_Part1.md` (business truth -> clustering -> mapping -> GBP/technical loop)
- `dental-clinic/app/docs/DrHUortho_SEO_Implementation_Plan.md` (phase-driven execution discipline and GSC submission order)

---

## Current Status (After Phase 0 + Seeding)

### Completed
- Intake foundation created: `content/goshen-acupuncture/intake.json`
- Site registered in file config fallback: `content/_sites.json`
- Pipeline executed: `node scripts/seed-seo-pages.mjs goshen-acupuncture`
- SEO registry now active: **13 rows in `site_seo_pages`**
- EN + ZH SEO page content seeded for all 13 slugs
- Metadata length QA passed for all seeded pages (one overlong EN title fixed)

### Active SEO Slugs (13)
- `acupuncture-goshen-ny` (`seo-local-landing`)
- `acupuncture-for-back-pain-goshen-ny` (`seo-condition`)
- `acupuncture-for-insomnia-goshen-ny` (`seo-condition`)
- `acupuncture-for-anxiety-goshen-ny` (`seo-condition`)
- `acupuncture-cost-goshen-ny` (`seo-resource`)
- `chinese-herbal-medicine-goshen-ny` (`seo-service`)
- `cupping-therapy-goshen-ny` (`seo-service`)
- `moxibustion-goshen-ny` (`seo-service`)
- `tui-na-massage-goshen-ny` (`seo-service`)
- `acupuncture-hudson-valley-ny` (`seo-local-landing`)
- `acupuncture-for-back-pain-hudson-valley-ny` (`seo-condition`)
- `acupuncture-for-anxiety-hudson-valley-ny` (`seo-condition`)
- `acupuncture-cost-hudson-valley-ny` (`seo-resource`)

---

## Keyword-to-Page Mapping (Goshen Program)

| Bucket | Primary Intent | URL |
|---|---|---|
| Core local service | Acupuncture in Goshen, NY | `/en/acupuncture-goshen-ny` |
| Condition | Acupuncture for back pain | `/en/acupuncture-for-back-pain-goshen-ny` |
| Condition | Acupuncture for insomnia | `/en/acupuncture-for-insomnia-goshen-ny` |
| Condition | Acupuncture for anxiety | `/en/acupuncture-for-anxiety-goshen-ny` |
| Resource/decision | Acupuncture cost in Goshen | `/en/acupuncture-cost-goshen-ny` |
| Service modality | Chinese herbal medicine | `/en/chinese-herbal-medicine-goshen-ny` |
| Service modality | Cupping therapy | `/en/cupping-therapy-goshen-ny` |
| Service modality | Moxibustion | `/en/moxibustion-goshen-ny` |
| Service modality | Tui Na massage | `/en/tui-na-massage-goshen-ny` |

---

## Phase Plan

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Business truth + intake + config baseline | ✅ Done |
| Phase 1 | Generate and register SEO pages (EN + ZH) | ✅ Done |
| Phase 2 | Internal-link authority flow (home/services/conditions/footer) | 🔄 Next |
| Phase 3 | GBP + reviews + citations for Goshen geo-signal reinforcement | 🔄 Next |
| Phase 4 | GSC submission and 2-4 week monitoring loop | 🔄 Next |

---

## Phase 2 — Internal Linking (Next Priority)

Apply SOP internal-link rules so seeded pages receive authority:

1. Homepage services module links should resolve to SEO slugs (already supported by `getServiceSEOLinks()`; verify content IDs map cleanly).
2. Services page item links should resolve to SEO slugs (same link resolver path; verify runtime output).
3. Add homepage SEO hub section for Goshen (9 links) to ensure no orphan SEO pages.
4. Add footer "Resources / Service Areas" links to core + condition + cost pages.
5. Add header nav shortcut to core landing (`/en/acupuncture-goshen-ny`).

---

## Phase 3 — GBP / Citation / Reviews (Manual Ops)

- GBP primary profile URL should point to: `/en/acupuncture-goshen-ny`
- Weekly GBP posts by cluster:
  - service spotlight
  - condition education
  - trust/review proof
- Review cadence target:
  - Month 1: +10 reviews
  - Month 3: 25+ total
- Citation NAP consistency:
  - Google, Apple Maps, Bing, Yelp, medical directories
  - Keep address/phone exactly consistent with site + GBP

---

## Phase 4 — GSC Execution

### Submit sitemap
```text
https://www.goshenacupuncture.com/sitemap.xml
```

### Request indexing (EN priority order)
```text
https://www.goshenacupuncture.com/en/acupuncture-goshen-ny
https://www.goshenacupuncture.com/en/acupuncture-hudson-valley-ny
https://www.goshenacupuncture.com/en/chinese-herbal-medicine-goshen-ny
https://www.goshenacupuncture.com/en/cupping-therapy-goshen-ny
https://www.goshenacupuncture.com/en/moxibustion-goshen-ny
https://www.goshenacupuncture.com/en/tui-na-massage-goshen-ny
https://www.goshenacupuncture.com/en/acupuncture-for-back-pain-goshen-ny
https://www.goshenacupuncture.com/en/acupuncture-for-back-pain-hudson-valley-ny
https://www.goshenacupuncture.com/en/acupuncture-for-insomnia-goshen-ny
https://www.goshenacupuncture.com/en/acupuncture-for-anxiety-goshen-ny
https://www.goshenacupuncture.com/en/acupuncture-for-anxiety-hudson-valley-ny
https://www.goshenacupuncture.com/en/acupuncture-cost-goshen-ny
https://www.goshenacupuncture.com/en/acupuncture-cost-hudson-valley-ny
```

### Request indexing (ZH mirror set)
```text
https://www.goshenacupuncture.com/zh/acupuncture-goshen-ny
https://www.goshenacupuncture.com/zh/acupuncture-hudson-valley-ny
https://www.goshenacupuncture.com/zh/chinese-herbal-medicine-goshen-ny
https://www.goshenacupuncture.com/zh/cupping-therapy-goshen-ny
https://www.goshenacupuncture.com/zh/moxibustion-goshen-ny
https://www.goshenacupuncture.com/zh/tui-na-massage-goshen-ny
https://www.goshenacupuncture.com/zh/acupuncture-for-back-pain-goshen-ny
https://www.goshenacupuncture.com/zh/acupuncture-for-back-pain-hudson-valley-ny
https://www.goshenacupuncture.com/zh/acupuncture-for-insomnia-goshen-ny
https://www.goshenacupuncture.com/zh/acupuncture-for-anxiety-goshen-ny
https://www.goshenacupuncture.com/zh/acupuncture-for-anxiety-hudson-valley-ny
https://www.goshenacupuncture.com/zh/acupuncture-cost-goshen-ny
https://www.goshenacupuncture.com/zh/acupuncture-cost-hudson-valley-ny
```

---

## Done-Gate Checklist

- [x] Intake exists and matches Goshen business truth
- [x] 13 SEO slugs registered in `site_seo_pages`
- [x] EN + ZH SEO content entries generated
- [x] Core + 3 condition + 1 resource + 4 service page types present
- [x] Homepage SEO hub and footer resource links added
- [x] Header nav includes core landing shortcut
- [ ] GBP profile links to core landing page
- [ ] Sitemap submitted and all 13 EN + 13 ZH URLs requested in GSC
- [ ] 2-4 week coverage/CTR monitoring started

