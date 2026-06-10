// Booking page (Phase 2A) — BookingForm (→ leads), trust column, altPaths, expect steps.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('book', params.locale);
}

export default async function BookPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('book', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
