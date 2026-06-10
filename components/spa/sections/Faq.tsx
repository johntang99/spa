'use client';

// S14 faq — accordion / mini over the faqs collection, filtered by scopeTag. Emits
// FAQPage JSON-LD when emitSchema (default true). Keyboard-accessible disclosure.
import { useState } from 'react';
import type { SectionCtx } from './index';

interface FaqItem { id: string; question: string; answer: string; scopeTags: string[] }

export default function Faq({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const source = data.source || {};
  let items: FaqItem[] = ctx.faqs || [];
  if (source.scopeTag) items = items.filter((f) => (f.scopeTags || []).includes(source.scopeTag));
  if (Array.isArray(source.refs)) items = (ctx.faqs || []).filter((f) => source.refs.includes(f.id));
  if (source.limit) items = items.slice(0, source.limit);

  const [open, setOpen] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container" style={{ maxWidth: 820 }}>
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <div className="reveal">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.id} className={`acc-item${isOpen ? ' open' : ''}`}>
                <button
                  className="acc-btn"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{f.question}</span>
                  <span className="ico" aria-hidden>+</span>
                </button>
                <div className="acc-panel" style={{ maxHeight: isOpen ? 400 : 0 }}>
                  <div className="acc-panel-inner">{f.answer}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {data.emitSchema !== false && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: items.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: { '@type': 'Answer', text: f.answer },
              })),
            }),
          }}
        />
      )}
    </section>
  );
}
