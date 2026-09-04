import { NextRequest, NextResponse } from 'next/server';
import { getRequestSiteId } from '@/lib/content';
import { createBookingCheckoutSession } from '@/lib/booking/checkout';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const siteId = await getRequestSiteId();
    const { url } = await createBookingCheckoutSession({
      siteId,
      origin: request.nextUrl.origin,
      payload,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not start booking payment.';
    return NextResponse.json(
      { message: String(message || '').replace(/\s+/g, ' ').trim().slice(0, 200) },
      { status: 400 }
    );
  }
}
