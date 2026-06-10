// S05 menuTable (ServiceMenuTable) — the signature treatment. Display-serif names, dot
// leaders, tabular numerals, duration columns, per-row Book prefill. NO prices stored here:
// everything resolves from the catalog (single price source). Variants: table | compact | teaser.
import Link from 'next/link';
import type { SectionCtx } from './index';
import { servicesInCategory, getService, bookHref, fmtPrice, type Service, type Category } from '@/lib/spa/catalog';

const DURATIONS = [30, 60, 90] as const;

function priceFor(s: Service, minutes: number): number | null {
  const tier = s.tiers.find((t) => t.minutes === minutes);
  return tier ? tier.price : null;
}

function Row({ s, locale }: { s: Service; locale: string }) {
  return (
    <div className="menu-grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 86px)', gap: 18, alignItems: 'baseline', padding: '18px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div>
        <div className="menu-name"><span>{s.name}</span><span className="leader" /></div>
        <div className="menu-note">{s.short}</div>
      </div>
      {DURATIONS.map((m) => {
        const p = priceFor(s, m);
        return (
          <span key={m} className="num" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {p != null ? <Link href={bookHref(locale, s.id, m)} style={{ textDecoration: 'none', color: 'var(--char)' }}>{fmtPrice(p)}</Link> : <span style={{ color: 'var(--mist)' }}>—</span>}
          </span>
        );
      })}
    </div>
  );
}

export default function MenuTable({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const variant = data.variant || 'table';

  // compact — a single service's tiers (used on service pages).
  if (variant === 'compact' && data.serviceRef) {
    const s = getService(ctx.catalog, data.serviceRef);
    if (!s) return null;
    return (
      <section className={`section on-${ctx.mode || 'light'}`}>
        <div className="container" style={{ maxWidth: 720 }}>
          <ul className="menu-rows">
            {s.tiers.map((t) => (
              <li key={t.minutes} className="menu-row">
                <span className="menu-name"><span>{t.minutes} {ctx.locale === 'zh' ? '分钟' : 'min'}</span><span className="leader" /></span>
                <Link className="btn btn-primary btn-sm" href={bookHref(ctx.locale, s.id, t.minutes)}>{ctx.locale === 'zh' ? '预约' : 'Book'} {fmtPrice(t.price)}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  // table — full menu across categories (pricing page).
  const treatmentCats: Category[] = (ctx.catalog.categories || []).filter((c) => !['combos-packages', 'add-ons'].includes(c.id));
  const cats = variant === 'teaser' ? treatmentCats.slice(0, data.limit || 2) : treatmentCats;

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container">
        {cats.map((cat) => {
          const svcs = servicesInCategory(ctx.catalog, cat.id);
          if (!svcs.length) return null;
          return (
            <div key={cat.id} id={`m-${cat.id}`} style={{ marginBottom: 40 }}>
              <h2 className="reveal" style={{ marginBottom: 8 }}>{cat.name}</h2>
              <div className="menu-head" style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 86px)', gap: 18, padding: '8px 0', borderBottom: '2px solid var(--char)', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char-soft)' }}>
                <span>{ctx.locale === 'zh' ? '护理' : 'Treatment'}</span>
                {DURATIONS.map((m) => <span key={m} style={{ textAlign: 'right' }}>{m} {ctx.locale === 'zh' ? '分钟' : 'min'}</span>)}
              </div>
              {svcs.map((s) => <Row key={s.id} s={s} locale={ctx.locale} />)}
            </div>
          );
        })}
      </div>

      {/* OfferCatalog schema from catalog data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'OfferCatalog',
            name: 'Spa Paradise Menu',
            itemListElement: treatmentCats.flatMap((cat) =>
              servicesInCategory(ctx.catalog, cat.id).map((s) => ({
                '@type': 'Offer',
                name: s.name,
                category: cat.name,
                priceCurrency: 'USD',
                price: Math.min(...s.tiers.map((t) => t.price)),
              }))
            ),
          }),
        }}
      />
    </section>
  );
}
