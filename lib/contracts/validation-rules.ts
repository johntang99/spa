// System S — the 8 contract validation rules (docs/SPA_CONTENT_CONTRACTS.md).
// Save-time rules return { errors, warnings }: errors BLOCK the save (compliance-
// critical), warnings are logged (shape drift during seeding). Render/admin-layer
// rules (3,7,8) are exposed as helper predicates used by components built in Phase 1+.
import { SECTION_SCHEMAS, SectionType } from './sections';
import { seoObjectSchema, SeoObject } from './seo';
import { passesClaimsCheck } from './claims-validator';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

/* ---------- Rule 1: locale parity (replaces inline-loc completeness) ---------- */
/** Structural parity between an en entry and its zh twin; flags leaked en strings in zh. */
export function localeParityIssues(enData: unknown, zhData: unknown, path = ''): string[] {
  const issues: string[] = [];
  const ten = typeof enData;
  const tzh = typeof zhData;
  if (ten !== tzh) {
    issues.push(`${path || '(root)'}: type mismatch en=${ten} zh=${tzh}`);
    return issues;
  }
  if (Array.isArray(enData) && Array.isArray(zhData)) {
    if (enData.length !== zhData.length) issues.push(`${path}: array length en=${enData.length} zh=${zhData.length}`);
    const n = Math.min(enData.length, zhData.length);
    for (let i = 0; i < n; i++) issues.push(...localeParityIssues(enData[i], zhData[i], `${path}[${i}]`));
  } else if (enData && zhData && ten === 'object') {
    const ek = Object.keys(enData as object);
    for (const k of ek) {
      if (!(k in (zhData as object))) issues.push(`${path}.${k}: missing in zh`);
      else issues.push(...localeParityIssues((enData as any)[k], (zhData as any)[k], `${path}.${k}`));
    }
  } else if (ten === 'string') {
    // zh text that is byte-identical to a non-trivial en string is likely an untranslated placeholder.
    if (enData && zhData && enData === zhData && (enData as string).length > 12 && /[a-z]{4,}/i.test(enData as string)) {
      issues.push(`${path}: zh value identical to en (untranslated?)`);
    }
  }
  return issues;
}

/* ---------- Rule 4: campaign windows — no overlap, ≤1 active ---------- */
export function validateCampaigns(campaigns: Array<{ id: string; activeFrom: string; activeTo: string }>, now?: Date): string[] {
  const errors: string[] = [];
  const ranges = campaigns.map((c) => ({ id: c.id, from: Date.parse(c.activeFrom), to: Date.parse(c.activeTo) }));
  for (const r of ranges) {
    if (Number.isNaN(r.from) || Number.isNaN(r.to)) errors.push(`campaign ${r.id}: invalid date window`);
    else if (r.from > r.to) errors.push(`campaign ${r.id}: activeFrom after activeTo`);
  }
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i], b = ranges[j];
      if (a.from <= b.to && b.from <= a.to) errors.push(`campaigns ${a.id} & ${b.id}: overlapping windows`);
    }
  }
  if (now) {
    const t = now.getTime();
    const active = ranges.filter((r) => r.from <= t && t <= r.to);
    if (active.length > 1) errors.push(`>1 campaign active now: ${active.map((r) => r.id).join(', ')}`);
  }
  return errors;
}

/* ---------- Rule 5: seo object completeness ---------- */
export function validateSeoComplete(seo: unknown): string[] {
  const res = seoObjectSchema.safeParse(seo);
  if (res.success) return [];
  return res.error.issues.map((i) => `seo.${i.path.join('.')}: ${i.message}`);
}

/* ---------- Rule 6: site_seo_pages slug + keywordCluster uniqueness ---------- */
export function checkSeoPageUniqueness(pages: Array<{ slug: string; seo?: { keywordCluster?: string } }>): string[] {
  const errors: string[] = [];
  const slugs = new Map<string, number>();
  const clusters = new Map<string, number>();
  for (const p of pages) {
    slugs.set(p.slug, (slugs.get(p.slug) || 0) + 1);
    const kc = p.seo?.keywordCluster;
    if (kc) clusters.set(kc, (clusters.get(kc) || 0) + 1);
  }
  for (const [s, n] of slugs) if (n > 1) errors.push(`duplicate slug: ${s} (${n}×)`);
  for (const [c, n] of clusters) if (n > 1) errors.push(`duplicate keywordCluster (cannibalization): ${c} (${n}×)`);
  return errors;
}

/* ---------- Rules 3 / 7 / 8: render & admin-layer predicates ---------- */
export const RATING_RENDER_THRESHOLD = 25;
/** Rule 8: rating markers / reviewCount render only at count ≥ 25. */
export function shouldRenderRating(reviewCount: number | undefined): boolean {
  return typeof reviewCount === 'number' && reviewCount >= RATING_RENDER_THRESHOLD;
}
/** Rule 3: protectedNotice sections are non-deletable / non-reorderable in admin. */
export function isProtectedSection(type: string, data: unknown): boolean {
  return type === 'protectedNotice' && !!(data as { locked?: boolean })?.locked;
}

/* ---------- Save-time orchestrator ---------- */
/**
 * Validate a page/content object on save. Iterates top-level section-type keys.
 * - claims violations on claims-checked sections -> ERROR (compliance hard-block, Rule 2)
 * - seo incompleteness when published -> ERROR (Rule 5)
 * - zod shape mismatches -> WARNING (avoids blocking content seeding/migration)
 */
export function validateContentOnSave(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const entry = (SECTION_SCHEMAS as Record<string, { schema: any; claimsChecked?: boolean }>)[key];
    if (!entry) continue; // not a known section type
    const parsed = entry.schema.safeParse(value);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) warnings.push(`${key}.${issue.path.join('.')}: ${issue.message}`);
    }
    if (entry.claimsChecked) {
      const { ok, matches } = passesClaimsCheck(value);
      if (!ok) {
        for (const m of matches) errors.push(`Medical-claim blocked in ${key}.${m.path}: "${m.term}" (${m.reason}) — "${m.context}"`);
      }
    }
  }

  // Rule 5: complete seo before publish.
  const seo = (data as { seo?: unknown; published?: boolean }).seo;
  const published = (data as { published?: boolean }).published;
  if (seo && published) errors.push(...validateSeoComplete(seo));

  return { errors, warnings };
}
