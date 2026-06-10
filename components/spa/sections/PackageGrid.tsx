// S26 packageGrid — packages with computed value math (sum of included tier prices vs
// package price → savings). Single price source: included service prices from the catalog.
// Memberships render as inquiry (→ /book?package=). Stripe purchase deferred.
import Link from 'next/link';
import type { SectionCtx } from './index';
import { getService, fmtPrice } from '@/lib/spa/catalog';

export default function PackageGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const all = ctx.packages || [];
  const list = data.refs === 'all' || !data.refs ? all : all.filter((p: any) => data.refs.includes(p.id));
  const pkgs = list.filter((p: any) => p.kind === 'package' && p.active);
  if (!pkgs.length) return null;
  const tr = (en: string, zh: string) => (ctx.locale === 'zh' ? zh : en);

  function valueTotal(p: any): number {
    return (p.includes || []).reduce((sum: number, inc: any) => {
      const svc = getService(ctx.catalog, inc.serviceRef);
      const tier = svc?.tiers.find((t) => t.minutes === inc.tierMinutes) || svc?.tiers[0];
      return sum + (tier?.price || 0);
    }, 0);
  }

  return (
    <section id="packages" className={`section on-${ctx.mode || 'light'}`}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ marginBottom: 24 }}>{data.heading}</h2>}
        <div className="grid cols-2">
          {pkgs.map((p: any) => {
            const value = valueTotal(p);
            const savings = value - p.price;
            return (
              <div key={p.id} className="card reveal">
                <div className="card-body">
                  <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
                  {p.perks?.length ? (
                    <ul className="small" style={{ margin: '8px 0 12px', paddingLeft: 18 }}>
                      {p.perks.map((perk: string, i: number) => <li key={i}>{perk}</li>)}
                    </ul>
                  ) : null}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                    <span className="num" style={{ fontFamily: 'var(--s-font-display)', fontSize: '1.8rem', color: 'var(--candle-deep)' }}>{fmtPrice(p.price)}</span>
                    {savings > 0 && <span className="small" style={{ textDecoration: 'line-through', color: 'var(--mist-strong)' }}>{fmtPrice(value)}</span>}
                    {savings > 0 && <span className="pill-tag">{tr('save', '省')} {fmtPrice(savings)}</span>}
                  </div>
                  <Link className="btn btn-primary btn-sm" href={`/${ctx.locale}/book?package=${p.id}`}>{tr('Book this', '预约此套餐')}</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
