// Contact (Phase 1G) — NAP/hours, map, contact form (→ leads), mini FAQ. Via SectionRenderer.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('contact', params.locale);
}

export default async function ContactPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('contact', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
