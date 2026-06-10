// S26 comparisonTable — member vs regular for a membership package. Perks + the member
// rate vs the regular price of the included treatment (from the catalog, single source).
import type { SectionCtx } from './index';
import { getService, fmtPrice } from '@/lib/spa/catalog';

export default function ComparisonTable({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const pkg = (ctx.packages || []).find((p: any) => p.id === data.packageRef);
  if (!pkg) return null;
  const tr = (en: string, zh: string) => (ctx.locale === 'zh' ? zh : en);

  const inc = pkg.includes?.[0];
  const svc = inc ? getService(ctx.catalog, inc.serviceRef) : undefined;
  const tier = svc?.tiers.find((t) => t.minutes === inc?.tierMinutes) || svc?.tiers[0];
  const regular = tier?.price;

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container" style={{ maxWidth: 720 }}>
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <table className="reveal" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--char)' }}>
              <th style={{ textAlign: 'left', padding: '10px 0' }}></th>
              <th style={{ textAlign: 'right', padding: '10px 0' }}>{tr('Regular', '普通')}</th>
              <th style={{ textAlign: 'right', padding: '10px 0', color: 'var(--candle-deep)' }}>{tr('Member', '会员')}</th>
            </tr>
          </thead>
          <tbody>
            {svc && regular != null && (
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 0' }}>{svc.name} · {inc?.tierMinutes}m</td>
                <td className="num" style={{ textAlign: 'right' }}>{fmtPrice(regular)}</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{fmtPrice(pkg.price)}/{tr('mo', '月')}</td>
              </tr>
            )}
            {(pkg.perks || []).map((perk: string, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 0' }} className="small">{perk}</td>
                <td style={{ textAlign: 'right', color: 'var(--mist)' }}>—</td>
                <td style={{ textAlign: 'right', color: 'var(--candle-deep)' }}>✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
