'use client';

import { useEffect, useRef, useState } from 'react';

interface ReviewsWidgetFrameProps {
  src: string;
}

/**
 * Wraps the BAAM Review widget iframe and auto-resizes its height in response
 * to baam-widget-resize messages posted by the widget content. Without this
 * the iframe would either clip or leave an awkward gap.
 */
export function ReviewsWidgetFrame({ src }: ReviewsWidgetFrameProps) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(420);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e?.data || e.data.type !== 'baam-widget-resize') return;
      const h = Number(e.data.height);
      if (Number.isFinite(h) && h > 0 && h < 4000) {
        setHeight(h);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      src={src}
      title="Customer reviews"
      loading="lazy"
      scrolling="no"
      style={{
        display: 'block',
        width: '100%',
        border: 0,
        background: 'transparent',
        height,
      }}
      allow="clipboard-write"
    />
  );
}
