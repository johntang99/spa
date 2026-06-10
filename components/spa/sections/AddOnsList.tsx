// S06 addOnsList — chips of catalog add-ons (+$price). full | inline. From the catalog.
import type { SectionCtx } from './index';
import { fmtPrice } from '@/lib/spa/catalog';

export default function AddOnsList({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const addons = ctx.catalog.addons || [];
  if (!addons.length) return null;
  return (
    <section className={`section on-${ctx.mode || 'well'}`}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ marginBottom: 8 }}>{data.heading}</h2>}
        <p className="small" style={{ marginBottom: 16 }}>
          {ctx.locale === 'zh' ? '可于预约时或在前台加入任意符合条件的护理。' : 'Added to any qualifying treatment when you book or at the desk.'}
        </p>
        <div className="reveal" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {addons.map((a: any) => (
            <span key={a.id} className="chip">{a.name} <strong>+{fmtPrice(a.price)}</strong></span>
          ))}
        </div>
      </div>
    </section>
  );
}
