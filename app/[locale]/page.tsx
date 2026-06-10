// Home route — System S section renderer (Phase 1B). Renders home.json + home.layout.json
// through the shared SectionRenderer, resolving live data from the seeded collections.
import { notFound } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadContent, loadPageContent, loadSiteInfo } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import SectionRenderer, { type LayoutSection } from '@/components/spa/SectionRenderer';
import type { Catalog } from '@/lib/spa/catalog';

interface PageProps {
  params: { locale: Locale };
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const page = await loadPageContent<any>('home', locale, siteId);
  return buildPageMetadata({
    siteId,
    locale,
    title: page?.seo?.title,
    description: page?.seo?.description,
    canonicalPath: `/${locale}`,
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const [page, layout, catalog, testimonials, team, siteInfo] = await Promise.all([
    loadPageContent<Record<string, any>>('home', locale, siteId),
    loadPageContent<{ sections?: LayoutSection[] }>('home.layout', locale, siteId),
    loadContent<Catalog>(siteId, locale, 'collections/services.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/testimonials.json'),
    loadContent<{ items: any[] }>(siteId, locale, 'collections/team.json'),
    loadSiteInfo(siteId, locale),
  ]);

  if (!page) notFound();

  const ctx = {
    locale: (locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh',
    siteInfo: (siteInfo as Record<string, any>) || {},
    catalog: catalog || { categories: [], services: [], addons: [] },
    testimonials: testimonials?.items || [],
    team: team?.items || [],
  };

  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
