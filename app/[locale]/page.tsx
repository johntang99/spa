// Home route — System S section renderer (Phase 1B). Renders home.json + home.layout.json
// through the shared SectionRenderer, resolving live data from the seeded collections.
import { notFound } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps {
  params: { locale: Locale };
}

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('home', params.locale, `/${params.locale}`);
}

export default async function HomePage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('home', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
