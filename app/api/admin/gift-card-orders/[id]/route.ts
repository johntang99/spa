import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import {
  canManageBookings,
  requireSiteAccess,
} from '@/lib/admin/permissions';
import {
  updateGiftCardOrderStatus,
  type GiftCardOrderStatus,
} from '@/lib/gift-cards/commerce';

function parseStatus(value: unknown): GiftCardOrderStatus | null {
  if (value === 'fulfilled' || value === 'redeemed') {
    return value;
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }
  const siteId = String(payload?.siteId || '').trim();
  const status = parseStatus(payload?.status);

  if (!siteId || !status) {
    return NextResponse.json(
      { message: 'Missing siteId or valid status' },
      { status: 400 }
    );
  }
  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!canManageBookings(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const updated = await updateGiftCardOrderStatus({
    siteId,
    orderId: params.id,
    status,
  });
  if (!updated) {
    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ order: updated });
}
