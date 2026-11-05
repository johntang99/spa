'use client';

/**
 * Gift card catalog — price + image for each card sold on /gift-cards.
 *
 * Stored in content/<site>/<locale>/collections/gift-cards.json. Amounts,
 * images, type, and active status are shared across languages; labels stay
 * per locale. Checkout already uses Stripe Connect with these amounts.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import type { SiteConfig } from '@/lib/types';
import { Button } from '@/components/ui';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';

type GiftCardProduct = {
  id: string;
  type: 'denomination' | 'treatment';
  label: string;
  amount: number;
  image?: string;
  stripeLink?: string;
  stripePriceId?: string;
  active?: boolean;
  order?: number;
  serviceRef?: string;
};

const FILE = 'collections/gift-cards.json';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueId = (base: string, taken: Set<string>) => {
  let id = base || 'gc';
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
};

interface Props {
  sites: SiteConfig[];
  selectedSiteId: string;
  selectedLocale: string;
}

export function GiftCardsManager({ sites, selectedSiteId, selectedLocale }: Props) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [locale, setLocale] = useState<Locale>(selectedLocale as Locale);
  const [items, setItems] = useState<GiftCardProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const selectedSite = sites.find((s) => s.id === siteId);
  const supportedLocales = (selectedSite?.supportedLocales as string[] | undefined) || ['en'];

  const load = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/admin/content/file?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(FILE)}`
      );
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({})))?.message || `Load failed (${res.status})`);
      }
      const { content } = await res.json();
      const parsed = JSON.parse(content || '{}');
      setItems(Array.isArray(parsed.items) ? parsed.items : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load gift cards');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [siteId, locale]);

  useEffect(() => {
    load();
  }, [load]);

  const putFile = async (loc: string, nextItems: GiftCardProduct[]) => {
    const res = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale: loc,
        path: FILE,
        content: JSON.stringify({ items: nextItems }, null, 2),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || body?.error || `Save failed for ${loc} (${res.status})`);
    }
  };

  const reconcileSibling = (source: GiftCardProduct[], sibling: GiftCardProduct[]) => {
    const byId = new Map(sibling.map((item) => [item.id, item]));
    return source.map((item, index) => {
      const prev = byId.get(item.id);
      return {
        ...(prev || {}),
        id: item.id,
        type: item.type,
        amount: item.amount,
        image: item.image || '',
        stripeLink: item.stripeLink || '',
        stripePriceId: item.stripePriceId || '',
        active: item.active !== false,
        order: index + 1,
        serviceRef: item.serviceRef || '',
        label: prev?.label || item.label,
      };
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const normalized = [...items]
        .map((item, index) => ({
          ...item,
          amount: Math.max(0, Math.round(Number(item.amount) || 0)),
          active: item.active !== false,
          order: index + 1,
          image: item.image || '',
          stripeLink: item.stripeLink || '',
          stripePriceId: item.stripePriceId || '',
        }))
        .sort((a, b) => a.amount - b.amount)
        .map((item, index) => ({ ...item, order: index + 1 }));

      await putFile(locale, normalized);
      const others = supportedLocales.filter((l) => l !== locale);
      for (const other of others) {
        let sibling: GiftCardProduct[] = [];
        try {
          const res = await fetch(
            `/api/admin/content/file?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(other)}&path=${encodeURIComponent(FILE)}`
          );
          if (res.ok) {
            const { content } = await res.json();
            const parsed = JSON.parse(content || '{}');
            sibling = Array.isArray(parsed.items) ? parsed.items : [];
          }
        } catch {
          /* seed from source labels */
        }
        await putFile(other, reconcileSibling(normalized, sibling));
      }
      setItems(normalized);
      setStatus(
        others.length
          ? `Saved · sorted by price · synced images and prices to ${others.join(', ')}`
          : 'Saved · sorted by price'
      );
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const sortedPreview = useMemo(
    () => [...items].sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0)),
    [items]
  );

  const patch = (index: number, next: Partial<GiftCardProduct>) => {
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...next } : item)));
  };

  const addCard = () => {
    const taken = new Set(items.map((item) => item.id));
    const amount = 50;
    const id = uniqueId(`gc-${amount}`, taken);
    setItems((list) => [
      ...list,
      {
        id,
        type: 'denomination',
        label: `$${amount} Gift Card`,
        amount,
        image: '',
        stripeLink: '',
        stripePriceId: '',
        active: true,
        order: list.length + 1,
      },
    ]);
  };

  const removeCard = (index: number) => {
    setItems((list) => list.filter((_, i) => i !== index));
  };

  const input = 'w-full rounded-md border border-gray-200 px-3 py-2 text-sm';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gift Cards</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add or remove cards sold on the Gift Cards page. Checkout uses Stripe Connect
            with the price you set here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addCard}>
            Add card
          </Button>
          <Button type="button" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Site</label>
          <select
            className={input}
            value={siteId}
            onChange={(event) => {
              const next = event.target.value;
              setSiteId(next);
              router.push(`/admin/gift-cards?siteId=${encodeURIComponent(next)}&locale=${locale}`);
            }}
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name || site.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Locale (labels only)</label>
          <select
            className={input}
            value={locale}
            onChange={(event) => {
              const next = event.target.value as Locale;
              setLocale(next);
              router.push(`/admin/gift-cards?siteId=${encodeURIComponent(siteId)}&locale=${next}`);
            }}
          >
            {supportedLocales.map((loc) => (
              <option key={loc} value={loc}>
                {loc.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <p className="text-xs text-gray-500">
            The public page lists cards from low price to high. Save reorders them that way.
          </p>
        </div>
      </div>

      {status ? <p className="text-sm text-green-700">{status}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No gift cards yet. Click Add card.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)_auto]">
                <button
                  type="button"
                  className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  onClick={() => setPickerIndex(index)}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-xs text-gray-400">
                      Pick image
                    </div>
                  )}
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Label</label>
                    <input
                      className={input}
                      value={item.label}
                      onChange={(event) => patch(index, { label: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Price (USD)</label>
                    <input
                      className={input}
                      type="number"
                      min={0}
                      step={1}
                      value={item.amount}
                      onChange={(event) => {
                        const amount = Math.max(0, Number(event.target.value) || 0);
                        const next: Partial<GiftCardProduct> = { amount };
                        if (item.type === 'denomination' && /^\$?\d+\s*Gift Card$/i.test(item.label)) {
                          next.label = `$${amount} Gift Card`;
                        }
                        if (item.type === 'denomination' && item.id.startsWith('gc-')) {
                          const taken = new Set(items.filter((_, i) => i !== index).map((x) => x.id));
                          next.id = uniqueId(`gc-${amount}`, taken);
                        }
                        patch(index, next);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Type</label>
                    <select
                      className={input}
                      value={item.type}
                      onChange={(event) =>
                        patch(index, {
                          type: event.target.value === 'treatment' ? 'treatment' : 'denomination',
                        })
                      }
                    >
                      <option value="denomination">Amount card</option>
                      <option value="treatment">Treatment gift</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Id</label>
                    <input
                      className={input}
                      value={item.id}
                      onChange={(event) =>
                        patch(index, { id: slugify(event.target.value) || item.id })
                      }
                    />
                  </div>
                  {item.type === 'treatment' ? (
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Service ref (optional)</label>
                      <input
                        className={input}
                        value={item.serviceRef || ''}
                        onChange={(event) => patch(index, { serviceRef: event.target.value })}
                        placeholder="signature-facial"
                      />
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Image URL</label>
                    <div className="flex gap-2">
                      <input
                        className={input}
                        value={item.image || ''}
                        onChange={(event) => patch(index, { image: event.target.value })}
                        placeholder="https://…"
                      />
                      <Button type="button" variant="outline" onClick={() => setPickerIndex(index)}>
                        Image picker
                      </Button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={item.active !== false}
                      onChange={(event) => patch(index, { active: event.target.checked })}
                    />
                    Active on the Gift Cards page
                  </label>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Button type="button" variant="outline" onClick={() => removeCard(index)}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedPreview.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Storefront order (by price)</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
            {sortedPreview.map((item) => (
              <li key={item.id}>
                {item.label} · ${Number(item.amount || 0)}
                {item.active === false ? ' · hidden' : ''}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <ImagePickerModal
        open={pickerIndex !== null}
        siteId={siteId}
        onClose={() => setPickerIndex(null)}
        onSelect={(url) => {
          if (pickerIndex !== null) patch(pickerIndex, { image: url });
          setPickerIndex(null);
        }}
      />
    </div>
  );
}
