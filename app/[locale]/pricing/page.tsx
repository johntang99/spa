// Pricing / menu (Phase 1E) — the signature dot-leader menu. Via SectionRenderer.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('pricing', params.locale);
}

export default async function PricingPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('pricing', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
