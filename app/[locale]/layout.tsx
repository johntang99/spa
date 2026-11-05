import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { defaultLocale, isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getDefaultSite, getSiteById } from '@/lib/sites';
import {
  getRequestSiteId,
  loadContent,
  loadFooter,
  loadSeo,
  loadTheme,
  loadSiteInfo,
} from '@/lib/content';
import type { FooterSection, SeoConfig, SiteInfo } from '@/lib/types';
import { type HeaderConfig } from '@/components/layout/Header';
import SpaHeader from '@/components/spa/SpaHeader';
import SpaFooter from '@/components/spa/SpaFooter';
import StickyMobileBookBar from '@/components/spa/StickyMobileBookBar';
import GtmLoader from '@/components/analytics/GtmLoader';
import { getBaseUrlFromHost } from '@/lib/seo';
import { getSiteDisplayName } from '@/lib/siteInfo';
import { bookingHrefOrFallback, resolveBookingUrl } from '@/lib/spa/booking-url';

const DAY_OF_WEEK: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

type HoursSlot = { open?: string; close?: string; closed?: boolean };

function normalizeTime(value: string): string | null {
  const t = String(value || '').trim();
  if (!t) return null;
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = m[2];
  const marker = m[3].toUpperCase();
  if (marker === 'PM' && hours < 12) hours += 12;
  if (marker === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function buildOpeningHours(hours: unknown): Array<Record<string, string>> {
  if (!hours || typeof hours !== 'object') return [];
  const rows: Array<Record<string, string>> = [];
  for (const [day, slot] of Object.entries(hours as Record<string, HoursSlot>)) {
    const dayName = DAY_OF_WEEK[day];
    if (!dayName || !slot || typeof slot !== 'object' || slot.closed) continue;
    const open = normalizeTime(slot.open || '');
    const close = normalizeTime(slot.close || '');
    if (!open || !close) continue;
    rows.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${dayName}`,
      opens: open,
      closes: close,
    });
  }
  return rows;
}

function buildSameAs(social: unknown): string[] {
  if (!social || typeof social !== 'object') return [];
  return Object.values(social as Record<string, unknown>).filter(
    (url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url)
  );
}

function buildGeo(siteInfo: SiteInfo | null): Record<string, unknown> | null {
  const source = siteInfo as unknown as Record<string, unknown> | null;
  if (!source) return null;
  const lat = source.lat ?? source.latitude;
  const lng = source.lng ?? source.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return {
    '@type': 'GeoCoordinates',
    latitude: lat,
    longitude: lng,
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const requestSiteId = await getRequestSiteId();
  const site = (await getSiteById(requestSiteId)) || (await getDefaultSite());
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;

  if (!site) {
    return {
      metadataBase: baseUrl,
      title: 'Business Website',
      description: 'Multi-site business website',
      icons: {
        icon: '/icon',
        shortcut: '/icon',
        apple: '/icon',
      },
    };
  }

  const [siteInfo, seo] = await Promise.all([
    loadSiteInfo(site.id, locale) as Promise<SiteInfo | null>,
    loadSeo(site.id, locale) as Promise<SeoConfig | null>,
  ]);
  const titleBase = getSiteDisplayName(siteInfo, site.name);
  const description =
    seo?.description ||
    siteInfo?.description ||
    'Professional services, scheduling, and customer support.';
  const titleDefault = seo?.title || titleBase;
  const canonical = new URL(`/${locale}`, baseUrl).toString();
  const languageAlternates = locales.reduce<Record<string, string>>((acc, entry) => {
    acc[entry] = new URL(`/${entry}`, baseUrl).toString();
    return acc;
  }, {});

  return {
    metadataBase: baseUrl,
    title: {
      default: titleDefault,
      template: `%s | ${titleBase}`,
    },
    description,
    alternates: {
      canonical,
      languages: {
        ...languageAlternates,
        'x-default': new URL(`/${defaultLocale}`, baseUrl).toString(),
      },
    },
    openGraph: {
      title: titleDefault,
      description,
      url: canonical,
      siteName: titleBase,
      locale,
      type: 'website',
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    icons: {
      icon: '/icon',
      shortcut: '/icon',
      apple: '/icon',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  
  const host = headers().get('host');
  const requestSiteId = await getRequestSiteId();
  const site = (await getSiteById(requestSiteId)) || (await getDefaultSite());
  
  if (!site) {
    return <div>No site configured</div>;
  }
  
  // Load theme
  const theme = await loadTheme(site.id);
  
  // Load site info for header/footer
  const [siteInfo, seo, footer, headerConfig, servicesCatalog] = await Promise.all([
    loadSiteInfo(site.id, locale as Locale) as Promise<SiteInfo | null>,
    loadSeo(site.id, locale as Locale) as Promise<SeoConfig | null>,
    loadFooter<FooterSection>(site.id, locale as Locale),
    loadContent<HeaderConfig>(site.id, locale as Locale, 'header.json'),
    loadContent<{ categories?: Array<{ id: string; name: string }> }>(site.id, locale as Locale, 'collections/services.json'),
  ]);
  const spaLocale = locale as Locale;
  const siteAny = (siteInfo ?? {}) as Record<string, any>;
  const headerAny = (headerConfig ?? {}) as Record<string, any>;
  // Mega-menu shows treatment categories (exclude the packages/add-ons meta categories).
  const megaCategories = (servicesCatalog?.categories || []).filter(
    (c) => !['combos-packages', 'add-ons'].includes(c.id)
  );
  const baseUrl = getBaseUrlFromHost(host);
  
  const spacingDensityMap: Record<string, string> = {
    compact: '3rem',
    comfortable: '5rem',
    spacious: '8rem',
  };

  const themeSpacingDensity = String(theme?.layout?.spacingDensity || 'comfortable');
  const themeSectionPaddingY = spacingDensityMap[themeSpacingDensity] || spacingDensityMap.comfortable;
  const themeRadius = theme?.shape?.radius || '8px';
  const themeShadow = theme?.shape?.shadow || '0 4px 20px rgba(0,0,0,0.08)';

  // System S "Jade Hour" primitive tokens — emitted from theme.tokens.primitives so
  // a preset swap (theme.json) reskins the whole site with zero markup change.
  // Semantic/component tokens live in globals.css and reference these primitives.
  const primitives = (theme as { tokens?: { primitives?: Record<string, string> } })?.tokens?.primitives;
  const primitivesCss = primitives
    ? Object.entries(primitives)
        .map(([key, value]) => `      --${key}: ${value};`)
        .join('\n')
    : '';

  // Generate inline style for theme variables
  const themeStyle = theme ? `
    :root {
      /* Typography */
      --text-display: ${theme.typography?.display || '3rem'};
      --text-heading: ${theme.typography?.heading || '2.25rem'};
      --text-subheading: ${theme.typography?.subheading || '1.25rem'};
      --text-body: ${theme.typography?.body || '1rem'};
      --text-small: ${theme.typography?.small || '0.875rem'};
      --font-display: ${theme.typography?.fonts?.display || 'var(--font-body-default)'};
      --font-heading: ${theme.typography?.fonts?.heading || 'var(--font-body-default)'};
      --font-subheading: ${theme.typography?.fonts?.subheading || 'var(--font-body-default)'};
      --font-body: ${theme.typography?.fonts?.body || 'var(--font-body-default)'};
      --font-small: ${theme.typography?.fonts?.small || 'var(--font-body-default)'};
      
      /* Primary Colors */
      --primary: ${theme.colors.primary.DEFAULT};
      --primary-dark: ${theme.colors.primary.dark};
      --primary-light: ${theme.colors.primary.light};
      --primary-50: ${theme.colors.primary['50']};
      --primary-100: ${theme.colors.primary['100']};
      
      /* Secondary Colors */
      --secondary: ${theme.colors.secondary.DEFAULT};
      --secondary-dark: ${theme.colors.secondary.dark};
      --secondary-light: ${theme.colors.secondary.light};
      --secondary-50: ${theme.colors.secondary['50']};
      
      /* Backdrop Colors */
      --backdrop-primary: ${theme.colors.backdrop.primary};
      --backdrop-secondary: ${theme.colors.backdrop.secondary};

      /* Shape */
      --radius-base: ${themeRadius};
      --shadow-base: ${themeShadow};

      /* Layout */
      --section-padding-y: ${themeSectionPaddingY};

      /* System S primitive tokens (Jade Hour / active preset) */
${primitivesCss}
    }
  ` : '';
  
  return (
    <>
      {/* GTM loader — only injects when site.gtmContainerId is set */}
      <GtmLoader containerId={site.gtmContainerId} />

      {/* Inject theme CSS variables */}
      {theme && (
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      )}

      {siteInfo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify((() => {
              const openingHoursSpecification = buildOpeningHours((siteInfo as unknown as Record<string, unknown>)?.hours);
              const sameAs = buildSameAs((siteInfo as unknown as Record<string, unknown>)?.social);
              const geo = buildGeo(siteInfo);
              const schema: Record<string, unknown> = {
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: getSiteDisplayName(siteInfo, site.name),
              url: new URL(`/${locale}`, baseUrl).toString(),
              description: siteInfo.description,
              telephone: siteInfo.phone,
              email: siteInfo.email,
              address: {
                '@type': 'PostalAddress',
                streetAddress: siteInfo.address,
                addressLocality: siteInfo.city,
                addressRegion: siteInfo.state,
                postalCode: siteInfo.zip,
                addressCountry: 'US',
              },
              };
              if (openingHoursSpecification.length) schema.openingHoursSpecification = openingHoursSpecification;
              if (sameAs.length) schema.sameAs = sameAs;
              if (geo) schema.geo = geo;
              return schema;
            })()),
          }}
        />
      )}
      
      <div className="spa-site min-h-screen flex flex-col relative" lang={locale}>
        <SpaHeader
          locale={spaLocale}
          availableLocales={(site.supportedLocales || ['en']) as Locale[]}
          logoText={headerAny?.menu?.logo?.text || siteAny.clinicName || 'Spa Paradise'}
          navItems={headerAny?.menu?.items || []}
          ctaLabel={headerAny?.cta?.text || (spaLocale === 'zh' ? '立即预约' : 'Book Now')}
          ctaHref={bookingHrefOrFallback(
            siteAny.externalBookingUrl,
            headerAny?.cta?.link || resolveBookingUrl(siteAny.externalBookingUrl, spaLocale)
          )}
          categories={megaCategories}
          topbar={headerAny?.topbar || {}}
          email={siteAny.email || ''}
          social={siteAny.social || {}}
        />
        <div id="main-content" tabIndex={-1} className="flex-grow">
          {children}
        </div>
        <SpaFooter locale={spaLocale} footer={footer as any} siteInfo={siteAny} />
        <StickyMobileBookBar
          locale={spaLocale}
          phone={siteAny.phone}
          wechatId={siteAny.wechatId}
          bookingUrl={resolveBookingUrl(siteAny.externalBookingUrl, spaLocale)}
        />
      </div>
    </>
  );
}
