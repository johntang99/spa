import LandingPageForm from './LandingPageForm';
import GclidCapture from './GclidCapture';
import LpAnalytics from './LpAnalytics';
import type { LandingPageJsonV2 } from '@/lib/landingPageTypes';

export default function LandingPageRenderer({
  lp,
  slug,
  locale,
}: {
  lp: LandingPageJsonV2;
  slug: string;
  locale: string;
}) {
  return (
    <div className="bg-white">
      <GclidCapture />
      <LpAnalytics slug={slug} />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {lp.hero.h1}
          </h1>
          <p className="mt-6 text-lg text-gray-600">{lp.hero.subheadline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#lp-form"
              className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {lp.hero.primary_cta.label}
            </a>
            {lp.hero.secondary_cta && (
              <a
                href={
                  lp.hero.secondary_cta.action === 'tel'
                    ? `tel:${stripPhoneLabel(lp.hero.secondary_cta.label)}`
                    : '#lp-form'
                }
                className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {lp.hero.secondary_cta.label}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      {lp.trust &&
        (lp.trust.years_experience ||
          lp.trust.practitioners?.length ||
          lp.trust.review_count) && (
          <section className="border-y border-gray-200 bg-gray-50">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-around gap-4 px-6 py-5 text-sm">
              {lp.trust.years_experience && (
                <Stat
                  label="years experience"
                  value={String(lp.trust.years_experience)}
                />
              )}
              {lp.trust.review_count && (
                <Stat
                  label={lp.trust.review_source ?? 'reviews'}
                  value={`${lp.trust.average_rating ?? ''}★ · ${lp.trust.review_count}`}
                />
              )}
              {lp.trust.practitioners?.[0] && (
                <Stat
                  label="practitioner"
                  value={lp.trust.practitioners[0].name}
                />
              )}
            </div>
          </section>
        )}

      {/* Benefits */}
      {lp.benefits.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {lp.benefits.map((b, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white p-5"
                >
                  <h3 className="text-base font-semibold text-gray-900">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service explanation */}
      {lp.service_explanation && (
        <section className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <div className="space-y-6">
              <Block
                title={locale === 'zh' ? '什么是针灸？' : 'What is it?'}
                body={lp.service_explanation.what_is_it}
              />
              <Block
                title={locale === 'zh' ? '就诊体验' : 'What to expect'}
                body={lp.service_explanation.what_to_expect}
              />
              {lp.service_explanation.how_many_sessions && (
                <Block
                  title={
                    locale === 'zh' ? '需要多少次调理？' : 'How many sessions?'
                  }
                  body={lp.service_explanation.how_many_sessions}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Social proof */}
      {lp.social_proof && lp.social_proof.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {lp.social_proof.map((s, i) => (
                <figure
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white p-5"
                >
                  <blockquote className="text-sm italic text-gray-700">
                    &ldquo;{s.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-3 text-xs text-gray-500">
                    — {s.author}, {s.source}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {lp.faq && lp.faq.length > 0 && (
        <section className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <h2 className="text-2xl font-semibold text-gray-900">FAQ</h2>
            <dl className="mt-6 space-y-5">
              {lp.faq.map((f, i) => (
                <div key={i}>
                  <dt className="font-medium text-gray-900">{f.q}</dt>
                  <dd className="mt-1 text-sm text-gray-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Location */}
      {lp.location_signals && (
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">
              {locale === 'zh' ? '地址与方向' : 'Location & directions'}
            </h2>
            {lp.location_signals.address && (
              <p className="mt-3">{lp.location_signals.address}</p>
            )}
            {lp.location_signals.nearby_landmarks &&
              lp.location_signals.nearby_landmarks.length > 0 && (
                <p className="mt-1 text-gray-600">
                  {locale === 'zh' ? '附近：' : 'Near: '}
                  {lp.location_signals.nearby_landmarks.join(' · ')}
                </p>
              )}
            {lp.location_signals.parking_info && (
              <p className="mt-1 text-gray-600">
                {lp.location_signals.parking_info}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Lead form */}
      <section id="lp-form" className="border-t border-gray-200 bg-gray-50 scroll-mt-12">
        <div className="mx-auto max-w-md px-6 py-14">
          <h2 className="text-xl font-semibold text-gray-900">
            {locale === 'zh' ? '预约咨询' : 'Request a consultation'}
          </h2>
          <LandingPageForm
            slug={slug}
            language={locale}
            fields={lp.form.fields}
            optionalFields={lp.form.optional_fields ?? []}
            submitLabel={lp.final_cta.cta_label}
            thankYouSlug={lp.form.thank_you_slug ?? null}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold text-white">
            {lp.final_cta.headline}
          </h2>
          <a
            href="#lp-form"
            className="mt-6 inline-block rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
          >
            {lp.final_cta.cta_label}
          </a>
        </div>
      </section>

      {/* Compliance footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-3xl px-6 py-8 text-xs">
          {lp.compliance.required_disclaimers.map((d, i) => (
            <p key={i} className="mb-2 leading-relaxed">
              {d}
            </p>
          ))}
          {lp.trust?.practitioners?.[0]?.license_number && (
            <p className="mt-3 text-gray-400">
              {locale === 'zh' ? '执照：' : 'License: '}
              {lp.trust.practitioners[0].license_number}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-semibold text-gray-900">{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-700">{body}</p>
    </div>
  );
}

function stripPhoneLabel(label: string): string {
  const m = label.match(/[+\d().\s-]{7,}/);
  return m ? m[0].replace(/[^\d+]/g, '') : label;
}
