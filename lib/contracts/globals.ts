// System S — Global settings contracts (zod).
// Models the platform's actual per-locale settings files (site/header/footer/seo)
// plus the System S extensions from docs/SPA_CONTENT_CONTRACTS.md ARTIFACT 3
// (hours, campaigns, gbp, responsePromise, licenseLine...). Permissive (.passthrough)
// on legacy keys so existing platform fields validate during the transition.
import { z } from 'zod';
import { loc, locRich, mediaRef, cta } from './base';

export const hoursEntrySchema = z.object({
  days: z.array(z.number().int().min(0).max(6)),
  open: z.string(),  // "09:00"
  close: z.string(), // "21:00"
});

export const campaignSchema = z.object({
  id: z.string().min(1),
  activeFrom: z.string().min(1), // ISO date
  activeTo: z.string().min(1),
  headline: loc,
  subline: loc.optional(),
  cta,
  image: mediaRef,
  placement: z.array(z.enum(['hero', 'strip'])),
});

// site.json — accepts the platform's flat NAPE shape + optional System S extensions.
export const siteSettingsSchema = z.object({
  clinicName: z.string().min(1).optional(), // platform brand name field
  name: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  // System S extensions:
  hours: z.array(hoursEntrySchema).optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  timezone: z.string().optional(),
  languagesSpoken: z.array(z.string()).optional(),
  wechatId: z.string().optional(),
  wechatQr: mediaRef.optional(),
  externalBookingUrl: z.string().optional(),
  responsePromise: z.string().optional(),
  licenseLine: z.string().optional(),
  gbp: z.object({
    rating: z.number().optional(),
    reviewCount: z.number().int().optional(),
    lastSynced: z.string().optional(),
  }).optional(),
  campaigns: z.array(campaignSchema).optional(),
  yearsInBusiness: z.number().int().optional(),
  policies: z.object({
    cancellation: locRich.optional(),
    gratuity: locRich.optional(),
    arrival: locRich.optional(),
  }).optional(),
}).passthrough();

export const headerSettingsSchema = z.object({
  cta: z.object({ link: z.string(), text: z.string() }).optional(),
  menu: z.object({
    logo: z.record(z.string(), z.unknown()).optional(),
    items: z.array(z.object({ url: z.string(), text: z.string() })).optional(),
    variant: z.string().optional(),
  }).passthrough().optional(),
  topbar: z.record(z.string(), z.unknown()).optional(),
  languages: z.array(z.string()).optional(),
}).passthrough();

export const footerSettingsSchema = z.object({
  brand: z.record(z.string(), z.unknown()).optional(),
  hours: z.array(z.string()).optional(),
  contact: z.record(z.string(), z.unknown()).optional(),
  services: z.array(z.object({ url: z.string(), text: z.string() })).optional(),
  quickLinks: z.array(z.object({ url: z.string(), text: z.string() })).optional(),
  legalLinks: z.array(z.object({ url: z.string(), text: z.string() })).optional(),
  copyright: z.string().optional(),
}).passthrough();

export const GLOBAL_SCHEMAS = {
  'site.json': siteSettingsSchema,
  'header.json': headerSettingsSchema,
  'footer.json': footerSettingsSchema,
} as const;
