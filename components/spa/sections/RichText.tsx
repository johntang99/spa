// S13 richText — intro / body / policies / whatItIs / howHelps / article. Renders the
// locale body as paragraphs (blank-line separated). For the article variant, lines starting
// with "## " become anchored <h2> headings (TOC targets, P-Gate-6).
import type { SectionCtx } from './index';

export function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
}

export default function RichText({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const body: string = data.body || '';
  const isArticle = data.variant === 'article';
  const centered = data.variant === 'intro';

  const blocks = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container" style={{ maxWidth: centered ? 820 : 760, textAlign: centered ? 'center' : 'left', margin: '0 auto' }}>
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <div className="reveal" style={{ color: data.variant === 'policies' ? 'var(--text-secondary)' : undefined }}>
          {blocks.map((p, i) => {
            if (isArticle && p.startsWith('## ')) {
              const text = p.slice(3).trim();
              return <h2 key={i} id={slugifyHeading(text)} style={{ marginTop: '1.4em' }}>{text}</h2>;
            }
            return <p key={i} style={centered ? { maxWidth: '60ch', margin: '0 auto 1em' } : undefined}>{p}</p>;
          })}
        </div>
      </div>
    </section>
  );
}
