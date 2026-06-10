import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canAccessSite, canWriteContent } from '@/lib/admin/permissions';
import { fetchContentEntry } from '@/lib/contentDb';
import { writeAuditLog } from '@/lib/admin/audit';
import {
  canUseRewriteDb,
  getRewriteJobById,
  replaceRewriteItems,
  updateRewriteJob,
  writeRewriteAuditLog,
} from '@/lib/admin/rewriteDb';
import {
  extractRewriteItems,
  generateRewriteItemsFromProvider,
  type RewriteValidationRequirements,
} from '@/lib/admin/rewriteEngine';
import { generateRewriteWithProvider, isRewriteProviderConfigured } from '@/lib/ai/rewrite/provider';

function normalizeTargetPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !item.startsWith('/') && !item.includes('..'));
}

async function loadPathPayload(params: {
  siteId: string;
  locale: string;
  contentPath: string;
  sourceOfTruth: 'db' | 'local';
}): Promise<unknown | null> {
  if (params.sourceOfTruth === 'db') {
    const entry = await fetchContentEntry(params.siteId, params.locale, params.contentPath);
    return entry?.data ?? null;
  }

  const filePath = path.join(process.cwd(), 'content', params.siteId, params.locale, params.contentPath);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function chunkArray<T>(items: T[], chunkSize: number): T[][]
{
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function normalizeRequirements(
  requirementsRaw: unknown,
  mode: string
): RewriteValidationRequirements {
  const requirements =
    requirementsRaw && typeof requirementsRaw === 'object' && !Array.isArray(requirementsRaw)
      ? (requirementsRaw as Record<string, unknown>)
      : {};

  const modeKey = (mode || 'balanced').toLowerCase();
  const defaultMinChangeRatio =
    modeKey === 'aggressive' ? 0.3 : modeKey === 'conservative' ? 0.12 : 0.2;
  const defaultMaxLengthDelta =
    modeKey === 'aggressive' ? 60 : modeKey === 'conservative' ? 25 : 40;

  const coerceNumber = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  return {
    forbiddenTerms: Array.isArray(requirements.forbiddenTerms)
      ? (requirements.forbiddenTerms.filter((v) => typeof v === 'string') as string[])
      : [],
    requiredTerms: Array.isArray(requirements.requiredTerms)
      ? (requirements.requiredTerms.filter((v) => typeof v === 'string') as string[])
      : [],
    maxLengthDeltaPct: coerceNumber(requirements.maxLengthDeltaPct, defaultMaxLengthDelta),
    minLengthDeltaPct: coerceNumber(requirements.minLengthDeltaPct, 0),
    minChangeRatio: coerceNumber(requirements.minChangeRatio, defaultMinChangeRatio),
  };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (!canUseRewriteDb()) {
    return NextResponse.json({ message: 'Rewrite DB unavailable' }, { status: 503 });
  }
  if (!canWriteContent(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const job = await getRewriteJobById(params.id);
  if (!job) {
    return NextResponse.json({ message: 'Rewrite job not found' }, { status: 404 });
  }
  if (!canAccessSite(session.user, job.site_id)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const startedAt = new Date().toISOString();
  await updateRewriteJob({
    jobId: job.id,
    status: 'running',
    error: null,
    startedAt,
    completedAt: null,
  });
  await writeRewriteAuditLog({
    jobId: job.id,
    action: 'job_started',
    actorId: session.user.id,
    actorEmail: session.user.email,
  });

  try {
    if (!isRewriteProviderConfigured(job.provider)) {
      throw new Error(
        `Rewrite provider "${job.provider}" is not configured. Add the API key to env and retry.`
      );
    }

    const targetPaths = normalizeTargetPaths(job.target_paths);
    const normalizedRequirements = normalizeRequirements(job.requirements, job.mode);
    const voiceProfile =
      typeof (job.requirements as any)?.voiceProfile === 'string'
        ? (job.requirements as any).voiceProfile
        : '';
    const MAX_PROVIDER_CHUNK_RETRIES = 2;
    const chunkFailureWarnings: string[] = [];
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
      const jsonPayload = await loadPathPayload({
        siteId: job.site_id,
        locale: job.locale,
        contentPath,
        sourceOfTruth: job.source_of_truth,
      });
      if (!jsonPayload) {
        missingTargets += 1;
        continue;
      }

      const extracted = extractRewriteItems(jsonPayload);
      const providerMatches: Record<string, { rewrittenText: string; provider: string }> = {};
      const chunks = chunkArray(extracted, 40);

      for (const chunk of chunks) {
        const baseRequest = {
          provider: job.provider,
          model: job.model,
          siteId: job.site_id,
          locale: job.locale,
          scope: job.scope,
          mode: job.mode,
          targetPaths: [contentPath],
          requirements: job.requirements,
          voiceProfile,
          items: chunk.map((item) => ({
            path: contentPath,
            fieldPath: item.fieldPath,
            sourceText: item.sourceText,
          })),
        };

        let providerItems: Awaited<ReturnType<typeof generateRewriteWithProvider>> = [];
        let chunkSucceeded = false;
        let lastChunkError = '';
        for (let attempt = 0; attempt <= MAX_PROVIDER_CHUNK_RETRIES; attempt += 1) {
          try {
            providerItems = await generateRewriteWithProvider({
              ...baseRequest,
              overrideModeInstructions:
                attempt === 0
                  ? undefined
                  : 'CRITICAL: Return strict valid JSON only. No commentary, no markdown, no trailing commas, no extra keys. Keep locale language exactly as requested.',
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
          chunkFailureWarnings.push(
            `${contentPath} chunk failed after retries: ${lastChunkError}`
          );
          continue;
        }
        let generated = generateRewriteItemsFromProvider(
          chunk,
          Object.fromEntries(
            providerItems.map((item) => [
              item.fieldPath,
              { rewrittenText: item.rewrittenText, provider: job.provider },
            ])
          ),
          { requirements: normalizedRequirements }
        );

        // Retry once with stronger directives for fields that are still too similar.
        const needsRetry = generated.filter((item) => item.riskFlags.includes('rewrite_too_similar'));
        if (needsRetry.length > 0) {
          const retryItems = await generateRewriteWithProvider({
            ...baseRequest,
            mode: 'aggressive',
            overrideModeInstructions:
              'Regenerate with substantially different sentence and paragraph flow. Avoid synonym-only edits.',
            items: needsRetry.map((item) => ({
              path: contentPath,
              fieldPath: item.fieldPath,
              sourceText: item.sourceText,
            })),
          });
          for (const item of retryItems) {
            providerMatches[item.fieldPath] = {
              rewrittenText: item.rewrittenText,
              provider: job.provider,
            };
          }
        }

        for (const item of providerItems) {
          providerMatches[item.fieldPath] = {
            rewrittenText: item.rewrittenText,
            provider: job.provider,
          };
        }
      }

      const generated = generateRewriteItemsFromProvider(extracted, providerMatches, {
        requirements: normalizedRequirements,
      });
      generated.forEach((item) => {
        generatedRows.push({
          jobId: job.id,
          siteId: job.site_id,
          locale: job.locale,
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

    const inserted = await replaceRewriteItems(generatedRows);
    const hardBlockFlags = new Set(['forbidden_terms_present', 'empty_rewrite']);
    const riskyItems = generatedRows.filter((item) =>
      item.riskFlags.some((flag) => hardBlockFlags.has(flag))
    ).length;
    const warningItems = generatedRows.filter(
      (item) => item.riskFlags.length > 0 && !item.riskFlags.some((flag) => hardBlockFlags.has(flag))
    ).length;
    const avgChangeRatio =
      generatedRows.length === 0
        ? 0
        : Number(
            (
              generatedRows.reduce((sum, row) => {
                const value =
                  typeof row.validation?.changeRatio === 'number' ? row.validation.changeRatio : 0;
                return sum + value;
              }, 0) / generatedRows.length
            ).toFixed(4)
          );
    const completedAt = new Date().toISOString();
    await updateRewriteJob({
      jobId: job.id,
      status: 'needs_review',
      completedAt,
      error: null,
    });

    await writeAuditLog({
      actor: session.user,
      action: 'rewrite_job_run',
      siteId: job.site_id,
      metadata: {
        rewriteJobId: job.id,
        sourceOfTruth: job.source_of_truth,
        targetPaths: targetPaths.length,
        missingTargets,
        generatedItems: inserted,
        riskyItems,
        warningItems,
        avgChangeRatio,
        chunkFailures: chunkFailureWarnings.length,
      },
    });
    await writeRewriteAuditLog({
      jobId: job.id,
      action: 'item_generated',
      actorId: session.user.id,
      actorEmail: session.user.email,
      metadata: {
        itemCount: inserted,
        missingTargets,
        provider: job.provider,
        model: job.model,
        riskyItems,
        warningItems,
        avgChangeRatio,
        chunkFailures: chunkFailureWarnings.length,
        chunkFailureSamples: chunkFailureWarnings.slice(0, 5),
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'needs_review',
      targetPaths: targetPaths.length,
      missingTargets,
      generatedItems: inserted,
      riskyItems,
      warningItems,
      avgChangeRatio,
      chunkFailures: chunkFailureWarnings.length,
      chunkFailureSamples: chunkFailureWarnings.slice(0, 5),
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to run rewrite job';
    await updateRewriteJob({
      jobId: job.id,
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: message,
    });
    await writeRewriteAuditLog({
      jobId: job.id,
      action: 'job_failed',
      actorId: session.user.id,
      actorEmail: session.user.email,
      metadata: { message },
    });
    return NextResponse.json({ message }, { status: 500 });
  }
}
