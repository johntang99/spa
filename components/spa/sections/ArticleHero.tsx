// S26 articleHero — resource pages. Question H1 + the DIRECT ANSWER as the first
// paragraph (P-Gate-6: answer-first). Followed by the article body + TOC.
import type { SectionCtx } from './index';

export default function ArticleHero({ data, ctx }: { data: any; ctx: SectionCtx }) {
  return (
    <section className="section on-dark">
      <div className="container" style={{ maxWidth: 820 }}>
        <h1 className="reveal">{data.headline}</h1>
        {data.directAnswer && (
          <p className="reveal" style={{ fontSize: '1.2rem', color: 'var(--text-inverse-muted)', maxWidth: '62ch' }}>
            {data.directAnswer}
          </p>
        )}
      </div>
    </section>
  );
}
