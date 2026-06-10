// System S "Jade Hour" font stack (A5 typography spec) wired via next/font.
// Display: Marcellus (EN) / Noto Serif SC 500 (ZH)
// Body:    Schibsted Grotesk (EN) / Noto Sans SC (ZH)
// CJK faces use preload:false (glyph sets are large; loaded on zh routes via :lang(zh)).
import { Marcellus, Schibsted_Grotesk, Noto_Serif_SC, Noto_Sans_SC } from 'next/font/google';

export const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-marcellus',
});

export const schibsted = Schibsted_Grotesk({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-schibsted',
});

export const notoSerifSC = Noto_Serif_SC({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-serif-sc',
});

export const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-sc',
});

// Combined className for <body> — exposes all four CSS variables.
export const fontVariables = [
  marcellus.variable,
  schibsted.variable,
  notoSerifSC.variable,
  notoSansSC.variable,
].join(' ');
