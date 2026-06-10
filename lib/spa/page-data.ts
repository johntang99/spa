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

/** Load just the SectionCtx (collections + site info) — for routes that build their
 *  own sections (e.g. /services/[category], dynamic SEO pages). */
export async function loadSpaContext(locale: Locale): Promise<SectionCtx> {
  const siteId = await getRequestSiteId();
  const [catalog, testimonials, team, faqs, packages, giftCards, siteInfo] = await Promise.all([
    loadContent<Catalog>(siteId, locale, 'collections/services.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/testimonials.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/team.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/faqs.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/packages.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/gift-cards.json'),
    loadSiteInfo(siteId, locale),
  ]);
  return {
    locale: (locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh',
    siteInfo: (siteInfo as Record<string, any>) || {},
    catalog: catalog || { categories: [], services: [], addons: [] },
    testimonials: testimonials?.items || [],
    team: team?.items || [],
    faqs: faqs?.items || [],
    packages: packages?.items || [],
    giftCards: giftCards?.items || [],
  };
}

export async function loadSpaPage(pageName: string, locale: Locale): Promise<SpaPageBundle> {
  const siteId = await getRequestSiteId();
  const [page, layout, ctx] = await Promise.all([
    loadPageContent<Record<string, any>>(pageName, locale, siteId),
    loadPageContent<{ sections?: LayoutSection[] }>(`${pageName}.layout`, locale, siteId),
    loadSpaContext(locale),
  ]);
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
