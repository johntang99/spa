// Gift Cards (Phase 2B) — seasonal hero, denomination + treatment grids, how-it-works,
// corporate inquiry, FAQ, testimonials. Stripe checkout DEFERRED to pre-launch.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';

interface PageProps { params: { locale: Locale } }

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('gift-cards', params.locale);
}

export default async function GiftCardsPage({ params }: PageProps) {
  const { page, layout, ctx } = await loadSpaPage('gift-cards', params.locale);
  if (!page) notFound();
  return <SectionRenderer page={page} layout={layout} ctx={ctx} />;
}
