'use client';

// Adds `.in` to `.reveal` elements as they enter the viewport (one-shot). Honors
// prefers-reduced-motion (reveals immediately). Mounted once per page.
import { useEffect } from 'react';

export default function RevealInit() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.spa-site .reveal'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
