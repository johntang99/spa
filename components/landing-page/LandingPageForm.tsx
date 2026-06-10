'use client';

import { useState } from 'react';

type Props = {
  slug: string;
  language: string;
  fields: string[];
  optionalFields: string[];
  submitLabel: string;
  thankYouSlug: string | null;
};

export default function LandingPageForm({
  slug,
  language,
  fields,
  optionalFields,
  submitLabel,
  thankYouSlug,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      slug,
      language,
      gclid: readCookie('_baam_gclid'),
      utm: parseUtmCookie(),
    };
    for (const k of [...fields, ...optionalFields]) {
      payload[k] = fd.get(k) || null;
    }

    try {
      const r = await fetch('/api/lead-hub-forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error ?? `Submit failed (${r.status})`);
        return;
      }
      setDone(true);

      // GTM dataLayer push — paired with the gtm-template-v1 trigger.
      if (typeof window !== 'undefined') {
        const dl = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??=
          []);
        dl.push({
          event: 'lp_form_submit',
          landing_page_slug: slug,
          gclid: payload.gclid ?? null,
        });
      }

      if (thankYouSlug) {
        // Soft-redirect to thank-you path on the same site.
        window.location.href = `/${thankYouSlug.replace(/^\/+/, '')}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setPending(false);
    }
  };

  if (done && !thankYouSlug) {
    return (
      <p className="mt-5 rounded-md bg-green-50 p-4 text-sm text-green-900">
        {language === 'zh'
          ? '感谢您的预约请求！我们会尽快与您联系。'
          : 'Thanks — we received your request and will contact you shortly.'}
      </p>
    );
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={onSubmit} noValidate>
      {fields.map((f) => (
        <Field key={f} name={f} required language={language} />
      ))}
      {optionalFields.map((f) => (
        <Field key={f} name={f} required={false} language={language} />
      ))}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? (language === 'zh' ? '提交中…' : 'Submitting…') : submitLabel}
      </button>
    </form>
  );
}

function Field({
  name,
  required,
  language,
}: {
  name: string;
  required: boolean;
  language: string;
}) {
  const placeholder = labelFor(name, language);
  const isMessage = name === 'message';
  const inputType =
    name === 'email'
      ? 'email'
      : name === 'phone'
        ? 'tel'
        : 'text';

  if (isMessage) {
    return (
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border-gray-300 bg-white text-sm"
      />
    );
  }
  return (
    <input
      type={inputType}
      name={name}
      required={required}
      placeholder={placeholder}
      className="w-full rounded-md border-gray-300 bg-white text-sm"
    />
  );
}

function labelFor(name: string, language: string): string {
  const en: Record<string, string> = {
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    service_interest: 'Service interest',
    preferred_time: 'Preferred time',
    message: 'Message (optional)',
    language_preference: 'Language preference',
  };
  const zh: Record<string, string> = {
    name: '姓名',
    phone: '电话',
    email: '邮箱',
    service_interest: '希望了解的服务',
    preferred_time: '希望就诊时间',
    message: '留言（可选）',
    language_preference: '语言偏好',
  };
  const map = language === 'zh' ? zh : en;
  return map[name] ?? name;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + escaped + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function parseUtmCookie(): Record<string, string> | null {
  const raw = readCookie('_baam_utm');
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}
