import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getSiteByHost } from '@/lib/sites';
import { fetchLandingPage } from '@/lib/landingPagesDb';
import LandingPageRenderer from '@/components/landing-page/LandingPageRenderer';
import type { LandingPageJsonV2 } from '@/lib/landingPageTypes';

export const dynamic = 'force-dynamic';

type Params = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  return {
    title: `Landing Page · ${slug}`,
    robots: { index: true, follow: true },
  };
}

export default async function LandingPagePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;

  const host = (await headers()).get('host');
  const site = await getSiteByHost(host);
  if (!site) notFound();

  const language = locale === 'zh' ? 'zh' : 'en';
  const lp = await fetchLandingPage(site.id, slug, language);
  if (!lp) notFound();

  return (
    <LandingPageRenderer
      lp={lp.content as LandingPageJsonV2}
      slug={slug}
      locale={language}
    />
  );
}
