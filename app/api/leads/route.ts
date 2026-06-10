// System S leads API (Phase 1G / 0E-leads). Accepts booking/question/package/corporate
// -gifting submissions, validates against the contract leadSchema, honeypot + best-effort
// rate limit, inserts into the `leads` table, and emails a notification to the spa inbox.
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { leadSchema } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

// Best-effort in-memory rate limit (per IP, per process).
const hits = new Map<string, { count: number; ts: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const win = 60_000;
  const rec = hits.get(ip);
  if (!rec || now - rec.ts > win) { hits.set(ip, { count: 1, ts: now }); return false; }
  rec.count += 1;
  return rec.count > 8;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 }); }

  // Honeypot — bots fill hidden "company" field.
  if (body.company) return NextResponse.json({ success: true }); // silently accept, drop

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Validation failed', errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }, { status: 400 });
  }
  const lead = parsed.data;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ message: 'Server not configured' }, { status: 500 });

  const siteId = body.siteId || process.env.NEXT_PUBLIC_DEFAULT_SITE || 'spa-paradise';
  const { error } = await supabase.from('leads').insert({
    site_id: siteId,
    type: lead.type,
    service: lead.service ?? null,
    duration_tier: lead.durationTier ?? null,
    preferred_date: lead.preferredDate ?? null,
    time_window: lead.timeWindow ?? null,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || null,
    language_pref: lead.languagePref ?? null,
    therapist_pref: lead.therapistPref ?? null,
    notes: lead.notes ?? null,
    message: lead.message ?? null,
    source_page: lead.sourcePage ?? null,
    locale: lead.locale,
    utm: lead.utm ?? {},
    status: 'new',
  });
  if (error) {
    console.error('leads insert error:', error.message);
    return NextResponse.json({ message: 'Could not save your request' }, { status: 500 });
  }

  // Notification email (non-blocking; only if Resend configured).
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const to = process.env.CONTACT_FALLBACK_TO || 'spa.paradise.middletown@gmail.com';
      const from = process.env.RESEND_FROM || 'No-Reply<no-reply@baamplatform.com>';
      await resend.emails.send({
        from, to,
        subject: `New ${lead.type} lead — Spa Paradise`,
        text: [
          `Type: ${lead.type}`,
          `Name: ${lead.name}`,
          `Phone: ${lead.phone}`,
          lead.email ? `Email: ${lead.email}` : '',
          lead.service ? `Service: ${lead.service} (${lead.durationTier ?? '-'} min)` : '',
          lead.preferredDate ? `Preferred: ${lead.preferredDate} ${lead.timeWindow ?? ''}` : '',
          lead.message ? `Message: ${lead.message}` : '',
          lead.notes ? `Notes: ${lead.notes}` : '',
          `Source: ${lead.sourcePage ?? '-'} · Locale: ${lead.locale}`,
        ].filter(Boolean).join('\n'),
      });
    } catch (e) {
      console.warn('lead notification email failed:', (e as Error).message);
    }
  }

  return NextResponse.json({ success: true });
}
