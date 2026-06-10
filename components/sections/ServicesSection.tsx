import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent, Badge, Tabs, Accordion, Icon } from '@/components/ui';
import { ServicesVariant, getSectionClasses } from '@/lib/section-variants';
import { Service } from '@/lib/types';
import { cn } from '@/lib/utils';

function normalizeServiceMarkdown(text: string): string {
  const headings = [
    'Scope of Application',
    'Precautions',
    'Core Benefits',
    'Key Benefits',
    'What to Expect',
    '適用範圍',
    '注意事項',
    '核心亮點',
    '服務說明',
  ];

  let normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  for (const heading of headings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const markdownHeadingPattern = new RegExp(`\\*\\*${escaped}\\*\\*\\s*`, 'g');
    normalized = normalized.replace(markdownHeadingPattern, `\n\n**${heading}**\n`);
  }
  return normalized.replace(/\n{3,}/g, '\n\n').trim();
}

function MarkdownText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('prose prose-sm max-w-none text-gray-700', className)}>
      <ReactMarkdown
        components={{
          ul: (props) => <ul className="list-disc pl-5" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5" {...props} />,
          p: (props) => <p className="mb-2 last:mb-0" {...props} />,
        }}
      >
        {normalizeServiceMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}

function getServiceBenefits(service: Service): string[] {
  return Array.isArray(service.benefits)
    ? service.benefits.map((benefit) => String(benefit || '').trim()).filter(Boolean)
    : [];
}

function getServiceWhatToExpect(service: Service): string {
  return typeof service.whatToExpect === 'string' ? service.whatToExpect.trim() : '';
}

export interface ServicesSectionProps {
  variant?: ServicesVariant;
  badge?: string;
  title: string;
  subtitle?: string;
  locale?: 'en' | 'zh';
  legacyLabels?: {
    servicePrefix?: string;
    keyBenefitsTitle?: string;
    whatToExpectTitle?: string;
  };
  featured?: Service;
  services: Service[];
  moreLink?: {
    text: string;
    url: string;
  };
  className?: string;
}

const servicesVariantConfig = {
  'grid-cards': {
    variant: 'grid-cards',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'grid-cards-2x': {
    variant: 'grid-cards-2x',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'grid-cards-3x': {
    variant: 'grid-cards-3x',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'featured-large': {
    variant: 'featured-large',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'list-horizontal': {
    variant: 'list-horizontal',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'accordion': {
    variant: 'accordion',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'tabs': {
    variant: 'tabs',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'detail-alternating': {
    variant: 'detail-alternating',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
  'detail-image-right': {
    variant: 'detail-image-right',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
};

export default function ServicesSection({
  variant = 'detail-alternating',
  badge,
  title,
  subtitle,
  locale = 'en',
  legacyLabels,
  featured: featuredProp,
  services,
  moreLink,
  className,
}: ServicesSectionProps) {
  // Backward compatibility: old "grid-cards" should behave like detail-alternating.
  const normalizedVariant = variant === 'grid-cards' ? 'detail-alternating' : variant;
  const config = servicesVariantConfig[normalizedVariant];
  const sectionClasses = getSectionClasses(config);
  const isShowcaseGridVariant =
    normalizedVariant === 'grid-cards-2x' || normalizedVariant === 'grid-cards-3x';
  const contentContainerClass = 'container-custom';
  const servicePrefixLabel =
    legacyLabels?.servicePrefix || (locale === 'zh' ? '服務項目' : 'Service');
  const keyBenefitsLabel =
    legacyLabels?.keyBenefitsTitle || (locale === 'zh' ? '核心亮點' : 'Key Benefits');
  const whatToExpectLabel =
    legacyLabels?.whatToExpectTitle || (locale === 'zh' ? '服務說明' : 'What to Expect');
  const featured = featuredProp || services.find((s) => s.featured) || services[0];
  const nonFeaturedServices = featuredProp
    ? services
    : services.filter((s) => s.id !== featured?.id);
  
  const sectionSpacingStyle = {
    paddingTop: 'var(--section-padding-y, 5rem)',
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };
  const surfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  
  return (
    <section className={cn('bg-gray-50', sectionClasses, className)} style={sectionSpacingStyle}>
      <div className={contentContainerClass}>
      {/* Section Header */}
      <div className={cn('text-center', isShowcaseGridVariant ? 'mb-16' : 'mb-12')}>
        {badge && (
          <Badge variant="primary" className={cn(isShowcaseGridVariant ? 'mb-6' : 'mb-4')}>
            {badge}
          </Badge>
        )}
        <h2
          className={cn(
            isShowcaseGridVariant ? 'text-display font-bold mb-6' : 'text-heading font-bold mb-4'
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={cn(
              'text-gray-600 mx-auto',
              isShowcaseGridVariant ? 'text-subheading max-w-3xl' : 'max-w-2xl'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Variant-specific rendering */}
      {(normalizedVariant === 'grid-cards-2x' || normalizedVariant === 'grid-cards-3x') && (
        <div
          className={cn(
            'gap-[2.25rem]',
            normalizedVariant === 'grid-cards-2x'
              ? 'grid md:grid-cols-2 lg:grid-cols-2'
              : 'grid md:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {services.map((service) => (
            <ServiceDetailCard
              key={service.id}
              service={service}
              keyBenefitsLabel={keyBenefitsLabel}
              whatToExpectLabel={whatToExpectLabel}
            />
          ))}
        </div>
      )}
      
      {normalizedVariant === 'featured-large' && (
        <div className="space-y-8">
          {/* Featured Service */}
          {featured && (
            <div className="bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)] overflow-hidden border-2 border-gray-200 hover:border-primary transition-all" style={surfaceStyle}>
              <div className="grid md:grid-cols-2">
                {/* Image Side */}
                <div className="relative aspect-[4/3] md:aspect-auto bg-gray-100">
                  {featured.image ? (
                    <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                      <span className="text-gray-500 text-sm">Featured Service</span>
                    </div>
                  )}
                </div>
                
                {/* Content Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <Badge variant="primary" className="mb-4 w-fit">Featured</Badge>
                  <div className="flex gap-4 items-start mb-4">
                    {featured.icon && (
                      <div className="w-12 h-12 bg-primary-50 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}>
                        <Icon name={featured.icon as any} size="md" className="text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-subheading md:text-heading font-bold text-gray-900 mb-2">{featured.title}</h3>
                      <p className="text-subheading text-primary font-medium">{featured.shortDescription}</p>
                    </div>
                  </div>
                  {(featured.fullDescription || featured.shortDescription) && (
                    <MarkdownText
                      text={featured.fullDescription || featured.shortDescription || ''}
                      className="mb-6"
                    />
                  )}
                  {featured.link && (
                    <Link href={featured.link} className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-2">
                      Learn More
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Other Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonFeaturedServices.slice(0, 6).map((service) => (
              <ServiceCard key={service.id} service={service} compact />
            ))}
          </div>
        </div>
      )}
      
      {normalizedVariant === 'list-horizontal' && (
        <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
          {services.map((service) => (
            <div key={service.id} className="flex-shrink-0 w-80">
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      )}
      
      {normalizedVariant === 'accordion' && (
        <Accordion
          items={services.map((service) => ({
            id: service.id,
            title: service.title,
            content: (
              <div className="space-y-4">
                <MarkdownText text={service.fullDescription || service.shortDescription || ''} />
                {getServiceBenefits(service).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{keyBenefitsLabel}:</h4>
                    <ul className="space-y-1">
                      {getServiceBenefits(service).map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
          }))}
        />
      )}
      
      {normalizedVariant === 'tabs' && (
        <Tabs
          tabs={services.map((service) => ({
            id: service.id,
            label: service.title,
            content: (
              <div className="p-6 bg-gray-50" style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}>
                <MarkdownText
                  text={service.fullDescription || service.shortDescription || ''}
                  className="mb-6"
                />
                {getServiceBenefits(service).length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {getServiceBenefits(service).map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          }))}
          variant="pills"
        />
      )}

      {(normalizedVariant === 'detail-alternating' || normalizedVariant === 'detail-image-right') && (
        <div className="max-w-6xl mx-auto space-y-12 lg:space-y-16">
          {services
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((service, index) => (
              <div
                key={service.id}
                id={service.id}
                className="bg-white border border-gray-100 p-4 md:p-6"
                style={surfaceStyle}
              >
                <div
                  className={`grid lg:grid-cols-2 gap-8 items-center ${
                    normalizedVariant === 'detail-alternating' && index % 2 === 1
                      ? 'lg:grid-flow-dense'
                      : ''
                  }`}
                >
                  <div
                    className={
                      normalizedVariant === 'detail-image-right'
                        ? 'lg:order-2'
                        : index % 2 === 1
                          ? 'lg:col-start-2'
                          : ''
                    }
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-white" style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}>
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white flex items-center justify-center">
                          <Icon name={service.icon as any} size="xl" className="text-primary/30" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={
                      normalizedVariant === 'detail-image-right'
                        ? 'lg:order-1'
                        : index % 2 === 1
                          ? 'lg:col-start-1 lg:row-start-1'
                          : ''
                    }
                  >
                    <div className="bg-white border border-gray-100 p-6 lg:p-8" style={surfaceStyle}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 flex items-center justify-center" style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}>
                          <Icon name={service.icon as any} className="text-primary" />
                        </div>
                        <Badge variant="primary">{`${servicePrefixLabel} ${service.order || index + 1}`}</Badge>
                      </div>

                      <h2 className="text-heading font-bold text-gray-900 mb-4">{service.title}</h2>
                      <MarkdownText
                        text={service.fullDescription || service.shortDescription || ''}
                        className="mb-6"
                      />

                      {getServiceBenefits(service).length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-subheading font-semibold text-gray-900 mb-4">
                            {keyBenefitsLabel}
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {getServiceBenefits(service).slice(0, 6).map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Icon
                                  name="Check"
                                  className="text-primary mt-0.5 flex-shrink-0"
                                  size="sm"
                                />
                                <span className="text-sm text-gray-600">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {getServiceWhatToExpect(service) && (
                        <div className="bg-white p-6 border border-gray-100" style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Icon name="Info" size="sm" className="text-primary" />
                            {whatToExpectLabel}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {getServiceWhatToExpect(service)}
                          </p>
                        </div>
                      )}

                      {service.link && (
                        <div className="mt-6">
                          <Link
                            href={service.link}
                            className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-2 group"
                          >
                            {locale === 'zh' ? '了解更多' : 'Learn More'}
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* More Link */}
      {moreLink && (
        <div className="text-center mt-12">
          <Link
            href={moreLink.url}
            className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-2 group"
          >
            {moreLink.text}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      )}
      </div>
    </section>
  );
}

// ============================================
// SERVICE CARD COMPONENT
// ============================================

interface ServiceCardProps {
  service: Service;
  compact?: boolean;
}

function ServiceDetailCard({
  service,
  keyBenefitsLabel,
  whatToExpectLabel,
}: {
  service: Service;
  keyBenefitsLabel: string;
  whatToExpectLabel: string;
}) {
  const CardWrapper = service.link ? Link : 'div';
  const surfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };

  return (
    <CardWrapper href={service.link || '#'} className={service.link ? 'block h-full' : 'h-full'}>
      <article className="h-full bg-white border border-gray-100 transition-shadow overflow-hidden" style={surfaceStyle}>
        {service.image && (
          <div className="relative aspect-[3/2] bg-white">
            <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-subheading font-bold text-gray-900 mb-3">{service.title}</h3>

          {(service.fullDescription || service.shortDescription) && (
            <MarkdownText
              text={service.fullDescription || service.shortDescription || ''}
              className="text-sm mb-4"
            />
          )}

          {(service.price || service.durationMinutes) && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              {service.price && (
                <div className="bg-white border border-gray-100 px-2 py-1" style={{ borderRadius: 'var(--radius-base, 0.375rem)' }}>
                  <span className="text-gray-500">Price</span>
                  <p className="text-gray-800 font-semibold">{service.price}</p>
                </div>
              )}
              {service.durationMinutes ? (
                <div className="bg-white border border-gray-100 px-2 py-1" style={{ borderRadius: 'var(--radius-base, 0.375rem)' }}>
                  <span className="text-gray-500">Duration</span>
                  <p className="text-gray-800 font-semibold">{service.durationMinutes} min</p>
                </div>
              ) : null}
            </div>
          )}

          {getServiceBenefits(service).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">{keyBenefitsLabel}</h4>
              <ul className="space-y-1.5">
                {getServiceBenefits(service).map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                    <Icon name="Check" size="sm" className="text-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {getServiceWhatToExpect(service) && (
            <div className="border border-gray-100 bg-white p-3" style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}>
              <h5 className="text-xs font-semibold text-gray-900 mb-1">{whatToExpectLabel}</h5>
              <p className="text-xs text-gray-600 leading-relaxed">{getServiceWhatToExpect(service)}</p>
            </div>
          )}
        </div>
      </article>
    </CardWrapper>
  );
}

function ServiceCard({ service, compact }: ServiceCardProps) {
  const CardWrapper = service.link ? Link : 'div';
  
  return (
    <CardWrapper href={service.link || '#'} className={service.link ? 'block' : ''}>
      <Card
        variant="default"
        hover
        className={cn(
          'h-full',
          compact && 'border-2 border-gray-200'
        )}
        style={compact ? { borderRadius: 'var(--radius-base, 0.75rem)', boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))' } : undefined}
      >
        {service.image && !compact && (
          <div className="h-48 bg-gray-200 overflow-hidden" style={{ borderTopLeftRadius: 'var(--radius-base, 0.75rem)', borderTopRightRadius: 'var(--radius-base, 0.75rem)' }}>
            <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader>
          {service.icon && (
            <div className="w-12 h-12 bg-primary-50 flex items-center justify-center mb-4" style={{ borderRadius: 'var(--radius-base, 0.5rem)', boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))' }}>
              <Icon name={service.icon as any} size="md" className="text-primary" />
            </div>
          )}
          <CardTitle>{service.title}</CardTitle>
          {service.subtitle && (
            <p className="text-sm text-gray-600 mt-1">{service.subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <MarkdownText
            text={service.fullDescription || service.shortDescription || ''}
            className="text-sm line-clamp-3"
          />
          {service.link && (
            <div className="mt-4 text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-1 text-sm">
              Learn More
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
