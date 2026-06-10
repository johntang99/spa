import fs from 'fs/promises';
import path from 'path';
import { getDefaultFooter } from '../footer';
import { canUseContentDb, listContentEntries } from '@/lib/contentDb';
import { getBlogPostStatus } from '@/lib/blog';
import { getSEOPagesForSite } from '@/lib/seo-pages';

export interface ContentFileItem {
  id: string;
  label: string;
  path: string;
  scope: 'locale' | 'site';
  publishDate?: string;
  publishAt?: string;
  status?: 'draft' | 'scheduled' | 'published';
  groupKey?: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

function getBlogSlugFromPath(pathValue: string): string | null {
  if (pathValue.startsWith('blog/') && pathValue.endsWith('.json')) {
    return pathValue.replace(/^blog\//, '').replace(/\.json$/, '');
  }
  if (pathValue.startsWith('blog-scheduled/') && pathValue.endsWith('.json')) {
    return pathValue.replace(/^blog-scheduled\//, '').replace(/\.json$/, '');
  }
  return null;
}

function isScheduledBlogPath(pathValue: string): boolean {
  return pathValue.startsWith('blog-scheduled/');
}

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function shouldIncludeFilesystemFallback(): boolean {
  const override = parseBooleanEnv(process.env.CONTENT_WRITE_THROUGH_FILE);
  if (override !== null) return override;
  return process.env.NODE_ENV !== 'production';
}

// Known root-level .json files and directories — NOT SEO pages
const KNOWN_ROOT_FILES = new Set([
  'pages', 'blog', 'blog-scheduled', '_history',
]);

// SEO landing pages are stored at root level without .json extension
// (e.g., "acupuncture-middletown-ny"). They are NOT prefixed with pages/ or blog/.
function isSeoPagePath(filePath: string): boolean {
  return (
    !filePath.includes('/') &&
    !filePath.endsWith('.json') &&
    !KNOWN_ROOT_FILES.has(filePath) &&
    filePath.length > 0
  );
}

function slugifyGroupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferSeoGroupKeyFromSlug(pathValue: string): string {
  if (!pathValue) return 'default';
  const normalized = pathValue.toLowerCase();
  const parts = normalized.split('-');
  if (parts.length >= 2) {
    const maybeState = parts[parts.length - 1];
    const maybeCity = parts[parts.length - 2];
    if (/^[a-z]{2}$/.test(maybeState) && /^[a-z0-9]+$/.test(maybeCity)) {
      return `${maybeCity}-${maybeState}`;
    }
  }
  // Chinese slugs often start with location prefix (e.g., 法拉盛..., 大颈...)
  const chinesePrefixMatch = pathValue.match(/^([\u4e00-\u9fff]{2,4})/);
  if (chinesePrefixMatch?.[1]) {
    return slugifyGroupKey(chinesePrefixMatch[1]);
  }
  return 'default';
}

function inferSeoGroupKeyFromData(data: Record<string, any> | null | undefined, pathValue: string): string {
  const city = data?.location?.nap?.city || data?.location?.city || data?.city;
  const state = data?.location?.nap?.state || data?.location?.state || data?.state;
  if (typeof city === 'string' && city.trim()) {
    const cityKey = slugifyGroupKey(city);
    const stateKey =
      typeof state === 'string' && state.trim()
        ? slugifyGroupKey(state).slice(0, 2)
        : '';
    return stateKey ? `${cityKey}-${stateKey}` : cityKey;
  }
  return inferSeoGroupKeyFromSlug(pathValue);
}

async function ensureSeoFile(siteId: string, locale: string) {
  const seoPath = path.join(CONTENT_DIR, siteId, locale, 'seo.json');
  try {
    await fs.access(seoPath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(seoPath), { recursive: true });
      await fs.writeFile(
        seoPath,
        JSON.stringify(
          {
            title: '',
            description: '',
            ogImage: '',
            home: {
              title: '',
              description: '',
            },
            pages: {},
          },
          null,
          2
        )
      );
    } catch (writeError) {
      // ignore write failures (read-only environments)
    }
  }
}

async function ensureFooterFile(siteId: string, locale: string) {
  const footerPath = path.join(CONTENT_DIR, siteId, locale, 'footer.json');
  try {
    await fs.access(footerPath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(footerPath), { recursive: true });
      const footer = getDefaultFooter(locale as any);
      await fs.writeFile(footerPath, JSON.stringify(footer, null, 2));
    } catch (writeError) {
      // ignore write failures (read-only environments)
    }
  }
}

async function ensureHeaderFile(siteId: string, locale: string) {
  const headerPath = path.join(CONTENT_DIR, siteId, locale, 'header.json');
  try {
    await fs.access(headerPath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(headerPath), { recursive: true });
      const payload = {
        topbar: {
          phone: '',
          phoneHref: '',
          address: '',
          addressHref: '',
          hours: '',
          badge: '',
        },
        menu: {
          logo: {
            emoji: '',
            text: '',
            subtext: '',
            image: {
              src: '',
              alt: '',
            },
          },
          items: [],
        },
        languages: [],
        cta: {
          text: '',
          link: '',
        },
      };
      await fs.writeFile(headerPath, JSON.stringify(payload, null, 2));
    } catch (writeError) {
      // ignore write failures (read-only environments)
    }
  }
}

export async function listContentFiles(
  siteId: string,
  locale: string
): Promise<ContentFileItem[]> {
  const items: ContentFileItem[] = [];
  await ensureSeoFile(siteId, locale);
  await ensureFooterFile(siteId, locale);
  await ensureHeaderFile(siteId, locale);

  const addItem = (item: ContentFileItem) => {
    // Blog entries can appear from DB + filesystem sources. If the same slug exists in both
    // blog/ and blog-scheduled/, keep a single row in admin and prefer blog-scheduled/.
    const incomingBlogSlug = getBlogSlugFromPath(item.path);
    if (incomingBlogSlug) {
      const existingIndex = items.findIndex((entry) => {
        const existingBlogSlug = getBlogSlugFromPath(entry.path);
        return existingBlogSlug === incomingBlogSlug;
      });
      if (existingIndex >= 0) {
        const existing = items[existingIndex];
        if (!isScheduledBlogPath(existing.path) && isScheduledBlogPath(item.path)) {
          items[existingIndex] = item;
        }
        return;
      }
    }

    if (!items.some((entry) => entry.path === item.path)) {
      items.push(item);
    }
  };

  const dbEntries = await listContentEntries(siteId, locale);
  const allowFilesystemFallback =
    !canUseContentDb() || shouldIncludeFilesystemFallback();
  if (dbEntries.length > 0) {
    dbEntries.forEach((entry) => {
      // SEO landing pages: stored at root level without extension (e.g., "acupuncture-middletown-ny")
      if (isSeoPagePath(entry.path)) {
        const data = entry.data as Record<string, any> | null;
        addItem({
          id: `seo-page-${entry.path}`,
          label: `SEO Page: ${titleCase(entry.path)}`,
          path: entry.path,
          scope: 'locale',
          groupKey: inferSeoGroupKeyFromData(data, entry.path),
        });
        return;
      }

      if (entry.path.startsWith('pages/') && entry.path.endsWith('.json')) {
        const slug = entry.path.replace('pages/', '').replace('.json', '');
        addItem({
          id: `page-${slug}`,
          label: `Page: ${titleCase(slug)}`,
          path: entry.path,
          scope: 'locale',
        });
        return;
      }

      if (
        (entry.path.startsWith('blog/') || entry.path.startsWith('blog-scheduled/')) &&
        entry.path.endsWith('.json')
      ) {
        const slug = entry.path
          .replace(/^blog-scheduled\//, '')
          .replace(/^blog\//, '')
          .replace('.json', '');
        const data = entry.data as Record<string, any>;
        const title = typeof data?.title === 'string' ? data.title : '';
        const publishDate =
          typeof data?.publishDate === 'string' ? data.publishDate : '';
        const publishAt =
          typeof data?.publishAt === 'string' ? data.publishAt : '';
        addItem({
          id: `blog-${slug}`,
          label: `Blog Post: ${title || titleCase(slug)}`,
          path: entry.path,
          scope: 'locale',
          publishDate: publishDate || undefined,
          publishAt: publishAt || undefined,
          status: getBlogPostStatus(data),
        });
        return;
      }

      if (entry.path === 'navigation.json') {
        addItem({ id: 'navigation', label: 'Navigation', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'header.json') {
        addItem({ id: 'header', label: 'Header', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'seo.json') {
        addItem({ id: 'seo', label: 'SEO', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'footer.json') {
        addItem({ id: 'footer', label: 'Footer', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'site.json') {
        addItem({ id: 'site', label: 'Site Info', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'theme.json') {
        addItem({ id: 'theme', label: 'Theme', path: entry.path, scope: 'site' });
      }
    });
  }

  // Include SEO slugs registered in DB so they appear in admin Content
  // even before file-system sync.
  const seoRegistryEntries = await getSEOPagesForSite(siteId);
  seoRegistryEntries.forEach((entry) => {
    addItem({
      id: `seo-registry-${entry.slug}`,
      label: `SEO Page: ${titleCase(entry.slug)}`,
      path: entry.slug,
      scope: 'locale',
      groupKey: inferSeoGroupKeyFromSlug(entry.slug),
    });
  });

  // SEO landing pages: root-level files without .json extension
  if (allowFilesystemFallback) {
    const localeDir = path.join(CONTENT_DIR, siteId, locale);
    try {
      const allFiles = await fs.readdir(localeDir);
      for (const file of allFiles) {
        if (file.includes('.') || KNOWN_ROOT_FILES.has(file)) continue;
        const fullPath = path.join(localeDir, file);
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          // Verify it's valid JSON content
          try {
            const raw = await fs.readFile(fullPath, 'utf-8');
            const parsed = JSON.parse(raw);
            addItem({
              id: `seo-page-${file}`,
              label: `SEO Page: ${titleCase(file)}`,
              path: file,
              scope: 'locale',
              groupKey: inferSeoGroupKeyFromData(parsed as Record<string, any>, file),
            });
          } catch {
            // skip non-JSON files
          }
        }
      }
    } catch {
      // ignore missing locale directory
    }

    const pagesDir = path.join(CONTENT_DIR, siteId, locale, 'pages');
    try {
      const files = await fs.readdir(pagesDir);
      files
        .filter((file) => file.endsWith('.json'))
        .forEach((file) => {
          const slug = file.replace('.json', '');
          addItem({
            id: `page-${slug}`,
            label: `Page: ${titleCase(slug)}`,
            path: `pages/${file}`,
            scope: 'locale',
          });
        });
    } catch (error) {
      // ignore missing pages directory
    }

    for (const directory of ['blog', 'blog-scheduled'] as const) {
      const blogDir = path.join(CONTENT_DIR, siteId, locale, directory);
      try {
        const files = await fs.readdir(blogDir);
        await Promise.all(
          files
            .filter((file) => file.endsWith('.json'))
            .map(async (file) => {
              const slug = file.replace('.json', '');
              let title = '';
              let publishDate = '';
              let publishAt = '';
              let status: 'draft' | 'scheduled' | 'published' | undefined;
              try {
                const raw = await fs.readFile(path.join(blogDir, file), 'utf-8');
                const parsed = JSON.parse(raw);
                title = typeof parsed.title === 'string' ? parsed.title : '';
                publishDate =
                  typeof parsed.publishDate === 'string' ? parsed.publishDate : '';
                publishAt =
                  typeof parsed.publishAt === 'string' ? parsed.publishAt : '';
                status = getBlogPostStatus(parsed);
              } catch (error) {
                // ignore parse errors
              }
              addItem({
                id: `${directory}-${slug}`,
                label: `Blog Post: ${title || titleCase(slug)}`,
                path: `${directory}/${file}`,
                scope: 'locale',
                publishDate: publishDate || undefined,
                publishAt: publishAt || undefined,
                status,
              });
            })
        );
      } catch (error) {
        // ignore missing blog directory
      }
    }
  }

  addItem({
    id: 'navigation',
    label: 'Navigation',
    path: 'navigation.json',
    scope: 'locale',
  });
  addItem({
    id: 'header',
    label: 'Header',
    path: 'header.json',
    scope: 'locale',
  });
  addItem({
    id: 'seo',
    label: 'SEO',
    path: 'seo.json',
    scope: 'locale',
  });
  addItem({
    id: 'footer',
    label: 'Footer',
    path: 'footer.json',
    scope: 'locale',
  });
  addItem({
    id: 'site',
    label: 'Site Info',
    path: 'site.json',
    scope: 'locale',
  });
  addItem({
    id: 'theme',
    label: 'Theme',
    path: 'theme.json',
    scope: 'site',
  });

  return items;
}

export function resolveContentPath(siteId: string, locale: string, filePath: string) {
  if (filePath === 'theme.json') {
    return path.join(CONTENT_DIR, siteId, 'theme.json');
  }

  if (filePath === 'navigation.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'navigation.json');
  }

  if (filePath === 'header.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'header.json');
  }

  if (filePath === 'site.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'site.json');
  }

  if (filePath === 'seo.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'seo.json');
  }

  if (filePath === 'footer.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'footer.json');
  }

  if (filePath.startsWith('pages/')) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  if (filePath.startsWith('blog/') || filePath.startsWith('blog-scheduled/')) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  // SEO landing pages: root-level files without extension (e.g., "acupuncture-middletown-ny")
  if (isSeoPagePath(filePath)) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  return null;
}
