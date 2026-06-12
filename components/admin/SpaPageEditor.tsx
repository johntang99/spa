'use client';

// Spa-aware content editor for page JSON files (content/<site>/<locale>/pages/*.json + core
// globals). The cloned ContentEditor used clinic-shaped panels (hero gallery/overlay/position)
// that don't match our spa section schema, so this renders a generic, schema-agnostic smart form:
// every field is editable, image-like fields get the media picker, and images sync across
// languages on save (a page's photos are shared; its words are per-language).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import type { SiteConfig } from '@/lib/types';
import { Button } from '@/components/ui';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';
import { HERO_VARIANTS, HERO_CONTENT_POSITIONS } from '@/lib/spa/hero-variants';

// Fields rendered as a dropdown instead of free text (key → options). `variant` is
// only treated as a hero-variant select when it sits directly under the `hero` section.
const SELECT_OPTIONS: Record<string, readonly string[]> = {
  contentPosition: HERO_CONTENT_POSITIONS,
  mediaSide: ['left', 'right'],
};
const IMAGE_ARRAY_KEYS = new Set(['gallery', 'images', 'photos']);

interface FileItem { id: string; label: string; path: string }
interface Props {
  sites: SiteConfig[];
  selectedSiteId: string;
  selectedLocale: string;
  initialFilePath?: string;
}

// A field whose key is one of these AND whose value is a string is treated as an image URL.
const IMAGE_KEYS = new Set(['image', 'media', 'backgroundImage', 'photo', 'src', 'beforeImage', 'afterImage', 'thumbnail', 'ogImage', 'avatar']);
const LONG_TEXT_KEYS = new Set(['body', 'subline', 'intro', 'description', 'text', 'answer', 'quote', 'bio', 'content', 'summary', 'excerpt']);
const isImageKey = (k: string, v: any) => IMAGE_KEYS.has(k) && (typeof v === 'string');

const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c) => c.toUpperCase());

// Core global files worth editing here (beyond pages/*). Layouts handled separately.
const GLOBAL_PATHS = ['site.json', 'seo.json', 'header.json', 'footer.json', 'navigation.json', 'theme.json'];

export function SpaPageEditor({ sites, selectedSiteId, selectedLocale, initialFilePath }: Props) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [locale, setLocale] = useState<Locale>(selectedLocale as Locale);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activePath, setActivePath] = useState<string>(initialFilePath || 'pages/home.json');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [picker, setPicker] = useState<{ apply: (url: string) => void } | null>(null);
  const [filter, setFilter] = useState('');

  const selectedSite = sites.find((s) => s.id === siteId);
  const supportedLocales = (selectedSite?.supportedLocales as string[] | undefined) || ['en'];

  // Load the file list (pages + core globals), filtered for usability.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/content/files?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(locale)}`);
        if (!res.ok) return;
        const { files: all } = await res.json();
        const filtered: FileItem[] = (all || [])
          .filter((f: any) => (f.path.startsWith('pages/') && !f.path.endsWith('.layout.json')) || GLOBAL_PATHS.includes(f.path))
          .map((f: any) => ({ id: f.id, label: f.label, path: f.path }));
        // Stable order: pages first (alpha), then globals.
        filtered.sort((a, b) => {
          const ap = a.path.startsWith('pages/'), bp = b.path.startsWith('pages/');
          if (ap !== bp) return ap ? -1 : 1;
          return a.label.localeCompare(b.label);
        });
        if (!cancelled) setFiles(filtered);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [siteId, locale]);

  const loadFile = useCallback(async (path: string) => {
    setLoading(true); setError(null); setStatus(null);
    try {
      const res = await fetch(`/api/admin/content/file?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || `Load failed (${res.status})`);
      const { content } = await res.json();
      setData(JSON.parse(content || '{}'));
    } catch (e: any) {
      setError(e?.message || 'Failed to load file');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [siteId, locale]);

  useEffect(() => { loadFile(activePath); }, [loadFile, activePath]);
  useEffect(() => { if (view === 'json' && data) setJsonText(JSON.stringify(data, null, 2)); }, [view, data]);

  // ---- immutable path helpers ----
  const getPath = (obj: any, path: (string | number)[]) => path.reduce((o, k) => (o == null ? o : o[k]), obj);
  const setPath = (obj: any, path: (string | number)[], value: any) => {
    const next = structuredClone(obj);
    let cur = next;
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i];
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = typeof path[i + 1] === 'number' ? [] : {};
      cur = cur[k];
    }
    cur[path[path.length - 1]] = value;
    return next;
  };
  const update = (path: (string | number)[], value: any) => setData((d: any) => setPath(d, path, value));
  const removeAt = (path: (string | number)[], index: number) =>
    setData((d: any) => { const arr = [...(getPath(d, path) || [])]; arr.splice(index, 1); return setPath(d, path, arr); });
  const addItem = (path: (string | number)[], template: any) =>
    setData((d: any) => { const arr = [...(getPath(d, path) || [])]; arr.push(template); return setPath(d, path, arr); });
  const moveItem = (path: (string | number)[], index: number, dir: -1 | 1) =>
    setData((d: any) => {
      const arr = [...(getPath(d, path) || [])];
      const j = index + dir; if (j < 0 || j >= arr.length) return d;
      [arr[index], arr[j]] = [arr[j], arr[index]];
      return setPath(d, path, arr);
    });

  // Collect image-key leaf paths (for cross-locale sync).
  const collectImagePaths = (node: any, path: (string | number)[] = [], acc: { path: (string | number)[]; value: string }[] = []) => {
    if (Array.isArray(node)) node.forEach((v, i) => collectImagePaths(v, [...path, i], acc));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) {
      if (isImageKey(k, v)) acc.push({ path: [...path, k], value: v as string });
      else collectImagePaths(v, [...path, k], acc);
    }
    return acc;
  };

  const putFile = async (loc: string, path: string, payload: any) => {
    const res = await fetch('/api/admin/content/file', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, locale: loc, path, content: JSON.stringify(payload, null, 2) }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b?.message || b?.error || `Save failed for ${loc} (${res.status})`);
    }
  };

  const applyJsonIfNeeded = (): any => {
    if (view !== 'json') return data;
    try { const parsed = JSON.parse(jsonText); return parsed; }
    catch (e: any) { throw new Error(`Invalid JSON: ${e?.message || e}`); }
  };

  const save = async () => {
    setSaving(true); setError(null); setStatus(null);
    try {
      const payload = applyJsonIfNeeded();
      if (view === 'json') setData(payload);
      await putFile(locale, activePath, payload);
      // Sync image fields to sibling locales (shared photos), keeping their text.
      const imgPaths = collectImagePaths(payload);
      const others = supportedLocales.filter((l) => l !== locale);
      let synced = 0;
      if (imgPaths.length) {
        for (const other of others) {
          try {
            const res = await fetch(`/api/admin/content/file?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(other)}&path=${encodeURIComponent(activePath)}`);
            if (!res.ok) continue;
            let sib = JSON.parse((await res.json()).content || '{}');
            for (const { path, value } of imgPaths) sib = setPath(sib, path, value);
            await putFile(other, activePath, sib);
            synced++;
          } catch { /* skip sibling */ }
        }
      }
      setStatus(imgPaths.length && synced ? `Saved · synced ${imgPaths.length} image${imgPaths.length > 1 ? 's' : ''} to ${others.join(', ')}` : 'Saved');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-md border border-gray-200 px-3 py-2 text-sm';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';
  const toggleCollapse = (key: string) => setCollapsed((c) => { const n = new Set(c); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const visibleFiles = useMemo(
    () => files.filter((f) => !filter || f.label.toLowerCase().includes(filter.toLowerCase())),
    [files, filter]
  );

  // ---- recursive field renderer ----
  function Field({ k, value, path }: { k: string; value: any; path: (string | number)[] }) {
    const label = titleCase(k);
    if (isImageKey(k, value)) {
      return (
        <div>
          <label className={labelCls}>{label}</label>
          <ImageField value={value || ''} input={input}
            onChange={(v) => update(path, v)}
            onChoose={() => setPicker({ apply: (url) => update(path, url) })} />
        </div>
      );
    }
    if (typeof value === 'boolean') {
      return (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={value} onChange={(e) => update(path, e.target.checked)} /> {label}
        </label>
      );
    }
    if (typeof value === 'number') {
      return (
        <div>
          <label className={labelCls}>{label}</label>
          <input className={input} type="number" value={value} onChange={(e) => update(path, e.target.value === '' ? 0 : Number(e.target.value))} />
        </div>
      );
    }
    if (typeof value === 'string') {
      // Enum dropdowns: hero variant (only under the `hero` section) + known enum keys.
      const options = (k === 'variant' && path[0] === 'hero') ? HERO_VARIANTS : SELECT_OPTIONS[k];
      if (options) {
        return (
          <div>
            <label className={labelCls}>{label}</label>
            <select className={input} value={value} onChange={(e) => update(path, e.target.value)}>
              {!options.includes(value) && value && <option value={value}>{value}</option>}
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        );
      }
      const long = LONG_TEXT_KEYS.has(k) || value.length > 70;
      return (
        <div>
          <label className={labelCls}>{label}</label>
          {long
            ? <textarea className={input} rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60)))} value={value} onChange={(e) => update(path, e.target.value)} />
            : <input className={input} value={value} onChange={(e) => update(path, e.target.value)} />}
        </div>
      );
    }
    if (Array.isArray(value)) {
      const isObjArray = value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0]);
      const template = isObjArray ? Object.fromEntries(Object.keys(value[0]).map((key) => [key, typeof value[0][key] === 'object' ? (Array.isArray(value[0][key]) ? [] : {}) : (typeof value[0][key] === 'number' ? 0 : typeof value[0][key] === 'boolean' ? false : '')])) : '';
      return (
        <div className="space-y-2">
          <label className={labelCls}>{label} <span className="text-gray-400">({value.length})</span></label>
          <div className="space-y-2 pl-3 border-l-2 border-gray-100">
            {value.map((item, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">#{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30" disabled={i === 0} onClick={() => moveItem(path, i, -1)}>↑</button>
                    <button type="button" className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30" disabled={i === value.length - 1} onClick={() => moveItem(path, i, 1)}>↓</button>
                    <button type="button" className="px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded" onClick={() => removeAt(path, i)}>Remove</button>
                  </div>
                </div>
                {typeof item === 'object' && item !== null
                  ? <div className="space-y-2">{Object.entries(item).map(([ck, cv]) => <Field key={ck} k={ck} value={cv} path={[...path, i, ck]} />)}</div>
                  : IMAGE_ARRAY_KEYS.has(k) && typeof item === 'string'
                    ? <ImageField value={item} input={input} onChange={(v) => update([...path, i], v)} onChoose={() => setPicker({ apply: (url) => update([...path, i], url) })} />
                    : <Field k={String(i)} value={item} path={[...path, i]} />}
              </div>
            ))}
            <button type="button" className="text-xs text-[var(--primary)] hover:underline" onClick={() => addItem(path, structuredClone(template))}>+ Add {label.replace(/s$/, '') || 'item'}</button>
          </div>
        </div>
      );
    }
    if (value && typeof value === 'object') {
      return (
        <div className="space-y-2">
          <label className={labelCls}>{label}</label>
          <div className="space-y-2 pl-3 border-l-2 border-gray-100">
            {Object.entries(value).map(([ck, cv]) => <Field key={ck} k={ck} value={cv} path={[...path, ck]} />)}
          </div>
        </div>
      );
    }
    // null / undefined → editable text
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <input className={input} value={value == null ? '' : String(value)} onChange={(e) => update(path, e.target.value)} />
      </div>
    );
  }

  const sections = data && typeof data === 'object' && !Array.isArray(data) ? Object.entries(data) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content</h1>
          <p className="text-sm text-gray-600">Edit page content &amp; images. Photos are shared across languages; text is per-language.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className={labelCls}>Site</label>
            <select className={input} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select className={input} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              {supportedLocales.map((l) => <option key={l} value={l}>{l === 'en' ? 'English' : l === 'zh' ? 'Chinese' : l}</option>)}
            </select>
          </div>
          <Button onClick={save} disabled={saving || loading}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {(status || error) && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error || status}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* File list */}
        <div className="space-y-2">
          <input className={input} placeholder="Filter files…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="space-y-1 max-h-[70vh] overflow-auto pr-1">
            {visibleFiles.map((f) => (
              <button key={f.path} type="button" onClick={() => setActivePath(f.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activePath === f.path ? 'bg-[var(--primary)] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                <div className="font-medium">{f.label}</div>
                <div className="text-xs opacity-70">{f.path}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setView('form')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'form' ? 'bg-[var(--primary)] text-white' : 'border border-gray-200 text-gray-700'}`}>Form</button>
            <button type="button" onClick={() => setView('json')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'json' ? 'bg-[var(--primary)] text-white' : 'border border-gray-200 text-gray-700'}`}>JSON</button>
            <span className="text-xs text-gray-400 ml-2">{activePath}</span>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : view === 'json' ? (
            <textarea className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-mono" rows={28} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          ) : (
            <div className="space-y-3">
              {sections.map(([key, value]) => {
                const isContainer = value && typeof value === 'object';
                const isOpen = !collapsed.has(key);
                return (
                  <div key={key} className="bg-white border border-gray-200 rounded-xl">
                    <button type="button" onClick={() => toggleCollapse(key)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
                      <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                      <span className="text-sm font-semibold text-gray-900">{titleCase(key)}</span>
                      {Array.isArray(value) && <span className="text-xs text-gray-400">[{value.length}]</span>}
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 p-4 space-y-3">
                        {isContainer
                          ? (Array.isArray(value)
                              ? <Field k={key} value={value} path={[key]} />
                              : Object.entries(value).map(([ck, cv]) => <Field key={ck} k={ck} value={cv} path={[key, ck]} />))
                          : <Field k={key} value={value} path={[key]} />}
                      </div>
                    )}
                  </div>
                );
              })}
              {!sections.length && <div className="text-sm text-gray-500">Empty file.</div>}
            </div>
          )}
        </div>
      </div>

      <ImagePickerModal open={!!picker} siteId={siteId} onClose={() => setPicker(null)} onSelect={(url) => { picker?.apply(url); setPicker(null); }} />
    </div>
  );
}

// Reusable image field: thumbnail + URL input + Choose/Clear.
function ImageField({ value, input, onChange, onChoose }: { value: string; input: string; onChange: (v: string) => void; onChoose: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {value
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={value} alt="" className="h-10 w-10 shrink-0 rounded object-cover border border-gray-200" />
        : <div className="h-10 w-10 shrink-0 rounded border border-dashed border-gray-300 bg-gray-50" />}
      <input className={input} value={value} placeholder="(blank = none / gradient placeholder)" onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="shrink-0 px-3 py-2 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={onChoose}>Choose</button>
      {value && <button type="button" className="shrink-0 px-3 py-2 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50" onClick={() => onChange('')}>Clear</button>}
    </div>
  );
}
