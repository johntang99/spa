import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { loadAllItems, loadSiteInfo } from '@/lib/content';
import { getBaseUrlFromHost } from '@/lib/seo';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import { defaultLocale, locales } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type Locale = (typeof locales)[number];
type NamedItem = { slug?: string; title?: string; name?: string };

const CONTENT_DIR = path.join(process.cwd(), 'content');

function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function cleanSingleLine(value: string): string {
  return value.replace(/\s*\n\s*/g, ' ').trim();
}

async function listJsonSlugs(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function inferDisplayName(siteInfo: Record<string, unknown> | null, fallback: string): string {
  const candidates = [
    siteInfo?.businessName,
    siteInfo?.clinicName,
    siteInfo?.name,
    siteInfo?.companyName,
  ];
  for (const entry of candidates) {
    if (isNonEmptyString(entry)) return entry.trim();
  }
  return fallback;
}

function inferAddress(siteInfo: Record<string, unknown> | null): string {
  if (!siteInfo) return '';
  const direct = siteInfo.address;
  if (isNonEmptyString(direct)) return direct.trim();
  if (direct && typeof direct === 'object') {
    const obj = direct as Record<string, unknown>;
    const parts = [obj.street, obj.city, obj.state, obj.zip, obj.country].filter(isNonEmptyString);
    if (parts.length > 0) return parts.join(', ');
  }
  const parts = [siteInfo.city, siteInfo.state, siteInfo.zip].filter(isNonEmptyString);
  return parts.join(', ');
}

export async function GET(): Promise<Response> {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const site = (await getSiteByHost(host)) || (await getDefaultSite());
  if (!site) return new Response('', { status: 404 });

  const siteLocales = (site.supportedLocales?.length ? site.supportedLocales : locales).filter((entry): entry is Locale =>
    isLocale(entry)
  );
  const locale = isLocale(site.defaultLocale) ? site.defaultLocale : siteLocales[0] || defaultLocale;

  const [rawSiteInfo, pageSlugsRaw, serviceFileSlugs, blogFileSlugs, locationFileSlugs, landingFileSlugs, localSeoFileSlugs] =
    await Promise.all([
      loadSiteInfo(site.id, locale).catch(() => null) as Promise<Record<string, unknown> | null>,
      listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'pages')),
      listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'services')),
      listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'blog')),
      listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'locations')),
      listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'landing')),
      listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'local-seo')),
    ]);

  const [serviceItems, blogItems, locationItems] = await Promise.all([
    loadAllItems<NamedItem>(site.id, locale, 'services').catch(() => []),
    loadAllItems<NamedItem>(site.id, locale, 'blog').catch(() => []),
    loadAllItems<NamedItem>(site.id, locale, 'locations').catch(() => []),
  ]);

  const pageSlugs = unique(
    pageSlugsRaw.filter((slug) => {
      if (slug === 'home') return false;
      if (slug.endsWith('.layout')) return false;
      if (slug.endsWith('-copy') || slug.endsWith('-new')) return false;
      if (slug === 'components-preview') return false;
      return true;
    })
  );

  const serviceSlugs = unique([
    ...serviceFileSlugs,
    ...serviceItems.map((item) => item.slug).filter(isNonEmptyString),
  ]);
  const blogSlugs = unique([
    ...blogFileSlugs,
    ...blogItems.map((item) => item.slug).filter(isNonEmptyString),
  ]);
  const locationSlugs = unique([
    ...locationFileSlugs,
    ...locationItems.map((item) => item.slug).filter(isNonEmptyString),
  ]);
  const seoSlugs = unique([...landingFileSlugs, ...localSeoFileSlugs]);

  const displayName = inferDisplayName(rawSiteInfo, site.name || site.id);
  const lines: string[] = [`# ${displayName}`];

  const description = isNonEmptyString(rawSiteInfo?.description) ? cleanSingleLine(rawSiteInfo.description) : '';
  if (description) lines.push('', `> ${description}`);
  const tagline = isNonEmptyString(rawSiteInfo?.tagline) ? cleanSingleLine(rawSiteInfo.tagline) : '';
  if (tagline) lines.push('', `Tagline: ${tagline}`);

  const contact: string[] = [];
  if (isNonEmptyString(rawSiteInfo?.phone)) contact.push(`- Phone: ${rawSiteInfo.phone}`);
  if (isNonEmptyString(rawSiteInfo?.email)) contact.push(`- Email: ${rawSiteInfo.email}`);
  const address = inferAddress(rawSiteInfo);
  if (address) contact.push(`- Address: ${address}`);
  if (contact.length > 0) lines.push('', '## Contact', ...contact);

  lines.push('', '## Key pages', `- [Home](${new URL(`/${locale}`, baseUrl).toString()})`);
  for (const slug of pageSlugs.slice(0, 20)) {
    lines.push(`- [${titleFromSlug(slug)}](${new URL(`/${locale}/${slug}`, baseUrl).toString()})`);
  }

  if (serviceSlugs.length > 0) {
    lines.push('', '## Services');
    for (const slug of serviceSlugs.slice(0, 25)) {
      lines.push(`- [${titleFromSlug(slug)}](${new URL(`/${locale}/services/${slug}`, baseUrl).toString()})`);
    }
  }

  if (blogSlugs.length > 0) {
    lines.push('', '## Articles');
    for (const slug of blogSlugs.slice(0, 25)) {
      lines.push(`- [${titleFromSlug(slug)}](${new URL(`/${locale}/blog/${slug}`, baseUrl).toString()})`);
    }
  }

  if (locationSlugs.length > 0) {
    lines.push('', '## Locations');
    for (const slug of locationSlugs.slice(0, 20)) {
      lines.push(`- [${titleFromSlug(slug)}](${new URL(`/${locale}/locations/${slug}`, baseUrl).toString()})`);
    }
  }

  if (seoSlugs.length > 0) {
    lines.push('', '## SEO pages');
    for (const slug of seoSlugs.slice(0, 25)) {
      lines.push(`- [${slug}](${new URL(`/${locale}/${slug}`, baseUrl).toString()})`);
    }
  }

  lines.push(
    '',
    '## Site',
    `- Sitemap: ${new URL('/sitemap.xml', baseUrl).toString()}`,
    `- Robots: ${new URL('/robots.txt', baseUrl).toString()}`,
    `- Languages: ${(siteLocales.length > 0 ? siteLocales : [locale]).join(', ')}`,
    '- Private paths excluded from crawling: /admin, /api'
  );

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
