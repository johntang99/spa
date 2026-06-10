// Services hub (Phase 1C) — hero, category panels, TreatmentSelector, CTA — via SectionRenderer.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('services', params.locale);
}

export default async function ServicesPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('services', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
