import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import {
  canManageBookings,
  requireSiteAccess,
} from '@/lib/admin/permissions';
import {
  listGiftCardOrders,
  type GiftCardOrderStatus,
} from '@/lib/gift-cards/commerce';

function parseStatus(value: string | null): GiftCardOrderStatus | 'all' {
  if (
    value === 'paid' ||
    value === 'fulfilled' ||
    value === 'redeemed' ||
    value === 'frozen' ||
    value === 'refunded'
  ) {
    return value;
  }
  return 'all';
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const siteId = String(searchParams.get('siteId') || '').trim();
  const from = String(searchParams.get('from') || '').trim();
  const to = String(searchParams.get('to') || '').trim();
  const status = parseStatus(searchParams.get('status'));
  if (!siteId) {
    return NextResponse.json({ message: 'Missing siteId' }, { status: 400 });
  }
  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!canManageBookings(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const orders = await listGiftCardOrders({
    siteId,
    from: from || undefined,
    to: to || undefined,
    status,
  });
  return NextResponse.json({ orders });
}
