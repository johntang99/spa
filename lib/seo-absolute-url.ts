/** Safe to import from client components (no next/headers). */

/** Google BreadcrumbList requires absolute URLs in each ListItem `item`. */
export function absoluteUrlFromSiteOrigin(siteOrigin: string, pathname: string): string {
  const origin = siteOrigin.replace(/\/$/, '');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, `${origin}/`).toString();
}

/** Content `canonicalUrl` may be relative (/en/slug) or absolute. */
export function resolveSeoCanonicalToAbsoluteUrl(siteOrigin: string, canonicalUrl: string): string {
  const trimmed = (canonicalUrl || '').trim();
  if (!trimmed) {
    return absoluteUrlFromSiteOrigin(siteOrigin, '/');
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return absoluteUrlFromSiteOrigin(siteOrigin, trimmed);
}
