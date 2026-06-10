/**
 * Conversion forwarder — sends Campaign Studio LP conversion events to
 * baam-platform's POST /api/campaign-studio/conversions/record so they
 * land in `campaign_studio_conversions` and feed the Session 2.11
 * offline-conversion-sync cron.
 *
 * Auth model mirrors lead-hub-forward.ts:
 *   - Authorization: Bearer <BAAM_INDUSTRY_INGEST_KEY>
 *   - X-BAAM-Site-Id: <site.id>
 *
 * URL is taken from BAAM_CONVERSIONS_URL when set; otherwise derived
 * from BAAM_LEAD_HUB_URL by swapping the trailing path. Either env var
 * being missing is a no-op (matches lead-hub-forward's silent disable
 * for local/dev/preview).
 *
 * NEVER throws — fire-and-forget from the perspective of the calling
 * route; the user's form submit must succeed even if this is down.
 */

export type ConversionType = 'form' | 'call' | 'booking' | 'directions';

export type ConversionPayload = {
  conversion_type: ConversionType;
  gclid?: string | null;
  lead_id?: string | null;
  landing_page_slug?: string | null;
  campaign_id?: string | null;
  value_cents?: number | null;
  event_time?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ConversionForwardResult = {
  ok: boolean;
  duplicate?: boolean;
  conversion_id?: string;
  status?: number;
  error?: string;
};

const TIMEOUT_MS = 3000;

function resolveUrl(): string | null {
  const direct = process.env.BAAM_CONVERSIONS_URL;
  if (direct) return direct;
  const leadHub = process.env.BAAM_LEAD_HUB_URL;
  if (!leadHub) return null;
  // Derive: .../api/lead-hub/ingest → .../api/campaign-studio/conversions/record
  return leadHub.replace(
    /\/api\/lead-hub\/ingest\/?$/,
    '/api/campaign-studio/conversions/record',
  );
}

export async function forwardConversionToBAAM(
  siteId: string | null | undefined,
  payload: ConversionPayload,
): Promise<ConversionForwardResult> {
  const url = resolveUrl();
  const key = process.env.BAAM_INDUSTRY_INGEST_KEY;

  if (!url || !key) {
    console.info('[conversion-forward] disabled (missing env)');
    return { ok: false, error: 'not-configured' };
  }
  if (!siteId) {
    console.warn('[conversion-forward] missing siteId — skipping');
    return { ok: false, error: 'missing-site-id' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'X-BAAM-Site-Id': siteId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });

    let body: any = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON */
    }

    if (!res.ok) {
      console.warn(
        `[conversion-forward] non-2xx status=${res.status} message=${
          body?.message || 'n/a'
        }`,
      );
      return {
        ok: false,
        status: res.status,
        error: body?.message || `http_${res.status}`,
      };
    }

    return {
      ok: true,
      conversion_id: body?.conversion_id,
      duplicate: !!body?.duplicate,
      status: res.status,
    };
  } catch (e: any) {
    const reason =
      e?.name === 'AbortError' ? 'timeout' : e?.message || 'network_error';
    console.warn(`[conversion-forward] failed reason=${reason}`);
    return { ok: false, error: reason };
  } finally {
    clearTimeout(timeout);
  }
}
