// S26 toc — on-page table of contents for resource articles. Links to the H2 anchors
// rendered by RichText (article variant). Items are derived in buildSeoPage.
import type { SectionCtx } from './index';

export default function Toc({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const items: Array<{ label: string; anchor: string }> = data.items || [];
  if (!items.length) return null;
  return (
    <section className={`section on-${ctx.mode || 'well'}`} style={{ paddingTop: 32, paddingBottom: 32 }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <p className="eyebrow">{ctx.locale === 'zh' ? '本页内容' : 'On this page'}</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {items.map((it) => (
            <li key={it.anchor}><a href={`#${it.anchor}`} style={{ color: 'var(--candle-deep)' }}>{it.label}</a></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
