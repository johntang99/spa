// Category template (Phase 1D) — dynamic /services/[category] over the catalog.
// Sections are generated from the category + collections (no per-category JSON needed):
// hero → serviceCards(category) → faq(scoped) → conditionLinks → testimonials(tag) → cta.
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import SectionRenderer, { type LayoutSection } from '@/components/spa/SectionRenderer';
import { loadSpaContext } from '@/lib/spa/page-data';
import { servicesInCategory, type Catalog } from '@/lib/spa/catalog';

interface PageProps { params: { locale: Locale; category: string } }

// FAQ scope per category (faqs collection uses these tags).
const FAQ_SCOPE: Record<string, string> = {
  massage: 'massage', 'foot-reflexology': 'foot', 'east-asian-therapies': 'cupping',
  facials: 'facial', 'body-treatments': 'general',
};

export async function generateStaticParams() {
  // Category ids are stable across locales; emit the 5 treatment categories per locale.
  const cats = ['massage', 'foot-reflexology', 'east-asian-therapies', 'acupuncture', 'facials', 'body-treatments'];
  return locales.flatMap((locale) => cats.map((category) => ({ locale, category })));
}

async function getCatalog(locale: Locale): Promise<Catalog | null> {
  const siteId = await getRequestSiteId();
  return loadContent<Catalog>(siteId, locale, 'collections/services.json');
}

export async function generateMetadata({ params }: PageProps) {
  const catalog = await getCatalog(params.locale);
  const cat = catalog?.categories.find((c) => c.id === params.category);
  const siteId = await getRequestSiteId();
  if (!cat) return {};
  return buildPageMetadata({
    siteId,
    locale: params.locale,
    title: `${cat.name} | Spa Paradise Middletown`,
    description: cat.intro,
    canonicalPath: `/${params.locale}/services/${params.category}`,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, category } = params;
  const tr = (en: string, zh: string, es: string) =>
    locale === 'zh' ? zh : locale === 'es' ? es : en;
  const ctx = await loadSpaContext(locale);
  const cat = ctx.catalog.categories.find((c) => c.id === category);
  if (!cat) notFound();

  const svcs = servicesInCategory(ctx.catalog, category);
  // Related condition pages: unique relatedConditionRefs across the category's services.
  const conditionSlugs = Array.from(
    new Set(svcs.flatMap((s: any) => (s.relatedConditionRefs || []) as string[]))
  );

  const page: Record<string, any> = {
    hero: {
      variant: 'split',
      eyebrow: tr('Services', '护理项目', 'Servicios'),
      headline: cat.name,
      subline: cat.intro,
      ctaPrimary: { label: tr('Book Now', '立即预约', 'Reservar ahora'), href: '/book' },
      ctaSecondary: { label: tr('See pricing', '查看价格', 'Ver precios'), href: '/pricing' },
      media: { image: cat.image || '', scrim: 45 },
    },
    serviceCards: {
      variant: 'grid',
      heading: locale === 'zh' ? `${cat.name}护理` : locale === 'es' ? `Tratamientos de ${cat.name}` : `${cat.name} treatments`,
      source: { mode: 'category', category },
      showTierChips: true,
      bookCta: true,
    },
    faq: { variant: 'accordion', heading: tr('Common questions', '常见问题', 'Preguntas frecuentes'), source: { scopeTag: FAQ_SCOPE[category] || 'general' } },
    conditionLinks: conditionSlugs.length
      ? { variant: 'conditions', heading: tr('Related conditions', '相关调理', 'Condiciones relacionadas'), refs: conditionSlugs }
      : undefined,
    testimonials: { variant: 'carousel', heading: tr('What guests say', '客人评价', 'Lo que dicen los clientes'), filter: { categoryTag: category, limit: 3 }, showSource: true },
    ctaBanner: {
      variant: 'solid-token',
      heading: tr('Booking takes a minute.', '预约只需一分钟。', 'Reservar toma un minuto.'),
      ctaPrimary: { label: tr('Book Now', '立即预约', 'Reservar ahora'), href: '/book' },
    },
  };

  const layout: { sections: LayoutSection[] } = {
    sections: [
      { id: 'hero', mode: 'dark' },
      { id: 'serviceCards', mode: 'light' },
      { id: 'faq', mode: 'well' },
      ...(conditionSlugs.length ? [{ id: 'conditionLinks', mode: 'light' as const }] : []),
      { id: 'testimonials', mode: 'light' },
      { id: 'ctaBanner', mode: 'dark' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Services', item: `/${locale}/services` },
              { '@type': 'ListItem', position: 2, name: cat.name, item: `/${locale}/services/${category}` },
            ],
          }),
        }}
      />
      <SectionRenderer page={page} layout={layout} ctx={{ ...ctx, categoryId: category }} />
    </>
  );
}
