'use client';

// S19 bookingForm (full) — service (grouped, ?service= prefill) · duration chips (?duration=) ·
// preferred date (today..+60d) · time window · name · phone · email? · language · therapist? · notes.
// Honeypot + inline states. Posts to /api/leads{type:"booking"}. Success: promise + gift cross-sell.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { SectionCtx } from './index';
import { fmtPrice } from '@/lib/spa/catalog';

function todayISO() { return new Date().toISOString().slice(0, 10); }
function plusDaysISO(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

export default function BookingForm({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const loc = ctx.locale;
  const tr = (en: string, zh: string) => (loc === 'zh' ? zh : en);
  const params = useSearchParams();
  const services = useMemo(() => (ctx.catalog?.services || []).filter((s) => s.enabled), [ctx.catalog]);
  const cats = ctx.catalog?.categories || [];

  const [serviceId, setServiceId] = useState<string>('');
  const [minutes, setMinutes] = useState<number | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  // Prefill from query (?service=&duration=)
  useEffect(() => {
    const qs = params?.get('service');
    const qd = params?.get('duration');
    if (qs && services.some((s) => s.id === qs)) setServiceId(qs);
    if (qd) setMinutes(Number(qd));
  }, [params, services]);

  const service = services.find((s) => s.id === serviceId);
  const tiers = service?.tiers || [];
  const selectedTier = tiers.find((t) => t.minutes === minutes) || tiers[0];

  // Grouped service options.
  const grouped = cats
    .filter((c) => !['combos-packages', 'add-ons'].includes(c.id))
    .map((c) => ({ cat: c, items: services.filter((s) => s.categoryId === c.id) }))
    .filter((g) => g.items.length);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          service: serviceId || fd.get('service'),
          durationTier: minutes || (selectedTier?.minutes ?? undefined),
          preferredDate: fd.get('preferredDate'),
          timeWindow: fd.get('timeWindow'),
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email') || undefined,
          languagePref: fd.get('languagePref') || loc,
          therapistPref: fd.get('therapistPref') || undefined,
          notes: fd.get('notes') || undefined,
          company: fd.get('company'),
          sourcePage: `/${loc}/book`,
          locale: loc,
        }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch { setState('error'); }
  }

  if (state === 'done') {
    return (
      <section className="section on-light">
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <h2>{data.successHeading}</h2>
          <p>{data.successBody}</p>
          <div className="card" style={{ marginTop: 24, textAlign: 'left' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div><strong>{tr('Looking for a gift?', '想送份礼物？')}</strong><p className="small" style={{ margin: 0 }}>{tr('Spa Paradise gift cards never expire.', '天堂水疗礼品卡永不过期。')}</p></div>
              <Link className="btn btn-outline" href={`/${loc}/gift-cards`}>{tr('Gift cards', '礼品卡')}</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section on-light">
      <div className="container split-75">
        <form className="reveal" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="bf-service">{tr('Treatment', '护理项目')} <span className="req">*</span></label>
            <select id="bf-service" name="service" required value={serviceId} onChange={(e) => { setServiceId(e.target.value); setMinutes(null); }}>
              <option value="">{tr('Choose a treatment…', '请选择护理…')}</option>
              {grouped.map((g) => (
                <optgroup key={g.cat.id} label={g.cat.name}>
                  {g.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {tiers.length > 0 && (
            <div className="field">
              <label>{tr('Length', '时长')}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tiers.map((t) => (
                  <button type="button" key={t.minutes} className={`chip${(minutes || selectedTier?.minutes) === t.minutes ? ' is-active' : ''}`} onClick={() => setMinutes(t.minutes)}>
                    {t.minutes}m <strong>{fmtPrice(t.price)}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="bf-date">{tr('Preferred date', '期望日期')} <span className="req">*</span></label>
            <input id="bf-date" name="preferredDate" type="date" required min={todayISO()} max={plusDaysISO(60)} />
          </div>
          <div className="field">
            <label htmlFor="bf-time">{tr('Time of day', '时间段')} <span className="req">*</span></label>
            <select id="bf-time" name="timeWindow" required defaultValue="">
              <option value="" disabled>{tr('Choose…', '请选择…')}</option>
              <option value="morning">{tr('Morning', '上午')}</option>
              <option value="afternoon">{tr('Afternoon', '下午')}</option>
              <option value="evening">{tr('Evening', '晚上')}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bf-name">{tr('Name', '姓名')} <span className="req">*</span></label>
            <input id="bf-name" name="name" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="bf-phone">{tr('Phone', '电话')} <span className="req">*</span></label>
            <input id="bf-phone" name="phone" type="tel" required />
          </div>
          <div className="field">
            <label htmlFor="bf-email">{tr('Email (optional)', '邮箱（选填）')}</label>
            <input id="bf-email" name="email" type="email" />
          </div>
          {(ctx.team || []).length > 0 && (
            <div className="field">
              <label htmlFor="bf-therapist">{tr('Therapist (optional)', '理疗师（选填）')}</label>
              <select id="bf-therapist" name="therapistPref" defaultValue="">
                <option value="">{tr('No preference', '不指定')}</option>
                {ctx.team.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="bf-notes">{tr('Notes (optional)', '备注（选填）')}</label>
            <textarea id="bf-notes" name="notes" rows={3} />
          </div>
          <input type="hidden" name="languagePref" value={loc} />
          <input name="company" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: '-9999px' }} />
          <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? tr('Sending…', '发送中…') : tr('Request this time', '提交预约')}
          </button>
          {state === 'error' && <p className="small" style={{ color: '#A4452F', marginTop: 10 }}>{tr('Something went wrong — please call (845) 800-6600.', '出了点问题——请致电 (845) 800-6600。')}</p>}
        </form>

        <aside className="reveal">
          <div className="card"><div className="card-body">
            <p style={{ margin: 0, fontWeight: 700 }}>{tr('No payment required to book', '预约无需付款')}</p>
            <p className="small">{ctx.siteInfo?.responsePromise || tr('We reply within 1 business hour.', '我们将在一个工作小时内回复。')}</p>
            {service && selectedTier && (
              <p className="small">{tr('Selected', '已选')}: <strong>{service.name}</strong> · {selectedTier.minutes}m · {fmtPrice(selectedTier.price)}</p>
            )}
            <p className="small">{tr('Licensed NY therapists · clean rooms · professional draping', '纽约州持牌理疗师 · 洁净房间 · 专业盖布')}</p>
          </div></div>
        </aside>
      </div>
    </section>
  );
}
