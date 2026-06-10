// Packages & Memberships (Phase 2C) — package grid (value math), membership panel,
// member-vs-regular comparison, FAQ, CTA. Stripe purchase DEFERRED; membership is inquiry.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('packages', params.locale);
}

export default async function PackagesPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('packages', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
