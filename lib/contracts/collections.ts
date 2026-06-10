// System S — Collections contracts (zod).
// Source: docs/SPA_CONTENT_CONTRACTS.md COLLECTIONS CONTRACTS.
// Per-locale model: text fields validate one locale; numeric/structural fields are
// locale-invariant (duplicated across en/zh files, kept identical by parity checks).
import { z } from 'zod';
import { loc, locReq, locRich, locRichReq, mediaRef, ref, slug } from './base';
import { seoObjectSchema } from './seo';

/* ---------------- services (categories → services → tiers) ---------------- */
export const serviceTierSchema = z.object({
  minutes: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]),
  price: z.number().nonnegative(),
});

export const serviceCategorySchema = z.object({
  id: slug,
  name: locReq,
  intro: loc.optional(),
  image: mediaRef.optional(),
  order: z.number().int().default(0),
});

export const serviceSchema = z.object({
  id: slug,
  categoryId: ref,
  name: locReq,
  slug: z.string().min(1), // = seo page slug stem
  short: locReq,
  image: mediaRef,
  tiers: z.array(serviceTierSchema).min(1),
  addOnRefs: z.array(ref).optional(),
  badge: z.enum(['popular', 'new']).nullable().optional(),
  goalTags: z.array(z.string()).min(1), // TreatmentSelector
  intensity: z.number().int().min(1).max(3).optional(),
  specialistRefs: z.array(ref).optional(),
  relatedConditionRefs: z.array(ref).optional(),
  enabled: z.boolean(), // prune toggle
  order: z.number().int().default(0),
});

export const addonSchema = z.object({
  id: slug,
  name: locReq,
  price: z.number().nonnegative(),
  appliesTo: z.union([z.array(ref), z.literal('all')]),
});

/* ---------------- site_seo_pages ---------------- */
export const seoPageTypeEnum = z.enum([
  'seo-local-landing', 'seo-service', 'seo-condition', 'seo-resource', 'seo-near-location',
]);
export const siteSeoPageSchema = z.object({
  siteId: ref,
  slug: z.string().min(1),
  pageType: seoPageTypeEnum,
  serviceRef: ref.optional(),
  townSlug: z.string().optional(),
  sections: z.array(z.record(z.string(), z.unknown())), // ordered section stack per pageType
  seo: seoObjectSchema,
  published: z.boolean().default(false),
  publishedAt: z.string().optional(),
});

/* ---------------- team ---------------- */
export const teamMemberSchema = z.object({
  id: slug,
  name: z.string().min(1),
  photo: mediaRef,
  credential: z.string().min(1), // "NY LMT ..."
  years: z.number().int().nonnegative().optional(),
  specialties: z.array(ref).optional(),
  languages: z.array(z.string()).optional(),
  bio: locReq,
  order: z.number().int().default(0),
});

/* ---------------- testimonials ---------------- */
export const testimonialSchema = z.object({
  id: slug,
  quote: locReq, // renders only on matching locale (parity not required: at least one locale)
  author: z.string().min(1),
  categoryTag: z.string().min(1),
  serviceRef: ref.optional(),
  scopeTags: z.array(z.string()).optional(),
  source: z.enum(['google', 'yelp', 'in-spa', 'baam-review']),
  rating: z.number().int().min(1).max(5).optional(),
  date: z.string().optional(),
  featured: z.boolean().default(false),
});

/* ---------------- featured_experiences (exactly 6 active) ---------------- */
export const featuredExperienceSchema = z.object({
  id: slug,
  title: locReq,
  treatmentRef: ref,
  situation: locReq,
  outcome: locReq,
  photo: mediaRef,
  order: z.number().int().default(0),
});

/* ---------------- faqs ---------------- */
export const faqItemSchema = z.object({
  id: slug,
  question: locReq,
  answer: locRichReq,
  scopeTags: z.array(z.string()).min(1),
  order: z.number().int().default(0),
});

/* ---------------- gift_card_products ---------------- */
export const giftCardProductSchema = z.object({
  id: slug,
  type: z.enum(['denomination', 'treatment']),
  label: locReq,
  amount: z.number().nonnegative(),
  serviceRef: ref.optional(),
  image: mediaRef.optional(),
  stripeLink: z.string().url().optional(), // empty → button disabled + admin flag
  stripePriceId: z.string().optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

/* ---------------- packages ---------------- */
export const packageSchema = z.object({
  id: slug,
  name: locReq,
  kind: z.enum(['package', 'membership']),
  includes: z.array(z.object({ serviceRef: ref, tierMinutes: z.number().int() })).min(1),
  price: z.number().nonnegative(),
  valueTotal: z.number().nonnegative().optional(), // computed read-only
  perks: z.array(loc).optional(),
  purchaseMode: z.enum(['stripe', 'inquiry']), // membership locked to "inquiry" until Phase 5
  stripeLink: z.string().url().optional(),
  active: z.boolean().default(true),
}).refine((p) => p.kind !== 'membership' || p.purchaseMode === 'inquiry', {
  message: 'membership packages must use purchaseMode "inquiry" until Phase 5',
  path: ['purchaseMode'],
});

/* ---------------- leads (write-only from frontend) ---------------- */
export const leadSchema = z.object({
  type: z.enum(['booking', 'question', 'package', 'corporate-gifting']),
  // booking fields per S19 (optional except for booking type — enforced in API):
  service: z.string().optional(),
  durationTier: z.number().int().optional(),
  preferredDate: z.string().optional(),
  timeWindow: z.enum(['morning', 'afternoon', 'evening']).optional(),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  languagePref: z.enum(['en', 'zh']).optional(),
  therapistPref: ref.optional(),
  notes: z.string().optional(),
  message: z.string().optional(), // question type
  sourcePage: z.string().optional(),
  locale: z.enum(['en', 'zh']),
  utm: z.record(z.string(), z.string()).optional(),
  status: z.enum(['new', 'contacted', 'booked']).default('new'),
}).refine((l) => l.type !== 'booking' || (l.service && l.preferredDate && l.timeWindow), {
  message: 'booking leads require service, preferredDate, timeWindow',
});

/* ---------------- orders (webhook-only writes) ---------------- */
export const orderSchema = z.object({
  stripeSessionId: z.string().min(1), // idempotency key (unique)
  productRef: ref,
  amount: z.number().nonnegative(),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerLocale: z.enum(['en', 'zh']),
  certificateCode: z.string().min(1), // unique
  status: z.enum(['paid', 'fulfilled', 'redeemed']).default('paid'),
});

export const COLLECTION_SCHEMAS = {
  service_categories: serviceCategorySchema,
  services: serviceSchema,
  addons: addonSchema,
  site_seo_pages: siteSeoPageSchema,
  team: teamMemberSchema,
  testimonials: testimonialSchema,
  featured_experiences: featuredExperienceSchema,
  faqs: faqItemSchema,
  gift_card_products: giftCardProductSchema,
  packages: packageSchema,
  leads: leadSchema,
  orders: orderSchema,
} as const;

export type CollectionName = keyof typeof COLLECTION_SCHEMAS;
