'use client';

// S18 contactForm — short question form → leads{type:"question"}. Honeypot + inline states.
import { useState } from 'react';
import type { SectionCtx } from './index';

export default function ContactForm({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const loc = ctx.locale;
  const tr = (en: string, zh: string) => (loc === 'zh' ? zh : en);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setState('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'question',
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email') || undefined,
          message: fd.get('message'),
          company: fd.get('company'), // honeypot
          sourcePage: `/${loc}/contact`,
          locale: loc,
        }),
      });
      setState(res.ok ? 'done' : 'error');
      if (res.ok) form.reset();
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <section className={`section on-${ctx.mode || 'light'}`}>
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <h2>{tr('Thank you', '谢谢您')}</h2>
          <p>{data.successMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container" style={{ maxWidth: 640 }}>
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <form className="reveal" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="cf-name">{tr('Name', '姓名')} <span className="req">*</span></label>
            <input id="cf-name" name="name" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="cf-phone">{tr('Phone', '电话')} <span className="req">*</span></label>
            <input id="cf-phone" name="phone" type="tel" required />
          </div>
          <div className="field">
            <label htmlFor="cf-email">{tr('Email (optional)', '邮箱（选填）')}</label>
            <input id="cf-email" name="email" type="email" />
          </div>
          <div className="field">
            <label htmlFor="cf-msg">{tr('Message', '留言')} <span className="req">*</span></label>
            <textarea id="cf-msg" name="message" rows={4} required />
          </div>
          {/* honeypot */}
          <input name="company" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} aria-hidden />
          <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? tr('Sending…', '发送中…') : tr('Send message', '发送留言')}
          </button>
          {state === 'error' && <p className="small" style={{ color: '#A4452F', marginTop: 10 }}>{tr('Something went wrong. Please call us at (845) 800-6600.', '出了点问题，请致电 (845) 800-6600。')}</p>}
        </form>
      </div>
    </section>
  );
}
