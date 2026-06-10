import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadAllItems, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { getServiceSEOLinks } from '@/lib/seo-pages';
import { ServicesPage, Locale } from '@/lib/types';
import { Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon, Accordion } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import ServicesSection from '@/components/sections/ServicesSection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';

interface ServicesPageProps {
  params: {
    locale: Locale;
  };
}

interface BlogListItem {
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  category?: string;
  publishDate?: string;
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}

interface HeaderMenuConfig {
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
  };
}

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ServicesPage>('services', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'services',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.overview?.introduction,
  });
}

export default async function ServicesPageComponent({ params }: ServicesPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ServicesPage>('services', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('services.layout', locale, siteId);
  const blogPosts = await loadAllItems<BlogListItem>(siteId, locale, 'blog');
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');
  
  if (!content) {
    notFound();
  }

  const { hero, overview, servicesList, faq, cta } = content;

  // Resolve SEO service page links — override service.link when an SEO page exists
  const seoLinks = await getServiceSEOLinks(siteId, locale);
  const services = (servicesList?.items || []).map((service) => {
    const seoLink = seoLinks.get(service.id);
    return seoLink ? { ...service, link: seoLink } : service;
  });
  const blogBySlug = new Map(blogPosts.map((post) => [post.slug, post]));
  const preferredSlugs = content.relatedReading?.preferredSlugs || [];
  const preferredPosts = preferredSlugs
    .map((slug) => blogBySlug.get(slug))
    .filter((post): post is BlogListItem => Boolean(post));
  const relatedPosts = preferredPosts.length
    ? preferredPosts
    : [...blogPosts]
        .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
        .slice(0, 3);
  const overviewTitle = overview.title || (locale === 'en' ? 'Benefits of Our Care Model' : '我们的服务优势');
  const servicesBadge = content.servicesList?.badge || (locale === 'en' ? 'OUR SERVICES' : '服务项目');
  const servicesTitleFallback = locale === 'en' ? 'Our Services' : '服务项目';
  const legacyLabels = content.legacyLabels || {};
  const faqSubtitle =
    faq.subtitle ||
    (locale === 'en'
      ? 'Common questions about services, safety, and expected outcomes'
      : '关于服务、安全与预期结果的常见问题');
  const relatedReading = content.relatedReading || {};
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => !useLayout || layoutOrder.has(sectionId);
  const sectionStyle = (sectionId: string) =>
    useLayout ? { order: layoutOrder.get(sectionId) ?? 0 } : undefined;
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const sectionSpacingStyle = {
    paddingTop: 'var(--section-padding-y, 5rem)',
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };
  const tokenSurfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {isEnabled('hero') && (
        <div style={sectionStyle('hero')}>
          <HeroSection
            variant={(hero.variant as HeroVariant) || 'split-photo-right'}
            topSpacingMode={isTransparentMenu ? 'extra' : 'default'}
            tagline={hero.title}
            description={hero.subtitle}
            image={hero.backgroundImage || undefined}
            gallery={Array.isArray((hero as any).gallery) ? (hero as any).gallery : undefined}
            photoOverlayOpacity={
              typeof (hero as any).photoOverlayOpacity === 'number'
                ? (hero as any).photoOverlayOpacity
                : 0.2
            }
            photoContentPosition={
              (hero as any).photoContentPosition === 'center' ||
              (hero as any).photoContentPosition === 'center-below' ||
              (hero as any).photoContentPosition === 'left' ||
              (hero as any).photoContentPosition === 'left-below' ||
              (hero as any).photoContentPosition === 'lower'
                ? (hero as any).photoContentPosition
                : 'left-below'
            }
          />
        </div>
      )}

      {/* Overview Section */}
      {isEnabled('overview') && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('overview') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-body text-gray-700 leading-relaxed mb-12">
              {overview.introduction}
            </p>

            <div
              className="bg-gradient-to-br from-primary/5 to-backdrop-primary p-8 lg:p-12"
              style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}
            >
              <h2 className="text-heading font-bold text-gray-900 mb-6">
                {overviewTitle}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {overview.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Icon name="Check" className="text-primary mt-1 flex-shrink-0" size="sm" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Services Section - Variant-aware */}
      {isEnabled('services') && content.servicesList && services.length > 0 && (
        <div style={sectionStyle('services')}>
          <ServicesSection
            variant={content.servicesList.variant || 'detail-alternating'}
            badge={servicesBadge}
            title={
              content.servicesList.title ||
              servicesTitleFallback
            }
            subtitle={content.servicesList.subtitle || ''}
            locale={locale}
            legacyLabels={legacyLabels}
            services={services}
          />
        </div>
      )}

      {/* FAQ Section */}
      {isEnabled('faq') && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('faq') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {faq.title}
              </h2>
              <p className="text-gray-600">
                {faqSubtitle}
              </p>
            </div>

            <Accordion
              items={faq.faqs.map((item, index) => ({
                id: `faq-${index}`,
                title: item.question,
                content: item.answer,
              }))}
              allowMultiple
            />
          </div>
        </div>
        </section>
      )}

      {isEnabled('relatedReading') && relatedPosts.length > 0 && (
        <section
          className="bg-gradient-to-br from-backdrop-secondary to-white"
          style={{ ...(sectionStyle('relatedReading') || {}), ...sectionSpacingStyle }}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-heading font-bold text-gray-900">
                    {relatedReading.title || (locale === 'en' ? 'Related Reading' : '相关阅读')}
                  </h2>
                  <p className="text-gray-600">
                    {relatedReading.subtitle ||
                      (locale === 'en'
                        ? 'Explore practical guides related to these services.'
                        : '了解与本页服务相关的实用内容。')}
                  </p>
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="text-primary font-semibold hover:text-primary-dark"
                >
                  {relatedReading.viewAllText || (locale === 'en' ? 'View all' : '查看全部')}
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link key={post.slug} href={`/${locale}/blog/${post.slug}`}>
                    <Card className="h-full">
                      <CardHeader>
                        <Badge variant="secondary" size="sm">
                          {post.category || relatedReading.defaultCategory || (locale === 'en' ? 'Guide' : '指南')}
                        </Badge>
                        <CardTitle className="text-body mt-3 line-clamp-2">
                          {post.title}
                        </CardTitle>
                        {post.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {post.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {isEnabled('cta') && (
        <div style={sectionStyle('cta')}>
          <CTASection
            title={cta.title}
            subtitle={cta.subtitle}
            primaryCta={cta.primaryCta}
            secondaryCta={cta.secondaryCta}
            variant={cta.variant || 'centered'}
            className=""
          />
        </div>
      )}
    </main>
  );
}
