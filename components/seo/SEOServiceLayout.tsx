'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui';

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOServiceContent {
  pageType: string;
  service: string;
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
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  whatIsIt: {
    heading: string;
    body: string;
  };
  whatItTreats: {
    heading: string;
    conditions: Array<{ name: string; slug?: string }>;
  };
  howItWorks: {
    heading: string;
    body: string;
  };
  faq: {
    heading: string;
    items: FAQItem[];
  };
  cta: {
    label: string;
    href: string;
    backLink?: { text: string; href: string };
  };
}

interface SEOServiceLayoutProps {
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

export default function SEOServiceLayout({
  content,
  locale,
  siteBaseOrigin: _siteBaseOrigin,
}: SEOServiceLayoutProps) {
  const c = content as unknown as SEOServiceContent;
  const { hero, whatIsIt, whatItTreats, howItWorks, faq, cta } = c;

  const tokenSurface = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  const sectionPadding = {
    paddingTop: 'var(--section-padding-y, 5rem)',
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };

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

      {/* Section 1 — Hero */}
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
            <span className="text-gray-900 font-medium">
              {c.seo.h1}
            </span>
          </nav>

          <h1 className="text-display font-bold text-gray-900 mb-6 leading-tight">
            {hero.h1}
          </h1>
          <p className="text-body text-gray-700 leading-relaxed mb-8">
            {hero.description}
          </p>
          <Link
            href={hero.ctaHref}
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}
          >
            {hero.ctaLabel}
          </Link>
        </div>
      </section>

      {/* Section 2 — What Is It? */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-6">
              {whatIsIt.heading}
            </h2>
            <div className="text-body text-gray-700 leading-relaxed whitespace-pre-line">
              {whatIsIt.body}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — What It Treats */}
      {whatItTreats?.conditions?.length > 0 && (
        <section
          className="bg-gradient-to-br from-[var(--backdrop-secondary)] to-white"
          style={sectionPadding}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-heading font-bold text-gray-900 mb-8">
                {whatItTreats.heading}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {whatItTreats.conditions.map((cond) =>
                  cond.slug ? (
                    <Link
                      key={cond.name}
                      href={`/${locale}/${cond.slug}`}
                      className="group bg-white border border-gray-200 p-4 text-center hover:border-primary/40 hover:shadow-md transition-all"
                      style={tokenSurface}
                    >
                      <span className="text-body font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {cond.name}
                      </span>
                    </Link>
                  ) : (
                    <div
                      key={cond.name}
                      className="bg-white border border-gray-200 p-4 text-center"
                      style={tokenSurface}
                    >
                      <span className="text-body font-semibold text-gray-900">
                        {cond.name}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 4 — How It Works / What to Expect */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-6">
              {howItWorks.heading}
            </h2>
            <div className="text-body text-gray-700 leading-relaxed whitespace-pre-line">
              {howItWorks.body}
            </div>
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

      {/* Section 6 — CTA */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4 text-center">
          {cta.backLink && (
            <p className="text-body text-gray-600 mb-4">
              <Link
                href={cta.backLink.href}
                className="text-primary font-semibold hover:text-primary-dark"
              >
                {cta.backLink.text}
              </Link>
            </p>
          )}
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
