'use client';

// S19 bookingForm (full) — service (grouped, ?service= prefill) · duration chips (?duration=) ·
// preferred date (today..+60d) · time window · contact details · optional promo code.
// Honeypot + inline states. Proceeds to Stripe Checkout and finalizes after successful payment.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SectionCtx } from './index';
import { fmtPrice } from '@/lib/spa/catalog';

function todayISO() { return new Date().toISOString().slice(0, 10); }
function plusDaysISO(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

export default function BookingForm({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const loc = ctx.locale;
  const tr = useCallback((en: string, zh: string) => (loc === 'zh' ? zh : en), [loc]);
  const params = useSearchParams();
  const services = useMemo(() => (ctx.catalog?.services || []).filter((s) => s.enabled), [ctx.catalog]);
  const cats = ctx.catalog?.categories || [];

  const [serviceId, setServiceId] = useState<string>('');
  const [minutes, setMinutes] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [checkoutNotice, setCheckoutNotice] = useState<{
    tone: 'success' | 'warning' | 'error';
    title: string;
    body: string;
  } | null>(null);
  const [finalizingPayment, setFinalizingPayment] = useState(false);
  const finalizedSessionRef = useRef<string>('');

  // Prefill from query (?service=&duration=)
  useEffect(() => {
    const qs = params?.get('service');
    const qd = params?.get('duration');
    if (qs && services.some((s) => s.id === qs)) setServiceId(qs);
    if (qd) setMinutes(Number(qd));
  }, [params, services]);

  useEffect(() => {
    const checkout = params?.get('checkout') || '';
    const sessionId = params?.get('session_id') || '';

    if (checkout === 'cancelled') {
      setCheckoutNotice({
        tone: 'warning',
        title: tr('Payment cancelled', '付款已取消'),
        body: tr(
          'You cancelled payment, so the booking request was not submitted.',
          '您已取消支付，预约尚未提交。'
        ),
      });
      return;
    }

    if (checkout === 'error') {
      const msg = params?.get('message') || '';
      setCheckoutNotice({
        tone: 'error',
        title: tr('Could not start checkout', '无法发起支付'),
        body:
          decodeURIComponent(msg) ||
          tr(
            'Please try again, or call (845) 800-6600.',
            '请稍后重试，或致电 (845) 800-6600。'
          ),
      });
      return;
    }

    if (checkout !== 'success' || !sessionId || finalizedSessionRef.current === sessionId) {
      return;
    }

    finalizedSessionRef.current = sessionId;
    setFinalizingPayment(true);
    setCheckoutNotice({
      tone: 'warning',
      title: tr('Finalizing booking…', '正在确认预约…'),
      body: tr(
        'Payment succeeded. Please wait while we confirm your booking.',
        '支付成功，正在确认您的预约，请稍候。'
      ),
    });

    let active = true;
    fetch(
      `/api/booking/checkout/finalize?session_id=${encodeURIComponent(
        sessionId
      )}&locale=${encodeURIComponent(loc)}`,
      { cache: 'no-store' }
    )
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        if (payload?.ok) {
          setCheckoutNotice({
            tone: 'success',
            title: tr('Payment successful, booking submitted', '付款成功，预约已提交'),
            body: tr(
              `We received your payment${payload?.serviceName ? ` for ${payload.serviceName}` : ''}. Our team will confirm shortly.`,
              `我们已收到付款${payload?.serviceName ? `（${payload.serviceName}）` : ''}，团队将尽快与您确认。`
            ),
          });
          setState('idle');
          setErrorMessage('');
          return;
        }
        setCheckoutNotice({
          tone: 'warning',
          title: tr('Payment received, booking pending', '付款已完成，预约处理中'),
          body:
            payload?.message ||
            tr(
              'Please refresh in a moment, or call (845) 800-6600.',
              '请稍后刷新页面，或致电 (845) 800-6600。'
            ),
        });
      })
      .catch(() => {
        if (!active) return;
        setCheckoutNotice({
          tone: 'warning',
          title: tr('Payment received, booking pending', '付款已完成，预约处理中'),
          body: tr(
            'We are processing your booking. Please refresh in a moment.',
            '系统正在处理您的预约，请稍后刷新页面。'
          ),
        });
      })
      .finally(() => {
        if (!active) return;
        setFinalizingPayment(false);
      });

    return () => {
      active = false;
    };
  }, [params, loc, tr]);

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
    setErrorMessage('');
    setState('sending');
    try {
      const res = await fetch('/api/booking/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: loc,
          serviceId: serviceId || fd.get('service'),
          durationTier: minutes || selectedTier?.minutes || undefined,
          preferredDate: fd.get('preferredDate'),
          timeWindow: fd.get('timeWindow'),
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email'),
          therapistPref: fd.get('therapistPref') || undefined,
          notes: fd.get('notes') || undefined,
          promoCode: promoCode || undefined,
          company: fd.get('company'),
          sourcePage: `/${loc}/book`,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.url) {
        throw new Error(
          payload?.message ||
            tr(
              'Could not start secure checkout. Please try again.',
              '无法发起安全支付，请重试。'
            )
        );
      }
      window.location.assign(payload.url as string);
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : tr(
              'Something went wrong — please call (845) 800-6600.',
              '出了点问题——请致电 (845) 800-6600。'
            )
      );
    }
  }

  return (
    <section className="section on-light">
      <div className="container">
        {checkoutNotice ? (
          <div
            className="reveal"
            style={{
              marginBottom: 18,
              borderRadius: 'var(--radius-card)',
              border:
                checkoutNotice.tone === 'success'
                  ? '1px solid #86efac'
                  : checkoutNotice.tone === 'error'
                    ? '1px solid #fca5a5'
                    : '1px solid #fde68a',
              background:
                checkoutNotice.tone === 'success'
                  ? '#f0fdf4'
                  : checkoutNotice.tone === 'error'
                    ? '#fef2f2'
                    : '#fffbeb',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{checkoutNotice.title}</div>
            <div className="small">{checkoutNotice.body}</div>
          </div>
        ) : null}
        <div className="split-75">
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
            <label htmlFor="bf-email">{tr('Email', '邮箱')} <span className="req">*</span></label>
            <input id="bf-email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="bf-promo">{tr('Promo code (optional)', '优惠码（选填）')}</label>
            <input
              id="bf-promo"
              name="promoCode"
              type="text"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder={tr('Apply on checkout if valid', '若有效将在支付页应用')}
            />
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
          <button className="btn btn-primary" type="submit" disabled={state === 'sending' || finalizingPayment}>
            {state === 'sending' ? tr('Redirecting to payment…', '正在跳转支付…') : tr('Continue to secure payment', '继续安全支付')}
          </button>
          <p className="small" style={{ marginTop: 10 }}>
            {tr(
              'You can enter a promo code on the Stripe checkout page if you have one.',
              '如有优惠码，可在 Stripe 支付页输入。'
            )}
          </p>
          {state === 'error' && (
            <p className="small" style={{ color: '#A4452F', marginTop: 10 }}>
              {errorMessage ||
                tr(
                  'Something went wrong — please call (845) 800-6600.',
                  '出了点问题——请致电 (845) 800-6600。'
                )}
            </p>
          )}
          </form>

          <aside className="reveal">
            <div className="card"><div className="card-body">
              <p style={{ margin: 0, fontWeight: 700 }}>{tr('Secure payment required to confirm', '确认预约需先完成支付')}</p>
              <p className="small">{ctx.siteInfo?.responsePromise || tr('We reply within 1 business hour.', '我们将在一个工作小时内回复。')}</p>
              {service && selectedTier && (
                <p className="small">{tr('Selected', '已选')}: <strong>{service.name}</strong> · {selectedTier.minutes}m · {fmtPrice(selectedTier.price)}</p>
              )}
              <p className="small">{tr('Licensed NY therapists · clean rooms · professional draping', '纽约州持牌理疗师 · 洁净房间 · 专业盖布')}</p>
            </div></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
