'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import type { BookingRecord, BookingService } from '@/lib/types';
import { Button } from '@/components/ui';

interface BookingLookupProps {
  locale: 'en' | 'zh';
}

export function BookingLookup({ locale }: BookingLookupProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rescheduleDraft, setRescheduleDraft] = useState<
    Record<string, { date: string; time: string; slots: string[] }>
  >({});

  useEffect(() => {
    const loadServices = async () => {
      const response = await fetch('/api/booking/services');
      if (!response.ok) return;
      const payload = await response.json();
      setServices(payload.services || []);
    };
    loadServices();
  }, []);

  const getServiceName = (serviceId: string) =>
    services.find((service) => service.id === serviceId)?.name || serviceId;

  const lookup = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/booking/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: phone || undefined }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Lookup failed');
      }
      const payload = await response.json();
      setBookings(payload.bookings || []);
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!email) {
      setStatus(locale === 'en' ? 'Enter your email first.' : '请先填写邮箱。');
      return;
    }
    const confirmed = window.confirm(
      locale === 'en'
        ? 'Are you sure you want to cancel this booking?'
        : '确认取消该预约吗？'
    );
    if (!confirmed) return;
    setStatus(null);
    const response = await fetch('/api/booking/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, email }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Cancel failed');
      return;
    }
    await lookup();
  };

  const loadSlots = async (bookingId: string, serviceId: string, date: string) => {
    const response = await fetch(
      `/api/booking/slots?serviceId=${serviceId}&date=${date}`
    );
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return payload.slots || [];
  };

  const rescheduleBooking = async (bookingId: string) => {
    const draft = rescheduleDraft[bookingId];
    if (!draft?.date || !draft?.time) {
      setStatus(
        locale === 'en' ? 'Select a new date and time.' : '请选择新的日期和时间。'
      );
      return;
    }
    const response = await fetch('/api/booking/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        email,
        date: draft.date,
        time: draft.time,
      }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Reschedule failed');
      return;
    }
    await lookup();
  };

  return (
    <div className="bg-white/95 border border-gray-200/80 rounded-3xl p-8 space-y-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {locale === 'en' ? 'Manage' : '管理'}
        </div>
        <h2 className="text-heading font-semibold text-gray-900 mt-2">
          {locale === 'en' ? 'Manage Your Booking' : '管理您的预约'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {locale === 'en'
            ? 'Enter the booking email. Phone is optional.'
            : '请输入预约邮箱（电话可选）。'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
          placeholder={locale === 'en' ? 'Email' : '邮箱'}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
          placeholder={locale === 'en' ? 'Phone (optional)' : '电话（可选）'}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <Button type="button" onClick={lookup} disabled={loading || !email}>
        {locale === 'en' ? 'Find My Bookings' : '查找我的预约'}
      </Button>

      {status && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {status}
        </div>
      )}

      <div className="space-y-4">
        {bookings.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 text-center">
            {locale === 'en' ? 'No bookings found.' : '未找到预约记录。'}
          </div>
        )}
        {bookings.map((booking) => {
          const draft = rescheduleDraft[booking.id];
          return (
            <div key={booking.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {getServiceName(booking.serviceId)} · {booking.date} {booking.time}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.status} · ID: {booking.id}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cancelBooking(booking.id)}
                  disabled={booking.status === 'cancelled'}
                >
                  {booking.status === 'cancelled'
                    ? locale === 'en'
                      ? 'Cancelled'
                      : '已取消'
                    : locale === 'en'
                      ? 'Cancel'
                      : '取消'}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input
                  type="date"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={draft?.date || ''}
                  onChange={async (event) => {
                    const date = event.target.value;
                    const slots = date
                      ? await loadSlots(booking.id, booking.serviceId, date)
                      : [];
                    setRescheduleDraft((current) => ({
                      ...current,
                      [booking.id]: { date, time: '', slots },
                    }));
                  }}
                />
                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={draft?.time || ''}
                  onChange={(event) =>
                    setRescheduleDraft((current) => ({
                      ...current,
                      [booking.id]: {
                        date: draft?.date || '',
                        time: event.target.value,
                        slots: draft?.slots || [],
                      },
                    }))
                  }
                >
                  <option value="">{locale === 'en' ? 'Select time' : '选择时间'}</option>
                  {(draft?.slots || []).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={() => rescheduleBooking(booking.id)}>
                  {locale === 'en' ? 'Reschedule' : '改期'}
                </Button>
              </div>
              {(booking.pickupAddress || booking.deliveryAddress || booking.zipCode) && (
                <div className="mt-3 text-xs text-gray-500">
                  {booking.pickupAddress && (
                    <div>
                      {locale === 'en' ? 'Pickup' : '上门'}: {booking.pickupAddress}
                    </div>
                  )}
                  {booking.deliveryAddress && (
                    <div>
                      {locale === 'en' ? 'Delivery' : '送达'}: {booking.deliveryAddress}
                    </div>
                  )}
                  {booking.zipCode && (
                    <div>
                      ZIP: {booking.zipCode}
                      {typeof booking.bags === 'number' ? ` · Bags: ${booking.bags}` : ''}
                      {typeof booking.estimatedWeightLb === 'number'
                        ? ` · ${booking.estimatedWeightLb} lb`
                        : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
