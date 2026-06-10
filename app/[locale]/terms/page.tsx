import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

interface LegalSection {
  heading: string;
  body: string;
  bullets?: string[];
}

interface LegalPageData {
  title: string;
  updatedAt?: string;
  intro?: string;
  sections: LegalSection[];
}

interface LegalPageProps {
  params: { locale: Locale };
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<LegalPageData>('terms', locale, siteId);
  return buildPageMetadata({
    siteId,
    locale,
    slug: 'terms',
    title: content?.title,
    description: content?.intro,
  });
}

export default async function TermsPage({ params }: LegalPageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<LegalPageData>('terms', locale, siteId);

  if (!content) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-heading font-bold text-gray-900">{content.title}</h1>
            {content.updatedAt && (
              <p className="text-sm text-gray-500 mt-2">
                {locale === 'en' ? 'Last updated:' : '最近更新：'} {content.updatedAt}
              </p>
            )}
          </div>

          {content.intro && (
            <p className="text-gray-700 leading-relaxed">{content.intro}</p>
          )}

          <div className="space-y-8">
            {content.sections.map((section, index) => (
              <div key={`${section.heading}-${index}`} className="space-y-3">
                <h2 className="text-subheading font-semibold text-gray-900">
                  {section.heading}
                </h2>
                {section.body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    {section.bullets.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
