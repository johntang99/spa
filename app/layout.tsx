import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import { fontVariables } from '@/lib/fonts';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Multi-Site Business Template',
  description: 'Multi-site, multi-language template with booking and admin CMS',
  icons: {
    icon: '/icon',
    shortcut: '/icon',
    apple: '/icon',
  },
};

function getLocaleFromPath(): Locale {
  try {
    const headersList = headers();
    const pathname = headersList.get('x-invoke-path') || headersList.get('x-next-url') || '';
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    if (firstSegment && locales.includes(firstSegment as Locale)) {
      return firstSegment as Locale;
    }
  } catch {
    // fall back to default locale
  }

  return defaultLocale;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const htmlLang = getLocaleFromPath();
  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className={fontVariables}>
        {/* Progressive enhancement: only hide .reveal content once JS confirms it can animate.
            Runs during HTML parse (before paint) so JS users get the animation with no flash,
            while no-JS / crawler / slow-connection users always see fully-visible content. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('reveal-ready')",
          }}
        />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
