// S22 statsBand — computed stats. Sources: manual | yearsInBusiness | servicesCount |
// teamCount | reviewCount. reviewCount respects the ≥25 render threshold (stat hidden below).
import type { SectionCtx } from './index';
import { shouldRenderRating } from '@/lib/contracts/validation-rules';

export default function StatsBand({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const gbp = ctx.siteInfo?.gbp || {};
  const resolve = (item: any): string | null => {
    switch (item.source) {
      case 'servicesCount': return String((ctx.catalog.services || []).filter((s) => s.enabled).length);
      case 'teamCount': return String((ctx.team || []).length);
      case 'reviewCount': return shouldRenderRating(gbp.reviewCount) ? String(gbp.reviewCount) : null;
      case 'rating': return shouldRenderRating(gbp.reviewCount) && gbp.rating ? String(gbp.rating) : null;
      case 'yearsInBusiness': return ctx.siteInfo?.yearsInBusiness ? String(ctx.siteInfo.yearsInBusiness) : null;
      default: return item.value || null;
    }
  };
  const items = (data.items || []).map((it: any) => ({ ...it, resolved: resolve(it) })).filter((it: any) => it.resolved != null);
  if (!items.length) return null;

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container">
        <div className={`grid cols-${Math.min(items.length, 4)}`} style={{ textAlign: 'center' }}>
          {items.map((it: any, i: number) => (
            <div key={i} className="reveal">
              <div className="num" style={{ fontFamily: 'var(--s-font-display)', fontSize: '2.6rem', color: 'var(--candle-deep)', fontVariantNumeric: 'tabular-nums' }}>
                {it.resolved}{it.suffix || ''}
              </div>
              <div className="small">{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
