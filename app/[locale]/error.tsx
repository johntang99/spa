'use client';

// Route error boundary. During the Phase 0D -> Phase 1 interim, some routes carry
// System S contract-shaped page data while their renderers are still being built
// (Phase 1: 1C services, 1E pricing, 1G contact/gallery). This boundary degrades
// gracefully instead of surfacing a raw crash. It remains as standard error handling.
import { useEffect } from 'react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route render error:', error);
  }, [error]);

  return (
    <div className="spa-site" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--s-font-display)', marginBottom: 12 }}>This page is being finalized</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          We're putting the finishing touches on this page. Please check back shortly, or reach us directly.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="/">Back to home</a>
          <button className="btn btn-outline" onClick={() => reset()}>Try again</button>
        </div>
      </div>
    </div>
  );
}
