// Default branded OG image (Phase 3C) — Jade Hour gradient + brand, 1200×630.
// Used as the social-share fallback for any page without a page-specific ogImage.
import { ImageResponse } from 'next/og';

export const alt = 'Spa Paradise — Middletown Day Spa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage({ params }: { params: { locale: string } }) {
  const zh = params.locale === 'zh';
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: 80,
          background: 'linear-gradient(135deg, #1E2D28 0%, #2C4138 58%, #A98444 100%)',
          color: '#F7F4EE', fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 32, letterSpacing: 6, textTransform: 'uppercase', color: '#C9A35C' }}>
          {zh ? '米德尔敦日间水疗' : 'Middletown Day Spa'}
        </div>
        <div style={{ fontSize: 96, marginTop: 12, fontWeight: 400 }}>
          {zh ? '天堂水疗' : 'Spa Paradise'}
        </div>
        <div style={{ fontSize: 34, marginTop: 18, color: '#9FB0A9', maxWidth: 940 }}>
          {zh
            ? '持牌按摩、反射疗法、面部与身体护理——每天营业。'
            : 'Licensed massage, reflexology, facials & body care — open every day.'}
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 40, fontSize: 26, color: '#F7F4EE' }}>
          <span>★ 4.8 · 212 {zh ? '条评价' : 'reviews'}</span>
          <span style={{ color: '#9FB0A9' }}>·</span>
          <span>12 Grove St, Middletown, NY</span>
        </div>
      </div>
    ),
    size
  );
}
