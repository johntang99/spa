// System S content contracts — shared primitives (zod).
//
// LOCALE MODEL (0C decision): the platform stores content as SEPARATE per-locale
// files (content/<site>/en/*.json + zh/*.json). So a contract `loc` field validates
// ONE locale's value — a plain string. "loc completeness" (both locales present with
// matching structure) is enforced by the locale-parity validation rule, not by an
// inline { en, zh } object. `locRich` is markdown text, also a per-locale string.
import { z } from 'zod';

/** Locale-keyed text field (one locale's value in a per-locale file). */
export const loc = z.string();
/** Required locale text. */
export const locReq = z.string().min(1);
/** Rich (markdown) locale text. */
export const locRich = z.string();
export const locRichReq = z.string().min(1);

/** Media reference (admin media picker URL/ref). */
export const mediaRef = z.string();
/** Id reference into a collection. */
export const ref = z.string();
/** Icon key (line-icon registry). */
export const iconKey = z.string();
/** Slug. */
export const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case slug');

/** Call-to-action button. */
export const cta = z.object({
  label: locReq,
  href: z.string().min(1),
});
export const ctaOpt = cta.partial({ label: true, href: true }).optional();

/** Media block used by heroes / feature panels. */
export const mediaBlock = z.object({
  image: mediaRef,
  video: mediaRef.optional(),
  slides: z.array(mediaRef).optional(),
  scrim: z.number().int().min(0).max(60).optional(),
});

/** Helper: a section wrapper that carries a `variant` discriminator. */
export function withVariant<T extends z.ZodRawShape>(variants: readonly [string, ...string[]], shape: T) {
  return z.object({ variant: z.enum(variants), ...shape });
}

export type Loc = z.infer<typeof loc>;
export type Cta = z.infer<typeof cta>;
