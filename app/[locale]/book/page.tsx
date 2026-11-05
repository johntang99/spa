// Booking page — when the site uses an external scheduler (Setmore), send
// every /book visit there. Otherwise keep the in-app booking form.
import { notFound, redirect } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';
import { isExternalBookingUrl } from '@/lib/spa/booking-url';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('book', params.locale);
}

export default async function BookPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('book', params.locale);
  if (!page) notFound();

  const external = (ctx.siteInfo as { externalBookingUrl?: string } | null)?.externalBookingUrl;
  if (isExternalBookingUrl(external)) {
    redirect(external!.trim());
  }

  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
