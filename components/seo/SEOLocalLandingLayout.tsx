'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui';

interface TrustItem {
  value: string;
  label: string;
}

interface ConditionItem {
  name: string;
  slug: string;
}

interface ServiceItem {
  name: string;
  description: string;
  link?: string;
}

interface WhyChooseItem {
  title: string;
  body: string;
}

interface FAQItem {
  question: string;
  answer: string;
  linkText?: string;
  linkHref?: string;
}

interface HourEntry {
  day: string;
  hours: string;
}

interface SEOLocalLandingContent {
  pageType: string;
  seo: {
    title: string;
    description: string;
    h1: string;
    canonicalUrl: string;
    schema: string[];
    noindex: boolean;
    priority: number;
  };
  hero: {
    h1: string;
    subheading: string;
    intro: string;
    ctaLabel: string;
    ctaHref: string;
    trustItems: TrustItem[];
  };
  conditions: {
    heading: string;
    intro: string;
    items: ConditionItem[];
  };
  services: {
    heading: string;
    items: ServiceItem[];
  };
  whyChooseUs: {
    heading: string;
    items: WhyChooseItem[];
    testimonial: {
      quote: string;
      attribution: string;
    };
  };
  faq: {
    heading: string;
    items: FAQItem[];
  };
  location: {
    heading: string;
    intro: string;
    mapEmbedUrl: string;
    nap: {
      name: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      phone: string;
    };
    hours: HourEntry[];
    ctaLabel: string;
    ctaHref: string;
  };
}

interface SEOLocalLandingLayoutProps {
  content: Record<string, any>;
  locale: string;
  siteBaseOrigin?: string;
}

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 bg-white overflow-hidden"
          style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}
        >
          <button
            type="button"
            className="w-full flex items-center justify-between p-5 text-left"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span className="text-body font-semibold text-gray-900 pr-4">
              {item.question}
            </span>
            <Icon
              name="ChevronDown"
              className={`text-gray-400 flex-shrink-0 transition-transform ${
                openIndex === i ? 'rotate-180' : ''
              }`}
              size="sm"
            />
          </button>
          {openIndex === i && (
            <div className="px-5 pb-5 text-small text-gray-600 leading-relaxed">
              {item.answer}
              {item.linkHref && item.linkText && (
                <>
                  {' '}
                  <Link
                    href={item.linkHref}
                    className="text-primary font-semibold hover:text-primary-dark"
                  >
                    {item.linkText} &rarr;
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SEOLocalLandingLayout({
  content,
  locale,
  siteBaseOrigin: _siteBaseOrigin,
}: SEOLocalLandingLayoutProps) {
  const c = content as unknown as SEOLocalLandingContent;
  const { hero, conditions, services, whyChooseUs, faq, location } = c;

  const tokenSurface = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  const sectionPadding = {
    paddingTop: 'var(--section-padding-y, 5rem)',
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };

  // FAQPage JSON-LD
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  // LocalBusiness JSON-LD
  const localBusinessSchema = location.nap
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: location.nap.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: location.nap.address,
          addressLocality: location.nap.city,
          addressRegion: location.nap.state,
          postalCode: location.nap.zip,
        },
        telephone: location.nap.phone,
      }
    : null;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {localBusinessSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      )}

      {/* Section 1 — Hero */}
      <section
        className="relative pt-20 md:pt-24 px-4 overflow-hidden bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)]"
        style={{ paddingBottom: 'var(--section-padding-y, 5rem)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <h1 className="text-display font-bold text-gray-900 mb-4 leading-tight">
            {hero.h1}
          </h1>
          <p className="text-subheading text-primary font-semibold mb-4">
            {hero.subheading}
          </p>
          <p className="text-body text-gray-700 leading-relaxed mb-8 max-w-3xl mx-auto">
            {hero.intro}
          </p>

          <Link
            href={hero.ctaHref}
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}
          >
            {hero.ctaLabel}
          </Link>

          {/* Trust Bar */}
          {hero.trustItems?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {hero.trustItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-white/80 backdrop-blur px-5 py-3 border border-gray-200"
                  style={tokenSurface}
                >
                  <span className="text-subheading font-bold text-primary">
                    {item.value}
                  </span>
                  <span className="text-small text-gray-600 ml-2">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 2 — Conditions Grid */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-4 text-center">
              {conditions.heading}
            </h2>
            <p className="text-body text-gray-600 mb-10 text-center max-w-3xl mx-auto">
              {conditions.intro}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {conditions.items.map((item) => (
                <Link
                  key={item.name}
                  href={`/${locale}/${item.slug}`}
                  className="group bg-white border border-gray-200 p-5 text-center hover:border-primary/40 hover:shadow-md transition-all"
                  style={tokenSurface}
                >
                  <span className="text-body font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Services */}
      <section
        className="bg-gradient-to-br from-[var(--backdrop-secondary)] to-white"
        style={sectionPadding}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              {services.heading}
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.items.map((item) => {
                const Wrapper = item.link ? Link : 'div';
                const wrapperProps = item.link
                  ? { href: item.link, className: 'group block bg-white border border-gray-200 p-6 hover:border-primary/40 hover:shadow-md transition-all', style: tokenSurface }
                  : { className: 'bg-white border border-gray-200 p-6', style: tokenSurface };
                return (
                  <Wrapper key={item.name} {...(wrapperProps as any)}>
                    <h3 className="text-subheading font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-small text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                    {item.link && (
                      <span className="inline-flex items-center gap-1 text-small font-semibold text-primary mt-3 group-hover:gap-2 transition-all">
                        Learn more →
                      </span>
                    )}
                  </Wrapper>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Why Choose Us */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              {whyChooseUs.heading}
            </h2>

            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {whyChooseUs.items.map((item) => (
                <div key={item.title}>
                  <h3 className="text-body font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-small text-gray-600 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            {whyChooseUs.testimonial && (
              <div
                className="bg-gradient-to-br from-primary/5 to-[var(--backdrop-primary)] p-8"
                style={tokenSurface}
              >
                <blockquote className="text-body text-gray-700 italic leading-relaxed mb-4">
                  &ldquo;{whyChooseUs.testimonial.quote}&rdquo;
                </blockquote>
                <p className="text-small font-semibold text-gray-900">
                  — {whyChooseUs.testimonial.attribution}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 5 — FAQ */}
      <section
        className="bg-gradient-to-br from-[var(--backdrop-secondary)] to-white"
        style={sectionPadding}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              {faq.heading}
            </h2>
            <FAQAccordion items={faq.items} />
          </div>
        </div>
      </section>

      {/* Section 6 — Location & Contact */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-4 text-center">
              {location.heading}
            </h2>
            {location.intro && (
              <p className="text-body text-gray-600 mb-10 text-center">
                {location.intro}
              </p>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Map */}
              {location.mapEmbedUrl &&
                location.mapEmbedUrl !== '[GOOGLE_MAPS_EMBED_URL]' && (
                  <div
                    className="overflow-hidden border border-gray-200"
                    style={tokenSurface}
                  >
                    <iframe
                      src={location.mapEmbedUrl}
                      width="100%"
                      height="350"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map to ${location.nap?.name}`}
                    />
                  </div>
                )}

              {/* NAP + Hours */}
              <div className="space-y-6">
                {location.nap && (
                  <div
                    className="bg-gradient-to-br from-primary/5 to-[var(--backdrop-primary)] p-6"
                    style={tokenSurface}
                  >
                    <h3 className="text-subheading font-bold text-gray-900 mb-4">
                      {location.nap.name}
                    </h3>
                    <div className="space-y-2 text-gray-700 text-small">
                      <p>{location.nap.address}</p>
                      <p>
                        {location.nap.city}, {location.nap.state}{' '}
                        {location.nap.zip}
                      </p>
                      <p>
                        <a
                          href={`tel:${location.nap.phone.replace(/[^+\d]/g, '')}`}
                          className="hover:text-primary"
                        >
                          {location.nap.phone}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {location.hours?.length > 0 && (
                  <div
                    className="border border-gray-200 p-6"
                    style={tokenSurface}
                  >
                    <h3 className="text-subheading font-bold text-gray-900 mb-4">
                      Hours
                    </h3>
                    <div className="space-y-2">
                      {location.hours.map((h) => (
                        <div
                          key={h.day}
                          className="flex justify-between text-small"
                        >
                          <span className="font-medium text-gray-800">
                            {h.day}
                          </span>
                          <span
                            className={
                              h.hours === 'Closed'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }
                          >
                            {h.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={location.ctaHref}
                  className="block w-full text-center px-8 py-4 bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
                  style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}
                >
                  {location.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
