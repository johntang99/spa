# Phase 0C — Contracts → Implementation Map

Maps `docs/SPA_CONTENT_CONTRACTS.md` to the implemented code in `lib/contracts/`.

**Locale model (0C decision):** the platform stores content as **separate per-locale files**
(`content/<site>/en/*.json` + `zh/*.json`). Contract `loc` fields therefore validate one
locale's value (plain string); "loc completeness" is enforced by the **locale-parity rule**
(`localeParityIssues`), not by inline `{en,zh}` objects. This adopts the platform convention
and preserves reuse — the contracts doc should be annotated with this note.

## Sections (Artifact 2, S01–S26) → `lib/contracts/sections.ts`

| Code | Section type | zod export | Form def | Notes |
|---|---|---|---|---|
| S01 | hero | `heroSchema` | `SECTION_FORMS.hero` | 9 variants |
| S02 | trustBar | `trustBarSchema` | ✓ | items 2–5 |
| S03 | categoryGrid | `categoryGridSchema` | ✓ | |
| S04 | serviceCards | `serviceCardsSchema` | ✓ | |
| S05 | menuTable | `menuTableSchema` | ✓ | no prices stored |
| S06 | addOnsList | `addOnsListSchema` | ✓ | |
| S07 | steps | `stepsSchema` | ✓ | items 3–6 |
| S08 | iconGrid | `iconGridSchema` | ✓ | **claims-checked** (benefits) |
| S09 | featurePanel | `featurePanelSchema` | ✓ | 7/5 split |
| S10 | promoStrip | `promoStripSchema` | ✓ | |
| S11 | testimonials | `testimonialsSchema` | ✓ | rating ≥25 (render rule) |
| S12 | teamGrid | `teamGridSchema` | ✓ | |
| S13 | richText | `richTextSchema` | ✓ | **claims-checked** (howHelps/whatItIs) |
| S14 | faq | `faqSchema` | ✓ | |
| S15 | ctaBanner | `ctaBannerSchema` | ✓ | trust cluster auto-mounts |
| S16 | napHours | `napHoursSchema` | ✓ | NAPE from site.json |
| S17 | mapBlock | `mapBlockSchema` | ✓ | |
| S18 | contactForm | `contactFormSchema` | ✓ | → leads(question) |
| S19 | bookingForm | `bookingFormSchema` | ✓ | → leads(booking) |
| S20 | altPaths | `altPathsSchema` | ✓ | |
| S21 | galleryGrid | `galleryGridSchema` | ✓ | |
| S22 | statsBand | `statsBandSchema` | ✓ | reviewCount ≥25 |
| S23 | checklist | `checklistSchema` | ✓ | items 4–8 |
| S24 | treatmentSelector | `treatmentSelectorSchema` | ✓ | |
| S25 | productGrid | `productGridSchema` | ✓ | gift commerce |
| S26a–h | packageGrid / comparisonTable / protectedNotice / reviewedBy / articleHero / toc / relatedLinks / blogList | individual exports | ✓ | protectedNotice **claims-checked** + locked |

Registry: `SECTION_SCHEMAS` (type → `{ code, schema, claimsChecked? }`), `SECTION_TYPES`, `validateSection()`.

## Collections → `lib/contracts/collections.ts`

| Collection | zod export | Storage | Migration |
|---|---|---|---|
| service categories | `serviceCategorySchema` | content_entries | — |
| services | `serviceSchema` | content_entries (dual-store table deferred to §29.7) | — |
| addons | `addonSchema` | content_entries | — |
| site_seo_pages | `siteSeoPageSchema` | dedicated table | `20260322_site_seo_pages.sql` (exists) |
| team | `teamMemberSchema` | content_entries | — |
| testimonials | `testimonialSchema` | content_entries | — |
| featured_experiences | `featuredExperienceSchema` | content_entries | — |
| faqs | `faqItemSchema` | content_entries | — |
| gift_card_products | `giftCardProductSchema` | content_entries | — |
| packages | `packageSchema` | content_entries | — |
| **leads** | `leadSchema` | **dedicated table** | `20260610_spa_leads_orders.sql` (NEW — run in dashboard) |
| **orders** | `orderSchema` | **dedicated table** | `20260610_spa_leads_orders.sql` (NEW — run in dashboard) |

## Globals / SEO → `lib/contracts/globals.ts`, `lib/contracts/seo.ts`
`siteSettingsSchema`, `headerSettingsSchema`, `footerSettingsSchema` (permissive), `seoObjectSchema`.

## 8 Validation Rules → `lib/contracts/validation-rules.ts` + `claims-validator.ts`

| # | Rule | Implementation | When |
|---|---|---|---|
| 1 | loc completeness | `localeParityIssues()` | save / QA |
| 2 | claims validator | `passesClaimsCheck()` + `validateContentOnSave()` | **save (hard-block)** ✓ wired |
| 3 | protectedNotice locked | `isProtectedSection()` | admin (Phase 1) |
| 4 | campaign overlap ≤1 active | `validateCampaigns()` | settings save |
| 5 | seo completeness before publish | `validateSeoComplete()` + save orchestrator | **save (hard-block)** ✓ wired |
| 6 | slug + keywordCluster uniqueness | `checkSeoPageUniqueness()` | seo-page save |
| 7 | active/enabled refs only | (render filter) | render (Phase 1) |
| 8 | rating render ≥25 | `shouldRenderRating()` | render (Phase 1) |

Save-pipeline wiring: `app/api/admin/content/file/route.ts` PUT → `validateContentOnSave()`
(errors block, warnings logged).

## Admin form modules → `lib/contracts/forms.ts`
`SECTION_FORMS` (declarative `FieldDef[]` per section, variant options pulled live from the
zod schemas) + `getSectionForm()`. Bespoke React panels build on these in Phase 1 (per section)
and Phase 2H (collection editors).
