import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getRequestSiteId, loadAllItems, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon, Tabs } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';

interface ConditionsPageData {
  layoutVariant?: 'categories-tabs' | 'category-detail-alternating';
  hero: {
    variant?:
      | 'centered'
      | 'split-photo-right'
      | 'split-photo-left'
      | 'photo-background'
      | 'gallery-background';
    title: string;
    subtitle: string;
    backgroundImage?: string;
    gallery?: string[];
    photoOverlayOpacity?: number;
    photoContentPosition?: 'center' | 'center-below' | 'left' | 'left-below' | 'lower';
  };
  introduction: {
    text: string;
    note: string;
  };
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    subtitle?: string;
    description: string;
    image?: string;
    order?: number;
  }>;
  conditions: Array<{
    id: string;
    category: string;
    icon: string;
    image?: string;
    title: string;
    description: string;
    symptoms: string[];
    tcmApproach: string;
    treatmentMethods: string[];
    featured?: boolean;
  }>;
  cta: {
    variant?: 'centered' | 'split' | 'banner' | 'card-elevated';
    title: string;
    description: string;
    primaryCta: {
      text: string;
      link: string;
    };
    secondaryCta: {
      text: string;
      link: string;
    };
  };
}

interface ConditionsPageProps {
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

export async function generateMetadata({ params }: ConditionsPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ConditionsPageData>('conditions', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'conditions',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.introduction?.text,
  });
}

export default async function ConditionsPage({ params }: ConditionsPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ConditionsPageData>('conditions', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('conditions.layout', locale, siteId);
  const blogPosts = await loadAllItems<BlogListItem>(siteId, locale, 'blog');
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');
  
  if (!content) {
    notFound();
  }

  const { hero, introduction, categories, conditions, cta } = content;
  const conditionsLayoutVariant = content.layoutVariant || 'categories-tabs';
  const sortedCategories = [...categories].sort((a, b) => {
    const aOrder = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
  const blogBySlug = new Map(blogPosts.map((post) => [post.slug, post]));
  const preferredSlugs = [
    'digestive-balance-tcm',
    'seasonal-allergy-support',
    'sleep-restoration-tips',
  ];
  const preferredPosts = preferredSlugs
    .map((slug) => blogBySlug.get(slug))
    .filter((post): post is BlogListItem => Boolean(post));
  const relatedPosts = preferredPosts.length
    ? preferredPosts
    : [...blogPosts]
        .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
        .slice(0, 3);

  // Group conditions by category
  const conditionsByCategory = sortedCategories.map(category => ({
    ...category,
    conditions: conditions.filter(c => c.category === category.id)
  }));
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
  const renderConditionDetailCard = (condition: ConditionsPageData['conditions'][number]) => (
    <div
      key={condition.id}
      id={condition.id}
      className="bg-white border border-gray-100 p-6 hover:border-primary/30 transition-all"
      style={tokenSurfaceStyle}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Title and Description */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}>
              <Icon name={condition.icon as any} className="text-primary" size="sm" />
            </div>
            <h3 className="text-subheading font-bold text-gray-900">
              {condition.title}
            </h3>
          </div>
          <p className="text-gray-600 text-small">
            {condition.description}
          </p>
        </div>

        {/* Symptoms */}
        <div>
          <h4 className="text-small font-semibold text-gray-900 mb-3">
            {locale === 'en' ? 'Common Symptoms' : '常见症状'}
          </h4>
          <div className="space-y-2">
            {condition.symptoms.map((symptom, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Icon name="Check" className="text-primary mt-0.5 flex-shrink-0" size="sm" />
                <span className="text-small text-gray-600">{symptom}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Approach */}
        <div>
          <h4 className="text-small font-semibold text-gray-900 mb-3">
            {locale === 'en' ? 'Our Approach' : '我们的方案'}
          </h4>
          <p className="text-small text-gray-600 mb-4">
            {condition.tcmApproach}
          </p>
          <div className="flex flex-wrap gap-2">
            {condition.treatmentMethods.map((method, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {method}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
            gallery={Array.isArray(hero.gallery) ? hero.gallery : undefined}
            photoOverlayOpacity={
              typeof hero.photoOverlayOpacity === 'number' ? hero.photoOverlayOpacity : 0.2
            }
            photoContentPosition={
              hero.photoContentPosition === 'center' ||
              hero.photoContentPosition === 'center-below' ||
              hero.photoContentPosition === 'left' ||
              hero.photoContentPosition === 'left-below' ||
              hero.photoContentPosition === 'lower'
                ? hero.photoContentPosition
                : 'left-below'
            }
          />
        </div>
      )}

      {/* Introduction */}
      {isEnabled('introduction') && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('introduction') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-body text-gray-700 leading-relaxed mb-6">
              {introduction.text}
            </p>
            <div className="bg-primary/5 border-l-4 border-primary p-6" style={{ borderTopRightRadius: 'var(--radius-base, 0.5rem)', borderBottomRightRadius: 'var(--radius-base, 0.5rem)' }}>
              <p className="text-gray-700 font-medium flex items-start gap-3">
                <Icon name="Info" className="text-primary mt-0.5 flex-shrink-0" />
                {introduction.note}
              </p>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Featured Conditions */}
      {isEnabled('featured') && (
        <section
          className="bg-gradient-to-br from-backdrop-secondary to-white"
          style={{ ...(sectionStyle('featured') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">
                {locale === 'en' ? 'Most Common' : '最常见'}
              </Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {locale === 'en' ? 'Frequently Treated Conditions' : '常见治疗病症'}
              </h2>
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'These are some of the conditions we see most often with excellent results'
                  : '以下是我们最常见且疗效良好的病症。'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conditions.filter(c => c.featured).map((condition) => (
                <Card key={condition.id} variant="default" hover padding="none" className="h-full overflow-hidden">
                  {condition.image ? (
                    <div className="relative w-full aspect-[4/3] bg-gray-200">
                      <Image
                        src={condition.image}
                        alt={condition.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-primary/5 flex items-center justify-center">
                      <Icon name={condition.icon as any} className="text-primary" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-3">
                      <Badge variant="secondary" size="sm">
                        {categories.find(cat => cat.id === condition.category)?.name}
                      </Badge>
                    </div>
                    <h3 className="text-subheading font-bold text-gray-900 mb-2">
                      {condition.title}
                    </h3>
                    <p className="text-gray-700 text-small mb-4">
                      {condition.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {condition.symptoms.slice(0, 4).map((symptom, idx) => (
                        <Badge key={idx} variant="primary" size="sm">
                          {symptom}
                        </Badge>
                      ))}
                      {condition.symptoms.length > 4 && (
                        <Badge variant="primary" size="sm">
                          +{condition.symptoms.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* All Conditions by Category */}
      {isEnabled('categories') && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('categories') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {locale === 'en' ? 'All Conditions by Category' : '按分类查看全部病症'}
              </h2>
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'Browse conditions organized by health category'
                  : '按健康分类浏览病症'}
              </p>
            </div>

            {conditionsLayoutVariant === 'category-detail-alternating' ? (
              <div className="space-y-24" style={{ paddingTop: 'var(--section-padding-y, 5rem)' }}>
                {conditionsByCategory
                  .filter(
                    (categoryGroup) =>
                      categoryGroup.id !== 'all' && categoryGroup.conditions.length > 0
                  )
                  .map((categoryGroup, categoryIndex) => {
                    const categoryImage =
                      categoryGroup.image ||
                      categoryGroup.conditions.find((condition) => Boolean(condition.image))?.image;
                    const imageOnRight = categoryIndex % 2 === 0;
                    return (
                      <div key={categoryGroup.id} className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                          <div className={imageOnRight ? 'lg:order-1' : 'lg:order-2'}>
                            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1 text-small font-semibold text-primary mb-4" style={{ borderRadius: '999px' }}>
                              <Icon name={categoryGroup.icon as any} size="sm" />
                              <span>{categoryGroup.name}</span>
                            </div>
                            <h3 className="text-heading font-bold text-gray-900 mb-2">
                              {categoryGroup.name}
                            </h3>
                            {categoryGroup.subtitle && (
                              <p className="text-body font-semibold text-gray-800 mb-3">
                                {categoryGroup.subtitle}
                              </p>
                            )}
                            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                              <ReactMarkdown
                                components={{
                                  ul: (props) => <ul className="list-disc pl-5" {...props} />,
                                  ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                                }}
                              >
                                {String(categoryGroup.description || '')}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <div className={imageOnRight ? 'lg:order-2' : 'lg:order-1'}>
                            <div className="overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-50 to-white" style={tokenSurfaceStyle}>
                              {categoryImage ? (
                                <Image
                                  src={categoryImage}
                                  alt={categoryGroup.name}
                                  width={1200}
                                  height={780}
                                  className="w-full h-auto object-cover"
                                />
                              ) : (
                                <div className="aspect-[16/9] w-full flex items-center justify-center">
                                  <Icon name={categoryGroup.icon as any} className="text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4">
                          {categoryGroup.conditions.map((condition) => renderConditionDetailCard(condition))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <Tabs
                defaultValue="all"
                variant="pills"
                items={[
                  {
                    value: 'all',
                    label: locale === 'en' ? 'All Conditions' : '全部病症',
                    content: (
                      <div style={{ paddingTop: 'var(--section-padding-y, 5rem)' }}>
                        <div className="grid gap-6">
                          {conditions.map((condition) => renderConditionDetailCard(condition))}
                        </div>
                      </div>
                    ),
                  },
                  ...sortedCategories.map(category => ({
                    value: category.id,
                    label: category.name,
                    icon: category.icon as any,
                    content: (
                      <div style={{ paddingTop: 'var(--section-padding-y, 5rem)' }}>
                        <div
                          className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-transparent"
                          style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}
                        >
                          {category.subtitle && (
                            <p className="text-small font-semibold text-gray-900 mb-1">{category.subtitle}</p>
                          )}
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <ReactMarkdown
                              components={{
                                ul: (props) => <ul className="list-disc pl-5" {...props} />,
                                ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                              }}
                            >
                              {String(category.description || '')}
                            </ReactMarkdown>
                          </div>
                        </div>

                        <div className="grid gap-6">
                          {conditionsByCategory
                            .find(cat => cat.id === category.id)
                            ?.conditions.map((condition) => renderConditionDetailCard(condition))}
                        </div>
                      </div>
                    ),
                  })),
                ]}
              />
            )}
          </div>
        </div>
        </section>
      )}

      {/* Related Reading */}
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
                    {locale === 'en' ? 'Related Reading' : '相关阅读'}
                  </h2>
                  <p className="text-gray-600">
                    {locale === 'en'
                      ? 'Learn more about common needs and practical support options.'
                      : '了解常见需求与可行的支持方案。'}
                  </p>
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="text-primary font-semibold hover:text-primary-dark"
                >
                  {locale === 'en' ? 'View all' : '查看全部'}
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link key={post.slug} href={`/${locale}/blog/${post.slug}`}>
                    <Card className="h-full">
                      <CardHeader>
                        <Badge variant="secondary" size="sm">
                          {post.category || (locale === 'en' ? 'Wellness' : '健康')}
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

      {isEnabled('cta') && (
        <div style={sectionStyle('cta')}>
          <CTASection
            title={cta.title}
            subtitle={cta.description}
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
