/**
 * Where "Book Now" goes for a spa site.
 *
 * When site.json sets `externalBookingUrl` (Setmore, etc.), every booking CTA
 * uses that address. Otherwise the in-app form at `/{locale}/book` is used.
 */

export function isExternalBookingUrl(url?: string | null): boolean {
  const value = (url || '').trim();
  return /^https?:\/\//i.test(value);
}

export function resolveBookingUrl(
  externalBookingUrl: string | null | undefined,
  locale: string,
  path = 'book'
): string {
  const external = (externalBookingUrl || '').trim();
  if (isExternalBookingUrl(external)) return external;
  return `/${locale}/${path.replace(/^\//, '')}`;
}

/** Prefer an absolute scheduler URL when present; otherwise keep the given href. */
export function bookingHrefOrFallback(
  externalBookingUrl: string | null | undefined,
  fallbackHref: string
): string {
  const external = (externalBookingUrl || '').trim();
  if (isExternalBookingUrl(external)) return external;
  return fallbackHref;
}
