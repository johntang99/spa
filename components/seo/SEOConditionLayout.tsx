'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui';
import {
  absoluteUrlFromSiteOrigin,
  resolveSeoCanonicalToAbsoluteUrl,
} from '@/lib/seo-absolute-url';

interface FAQItem {
  question: string;
  answer: string;
}

interface RelatedLink {
  label: string;
  slug: string;
}

interface SEOConditionContent {
  pageType: string;
  condition: string;
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
    openingParagraph: string;
    ctaLabel: string;
    ctaHref: string;
  };
  howItWorks: {
    heading: string;
    body: string;
  };
  whatToExpect: {
    heading: string;
    body: string;
  };
  testimonial: {
    heading: string;
    quote: string;
    attribution: string;
  };
  faq: {
    heading: string;
    items: FAQItem[];
  };
  relatedConditions: {
    heading: string;
    links: RelatedLink[];
  };
  cta: {
    label: string;
    href: string;
  };
}

interface SEOConditionLayoutProps {
  content: Record<string, any>;
  locale: string;
  /** e.g. https://drhuangclinic.com — required for valid BreadcrumbList absolute URLs */
  siteBaseOrigin: string;
}

/** Derive /{locale}/acupuncture-{city}-{st} from condition slug acupuncture-for-...-{city}-{st}. */
function coreLandingPathFromConditionCanonical(canonicalUrl: string, locale: string): string | null {
  const slug =
    String(canonicalUrl || '')
      .split('/')
      .filter(Boolean)
      .pop() || '';
  if (!slug.startsWith('acupuncture-for-')) return null;
  const rest = slug.slice('acupuncture-for-'.length);
  const parts = rest.split('-');
  if (parts.length < 3) return null;
  const state = parts[parts.length - 1];
  const cityPart = parts[parts.length - 2];
  if (!/^[a-z]{2}$/i.test(state)) return null;
  const geo = `${cityPart}-${state}`.toLowerCase();
  return `/${locale}/acupuncture-${geo}`;
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

export default function SEOConditionLayout({
  content,
  locale,
  siteBaseOrigin,
}: SEOConditionLayoutProps) {
  const c = content as unknown as SEOConditionContent;
  const raw = content as Record<string, unknown>;
  const {
    hero,
    howItWorks,
    whatToExpect,
    testimonial,
    faq,
    relatedConditions,
    cta,
  } = c;
  const coreLandingHref =
    (raw.backLink &&
    typeof (raw.backLink as { url?: string }).url === 'string' &&
    (raw.backLink as { url: string }).url.startsWith('/')
      ? (raw.backLink as { url: string }).url
      : null) || coreLandingPathFromConditionCanonical(c.seo?.canonicalUrl || '', locale);

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

  const origin =
    (siteBaseOrigin || '').replace(/\/$/, '') ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) ||
    '';

  // BreadcrumbList JSON-LD — Google requires absolute URLs in `item` (not path-only).
  const breadcrumbItems: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }> =
    origin.length > 0
      ? [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: absoluteUrlFromSiteOrigin(origin, `/${locale}`),
          },
        ]
      : [];

  if (origin.length > 0 && coreLandingHref) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: 'Acupuncture',
      item: absoluteUrlFromSiteOrigin(origin, coreLandingHref),
    });
  }

  if (origin.length > 0) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: c.seo.h1,
      item: resolveSeoCanonicalToAbsoluteUrl(origin, c.seo.canonicalUrl || ''),
    });
  }

  const breadcrumbSchema =
    origin.length > 0 && breadcrumbItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems,
        }
      : null;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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

        <div className="container mx-auto max-w-4xl relative z-10">
          {/* Breadcrumb */}
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
            <span className="text-gray-900 font-medium">
              {c.condition
                ? c.condition.charAt(0).toUpperCase() + c.condition.slice(1).replace('-', ' ')
                : ''}
            </span>
          </nav>

          <h1 className="text-display font-bold text-gray-900 mb-6 leading-tight">
            {hero.h1}
          </h1>
          <p className="text-body text-gray-700 leading-relaxed mb-8">
            {hero.openingParagraph}
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

      {/* Section 2 — How It Works */}
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

      {/* Section 3 — What to Expect */}
      <section
        className="bg-gradient-to-br from-[var(--backdrop-secondary)] to-white"
        style={sectionPadding}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-6">
              {whatToExpect.heading}
            </h2>
            <div className="text-body text-gray-700 leading-relaxed whitespace-pre-line">
              {whatToExpect.body}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Patient Story */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-8">
              {testimonial.heading}
            </h2>
            <div
              className="bg-gradient-to-br from-primary/5 to-[var(--backdrop-primary)] p-8"
              style={tokenSurface}
            >
              <blockquote className="text-body text-gray-700 italic leading-relaxed mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <p className="text-small font-semibold text-gray-900">
                — {testimonial.attribution}
              </p>
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

      {/* Section 6 — Related Conditions + CTA */}
      <section className="bg-white" style={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-8 text-center">
              {relatedConditions.heading}
            </h2>

            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              {relatedConditions.links.map((link) => (
                <Link
                  key={link.slug}
                  href={`/${locale}/${link.slug}`}
                  className="group bg-white border border-gray-200 p-5 text-center hover:border-primary/40 hover:shadow-md transition-all"
                  style={tokenSurface}
                >
                  <span className="text-body font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href={cta.href}
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
                style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}
              >
                {cta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
