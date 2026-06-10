'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { SiteInfo } from '@/lib/types';
import { getSiteDisplayName } from '@/lib/siteInfo';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

export interface HeaderConfig {
  topbar?: {
    phone?: string;
    phoneHref?: string;
    address?: string;
    addressHref?: string;
    hours?: string;
    badge?: string;
  };
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
    fontWeight?: 'regular' | 'semibold';
    logo?: {
      emoji?: string;
      text?: string;
      subtext?: string;
      image?: {
        src?: string;
        alt?: string;
      };
    };
    items?: Array<{ text: string; url: string }>;
  };
  cta?: {
    text?: string;
    link?: string;
  };
}

interface HeaderProps {
  locale: Locale;
  siteId: string;
  supportedLocales?: Locale[];
  siteInfo?: SiteInfo;
  variant?: 'default' | 'centered' | 'transparent' | 'stacked';
  headerConfig?: HeaderConfig;
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
    fontWeight?: 'regular' | 'semibold';
    items: Array<{ text: string; url: string }>;
    cta?: {
      text: string;
      link: string;
    };
  };
}

export default function Header({
  locale,
  siteId,
  supportedLocales,
  siteInfo,
  variant = 'default',
  headerConfig,
  menu,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const topbarConfig = headerConfig?.topbar;
  const logoConfig = headerConfig?.menu?.logo;
  const logoImage = logoConfig?.image;

  const navigation =
    menu?.items && menu.items.length > 0
      ? menu.items
      : headerConfig?.menu?.items && headerConfig.menu.items.length > 0
        ? headerConfig.menu.items
        : [
            { text: locale === 'en' ? 'Home' : '首页', url: `/${locale}` },
            {
              text: locale === 'en' ? 'Services' : '服务项目',
              url: `/${locale}/services`,
            },
            {
              text: locale === 'en' ? 'Conditions' : '治疗病症',
              url: `/${locale}/conditions`,
            },
            {
              text: locale === 'en' ? 'About' : '关于我们',
              url: `/${locale}/about`,
            },
            {
              text: locale === 'en' ? 'Case Studies' : '案例研究',
              url: `/${locale}/case-studies`,
            },
            {
              text: locale === 'en' ? 'Gallery' : '图库',
              url: `/${locale}/gallery`,
            },
            {
              text: locale === 'en' ? 'Getting Started' : '新用户指南',
              url: `/${locale}/new-patients`,
            },
            {
              text: locale === 'en' ? 'Pricing' : '收费',
              url: `/${locale}/pricing`,
            },
            { text: locale === 'en' ? 'Blog' : '博客', url: `/${locale}/blog` },
            {
              text: locale === 'en' ? 'Contact' : '联系我们',
              url: `/${locale}/contact`,
            },
          ];

  const cta = menu?.cta || {
    text:
      headerConfig?.cta?.text || (locale === 'en' ? 'Book Online' : '在线预约'),
    link: headerConfig?.cta?.link || `/${locale}/contact`,
  };
  const menuFontWeightClass =
    (menu?.fontWeight || headerConfig?.menu?.fontWeight || 'semibold') ===
    'regular'
      ? 'font-normal'
      : 'font-semibold';
  const showLanguageSwitcher = Array.isArray(supportedLocales)
    ? supportedLocales.length > 1
    : true;

  const normalizePath = (value?: string | null) => {
    if (!value) return '';
    const noHash = value.split('#')[0];
    const noQuery = noHash.split('?')[0];
    if (!noQuery) return '';
    return noQuery.length > 1 ? noQuery.replace(/\/+$/, '') : noQuery;
  };

  const isMenuItemActive = (itemUrl: string) => {
    if (!itemUrl.startsWith('/')) return false;
    const current = normalizePath(pathname);
    const target = normalizePath(itemUrl);
    if (!current || !target) return false;
    if (current === target) return true;
    if (target !== `/${locale}` && current.startsWith(`${target}/`)) return true;
    return false;
  };

  const renderLogo = (
    sizeClass: string,
    width: number,
    height: number,
    sizes: string,
  ) => {
    const siteDisplayName = getSiteDisplayName(siteInfo, 'Site');
    if (logoImage?.src && logoImage.src.trim()) {
      return (
        <Image
          src={logoImage.src}
          alt={logoImage.alt || logoConfig?.text || siteDisplayName || 'Logo'}
          width={width}
          height={height}
          sizes={sizes}
          quality={95}
          className={`${sizeClass} object-contain hover:opacity-90 transition-opacity`}
        />
      );
    }

    const text = logoConfig?.text || siteDisplayName;
    const emoji = logoConfig?.emoji;
    return (
      <div className="inline-flex items-center gap-2 text-primary">
        {emoji && <span className="text-lg leading-none">{emoji}</span>}
        <span className="font-semibold">{text}</span>
      </div>
    );
  };

  const topbarPhone = topbarConfig?.phone || siteInfo?.phone;
  const topbarPhoneHref =
    topbarConfig?.phoneHref || (topbarPhone ? `tel:${topbarPhone}` : undefined);
  const topbarAddress =
    topbarConfig?.address ||
    (siteInfo?.address
      ? `${siteInfo.address}, ${siteInfo.city}, ${siteInfo.state} ${siteInfo.zip}`
      : undefined);
  const topbarAddressHref =
    topbarConfig?.addressHref || siteInfo?.addressMapUrl || '#';
  const hasExplicitBadgeConfig = Object.prototype.hasOwnProperty.call(
    topbarConfig || {},
    'badge',
  );
  const configuredBadge =
    typeof topbarConfig?.badge === 'string' ? topbarConfig.badge.trim() : '';
  const topbarBadge = hasExplicitBadgeConfig
    ? configuredBadge
    : locale === 'en'
      ? 'Now accepting new customers'
      : '欢迎新客户';

  useEffect(() => {
    if (variant !== 'transparent') return;
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  const topBar = (
    <div
      className={`hidden md:block overflow-hidden transition-all duration-[800ms] ease-out ${
        variant === 'transparent' && scrolled
          ? 'max-h-0 opacity-90'
          : 'max-h-16 opacity-100 translate-y-0'
      }`}
    >
      <div className="bg-primary text-white py-2">
        <div className="container-custom">
          <div className="flex flex-col gap-1 text-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {topbarAddress && (
                <a
                  href={topbarAddressHref}
                  className="flex items-center gap-2 text-white hover:text-white transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {topbarAddress}
                </a>
              )}
              {topbarPhone && (
                <a
                  href={topbarPhoneHref}
                  className="flex items-center gap-2 text-white hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {topbarPhone}
                </a>
              )}
              {siteInfo?.email && (
                <a
                  href={`mailto:${siteInfo.email}`}
                  className="flex items-center gap-2 text-white hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {siteInfo.email}
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 lg:justify-end">
              <div className="flex items-center gap-3">
                {siteInfo?.social?.facebook && (
                  <a
                    href={siteInfo.social.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-white transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {siteInfo?.social?.instagram && (
                  <a
                    href={siteInfo.social.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-white transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {siteInfo?.social?.youtube && (
                  <a
                    href={siteInfo.social.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-white transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {siteInfo?.social?.wechat && (
                  <a
                    href={siteInfo.social.wechat}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
              {topbarBadge && (
                <span className="badge bg-white/20 text-white">
                  {topbarBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const headerNode = (
    <header
      className={`transition-colors ${
        variant === 'transparent'
          ? scrolled && 'bg-white/95 backdrop-blur-md'
          : 'bg-white shadow-sm'
      }`}
    >
      {variant === 'centered' || variant === 'stacked' ? (
        <nav className="container-custom py-4">
          <div className="flex justify-center mb-4">
            <Link href={`/${locale}`}>
              {renderLogo(
                'w-auto h-16',
                240,
                80,
                '(min-width: 1024px) 240px, 200px',
              )}
            </Link>
          </div>

          <div className="hidden lg:flex items-center justify-center gap-6 flex-wrap">
            {navigation.map((item) => (
              <Link
                key={item.url}
                href={item.url}
                className={`${
                  isMenuItemActive(item.url) ? 'text-primary' : 'text-gray-700'
                } hover:text-primary ${menuFontWeightClass} transition-colors text-sm`}
              >
                {item.text}
              </Link>
            ))}

            {showLanguageSwitcher && (
              <LanguageSwitcher
                currentLocale={locale}
                availableLocales={supportedLocales}
              />
            )}

            <Link
              href={cta.link}
              className="btn-primary text-sm px-5 py-2.5 ml-4"
            >
              {cta.text}
            </Link>
          </div>

          <div className="flex lg:hidden justify-center gap-4 mt-4">
            {showLanguageSwitcher && (
              <LanguageSwitcher
                currentLocale={locale}
                availableLocales={supportedLocales}
              />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-primary"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>
      ) : (
        <nav className="container-custom">
          <div className="flex items-center justify-between h-20">
            <Link href={`/${locale}`} className="flex-shrink-0">
              {renderLogo(
                'w-auto h-12',
                180,
                60,
                '(min-width: 1280px) 180px, 140px',
              )}
            </Link>

            <div className="hidden xl:flex items-center gap-4 2xl:gap-6 flex-1 justify-center">
              {navigation.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className={`${
                    isMenuItemActive(item.url)
                      ? 'text-primary'
                      : 'text-gray-700'
                  } hover:text-primary ${menuFontWeightClass} transition-colors text-sm whitespace-nowrap`}
                >
                  {item.text}
                </Link>
              ))}
            </div>
            <div className="hidden xl:flex items-center gap-4">
              {showLanguageSwitcher && (
                <LanguageSwitcher
                  currentLocale={locale}
                  availableLocales={supportedLocales}
                />
              )}
              <Link
                href={cta.link}
                className="btn-primary text-sm px-5 py-1.5 whitespace-nowrap"
              >
                {cta.text}
              </Link>
            </div>

            <div className="flex xl:hidden items-center gap-4">
              {showLanguageSwitcher && (
                <LanguageSwitcher
                  currentLocale={locale}
                  availableLocales={supportedLocales}
                />
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-primary"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </nav>
      )}

      {mobileMenuOpen && (
        <div className="xl:hidden border-t bg-white">
          <div className="container-custom py-2">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className={`${
                    isMenuItemActive(item.url)
                      ? 'text-primary'
                      : 'text-gray-700'
                  } hover:text-primary ${menuFontWeightClass} py-1`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.text}
                </Link>
              ))}
              <Link
                href={cta.link}
                className="btn-primary text-center mt-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cta.text}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );

  if (variant === 'transparent') {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50">
          {topBar}
          {headerNode}
        </div>
        <div className="h-6 md:h-8" />
      </>
    );
  }

  return (
    <>
      {topBar}
      <div className="sticky top-0 z-50">{headerNode}</div>
    </>
  );
}
