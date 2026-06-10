// S23 checklist (standards) — a list of items with a check marker.
import type { SectionCtx } from './index';

export default function Checklist({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const items = data.items || [];
  if (!items.length) return null;
  return (
    <section className={`section on-${ctx.mode || 'well'}`}>
      <div className="container" style={{ maxWidth: 820 }}>
        {data.heading && <h2 className="reveal" style={{ marginBottom: 20 }}>{data.heading}</h2>}
        <ul className="reveal" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {items.map((it: any, i: number) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span aria-hidden style={{ color: 'var(--candle-deep)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span>{it.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
