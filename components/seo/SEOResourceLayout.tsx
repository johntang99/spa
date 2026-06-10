'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui';

interface FAQItem {
  question: string;
  answer: string;
}

interface PriceItem {
  label: string;
  price: string;
}

interface SEOResourceContent {
  pageType: string;
  resourceType: string;
  seo: {
    title: string;
    description: string;
    h1: string;
    canonicalUrl: string;
    schema: string[];
    noindex: boolean;
    priority: number;
  };
  directAnswer: {
    h1: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  priceBreakdown: {
    heading: string;
    items: PriceItem[];
  };
  whatAffectsCost: {
    heading: string;
    body: string;
  };
  insurance: {
    heading: string;
    body: string;
  };
  worthIt: {
    heading: string;
    body: string;
    testimonial: {
      quote: string;
      attribution: string;
    };
  };
  faq: {
    heading: string;
    items: FAQItem[];
  };
  cta: {
    label: string;
    href: string;
  };
}

interface SEOResourceLayoutProps {
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SEOResourceLayout({
  content,
  locale,
  siteBaseOrigin: _siteBaseOrigin,
}: SEOResourceLayoutProps) {
  const c = content as unknown as SEOResourceContent;
  const {
    directAnswer,
    priceBreakdown,
    whatAffectsCost,
    insurance,
    worthIt,
    faq,
    cta,
  } = c;

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

  return (
    <main className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Section 1 — Direct Answer (ABOVE THE FOLD) */}
      <section
        className="relative pt-20 md:pt-24 px-4 overflow-hidden bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)]"
        style={{ paddingBottom: 'var(--section-padding-y, 5rem)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <nav className="flex items-center gap-2 text-small text-gray-500 mb-8">
            <Link href={`/${locale}`} className="hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/${locale}/acupuncture-middletown-ny`}
              className="hover:text-primary"
            >
              Acupuncture
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Cost</span>
          </nav>

          <h1 className="text-display font-bold text-gray-900 mb-6 leading-tight">
            {directAnswer.h1}
          </h1>
          <p className="text-body text-gray-700 leading-relaxed mb-8">
            {directAnswer.body}
          </p>
          <Link
            href={directAnswer.ctaHref}
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}
          >
            {directAnswer.ctaLabel}
          </Link>
        </div>
      </section>

      {/* Section 2 — Price Breakdown */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-8">
              {priceBreakdown.heading}
            </h2>

            <div
              className="border border-gray-200 overflow-hidden"
              style={tokenSurface}
            >
              {priceBreakdown.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-5 ${
                    i < priceBreakdown.items.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <span className="text-body text-gray-800">{item.label}</span>
                  <span className="text-body font-bold text-primary ml-4 whitespace-nowrap">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — What Affects Cost */}
      <section
        className="bg-gradient-to-br from-[var(--backdrop-secondary)] to-white"
        style={sectionPadding}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-6">
              {whatAffectsCost.heading}
            </h2>
            <p className="text-body text-gray-700 leading-relaxed">
              {whatAffectsCost.body}
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — Insurance & Payment */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-6">
              {insurance.heading}
            </h2>
            <p className="text-body text-gray-700 leading-relaxed">
              {insurance.body}
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 — Is It Worth It? */}
      <section
        className="bg-gradient-to-br from-[var(--backdrop-secondary)] to-white"
        style={sectionPadding}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-6">
              {worthIt.heading}
            </h2>
            <p className="text-body text-gray-700 leading-relaxed mb-8">
              {worthIt.body}
            </p>

            {worthIt.testimonial && (
              <div
                className="bg-gradient-to-br from-primary/5 to-[var(--backdrop-primary)] p-8"
                style={tokenSurface}
              >
                <blockquote className="text-body text-gray-700 italic leading-relaxed mb-4">
                  &ldquo;{worthIt.testimonial.quote}&rdquo;
                </blockquote>
                <p className="text-small font-semibold text-gray-900">
                  — {worthIt.testimonial.attribution}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 6 — FAQ */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              {faq.heading}
            </h2>
            <FAQAccordion items={faq.items} />
          </div>
        </div>
      </section>

      {/* Section 7 — Final CTA */}
      <section
        className="bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)]"
        style={sectionPadding}
      >
        <div className="container mx-auto px-4 text-center">
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center px-10 py-4 bg-primary text-white font-semibold text-subheading hover:bg-primary-dark transition-colors"
            style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}
          >
            {cta.label}
          </Link>
        </div>
      </section>
    </main>
  );
}
