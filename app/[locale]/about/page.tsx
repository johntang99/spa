// About (Phase 1F) — story, stats, team, standards, space, values, testimonials, CTA. Via SectionRenderer.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('about', params.locale);
}

export default async function AboutPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('about', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
