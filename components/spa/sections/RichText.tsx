// S13 richText — intro / body / policies / whatItIs / howHelps / article. Renders the
// locale body as paragraphs (blank-line separated). article variant gets a TOC-friendly
// heading structure later (1H); here it renders readable prose.
import type { SectionCtx } from './index';

export default function RichText({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const body: string = data.body || '';
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const centered = data.variant === 'intro';
  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container" style={{ maxWidth: centered ? 820 : 760, textAlign: centered ? 'center' : 'left', margin: '0 auto' }}>
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <div className="reveal" style={{ color: data.variant === 'policies' ? 'var(--text-secondary)' : undefined }}>
          {paras.map((p, i) => <p key={i} style={centered ? { maxWidth: '60ch', margin: '0 auto 1em' } : undefined}>{p}</p>)}
        </div>
      </div>
    </section>
  );
}
