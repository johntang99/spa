'use client';

// Spa catalog editor — edits content/<site>/<locale>/collections/services.json
// (the single source for categories + services + add-ons, used by lib/spa/catalog.ts).
// Prices, tiers, ids, and structure are SHARED across languages: on save we sync those
// fields into the sibling-locale file so the single-price-source + locale-parity invariants
// hold automatically. Names and descriptions are edited per selected language.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import type { SiteConfig } from '@/lib/types';
import { Button } from '@/components/ui';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';

interface Tier { minutes: number; price: number }
interface Category { id: string; name: string; intro?: string; image?: string; order: number }
interface Service {
  id: string; categoryId: string; name: string; slug: string; short: string;
  image?: string; tiers: Tier[]; badge?: string | null; goalTags?: string[];
  intensity?: number; enabled: boolean; order: number;
}
interface Addon { id: string; name: string; price: number; appliesTo: any }
interface Catalog { categories: Category[]; services: Service[]; addons: Addon[] }

const FILE = 'collections/services.json';
const EMPTY: Catalog = { categories: [], services: [], addons: [] };

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const uniqueId = (base: string, taken: Set<string>) => {
  let id = base || 'item';
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
};

interface Props {
  sites: SiteConfig[];
  selectedSiteId: string;
  selectedLocale: string;
}

export function SpaCatalogManager({ sites, selectedSiteId, selectedLocale }: Props) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [locale, setLocale] = useState<Locale>(selectedLocale as Locale);
  const [catalog, setCatalog] = useState<Catalog>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'categories' | 'services' | 'addons' | 'json'>('categories');
  const [jsonText, setJsonText] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Image picker: holds the apply-callback for whichever image field opened it.
  const [picker, setPicker] = useState<{ apply: (url: string) => void } | null>(null);

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
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || `Load failed (${res.status})`);
      const { content } = await res.json();
      const parsed = JSON.parse(content || '{}');
      setCatalog({
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        services: Array.isArray(parsed.services) ? parsed.services : [],
        addons: Array.isArray(parsed.addons) ? parsed.addons : [],
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load catalog');
      setCatalog(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [siteId, locale]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the JSON tab in sync when opened.
  useEffect(() => {
    if (tab === 'json') setJsonText(JSON.stringify(catalog, null, 2));
  }, [tab, catalog]);

  // ---- mutation helpers (immutable) ----
  const update = (fn: (c: Catalog) => Catalog) => setCatalog((c) => fn(structuredClone(c)));

  const patchCategory = (id: string, patch: Partial<Category>) =>
    update((c) => {
      const cat = c.categories.find((x) => x.id === id);
      if (cat) Object.assign(cat, patch);
      return c;
    });
  const patchService = (id: string, patch: Partial<Service>) =>
    update((c) => {
      const s = c.services.find((x) => x.id === id);
      if (s) Object.assign(s, patch);
      return c;
    });
  const patchAddon = (id: string, patch: Partial<Addon>) =>
    update((c) => {
      const a = c.addons.find((x) => x.id === id);
      if (a) Object.assign(a, patch);
      return c;
    });

  const addCategory = () =>
    update((c) => {
      const id = uniqueId('new-category', new Set(c.categories.map((x) => x.id)));
      const order = Math.max(0, ...c.categories.map((x) => x.order || 0)) + 1;
      c.categories.push({ id, name: 'New Category', intro: '', image: '', order });
      return c;
    });
  const removeCategory = (id: string) =>
    update((c) => {
      c.categories = c.categories.filter((x) => x.id !== id);
      c.services = c.services.filter((x) => x.categoryId !== id);
      return c;
    });
  const moveCategory = (id: string, dir: -1 | 1) =>
    update((c) => {
      const sorted = [...c.categories].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sorted.length) return c;
      const oi = sorted[i].order, oj = sorted[j].order;
      sorted[i].order = oj; sorted[j].order = oi;
      return c;
    });

  const addService = (categoryId: string) =>
    update((c) => {
      const id = uniqueId('new-service', new Set(c.services.map((x) => x.id)));
      const inCat = c.services.filter((x) => x.categoryId === categoryId);
      const order = Math.max(0, ...inCat.map((x) => x.order || 0)) + 1;
      c.services.push({
        id, categoryId, name: 'New Service', slug: id, short: '',
        image: '', tiers: [{ minutes: 60, price: 0 }], badge: null, goalTags: [],
        intensity: 1, enabled: true, order,
      });
      setExpanded((e) => new Set(e).add(id));
      return c;
    });
  const removeService = (id: string) =>
    update((c) => {
      c.services = c.services.filter((x) => x.id !== id);
      return c;
    });
  const moveService = (id: string, dir: -1 | 1) =>
    update((c) => {
      const svc = c.services.find((x) => x.id === id);
      if (!svc) return c;
      const sorted = c.services.filter((x) => x.categoryId === svc.categoryId).sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= sorted.length) return c;
      const oi = sorted[i].order, oj = sorted[j].order;
      sorted[i].order = oj; sorted[j].order = oi;
      return c;
    });

  const addTier = (serviceId: string) =>
    update((c) => {
      const s = c.services.find((x) => x.id === serviceId);
      if (s) s.tiers.push({ minutes: 60, price: 0 });
      return c;
    });
  const removeTier = (serviceId: string, idx: number) =>
    update((c) => {
      const s = c.services.find((x) => x.id === serviceId);
      if (s) s.tiers = s.tiers.filter((_, i) => i !== idx);
      return c;
    });
  const patchTier = (serviceId: string, idx: number, patch: Partial<Tier>) =>
    update((c) => {
      const s = c.services.find((x) => x.id === serviceId);
      if (s && s.tiers[idx]) Object.assign(s.tiers[idx], patch);
      return c;
    });

  const addAddon = () =>
    update((c) => {
      const id = uniqueId('new-addon', new Set(c.addons.map((x) => x.id)));
      c.addons.push({ id, name: 'New Add-on', price: 0, appliesTo: 'all' });
      return c;
    });
  const removeAddon = (id: string) =>
    update((c) => {
      c.addons = c.addons.filter((x) => x.id !== id);
      return c;
    });

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setCatalog({
        categories: parsed.categories || [],
        services: parsed.services || [],
        addons: parsed.addons || [],
      });
      setError(null);
      setStatus('JSON applied to form (not yet saved)');
    } catch (e: any) {
      setError(`Invalid JSON: ${e?.message || e}`);
    }
  };

  // Merge SHARED (structural/numeric) fields of `source` into the sibling-locale catalog.
  // We START from the sibling's existing object so its localized text AND any other
  // sibling-only fields (e.g. relatedConditionRefs) are preserved, then overlay only the
  // shared fields that are defined in `source`. New items are seeded from source; removed
  // items drop out (parity). Localized fields (name/intro/short) are never overwritten when
  // the sibling already has them.
  const overlay = <T extends Record<string, any>>(prev: T | undefined, src: T, shared: (keyof T)[], localized: (keyof T)[]): T => {
    const out: any = { ...(prev || {}) };
    for (const k of shared) if (src[k] !== undefined) out[k] = src[k];
    for (const k of localized) if (out[k] === undefined) out[k] = src[k];
    return out;
  };
  const reconcileSibling = (source: Catalog, sibling: Catalog): Catalog => {
    const sibCat = new Map(sibling.categories.map((x) => [x.id, x]));
    const sibSvc = new Map(sibling.services.map((x) => [x.id, x]));
    const sibAdd = new Map(sibling.addons.map((x) => [x.id, x]));
    return {
      categories: source.categories.map((c) =>
        overlay(sibCat.get(c.id), c, ['id', 'order', 'image'], ['name', 'intro'])
      ),
      services: source.services.map((s) =>
        overlay(sibSvc.get(s.id), s, ['id', 'categoryId', 'slug', 'image', 'tiers', 'badge', 'goalTags', 'intensity', 'enabled', 'order'], ['name', 'short'])
      ),
      addons: source.addons.map((a) =>
        overlay(sibAdd.get(a.id), a, ['id', 'price', 'appliesTo'], ['name'])
      ),
    };
  };

  const putFile = async (loc: string, data: Catalog) => {
    const res = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, locale: loc, path: FILE, content: JSON.stringify(data, null, 2) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || body?.error || `Save failed for ${loc} (${res.status})`);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      // 1) Save the language we're editing.
      await putFile(locale, catalog);
      // 2) Sync shared fields into every other supported locale (keeps prices + parity in lockstep).
      const others = supportedLocales.filter((l) => l !== locale);
      for (const other of others) {
        let sibling: Catalog = EMPTY;
        try {
          const res = await fetch(
            `/api/admin/content/file?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(other)}&path=${encodeURIComponent(FILE)}`
          );
          if (res.ok) {
            const { content } = await res.json();
            const parsed = JSON.parse(content || '{}');
            sibling = { categories: parsed.categories || [], services: parsed.services || [], addons: parsed.addons || [] };
          }
        } catch {
          /* sibling missing — reconcile will seed from source text */
        }
        await putFile(other, reconcileSibling(catalog, sibling));
      }
      setStatus(others.length ? `Saved · synced prices & structure to ${others.join(', ')}` : 'Saved');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const sortedCategories = useMemo(
    () => [...catalog.categories].sort((a, b) => a.order - b.order),
    [catalog.categories]
  );
  const servicesByCat = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of catalog.services) {
      if (!map.has(s.categoryId)) map.set(s.categoryId, []);
      map.get(s.categoryId)!.push(s);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [catalog.services]);

  const orphanServices = catalog.services.filter(
    (s) => !catalog.categories.some((c) => c.id === s.categoryId)
  );

  const input = 'w-full rounded-md border border-gray-200 px-3 py-2 text-sm';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  const toggle = (id: string) =>
    setExpanded((e) => {
      const next = new Set(e);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services Catalog</h1>
          <p className="text-sm text-gray-600">
            Categories, treatments, tiers &amp; add-ons. Prices and structure are shared across languages;
            names and descriptions are per-language.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className={labelCls}>Site</label>
            <select className={input} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select className={input} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              {supportedLocales.map((l) => (
                <option key={l} value={l}>{l === 'en' ? 'English' : l === 'zh' ? 'Chinese' : l}</option>
              ))}
            </select>
          </div>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {(status || error) && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {error || status}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {([
          ['categories', `Categories (${catalog.categories.length})`],
          ['services', `Services (${catalog.services.length})`],
          ['addons', `Add-ons (${catalog.addons.length})`],
          ['json', 'JSON'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
              tab === key ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading catalog…</div>
      ) : (
        <>
          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div className="space-y-4">
              {sortedCategories.map((c, i) => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-mono text-gray-400">{c.id}</div>
                    <div className="flex items-center gap-1">
                      <button type="button" className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30" disabled={i === 0} onClick={() => moveCategory(c.id, -1)}>↑</button>
                      <button type="button" className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30" disabled={i === sortedCategories.length - 1} onClick={() => moveCategory(c.id, 1)}>↓</button>
                      <button type="button" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded" onClick={() => removeCategory(c.id)}>Delete</button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input className={input} value={c.name} onChange={(e) => patchCategory(c.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>ID / slug</label>
                      <input className={input} value={c.id} onChange={(e) => patchCategory(c.id, { id: slugify(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Intro</label>
                    <textarea className={input} rows={2} value={c.intro || ''} onChange={(e) => patchCategory(c.id, { intro: e.target.value })} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Image</label>
                      <ImageField
                        value={c.image || ''}
                        input={input}
                        onChange={(v) => patchCategory(c.id, { image: v })}
                        onChoose={() => setPicker({ apply: (url) => patchCategory(c.id, { image: url }) })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{servicesByCat.get(c.id)?.length || 0} treatments in this category</label>
                      <div className="text-sm text-gray-500 px-3 py-2">Edit treatments in the Services tab.</div>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addCategory}>+ Add Category</Button>
            </div>
          )}

          {/* SERVICES */}
          {tab === 'services' && (
            <div className="space-y-6">
              {sortedCategories.map((c) => {
                const list = servicesByCat.get(c.id) || [];
                return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{c.name} <span className="text-gray-400 font-normal">· {list.length}</span></h3>
                      <Button variant="outline" size="sm" onClick={() => addService(c.id)}>+ Add Treatment</Button>
                    </div>
                    {list.length === 0 && <div className="text-sm text-gray-400 italic">No treatments yet.</div>}
                    {list.map((s, i) => (
                      <ServiceCard
                        key={s.id}
                        s={s}
                        index={i}
                        count={list.length}
                        expanded={expanded.has(s.id)}
                        categories={sortedCategories}
                        input={input}
                        labelCls={labelCls}
                        onToggle={() => toggle(s.id)}
                        onPatch={(patch) => patchService(s.id, patch)}
                        onRemove={() => removeService(s.id)}
                        onMove={(dir) => moveService(s.id, dir)}
                        onAddTier={() => addTier(s.id)}
                        onRemoveTier={(idx) => removeTier(s.id, idx)}
                        onPatchTier={(idx, patch) => patchTier(s.id, idx, patch)}
                        onPickImage={() => setPicker({ apply: (url) => patchService(s.id, { image: url }) })}
                      />
                    ))}
                  </div>
                );
              })}
              {orphanServices.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-600">⚠ Uncategorized (category missing)</h3>
                  {orphanServices.map((s, i) => (
                    <ServiceCard
                      key={s.id} s={s} index={i} count={orphanServices.length} expanded={expanded.has(s.id)}
                      categories={sortedCategories} input={input} labelCls={labelCls}
                      onToggle={() => toggle(s.id)} onPatch={(patch) => patchService(s.id, patch)}
                      onRemove={() => removeService(s.id)} onMove={() => {}}
                      onAddTier={() => addTier(s.id)} onRemoveTier={(idx) => removeTier(s.id, idx)}
                      onPatchTier={(idx, patch) => patchTier(s.id, idx, patch)}
                      onPickImage={() => setPicker({ apply: (url) => patchService(s.id, { image: url }) })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADD-ONS */}
          {tab === 'addons' && (
            <div className="space-y-3">
              {catalog.addons.map((a) => (
                <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 grid gap-3 md:grid-cols-[1fr,1fr,120px,auto] md:items-end">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input className={input} value={a.name} onChange={(e) => patchAddon(a.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Applies to</label>
                    <input className={input} value={typeof a.appliesTo === 'string' ? a.appliesTo : JSON.stringify(a.appliesTo)} onChange={(e) => patchAddon(a.id, { appliesTo: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Price ($)</label>
                    <input className={input} type="number" value={a.price} onChange={(e) => patchAddon(a.id, { price: Number(e.target.value) })} />
                  </div>
                  <button type="button" className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded" onClick={() => removeAddon(a.id)}>Delete</button>
                </div>
              ))}
              <Button variant="outline" onClick={addAddon}>+ Add Add-on</Button>
            </div>
          )}

          {/* JSON */}
          {tab === 'json' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Raw <code>{FILE}</code> for {locale}. Edit and click “Apply to form”, then Save.</p>
              <textarea
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-mono"
                rows={24}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              <Button variant="outline" onClick={applyJson}>Apply to form</Button>
            </div>
          )}
        </>
      )}

      <ImagePickerModal
        open={!!picker}
        siteId={siteId}
        onClose={() => setPicker(null)}
        onSelect={(url) => {
          picker?.apply(url);
          setPicker(null);
        }}
      />
    </div>
  );
}

// ---- Reusable image field: thumbnail preview + URL input + Choose/Clear ----
function ImageField({
  value, input, onChange, onChoose,
}: { value: string; input: string; onChange: (v: string) => void; onChoose: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-10 w-10 shrink-0 rounded object-cover border border-gray-200" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded border border-dashed border-gray-300 bg-gray-50" />
      )}
      <input className={input} value={value} placeholder="(blank = gradient placeholder)" onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="shrink-0 px-3 py-2 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={onChoose}>Choose</button>
      {value && (
        <button type="button" className="shrink-0 px-3 py-2 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50" onClick={() => onChange('')}>Clear</button>
      )}
    </div>
  );
}

// ---- Service card (collapsible) ----
function ServiceCard({
  s, index, count, expanded, categories, input, labelCls,
  onToggle, onPatch, onRemove, onMove, onAddTier, onRemoveTier, onPatchTier, onPickImage,
}: {
  s: Service; index: number; count: number; expanded: boolean; categories: Category[];
  input: string; labelCls: string;
  onToggle: () => void; onPatch: (p: Partial<Service>) => void; onRemove: () => void;
  onMove: (dir: -1 | 1) => void; onAddTier: () => void; onRemoveTier: (idx: number) => void;
  onPatchTier: (idx: number, p: Partial<Tier>) => void; onPickImage: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center gap-2 px-4 py-3">
        <button type="button" onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          <span className="text-gray-400 text-xs">{expanded ? '▼' : '▶'}</span>
          <span className="text-sm font-medium text-gray-900">{s.name || s.id}</span>
          {!s.enabled && <span className="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">hidden</span>}
          {s.badge && <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{s.badge}</span>}
          <span className="text-xs text-gray-400">{s.tiers.map((t) => `${t.minutes}m $${t.price}`).join(' · ')}</span>
        </button>
        <button type="button" className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30" disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
        <button type="button" className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30" disabled={index === count - 1} onClick={() => onMove(1)}>↓</button>
        <button type="button" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded" onClick={onRemove}>Delete</button>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Name</label>
              <input className={input} value={s.name} onChange={(e) => onPatch({ name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>ID / slug</label>
              <input className={input} value={s.id} disabled title="Service id is fixed (used in booking links). Change via JSON if needed." />
            </div>
          </div>
          <div>
            <label className={labelCls}>Short description</label>
            <textarea className={input} rows={2} value={s.short} onChange={(e) => onPatch({ short: e.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelCls}>Category</label>
              <select className={input} value={s.categoryId} onChange={(e) => onPatch({ categoryId: e.target.value })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <select className={input} value={s.badge || ''} onChange={(e) => onPatch({ badge: e.target.value || null })}>
                <option value="">None</option>
                <option value="popular">Popular</option>
                <option value="new">New</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Intensity (1–3)</label>
              <input className={input} type="number" min={1} max={3} value={s.intensity ?? 1} onChange={(e) => onPatch({ intensity: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Goal tags (comma-separated)</label>
              <input className={input} value={(s.goalTags || []).join(', ')} onChange={(e) => onPatch({ goalTags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
            </div>
            <div>
              <label className={labelCls}>Image</label>
              <ImageField value={s.image || ''} input={input} onChange={(v) => onPatch({ image: v })} onChoose={onPickImage} />
            </div>
          </div>
          {/* Tiers */}
          <div>
            <label className={labelCls}>Tiers (duration → price) — shared across languages</label>
            <div className="space-y-2">
              {s.tiers.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input className="w-28 rounded-md border border-gray-200 px-3 py-2 text-sm" type="number" value={t.minutes} onChange={(e) => onPatchTier(idx, { minutes: Number(e.target.value) })} />
                  <span className="text-xs text-gray-400">min</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-xs text-gray-400">$</span>
                  <input className="w-28 rounded-md border border-gray-200 px-3 py-2 text-sm" type="number" value={t.price} onChange={(e) => onPatchTier(idx, { price: Number(e.target.value) })} />
                  <button type="button" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded" onClick={() => onRemoveTier(idx)} disabled={s.tiers.length <= 1}>Remove</button>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-xs text-[var(--primary)] hover:underline" onClick={onAddTier}>+ Add tier</button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={s.enabled} onChange={(e) => onPatch({ enabled: e.target.checked })} />
            Visible on site
          </label>
        </div>
      )}
    </div>
  );
}
