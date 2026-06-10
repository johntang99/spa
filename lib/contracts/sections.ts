// System S — Canonical section contracts (S01–S26) as zod schemas.
// Source of truth: docs/SPA_CONTENT_CONTRACTS.md ARTIFACT 2.
// Per-locale model: `loc`/`locRich` fields are plain strings (one locale per file).
import { z } from 'zod';
import { loc, locReq, locRich, locRichReq, mediaRef, ref, iconKey, cta, mediaBlock } from './base';

/* S01 hero */
export const heroSchema = z.object({
  variant: z.enum([
    'full-bleed-image', 'video-loop', 'split', 'slideshow',
    'story', 'local', 'service', 'empathy', 'seasonal',
  ]),
  eyebrow: loc.optional(),
  headline: locReq, // local/service/empathy/seasonal: must equal seo.h1
  subline: locReq,
  badges: z.array(z.object({ iconKey, label: loc })).optional(),
  ctaPrimary: cta.optional(), // absent on empathy variant
  ctaSecondary: cta.optional(),
  media: mediaBlock.optional(),
  serviceRef: ref.optional(),
  campaignAware: z.boolean().optional(),
});

/* S02 trustBar */
export const trustBarSchema = z.object({
  variant: z.enum(['bar', 'column']),
  items: z.array(z.object({
    type: z.enum(['rating', 'licensed', 'hygiene', 'hours', 'bilingual', 'custom']),
    label: loc.optional(),
    iconKey: iconKey.optional(),
  })).min(2).max(5),
});

/* S03 categoryGrid */
export const categoryGridSchema = z.object({
  variant: z.enum(['tiles', 'panels']),
  intro: loc.optional(),
  categories: z.union([z.array(ref), z.literal('all')]),
  showCounts: z.boolean().default(false),
  showPriceFrom: z.boolean().default(true),
});

/* S04 serviceCards */
export const serviceCardsSchema = z.object({
  variant: z.enum(['grid', 'signature', 'top', 'recommended']),
  heading: loc.optional(),
  source: z.object({
    mode: z.enum(['refs', 'category', 'tag']),
    refs: z.array(ref).optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    limit: z.number().int().positive().optional(),
  }),
  showTierChips: z.boolean().default(true),
  bookCta: z.boolean().default(true),
  whyNotes: z.array(z.object({ serviceRef: ref, note: loc })).optional(),
});

/* S05 menuTable (ServiceMenuTable) — NO price/tier data stored; runtime resolve */
export const menuTableSchema = z.object({
  variant: z.enum(['table', 'compact', 'teaser']),
  categories: z.union([z.array(z.string()), z.literal('all')]).optional(),
  serviceRef: ref.optional(),
  limit: z.number().int().positive().optional(),
  showAddOns: z.boolean().default(false),
  bookCtaLabel: loc.optional(),
});

/* S06 addOnsList */
export const addOnsListSchema = z.object({
  variant: z.enum(['full', 'inline']),
  heading: loc.optional(),
  filterAppliesTo: ref.optional(),
});

/* S07 steps */
export const stepsSchema = z.object({
  variant: z.enum(['horizontal', 'vertical', 'expect', 'session']),
  heading: loc.optional(),
  items: z.array(z.object({ title: locReq, body: locReq, iconKey: iconKey.optional() })).min(3).max(6),
});

/* S08 iconGrid (benefits variant: bodies pass claims validator on save) */
export const iconGridSchema = z.object({
  variant: z.enum(['pillars', 'benefits', 'values', 'whyLocals']),
  heading: loc.optional(),
  items: z.array(z.object({ iconKey, title: locReq, body: locReq })).min(3).max(6),
});

/* S09 featurePanel (7/5 asymmetric) */
export const featurePanelSchema = z.object({
  variant: z.enum(['couples', 'corporate', 'membership', 'generic']),
  eyebrow: loc.optional(),
  heading: locReq,
  body: locReq,
  bullets: z.array(loc).max(5).optional(),
  media: mediaRef,
  mediaSide: z.enum(['left', 'right']).default('right'),
  cta,
  packageRef: ref.optional(),
});

/* S10 promoStrip */
export const promoStripSchema = z.object({
  variant: z.enum(['gift', 'packages', 'custom']),
  heading: locReq,
  subline: loc.optional(),
  cta,
  media: mediaRef.optional(),
  campaignAware: z.boolean().default(false),
});

/* S11 testimonials (locale filtering automatic; rating render ≥25) */
export const testimonialsSchema = z.object({
  variant: z.enum(['wall', 'carousel', 'spotlight']),
  heading: loc.optional(),
  filter: z.object({
    categoryTag: z.string().optional(),
    serviceRef: ref.optional(),
    scopeTag: z.string().optional(),
    limit: z.number().int().positive().default(6),
  }).default({ limit: 6 }),
  showSource: z.boolean().default(false),
});

/* S12 teamGrid */
export const teamGridSchema = z.object({
  variant: z.enum(['cards', 'portrait-row', 'preview', 'therapistNote']),
  heading: loc.optional(),
  refs: z.union([z.array(ref), z.literal('all')]).optional(),
  serviceRef: ref.optional(), // therapistNote — pulls specialists
});

/* S13 richText (article: H2 feeds toc; howHelps/whatItIs validator-checked) */
export const richTextSchema = z.object({
  variant: z.enum(['intro', 'body', 'policies', 'whatItIs', 'howHelps', 'driveContext', 'article']),
  heading: loc.optional(),
  body: locRichReq,
});

/* S14 faq */
export const faqSchema = z.object({
  variant: z.enum(['accordion', 'mini', 'search']),
  heading: loc.optional(),
  source: z.union([
    z.object({ scopeTag: z.string().min(1), limit: z.number().int().positive().optional() }),
    z.object({ refs: z.array(ref) }),
  ]),
  emitSchema: z.boolean().default(true),
});

/* S15 ctaBanner (TrustCluster auto-mounts with ctaPrimary) */
export const ctaBannerSchema = z.object({
  variant: z.enum(['image-bg', 'solid-token', 'split-offer', 'nap', 'soft']),
  heading: locReq,
  subline: loc.optional(),
  ctaPrimary: cta,
  ctaSecondary: cta.optional(),
  media: mediaRef.optional(),
  showNap: z.boolean().default(false),
});

/* S16 napHours (NAPE + hours ALWAYS from site.json) */
export const napHoursSchema = z.object({
  variant: z.enum(['visit', 'full', 'footer']),
  heading: loc.optional(),
  note: loc.optional(),
});

/* S17 mapBlock */
export const mapBlockSchema = z.object({
  variant: z.enum(['embed', 'directions', 'serviceArea', 'directionsFrom']),
  heading: loc.optional(),
  townRef: z.string().optional(),
  areaNote: loc.optional(),
  lazy: z.boolean().default(true),
});

/* S18 contactForm (fields fixed by component → leads{type:"question"}) */
export const contactFormSchema = z.object({
  heading: loc.optional(),
  successMessage: locReq,
});

/* S19 bookingForm (field set fixed by component A4-N2) */
export const bookingFormSchema = z.object({
  variant: z.enum(['full', 'inline-compact', 'package-inquiry']),
  successHeading: locReq,
  successBody: locReq,
  packageRef: ref.optional(),
});

/* S20 altPaths */
export const altPathsSchema = z.object({
  showCall: z.boolean().default(true),
  showWechat: z.boolean().optional(), // default auto(zh)
  showExternal: z.boolean().optional(), // default auto(settings.external_booking_url)
});

/* S21 galleryGrid */
export const galleryGridSchema = z.object({
  variant: z.enum(['filtered', 'strip', 'video']),
  heading: loc.optional(),
  collections: z.array(z.enum(['rooms', 'treatments', 'details'])).optional(),
  video: mediaRef.optional(),
});

/* S22 statsBand (non-manual sources compute live; reviewCount ≥25) */
export const statsBandSchema = z.object({
  items: z.array(z.object({
    value: z.string().min(1),
    suffix: z.string().optional(),
    label: locReq,
    source: z.enum(['manual', 'yearsInBusiness', 'servicesCount', 'teamCount', 'reviewCount']),
  })).min(3).max(4),
  animate: z.boolean().default(true),
});

/* S23 checklist */
export const checklistSchema = z.object({
  variant: z.literal('standards').default('standards'),
  heading: locReq,
  items: z.array(z.object({ iconKey: iconKey.optional(), label: locReq })).min(4).max(8),
});

/* S24 treatmentSelector (questions/results derive from services tags) */
export const treatmentSelectorSchema = z.object({
  variant: z.enum(['inline', 'modal']),
  heading: loc.optional(),
  intro: loc.optional(),
});

/* S25 productGrid (GiftCardCommerce) */
export const productGridSchema = z.object({
  variant: z.enum(['denominations', 'treatments']),
  heading: loc.optional(),
  intro: loc.optional(),
  productRefs: z.array(ref).min(1),
});

/* S26 compact group */
export const packageGridSchema = z.object({
  heading: loc.optional(),
  refs: z.union([z.array(ref), z.literal('all')]),
});
export const comparisonTableSchema = z.object({
  heading: loc.optional(),
  packageRef: ref,
});
export const protectedNoticeSchema = z.object({
  variant: z.literal('seeDoctor'),
  body: locRichReq,
  locked: z.literal(true).default(true), // delete/reorder blocked in admin
});
export const reviewedBySchema = z.object({
  teamRef: ref,
  dateReviewed: z.string().min(1), // ISO date
});
export const articleHeroSchema = z.object({
  headline: locReq, // = seo.h1
  directAnswer: locRichReq, // renders as first paragraph (P-Gate-6)
  media: mediaRef.optional(),
});
export const tocSchema = z.object({ auto: z.literal(true).default(true) });
export const relatedLinksSchema = z.object({
  variant: z.enum(['conditions', 'services', 'resource', 'posts', 'crossCards', 'siblings', 'whoFor']),
  heading: loc.optional(),
  refs: z.array(ref).optional(),
  auto: z.boolean().optional(),
});
export const blogListSchema = z.object({
  featured: ref.optional(),
  perPage: z.number().int().positive().default(9),
});

/**
 * Canonical section registry: section-type key -> { code, schema }.
 * `claimsChecked` marks sections whose body copy must pass the wellness-claims
 * validator on save (Validation Rule 2).
 */
export const SECTION_SCHEMAS = {
  hero: { code: 'S01', schema: heroSchema },
  trustBar: { code: 'S02', schema: trustBarSchema },
  categoryGrid: { code: 'S03', schema: categoryGridSchema },
  serviceCards: { code: 'S04', schema: serviceCardsSchema },
  menuTable: { code: 'S05', schema: menuTableSchema },
  addOnsList: { code: 'S06', schema: addOnsListSchema },
  steps: { code: 'S07', schema: stepsSchema },
  iconGrid: { code: 'S08', schema: iconGridSchema, claimsChecked: true },
  featurePanel: { code: 'S09', schema: featurePanelSchema },
  promoStrip: { code: 'S10', schema: promoStripSchema },
  testimonials: { code: 'S11', schema: testimonialsSchema },
  teamGrid: { code: 'S12', schema: teamGridSchema },
  richText: { code: 'S13', schema: richTextSchema, claimsChecked: true },
  faq: { code: 'S14', schema: faqSchema },
  ctaBanner: { code: 'S15', schema: ctaBannerSchema },
  napHours: { code: 'S16', schema: napHoursSchema },
  mapBlock: { code: 'S17', schema: mapBlockSchema },
  contactForm: { code: 'S18', schema: contactFormSchema },
  bookingForm: { code: 'S19', schema: bookingFormSchema },
  altPaths: { code: 'S20', schema: altPathsSchema },
  galleryGrid: { code: 'S21', schema: galleryGridSchema },
  statsBand: { code: 'S22', schema: statsBandSchema },
  checklist: { code: 'S23', schema: checklistSchema },
  treatmentSelector: { code: 'S24', schema: treatmentSelectorSchema },
  productGrid: { code: 'S25', schema: productGridSchema },
  packageGrid: { code: 'S26a', schema: packageGridSchema },
  comparisonTable: { code: 'S26b', schema: comparisonTableSchema },
  protectedNotice: { code: 'S26c', schema: protectedNoticeSchema, claimsChecked: true },
  reviewedBy: { code: 'S26d', schema: reviewedBySchema },
  articleHero: { code: 'S26e', schema: articleHeroSchema },
  toc: { code: 'S26f', schema: tocSchema },
  relatedLinks: { code: 'S26g', schema: relatedLinksSchema },
  blogList: { code: 'S26h', schema: blogListSchema },
} as const;

export type SectionType = keyof typeof SECTION_SCHEMAS;
export const SECTION_TYPES = Object.keys(SECTION_SCHEMAS) as SectionType[];

/** Validate one section's data by its type key. */
export function validateSection(type: SectionType, data: unknown) {
  const entry = SECTION_SCHEMAS[type];
  if (!entry) return { success: false as const, error: `Unknown section type: ${type}` };
  return entry.schema.safeParse(data);
}
