/**
 * Lead Hub forwarder — multi-tenant aware.
 *
 * Sends an inbound lead to baam-platform so it appears in Lead Hub
 * (/dashboard/lead-hub) for the correct BAAM client, regardless of
 * which site (dr-huang-clinic, acu-flushing, etc.) it came from.
 *
 * Auth model:
 *   - Authorization: Bearer <BAAM_INDUSTRY_INGEST_KEY>  (shared, env var)
 *   - X-BAAM-Site-Id: <site.id>                         (per request)
 *
 * Shape matches baam-platform's /api/lead-hub/ingest zod schema.
 *
 * This function NEVER throws. The primary flow (email/Resend/SMS) must
 * succeed whether Lead Hub is reachable or not.
 */

export type LeadHubSource =
  | 'campaign_studio_lp'
  | 'organic_site_form'
  | 'phone_call'
  | 'gbp_message'
  | 'booking'
  | 'manual';

export type LeadHubPayload = {
  source: LeadHubSource;
  source_form_name?: string | null;
  source_landing_page?: string | null;
  gclid?: string | null;
  utm?: Record<string, unknown> | null;
  contact: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    language_preference?: 'en' | 'zh' | 'es' | null;
  };
  service_requested?: string | null;
  message?: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type LeadHubForwardResult = {
  ok: boolean;
  lead_id?: string;
  duplicate?: boolean;
  status?: number;
  error?: string;
};

const TIMEOUT_MS = 3000;

export async function forwardToLeadHub(
  siteId: string | null | undefined,
  payload: LeadHubPayload,
): Promise<LeadHubForwardResult> {
  const url = process.env.BAAM_LEAD_HUB_URL;
  const key = process.env.BAAM_INDUSTRY_INGEST_KEY;

  if (!url || !key) {
    // Intentionally silent at INFO — this is the common state for local
    // dev or preview envs where Lead Hub isn't wired yet.
    console.info('[lead-hub-forward] disabled (missing env)');
    return { ok: false, error: 'not-configured' };
  }

  if (!siteId) {
    console.warn('[lead-hub-forward] missing siteId — skipping');
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
      // Prevent Next caching of outbound calls
      cache: 'no-store',
    });

    let body: any = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON response */
    }

    if (!res.ok) {
      // Log status + message but not the request body or secret.
      console.warn(
        `[lead-hub-forward] non-2xx status=${res.status} message=${
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
      lead_id: body?.lead_id,
      duplicate: !!body?.duplicate,
      status: res.status,
    };
  } catch (e: any) {
    const reason = e?.name === 'AbortError' ? 'timeout' : e?.message || 'network_error';
    console.warn(`[lead-hub-forward] failed reason=${reason}`);
    return { ok: false, error: reason };
  } finally {
    clearTimeout(timeout);
  }
}
