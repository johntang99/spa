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
  const nextPage = { ...page } as Record<string, any>;
  const nextLayout = {
    sections: [...(layout?.sections || [])],
  };

  const hasAddons = Array.isArray(ctx.catalog?.addons) && ctx.catalog.addons.length > 0;
  const hasAddOnsSection = nextLayout.sections.some((section) => section.id === 'addOnsList');
  if (hasAddons) {
    if (!nextPage.addOnsList) {
      nextPage.addOnsList = {
        variant: 'full',
        heading: params.locale === 'zh' ? '附加项目' : 'Add-ons',
      };
    }
    if (!hasAddOnsSection) {
      const categoryIndex = nextLayout.sections.findIndex(
        (section) => section.id === 'categoryGrid'
      );
      const insertIndex = categoryIndex >= 0 ? categoryIndex + 1 : nextLayout.sections.length;
      nextLayout.sections.splice(insertIndex, 0, {
        id: 'addOnsList',
        mode: 'well',
      });
    }
  }

  return <SectionRenderer page={nextPage} layout={nextLayout} ctx={ctx} />;
}
