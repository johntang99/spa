// FAQ page (Phase 2G) — searchable accordion over all FAQs + CTA. Via SectionRenderer.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('faq', params.locale);
}

export default async function FaqPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('faq', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
