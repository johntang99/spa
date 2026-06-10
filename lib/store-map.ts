/**
 * Maps incoming hostnames → pureherbhealth store slugs.
 *
 * Resolution priority (highest → lowest):
 *   1. STORE_DOMAIN_MAP env var (JSON) — instant override, no redeploy needed
 *   2. Static map below — for well-known permanent domains kept in version control
 *   3. Database (site_domains + sites.herb_store_slug) — set via admin UI, no code needed
 *
 * The DB fallback is used automatically when a new site is added through the
 * chinese-medicine admin → Shop, so no env var or code changes are required.
 */

function parseEnvMap(): Record<string, string> {
  try {
    const raw = process.env.STORE_DOMAIN_MAP;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch { return {}; }
}
const ENV_MAP = parseEnvMap();

const STATIC_MAP: Record<string, string> = {
  // ── Dr. Huang Clinic ────────────────────────────────────────────────────────
  "drhuangclinic.com":        "dr-huang-clinic",
  "www.drhuangclinic.com":    "dr-huang-clinic",
  "drhuangclinic.local":      "dr-huang-clinic",

  // ── Flushing Acupuncture ─────────────────────────────────────────────────────
  "acupunctureflushing.com":  "acu-flushing",
  "acu-flushing.local":       "acu-flushing",

  // ── Gangshi / Shiatsu ───────────────────────────────────────────────────────
  "shiacupuncture.com":       "acu-gangshi",
  "gangshi.local":            "acu-gangshi",

  // ── TCM Network ─────────────────────────────────────────────────────────────
  "tcm-network.local":        "tcm-network-herbs",
  "tcmnetwork.com":           "tcm-network-herbs",

  // ── Golden Lotus (test) ──────────────────────────────────────────────────────
  "goldenlotus.local":        "golden-lotus-test",

  // ── localhost fallback (dev) ─────────────────────────────────────────────────
  "localhost":                "dr-huang-clinic",   // default clinic for bare localhost:3003
};

/**
 * Synchronous lookup: env var → static map only.
 * Used as a fast path before the async DB fallback.
 */
export function getStoreSlugForHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase().trim();
  return ENV_MAP[hostname] ?? STATIC_MAP[hostname] ?? null;
}

/**
 * In-process cache for DB lookups (hostname → slug).
 * Keyed by hostname; value is the slug string or "" if not found.
 * Avoids repeated DB calls within the same server process.
 * New domains added via admin are picked up after a server restart,
 * or immediately if the cache entry expires (60 s TTL).
 */
const _dbCache = new Map<string, { slug: string; expiresAt: number }>();

/**
 * Looks up the store slug for a hostname via the Supabase REST API.
 * Path: site_domains.domain → sites.herb_store_slug
 * Works in Edge middleware (uses fetch, not Node.js Supabase client).
 */
async function lookupStoreSlugFromDb(hostname: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    // Step 1: find site_id matching this hostname in site_domains
    const domainRes = await fetch(
      `${supabaseUrl}/rest/v1/site_domains?domain=eq.${encodeURIComponent(hostname)}&enabled=eq.true&select=site_id&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store' }
    );
    const domainData = (await domainRes.json()) as Array<{ site_id: string }>;
    const siteId = domainData?.[0]?.site_id;
    if (!siteId) return null;

    // Step 2: get herb_store_slug from sites
    const siteRes = await fetch(
      `${supabaseUrl}/rest/v1/sites?id=eq.${siteId}&select=herb_store_slug&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store' }
    );
    const siteData = (await siteRes.json()) as Array<{ herb_store_slug: string | null }>;
    return siteData?.[0]?.herb_store_slug || null;
  } catch {
    return null;
  }
}

/**
 * Full resolution with DB fallback. Use this in middleware.
 * Priority: env var → static map → DB (with 60 s in-process cache).
 */
export async function resolveStoreSlugForHost(host: string | null | undefined): Promise<string | null> {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase().trim();

  // Fast path: env var / static map
  const fast = ENV_MAP[hostname] ?? STATIC_MAP[hostname] ?? null;
  if (fast) return fast;

  // DB path with TTL cache
  const now = Date.now();
  const cached = _dbCache.get(hostname);
  if (cached && cached.expiresAt > now) return cached.slug || null;

  const slug = await lookupStoreSlugFromDb(hostname);
  _dbCache.set(hostname, { slug: slug ?? '', expiresAt: now + 60_000 });
  return slug;
}
