import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';
import { getBaseUrlFromHost } from '@/lib/seo';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import { locales, type Locale } from '@/lib/i18n';
import { isBlogPostVisible } from '@/lib/blog';
import { getSEOPagesForSite } from '@/lib/seo-pages';
import { checkSiteRedirect } from '@/lib/redirects';

const CONTENT_DIR = path.join(process.cwd(), 'content');

const KNOWN_ROOT_DIRS = new Set(['pages', 'blog', 'blog-scheduled', '_history']);

async function listJsonSlugs(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace(/\.json$/, ''));
  } catch (error) {
    return [];
  }
}

/** Page JSON filenames that are not public routes (partials, drafts with no page.tsx). */
const PAGE_SLUG_DENYLIST = new Set(['faq']);

async function listPageSlugs(siteId: string, locale: Locale) {
  const pagesDir = path.join(CONTENT_DIR, siteId, locale, 'pages');
  const slugs = await listJsonSlugs(pagesDir);
  const excluded = /-(copy|new)$/;
  return slugs.filter((slug) => {
    if (slug === 'home' || excluded.test(slug)) return false;
    // e.g. services.layout.json → not a navigable URL
    if (slug.includes('.layout')) return false;
    if (PAGE_SLUG_DENYLIST.has(slug)) return false;
    return true;
  });
}

async function listBlogSlugs(siteId: string, locale: Locale) {
  const blogDir = path.join(CONTENT_DIR, siteId, locale, 'blog');
  try {
    const files = await fs.readdir(blogDir);
    const visible: string[] = [];
    for (const file of files.filter((entry) => entry.endsWith('.json'))) {
      const fullPath = path.join(blogDir, file);
      try {
        const raw = await fs.readFile(fullPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (isBlogPostVisible(parsed)) {
          visible.push(file.replace(/\.json$/, ''));
        }
      } catch {
        // ignore invalid blog JSON
      }
    }
    return visible;
  } catch (error) {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const site = (await getSiteByHost(host)) || (await getDefaultSite());

  if (!site) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  const siteLocales = site.supportedLocales?.length ? site.supportedLocales : locales;

  for (const locale of siteLocales) {
    // Home
    entries.push({
      url: new URL(`/${locale}`, baseUrl).toString(),
      lastModified: new Date(),
    });

    // Pages
    const pageSlugs = await listPageSlugs(site.id, locale);
    for (const slug of pageSlugs) {
      entries.push({
        url: new URL(`/${locale}/${slug}`, baseUrl).toString(),
        lastModified: new Date(),
      });
    }

    // Blog posts
    const blogSlugs = await listBlogSlugs(site.id, locale);
    for (const slug of blogSlugs) {
      entries.push({
        url: new URL(`/${locale}/blog/${slug}`, baseUrl).toString(),
        lastModified: new Date(),
      });
    }
  }

  // SEO pages: combine site_seo_pages registry with filesystem discovery.
  // For each locale, skip slugs that redirect or belong to a different locale.
  const seoPages = await getSEOPagesForSite(site.id);
  const hasNonAscii = /[^\x00-\x7F]/;
  for (const page of seoPages) {
    for (const locale of siteLocales) {
      // Skip if this slug redirects in this locale (e.g., old English slug in zh)
      if (checkSiteRedirect(site.id, locale, page.slug)) continue;
      // Skip non-ASCII slugs (e.g., Chinese) for non-matching locales
      if (hasNonAscii.test(page.slug) && locale !== 'zh') continue;
      entries.push({
        url: new URL(`/${locale}/${page.slug}`, baseUrl).toString(),
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: page.page_type === 'seo-local-landing' ? 0.9 : 0.8,
      });
    }
  }

  // Discover locale-specific SEO pages from filesystem (non-.json files in locale root,
  // e.g., Chinese-character slug files like 法拉盛中医针灸)
  for (const locale of siteLocales) {
    const localeRoot = path.join(CONTENT_DIR, site.id, locale);
    try {
      const dirEntries = await fs.readdir(localeRoot, { withFileTypes: true });
      for (const entry of dirEntries) {
        if (!entry.isFile()) continue;
        if (entry.name.endsWith('.json') || entry.name.includes('.')) continue;
        if (KNOWN_ROOT_DIRS.has(entry.name)) continue;
        entries.push({
          url: new URL(`/${locale}/${encodeURIComponent(entry.name)}`, baseUrl).toString(),
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        });
      }
    } catch {
      // locale dir may not exist
    }
  }

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
