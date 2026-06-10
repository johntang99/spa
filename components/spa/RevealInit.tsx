'use client';

// Adds `.in` to `.reveal` elements as they enter the viewport. Honors prefers-reduced-motion.
// Robustness: (1) eager rootMargin reveals elements just before they scroll into view;
// (2) a fallback timer reveals EVERYTHING shortly after load so content is never stuck hidden
// for users who don't scroll, for crawlers, or on slow connections (SEO-safe). Mounted once.
import { useEffect } from 'react';

export default function RevealInit() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.spa-site .reveal'));
    const revealAll = () => els.forEach((el) => el.classList.add('in'));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      // reveal ~15% of viewport-height early so content is ready as you scroll
      { rootMargin: '0px 0px 15% 0px', threshold: 0 }
    );
    els.forEach((el) => io.observe(el));

    // Fallback: ensure all content is visible shortly after load regardless of scroll.
    const fallback = window.setTimeout(revealAll, 900);

    return () => { io.disconnect(); window.clearTimeout(fallback); };
  }, []);
  return null;
}
