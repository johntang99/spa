import { NextRequest, NextResponse } from 'next/server';
import { getRequestSiteId } from '@/lib/content';
import { listBookings } from '@/lib/booking/storage';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const email = String(payload?.email || '').trim().toLowerCase();
  const phone = String(payload?.phone || '').trim();
  const normalizedPhone = phone.replace(/[^\d+]/g, '');

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  const siteId = await getRequestSiteId();
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 6, today.getUTCDate())
  )
    .toISOString()
    .slice(0, 10);

  const bookings = await listBookings(siteId, startDate, endDate);
  const filtered = bookings.filter(
    (booking) => {
      if (booking.email.toLowerCase() !== email) return false;
      if (!normalizedPhone) return true;
      return booking.phone.replace(/[^\d+]/g, '') === normalizedPhone;
    }
  );

  return NextResponse.json({ bookings: filtered });
}
