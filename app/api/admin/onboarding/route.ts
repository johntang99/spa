import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { isSuperAdmin } from '@/lib/admin/permissions';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { insertContentRevision } from '@/lib/contentDb';
import {
  approveRewriteItems,
  createRewriteJob,
  listRewriteItems,
  markRewriteItemsApplied,
  replaceRewriteItems,
  updateRewriteJob,
  writeRewriteAuditLog,
} from '@/lib/admin/rewriteDb';
import { extractRewriteItems, generateRewriteItemsFromProvider } from '@/lib/admin/rewriteEngine';
import { generateRewriteWithProvider, isRewriteProviderConfigured } from '@/lib/ai/rewrite/provider';
import { profileWithMergedBio } from '@/lib/about-profile-bio';

// ── Types ────────────────────────────────────────────────────────────

interface StepProgress {
  step: string;
  label: string;
  status: 'running' | 'done' | 'error';
  message: string;
  duration?: number;
}

interface OnboardResult {
  siteId: string;
  entries: number;
  services: number;
  domains: number;
  errors: string[];
  warnings: string[];
}

// ── TCM Service catalog ──────────────────────────────────────────────

const TCM_SERVICES: Record<string, Array<{ slug: string; label: string }>> = {
  'Core Modalities': [
    { slug: 'acupuncture', label: 'Acupuncture' },
    { slug: 'chinese-herbal-medicine', label: 'Chinese Herbal Medicine' },
    { slug: 'cupping-therapy', label: 'Cupping Therapy' },
    { slug: 'moxibustion', label: 'Moxibustion' },
  ],
  'Manual Therapies': [
    { slug: 'tuina-massage', label: 'Tui Na Medical Massage' },
    { slug: 'gua-sha', label: 'Gua Sha' },
  ],
  'Wellness & Lifestyle': [
    { slug: 'dietary-therapy', label: 'Chinese Dietary Therapy' },
    { slug: 'lifestyle-counseling', label: 'Lifestyle & Wellness Counseling' },
  ],
};

// Flat list of all service slugs for default/pruning
const ALL_SERVICE_SLUGS = Object.values(TCM_SERVICES).flat().map((s) => s.slug);

// Category-to-slugs mapping for pruning
const SERVICE_CATEGORIES: Record<string, string[]> = {
  'Core Modalities': ['acupuncture', 'chinese-herbal-medicine', 'cupping-therapy', 'moxibustion'],
  'Manual Therapies': ['tuina-massage', 'gua-sha'],
  'Wellness & Lifestyle': ['dietary-therapy', 'lifestyle-counseling'],
};

// ── Color utilities ──────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function darken(hex: string, percent: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - percent));
}

function lighten(hex: string, percent: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, l + percent));
}

// ── Deep string replace ──────────────────────────────────────────────

function deepReplace(obj: any, replacements: [string, string][]): any {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [search, replace] of replacements) {
      result = result.replaceAll(search, replace);
    }
    return result;
  }
  if (Array.isArray(obj)) return obj.map((item) => deepReplace(item, replacements));
  if (obj && typeof obj === 'object') {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      out[key] = deepReplace(val, replacements);
    }
    return out;
  }
  return obj;
}

// ── Slugify ──────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/^(dr\.?\s+)/i, 'dr-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Phone to tel link ────────────────────────────────────────────────

function phoneToTel(phone: string): string {
  return 'tel:+1' + phone.replace(/[^0-9]/g, '');
}

/** Geo slug suffix e.g. middletown-ny — matches seed-seo-pages.mjs convention. */
function normalizeStateAbbr(state: string | undefined): string {
  return String(state || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 2);
}

function citySlugPart(loc: any): string {
  if (loc?.citySlug) {
    return String(loc.citySlug)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  return String(loc?.city || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function geoSuffixFromLocation(loc: any): string {
  const c = citySlugPart(loc);
  const s = normalizeStateAbbr(loc?.state);
  if (!c || !s) return '';
  return `${c}-${s}`;
}

function googleMapsEmbedUrl(loc: any): string {
  if (loc?.address && loc?.city && loc?.state && loc?.zip) {
    return `https://www.google.com/maps?q=${encodeURIComponent(
      `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`
    )}&output=embed`;
  }
  return '';
}

function googleDirectionsUrl(loc: any): string {
  if (loc?.address && loc?.city && loc?.state && loc?.zip) {
    return `https://maps.google.com/?q=${encodeURIComponent(
      `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`
    )}`;
  }
  return '';
}

const INTAKE_DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
const INTAKE_DAY_LABEL: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function intakeHoursToSeoLocationSchedule(
  hours: Record<string, string> | undefined
): Array<{ day: string; time: string }> {
  if (!hours || typeof hours !== 'object') return [];
  return INTAKE_DAY_ORDER.filter((d) => hours[d]).map((d) => ({
    day: INTAKE_DAY_LABEL[d] || d,
    time: hours[d],
  }));
}

async function fetchTemplateGeoSuffix(templateId: string): Promise<string> {
  try {
    const intakeRows = await fetchRows('content_entries', {
      site_id: templateId,
      locale: 'en',
      path: 'intake.json',
    });
    const intakeData = intakeRows[0]?.data;
    if (intakeData?.location) {
      const g = geoSuffixFromLocation(intakeData.location);
      if (g) return g;
    }
  } catch {
    // ignore
  }
  try {
    const seoRows = await fetchRows('site_seo_pages', { site_id: templateId });
    const core = (seoRows as any[]).find((p) => p.page_type === 'seo-local-landing');
    if (core?.slug && typeof core.slug === 'string') {
      const m = core.slug.match(/^acupuncture-(.+)$/);
      if (m?.[1]) return m[1];
    }
  } catch {
    // ignore
  }
  return '';
}

/** Rename SEO content_entries whose path ends with oldSuffix (e.g. *-middletown-ny → *-flushing-ny). */
async function remapContentEntrySeoSlugs(
  siteId: string,
  oldSuffix: string,
  newSuffix: string
): Promise<number> {
  const entries = await fetchRows('content_entries', { site_id: siteId });
  const targets = entries.filter(
    (e) => typeof e.path === 'string' && e.path.endsWith(oldSuffix)
  );
  if (targets.length === 0) return 0;
  const pairs: [string, string][] = [
    [oldSuffix, newSuffix],
    [`-${oldSuffix}`, `-${newSuffix}`],
  ];
  for (const e of targets) {
    await deleteRows('content_entries', { site_id: siteId, locale: e.locale, path: e.path });
  }
  for (const e of targets) {
    const newPath = e.path.slice(0, -oldSuffix.length) + newSuffix;
    const newData = deepReplace(e.data, pairs);
    await upsert(
      'content_entries',
      [
        {
          site_id: siteId,
          locale: e.locale,
          path: newPath,
          data: newData,
          updated_by: 'onboard-api',
        },
      ],
      'site_id,locale,path'
    );
  }
  return targets.length;
}

async function remapSiteSeoPagesSlugs(
  siteId: string,
  oldSuffix: string,
  newSuffix: string
): Promise<number> {
  const pages = await fetchRows('site_seo_pages', { site_id: siteId });
  const targets = pages.filter(
    (p) => typeof p.slug === 'string' && p.slug.endsWith(oldSuffix)
  );
  for (const p of targets) {
    await deleteRows('site_seo_pages', { site_id: siteId, slug: p.slug });
  }
  for (const p of targets) {
    const newSlug = p.slug.slice(0, -oldSuffix.length) + newSuffix;
    await upsert(
      'site_seo_pages',
      [
        {
          site_id: siteId,
          slug: newSlug,
          page_type: p.page_type,
          active: p.active !== false,
        },
      ],
      'site_id,slug'
    );
  }
  return targets.length;
}

async function augmentReplacementsFromTemplateSite(
  templateId: string,
  loc: any,
  intake: any,
  replacements: [string, string][]
): Promise<void> {
  try {
    const rows = await fetchRows('content_entries', {
      site_id: templateId,
      locale: 'en',
      path: 'site.json',
    });
    const ts = rows[0]?.data;
    if (ts && loc?.phone && ts.phone && String(ts.phone) !== loc.phone) {
      const td = String(ts.phone).replace(/[^0-9]/g, '');
      replacements.push([String(ts.phone), loc.phone]);
      if (td.length >= 10) {
        replacements.push([`+1${td}`, `+1${loc.phone.replace(/[^0-9]/g, '')}`]);
        replacements.push([`tel:+1${td}`, phoneToTel(loc.phone)]);
      }
    }
    if (ts && loc?.email && ts.email && String(ts.email) !== loc.email) {
      replacements.push([String(ts.email), loc.email], [`mailto:${ts.email}`, `mailto:${loc.email}`]);
    }
    if (
      ts &&
      loc?.address &&
      loc?.city &&
      loc?.state &&
      loc?.zip &&
      ts.address &&
      ts.city &&
      ts.state &&
      ts.zip
    ) {
      const fullOld = `${ts.address}, ${ts.city}, ${ts.state} ${ts.zip}`;
      const fullNew = `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`;
      if (fullOld !== fullNew) {
        replacements.push([fullOld, fullNew]);
        replacements.push([String(ts.address), String(loc.address)]);
        replacements.push([
          `${ts.city}, ${ts.state} ${ts.zip}`,
          `${loc.city}, ${loc.state} ${loc.zip}`,
        ]);
        replacements.push([`${ts.city}, ${ts.state}`, `${loc.city}, ${loc.state}`]);
      }
    }
    const tplSiteMeta = await fetchRows('sites', { id: templateId });
    const dom = String(tplSiteMeta[0]?.domain || '').trim();
    const prod = String(intake?.domains?.production || '').trim();
    if (dom && prod && dom !== prod) {
      replacements.push([dom, prod], [`www.${dom}`, `www.${prod}`]);
    }
  } catch {
    // non-blocking
  }
}

/** Force NAP + map on SEO JSON (local landing + any page with location block). */
function applySeoLocationContactPatch(
  data: any,
  biz: any,
  loc: any,
  intake: any,
  locale: string
): any {
  if (!data || typeof data !== 'object') return data;
  const pt = data.pageType;
  if (typeof pt !== 'string' || !pt.startsWith('seo-')) return data;

  const next = data;
  const isZh = String(locale || '').startsWith('zh');
  if (next.location && typeof next.location === 'object') {
    const L = next.location;
    if (L.nap && typeof L.nap === 'object') {
      if (biz?.name) L.nap.name = biz.name;
      if (loc?.address) L.nap.address = loc.address;
      if (loc?.city) L.nap.city = loc.city;
      if (loc?.state) L.nap.state = loc.state;
      if (loc?.zip) L.nap.zip = loc.zip;
      if (loc?.phone) L.nap.phone = loc.phone;
    }
    if (biz?.name) {
      if ('clinicName' in L) L.clinicName = biz.name;
      if ('title' in L && typeof L.title === 'string' && L.title.includes('Visit ')) {
        L.title = L.title.replace(/^Visit\s+.+?\s+in\s+/i, `Visit ${biz.name} in `);
      }
    }
    if (loc?.address) L.address = loc.address;
    if (loc?.city) L.city = loc.city;
    if (loc?.state) L.state = loc.state;
    if (loc?.zip) L.zip = loc.zip;
    if (loc?.phone) L.phone = loc.phone;
    if (loc?.email) L.email = loc.email;

    const emb = googleMapsEmbedUrl(loc) || (loc?.addressMapUrl ? String(loc.addressMapUrl) : '');
    if (emb) {
      L.mapEmbedUrl = emb;
      const dir = googleDirectionsUrl(loc);
      if (dir) L.directionsUrl = dir;
    }

    const sched = intakeHoursToSeoLocationSchedule(intake?.hours);
    if (sched.length > 0) {
      L.hours = sched;
    }
  }

  if (next.hero?.secondaryCta && loc?.phone) {
    next.hero.secondaryCta.link = phoneToTel(loc.phone);
    next.hero.secondaryCta.text = isZh ? `致电${loc.phone}` : `Call ${loc.phone}`;
  }

  return next;
}

async function patchAllSeoContentEntries(
  siteId: string,
  biz: any,
  loc: any,
  intake: any
): Promise<number> {
  const entries = await fetchRows('content_entries', { site_id: siteId });
  let n = 0;
  const updates: any[] = [];
  for (const entry of entries) {
    if (!entry.data || typeof entry.data !== 'object') continue;
    const pt = (entry.data as any).pageType;
    if (typeof pt !== 'string' || !pt.startsWith('seo-')) continue;
    const before = JSON.stringify(entry.data);
    const copy = JSON.parse(before);
    applySeoLocationContactPatch(copy, biz, loc, intake, entry.locale);
    if (JSON.stringify(copy) !== before) {
      updates.push({
        site_id: siteId,
        locale: entry.locale,
        path: entry.path,
        data: copy,
        updated_by: 'onboard-api',
      });
      n += 1;
    }
  }
  const BATCH = 50;
  for (let i = 0; i < updates.length; i += BATCH) {
    await upsert('content_entries', updates.slice(i, i + BATCH), 'site_id,locale,path');
  }
  return n;
}

function ownerDisplayName(biz: any): string {
  return biz?.ownerNameWithCredentials || biz?.ownerName || biz?.name || '';
}

function locationLabel(loc: any): string {
  if (!loc?.city && !loc?.state) return '';
  if (loc.city && loc.state) return `${loc.city}, ${loc.state}`;
  return loc.city || loc.state || '';
}

function formatBioParagraphs(raw: string | undefined, minParagraphs = 3, maxParagraphs = 4): string | undefined {
  if (!raw || typeof raw !== 'string') return raw;
  const existing = raw
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
  if (existing.length >= minParagraphs) {
    return existing.slice(0, maxParagraphs).join('\n\n');
  }
  const normalized = raw.replace(/\s+/g, ' ').trim();
  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [normalized];
  if (sentences.length <= 1) return normalized;

  const target = Math.min(maxParagraphs, Math.max(minParagraphs, Math.ceil(sentences.length / 3)));
  const chunkSize = Math.max(1, Math.ceil(sentences.length / target));
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    chunks.push(sentences.slice(i, i + chunkSize).join(' ').trim());
  }
  return chunks.slice(0, maxParagraphs).join('\n\n');
}

function normalizeServiceFullDescription(raw: string | undefined): string | undefined {
  if (typeof raw !== 'string') return raw;
  const headings = [
    'Scope of Application',
    'Precautions',
    'Core Benefits',
    'Key Benefits',
    'What to Expect',
    '適用範圍',
    '注意事項',
    '核心亮點',
    '服務說明',
  ];

  let normalized = raw.replace(/\r\n/g, '\n').trim();
  for (const heading of headings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const headingPattern = new RegExp(`\\*\\*${escaped}\\*\\*\\s*`, 'g');
    normalized = normalized.replace(headingPattern, `\n\n**${heading}**\n`);
  }
  normalized = normalized.replace(/\n{3,}/g, '\n\n').trim();

  // If provider output removed heading markers and produced one long block,
  // enforce paragraph readability at save-time.
  const hasParagraphBreaks = /\n\s*\n/.test(normalized);
  if (!hasParagraphBreaks) {
    const sentenceRegex = /[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g;
    const sentences = normalized
      .match(sentenceRegex)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) || [normalized];
    const hasCjk = /[\u3400-\u9fff]/.test(normalized);

    if (sentences.length >= 4 || normalized.length >= 260 || (hasCjk && sentences.length >= 3)) {
      const targetParagraphs = Math.min(4, Math.max(3, Math.ceil(sentences.length / 3)));
      const chunkSize = Math.max(1, Math.ceil(sentences.length / targetParagraphs));
      const chunks: string[] = [];
      for (let i = 0; i < sentences.length; i += chunkSize) {
        chunks.push(sentences.slice(i, i + chunkSize).join(' ').trim());
      }
      normalized = chunks.slice(0, 4).join('\n\n');
    }
  }

  return normalized.trim();
}

function normalizeServicesListDescriptions(servicesPageData: any): any {
  if (!servicesPageData || typeof servicesPageData !== 'object') return servicesPageData;
  if (!Array.isArray(servicesPageData.servicesList?.items)) return servicesPageData;

  servicesPageData.servicesList.items = servicesPageData.servicesList.items.map((item: any) => {
    if (!item || typeof item !== 'object') return item;
    return {
      ...item,
      fullDescription: normalizeServiceFullDescription(item.fullDescription),
    };
  });
  return servicesPageData;
}

// ── Template interpolation ───────────────────────────────────────────

function interpolateTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

async function syncSiteContentToLocal(siteId: string): Promise<number> {
  const siteEntries = await fetchRows('content_entries', { site_id: siteId });
  const siteDir = path.join(process.cwd(), 'content', siteId);
  await fsPromises.rm(siteDir, { recursive: true, force: true });
  let written = 0;
  for (const entry of siteEntries) {
    const locale = String(entry.locale || '').trim();
    const contentPath = String(entry.path || '').trim();
    if (!locale || !contentPath) continue;
    const filePath = path.join(siteDir, locale, contentPath);
    await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
    await fsPromises.writeFile(filePath, JSON.stringify(entry.data ?? {}, null, 2) + '\n', 'utf-8');
    written += 1;
  }
  return written;
}

async function canWriteToPath(targetPath: string): Promise<boolean> {
  const probeName = `.onboard-write-probe-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`;
  try {
    await fsPromises.mkdir(targetPath, { recursive: true });
    const probePath = path.join(targetPath, probeName);
    await fsPromises.writeFile(probePath, 'ok', 'utf-8');
    await fsPromises.rm(probePath, { force: true });
    return true;
  } catch {
    return false;
  }
}

// ── Supabase REST helpers ────────────────────────────────────────────

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return { url, key };
}

function supaHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };
}

async function supaFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { url, key } = getSupabaseConfig();
  const headers = { ...supaHeaders(key), ...(options.headers as Record<string, string> || {}) };
  return fetch(`${url}/rest/v1/${path}`, { ...options, headers });
}

async function upsert(table: string, rows: any[], onConflict?: string): Promise<any[]> {
  const queryPath = onConflict ? `${table}?on_conflict=${onConflict}` : table;
  const res = await supaFetch(queryPath, { method: 'POST', body: JSON.stringify(rows) });
  if (!res.ok) throw new Error(`Upsert ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function fetchRows(table: string, filters: Record<string, string>): Promise<any[]> {
  const { url, key } = getSupabaseConfig();
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${url}/rest/v1/${table}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Fetch ${table} failed (${res.status})`);
  return res.json();
}

async function deleteRows(table: string, filters: Record<string, string>): Promise<void> {
  const { key } = getSupabaseConfig();
  const res = await supaFetch(
    `${table}?${Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&')}`,
    { method: 'DELETE', headers: supaHeaders(key) }
  );
  if (!res.ok) throw new Error(`Delete ${table} failed (${res.status}): ${await res.text()}`);
}

// ── Supabase Storage helpers ─────────────────────────────────────────

function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || '';
}

async function listStorageFiles(prefix: string): Promise<string[]> {
  const { url, key } = getSupabaseConfig();
  const bucket = getStorageBucket();
  if (!bucket) return [];

  const files: string[] = [];
  const queue = [prefix];
  while (queue.length > 0) {
    const currentPrefix = queue.shift()!;
    const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: currentPrefix, limit: 1000, offset: 0 }),
    });
    if (!res.ok) break;
    const items: any[] = await res.json();
    for (const item of items) {
      const fullPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;
      if (item.id) {
        files.push(fullPath);
      } else {
        queue.push(fullPath);
      }
    }
  }
  return files;
}

async function copyStorageFile(fromPath: string, toPath: string): Promise<boolean> {
  const { url, key } = getSupabaseConfig();
  const bucket = getStorageBucket();
  const res = await fetch(`${url}/storage/v1/object/copy`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: bucket, sourceKey: fromPath, destinationKey: toPath }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (body.includes('already exists')) return true;
    return false;
  }
  return true;
}

// ── Claude API helpers ───────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API failed (${res.status}): ${body}`);
  }
  const result = await res.json();
  return result.content[0].text;
}

function parseJsonFromResponse(text: string): any {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e: any) {
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);
    throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
  }
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

type PathToken = string | number;

function tokenizeFieldPath(fieldPath: string): PathToken[] {
  const tokens: PathToken[] = [];
  const regex = /([^[.\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(fieldPath)) !== null) {
    if (match[1]) {
      tokens.push(match[1]);
    } else if (match[2]) {
      tokens.push(Number(match[2]));
    }
  }
  return tokens;
}

function setValueAtFieldPath(root: unknown, fieldPath: string, nextValue: string): boolean {
  const tokens = tokenizeFieldPath(fieldPath);
  if (tokens.length === 0 || !root || typeof root !== 'object') {
    return false;
  }

  let current: any = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i];
    if (typeof token === 'number') {
      if (!Array.isArray(current) || token < 0 || token >= current.length) return false;
      current = current[token];
    } else {
      if (!current || typeof current !== 'object' || !(token in current)) return false;
      current = current[token];
    }
  }

  const leaf = tokens[tokens.length - 1];
  if (typeof leaf === 'number') {
    if (!Array.isArray(current) || leaf < 0 || leaf >= current.length) return false;
    current[leaf] = nextValue;
    return true;
  }
  if (!current || typeof current !== 'object') return false;
  current[leaf] = nextValue;
  return true;
}

// ── POST handler ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!isSuperAdmin(session.user)) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse intake from request body
  let intake: any;
  try {
    intake = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalizedClientId =
    typeof intake.clientId === 'string' ? intake.clientId.trim().toLowerCase() : '';
  if (!normalizedClientId || !intake.business?.name) {
    return new Response(JSON.stringify({ message: 'clientId and business.name are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!/^[a-z0-9-]+$/.test(normalizedClientId)) {
    return new Response(
      JSON.stringify({
        message: 'clientId must contain only lowercase letters, numbers, and hyphens',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate Supabase config early
  try {
    getSupabaseConfig();
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const TEMPLATE_ID = intake.templateSiteId || 'dr-huang-clinic';
  const SITE_ID: string = normalizedClientId;
  const LOCALES: string[] = intake.locales?.supported || ['en'];
  const DEFAULT_LOCALE: string = intake.locales?.default || 'en';
  const SKIP_AI: boolean = intake.skipAi === true;
  const CONTENT_DIR = path.join(process.cwd(), 'content');
  const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
  const localContentWritable = await canWriteToPath(CONTENT_DIR);
  const localUploadsWritable = await canWriteToPath(UPLOADS_DIR);
  const canWriteLocalFilesystem = localContentWritable && localUploadsWritable;

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const emitProgress = (step: string, label: string, status: StepProgress['status'], message: string, duration?: number) => {
        const payload: StepProgress = { step, label, status, message };
        if (duration !== undefined) payload.duration = duration;
        emit('progress', payload);
      };

      const result: OnboardResult = {
        siteId: SITE_ID,
        entries: 0,
        services: 0,
        domains: 0,
        errors: [],
        warnings: [],
      };
      if (!canWriteLocalFilesystem) {
        result.warnings.push(
          'Local filesystem is read-only in this environment; onboarding skipped local file sync/copy and completed via DB/storage.'
        );
      }

      try {
        // ════════════════════════════════════════════════════════════════
        //  O1: CLONE
        // ════════════════════════════════════════════════════════════════
        const o1Start = Date.now();
        emitProgress('O1', 'Clone', 'running', 'Cloning template...');

        try {
          // Check if site already exists
          const existing = await fetchRows('sites', { id: SITE_ID });
          if (existing.length === 0) {
            await upsert('sites', [{
              id: SITE_ID,
              name: intake.business.name,
              domain: intake.domains?.production || '',
              enabled: true,
              default_locale: DEFAULT_LOCALE,
              supported_locales: LOCALES,
            }], 'id');
          }

          // Clone content entries from template
          const templateEntries = await fetchRows('content_entries', { site_id: TEMPLATE_ID });
          const cloned = templateEntries.map((e: any) => ({
            site_id: SITE_ID,
            locale: e.locale,
            path: e.path,
            data: e.data,
            updated_by: 'onboard-api',
          }));

          const BATCH = 50;
          for (let i = 0; i < cloned.length; i += BATCH) {
            await upsert('content_entries', cloned.slice(i, i + BATCH), 'site_id,locale,path');
          }

          // Clone site_seo_pages so sitemap + getServiceSEOLinks resolve SEO URLs for the new site.
          let clonedSeoPageRows = 0;
          try {
            const templateSeoPages = await fetchRows('site_seo_pages', { site_id: TEMPLATE_ID });
            if (templateSeoPages.length > 0) {
              const seoCloned = templateSeoPages.map((p: any) => ({
                site_id: SITE_ID,
                slug: p.slug,
                page_type: p.page_type,
                active: p.active !== false,
              }));
              for (let i = 0; i < seoCloned.length; i += BATCH) {
                await upsert('site_seo_pages', seoCloned.slice(i, i + BATCH), 'site_id,slug');
              }
              clonedSeoPageRows = seoCloned.length;
            }
          } catch (seoCloneErr: any) {
            result.warnings.push(
              `site_seo_pages clone skipped: ${seoCloneErr?.message || seoCloneErr}`
            );
          }

          // Persist intake for downstream scripts (e.g. seed-seo-pages.mjs) and QA.
          try {
            await upsert(
              'content_entries',
              [
                {
                  site_id: SITE_ID,
                  locale: DEFAULT_LOCALE,
                  path: 'intake.json',
                  data: { ...intake, clientId: normalizedClientId },
                  updated_by: 'onboard-api',
                },
              ],
              'site_id,locale,path'
            );
          } catch {
            // non-blocking
          }

          // Register domain aliases
          const domainRows: any[] = [];
          if (intake.domains?.production) {
            domainRows.push({ site_id: SITE_ID, domain: intake.domains.production, environment: 'prod', enabled: true });
          }
          if (intake.domains?.dev) {
            domainRows.push({ site_id: SITE_ID, domain: intake.domains.dev, environment: 'dev', enabled: true });
          }
          if (domainRows.length > 0) {
            await upsert('site_domains', domainRows, 'site_id,domain,environment');
          }
          result.domains = domainRows.length;

          // Clone booking services/settings from template so booking works out-of-box.
          // Also normalize default service duration to 45 minutes and prefill notifications.
          let clonedBookingServiceCount = 0;
          let clonedBookingSettings = false;
          try {
            const [templateBookingServices, templateBookingSettings] = await Promise.all([
              fetchRows('booking_services', { site_id: TEMPLATE_ID }),
              fetchRows('booking_settings', { site_id: TEMPLATE_ID }),
            ]);

            const fallbackNotificationEmails = String(process.env.CONTACT_FALLBACK_TO || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);
            const requestedNotificationEmails = [
              String(intake.location?.email || '').trim(),
              String(intake.business?.email || '').trim(),
            ].filter(Boolean);
            const notificationEmails = Array.from(
              new Set(
                (requestedNotificationEmails.length > 0
                  ? requestedNotificationEmails
                  : fallbackNotificationEmails)
              )
            );

            const templateServices = Array.isArray(templateBookingServices?.[0]?.services)
              ? templateBookingServices[0].services
              : [];
            const normalizedServices = templateServices.map((service: any) => ({
              ...service,
              durationMinutes: 45,
            }));
            if (normalizedServices.length > 0) {
              await upsert(
                'booking_services',
                [
                  {
                    site_id: SITE_ID,
                    services: normalizedServices,
                    updated_at: new Date().toISOString(),
                  },
                ],
                'site_id'
              );
              clonedBookingServiceCount = normalizedServices.length;
            }

            const templateSettings = templateBookingSettings?.[0]?.settings;
            if (templateSettings && typeof templateSettings === 'object') {
              const normalizedSettings = {
                ...templateSettings,
                defaultServiceType: 'appointment',
                notificationEmails,
              };
              await upsert(
                'booking_settings',
                [
                  {
                    site_id: SITE_ID,
                    settings: normalizedSettings,
                    updated_at: new Date().toISOString(),
                  },
                ],
                'site_id'
              );
              clonedBookingSettings = true;
            }
          } catch (bookingCloneError: any) {
            result.warnings.push(
              `Booking clone warning: ${bookingCloneError?.message || 'unable to clone booking settings/services'}`
            );
          }

          // Clone media assets DB records (remap URLs to new site namespace)
          const templateMedia = await fetchRows('media_assets', { site_id: TEMPLATE_ID });
          if (templateMedia.length > 0) {
            const mediaBatch = 100;
            for (let i = 0; i < templateMedia.length; i += mediaBatch) {
              const batch = templateMedia.slice(i, i + mediaBatch);
              const clonedMedia = batch.map((item: any) => ({
                site_id: SITE_ID,
                path: item.path,
                url: (item.url || '')
                  .replace(`/uploads/${TEMPLATE_ID}/`, `/uploads/${SITE_ID}/`)
                  .replace(`/${TEMPLATE_ID}/`, `/${SITE_ID}/`),
                updated_at: new Date().toISOString(),
              }));
              await upsert('media_assets', clonedMedia, 'site_id,path');
            }
          }

          // Copy files in Supabase Storage bucket
          if (getStorageBucket()) {
            const storageFiles = await listStorageFiles(TEMPLATE_ID);
            const CONCURRENCY = 5;
            for (let i = 0; i < storageFiles.length; i += CONCURRENCY) {
              const batch = storageFiles.slice(i, i + CONCURRENCY);
              await Promise.allSettled(
                batch.map((filePath) => {
                  const destPath = filePath.replace(`${TEMPLATE_ID}/`, `${SITE_ID}/`);
                  return copyStorageFile(filePath, destPath);
                })
              );
            }
          }

          if (canWriteLocalFilesystem) {
            // Copy file-based uploads and content directories
            const copyDirIfExists = async (src: string, dest: string) => {
              try {
                await fsPromises.access(src);
              } catch {
                return; // source doesn't exist, skip
              }
              await fsPromises.mkdir(path.dirname(dest), { recursive: true });
              await fsPromises.cp(src, dest, { recursive: true, errorOnExist: false });
            };

            await copyDirIfExists(
              path.join(UPLOADS_DIR, TEMPLATE_ID),
              path.join(UPLOADS_DIR, SITE_ID)
            );

            await copyDirIfExists(
              path.join(CONTENT_DIR, TEMPLATE_ID),
              path.join(CONTENT_DIR, SITE_ID)
            );

            // Update local _sites.json
            const sitesFile = path.join(CONTENT_DIR, '_sites.json');
            try {
              const sitesData = JSON.parse(fs.readFileSync(sitesFile, 'utf-8'));
              if (!sitesData.sites.find((s: any) => s.id === SITE_ID)) {
                sitesData.sites.push({
                  id: SITE_ID,
                  name: intake.business.name,
                  domain: intake.domains?.production || '',
                  enabled: true,
                  defaultLocale: DEFAULT_LOCALE,
                  supportedLocales: LOCALES,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                fs.writeFileSync(sitesFile, JSON.stringify(sitesData, null, 2) + '\n');
              }
            } catch {
              // _sites.json may not exist in all environments
            }

            // Update local _site-domains.json
            const domainsFile = path.join(CONTENT_DIR, '_site-domains.json');
            try {
              const domainsData = JSON.parse(fs.readFileSync(domainsFile, 'utf-8'));
              for (const dr of domainRows) {
                if (!domainsData.domains.find((d: any) => d.siteId === dr.site_id && d.domain === dr.domain)) {
                  domainsData.domains.push({ siteId: dr.site_id, domain: dr.domain, environment: dr.environment, enabled: true });
                }
              }
              fs.writeFileSync(domainsFile, JSON.stringify(domainsData, null, 2) + '\n');
            } catch {
              // _site-domains.json may not exist in all environments
            }
          }

          emitProgress(
            'O1',
            'Clone',
            'done',
            `Cloned ${cloned.length} entries, site_seo_pages: ${clonedSeoPageRows}, ${templateMedia.length} media assets, booking services: ${clonedBookingServiceCount}, booking settings: ${clonedBookingSettings ? 'yes' : 'no'}`,
            Date.now() - o1Start
          );
        } catch (err: any) {
          emitProgress('O1', 'Clone', 'error', err.message, Date.now() - o1Start);
          throw err;
        }

        // ════════════════════════════════════════════════════════════════
        //  O2: BRAND
        // ════════════════════════════════════════════════════════════════
        const o2Start = Date.now();
        emitProgress('O2', 'Brand', 'running', 'Applying brand theme...');

        try {
          const variantsPath = path.join(process.cwd(), 'scripts', 'onboard', 'brand-variants.json');
          const variants = JSON.parse(fs.readFileSync(variantsPath, 'utf-8'));
          const variantName = intake.brand?.variant || 'teal-gold';
          const base = JSON.parse(JSON.stringify(variants[variantName] || variants['teal-gold']));

          // Apply color overrides
          if (intake.brand?.primaryColor) {
            const pc = intake.brand.primaryColor;
            base.colors.primary.DEFAULT = pc;
            base.colors.primary.dark = darken(pc, 12);
            base.colors.primary.light = lighten(pc, 18);
            base.colors.primary['50'] = lighten(pc, 42);
            base.colors.primary['100'] = lighten(pc, 32);
          }
          if (intake.brand?.secondaryColor) {
            const sc = intake.brand.secondaryColor;
            base.colors.secondary.DEFAULT = sc;
            base.colors.secondary.dark = darken(sc, 12);
            base.colors.secondary.light = lighten(sc, 18);
            base.colors.secondary['50'] = lighten(sc, 42);
          }

          // Apply font overrides
          if (intake.brand?.fonts?.display) {
            const f = intake.brand.fonts.display;
            base.typography.fonts.display = `'${f}', Georgia, serif`;
            base.typography.fonts.heading = `'${f}', Georgia, serif`;
          }
          if (intake.brand?.fonts?.body) {
            const f = intake.brand.fonts.body;
            base.typography.fonts.body = `'${f}', -apple-system, sans-serif`;
            base.typography.fonts.small = `'${f}', -apple-system, sans-serif`;
          }

          // Upsert theme.json
          await upsert('content_entries', [{
            site_id: SITE_ID,
            locale: 'en',
            path: 'theme.json',
            data: base,
            updated_by: 'onboard-api',
          }], 'site_id,locale,path');

          emitProgress('O2', 'Brand', 'done', `Applied variant "${variantName}"`, Date.now() - o2Start);
        } catch (err: any) {
          emitProgress('O2', 'Brand', 'error', err.message, Date.now() - o2Start);
          throw err;
        }

        // ════════════════════════════════════════════════════════════════
        //  O3: PRUNE SERVICES
        // ════════════════════════════════════════════════════════════════
        const o3Start = Date.now();
        emitProgress('O3', 'Prune Services', 'running', 'Pruning disabled services...');

        try {
          const enabledSlugs: string[] = intake.services?.enabled || ALL_SERVICE_SLUGS;
          const disabledSlugs = ALL_SERVICE_SLUGS.filter((s) => !enabledSlugs.includes(s));

          if (disabledSlugs.length > 0) {
            for (const locale of LOCALES) {
              // ── 1. Filter servicesList.items[] in pages/services.json ──
              const svcRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/services.json' });
              if (svcRows[0]?.data) {
                const svc = svcRows[0].data;
                if (svc.servicesList?.items) {
                  svc.servicesList.items = svc.servicesList.items.filter(
                    (item: any) => enabledSlugs.includes(item.id)
                  );
                }
                normalizeServicesListDescriptions(svc);
                await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/services.json', data: svc, updated_by: 'onboard-api' }], 'site_id,locale,path');
              }

              // ── 2. Filter services in pages/home.json ─────────────────
              const homeRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/home.json' });
              if (homeRows[0]?.data) {
                const home = homeRows[0].data;
                // Filter services.services[] (the grid items)
                if (home.services?.services) {
                  home.services.services = home.services.services.filter(
                    (s: any) => enabledSlugs.includes(s.id)
                  );
                }
                // Filter services.additionalServices[] if it exists
                if (home.services?.additionalServices) {
                  home.services.additionalServices = home.services.additionalServices.filter(
                    (s: any) => enabledSlugs.includes(s.id)
                  );
                }
                // Filter featured service if it was disabled
                if (home.services?.featured?.id && !enabledSlugs.includes(home.services.featured.id)) {
                  // Promote first enabled service to featured
                  if (home.services.services.length > 0) {
                    home.services.featured = home.services.services.shift();
                  }
                }
                await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/home.json', data: home, updated_by: 'onboard-api' }], 'site_id,locale,path');
              }

              // ── 3. Filter services[] in footer.json ───────────────────
              const footerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'footer.json' });
              if (footerRows[0]?.data) {
                const footer = footerRows[0].data;
                if (footer.services) {
                  footer.services = footer.services.filter((s: any) => {
                    // Keep the main /services link
                    if (s.url === '/services' || s.url?.endsWith('/services')) return true;
                    // Check if the href contains an enabled slug
                    const href = s.url || '';
                    return enabledSlugs.some((slug) => href.includes(slug));
                  });
                }
                await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'footer.json', data: footer, updated_by: 'onboard-api' }], 'site_id,locale,path');
              }

              // NOTE: No separate service files to delete (TCM services are inline)
              // NOTE: No navigation pruning needed (TCM nav is flat, no service sub-menu)
            }
          }

          emitProgress('O3', 'Prune Services', 'done', `${enabledSlugs.length} enabled, ${disabledSlugs.length} removed`, Date.now() - o3Start);
          result.services = enabledSlugs.length;
        } catch (err: any) {
          emitProgress('O3', 'Prune Services', 'error', err.message, Date.now() - o3Start);
          throw err;
        }

        // ════════════════════════════════════════════════════════════════
        //  O4: CONTENT REPLACEMENT
        // ════════════════════════════════════════════════════════════════
        const o4Start = Date.now();
        emitProgress('O4', 'Content Replacement', 'running', 'Replacing template content...');

        try {
          const biz = intake.business;
          const loc = intake.location;
          const media = intake.media || {};

          let geoOldSuffix = '';
          let geoNewSuffix = '';
          try {
            geoOldSuffix = await fetchTemplateGeoSuffix(TEMPLATE_ID);
            geoNewSuffix = geoSuffixFromLocation(loc);
            if (geoOldSuffix && geoNewSuffix && geoOldSuffix !== geoNewSuffix) {
              await remapContentEntrySeoSlugs(SITE_ID, geoOldSuffix, geoNewSuffix);
              await remapSiteSeoPagesSlugs(SITE_ID, geoOldSuffix, geoNewSuffix);
            }
          } catch (geoErr: any) {
            result.warnings.push(`SEO geo slug remap: ${geoErr?.message || geoErr}`);
          }

          // Build replacement pairs — ordered longest-first to avoid partial matches
          // Business name is always required
          const replacements: [string, string][] = [];
          const ownerReplacement = String(biz.ownerName || '').trim() || biz.name;
          const ownerWithCreds = String(biz.ownerNameWithCredentials || biz.ownerName || '').trim() || ownerReplacement;
          const ownerNoDots = ownerReplacement.replace(/\.\s?/g, ' ').trim();

          const doctorTerms = new Set<string>([
            'Dr. Huang, L.Ac., MSTCM',
            'Acupuncturist Jiang, L.Ac., M.S.',
            'Dr. Huang',
            'Dr Huang',
            'Dr. Jiang',
            'Dr Jiang',
            'Dr. Henry Smith',
            'Dr Henry Smith',
            '黄医生',
            '江医生',
          ]);
          const clinicTerms = new Set<string>([
            'Dr Huang Clinic',
            'Dr. Huang Clinic',
            'Dr Jiang Clinic',
            'Dr. Jiang Clinic',
            'Dr. Henry Smith Clinic',
            'Dr Henry Smith Clinic',
            'TCM Network',
            'Flushing Acupuncture',
            'Kingsfoil Acupuncture',
          ]);

          // Pull doctor/clinic terms from template metadata to catch non-standard names.
          try {
            const [templateSiteRows, templateAboutRows] = await Promise.all([
              fetchRows('sites', { id: TEMPLATE_ID }),
              fetchRows('content_entries', { site_id: TEMPLATE_ID, path: 'pages/about.json' }),
            ]);
            const templateSiteName = String(templateSiteRows?.[0]?.name || '').trim();
            if (templateSiteName) clinicTerms.add(templateSiteName);

            for (const row of templateAboutRows) {
              const about = row?.data || {};
              const profileName = String(about?.profile?.name || '').trim();
              if (profileName) doctorTerms.add(profileName);

              const heroTitle = String(about?.hero?.title || '').trim();
              if (heroTitle) {
                doctorTerms.add(heroTitle);
                const stripped = heroTitle.replace(/^Meet\s+/i, '').replace(/^认识/, '').trim();
                if (stripped) doctorTerms.add(stripped);
              }
            }
          } catch {
            // Non-blocking: static fallback terms above still run.
          }

          for (const term of Array.from(clinicTerms).sort((a, b) => b.length - a.length)) {
            replacements.push([term, biz.name]);
          }
          for (const term of Array.from(doctorTerms).sort((a, b) => b.length - a.length)) {
            const target = term.includes('L.Ac.') || term.includes('MSTCM') ? ownerWithCreds : ownerReplacement;
            replacements.push([term, target]);
          }
          // Handle no-dot style names from templates ("Dr Henry ...").
          if (ownerNoDots && ownerNoDots !== ownerReplacement) {
            replacements.push([ownerReplacement.replace(/\.\s?/g, ' ').trim(), ownerNoDots]);
          }

          await augmentReplacementsFromTemplateSite(TEMPLATE_ID, loc, intake, replacements);

          // Email (longest first)
          if (loc.email) {
            replacements.push(
              ['mailto:sancai.acu@gmail.com', `mailto:${loc.email}`],
              ['sancai.acu@gmail.com', loc.email],
              ['mailto:acupuncture41ave@gmail.com', `mailto:${loc.email}`],
              ['acupuncture41ave@gmail.com', loc.email],
            );
          }

          // Phone (longest first)
          if (loc.phone) {
            const phoneDigits = loc.phone.replace(/[^0-9]/g, '');
            replacements.push(
              ['tel:+18453811106', phoneToTel(loc.phone)],
              ['+18453811106', `+1${phoneDigits}`],
              ['(845) 381-1106', loc.phone],
              ['tel:+17188889512', phoneToTel(loc.phone)],
              ['+17188889512', `+1${phoneDigits}`],
              ['(718) 888-9512', loc.phone],
            );
          }

          // Address (longest first — full address before partial)
          if (loc.address && loc.city && loc.state && loc.zip) {
            replacements.push(
              ['71 East Main Street, Middletown, NY 10940', `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`],
              ['71 East Main Street', loc.address],
              ['Middletown, NY 10940', `${loc.city}, ${loc.state} ${loc.zip}`],
              ['Middletown, NY', `${loc.city}, ${loc.state}`],
              ['NY 10940', `${loc.state} ${loc.zip}`],
              ['Middletown', loc.city],
              ['10940', loc.zip],
              ['143-26 41st Ave, Flushing, NY 11355', `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`],
              ['143-26 41st Ave', loc.address],
              ['Flushing, NY 11355', `${loc.city}, ${loc.state} ${loc.zip}`],
              ['Flushing, NY', `${loc.city}, ${loc.state}`],
              ['Flushing', loc.city],
              ['11355', loc.zip],
            );
          }

          // Domain
          if (intake.domains?.production) {
            replacements.push(['drhuangclinic.com', intake.domains.production]);
          }

          if (geoOldSuffix && geoNewSuffix && geoOldSuffix !== geoNewSuffix) {
            replacements.push(
              [geoOldSuffix, geoNewSuffix],
              [`-${geoOldSuffix}`, `-${geoNewSuffix}`]
            );
          }

          // Fetch all content entries for new site and deep-replace
          const allEntries = await fetchRows('content_entries', { site_id: SITE_ID });
          const updated: any[] = [];
          for (const entry of allEntries) {
            if (entry.path === 'theme.json') continue;
            const newData = deepReplace(entry.data, replacements);
            if (JSON.stringify(newData) !== JSON.stringify(entry.data)) {
              updated.push({ site_id: SITE_ID, locale: entry.locale, path: entry.path, data: newData, updated_by: 'onboard-api' });
            }
          }

          const BATCH = 50;
          for (let i = 0; i < updated.length; i += BATCH) {
            await upsert('content_entries', updated.slice(i, i + BATCH), 'site_id,locale,path');
          }

          // ── Structural updates for specific files ──────────────────
          for (const locale of LOCALES) {
            // site.json — TCM uses clinicName (not businessName)
            const siteRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'site.json' });
            if (siteRows[0]?.data) {
              const site = siteRows[0].data;
              site.clinicName = biz.name;
              if (biz.tagline) site.tagline = biz.tagline;
              if (biz.description) site.description = biz.description;
              if (loc.address) site.address = loc.address;
              if (loc.city) site.city = loc.city;
              if (loc.state) site.state = loc.state;
              if (loc.zip) site.zip = loc.zip;
              if (loc.phone) site.phone = loc.phone;
              if (loc.email) site.email = loc.email;
              if (loc.addressMapUrl) site.addressMapUrl = loc.addressMapUrl;
              if (intake.hours && Object.keys(intake.hours).length > 0) site.hours = intake.hours;
              // Social — TCM includes wechat field
              if (intake.social && Object.values(intake.social).some(Boolean)) {
                site.social = { ...site.social, ...intake.social };
              }
              // Keep headerVariant as-is (from template)
              const langLabels: Record<string, string> = { en: 'English', zh: '中文', es: 'Espanol', ko: '한국어' };
              const langFlags: Record<string, string> = { en: 'US', zh: 'CN', es: 'MX', ko: 'KR' };
              site.languages = LOCALES.map((code) => ({
                code, label: langLabels[code] || code, flag: langFlags[code] || '', enabled: true,
              }));
              await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'site.json', data: site, updated_by: 'onboard-api' }], 'site_id,locale,path');
            }

            // header.json — update logo, topbar
            const headerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'header.json' });
            if (headerRows[0]?.data) {
              const header = headerRows[0].data;
              // menu.logo.text — business name (remove " Clinic"/" Practice" if present)
              if (header.menu?.logo) {
                header.menu.logo.text = biz.name.replace(/ Clinic$/, '').replace(/ Practice$/, '');
                if (biz.tagline) header.menu.logo.subtext = biz.tagline;
                if (media.logoImageUrl) {
                  header.menu.logo.image = {
                    ...(header.menu.logo.image || {}),
                    src: media.logoImageUrl,
                    alt: biz.name || header.menu.logo.image?.alt || 'Site logo',
                  };
                }
              }
              // topbar fields
              if (header.topbar) {
                if (loc.phone) {
                  header.topbar.phone = loc.phone;
                  header.topbar.phoneHref = phoneToTel(loc.phone);
                }
                if (loc.address && loc.city && loc.state && loc.zip) {
                  header.topbar.address = `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`;
                  if (loc.addressMapUrl) header.topbar.addressHref = loc.addressMapUrl;
                }
              }
              await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'header.json', data: header, updated_by: 'onboard-api' }], 'site_id,locale,path');
            }

            // footer.json — update brand, contact, hours, copyright
            const footerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'footer.json' });
            if (footerRows[0]?.data) {
              const footer = footerRows[0].data;
              // brand
              footer.brand = {
                ...footer.brand,
                name: biz.name,
                ...(biz.description ? { description: biz.description } : {}),
              };
              // contact
              if (loc.phone || loc.email || loc.address) {
                footer.contact = {
                  ...footer.contact,
                  ...(loc.phone ? { phone: loc.phone, phoneLink: phoneToTel(loc.phone) } : {}),
                  ...(loc.email ? { email: loc.email, emailLink: `mailto:${loc.email}` } : {}),
                  ...(loc.address ? { addressLines: [loc.address, `${loc.city}, ${loc.state} ${loc.zip}`] } : {}),
                };
              }
              // hours
              if (intake.hours && Object.keys(intake.hours).length > 0) {
                const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const dayAbbr: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
                footer.hours = daysOrder
                  .filter((d) => intake.hours[d])
                  .map((d) => `${dayAbbr[d]}: ${intake.hours[d]}`);
              }
              // copyright
              footer.copyright = `\u00A9 ${new Date().getFullYear()} ${biz.name}. All rights reserved.`;
              await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'footer.json', data: footer, updated_by: 'onboard-api' }], 'site_id,locale,path');
            }

            // ── about.json — practitioner profile (embedded, not separate files) ──
            if (biz.ownerName) {
              const aboutRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/about.json' });
              if (aboutRows[0]?.data) {
                const about = aboutRows[0].data;
                const isZh = locale.startsWith('zh');

                // Update profile
                if (about.profile) {
                  about.profile.name = biz.ownerNameWithCredentials || biz.ownerName;
                  if (biz.ownerTitle) about.profile.title = biz.ownerTitle;
                  if (typeof about.profile.bio === 'string') {
                    about.profile.bio = formatBioParagraphs(about.profile.bio);
                  }
                  if (media.aboutBioImageUrl) {
                    about.profile.image = media.aboutBioImageUrl;
                  }
                }
                if (about.hero && biz.ownerName) {
                  about.hero.title = isZh ? `认识${biz.ownerName}` : `Meet ${biz.ownerName}`;
                }

                // Update credentials if provided
                if (biz.ownerCredentials && biz.ownerCredentials.length > 0 && about.credentials) {
                  about.credentials.items = biz.ownerCredentials.map((cred: any) => ({
                    icon: cred.icon || 'Award',
                    year: cred.year || '',
                    location: cred.location || '',
                    credential: cred.credential,
                    institution: cred.institution || '',
                  }));
                }

                // Update specializations if provided
                if (biz.ownerSpecializations && biz.ownerSpecializations.length > 0 && about.specializations) {
                  about.specializations.areas = biz.ownerSpecializations.map((spec: any) => {
                    if (typeof spec === 'string') {
                      return { icon: 'Activity', title: spec, description: '' };
                    }
                    return {
                      icon: spec.icon || 'Activity',
                      title: spec.title,
                      description: spec.description || '',
                    };
                  });
                }

                // Update affiliations/certifications if provided
                if (biz.ownerCertifications && biz.ownerCertifications.length > 0 && about.affiliations) {
                  about.affiliations.organizations = biz.ownerCertifications.map((cert: any) => {
                    if (typeof cert === 'string') {
                      return { name: cert, role: 'Member' };
                    }
                    return { name: cert.name, role: cert.role || 'Member' };
                  });
                }

                await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/about.json', data: about, updated_by: 'onboard-api' }], 'site_id,locale,path');
              }
            }

            // home.json — enforce hero/location/contact/testimonial consistency
            const homeRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/home.json' });
            if (homeRows[0]?.data) {
              const home = homeRows[0].data;
              const location = locationLabel(loc);
              const owner = ownerDisplayName(biz);
              const isZh = locale.startsWith('zh');

              if (home.hero) {
                if (media.homeHeroImageUrl) {
                  if (typeof home.hero.image === 'string') home.hero.image = media.homeHeroImageUrl;
                  if (typeof home.hero.backgroundImage === 'string') home.hero.backgroundImage = media.homeHeroImageUrl;
                }
                if (location) {
                  home.hero.clinicName =
                    isZh
                      ? `${biz.name}${loc?.city ? ` · ${loc.city}` : ''}`
                      : `${biz.name}${location ? ` in ${location}` : ''}`;
                  home.hero.title =
                    isZh
                      ? `${loc?.city || '本地'}中医与针灸护理`
                      : `Traditional Chinese Medicine Care in ${location}`;
                  if (typeof home.hero.description === 'string' && home.hero.description.includes('Flushing')) {
                    home.hero.description = home.hero.description.replaceAll('Flushing, NY', location).replaceAll('Flushing', loc?.city || 'your area');
                  }
                }
                if (loc.phone && home.hero.secondaryCta) {
                  home.hero.secondaryCta.link = phoneToTel(loc.phone);
                }
              }

              if (home.cta) {
                if (loc.phone) {
                  home.cta.contactInfo = isZh
                    ? `致电${loc.phone}或在线预约`
                    : `Call us at ${loc.phone} or book online`;
                  if (home.cta.secondaryCta) {
                    home.cta.secondaryCta.link = phoneToTel(loc.phone);
                  }
                }
              }

              if (home.testimonials?.testimonials && Array.isArray(home.testimonials.testimonials) && owner) {
                home.testimonials.testimonials = home.testimonials.testimonials.map((t: any) => {
                  const next = { ...t };
                  if (typeof next.quote === 'string') {
                    next.quote = next.quote
                      .replaceAll('Dr. Henry Smith Clinic', biz.name)
                      .replaceAll('Dr Henry Smith Clinic', biz.name)
                      .replaceAll('Dr. Huang Clinic', biz.name)
                      .replaceAll('Dr Huang Clinic', biz.name)
                      .replaceAll('Dr. Henry Smith', biz.ownerName || owner)
                      .replaceAll('Dr Henry Smith', biz.ownerName || owner)
                      .replaceAll('Dr. Jiang', biz.ownerName || owner)
                      .replaceAll('Dr. Huang', biz.ownerName || owner)
                      .replaceAll('黄医生', biz.ownerName || owner)
                      .replaceAll('江医生', biz.ownerName || owner);
                  }
                  return next;
                });
              }

              await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/home.json', data: home, updated_by: 'onboard-api' }], 'site_id,locale,path');
            }

            // contact.json — enforce contact methods, map, and support copy with intake location data
            const contactRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/contact.json' });
            if (contactRows[0]?.data) {
              const contact = contactRows[0].data;
              const isZh = locale.startsWith('zh');
              const fullAddress = [loc?.address, loc?.city && loc?.state && loc?.zip ? `${loc.city}, ${loc.state} ${loc.zip}` : '']
                .filter(Boolean)
                .join(', ');

              if (contact.map) {
                if (loc?.address && loc?.city && loc?.state && loc?.zip) {
                  // Always prefer an embeddable map URL for iframe rendering.
                  contact.map.embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`)}&output=embed`;
                } else if (loc?.addressMapUrl) {
                  contact.map.embedUrl = loc.addressMapUrl;
                }
                const cityLabel = loc?.city || (isZh ? '本地社区' : 'our local community');
                contact.map.directions = isZh
                  ? `我们位于${cityLabel}${loc?.address ? `，地址为${loc.address}` : ''}。如需详细路线或停车信息，请致电${loc?.phone || '我们诊所'}。`
                  : `We are located in ${cityLabel}${loc?.address ? ` at ${loc.address}` : ''}. Please call ${loc?.phone || 'our clinic'} for detailed directions and parking information.`;
              }
              if (contact.form && loc?.phone) {
                const fallback = isZh
                  ? `抱歉，发送您的消息时出错。请直接致电我们 ${loc.phone}`
                  : `Sorry, there was an error sending your message. Please call us directly at ${loc.phone}.`;
                contact.form.errorMessage = fallback;
              }
              if (Array.isArray(contact.contactMethods)) {
                contact.contactMethods = contact.contactMethods.map((method: any) => {
                  const next = { ...method, action: { ...(method?.action || {}) } };
                  const icon = String(next.icon || '').toLowerCase();
                  if (icon === 'phone' && loc?.phone) {
                    next.primary = loc.phone;
                    next.action.link = phoneToTel(loc.phone);
                  }
                  if (icon === 'mail' && loc?.email) {
                    next.primary = loc.email;
                    next.action.link = `mailto:${loc.email}`;
                  }
                  if (icon === 'mappin' && loc?.address) {
                    next.primary = loc.address;
                    next.secondary = loc?.city && loc?.state && loc?.zip ? `${loc.city}, ${loc.state} ${loc.zip}` : next.secondary;
                    if (loc?.addressMapUrl) next.action.link = loc.addressMapUrl;
                  }
                  return next;
                });
              }
              if (loc?.phone && contact.cta?.secondaryCta) {
                contact.cta.secondaryCta.link = phoneToTel(loc.phone);
              }
              if (fullAddress && typeof contact.introduction?.text === 'string') {
                contact.introduction.text = contact.introduction.text
                  .replaceAll('Middletown', loc?.city || 'our location')
                  .replaceAll('Flushing', loc?.city || 'our location');
              }
              await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/contact.json', data: contact, updated_by: 'onboard-api' }], 'site_id,locale,path');
            }

            // blog files — unify author to selected doctor name
            const owner = ownerDisplayName(biz);
            if (owner) {
              const blogIndexRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/blog.json' });
              if (blogIndexRows[0]?.data) {
                const blogIndex = blogIndexRows[0].data;
                if (Array.isArray(blogIndex.posts)) {
                  blogIndex.posts = blogIndex.posts.map((post: any) => ({ ...post, author: owner }));
                }
                if (blogIndex.featuredPost && typeof blogIndex.featuredPost === 'object') {
                  blogIndex.featuredPost.author = owner;
                }
                await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/blog.json', data: blogIndex, updated_by: 'onboard-api' }], 'site_id,locale,path');
              }
              const localeEntries = await fetchRows('content_entries', { site_id: SITE_ID, locale });
              const blogArticleUpdates = localeEntries
                .filter((entry) => typeof entry.path === 'string' && entry.path.startsWith('blog/') && entry.path.endsWith('.json'))
                .map((entry) => {
                  if (!entry.data || typeof entry.data !== 'object') return null;
                  const next = { ...entry.data, author: owner };
                  return {
                    site_id: SITE_ID,
                    locale,
                    path: entry.path,
                    data: next,
                    updated_by: 'onboard-api',
                  };
                })
                .filter(Boolean) as any[];
              if (blogArticleUpdates.length > 0) {
                for (let i = 0; i < blogArticleUpdates.length; i += 50) {
                  await upsert('content_entries', blogArticleUpdates.slice(i, i + 50), 'site_id,locale,path');
                }
              }
            }
            // NOTE: No separate doctor files to create/delete in TCM
          }

          const napPatched = await patchAllSeoContentEntries(SITE_ID, biz, loc, intake);

          emitProgress(
            'O4',
            'Content Replacement',
            'done',
            `Deep-replaced ${updated.length} entries; SEO NAP fields patched on ${napPatched} entries`,
            Date.now() - o4Start
          );
        } catch (err: any) {
          emitProgress('O4', 'Content Replacement', 'error', err.message, Date.now() - o4Start);
          throw err;
        }

        // ════════════════════════════════════════════════════════════════
        //  O5: AI CONTENT + SEO
        // ════════════════════════════════════════════════════════════════
        const o5Start = Date.now();
        emitProgress('O5', 'AI Content', 'running', SKIP_AI ? 'Skipping AI (skipAi=true)...' : 'Generating AI content + SEO...');

        try {
          if (!SKIP_AI) {
            const biz = intake.business;
            const loc = intake.location;
            const tone = intake.contentTone || {};

            // Generate content via Claude — prompts path for chinese-medicine
            const promptDir = path.join(process.cwd(), 'scripts', 'onboard', 'prompts', 'chinese-medicine');
            const contentPromptPath = path.join(promptDir, 'content.md');
            const contentPrompt = fs.readFileSync(contentPromptPath, 'utf-8');

            const contentInput = interpolateTemplate(contentPrompt, {
              businessName: biz.name,
              ownerName: biz.ownerName || '',
              ownerTitle: biz.ownerTitle || '',
              city: loc.city,
              state: loc.state,
              foundedYear: String(biz.foundedYear || ''),
              yearsExperience: biz.yearsExperience || '',
              languages: (biz.ownerLanguages || []).join(', '),
              uniqueSellingPoints: (tone.uniqueSellingPoints || []).map((u: string) => `- ${u}`).join('\n'),
              targetDemographic: tone.targetDemographic || '',
              voice: tone.voice || 'warm-professional',
              servicesList: (intake.services?.enabled || ALL_SERVICE_SLUGS).join(', '),
              ownerCredentials: JSON.stringify(biz.ownerCredentials || [], null, 2),
              ownerCertifications: (biz.ownerCertifications || []).map((c: any) => typeof c === 'string' ? c : c.name).join(', '),
              ownerSpecializations: (biz.ownerSpecializations || []).map((s: any) => typeof s === 'string' ? s : s.title).join(', '),
            });

            const contentResult = await callClaude(contentInput);
            const aiContent = parseJsonFromResponse(contentResult);

            // Generate SEO via Claude — TCM pages differ from dental
            const seoPromptPath = path.join(promptDir, 'seo.md');
            const seoPrompt = fs.readFileSync(seoPromptPath, 'utf-8');
            const seoInput = interpolateTemplate(seoPrompt, {
              businessName: biz.name,
              city: loc.city,
              state: loc.state,
              phone: loc.phone || '',
              servicesList: (intake.services?.enabled || ALL_SERVICE_SLUGS).join(', '),
              languages: (biz.ownerLanguages || []).join(', '),
              // TCM pages: about, services, contact, blog, cases, conditions, gallery, new-patients, pricing
              pages: 'about, services, contact, blog, cases, conditions, gallery, new-patients, pricing',
            });

            const seoResult = await callClaude(seoInput);
            const aiSeo = parseJsonFromResponse(seoResult);

            // Merge AI content into DB entries
            for (const locale of LOCALES) {
              // Update home page hero
              const homeRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/home.json' });
              if (homeRows[0]?.data && aiContent.hero) {
                const home = homeRows[0].data;
                if (aiContent.hero.tagline) home.hero.tagline = aiContent.hero.tagline;
                if (aiContent.hero.description) home.hero.description = aiContent.hero.description;
                if (intake.stats) home.hero.stats = intake.stats;
                if (aiContent.whyChooseUs && home.whyChooseUs) {
                  home.whyChooseUs.features = aiContent.whyChooseUs;
                }
                await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/home.json', data: home, updated_by: 'onboard-api' }], 'site_id,locale,path');
              }

              // Update about page — profile, journey (embedded in about.json)
              const aboutRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/about.json' });
              if (aboutRows[0]?.data) {
                const about = aboutRows[0].data;
                if (aiContent.aboutStory && about.journey) about.journey.story = aiContent.aboutStory;
                if (about.profile) {
                  if (aiContent.ownerBio) {
                    about.profile.bio = formatBioParagraphs(aiContent.ownerBio);
                  }
                  if (aiContent.ownerQuote) {
                    about.profile.quote = aiContent.ownerQuote;
                  }
                  about.profile = profileWithMergedBio(about.profile) ?? about.profile;
                }
                await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/about.json', data: about, updated_by: 'onboard-api' }], 'site_id,locale,path');
              }
              // NOTE: No separate doctor files in TCM — bio is already in about.json above

              // Update testimonials
              if (aiContent.testimonials) {
                const testimonials = aiContent.testimonials.map((t: any, i: number) => ({
                  id: `t${String(i + 1).padStart(3, '0')}`,
                  date: new Date(Date.now() - (i * 30 + Math.random() * 60) * 86400000).toISOString().split('T')[0],
                  text: t.text,
                  rating: t.rating || 5,
                  source: 'google',
                  featured: i < 3,
                  language: 'en',
                  patientName: t.patientName,
                  serviceCategory: t.serviceCategory || 'acupuncture',
                }));
                await upsert('content_entries', [{
                  site_id: SITE_ID, locale, path: 'testimonials.json',
                  data: { testimonials, displayCount: 6, showRatings: true },
                  updated_by: 'onboard-api',
                }], 'site_id,locale,path');
              }

              // Update announcement bar
              if (aiContent.announcementBar) {
                const headerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'header.json' });
                if (headerRows[0]?.data) {
                  const header = headerRows[0].data;
                  if (header.topbar?.badge) {
                    header.topbar.badge = aiContent.announcementBar;
                  }
                  await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'header.json', data: header, updated_by: 'onboard-api' }], 'site_id,locale,path');
                }
              }

              // Update seo.json
              if (aiSeo) {
                await upsert('content_entries', [{
                  site_id: SITE_ID, locale, path: 'seo.json', data: aiSeo, updated_by: 'onboard-api',
                }], 'site_id,locale,path');
              }
            }

          }

          emitProgress('O5', 'AI Content', 'done', SKIP_AI ? 'Skipped' : 'Content + SEO generated', Date.now() - o5Start);
        } catch (err: any) {
          emitProgress('O5', 'AI Content', 'error', err.message, Date.now() - o5Start);
          throw err;
        }

        // ════════════════════════════════════════════════════════════════
        //  O5B: AUTOMATIC REWRITE (SERVICES + CONDITIONS)
        // ════════════════════════════════════════════════════════════════
        const o5bStart = Date.now();
        emitProgress(
          'O5B',
          'Rewrite Core Content',
          'running',
          SKIP_AI ? 'Skipping rewrite (skipAi=true)...' : 'Rewriting services + conditions...'
        );

        try {
          if (!SKIP_AI) {
            const targetPaths = ['pages/services.json', 'pages/conditions.json'];
            const rewriteLocales = Array.from(
              new Set(
                (LOCALES.length > 0 ? LOCALES : [DEFAULT_LOCALE])
                  .map((value) => String(value || '').trim())
                  .filter(Boolean)
              )
            );
            const rewriteMode = String(intake.rewriteMode || 'aggressive').toLowerCase() as
              | 'conservative'
              | 'balanced'
              | 'aggressive';
            const rewriteStrictness = String(intake.rewriteStrictness || 'strict-medical').toLowerCase();
            const rewriteAutoApply = intake.rewriteAutoApply !== false;
            const defaultProvider = process.env.OPENAI_API_KEY
              ? 'openai'
              : process.env.ANTHROPIC_API_KEY
                ? 'claude'
                : 'openai';
            const provider = String(
              intake.rewriteProvider ||
              process.env.AI_REWRITE_PROVIDER ||
              defaultProvider
            ).toLowerCase();

            if (!isRewriteProviderConfigured(provider)) {
              throw new Error(`Rewrite provider "${provider}" is not configured`);
            }

            const model = provider === 'claude'
              ? (process.env.AI_REWRITE_CLAUDE_MODEL || process.env.ANTHROPIC_MAIN_MODEL || 'claude-sonnet-4-6')
              : (process.env.AI_REWRITE_OPENAI_MODEL || process.env.OPENAI_MAIN_MODEL || 'gpt-5.4');
            emitProgress(
              'O5B',
              'Rewrite Core Content',
              'running',
              `Using provider=${provider}, model=${model}`
            );

            const criticalFlags = new Set(['forbidden_terms_present', 'empty_rewrite']);
            let totalGeneratedItems = 0;
            let totalAutoApproved = 0;
            let totalRiskyItems = 0;
            let totalWarningItems = 0;
            let totalAppliedItems = 0;
            let totalMissingTargets = 0;
            let totalGeneratedRows = 0;
            let totalChangeRatio = 0;
            let totalChunkFailures = 0;
            const localeJobSummaries: string[] = [];
            const MAX_PROVIDER_CHUNK_RETRIES = 2;

            for (const rewriteLocale of rewriteLocales) {
              const rewriteJob = await createRewriteJob({
                siteId: SITE_ID,
                locale: rewriteLocale,
                scope: 'custom',
                targetPaths,
                mode: rewriteMode,
                provider,
                model,
                sourceOfTruth: 'db',
                createdBy: session.user.id,
                requirements: {
                  preserveMeaning: true,
                  onboarding: true,
                  maxLengthDeltaPct: rewriteMode === 'aggressive' ? 60 : 35,
                  minLengthDeltaPct: 5,
                  minChangeRatio: rewriteMode === 'aggressive' ? 0.3 : 0.2,
                  forbiddenTerms: ['cure', 'guaranteed', 'miracle', 'risk-free'],
                  requiredTerms: intake.rewriteRequiredTerms || [],
                  voiceProfile: intake.contentTone?.voice || 'warm-professional',
                  strictness: rewriteStrictness,
                },
              });
              if (!rewriteJob) {
                throw new Error(`Failed to create rewrite job during onboarding (${rewriteLocale})`);
              }

              await updateRewriteJob({
                jobId: rewriteJob.id,
                status: 'running',
                startedAt: new Date().toISOString(),
                error: null,
                completedAt: null,
              });
              await writeRewriteAuditLog({
                jobId: rewriteJob.id,
                action: 'job_started',
                actorId: session.user.id,
                actorEmail: session.user.email,
                metadata: { source: 'onboarding-o5b', locale: rewriteLocale },
              });

              const generatedRows: Array<{
                jobId: string;
                siteId: string;
                locale: string;
                path: string;
                fieldPath: string;
                sourceHash: string;
                sourceText: string;
                rewrittenText: string;
                similarityScore: number;
                riskFlags: string[];
                validation: Record<string, unknown>;
                validationPassed: boolean;
              }> = [];
              let missingTargets = 0;

              for (const contentPath of targetPaths) {
                const rows = await fetchRows('content_entries', {
                  site_id: SITE_ID,
                  locale: rewriteLocale,
                  path: contentPath,
                });
                if (!rows[0]?.data) {
                  missingTargets += 1;
                  continue;
                }

                const extracted = extractRewriteItems(rows[0].data);
                const providerMatches: Record<string, { rewrittenText: string; provider: string }> = {};

                for (const chunk of chunkArray(extracted, 40)) {
                  let providerItems: Awaited<ReturnType<typeof generateRewriteWithProvider>> = [];
                  let chunkSucceeded = false;
                  let lastChunkError = '';

                  for (let attempt = 0; attempt <= MAX_PROVIDER_CHUNK_RETRIES; attempt += 1) {
                    try {
                      providerItems = await generateRewriteWithProvider({
                        provider,
                        model,
                        siteId: SITE_ID,
                        locale: rewriteLocale,
                        scope: 'custom',
                        mode: rewriteMode,
                        targetPaths: [contentPath],
                        requirements: rewriteJob.requirements,
                        voiceProfile:
                          typeof intake.contentTone?.voice === 'string' ? intake.contentTone.voice : '',
                        overrideModeInstructions:
                          attempt === 0
                            ? undefined
                            : 'CRITICAL: Return strict valid JSON only. No commentary, no markdown, no trailing commas, no extra keys. Keep locale language exactly as requested.',
                        items: chunk.map((item) => ({
                          path: contentPath,
                          fieldPath: item.fieldPath,
                          sourceText: item.sourceText,
                        })),
                      });
                      if (providerItems.length === 0) {
                        throw new Error('Provider returned 0 rewrite items');
                      }
                      chunkSucceeded = true;
                      break;
                    } catch (error: any) {
                      lastChunkError = error?.message || 'provider chunk rewrite failed';
                    }
                  }

                  if (!chunkSucceeded) {
                    totalChunkFailures += 1;
                    result.warnings.push(
                      `O5B chunk warning (${rewriteLocale}, ${contentPath}): ${lastChunkError}`
                    );
                    continue;
                  }
                  for (const item of providerItems) {
                    providerMatches[item.fieldPath] = {
                      rewrittenText: item.rewrittenText,
                      provider,
                    };
                  }
                }

                const generated = generateRewriteItemsFromProvider(extracted, providerMatches, {
                  requirements: rewriteJob.requirements as any,
                });
                generated.forEach((item) => {
                  generatedRows.push({
                    jobId: rewriteJob.id,
                    siteId: SITE_ID,
                    locale: rewriteLocale,
                    path: contentPath,
                    fieldPath: item.fieldPath,
                    sourceHash: item.sourceHash,
                    sourceText: item.sourceText,
                    rewrittenText: item.rewrittenText,
                    similarityScore: item.similarityScore,
                    riskFlags: item.riskFlags,
                    validation: item.validation,
                    validationPassed: item.validationPassed,
                  });
                });
              }

              const generatedItems = await replaceRewriteItems(generatedRows);
              const generatedDbItems = await listRewriteItems({ jobId: rewriteJob.id, limit: 5000 });
              const safeItems = generatedDbItems.filter(
                (item) =>
                  typeof item.rewritten_text === 'string' &&
                  item.rewritten_text.trim().length > 0 &&
                  !item.risk_flags.some((flag) => criticalFlags.has(flag))
              );
              const riskyItems = generatedDbItems.filter(
                (item) =>
                  typeof item.rewritten_text !== 'string' ||
                  item.rewritten_text.trim().length === 0 ||
                  item.risk_flags.some((flag) => criticalFlags.has(flag))
              );
              const warningItems = generatedDbItems.filter(
                (item) => item.risk_flags.length > 0 && !item.risk_flags.some((flag) => criticalFlags.has(flag))
              );
              const autoApproveIds = safeItems.map((item) => item.id);

              await approveRewriteItems({
                jobId: rewriteJob.id,
                itemIds: autoApproveIds,
                approved: true,
                approvedBy: session.user.id,
              });

              const byPath = new Map<string, typeof generatedDbItems>();
              for (const item of generatedDbItems) {
                if (!autoApproveIds.includes(item.id)) continue;
                const list = byPath.get(item.path) || [];
                list.push(item);
                byPath.set(item.path, list);
              }

              const appliedIds: string[] = [];
              let updatedPaths = 0;
              if (rewriteAutoApply) {
                for (const [contentPath, pathItems] of byPath.entries()) {
                  const rows = await fetchRows('content_entries', {
                    site_id: SITE_ID,
                    locale: rewriteLocale,
                    path: contentPath,
                  });
                  if (!rows[0]?.data) continue;
                  const data = rows[0].data;
                  let changed = 0;
                  for (const item of pathItems) {
                    const ok = setValueAtFieldPath(data, item.field_path, String(item.rewritten_text || ''));
                    if (ok) {
                      changed += 1;
                      appliedIds.push(item.id);
                    }
                  }
                  if (changed > 0) {
                    if (contentPath === 'pages/services.json') {
                      normalizeServicesListDescriptions(data);
                    }
                    await upsert(
                      'content_entries',
                      [{
                        site_id: SITE_ID,
                        locale: rewriteLocale,
                        path: contentPath,
                        data,
                        updated_by: 'onboard-api-o5b',
                      }],
                      'site_id,locale,path'
                    );
                    if (rows[0]?.id) {
                      await insertContentRevision({
                        entryId: rows[0].id,
                        data,
                        createdBy: session.user.id,
                        note: 'Onboarding O5B auto-rewrite applied',
                      });
                    }
                    updatedPaths += 1;
                  }
                }
              }

              if (rewriteAutoApply) {
                await markRewriteItemsApplied({
                  jobId: rewriteJob.id,
                  itemIds: appliedIds,
                });
              }
              await updateRewriteJob({
                jobId: rewriteJob.id,
                status:
                  rewriteAutoApply && riskyItems.length === 0 && autoApproveIds.length > 0
                    ? 'completed'
                    : 'needs_review',
                completedAt: new Date().toISOString(),
                error: riskyItems.length > 0 ? `Needs review: ${riskyItems.length} risky items` : null,
              });

              await writeRewriteAuditLog({
                jobId: rewriteJob.id,
                action: 'item_generated',
                actorId: session.user.id,
                actorEmail: session.user.email,
                metadata: {
                  locale: rewriteLocale,
                  generatedItems,
                  autoApproved: autoApproveIds.length,
                  appliedItems: rewriteAutoApply ? appliedIds.length : 0,
                  updatedPaths,
                  missingTargets,
                  riskyItems: riskyItems.length,
                  warningItems: warningItems.length,
                },
              });
              await writeRewriteAuditLog({
                jobId: rewriteJob.id,
                action: 'job_applied',
                actorId: session.user.id,
                actorEmail: session.user.email,
                metadata: {
                  locale: rewriteLocale,
                  appliedItems: rewriteAutoApply ? appliedIds.length : 0,
                  updatedPaths,
                  riskyItems: riskyItems.length,
                  warningItems: warningItems.length,
                },
              });

              if (riskyItems.length > 0) {
                result.warnings.push(
                  `O5B rewrite (${rewriteLocale}) generated ${riskyItems.length} risky items requiring admin review`
                );
              }
              if (warningItems.length > 0) {
                result.warnings.push(
                  `O5B rewrite (${rewriteLocale}) generated ${warningItems.length} warning items (review optional)`
                );
              }

              totalGeneratedItems += generatedItems;
              totalAutoApproved += autoApproveIds.length;
              totalRiskyItems += riskyItems.length;
              totalWarningItems += warningItems.length;
              totalAppliedItems += rewriteAutoApply ? appliedIds.length : 0;
              totalMissingTargets += missingTargets;
              totalGeneratedRows += generatedRows.length;
              totalChangeRatio += generatedRows.reduce((sum, row) => {
                const value =
                  typeof (row.validation as any)?.changeRatio === 'number'
                    ? (row.validation as any).changeRatio
                    : 0;
                return sum + value;
              }, 0);
              localeJobSummaries.push(
                `${rewriteLocale}:${rewriteJob.id.slice(0, 8)}`
              );
            }

            if (totalChunkFailures > 0) {
              result.warnings.push(
                `O5B rewrite had ${totalChunkFailures} chunk-level provider failures; onboarding continued with partial rewrite coverage`
              );
            }

            const avgChangeRatio =
              totalGeneratedRows === 0 ? 0 : Number((totalChangeRatio / totalGeneratedRows).toFixed(4));

            emitProgress(
              'O5B',
              'Rewrite Core Content',
              'done',
              `Jobs ${localeJobSummaries.join(', ')}: generated ${totalGeneratedItems}, approved ${totalAutoApproved}, risky ${totalRiskyItems}, warnings ${totalWarningItems}, applied ${rewriteAutoApply ? totalAppliedItems : 0}, missingTargets ${totalMissingTargets}, chunkFailures ${totalChunkFailures}, avgChange ${avgChangeRatio}`,
              Date.now() - o5bStart
            );
          } else {
            emitProgress('O5B', 'Rewrite Core Content', 'done', 'Skipped', Date.now() - o5bStart);
          }
        } catch (err: any) {
          const message = err?.message || 'O5B failed';
          result.warnings.push(`O5B warning: ${message}`);
          emitProgress('O5B', 'Rewrite Core Content', 'error', message, Date.now() - o5bStart);
        }

        // ════════════════════════════════════════════════════════════════
        //  O6: CLEANUP
        // ════════════════════════════════════════════════════════════════
        const o6Start = Date.now();
        emitProgress('O6', 'Cleanup', 'running', 'Removing unsupported locales...');

        try {
          const allEntries = await fetchRows('content_entries', { site_id: SITE_ID });
          const supportedSet = new Set(LOCALES);
          const unsupportedEntries = allEntries.filter((e: any) => !supportedSet.has(e.locale) && e.locale !== 'en');

          if (unsupportedEntries.length > 0) {
            const unsupportedLocales = [...new Set(unsupportedEntries.map((e: any) => e.locale))] as string[];
            for (const locale of unsupportedLocales) {
              const entries = unsupportedEntries.filter((e: any) => e.locale === locale);
              for (const entry of entries) {
                await deleteRows('content_entries', { site_id: SITE_ID, locale, path: entry.path });
              }
            }
          }

          // Final entry count
          const finalEntries = await fetchRows('content_entries', { site_id: SITE_ID });
          result.entries = finalEntries.length;
          let syncedLocalFiles = 0;
          if (canWriteLocalFilesystem) {
            syncedLocalFiles = await syncSiteContentToLocal(SITE_ID);
          }

          emitProgress(
            'O6',
            'Cleanup',
            'done',
            canWriteLocalFilesystem
              ? `${result.entries} entries remaining, synced ${syncedLocalFiles} local files`
              : `${result.entries} entries remaining, skipped local file sync (read-only filesystem)`,
            Date.now() - o6Start
          );
        } catch (err: any) {
          emitProgress('O6', 'Cleanup', 'error', err.message, Date.now() - o6Start);
          throw err;
        }

        // ════════════════════════════════════════════════════════════════
        //  O7: VERIFY
        // ════════════════════════════════════════════════════════════════
        const o7Start = Date.now();
        emitProgress('O7', 'Verify', 'running', 'Running verification checks...');

        try {
          const allEntries = await fetchRows('content_entries', { site_id: SITE_ID });

          // 1. Required paths
          const requiredPaths = [
            'site.json', 'header.json', 'footer.json', 'navigation.json', 'seo.json',
            'pages/home.json', 'pages/services.json', 'pages/about.json', 'pages/contact.json',
          ];
          for (const locale of LOCALES) {
            for (const p of requiredPaths) {
              const found = allEntries.find((e: any) => e.locale === locale && e.path === p);
              if (!found) result.errors.push(`Missing: ${locale}/${p}`);
            }
          }

          // 2. Template contamination check — TCM template terms
          const templateTerms = [
            'Dr Huang Clinic',
            'Dr. Huang Clinic',
            'Dr. Huang',
            'Dr Huang',
            'Dr. Jiang',
            'Dr Jiang',
            'Dr. Henry Smith',
            'Dr Henry Smith',
            'Dr. Henry Smith Clinic',
            'Dr Henry Smith Clinic',
            'TCM Network',
            'Flushing Acupuncture',
            'Kingsfoil Acupuncture',
            'sancai.acu@gmail.com',
            '(845) 381-1106',
            '71 East Main Street',
          ];
          const contaminated: string[] = [];
          for (const entry of allEntries) {
            const str = JSON.stringify(entry.data);
            for (const term of templateTerms) {
              if (str.includes(term)) {
                contaminated.push(`${entry.locale}/${entry.path} contains "${term}"`);
                break;
              }
            }
          }
          if (contaminated.length > 0) {
            result.warnings.push(`Template contamination in ${contaminated.length} entries`);
            contaminated.forEach((c) => result.warnings.push(c));
          }

          // 3. Service count — TCM services are inline, count items in services.json
          const svcRows = await fetchRows('content_entries', { site_id: SITE_ID, locale: DEFAULT_LOCALE, path: 'pages/services.json' });
          const svcCount = svcRows[0]?.data?.servicesList?.items?.length || 0;
          const expectedCount = intake.services?.enabled?.length || ALL_SERVICE_SLUGS.length;
          if (svcCount !== expectedCount) {
            result.warnings.push(`Service count: expected ${expectedCount}, got ${svcCount}`);
          }
          result.services = svcCount;

          // 4. Domain check
          const domains = await fetchRows('site_domains', { site_id: SITE_ID });
          if (domains.length === 0) result.errors.push('No domain aliases registered');
          result.domains = domains.length;

          const status = result.errors.length === 0 && result.warnings.length === 0
            ? 'All checks passed'
            : `${result.errors.length} errors, ${result.warnings.length} warnings`;

          emitProgress('O7', 'Verify', 'done', status, Date.now() - o7Start);
        } catch (err: any) {
          emitProgress('O7', 'Verify', 'error', err.message, Date.now() - o7Start);
          throw err;
        }

        // ── Complete ─────────────────────────────────────────────────
        emit('complete', result);

      } catch (err: any) {
        emit('error', {
          message: `Pipeline failed: ${err.message}`,
          detail: err.stack || '',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
