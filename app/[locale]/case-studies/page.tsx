import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getRequestSiteId, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Badge, Card, Icon, Tabs } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';

interface CaseStudy {
  id: string;
  category: string;
  condition: string;
  image?: string;
  beforeImage?: string;
  afterImage?: string;
  summary: string;
}

interface CaseStudiesPageData {
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
  }>;
  caseStudies: CaseStudy[];
  statistics: {
    variant?: 'horizontal-row' | 'grid-2x2' | 'vertical-cards' | 'inline-badges';
    title: string;
    stats: Array<{
      number: string;
      label: string;
      icon: string;
    }>;
  };
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

interface CaseStudiesPageProps {
  params: {
    locale: Locale;
  };
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}

interface HeaderMenuConfig {
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
  };
}

export async function generateMetadata({ params }: CaseStudiesPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<CaseStudiesPageData>('case-studies', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('case-studies.layout', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'case-studies',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.introduction?.text,
  });
}

export default async function CaseStudiesPage({ params }: CaseStudiesPageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<CaseStudiesPageData>('case-studies', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('case-studies.layout', locale, siteId);
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');

  if (!content) {
    return (
      <main className="min-h-screen">
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="text-display font-bold text-gray-900 mb-4">
              {locale === 'en' ? 'Patient Success Stories' : '患者成功案例'}
            </h1>
            <p className="text-subheading text-gray-600">
              {locale === 'en'
                ? 'Case studies content is not available yet.'
                : '成功案例内容尚未发布。'}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const { hero, introduction, categories, caseStudies, statistics, cta } = content;
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => !useLayout || layoutOrder.has(sectionId);
  const sectionStyle = (sectionId: string) =>
    useLayout ? { order: layoutOrder.get(sectionId) ?? 0 } : undefined;
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const tokenSurfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  const statsVariant = statistics.variant || 'grid-2x2';

  const caseStudiesByCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      return caseStudies;
    }
    return caseStudies.filter((study) => study.category === categoryId);
  };

  const normalizeMarkdown = (text: string) =>
    text
      .replace(/\r\n/g, '\n')
      .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
      .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');

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
        <section className="py-12 lg:py-16 bg-white" style={sectionStyle('introduction')}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {introduction.text}
            </p>
            <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6">
              <p className="text-gray-700 font-medium flex items-start gap-3">
                <Icon name="Info" className="text-primary mt-0.5 flex-shrink-0" />
                {introduction.note}
              </p>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Case Studies */}
      {isEnabled('studies') && (
        <section
          className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white"
          style={sectionStyle('studies')}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs
              defaultValue="all"
              variant="pills"
              items={categories.map((category) => ({
                value: category.id,
                label: category.name,
                icon: <Icon name={category.icon as any} size="sm" />,
                content: (
                  <div className="pt-8">
                    <div className="grid lg:grid-cols-2 gap-6">
                      {caseStudiesByCategory(category.id).map((study, index) => {
                        const caseTitle = study.condition || study.summary;
                        const categoryName = categories.find(cat => cat.id === study.category)?.name;
                        const afterImage = study.afterImage || study.image;
                        const beforeImage = study.beforeImage;
                        const hasBeforeAndAfter = Boolean(beforeImage && afterImage);
                        const overviewText = study.summary;

                        return (
                          <Card key={study.id} variant="default" hover padding="none" className="h-full overflow-hidden border border-gray-200 shadow-sm">
                            <div className="bg-gradient-to-br from-backdrop-secondary to-white border-b border-gray-200 p-4">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <Badge variant="primary" size="sm">
                                  {locale === 'en' ? `Case Study #${index + 1}` : `案例 #${index + 1}`}
                                </Badge>
                                <Badge variant="secondary" size="sm">
                                  {categoryName}
                                </Badge>
                              </div>
                              <h3 className="text-subheading font-bold text-gray-900 mb-1">
                                {caseTitle}
                              </h3>
                            </div>

                            <div className={hasBeforeAndAfter ? 'grid grid-cols-2 gap-2 p-4 bg-gray-50' : 'p-4 bg-gray-50'}>
                              {hasBeforeAndAfter ? (
                                <>
                                  <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                                    <Image src={beforeImage as string} alt={`${caseTitle} before`} fill className="object-cover" />
                                    <Badge variant="primary" size="sm" className="absolute left-3 top-3">
                                      {locale === 'en' ? 'Before' : '治疗前'}
                                    </Badge>
                                  </div>
                                  <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                                    <Image src={afterImage as string} alt={`${caseTitle} after`} fill className="object-cover" />
                                    <Badge variant="primary" size="sm" className="absolute left-3 top-3">
                                      {locale === 'en' ? 'After' : '治疗后'}
                                    </Badge>
                                  </div>
                                </>
                              ) : (
                                <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                                  {afterImage ? (
                                    <Image src={afterImage} alt={`${caseTitle} after`} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Icon name="Camera" className="text-primary/40" size="lg" />
                                    </div>
                                  )}
                                  <Badge variant="primary" size="sm" className="absolute left-3 top-3">
                                    {locale === 'en' ? 'After' : '治疗后'}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="p-6 space-y-6">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  {locale === 'en' ? 'Description' : '描述'}
                                </h4>
                                <div className="prose prose-sm max-w-none text-gray-700">
                                  <ReactMarkdown
                                    components={{
                                      ul: (props) => (
                                        <ul className="list-disc pl-5" {...props} />
                                      ),
                                      ol: (props) => (
                                        <ol className="list-decimal pl-5" {...props} />
                                      ),
                                      li: (props) => <li className="mb-1" {...props} />,
                                    }}
                                  >
                                    {normalizeMarkdown(overviewText)}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </div>
        </section>
      )}

      {/* Statistics */}
      {isEnabled('statistics') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('statistics')}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-heading font-bold text-gray-900">
                {statistics.title}
              </h2>
            </div>
            <div
              className={
                statsVariant === 'horizontal-row'
                  ? 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6'
                  : statsVariant === 'vertical-cards'
                    ? 'grid gap-4'
                    : statsVariant === 'inline-badges'
                      ? 'flex flex-wrap justify-center gap-4'
                      : 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6'
              }
            >
              {statistics.stats.map((stat, idx) => (
                <Card
                  key={idx}
                  className={`text-center p-6 ${statsVariant === 'inline-badges' ? 'min-w-[180px]' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name={stat.icon as any} className="text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* CTA */}
      {isEnabled('cta') && (
        <div style={sectionStyle('cta')}>
          <CTASection
            title={cta.title}
            subtitle={cta.description}
            primaryCta={cta.primaryCta}
            secondaryCta={cta.secondaryCta}
            variant={cta.variant || 'centered'}
            className="py-16"
          />
        </div>
      )}
    </main>
  );
}
