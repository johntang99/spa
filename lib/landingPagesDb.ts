import { getSupabaseServerClient } from '@/lib/supabase/server';

const TABLE = 'site_landing_pages';

export type LandingPageRecord = {
  id: string;
  site_id: string;
  slug: string;
  language: string;
  content: Record<string, unknown>;
  variant_group: string | null;
  is_control: boolean;
  traffic_weight: number;
  idempotency_key: string | null;
  updated_at: string;
};

export async function upsertLandingPage(input: {
  siteId: string;
  slug: string;
  language: string;
  content: unknown;
  variantGroup?: string | null;
  isControl?: boolean;
  trafficWeight?: number;
  idempotencyKey?: string | null;
}): Promise<LandingPageRecord | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const row = {
    site_id: input.siteId,
    slug: input.slug,
    language: input.language,
    content: input.content,
    variant_group: input.variantGroup ?? null,
    is_control: input.isControl ?? true,
    traffic_weight: input.trafficWeight ?? 100,
    idempotency_key: input.idempotencyKey ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'site_id,slug,language', ignoreDuplicates: false })
    .select('*')
    .single();

  if (error) {
    console.error('[landingPagesDb] upsert failed', error.message);
    return null;
  }
  return data as LandingPageRecord;
}

export async function fetchLandingPage(
  siteId: string,
  slug: string,
  language: string,
): Promise<LandingPageRecord | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('language', language)
    .maybeSingle();
  if (error) {
    console.error('[landingPagesDb] fetch failed', error.message);
    return null;
  }
  return (data as LandingPageRecord | null) ?? null;
}

/** Find an existing row by idempotency key (used to short-circuit retries). */
export async function findByIdempotencyKey(
  siteId: string,
  key: string,
): Promise<LandingPageRecord | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from(TABLE)
    .select('*')
    .eq('site_id', siteId)
    .eq('idempotency_key', key)
    .maybeSingle();
  return (data as LandingPageRecord | null) ?? null;
}
