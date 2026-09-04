import { NextRequest, NextResponse } from 'next/server';
import { getRequestSiteId } from '@/lib/content';
import { finalizeBookingCheckoutSession } from '@/lib/booking/checkout';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionId = String(
    request.nextUrl.searchParams.get('session_id') ||
      request.nextUrl.searchParams.get('sessionId') ||
      ''
  ).trim();
  if (!sessionId) {
    return NextResponse.json({ ok: false, message: 'Missing session_id' }, { status: 400 });
  }

  const localeHint = String(request.nextUrl.searchParams.get('locale') || 'en');
  const siteId = await getRequestSiteId();
  try {
    const result = await finalizeBookingCheckoutSession({
      sessionId,
      siteIdHint: siteId,
      localeHint,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        created: false,
        message: 'Could not finalize booking checkout.',
      },
      { status: 500 }
    );
  }
}
