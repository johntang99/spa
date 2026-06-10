import crypto from 'crypto';

export interface RewriteExtractedItem {
  fieldPath: string;
  sourceText: string;
}

export interface GeneratedRewriteItem extends RewriteExtractedItem {
  rewrittenText: string;
  similarityScore: number;
  validationPassed: boolean;
  validation: Record<string, unknown>;
  riskFlags: string[];
  sourceHash: string;
}

export interface ProviderRewriteMatch {
  rewrittenText: string;
  provider: string;
}

export interface RewriteValidationRequirements {
  forbiddenTerms?: string[];
  requiredTerms?: string[];
  maxLengthDeltaPct?: number;
  minLengthDeltaPct?: number;
  minChangeRatio?: number;
}

export interface RewriteGenerationOptions {
  requirements?: RewriteValidationRequirements;
}

interface ValidationContext {
  fieldPath?: string;
}

function isLikelyContentKey(key: string): boolean {
  return /title|subtitle|description|summary|content|intro|body|text|headline|tagline|blurb|quote/i.test(
    key
  );
}

function isLikelyNonContentKey(key: string): boolean {
  return /id|slug|url|href|link|image|icon|phone|email|date|time|cta|created|updated/i.test(key);
}

function shouldKeepString(value: string, parentKey: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < 24) return false;
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return false;
  if (isLikelyNonContentKey(parentKey)) return false;
  return true;
}

function collectStrings(
  value: unknown,
  pathPrefix: string,
  parentKey: string,
  out: RewriteExtractedItem[]
) {
  if (typeof value === 'string') {
    if (shouldKeepString(value, parentKey) || isLikelyContentKey(parentKey)) {
      out.push({
        fieldPath: pathPrefix,
        sourceText: value.trim(),
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectStrings(entry, `${pathPrefix}[${index}]`, parentKey, out);
    });
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nestedPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    collectStrings(nested, nestedPath, key, out);
  }
}

function normalizeRewrite(sourceText: string): string {
  return sourceText.replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function calculateLexicalSimilarity(a: string, b: string): number {
  const aa = new Set(tokenize(a));
  const bb = new Set(tokenize(b));
  if (aa.size === 0 && bb.size === 0) return 1;
  let intersection = 0;
  for (const token of aa) {
    if (bb.has(token)) intersection += 1;
  }
  const union = new Set([...aa, ...bb]).size;
  return union === 0 ? 1 : intersection / union;
}

function computeLengthDeltaPct(sourceText: string, rewrittenText: string): number {
  if (sourceText.length === 0) return 0;
  return Math.round((Math.abs(rewrittenText.length - sourceText.length) / sourceText.length) * 100);
}

function computeChangeRatio(sourceText: string, rewrittenText: string): number {
  const normalizedSource = sourceText.toLowerCase();
  const normalizedRewrite = rewrittenText.toLowerCase();
  if (!normalizedSource && !normalizedRewrite) return 0;
  if (normalizedSource === normalizedRewrite) return 0;
  const similarity = calculateLexicalSimilarity(normalizedSource, normalizedRewrite);
  return Number((1 - similarity).toFixed(4));
}

function includesTerm(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

function isTitleLikeField(fieldPath: string): boolean {
  return /(?:^|\.)(title|subtitle|headline|name)$/i.test(fieldPath);
}

function containsUrl(value: string): boolean {
  return /(https?:\/\/|www\.)\S+/i.test(value);
}

function containsEmail(value: string): boolean {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);
}

function containsPhone(value: string): boolean {
  return /(?:\+?\d[\d().\-\s]{6,}\d)/.test(value);
}

function isNonRewritableField(fieldPath: string, sourceText: string): boolean {
  const normalizedPath = fieldPath.toLowerCase();
  const normalizedText = sourceText.trim().toLowerCase();

  if (
    /(?:^|\.)(phone|email|url|href|link|slug|id|zipcode|zip|postal|addressmapurl)\b/.test(
      normalizedPath
    )
  ) {
    return true;
  }

  if (
    /(?:^|\.)cta\.[^.]+\.(text|label)$/.test(normalizedPath) &&
    /^(call|text|email|book|contact)\b/.test(normalizedText) &&
    (containsPhone(sourceText) || containsEmail(sourceText) || containsUrl(sourceText))
  ) {
    return true;
  }

  if (/^(call|text|email)\s*[:\-]/.test(normalizedText)) {
    return containsPhone(sourceText) || containsEmail(sourceText);
  }

  return false;
}

function getAdjustedThresholds(params: {
  fieldPath: string;
  sourceText: string;
  minChangeRatio: number;
  minLengthDeltaPct: number;
}): { minChangeRatio: number; minLengthDeltaPct: number; relaxedReason: string | null } {
  const sourceLength = params.sourceText.trim().length;
  const titleLike = isTitleLikeField(params.fieldPath);

  if (sourceLength <= 24) {
    return {
      minChangeRatio: 0,
      minLengthDeltaPct: 0,
      relaxedReason: 'short_string',
    };
  }

  if (sourceLength <= 48 || titleLike) {
    return {
      minChangeRatio: Number(Math.max(0, params.minChangeRatio * 0.35).toFixed(4)),
      minLengthDeltaPct: 0,
      relaxedReason: titleLike ? 'title_like_field' : 'short_string',
    };
  }

  return {
    minChangeRatio: params.minChangeRatio,
    minLengthDeltaPct: params.minLengthDeltaPct,
    relaxedReason: null,
  };
}

function validateRewrite(
  sourceText: string,
  rewrittenText: string,
  requirements: RewriteValidationRequirements | undefined,
  context?: ValidationContext
): { validation: Record<string, unknown>; validationPassed: boolean; riskFlags: string[]; similarityScore: number } {
  const riskFlags: string[] = [];
  const checks: string[] = [];

  const lengthDeltaPct = computeLengthDeltaPct(sourceText, rewrittenText);
  const changeRatio = computeChangeRatio(sourceText, rewrittenText);
  const lexicalSimilarity = calculateLexicalSimilarity(sourceText, rewrittenText);

  const maxLengthDeltaPct = requirements?.maxLengthDeltaPct ?? 35;
  const baseMinLengthDeltaPct = requirements?.minLengthDeltaPct ?? 0;
  const baseMinChangeRatio = requirements?.minChangeRatio ?? 0.2;
  const fieldPath = context?.fieldPath || '';
  const nonRewritable = isNonRewritableField(fieldPath, sourceText);
  const adjusted = getAdjustedThresholds({
    fieldPath,
    sourceText,
    minChangeRatio: baseMinChangeRatio,
    minLengthDeltaPct: baseMinLengthDeltaPct,
  });
  const minLengthDeltaPct = nonRewritable ? 0 : adjusted.minLengthDeltaPct;
  const minChangeRatio = nonRewritable ? 0 : adjusted.minChangeRatio;
  const forbiddenTerms = Array.isArray(requirements?.forbiddenTerms)
    ? requirements?.forbiddenTerms || []
    : [];
  const requiredTerms = Array.isArray(requirements?.requiredTerms)
    ? requirements?.requiredTerms || []
    : [];

  checks.push(nonRewritable ? 'entity_preservation' : 'lexical_similarity');
  checks.push(nonRewritable ? 'non_rewritable_field' : 'change_ratio');

  if (!nonRewritable) {
    if (lengthDeltaPct > maxLengthDeltaPct) {
      riskFlags.push('length_delta_too_high');
    }
    if (lengthDeltaPct < minLengthDeltaPct) {
      riskFlags.push('length_delta_too_low');
    }
    if (changeRatio < minChangeRatio) {
      riskFlags.push('rewrite_too_similar');
    }
  }

  const missingRequiredTerms = requiredTerms.filter((term) => !includesTerm(rewrittenText, term));
  if (missingRequiredTerms.length > 0) {
    riskFlags.push('missing_required_terms');
  }

  const forbiddenTermHits = forbiddenTerms.filter((term) => includesTerm(rewrittenText, term));
  if (forbiddenTermHits.length > 0) {
    riskFlags.push('forbidden_terms_present');
  }

  if (!rewrittenText.trim()) {
    riskFlags.push('empty_rewrite');
  }

  const validation = {
    checks,
    fieldPath,
    nonRewritable,
    thresholdRelaxation: adjusted.relaxedReason,
    lexicalSimilarity: Number(lexicalSimilarity.toFixed(4)),
    semanticSimilarityApprox: Number(lexicalSimilarity.toFixed(4)),
    changeRatio,
    lengthDeltaPct,
    maxLengthDeltaPct,
    minLengthDeltaPct,
    baseMinLengthDeltaPct,
    minChangeRatio,
    baseMinChangeRatio,
    missingRequiredTerms,
    forbiddenTermHits,
  };

  return {
    validation,
    validationPassed: riskFlags.length === 0,
    riskFlags,
    similarityScore: Number(lexicalSimilarity.toFixed(4)),
  };
}

export function extractRewriteItems(jsonValue: unknown): RewriteExtractedItem[] {
  const items: RewriteExtractedItem[] = [];
  collectStrings(jsonValue, '', '', items);
  return items;
}

export function generateRewriteItems(extracted: RewriteExtractedItem[]): GeneratedRewriteItem[] {
  return extracted.map((item) => {
    const rewrittenText = normalizeRewrite(item.sourceText);
    const sourceHash = crypto.createHash('sha256').update(item.sourceText).digest('hex');
    return {
      ...item,
      rewrittenText,
      sourceHash,
      similarityScore: 1,
      validationPassed: true,
      validation: {
        semanticSimilarity: 1,
        lengthDeltaPct: 0,
        checks: ['stub_generation'],
      },
      riskFlags: ['provider_not_connected'],
    };
  });
}

export function generateRewriteItemsFromProvider(
  extracted: RewriteExtractedItem[],
  providerMatches: Record<string, ProviderRewriteMatch>,
  options?: RewriteGenerationOptions
): GeneratedRewriteItem[] {
  return extracted.map((item) => {
    const sourceText = normalizeRewrite(item.sourceText);
    const match = providerMatches[item.fieldPath];
    const rewrittenText = normalizeRewrite(match?.rewrittenText || sourceText);
    const sourceHash = crypto.createHash('sha256').update(sourceText).digest('hex');
    const {
      validation,
      validationPassed,
      riskFlags,
      similarityScore,
    } = validateRewrite(sourceText, rewrittenText, options?.requirements, {
      fieldPath: item.fieldPath,
    });
    const enrichedRiskFlags = [...riskFlags];
    if (!match) {
      enrichedRiskFlags.push('missing_provider_output');
    }
    if (rewrittenText === sourceText && !isNonRewritableField(item.fieldPath, sourceText)) {
      enrichedRiskFlags.push('unchanged_by_provider');
    }

    return {
      ...item,
      sourceText,
      rewrittenText,
      sourceHash,
      similarityScore,
      validationPassed,
      validation,
      riskFlags: Array.from(new Set(enrichedRiskFlags)),
    };
  });
}
