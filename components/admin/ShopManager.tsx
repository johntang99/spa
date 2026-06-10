'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { SiteConfig } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type HerbStore = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  contact_email: string | null;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  short_description?: string;
  image_url?: string;
  category?: { name: string };
};

type StoreProductItem = {
  product_id: string;
  enabled: boolean;
  price_override_cents: number | null;
  practitioner_recommended: boolean;
  is_featured: boolean;
  sort_order: number;
  products?: { id: string; name: string; slug: string; price_cents: number };
};

type ShopData = {
  connected: boolean;
  site: SiteConfig;
  store: HerbStore | null;
  storeProducts: StoreProductItem[];
  allProducts: Product[];
};

type ProductRow = Product & {
  inStore: boolean;
  customPriceDollars: string;
  practitionerRecommended: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsToStr(cents: number | null): string {
  if (!cents) return '';
  return (cents / 100).toFixed(2);
}

// ─── Site Selector ────────────────────────────────────────────────────────────

function SiteSelector({
  sites,
  selectedSiteId,
  onChange,
}: {
  sites: SiteConfig[];
  selectedSiteId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Site:</label>
      <select
        value={selectedSiteId}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Connection Panel ─────────────────────────────────────────────────────────

function ConnectionPanel({
  siteId,
  data,
  onConnected,
}: {
  siteId: string;
  data: ShopData | null;
  onConnected: () => void;
}) {
  const [mode, setMode] = useState<'idle' | 'link' | 'create'>('idle');
  const [slugInput, setSlugInput] = useState(data?.site.herbStoreSlug ?? '');
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSlugInput(data?.site.herbStoreSlug ?? '');
  }, [data?.site.herbStoreSlug]);

  const handleLink = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shop?siteId=${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ herbStoreSlug: slugInput.trim() }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error ?? 'Failed'); return; }
      setMode('idle');
      onConnected();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shop?siteId=${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, slug: createSlug || undefined }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error ?? 'Failed'); return; }
      setMode('idle');
      onConnected();
    } finally {
      setSaving(false);
    }
  };

  const isConnected = data?.connected && data.store;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Store Connection</h2>
        {isConnected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" />
            Not Connected
          </span>
        )}
      </div>

      {isConnected && data?.store && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm space-y-0.5">
          <p className="font-semibold text-emerald-800">{data.store.name}</p>
          <p className="text-emerald-600">Slug: <code className="font-mono text-xs bg-emerald-100 px-1 rounded">{data.store.slug}</code></p>
          {data.store.contact_email && <p className="text-emerald-600">{data.store.contact_email}</p>}
        </div>
      )}

      {!isConnected && mode === 'idle' && (
        <p className="text-sm text-gray-500">
          This site is not linked to a store in the herb platform. Connect an existing store or create a new one.
        </p>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {mode === 'link' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Herb Store Slug</label>
            <input
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="e.g. dr-huang-clinic"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-400">Must match an existing store slug in pureherbhealth.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleLink()} disabled={saving || !slugInput.trim()}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-emerald-700">
              {saving ? 'Connecting…' : 'Connect Store'}
            </button>
            <button onClick={() => setMode('idle')} className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Store Display Name</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Dr. Huang TCM Clinic"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (optional — auto-generated if blank)</label>
            <input
              value={createSlug}
              onChange={(e) => setCreateSlug(e.target.value)}
              placeholder="e.g. dr-huang-clinic"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleCreate()} disabled={saving || !createName.trim()}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-emerald-700">
              {saving ? 'Creating…' : 'Create & Connect'}
            </button>
            <button onClick={() => setMode('idle')} className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'idle' && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => setMode('link')}
            className="px-4 py-2 border border-emerald-300 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50">
            {isConnected ? 'Change Store' : 'Link Existing Store'}
          </button>
          {!isConnected && (
            <button onClick={() => setMode('create')}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700">
              Create New Store
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Products Panel ───────────────────────────────────────────────────────────

function ProductsPanel({
  siteId,
  data,
}: {
  siteId: string;
  data: ShopData;
}) {
  const storeProductMap = new Map(data.storeProducts.map((sp) => [sp.product_id, sp]));

  const [rows, setRows] = useState<ProductRow[]>(() =>
    data.allProducts.map((p) => {
      const sp = storeProductMap.get(p.id);
      return {
        ...p,
        inStore: sp?.enabled ?? false,
        customPriceDollars: centsToStr(sp?.price_override_cents ?? null),
        practitionerRecommended: sp?.practitioner_recommended ?? false,
        isFeatured: sp?.is_featured ?? false,
        sortOrder: sp?.sort_order ?? 0,
      };
    })
  );

  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const dirty = useRef(false);

  const update = (id: string, patch: Partial<ProductRow>) => {
    dirty.current = true;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    dirty.current = false;
    try {
      const updates = rows.map((r) => ({
        product_id: r.id,
        enabled: r.inStore,
        custom_price: r.customPriceDollars ? parseFloat(r.customPriceDollars) : null,
        practitioner_recommended: r.practitionerRecommended,
        is_featured: r.isFeatured,
        sort_order: r.sortOrder,
      }));
      const res = await fetch(`/api/admin/shop/products?siteId=${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: data.store!.id, updates }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? 'Save failed');
        return;
      }
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter
    ? rows.filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()))
    : rows;

  const enabledCount = rows.filter((r) => r.inStore).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Products</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {enabledCount} of {rows.length} products shown in this site&apos;s shop
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search products…"
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-emerald-700"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}
      {savedAt && !error && (
        <div className="mx-6 mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Saved at {savedAt.toLocaleTimeString()}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="pl-6 pr-3 py-3 text-left w-8">Show</th>
              <th className="px-3 py-3 text-left">Product</th>
              <th className="px-3 py-3 text-right w-28">Default Price</th>
              <th className="px-3 py-3 text-right w-32">Custom Price</th>
              <th className="px-3 py-3 text-center w-24">Featured</th>
              <th className="px-3 py-3 text-center w-28">Dr. Pick</th>
              <th className="px-3 py-3 text-center w-20">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((row) => (
              <tr key={row.id} className={`${row.inStore ? '' : 'opacity-50'} hover:bg-gray-50/50`}>
                {/* Toggle */}
                <td className="pl-6 pr-3 py-3">
                  <input
                    type="checkbox"
                    checked={row.inStore}
                    onChange={(e) => update(row.id, { inStore: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                  />
                </td>

                {/* Name */}
                <td className="px-3 py-3">
                  <p className="font-medium text-gray-800">{row.name}</p>
                  {row.category && (
                    <p className="text-xs text-gray-400">{row.category.name}</p>
                  )}
                </td>

                {/* Default price */}
                <td className="px-3 py-3 text-right text-gray-500">
                  ${(row.price_cents / 100).toFixed(2)}
                </td>

                {/* Custom price */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.customPriceDollars}
                    onChange={(e) => update(row.id, { customPriceDollars: e.target.value })}
                    placeholder="—"
                    disabled={!row.inStore}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-300"
                  />
                </td>

                {/* Featured */}
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={row.isFeatured}
                    onChange={(e) => update(row.id, { isFeatured: e.target.checked })}
                    disabled={!row.inStore}
                    className="h-4 w-4 rounded accent-emerald-600 cursor-pointer disabled:cursor-default"
                  />
                </td>

                {/* Dr. Pick */}
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={row.practitionerRecommended}
                    onChange={(e) => update(row.id, { practitionerRecommended: e.target.checked })}
                    disabled={!row.inStore}
                    className="h-4 w-4 rounded accent-emerald-600 cursor-pointer disabled:cursor-default"
                  />
                </td>

                {/* Sort order */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min="0"
                    value={row.sortOrder}
                    onChange={(e) => update(row.id, { sortOrder: parseInt(e.target.value, 10) || 0 })}
                    disabled={!row.inStore}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-300"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            {filter ? 'No products match your search.' : 'No products available in the main catalog.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopManager({
  sites,
  selectedSiteId,
}: {
  sites: SiteConfig[];
  selectedSiteId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentSiteId, setCurrentSiteId] = useState(selectedSiteId);
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async (siteId: string) => {
    if (!siteId) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/shop?siteId=${siteId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load shop data');
      setData(await res.json() as ShopData);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(currentSiteId);
  }, [currentSiteId, loadData]);

  const handleSiteChange = (id: string) => {
    setCurrentSiteId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('siteId', id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shop</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect this site to a herb store and manage which products appear in the shop.
          </p>
        </div>
        <SiteSelector sites={sites} selectedSiteId={currentSiteId} onChange={handleSiteChange} />
      </div>

      {loading && (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {!loading && !loadError && (
        <>
          <ConnectionPanel
            siteId={currentSiteId}
            data={data}
            onConnected={() => void loadData(currentSiteId)}
          />

          {data?.connected && data.store && (
            <ProductsPanel siteId={currentSiteId} data={data} />
          )}

          {data && !data.connected && (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
              Connect a store above to manage products.
            </div>
          )}
        </>
      )}
    </div>
  );
}
