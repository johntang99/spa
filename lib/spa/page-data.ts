// Shared loader for System S pages: resolves a page's JSON + layout + the collections
// its sections read, and builds the SectionCtx. Used by every Phase 1 route so each
// route file stays thin. Also exposes metadata from the page's seo object.
import { getRequestSiteId, loadContent, loadPageContent, loadSiteInfo } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/i18n';
import type { Catalog } from '@/lib/spa/catalog';
import type { SectionCtx } from '@/components/spa/sections';
import type { LayoutSection } from '@/components/spa/SectionRenderer';

export interface SpaPageBundle {
  page: Record<string, any> | null;
  layout: { sections?: LayoutSection[] } | null;
  ctx: SectionCtx;
}

export async function loadSpaPage(pageName: string, locale: Locale): Promise<SpaPageBundle> {
  const siteId = await getRequestSiteId();
  const [page, layout, catalog, testimonials, team, siteInfo] = await Promise.all([
    loadPageContent<Record<string, any>>(pageName, locale, siteId),
    loadPageContent<{ sections?: LayoutSection[] }>(`${pageName}.layout`, locale, siteId),
    loadContent<Catalog>(siteId, locale, 'collections/services.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/testimonials.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/team.json'),
    loadSiteInfo(siteId, locale),
  ]);
  const ctx: SectionCtx = {
    locale: (locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh',
    siteInfo: (siteInfo as Record<string, any>) || {},
    catalog: catalog || { categories: [], services: [], addons: [] },
    testimonials: testimonials?.items || [],
    team: team?.items || [],
  };
  return { page, layout, ctx };
}

export async function spaPageMetadata(pageName: string, locale: Locale, canonicalPath?: string) {
  const siteId = await getRequestSiteId();
  const page = await loadPageContent<any>(pageName, locale, siteId);
  return buildPageMetadata({
    siteId,
    locale,
    title: page?.seo?.title,
    description: page?.seo?.description,
    canonicalPath: canonicalPath || `/${locale}/${pageName}`,
  });
}
