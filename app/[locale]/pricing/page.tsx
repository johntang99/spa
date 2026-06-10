import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Accordion, Badge } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';

interface PricingPageData {
  hero: {
    variant?: 'centered' | 'split-photo-right' | 'split-photo-left' | 'photo-background';
    title: string;
    subtitle: string;
    backgroundImage?: string;
  };
  introduction: {
    text: string;
    note?: string;
  };
  individualTreatments: {
    variant?: 'grid-3' | 'grid-2' | 'list';
    title: string;
    subtitle?: string;
    items: Array<{
      name: string;
      description: string;
      price: string;
      duration: string;
      notes?: string | null;
    }>;
  };
  packages: {
    variant?: 'grid-3' | 'grid-2' | 'list';
    title: string;
    subtitle?: string;
    items: Array<{
      name: string;
      description: string;
      sessions: number;
      totalPrice: string;
      perSessionPrice: string;
      regularPrice?: string;
      savings?: string;
      popular?: boolean;
      includes: string[];
      bestFor?: string;
    }>;
  };
  insurance: {
    variant?: 'split' | 'stacked';
    title: string;
    acceptedInsurance: string[];
    insuranceInfo: {
      title: string;
      description: string;
      whatToAsk: string[];
      weProvide: string[];
    };
    paymentMethods: {
      title: string;
      methods: string[];
    };
    hsa?: {
      title: string;
      description: string;
    };
  };
  policies?: {
    variant?: 'grid' | 'list';
    title: string;
    cancellation?: { title: string; policy: string };
    packages?: { title: string; policy: string };
    lateArrival?: { title: string; policy: string };
    newPatients?: { title: string; policy: string };
  };
  faq: {
    variant?: 'accordion' | 'simple';
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  cta?: {
    variant?: 'centered' | 'split' | 'banner' | 'card-elevated';
    title: string;
    description: string;
    primaryCta?: { text: string; link: string };
    secondaryCta?: { text: string; link: string };
  };
}

interface PricingPageProps {
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

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<PricingPageData>('pricing', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'pricing',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.introduction?.text,
  });
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<PricingPageData>('pricing', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('pricing.layout', locale, siteId);
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');

  if (!content) {
    notFound();
  }

  const {
    hero,
    introduction,
    individualTreatments,
    packages,
    insurance,
    policies,
    faq,
    cta,
  } = content;
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => !useLayout || layoutOrder.has(sectionId);
  const sectionStyle = (sectionId: string) =>
    useLayout ? { order: layoutOrder.get(sectionId) ?? 0 } : undefined;
  const heroVariant = hero.variant || 'split-photo-right';
  const centeredHero = heroVariant === 'centered';
  const imageLeftHero = heroVariant === 'split-photo-left';
  const backgroundHero = heroVariant === 'photo-background' && Boolean(hero.backgroundImage);
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const heroTopPaddingClass = isTransparentMenu ? 'pt-30 md:pt-36' : 'pt-28 md:pt-32';
  const sectionSpacingStyle = {
    paddingTop: 'var(--section-padding-y, 5rem)',
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };
  const tokenSurfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  const heroBottomSpacingStyle = { paddingBottom: 'var(--section-padding-y, 5rem)' };
  const treatmentsVariant = individualTreatments.variant || 'grid-3';
  const packagesVariant = packages.variant || 'grid-3';
  const insuranceVariant = insurance.variant || 'split';
  const policiesVariant = policies?.variant || 'grid';
  const faqVariant = faq.variant || 'accordion';

  return (
    <main className="min-h-screen bg-[color-mix(in_srgb,var(--backdrop-primary)_30%,white)] flex flex-col">
      {isEnabled('hero') && (
        <section
          className={`relative ${heroTopPaddingClass} px-4 overflow-hidden ${
            backgroundHero
              ? 'bg-cover bg-center before:absolute before:inset-0 before:bg-white/75'
              : 'bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)]'
          }`}
          style={{
            ...(sectionStyle('hero') || {}),
            ...heroBottomSpacingStyle,
            ...(backgroundHero ? { backgroundImage: `url(${hero.backgroundImage})` } : {}),
          }}
        >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto max-w-6xl">
          <div className={`grid gap-10 lg:items-center ${centeredHero ? 'max-w-4xl mx-auto' : 'lg:grid-cols-2'}`}>
            <div className={centeredHero ? 'text-center' : ''}>
              <h1 className="text-display font-bold text-gray-900">
                {hero.title}
              </h1>
              <p className="text-subheading text-gray-600 mt-3">{hero.subtitle}</p>
              <div className="mt-6 text-gray-700">
                <p className="text-body leading-relaxed">{introduction.text}</p>
                {introduction.note && (
                  <p className="text-small text-gray-500 mt-3">{introduction.note}</p>
                )}
              </div>
            </div>
            {!centeredHero && hero.backgroundImage && (
              <div className={`lg:pl-6 ${imageLeftHero ? 'lg:order-first lg:pl-0 lg:pr-6' : ''}`}>
                <div className="overflow-hidden" style={tokenSurfaceStyle}>
                  <Image
                    src={hero.backgroundImage}
                    alt={hero.title}
                    width={1600}
                    height={900}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        </section>
      )}

      {isEnabled('individualTreatments') && (
        <section
          className="px-4"
          style={{ ...(sectionStyle('individualTreatments') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-heading font-bold text-center mb-2">
            {individualTreatments.title}
          </h2>
          {individualTreatments.subtitle && (
            <p className="text-center text-gray-600 mb-8">
              {individualTreatments.subtitle}
            </p>
          )}
          <div
            className={
              treatmentsVariant === 'list'
                ? 'grid gap-4'
                : treatmentsVariant === 'grid-2'
                  ? 'grid gap-6 md:grid-cols-2'
                  : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
            }
          >
            {individualTreatments.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="bg-white border border-gray-200 p-6 transition-shadow"
                style={tokenSurfaceStyle}
              >
                <h3 className="text-subheading font-bold mb-2">{item.name}</h3>
                <div className="text-heading font-bold text-[var(--primary)] mb-3">
                  {item.price}
                </div>
                <p className="text-gray-600 mb-4">{item.duration}</p>
                <p className="text-small text-gray-700 mb-4">{item.description}</p>
                {item.notes && (
                  <p className="text-small text-gray-500 italic">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        </section>
      )}

      {isEnabled('packages') && (
        <section
          className="px-4"
          style={{ ...(sectionStyle('packages') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-heading font-bold text-center mb-2">
            {packages.title}
          </h2>
          {packages.subtitle && (
            <p className="text-center text-gray-600 mb-8">{packages.subtitle}</p>
          )}
          <div
            className={
              packagesVariant === 'list'
                ? 'grid gap-4'
                : packagesVariant === 'grid-2'
                  ? 'grid gap-6 md:grid-cols-2'
                  : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
            }
          >
            {packages.items.map((pkg, index) => (
              <div
                key={`${pkg.name}-${index}`}
                className={`border p-6 ${
                  pkg.popular
                    ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_6%,white)]'
                    : 'border-gray-200 bg-white'
                }`}
                style={tokenSurfaceStyle}
              >
                {pkg.popular && (
                  <Badge variant="primary" className="mb-3">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-subheading font-bold mb-1">{pkg.name}</h3>
                <p className="text-small text-gray-600 mb-4">{pkg.description}</p>
                <div className="text-heading font-bold text-[var(--primary)]">
                  {pkg.totalPrice}
                </div>
                <div className="text-small text-gray-600 mb-4">
                  {pkg.sessions} sessions · {pkg.perSessionPrice} / session
                </div>
                {pkg.savings && (
                  <div className="text-small text-gray-500 mb-4">
                    Save {pkg.savings} {pkg.regularPrice ? `· Regular ${pkg.regularPrice}` : ''}
                  </div>
                )}
                <ul className="space-y-2 text-small text-gray-700 mb-4">
                  {pkg.includes.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
                {pkg.bestFor && (
                  <p className="text-small text-gray-500">Best for: {pkg.bestFor}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        </section>
      )}

      {isEnabled('insurance') && (
        <section
          className="px-4"
          style={{ ...(sectionStyle('insurance') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-heading font-bold text-center mb-8">
            {insurance.title}
          </h2>
          <div className={insuranceVariant === 'stacked' ? 'grid gap-6' : 'grid gap-6 md:grid-cols-2'}>
            <div className="bg-white border border-gray-200 p-6" style={tokenSurfaceStyle}>
              <h3 className="font-bold text-subheading mb-3">
                {insurance.insuranceInfo.title}
              </h3>
              <p className="text-gray-700 mb-4">{insurance.insuranceInfo.description}</p>
              <div className="text-small text-gray-700 space-y-2">
                <div className="font-semibold">What to ask</div>
                <ul className="space-y-1">
                  {insurance.insuranceInfo.whatToAsk.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="text-small text-gray-700 space-y-2 mt-4">
                <div className="font-semibold">We provide</div>
                <ul className="space-y-1">
                  {insurance.insuranceInfo.weProvide.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6" style={tokenSurfaceStyle}>
                <h3 className="font-bold text-subheading mb-3">
                  {insurance.paymentMethods.title}
                </h3>
                <ul className="space-y-2 text-small text-gray-700">
                  {insurance.paymentMethods.methods.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
              {insurance.hsa && (
                <div
                  className="bg-[color-mix(in_srgb,var(--primary)_10%,white)] border border-[color-mix(in_srgb,var(--primary)_20%,white)] p-6"
                  style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}
                >
                  <h3 className="font-bold text-subheading mb-2">{insurance.hsa.title}</h3>
                  <p className="text-small text-gray-700">{insurance.hsa.description}</p>
                </div>
              )}
              {insurance.acceptedInsurance?.length > 0 && (
                <div className="bg-white border border-gray-200 p-6" style={tokenSurfaceStyle}>
                  <h3 className="font-bold text-subheading mb-3">Accepted Insurance</h3>
                  <div className="flex flex-wrap gap-2">
                    {insurance.acceptedInsurance.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-small text-gray-600 bg-gray-100 px-3 py-1"
                        style={{ borderRadius: '999px' }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </section>
      )}

      {isEnabled('policies') && policies && (
        <section
          className="px-4"
          style={{ ...(sectionStyle('policies') || {}), ...sectionSpacingStyle }}
        >
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-heading font-bold text-center mb-8">
              {policies.title}
            </h2>
            <div className={policiesVariant === 'list' ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'}>
              {policies.cancellation && (
                <div className="bg-white border border-gray-200 p-6" style={tokenSurfaceStyle}>
                  <h3 className="font-bold text-subheading mb-2">
                    {policies.cancellation.title}
                  </h3>
                  <p className="text-small text-gray-700">{policies.cancellation.policy}</p>
                </div>
              )}
              {policies.packages && (
                <div className="bg-white border border-gray-200 p-6" style={tokenSurfaceStyle}>
                  <h3 className="font-bold text-subheading mb-2">
                    {policies.packages.title}
                  </h3>
                  <p className="text-small text-gray-700">{policies.packages.policy}</p>
                </div>
              )}
              {policies.lateArrival && (
                <div className="bg-white border border-gray-200 p-6" style={tokenSurfaceStyle}>
                  <h3 className="font-bold text-subheading mb-2">
                    {policies.lateArrival.title}
                  </h3>
                  <p className="text-small text-gray-700">{policies.lateArrival.policy}</p>
                </div>
              )}
              {policies.newPatients && (
                <div className="bg-white border border-gray-200 p-6" style={tokenSurfaceStyle}>
                  <h3 className="font-bold text-subheading mb-2">
                    {policies.newPatients.title}
                  </h3>
                  <p className="text-small text-gray-700">{policies.newPatients.policy}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {isEnabled('faq') && (
        <section
          className="px-4"
          style={{ ...(sectionStyle('faq') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-heading font-bold text-center mb-8">
            {faq.title}
          </h2>
          {faqVariant === 'simple' ? (
            <div className="space-y-4">
              {faq.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 p-4"
                  style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-small text-gray-700">{item.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <Accordion
              items={faq.items.map((item, index) => ({
                id: `faq-${index}`,
                title: item.question,
                content: item.answer,
              }))}
              allowMultiple
            />
          )}
        </div>
        </section>
      )}
      {isEnabled('cta') && cta && (
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
