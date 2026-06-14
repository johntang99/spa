import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import {
  canManageBookings,
  requireSiteAccess,
} from '@/lib/admin/permissions';
import {
  redeemGiftCardOrder,
  resendGiftCardCertificateEmail,
  updateGiftCardOrderStatus,
  type GiftCardOrderStatus,
} from '@/lib/gift-cards/commerce';

function parseStatus(value: unknown): GiftCardOrderStatus | null {
  if (
    value === 'fulfilled' ||
    value === 'redeemed' ||
    value === 'frozen' ||
    value === 'refunded'
  ) {
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
  const action = String(payload?.action || '').trim();
  const redeemAmount = Number(payload?.redeemAmount);
  const hasRedeemAmount =
    payload?.redeemAmount !== undefined &&
    payload?.redeemAmount !== null &&
    Number.isFinite(redeemAmount);

  if (!siteId || (!status && !hasRedeemAmount)) {
    return NextResponse.json(
      { message: 'Missing siteId and update action' },
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

  if (hasRedeemAmount) {
    const redeemed = await redeemGiftCardOrder({
      siteId,
      orderId: params.id,
      amount: redeemAmount,
      note: String(payload?.note || '').trim(),
      redeemedBy: session.user.email,
    });
    if (!redeemed.ok) {
      return NextResponse.json({ message: redeemed.message }, { status: 400 });
    }
    return NextResponse.json({
      order: redeemed.order,
      redemption: redeemed.redemption,
    });
  }
  if (action === 'resend_certificate') {
    const resent = await resendGiftCardCertificateEmail({
      siteId,
      orderId: params.id,
    });
    if (!resent.ok) {
      return NextResponse.json({ message: resent.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }
  if (!status) {
    return NextResponse.json(
      { message: 'Missing valid status' },
      { status: 400 }
    );
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
