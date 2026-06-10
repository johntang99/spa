import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { getRequestSiteId } from '@/lib/content';
import { fetchContentEntry } from '@/lib/contentDb';
import { checkSiteRedirect, getHreflangAlternates } from '@/lib/redirects';
import SEOLocalLandingLayout from '@/components/seo/SEOLocalLandingLayout';
import SEOConditionLayout from '@/components/seo/SEOConditionLayout';
import SEOResourceLayout from '@/components/seo/SEOResourceLayout';
import SEOServiceLayout from '@/components/seo/SEOServiceLayout';
import type { Metadata } from 'next';
import type { Locale } from '@/lib/types';
import { getBaseUrlFromRequest } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: { locale: Locale; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale } = params;
    // Next.js 14 may pass URL-encoded slugs — decode for DB lookup
    const slug = decodeURIComponent(params.slug);
    const siteId = await getRequestSiteId();

    // Check redirects first — skip metadata for redirected pages
    const redir = checkSiteRedirect(siteId, locale, slug);
    if (redir) return {};

    const entry = await fetchContentEntry(siteId, locale, slug);
    if (!entry?.data) return {};

    const content = entry.data as Record<string, any>;
    const alternates: Metadata['alternates'] = { canonical: content.seo?.canonicalUrl };

    const hreflang = getHreflangAlternates(siteId, locale, slug);
    if (hreflang) {
      alternates.languages = hreflang;
    }

    return {
      title: content.seo?.title,
      description: content.seo?.description,
      alternates,
      openGraph: {
        title: content.seo?.ogTitle ?? content.seo?.title,
        description: content.seo?.ogDescription ?? content.seo?.description,
      },
    };
  } catch {
    return {};
  }
}

export default async function SEOPage({ params }: Props) {
  const { locale } = params;
  // Next.js 14 may pass URL-encoded slugs — decode for DB lookup
  const slug = decodeURIComponent(params.slug);
  const siteId = await getRequestSiteId();

  // Check redirects BEFORE DB lookup — ensures redirect even if old DB entry exists
  const redir = checkSiteRedirect(siteId, locale, slug);
  if (redir) {
    // Encode non-ASCII characters for the HTTP Location header
    const encoded = redir.destination.split('/').map(encodeURIComponent).join('/');
    if (redir.permanent) permanentRedirect(encoded);
    else redirect(encoded);
  }

  const entry = await fetchContentEntry(siteId, locale, slug);

  if (!entry?.data) {
    notFound();
  }

  const content = entry.data as Record<string, any>;
  const base = getBaseUrlFromRequest();
  const siteBaseOrigin = `${base.protocol}//${base.host}`;

  switch (content.pageType) {
    case 'seo-local-landing':
      return <SEOLocalLandingLayout content={content} locale={locale} siteBaseOrigin={siteBaseOrigin} />;
    case 'seo-condition':
      return <SEOConditionLayout content={content} locale={locale} siteBaseOrigin={siteBaseOrigin} />;
    case 'seo-resource':
      return <SEOResourceLayout content={content} locale={locale} siteBaseOrigin={siteBaseOrigin} />;
    case 'seo-service':
      return <SEOServiceLayout content={content} locale={locale} siteBaseOrigin={siteBaseOrigin} />;
    default:
      notFound();
  }
}
