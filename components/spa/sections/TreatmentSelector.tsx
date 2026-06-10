'use client';

// S24 TreatmentSelector — a 3-step guided finder over the services catalog tags
// (goal → time → results). Pure client-side, keyboard navigable. Results link to Book
// with service+duration prefill. No separate content stored (derives from catalog).
import { useState } from 'react';
import Link from 'next/link';
import type { SectionCtx } from './index';
import { bookHref, fmtPrice, type Service } from '@/lib/spa/catalog';

const GOALS = [
  { key: 'relaxation', en: 'Relax & unwind', zh: '放松减压' },
  { key: 'pain-relief', en: 'Ease pain or tension', zh: '缓解疼痛或紧绷' },
  { key: 'recovery', en: 'Recover from training', zh: '运动后恢复' },
  { key: 'skincare', en: 'Skin & glow', zh: '护肤焕颜' },
  { key: 'couples', en: 'Time for two', zh: '双人时光' },
  { key: 'quick', en: 'A quick reset', zh: '快速放松' },
];
const TIMES = [30, 60, 90];

export default function TreatmentSelector({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const loc = ctx.locale;
  const tr = (en: string, zh: string) => (loc === 'zh' ? zh : en);
  const [goal, setGoal] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);

  const services = (ctx.catalog?.services || []).filter((s) => s.enabled);
  const results: Service[] = goal
    ? services
        .filter((s) => (s.goalTags || []).includes(goal))
        .filter((s) => (time ? s.tiers.some((t) => t.minutes === time || t.minutes <= time + 30) : true))
        .sort((a, b) => a.order - b.order)
        .slice(0, 3)
    : [];

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '12px 18px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
    border: '1.5px solid var(--border-light)', background: active ? 'var(--ink-pine)' : 'var(--surface-card)',
    color: active ? 'var(--porcelain)' : 'var(--char)', fontWeight: 600,
  });

  return (
    <section className={`section on-${ctx.mode || 'well'}`}>
      <div className="container" style={{ maxWidth: 880 }}>
        {data.heading && <h2 className="reveal" style={{ textAlign: 'center' }}>{data.heading}</h2>}
        {data.intro && <p className="reveal" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24 }}>{data.intro}</p>}

        <fieldset style={{ border: 0, padding: 0, margin: '0 0 20px' }}>
          <legend className="eyebrow">{tr('1 · What brings you in?', '1 · 您今天想要什么？')}</legend>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            {GOALS.map((g) => (
              <button key={g.key} type="button" aria-pressed={goal === g.key} style={btn(goal === g.key)} onClick={() => setGoal(g.key)}>
                {tr(g.en, g.zh)}
              </button>
            ))}
          </div>
        </fieldset>

        {goal && (
          <fieldset style={{ border: 0, padding: 0, margin: '0 0 20px' }}>
            <legend className="eyebrow">{tr('2 · How much time?', '2 · 想用多长时间？')}</legend>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              {TIMES.map((m) => (
                <button key={m} type="button" aria-pressed={time === m} style={btn(time === m)} onClick={() => setTime(m)}>
                  {m} {tr('min', '分钟')}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {goal && (
          <div className="reveal in">
            <p className="eyebrow">{tr('We suggest', '为您推荐')}</p>
            {results.length ? (
              <div className="grid cols-3">
                {results.map((s) => {
                  const tier = (time && s.tiers.find((t) => t.minutes === time)) || s.tiers[0];
                  return (
                    <div key={s.id} className="card">
                      <div className="card-body">
                        <h3 style={{ marginBottom: 4 }}>{s.name}</h3>
                        <p className="small" style={{ marginBottom: 10 }}>{s.short}</p>
                        <Link className="btn btn-primary btn-sm" href={bookHref(loc, s.id, tier.minutes)}>
                          {tr('Book', '预约')} · {tier.minutes}m {fmtPrice(tier.price)}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>{tr('Tell us a bit more and we’ll match you at the desk.', '再多告诉我们一些，我们会在前台为您匹配。')}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
