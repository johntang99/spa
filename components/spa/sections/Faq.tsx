'use client';

// S14 faq — accordion / mini / search over the faqs collection. accordion+mini filter by
// scopeTag; search shows all with a live text filter. Emits FAQPage JSON-LD (default).
import { useMemo, useState } from 'react';
import type { SectionCtx } from './index';

interface FaqItem { id: string; question: string; answer: string; scopeTags: string[] }

export default function Faq({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const source = data.source || {};
  const variant = data.variant || 'accordion';
  const tr = (en: string, zh: string) => (ctx.locale === 'zh' ? zh : en);

  const base: FaqItem[] = useMemo(() => {
    let items: FaqItem[] = ctx.faqs || [];
    if (variant !== 'search') {
      if (source.scopeTag) items = items.filter((f) => (f.scopeTags || []).includes(source.scopeTag));
      if (Array.isArray(source.refs)) items = (ctx.faqs || []).filter((f) => source.refs.includes(f.id));
      if (source.limit) items = items.slice(0, source.limit);
    }
    return items;
  }, [ctx.faqs, variant, source.scopeTag, source.limit]);

  const [open, setOpen] = useState<number | null>(variant === 'search' ? null : 0);
  const [q, setQ] = useState('');

  const items = useMemo(() => {
    if (variant !== 'search' || !q.trim()) return base;
    const needle = q.trim().toLowerCase();
    return base.filter((f) => f.question.toLowerCase().includes(needle) || f.answer.toLowerCase().includes(needle));
  }, [base, q, variant]);

  if (!base.length) return null;

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container" style={{ maxWidth: 820 }}>
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        {variant === 'search' && (
          <div className="field reveal">
            <input type="search" placeholder={tr('Search questions…', '搜索问题…')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={tr('Search FAQs', '搜索常见问题')} />
          </div>
        )}
        <div className="reveal">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.id} className={`acc-item${isOpen ? ' open' : ''}`}>
                <button className="acc-btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span>{f.question}</span><span className="ico" aria-hidden>+</span>
                </button>
                <div className="acc-panel" style={{ maxHeight: isOpen ? 400 : 0 }}>
                  <div className="acc-panel-inner">{f.answer}</div>
                </div>
              </div>
            );
          })}
          {!items.length && <p className="small">{tr('No matching questions — call us at (845) 800-6600.', '没有匹配的问题——请致电 (845) 800-6600。')}</p>}
        </div>
      </div>
      {data.emitSchema !== false && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: base.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
        }) }} />
      )}
    </section>
  );
}
