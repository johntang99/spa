// Dynamic SEO renderer (Phase 1H/1I) — resolves /[locale]/[slug] against the seeded
// site_seo_pages content (seo-pages/<slug>.json), builds the section stack by pageType,
// and renders via the shared SectionRenderer. Emits head metadata + hreflang from the
// page's seo object. 404 on unknown/unpublished. Honors redirects.
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getRequestSiteId, loadContent } from '@/lib/content';
import { checkSiteRedirect } from '@/lib/redirects';
import { getBaseUrlFromRequest } from '@/lib/seo';
import { locales, type Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaContext } from '@/lib/spa/page-data';
import { buildSeoPage } from '@/lib/spa/seo-page';

export const dynamic = 'force-dynamic';

interface Props { params: { locale: Locale; slug: string } }

async function loadSeoEntry(locale: Locale, slug: string) {
  const siteId = await getRequestSiteId();
  return loadContent<any>(siteId, locale, `seo-pages/${slug}.json`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const content = await loadSeoEntry(params.locale, slug);
  if (!content?.seo) return {};
  const base = getBaseUrlFromRequest();
  const canonical = new URL(`/${params.locale}/${slug}`, base).toString();
  const languages = locales.reduce<Record<string, string>>((acc, l) => {
    acc[l] = new URL(`/${l}/${slug}`, base).toString();
    return acc;
  }, {});
  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: { canonical, languages: { ...languages, 'x-default': new URL(`/en/${slug}`, base).toString() } },
    robots: content.seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: content.seo.ogTitle ?? content.seo.title,
      description: content.seo.ogDescription ?? content.seo.description,
      url: canonical,
    },
  };
}

export default async function SEOPage({ params }: Props) {
  const { locale } = params;
  const slug = decodeURIComponent(params.slug);
  const siteId = await getRequestSiteId();

  const redir = checkSiteRedirect(siteId, locale, slug);
  if (redir) {
    const encoded = redir.destination.split('/').map(encodeURIComponent).join('/');
    if (redir.permanent) permanentRedirect(encoded);
    else redirect(encoded);
  }

  const content = await loadSeoEntry(locale, slug);
  if (!content || content.published === false) notFound();

  const ctx = await loadSpaContext(locale);
  const { page, layout } = buildSeoPage(content, ctx);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': content.pageType === 'seo-condition' ? 'WebPage' : 'Service',
            name: content.seo?.h1,
            areaServed: 'Middletown, NY',
          }),
        }}
      />
      <SectionRenderer page={page} layout={layout} ctx={ctx} />
    </>
  );
}
