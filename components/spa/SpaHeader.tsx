'use client';

// System S header — matches prototypes/*.html .site-header chrome. Mega-menu (Services →
// categories), language switcher that preserves the current route, Book Now CTA, OpenNowBadge,
// mobile hamburger with a persistent Book button. Token classes from globals.css (.spa-site).
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import OpenNowBadge from './OpenNowBadge';
import type { HoursEntry } from '@/lib/spa/hours';

export interface SpaNavItem { url: string; text: string }
export interface SpaCategory { id: string; name: string }

export default function SpaHeader({
  locale,
  logoText,
  navItems,
  ctaLabel,
  ctaHref,
  hours,
  timezone,
  categories,
}: {
  locale: 'en' | 'zh';
  logoText: string;
  navItems: SpaNavItem[];
  ctaLabel: string;
  ctaHref: string;
  hours: HoursEntry[];
  timezone: string;
  categories: SpaCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const pathname = usePathname() || `/${locale}`;

  // Language switcher: swap the leading locale segment, preserve the rest of the route.
  const other = locale === 'en' ? 'zh' : 'en';
  const segments = pathname.split('/');
  segments[1] = other;
  const otherHref = segments.join('/') || `/${other}`;
  const otherLabel = other === 'zh' ? '中文' : 'EN';

  return (
    <header className="site-header">
      <div className="container bar">
        <Link className="logo" href={`/${locale}`}>
          <span>{logoText}</span>
          <span className="mark" aria-hidden>◦</span>
        </Link>

        <nav className={`nav${open ? ' open' : ''}`} id="nav">
          {navItems.map((item) => {
            const isServices = /\/services$/.test(item.url);
            if (isServices && categories.length) {
              return (
                <div
                  key={item.url}
                  onMouseEnter={() => setMegaOpen(true)}
                  onMouseLeave={() => setMegaOpen(false)}
                  style={{ position: 'relative' }}
                >
                  <Link href={item.url} aria-current={pathname === item.url ? 'page' : undefined}>
                    {item.text}
                  </Link>
                  {megaOpen && (
                    <div
                      role="menu"
                      style={{
                        position: 'absolute', top: '100%', left: 0, minWidth: 240,
                        background: 'var(--surface-card)', border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-1)', padding: 12, zIndex: 80,
                      }}
                    >
                      {categories.map((c) => (
                        <Link
                          key={c.id}
                          href={`/${locale}/services/${c.id}`}
                          style={{ display: 'block', padding: '8px 10px', textDecoration: 'none', borderRadius: 8 }}
                        >
                          {c.name}
                        </Link>
                      ))}
                      <Link
                        href={item.url}
                        style={{ display: 'block', padding: '8px 10px', fontWeight: 700, color: 'var(--candle-deep)' }}
                      >
                        {locale === 'zh' ? '查看全部 →' : 'View all →'}
                      </Link>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link key={item.url} href={item.url} aria-current={pathname === item.url ? 'page' : undefined}>
                {item.text}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <OpenNowBadge hours={hours} timezone={timezone} locale={locale} />
          <Link className="lang-switch" href={otherHref} title={other === 'zh' ? '切换到中文' : 'Switch to English'}>
            {otherLabel}
          </Link>
          <Link className="btn btn-primary btn-sm" href={ctaHref}>{ctaLabel}</Link>
          <button
            className="nav-toggle"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
