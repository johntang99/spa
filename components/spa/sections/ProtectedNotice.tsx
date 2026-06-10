// S26 protectedNotice (seeDoctor) — the compliance boundary block on condition pages.
// Contract-locked (non-deletable/non-reorderable in admin). Rendered as a clear callout.
import type { SectionCtx } from './index';

export default function ProtectedNotice({ data, ctx }: { data: any; ctx: SectionCtx }) {
  if (!data?.body) return null;
  return (
    <section className={`section on-${ctx.mode || 'well'}`}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div
          role="note"
          style={{
            borderLeft: '4px solid var(--candle-deep)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-light)',
            borderLeftWidth: 4,
            borderRadius: 'var(--radius-card)',
            padding: '20px 24px',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 6, fontFamily: 'var(--s-font-display)' }}>
            {ctx.locale === 'zh' ? '请先就医' : 'Please see a doctor first'}
          </strong>
          <p className="small" style={{ margin: 0 }}>{data.body}</p>
        </div>
      </div>
    </section>
  );
}
