'use client';

import { useEffect } from 'react';

/**
 * Pushes Campaign Studio LP analytics events into window.dataLayer for
 * GTM to pick up. Pairs with `gtm-template-v1.json` triggers in
 * baam-platform/docs/integration.
 *
 * Mounts once per LP render; no UI. Form submit is handled separately
 * inside LandingPageForm.tsx (which knows when the POST succeeds).
 */
export default function LpAnalytics({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dl = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??=
      []);

    dl.push({
      event: 'lp_page_view',
      landing_page_slug: slug,
    });

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';

      if (href.startsWith('tel:')) {
        dl.push({
          event: 'lp_phone_click',
          landing_page_slug: slug,
          phone_href: href,
        });
        return;
      }

      // Heuristic: outbound Google/Apple maps links count as directions.
      if (
        /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.|maps\.apple\.com)/i.test(
          href,
        )
      ) {
        dl.push({
          event: 'lp_directions_click',
          landing_page_slug: slug,
          directions_href: href,
        });
      }
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [slug]);

  return null;
}
