import { NextRequest, NextResponse } from 'next/server';
import { getSiteByHost } from '@/lib/sites';
import { forwardToLeadHub, type LeadHubPayload } from '@/lib/lead-hub-forward';
import { forwardConversionToBAAM } from '@/lib/conversion-forward';

export const runtime = 'nodejs';

/**
 * Receives form submissions from Campaign Studio landing pages and
 * forwards them to baam-platform's Lead Hub.
 *
 * The LP form (components/landing-page/LandingPageForm) POSTs JSON here.
 *
 * Body shape (loose):
 *   {
 *     slug: string,
 *     language: 'en' | 'zh' | 'es',
 *     gclid?: string | null,
 *     utm?: object | null,
 *     // any of the form fields the LP defined:
 *     name?, phone?, email?, service_interest?, preferred_time?, message?
 *   }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const host = req.headers.get('host');
  const site = await getSiteByHost(host);
  if (!site) {
    return NextResponse.json({ error: 'site_not_resolved' }, { status: 400 });
  }

  const slug = String(body.slug ?? '');
  const language = (body.language as string) ?? 'en';
  const langCode: 'en' | 'zh' | 'es' =
    language === 'zh' || language === 'es' ? language : 'en';

  const payload: LeadHubPayload = {
    source: 'campaign_studio_lp',
    source_form_name: 'lp_consultation',
    source_landing_page: `/lp/${slug}`,
    gclid: (body.gclid as string | null | undefined) ?? null,
    utm:
      (body.utm as Record<string, unknown> | null | undefined) ?? null,
    contact: {
      name: pickString(body.name),
      phone: pickString(body.phone),
      email: pickString(body.email),
      language_preference: langCode,
    },
    service_requested: pickString(body.service_interest),
    message: pickString(body.message),
    raw_payload: body,
  };

  const result = await forwardToLeadHub(site.id, payload);

  // Always 200 to the browser — we don't want to leak forwarding failures
  // or back-pressure the visitor. The forwarder logs internally.
  if (!result.ok) {
    console.warn('[lead-hub-forward route] forward failed', result.error);
    return NextResponse.json(
      { ok: false, error: result.error ?? 'forward_failed' },
      { status: 502 },
    );
  }

  // Best-effort: also record the conversion on baam-platform so it's
  // visible to Smart Bidding via the offline-conversion-sync cron.
  // Skip for duplicate lead-hub responses (no fresh conversion to count).
  if (!result.duplicate && payload.source === 'campaign_studio_lp') {
    void forwardConversionToBAAM(site.id, {
      conversion_type: 'form',
      gclid: payload.gclid ?? null,
      lead_id: result.lead_id ?? null,
      landing_page_slug: payload.source_landing_page ?? null,
    });
  }

  return NextResponse.json({
    ok: true,
    lead_id: result.lead_id,
    duplicate: !!result.duplicate,
  });
}

function pickString(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}
