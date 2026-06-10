// Builds a System S SEO page's section stack by pageType from the registry row
// (pageType, serviceRef, seo) + collections — so the dynamic [slug] route renders
// rich pages without per-page section authoring. Bodies (whatItIs/howHelps) come from
// the stored outline sections when present (1I/2D fill them); otherwise sensible defaults.
import type { SectionCtx } from '@/components/spa/sections';
import type { LayoutSection } from '@/components/spa/SectionRenderer';
import { getService, servicesInCategory } from '@/lib/spa/catalog';

const FAQ_SCOPE: Record<string, string> = {
  massage: 'massage', 'foot-reflexology': 'foot', 'east-asian-therapies': 'cupping',
  facials: 'facial', 'body-treatments': 'general',
};

const tr = (loc: string, en: string, zh: string) => (loc === 'zh' ? zh : en);

/** find a stored outline section of a given type (e.g. richText.howHelps) */
function storedBody(content: any, type: string, variant?: string): string | undefined {
  const secs: any[] = content.sections || [];
  for (const s of secs) {
    const block = s[type];
    if (block && (!variant || block.variant === variant) && block.body) return block.body;
  }
  return undefined;
}

export function buildSeoPage(content: any, ctx: SectionCtx): { page: Record<string, any>; layout: { sections: LayoutSection[] } } {
  const loc = ctx.locale;
  const h1 = content.seo?.h1 || '';
  const ctaNap = {
    variant: 'nap', heading: tr(loc, 'Book your visit', '预约到访'),
    ctaPrimary: { label: tr(loc, 'Book Now', '立即预约'), href: '/book' },
    ctaSecondary: { label: tr(loc, 'Call (845) 800-6600', '致电 (845) 800-6600'), href: 'tel:8458006600' },
    showNap: true,
  };

  if (content.pageType === 'seo-service') {
    const svc = getService(ctx.catalog, content.serviceRef);
    const siblings = svc ? servicesInCategory(ctx.catalog, svc.categoryId).filter((s) => s.id !== svc.id).slice(0, 3) : [];
    const page: Record<string, any> = {
      hero: { variant: 'service', headline: h1, subline: svc?.short || '', serviceRef: content.serviceRef, ctaPrimary: { label: tr(loc, 'Book Now', '立即预约'), href: '/book' } },
      richText: { variant: 'whatItIs', heading: tr(loc, 'What it is', '项目介绍'), body: storedBody(content, 'richText', 'whatItIs') || svc?.short || '' },
      menuTable: { variant: 'compact', serviceRef: content.serviceRef },
      steps: { variant: 'expect', heading: tr(loc, 'What to expect', '护理流程'), items: [
        { title: tr(loc, 'Arrive & share your goals', '到店并说明需求'), body: tr(loc, 'Tell us areas to focus on or avoid.', '告诉我们需重点处理或避开的部位。') },
        { title: tr(loc, 'Relax into the work', '放松享受'), body: tr(loc, 'Pressure adjusts to your comfort.', '力度依您的舒适调整。') },
        { title: tr(loc, 'Pay after', '结束后付款'), body: tr(loc, 'No payment to book; tip if you like.', '预约无需付款，小费随意。') },
      ] },
      relatedServices: { variant: 'services', heading: tr(loc, 'You might also like', '您可能也喜欢'), links: siblings.map((s) => ({ href: `/${loc}/${s.slug}-middletown-ny`, label: s.name })) },
      testimonials: { variant: 'carousel', heading: tr(loc, 'What guests say', '客人评价'), filter: { categoryTag: svc?.categoryId, limit: 3 }, showSource: true },
      faq: { variant: 'accordion', heading: tr(loc, 'Common questions', '常见问题'), source: { scopeTag: FAQ_SCOPE[svc?.categoryId || ''] || 'general', limit: 5 } },
      ctaBanner: ctaNap,
    };
    return { page, layout: { sections: [
      { id: 'hero', mode: 'dark' }, { id: 'richText', mode: 'light' }, { id: 'menuTable', mode: 'well' },
      { id: 'steps', mode: 'light' }, { id: 'relatedServices', mode: 'light' }, { id: 'testimonials', mode: 'light' },
      { id: 'faq', mode: 'well' }, { id: 'ctaBanner', mode: 'dark' },
    ] } };
  }

  if (content.pageType === 'seo-condition') {
    const svc = getService(ctx.catalog, content.serviceRef);
    const page: Record<string, any> = {
      hero: { variant: 'empathy', headline: h1, subline: tr(loc, 'Soothing, licensed massage focused on relief.', '以放松与舒缓为本的持牌按摩。') },
      richText: { variant: 'howHelps', heading: tr(loc, 'How massage can help', '按摩如何帮助'), body: storedBody(content, 'richText', 'howHelps') || tr(loc, 'A relaxing, wellness-focused session that can help ease everyday tension and support how you feel.', '一次以放松与健康为本的护理，有助于缓解日常紧绷、改善整体感受。') },
      serviceCards: { variant: 'recommended', heading: tr(loc, 'Recommended treatments', '推荐护理'), source: { mode: svc ? 'refs' : 'tag', refs: svc ? [svc.id] : undefined, tag: 'popular', limit: 3 } },
      faq: { variant: 'accordion', heading: tr(loc, 'Common questions', '常见问题'), source: { scopeTag: 'massage', limit: 5 } },
      protectedNotice: storedBody(content, 'protectedNotice') ? { variant: 'seeDoctor', body: storedBody(content, 'protectedNotice'), locked: true } : { variant: 'seeDoctor', locked: true, body: tr(loc, 'If your symptoms are severe, worsening, or new, please see a doctor first. Massage is a wellness service and not a substitute for medical care.', '若症状严重、加重或为新发，请先就医。按摩属健康服务，不能替代医疗。') },
      ctaBanner: ctaNap,
    };
    return { page, layout: { sections: [
      { id: 'hero', mode: 'dark' }, { id: 'richText', mode: 'light' }, { id: 'serviceCards', mode: 'well' },
      { id: 'faq', mode: 'light' }, { id: 'protectedNotice', mode: 'well' }, { id: 'ctaBanner', mode: 'dark' },
    ] } };
  }

  // seo-local-landing (core landing)
  const page: Record<string, any> = {
    hero: { variant: 'local', headline: h1, subline: tr(loc, 'Licensed massage, reflexology, facials & body care — transparent pricing, open every day.', '持牌按摩、反射疗法、面部与身体护理——价格透明，每天营业。'), ctaPrimary: { label: tr(loc, 'Book Now', '立即预约'), href: '/book' }, ctaSecondary: { label: tr(loc, 'See pricing', '查看价格'), href: '/pricing' } },
    trustBar: { variant: 'bar', items: [{ type: 'rating' }, { type: 'licensed', label: tr(loc, 'Licensed NY therapists', '纽约州持牌理疗师') }, { type: 'bilingual', label: 'English & 中文' }, { type: 'hours', label: tr(loc, 'Open every day', '每天营业') }] },
    serviceCards: { variant: 'top', heading: tr(loc, 'Popular treatments', '热门护理'), source: { mode: 'tag', tag: 'popular', limit: 6 } },
    menuTable: { variant: 'teaser', limit: 2 },
    testimonials: { variant: 'wall', heading: tr(loc, 'What locals say', '街坊评价'), filter: { scopeTag: 'local', limit: 3 }, showSource: true },
    mapBlock: { variant: 'serviceArea', heading: tr(loc, 'Serving Middletown & nearby', '服务米德尔敦及周边') },
    faq: { variant: 'accordion', heading: tr(loc, 'Questions', '常见问题'), source: { scopeTag: 'general', limit: 8 } },
    ctaBanner: ctaNap,
  };
  return { page, layout: { sections: [
    { id: 'hero', mode: 'dark' }, { id: 'trustBar', mode: 'light' }, { id: 'serviceCards', mode: 'light' },
    { id: 'menuTable', mode: 'well' }, { id: 'testimonials', mode: 'light' }, { id: 'mapBlock', mode: 'dark' },
    { id: 'faq', mode: 'light' }, { id: 'ctaBanner', mode: 'dark' },
  ] } };
}
