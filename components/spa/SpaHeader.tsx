'use client';

// System S header — matches prototypes/*.html .site-header chrome. Mega-menu (Services →
// categories), language switcher that preserves the current route, Book Now CTA, OpenNowBadge,
// mobile hamburger with a persistent Book button. Token classes from globals.css (.spa-site).
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock3,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
} from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export interface SpaNavItem { url: string; text: string }
export interface SpaCategory { id: string; name: string }

export default function SpaHeader({
  locale,
  availableLocales,
  logoText,
  navItems,
  ctaLabel,
  ctaHref,
  categories,
  topbar,
  email,
  social,
}: {
  locale: Locale;
  availableLocales?: Locale[];
  logoText: string;
  navItems: SpaNavItem[];
  ctaLabel: string;
  ctaHref: string;
  categories: SpaCategory[];
  topbar?: {
    phone?: string;
    phoneHref?: string;
    address?: string;
    addressHref?: string;
    hours?: string;
    badge?: string;
  };
  email?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    wechat?: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const pathname = usePathname() || `/${locale}`;
  const pathWithoutLocale = pathname.replace(/^\/(en|zh|es)(?=\/|$)/, '') || '/';

  // Language switcher: keep current route and swap locale.
  const activeLocales = Array.isArray(availableLocales) && availableLocales.length
    ? availableLocales
    : ['en', 'zh', 'es'];
  const orderedLocales = (['en', 'es', 'zh'] as Locale[]).filter((loc) =>
    activeLocales.includes(loc)
  );
  const localeSwitchLabel: Record<Locale, string> = {
    en: 'EN',
    zh: '中文',
    es: 'ES',
  };
  const switchTitle: Record<Locale, string> = {
    en: 'Switch to English',
    zh: '切换到中文',
    es: 'Cambiar a español',
  };
  const localeLinks = orderedLocales.map((targetLocale) => ({
    locale: targetLocale,
    href:
      pathWithoutLocale === '/'
        ? `/${targetLocale}`
        : `/${targetLocale}${pathWithoutLocale}`,
  }));
  const topbarPhone = topbar?.phone || '';
  const topbarPhoneHref = topbar?.phoneHref || (topbarPhone ? `tel:${topbarPhone}` : '');
  const topbarAddress = topbar?.address || '';
  const topbarAddressHref = topbar?.addressHref || '';
  const topbarHours = topbar?.hours || '';
  const hasLocaleSwitcher = localeLinks.length > 1;
  const hasTopbarContent = Boolean(
    topbarPhone ||
      topbarAddress ||
      topbarHours ||
    hasLocaleSwitcher ||
      email ||
      social?.facebook ||
      social?.instagram ||
      social?.youtube ||
      social?.wechat
  );

  return (
    <header className="site-header">
      {hasTopbarContent && (
        <div className="site-topbar">
          <div className="container topbar-row">
            <div className="topbar-left">
              {topbarAddress && (
                <a href={topbarAddressHref || '#'} className="topbar-item">
                  <MapPin className="topbar-icon" aria-hidden />
                  <span>{topbarAddress}</span>
                </a>
              )}
              {topbarPhone && (
                <a href={topbarPhoneHref || '#'} className="topbar-item">
                  <Phone className="topbar-icon" aria-hidden />
                  <span>{topbarPhone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="topbar-item">
                  <Mail className="topbar-icon" aria-hidden />
                  <span>{email}</span>
                </a>
              )}
              {!topbarAddress && !topbarPhone && topbarHours && (
                <span className="topbar-item">
                  <Clock3 className="topbar-icon" aria-hidden />
                  <span>{topbarHours}</span>
                </span>
              )}
            </div>
            <div className="topbar-right">
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" className="topbar-social" aria-label="Facebook">
                  <Facebook className="topbar-social-icon" aria-hidden />
                </a>
              )}
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" className="topbar-social" aria-label="Instagram">
                  <Instagram className="topbar-social-icon" aria-hidden />
                </a>
              )}
              {social?.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer" className="topbar-social" aria-label="YouTube">
                  <Youtube className="topbar-social-icon" aria-hidden />
                </a>
              )}
              {social?.wechat && (
                <a href={social.wechat} target="_blank" rel="noreferrer" className="topbar-social" aria-label="WeChat">
                  <MessageCircle className="topbar-social-icon" aria-hidden />
                </a>
              )}
              {hasLocaleSwitcher ? (
                <div className="topbar-locales" aria-label="Language switcher">
                  {localeLinks.map((entry) => (
                    <Link
                      key={entry.locale}
                      href={entry.href}
                      title={switchTitle[entry.locale]}
                      className={`topbar-locale-link${entry.locale === locale ? ' is-active' : ''}`}
                      aria-current={entry.locale === locale ? 'true' : undefined}
                    >
                      {localeSwitchLabel[entry.locale]}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
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
