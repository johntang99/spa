'use client';

// Absolutely-positioned hero background: a single image, a crossfading gallery, or a muted
// looping video, with a scrim on top. Client component (the crossfade uses a timer).
import { useEffect, useState } from 'react';

export function HeroBackdrop({
  images = [],
  video,
  scrim = 0.45,
}: {
  images?: string[];
  video?: string;
  scrim?: number;
}) {
  const slides = images.filter(Boolean);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {video ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
          <source src={video} />
        </video>
      ) : (
        slides.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === active ? 1 : 0, transition: 'opacity 1.2s ease',
            }}
          />
        ))
      )}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(20,30,26,${scrim})` }} />
    </div>
  );
}
