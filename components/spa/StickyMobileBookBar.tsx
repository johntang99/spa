'use client';

// Sticky mobile Book/Call bar (≤768px via .sticky-bar in globals.css). Hidden on /book.
// Adds a WeChat affordance on the zh locale. Respects safe-area insets (CSS).
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { isExternalBookingUrl } from '@/lib/spa/booking-url';

export default function StickyMobileBookBar({
  locale,
  phone,
  wechatId,
  bookingUrl,
}: {
  locale: Locale;
  phone?: string;
  wechatId?: string;
  bookingUrl?: string;
}) {
  const pathname = usePathname() || '';
  if (pathname.endsWith('/book')) return null; // hidden on the booking page

  const isZh = locale === 'zh';
  const phoneHref = `tel:${(phone || '').replace(/[^0-9]/g, '')}`;
  const href = bookingUrl || `/${locale}/book`;
  const external = isExternalBookingUrl(href);
  const label = isZh ? '立即预约' : 'Book Now';

  return (
    <div className="sticky-bar">
      {external ? (
        <a className="btn btn-primary" href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ) : (
        <Link className="btn btn-primary" href={href}>
          {label}
        </Link>
      )}
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
