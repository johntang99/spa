// System S — SEO object (embedded in every page JSON + every site_seo_pages row).
// Sitemap + head metadata + hreflang generation read EXCLUSIVELY from this object.
import { z } from 'zod';
import { loc, locReq, mediaRef } from './base';

export const changefreqEnum = z.enum([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]);

export const seoObjectSchema = z.object({
  title: locReq.refine((s) => s.length <= 60, { message: 'title ≤ 60 chars' }),
  description: locReq.refine((s) => s.length <= 155, { message: 'description ≤ 155 chars' }),
  h1: locReq,
  canonicalUrl: z.string().min(1), // locale-relative
  schema: z.array(z.string()).min(1),
  keywords: z.array(z.string()).min(1),
  ogTitle: loc.optional(),
  ogDescription: loc.optional(),
  ogImage: mediaRef.optional(),
  noindex: z.boolean().default(false),
  changefreq: changefreqEnum.optional(),
  priority: z.number().min(0).max(1).optional(),
  keywordCluster: z.string().min(1), // maps to A3 Master Keyword Map row
  pageType: z.string().min(1),
});

export type SeoObject = z.infer<typeof seoObjectSchema>;
