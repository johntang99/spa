// System S — Wellness medical-claims validator (hard-block on save).
// Spa copy must use WELLNESS / RELIEF language, never medical-treatment claims.
// This is a fresh term list for the spa context (the TCM clinic validator was not a
// portable module). Refine the list over time; condition-page copy is highest-risk.
//
// Validation Rule 2 applies this to: iconGrid.benefits bodies, richText.howHelps /
// whatItIs, and all seo-condition section bodies.

export interface ClaimMatch {
  term: string;
  reason: string;
  context: string; // surrounding text excerpt
}

// Unambiguous medical-claim terms. Matched case-insensitively on word boundaries.
// Kept deliberately conservative to avoid flagging legitimate spa/relaxation copy.
export const BLOCKED_CLAIM_TERMS: Array<{ pattern: RegExp; term: string; reason: string }> = [
  { pattern: /\bcures?\b/i, term: 'cure', reason: 'implies medical cure' },
  { pattern: /\bcured\b/i, term: 'cured', reason: 'implies medical cure' },
  { pattern: /\bcuring\b/i, term: 'curing', reason: 'implies medical cure' },
  { pattern: /\bheals?\b/i, term: 'heal', reason: 'implies medical healing claim' },
  { pattern: /\bdiagnos(e|es|is|ing)\b/i, term: 'diagnose', reason: 'diagnosis is a medical act' },
  { pattern: /\btreats?\b/i, term: 'treat', reason: 'implies medical treatment claim' },
  { pattern: /\btreating\b/i, term: 'treating', reason: 'implies medical treatment claim' },
  { pattern: /\btreatment for\b/i, term: 'treatment for', reason: 'implies treating a condition' },
  { pattern: /\bremed(y|ies)\b/i, term: 'remedy', reason: 'implies medical remedy' },
  { pattern: /\bclinically proven\b/i, term: 'clinically proven', reason: 'unsupported efficacy claim' },
  { pattern: /\bmedically proven\b/i, term: 'medically proven', reason: 'unsupported efficacy claim' },
  { pattern: /\bguarantee(d|s)?\b/i, term: 'guarantee', reason: 'outcome guarantee' },
  { pattern: /\beliminat(e|es|ing)\b/i, term: 'eliminate', reason: 'absolute outcome claim' },
  { pattern: /\breverses?\b/i, term: 'reverse', reason: 'implies reversing a condition' },
  { pattern: /\bprevents?\b/i, term: 'prevent', reason: 'implies disease prevention claim' },
  { pattern: /\bdetox(es|ifies|ify|ification)?\b/i, term: 'detox', reason: 'unsupported medical claim' },
  { pattern: /\bboosts? (the )?immune\b/i, term: 'boosts immune', reason: 'unsupported medical claim' },
  { pattern: /\banti-?inflammatory\b/i, term: 'anti-inflammatory', reason: 'medical efficacy claim' },
];

function excerpt(text: string, index: number, len: number): string {
  const start = Math.max(0, index - 24);
  const end = Math.min(text.length, index + len + 24);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}

/** Scan a single string for blocked claim terms. */
export function scanText(text: string): ClaimMatch[] {
  if (!text) return [];
  const matches: ClaimMatch[] = [];
  for (const { pattern, term, reason } of BLOCKED_CLAIM_TERMS) {
    const m = pattern.exec(text);
    if (m) matches.push({ term, reason, context: excerpt(text, m.index, m[0].length) });
  }
  return matches;
}

/** Recursively scan all string values in a data object for claims. */
export function scanForClaims(data: unknown, path: string[] = []): Array<ClaimMatch & { path: string }> {
  const out: Array<ClaimMatch & { path: string }> = [];
  if (typeof data === 'string') {
    for (const m of scanText(data)) out.push({ ...m, path: path.join('.') || '(root)' });
  } else if (Array.isArray(data)) {
    data.forEach((v, i) => out.push(...scanForClaims(v, [...path, String(i)])));
  } else if (data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) out.push(...scanForClaims(v, [...path, k]));
  }
  return out;
}

/** True if the data is free of blocked medical claims. */
export function passesClaimsCheck(data: unknown): { ok: boolean; matches: Array<ClaimMatch & { path: string }> } {
  const matches = scanForClaims(data);
  return { ok: matches.length === 0, matches };
}
