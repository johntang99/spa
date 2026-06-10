import { ImageResponse } from 'next/og';
import { defaultLocale } from '@/lib/i18n';
import { getRequestSiteId, loadSiteInfo, loadTheme } from '@/lib/content';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const FALLBACK_PRIMARY_COLOR = '#8b1d1d';

function resolvePrimaryColor(theme: any): string {
  const primary =
    theme?.colors?.primary?.DEFAULT ||
    theme?.colors?.primary?.default ||
    theme?.colors?.primary;
  return typeof primary === 'string' && primary.trim() ? primary : FALLBACK_PRIMARY_COLOR;
}

function resolveIconCharacter(siteInfo: any): string {
  const explicit =
    siteInfo?.iconCharacter ||
    siteInfo?.brand?.iconCharacter ||
    siteInfo?.branding?.iconCharacter;
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim().toUpperCase();
  }
  // Product requirement: when no input is set, use H.
  return 'H';
}

export default async function Icon() {
  const siteId = await getRequestSiteId();
  const [theme, siteInfo] = await Promise.all([
    loadTheme(siteId),
    loadSiteInfo(siteId, defaultLocale),
  ]);
  const primaryColor = resolvePrimaryColor(theme);
  const iconCharacter = resolveIconCharacter(siteInfo);
  const iconLength = Math.max(1, iconCharacter.length);
  const iconFontSize = iconLength >= 4 ? 12 : iconLength === 3 ? 14 : iconLength === 2 ? 17 : 20;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: primaryColor,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: iconFontSize,
            fontWeight: 800,
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
            maxWidth: '90%',
            whiteSpace: 'nowrap',
            letterSpacing: iconLength > 1 ? 0.4 : 0,
          }}
        >
          {iconCharacter}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

