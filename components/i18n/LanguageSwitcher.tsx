'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Locale, switchLocale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  availableLocales?: Locale[];
}

export default function LanguageSwitcher({
  currentLocale,
  availableLocales = ['en', 'zh'],
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locales = availableLocales.filter(Boolean);

  if (locales.length <= 1) {
    return null;
  }

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    const newPath = switchLocale(pathname, newLocale);
    router.push(newPath);
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            currentLocale === locale
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {locale === 'zh' ? '中文' : locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
