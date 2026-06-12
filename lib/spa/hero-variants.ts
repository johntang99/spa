// Hero variant catalogue — ported from the chinese-medicine platform, adapted to the
// spa's Jade Hour design. Shared by the renderer (components/spa/sections) and the admin
// editor (so the Hero variant field renders as a dropdown).

export const HERO_VARIANTS = [
  'centered',
  'split-photo-right',
  'split-photo-left',
  'photo-background',
  'photo-screenwide-top',
  'overlap',
  'video-background',
  'gallery-background',
  'gallery-screenwide-top',
] as const;

export type HeroVariant = (typeof HERO_VARIANTS)[number];

export const HERO_CONTENT_POSITIONS = ['center', 'center-below', 'left', 'left-below', 'lower'] as const;

// Older spa content used different variant names; map them onto the ported set so existing
// pages keep working without a content migration.
// Existing pages were authored when the variant value was ignored (always full-bleed), so
// map every legacy name to 'photo-background' to preserve their current look. New variants
// are opt-in via the admin dropdown.
const LEGACY: Record<string, HeroVariant> = {
  'full-bleed-image': 'photo-background',
  split: 'photo-background',
  story: 'photo-background',
  seasonal: 'photo-background',
};

/** Resolve a (possibly legacy/empty) variant value to a supported HeroVariant. */
export function resolveHeroVariant(value: unknown, hasMedia: boolean): HeroVariant {
  const v = typeof value === 'string' ? value : '';
  if ((HERO_VARIANTS as readonly string[]).includes(v)) return v as HeroVariant;
  if (LEGACY[v]) return LEGACY[v];
  return hasMedia ? 'photo-background' : 'centered';
}
