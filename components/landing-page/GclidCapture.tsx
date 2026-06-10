'use client';

import { useEffect } from 'react';

/**
 * Reads ?gclid= from the URL on page load and persists it to a 90-day
 * cookie. The LP form then reads this cookie on submit so we can attach
 * gclid to the lead and run offline-conversion sync (Session 2.11).
 *
 * Also captures the canonical UTM params for completeness.
 */
export default function GclidCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const gclid = params.get('gclid');
    if (gclid) setCookie('_baam_gclid', gclid, 90);

    const utm: Record<string, string> = {};
    for (const k of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ]) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
    if (Object.keys(utm).length > 0) {
      setCookie('_baam_utm', encodeURIComponent(JSON.stringify(utm)), 90);
    }
  }, []);

  return null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 3600 * 1000).toUTCString();
  // SameSite=Lax + path=/ so the form route reads it on submit.
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}
