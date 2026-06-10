import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface SEOPage {
  site_id: string;
  slug: string;
  page_type:
    | 'seo-local-landing'
    | 'seo-condition'
    | 'seo-resource'
    | 'seo-service'
    | 'seo-near-location';
  active: boolean;
}

export async function getSEOPagesForSite(
  siteId: string
): Promise<SEOPage[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('site_seo_pages')
    .select('*')
    .eq('site_id', siteId)
    .eq('active', true);

  if (error) {
    console.error('getSEOPagesForSite error:', error);
    return [];
  }

  return (data as SEOPage[]) ?? [];
}

/**
 * Returns a Map of service-id → SEO page URL for the given site.
 * Used by services page and homepage to link to SEO service pages
 * when they exist, falling back to /services#id when they don't.
 *
 * Handles ID mismatches across pages — e.g., homepage uses "herbal-medicine"
 * but services page uses "chinese-herbal-medicine" and the SEO slug is
 * "chinese-herbal-medicine-middletown-ny". All aliases map to the same URL.
 */
export async function getServiceSEOLinks(
  siteId: string,
  locale: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  // First, try locale-specific SEO pages from content_entries.
  // These pages store their service/condition ID in the JSON data,
  // which handles non-Latin slugs (e.g., Chinese character URLs).
  const localeMap = await getServiceSEOLinksFromContent(siteId, locale);
  for (const [key, value] of localeMap) {
    map.set(key, value);
  }

  // If we found locale-specific links, use them (they take priority)
  if (map.size > 0) return map;

  // Fall back to site_seo_pages table for English-slug matching
  const pages = await getSEOPagesForSite(siteId);

  // Map the primary service (acupuncture) to the core landing page
  const coreLanding = pages.find((p) => p.page_type === 'seo-local-landing');
  if (coreLanding) {
    const url = `/${locale}/${coreLanding.slug}`;
    map.set('acupuncture', url);
  }

  const servicePages = pages.filter((p) => p.page_type === 'seo-service');

  // Each entry: [canonical slug prefix, ...aliases used as service IDs in content JSON]
  const serviceAliases: [string, string[]][] = [
    ['chinese-herbal-medicine', ['chinese-herbal-medicine', 'herbal-medicine', 'herbs']],
    ['cupping-therapy', ['cupping-therapy', 'cupping']],
    ['moxibustion', ['moxibustion', 'moxa']],
    ['tui-na-massage', ['tui-na-massage', 'tui-na', 'tuina', 'tuina-massage']],
    ['gua-sha', ['gua-sha', 'guasha']],
    ['acupressure', ['acupressure']],
  ];

  for (const page of servicePages) {
    const url = `/${locale}/${page.slug}`;

    // Find which alias group this slug belongs to
    for (const [canonical, aliases] of serviceAliases) {
      if (page.slug.startsWith(canonical)) {
        // Map ALL aliases to this URL
        for (const alias of aliases) {
          map.set(alias, url);
        }
        break;
      }
    }

    // Also try direct prefix match for unknown services
    // e.g., "aromatherapy-middletown-ny" → map "aromatherapy"
    if (!Array.from(map.values()).includes(url)) {
      // Extract prefix before city slug (last two segments are city-state)
      const parts = page.slug.split('-');
      if (parts.length >= 3) {
        // Try progressively shorter prefixes
        for (let len = parts.length - 2; len >= 1; len--) {
          const prefix = parts.slice(0, len).join('-');
          if (prefix.length > 2) {
            map.set(prefix, url);
            break;
          }
        }
      }
    }
  }

  return map;
}

/**
 * Scan content_entries for locale-specific SEO pages and build service links
 * from their JSON data. Handles non-Latin slugs (e.g., Chinese characters).
 */
async function getServiceSEOLinksFromContent(
  siteId: string,
  locale: string
): Promise<Map<string, string>> {
  const supabase = getSupabaseServerClient();
  const map = new Map<string, string>();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from('content_entries')
    .select('path, data')
    .eq('site_id', siteId)
    .eq('locale', locale);

  if (error || !data) return map;

  // Service alias mapping for matching service IDs to content JSON service fields
  const serviceAliases: Record<string, string[]> = {
    'chinese-herbal-medicine': ['chinese-herbal-medicine', 'herbal-medicine', 'herbs'],
    'cupping-therapy': ['cupping-therapy', 'cupping'],
    'moxibustion': ['moxibustion', 'moxa'],
    'tui-na-massage': ['tui-na-massage', 'tui-na', 'tuina', 'tuina-massage'],
    'gua-sha': ['gua-sha', 'guasha'],
    'acupressure': ['acupressure'],
  };

  for (const entry of data) {
    const content = entry.data as Record<string, unknown> | null;
    if (!content) continue;
    const pageType = content.pageType as string | undefined;
    const url = `/${locale}/${entry.path}`;

    if (pageType === 'seo-local-landing') {
      map.set('acupuncture', url);
    } else if (pageType === 'seo-service') {
      const serviceId = content.service as string | undefined;
      if (serviceId && serviceAliases[serviceId]) {
        for (const alias of serviceAliases[serviceId]) {
          map.set(alias, url);
        }
      } else if (serviceId) {
        map.set(serviceId, url);
      }
    }
  }

  return map;
}

export async function registerSEOPage(
  siteId: string,
  slug: string,
  pageType: SEOPage['page_type']
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.error('registerSEOPage: no Supabase client available');
    return;
  }

  const { error } = await supabase
    .from('site_seo_pages')
    .upsert(
      { site_id: siteId, slug, page_type: pageType, active: true },
      { onConflict: 'site_id,slug' }
    );

  if (error) {
    console.error('registerSEOPage error:', error);
  }
}
