'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
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

function getOriginalAmount(order: GiftCardOrder) {
  return Number(order.original_amount ?? order.amount ?? 0);
}

function getRedeemedAmount(order: GiftCardOrder) {
  return Number(order.redeemed_amount ?? 0);
}

function getRemainingAmount(order: GiftCardOrder) {
  const explicit = Number(order.remaining_amount);
  if (Number.isFinite(explicit)) return explicit;
  return Math.max(getOriginalAmount(order) - getRedeemedAmount(order), 0);
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
  const [redeemInputs, setRedeemInputs] = useState<Record<string, string>>({});
  const [redeemNotes, setRedeemNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageTone, setMessageTone] = useState<'error' | 'success'>('error');

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
    setMessageTone('error');
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
      setMessageTone('error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(order: GiftCardOrder, next: GiftCardOrderStatus) {
    setMessage('');
    setMessageTone('error');
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
      setMessageTone('error');
    }
  }

  async function redeemAmount(order: GiftCardOrder, useFullRemaining = false) {
    const remaining = getRemainingAmount(order);
    const raw = useFullRemaining
      ? remaining.toFixed(2)
      : String(redeemInputs[order.id] || '').trim();
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid redeem amount.');
      setMessageTone('error');
      return;
    }
    if (amount > remaining + 0.0001) {
      setMessage('Redeem amount cannot exceed remaining balance.');
      setMessageTone('error');
      return;
    }

    const note = String(redeemNotes[order.id] || '').trim();
    setMessage('');
    setMessageTone('error');
    try {
      const response = await fetch(`/api/admin/gift-card-orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          redeemAmount: amount,
          note,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to redeem gift card amount.');
      }
      const updated = payload.order as GiftCardOrder;
      setOrders((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setRedeemInputs((prev) => ({ ...prev, [order.id]: '' }));
      setRedeemNotes((prev) => ({ ...prev, [order.id]: '' }));
      const remainingAfter = getRemainingAmount(updated);
      setMessage(
        `Redeemed ${formatCurrency(amount, order.currency)}. Remaining ${formatCurrency(remainingAfter, order.currency)}.`
      );
      setMessageTone('success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to redeem gift card amount.';
      setMessage(errorMessage);
      setMessageTone('error');
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
          Track balances and redeem gift cards by partial amount or full amount.
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
          <p
            className={`text-sm ${messageTone === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}
            role="status"
          >
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
                Original
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Redeemed
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Remaining
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
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  No gift card orders found for the selected filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const history = order.redemptions || [];
                return (
                  <Fragment key={order.id}>
                    <tr>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.buyer_name}</p>
                        <p className="text-gray-500">{order.buyer_email}</p>
                        {order.recipient_email ? (
                          <p className="text-xs text-gray-500">
                            Recipient: {order.recipient_name || 'Guest'} ({order.recipient_email})
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">
                        {order.certificate_code}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{order.product_ref}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatCurrency(getOriginalAmount(order), order.currency)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatCurrency(getRedeemedAmount(order), order.currency)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatCurrency(getRemainingAmount(order), order.currency)}
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
                          {getRemainingAmount(order) > 0 ? (
                            <>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                max={getRemainingAmount(order).toFixed(2)}
                                placeholder="Amount"
                                className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                                value={redeemInputs[order.id] || ''}
                                onChange={(event) =>
                                  setRedeemInputs((prev) => ({
                                    ...prev,
                                    [order.id]: event.target.value,
                                  }))
                                }
                              />
                          <input
                            type="text"
                            placeholder="Description (e.g. Swedish 60m)"
                            className="w-52 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                            maxLength={120}
                            value={redeemNotes[order.id] || ''}
                            onChange={(event) =>
                              setRedeemNotes((prev) => ({
                                ...prev,
                                [order.id]: event.target.value,
                              }))
                            }
                          />
                              <Button
                                size="sm"
                                onClick={() => redeemAmount(order)}
                              >
                                Redeem Amount
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => redeemAmount(order, true)}
                              >
                                Redeem Full
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700">
                              Fully redeemed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-gray-50/40">
                      <td colSpan={9} className="px-4 py-3">
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-gray-700">
                            Redemption history ({history.length})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {history.length === 0 ? (
                              <p className="text-xs text-gray-500">
                                No redemptions yet.
                              </p>
                            ) : (
                              history.map((item) => (
                                <div
                                  key={item.id}
                                  className="text-xs text-gray-700"
                                >
                                  <span className="font-semibold">
                                    {formatCurrency(item.amount, item.currency)}
                                  </span>{' '}
                                  redeemed on{' '}
                                  {new Date(item.redeemed_at).toLocaleString()}
                                  {item.redeemed_by
                                    ? ` by ${item.redeemed_by}`
                                    : ''}
                                  {item.note ? ` — ${item.note}` : ''}
                                </div>
                              ))
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
