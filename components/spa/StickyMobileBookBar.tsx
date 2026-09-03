'use client';

// Sticky mobile Book/Call bar (≤768px via .sticky-bar in globals.css). Hidden on /book.
// Adds a WeChat affordance on the zh locale. Respects safe-area insets (CSS).
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';

export default function StickyMobileBookBar({
  locale,
  phone,
  wechatId,
}: {
  locale: Locale;
  phone?: string;
  wechatId?: string;
}) {
  const pathname = usePathname() || '';
  if (pathname.endsWith('/book')) return null; // hidden on the booking page

  const isZh = locale === 'zh';
  const phoneHref = `tel:${(phone || '').replace(/[^0-9]/g, '')}`;

  return (
    <div className="sticky-bar">
      <Link className="btn btn-primary" href={`/${locale}/book`}>
        {isZh ? '立即预约' : 'Book Now'}
      </Link>
      <a className="btn btn-outline" href={phoneHref} style={{ color: 'var(--porcelain)', borderColor: 'var(--border-dark)' }}>
        {isZh ? '致电' : 'Call'}
      </a>
      {isZh && wechatId ? (
        <a className="btn btn-outline" href="#wechat" style={{ color: 'var(--porcelain)', borderColor: 'var(--border-dark)' }}>
          微信
        </a>
      ) : null}
    </div>
  );
}
