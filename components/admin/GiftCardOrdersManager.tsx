'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import type { SiteConfig } from '@/lib/types';
import { Button } from '@/components/ui';
import type {
  GiftCardOrder,
  GiftCardOrderStatus,
} from '@/lib/gift-cards/commerce';

interface GiftCardOrdersManagerProps {
  sites: SiteConfig[];
  selectedSiteId: string;
  selectedLocale: string;
}

function getDateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const STATUS_OPTIONS: Array<GiftCardOrderStatus | 'all'> = [
  'all',
  'paid',
  'fulfilled',
  'redeemed',
];

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(Number(amount || 0));
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}

function formatStatus(status: GiftCardOrderStatus) {
  if (status === 'paid') return 'Paid';
  if (status === 'fulfilled') return 'Fulfilled';
  return 'Redeemed';
}

function badgeClass(status: GiftCardOrderStatus) {
  if (status === 'paid') return 'bg-amber-100 text-amber-800';
  if (status === 'fulfilled') return 'bg-sky-100 text-sky-800';
  return 'bg-emerald-100 text-emerald-800';
}

export function GiftCardOrdersManager({
  sites,
  selectedSiteId,
  selectedLocale,
}: GiftCardOrdersManagerProps) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [locale, setLocale] = useState<Locale>(
    selectedLocale === 'zh' ? 'zh' : 'en'
  );
  const [from, setFrom] = useState(() => getDateOffset(-90));
  const [to, setTo] = useState(() => getDateOffset(90));
  const [status, setStatus] = useState<GiftCardOrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<GiftCardOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const currentSite = useMemo(
    () => sites.find((entry) => entry.id === siteId),
    [sites, siteId]
  );

  useEffect(() => {
    if (!currentSite) return;
    const supported: Locale[] = currentSite.supportedLocales.includes('zh')
      ? ['en', 'zh']
      : ['en'];
    if (!supported.includes(locale)) {
      setLocale(supported[0]);
    }
  }, [currentSite, locale]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (siteId) params.set('siteId', siteId);
    if (locale) params.set('locale', locale);
    const qs = params.toString();
    router.replace(qs ? `/admin/gift-card-orders?${qs}` : '/admin/gift-card-orders');
  }, [router, siteId, locale]);

  async function loadOrders() {
    if (!siteId) return;
    setLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams({
        siteId,
        from,
        to,
      });
      if (status !== 'all') params.set('status', status);
      const response = await fetch(`/api/admin/gift-card-orders?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to load gift card orders.');
      }
      setOrders(Array.isArray(payload.orders) ? payload.orders : []);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load gift card orders.';
      setMessage(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(order: GiftCardOrder, next: GiftCardOrderStatus) {
    setMessage('');
    try {
      const response = await fetch(`/api/admin/gift-card-orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          status: next,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to update order status.');
      }
      const updated = payload.order as GiftCardOrder;
      setOrders((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update order status.';
      setMessage(errorMessage);
    }
  }

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, from, to, status]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Gift Card Orders</h1>
        <p className="text-sm text-gray-600">
          Track paid gift cards and mark them fulfilled or redeemed.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-5">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Site</span>
          <select
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Locale</span>
          <select
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={locale}
            onChange={(event) =>
              setLocale(event.target.value === 'zh' ? 'zh' : 'en')
            }
          >
            {(currentSite?.supportedLocales || ['en']).map((code: Locale) => (
              <option key={code} value={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">From</span>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">To</span>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Status</span>
          <select
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={status}
            onChange={(event) =>
              setStatus((event.target.value as GiftCardOrderStatus | 'all') || 'all')
            }
          >
            {STATUS_OPTIONS.map((entry) => (
              <option key={entry} value={entry}>
                {entry === 'all' ? 'All statuses' : formatStatus(entry)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={loadOrders} disabled={loading || !siteId}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
        {message && (
          <p className="text-sm text-rose-600" role="status">
            {message}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Buyer
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Certificate
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Product
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Paid At
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No gift card orders found for the selected filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.buyer_name}</p>
                    <p className="text-gray-500">{order.buyer_email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">
                    {order.certificate_code}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{order.product_ref}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatCurrency(order.amount, order.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(order.status)}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order, 'fulfilled')}
                        >
                          Mark Fulfilled
                        </Button>
                      )}
                      {order.status !== 'redeemed' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order, 'redeemed')}
                        >
                          Mark Redeemed
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
