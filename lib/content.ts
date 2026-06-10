// ============================================
// CONTENT LOADING UTILITIES
// ============================================

import { Locale, SeoConfig } from './types';
import { headers } from 'next/headers';
import { getDefaultSite, getSiteByHost } from './sites';
import fs from 'fs';
import path from 'path';
import { defaultLocale } from './i18n';
import {
  canUseContentDb,
  fetchContentEntry,
  fetchThemeEntry,
  listContentEntriesByPrefix,
} from './contentDb';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const SITES_CONFIG_PATH = path.join(CONTENT_DIR, '_sites.json');

async function getLocalDefaultSiteId(): Promise<string | null> {
  try {
    const raw = await fs.promises.readFile(SITES_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as {
      sites?: Array<{ id?: string; enabled?: boolean }>;
    };
    const sites = Array.isArray(parsed.sites) ? parsed.sites : [];
    const firstEnabled = sites.find((site) => site.enabled !== false && site.id);
    return firstEnabled?.id ?? sites[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function resolveSiteId(siteId?: string): Promise<string> {
  if (siteId) return siteId;
  try {
    const host = headers().get('host');
    const normalizedHost = (host || '').toLowerCase();
    if (!host) {
      const localSiteId = await getLocalDefaultSiteId();
      if (localSiteId) return localSiteId;
    }
    const isLocalHost =
      normalizedHost.includes('localhost') ||
      normalizedHost.startsWith('127.0.0.1') ||
      normalizedHost.startsWith('0.0.0.0');

    if (isLocalHost) {
      const localSiteId = await getLocalDefaultSiteId();
      if (localSiteId) return localSiteId;
    }

    const site = await getSiteByHost(host);
    if (site?.id) return site.id;
    const defaultSite = await getDefaultSite();
    return defaultSite?.id || process.env.NEXT_PUBLIC_DEFAULT_SITE || 'default-site';
  } catch (error) {
    const localSiteId = await getLocalDefaultSiteId();
    if (localSiteId) return localSiteId;
    const defaultSite = await getDefaultSite();
    return defaultSite?.id || process.env.NEXT_PUBLIC_DEFAULT_SITE || 'default-site';
  }
}

export async function getRequestSiteId(): Promise<string> {
  return resolveSiteId();
}

/**
 * Generic function to load JSON content
 */
export async function loadContent<T>(
  siteId: string,
  locale: Locale,
  contentPath: string
): Promise<T | null> {
  if (canUseContentDb()) {
    const entry = await fetchContentEntry(siteId, locale, contentPath);
    if (entry?.data) {
      return entry.data as T;
    }
  }

  try {
    const filePath = path.join(CONTENT_DIR, siteId, locale, contentPath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Content file not found: ${filePath}`);
      return null;
    }
    
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading content from ${contentPath}:`, error);
    return null;
  }
}

/**
 * Load page content
 */
export async function loadPageContent<T>(
  pageName: string,
  locale: Locale,
  siteId?: string
): Promise<T | null> {
  const resolvedSiteId = await resolveSiteId(siteId);
  return loadContent<T>(resolvedSiteId, locale, `pages/${pageName}.json`);
}

/**
 * Load site info
 */
export async function loadSiteInfo(siteId: string, locale: Locale) {
  return loadContent(siteId, locale, 'site.json');
}

/**
 * Load navigation
 */
export async function loadNavigation(siteId: string, locale: Locale) {
  return loadContent(siteId, locale, 'navigation.json');
}

/**
 * Load theme config
 */
export async function loadTheme(siteId: string) {
  if (canUseContentDb()) {
    // Theme is site-wide, so always resolve from canonical locale row.
    const entry = await fetchThemeEntry(siteId, defaultLocale);
    if (entry?.data) {
      return entry.data;
    }
  }

  try {
    const filePath = path.join(CONTENT_DIR, siteId, 'theme.json');

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading theme:', error);
    return null;
  }
}

/**
 * Load SEO config
 */
export async function loadSeo(siteId: string, locale: Locale): Promise<SeoConfig | null> {
  return loadContent(siteId, locale, 'seo.json');
}

/**
 * Load footer config
 */
export async function loadFooter<T>(siteId: string, locale: Locale): Promise<T | null> {
  return loadContent<T>(siteId, locale, 'footer.json');
}

/**
 * Load all items from a directory (e.g., blog posts, services)
 */
export async function loadAllItems<T>(
  siteId: string | undefined,
  locale: Locale,
  directory: string
): Promise<T[]> {
  if (canUseContentDb()) {
    const resolvedSiteId = await resolveSiteId(siteId);
    const entries = await listContentEntriesByPrefix(
      resolvedSiteId,
      locale,
      `${directory}/`
    );
    return entries.map((entry) => entry.data as T);
  }

  try {
    const resolvedSiteId = await resolveSiteId(siteId);
    const dirPath = path.join(CONTENT_DIR, resolvedSiteId, locale, directory);
    
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    const files = await fs.promises.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
      })
    );
    
    return items;
  } catch (error) {
    console.error(`Error loading items from ${directory}:`, error);
    return [];
  }
}

/**
 * Load single item by slug
 */
export async function loadItemBySlug<T>(
  siteId: string | undefined,
  locale: Locale,
  directory: string,
  slug: string
): Promise<T | null> {
  const resolvedSiteId = await resolveSiteId(siteId);
  return loadContent<T>(resolvedSiteId, locale, `${directory}/${slug}.json`);
}

/**
 * Check if content exists
 */
export function contentExists(
  siteId: string,
  locale: Locale,
  contentPath: string
): boolean {
  const filePath = path.join(CONTENT_DIR, siteId, locale, contentPath);
  return fs.existsSync(filePath);
}

/**
 * Get content file path (for admin use)
 */
export function getContentFilePath(
  siteId: string,
  locale: Locale,
  contentPath: string
): string {
  return path.join(CONTENT_DIR, siteId, locale, contentPath);
}
