import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canAccessSite, canWriteContent } from '@/lib/admin/permissions';
import { writeAuditLog } from '@/lib/admin/audit';
import {
  canUseRewriteDb,
  getRewriteJobById,
  listRewriteItems,
  writeRewriteAuditLog,
} from '@/lib/admin/rewriteDb';
import { generateRewriteWithProvider, isRewriteProviderConfigured } from '@/lib/ai/rewrite/provider';
import {
  generateRewriteItemsFromProvider,
  type RewriteValidationRequirements,
  type RewriteExtractedItem,
} from '@/lib/admin/rewriteEngine';
import { getSupabaseServerClient } from '@/lib/supabase/server';

function normalizeRequirements(requirementsRaw: unknown): RewriteValidationRequirements {
  const requirements =
    requirementsRaw && typeof requirementsRaw === 'object' && !Array.isArray(requirementsRaw)
      ? (requirementsRaw as Record<string, unknown>)
      : {};

  return {
    forbiddenTerms: Array.isArray(requirements.forbiddenTerms)
      ? (requirements.forbiddenTerms.filter((v) => typeof v === 'string') as string[])
      : [],
    requiredTerms: Array.isArray(requirements.requiredTerms)
      ? (requirements.requiredTerms.filter((v) => typeof v === 'string') as string[])
      : [],
    maxLengthDeltaPct:
      typeof requirements.maxLengthDeltaPct === 'number' ? requirements.maxLengthDeltaPct : 45,
    minLengthDeltaPct:
      typeof requirements.minLengthDeltaPct === 'number' ? requirements.minLengthDeltaPct : 0,
    minChangeRatio:
      typeof requirements.minChangeRatio === 'number' ? requirements.minChangeRatio : 0.25,
  };
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  if (!isRewriteProviderConfigured(job.provider)) {
    return NextResponse.json(
      { message: `Rewrite provider "${job.provider}" is not configured` },
      { status: 400 }
    );
  }

  const payload = await request.json();
  const itemIds = Array.isArray(payload?.itemIds)
    ? payload.itemIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];
  if (itemIds.length === 0) {
    return NextResponse.json({ message: 'itemIds is required' }, { status: 400 });
  }

  const allItems = await listRewriteItems({ jobId: job.id, limit: 5000 });
  const selected = allItems.filter((item) => itemIds.includes(item.id));
  if (selected.length === 0) {
    return NextResponse.json({ message: 'No matching items for this job' }, { status: 404 });
  }

  const byPath = new Map<string, typeof selected>();
  for (const item of selected) {
    const list = byPath.get(item.path) || [];
    list.push(item);
    byPath.set(item.path, list);
  }

  const requirements = normalizeRequirements(job.requirements);
  const voiceProfile =
    typeof (job.requirements as any)?.voiceProfile === 'string'
      ? (job.requirements as any).voiceProfile
      : '';
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ message: 'Supabase server client unavailable' }, { status: 500 });
  }

  let regenerated = 0;
  for (const [contentPath, pathItems] of byPath.entries()) {
    const extracted: RewriteExtractedItem[] = pathItems.map((item) => ({
      fieldPath: item.field_path,
      sourceText: item.source_text,
    }));

    const providerMatches: Record<string, { rewrittenText: string; provider: string }> = {};
    for (const chunk of chunkArray(extracted, 40)) {
      const providerItems = await generateRewriteWithProvider({
        provider: job.provider,
        model: job.model,
        siteId: job.site_id,
        locale: job.locale,
        scope: job.scope,
        mode: 'aggressive',
        targetPaths: [contentPath],
        requirements: job.requirements,
        voiceProfile,
        overrideModeInstructions:
          'Regenerate with stronger paragraph and sentence restructuring. Avoid near-duplicate phrasing.',
        items: chunk.map((item) => ({
          path: contentPath,
          fieldPath: item.fieldPath,
          sourceText: item.sourceText,
        })),
      });
      for (const item of providerItems) {
        providerMatches[item.fieldPath] = {
          rewrittenText: item.rewrittenText,
          provider: job.provider,
        };
      }
    }

    const generated = generateRewriteItemsFromProvider(extracted, providerMatches, { requirements });
    for (const generatedItem of generated) {
      const original = pathItems.find((item) => item.field_path === generatedItem.fieldPath);
      if (!original) continue;
      const { error } = await supabase
        .from('rewrite_items')
        .update({
          rewritten_text: generatedItem.rewrittenText,
          similarity_score: generatedItem.similarityScore,
          risk_flags: generatedItem.riskFlags,
          validation: generatedItem.validation,
          validation_passed: generatedItem.validationPassed,
          approved: null,
          approved_by: null,
          approved_at: null,
          applied: false,
          applied_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', original.id)
        .eq('job_id', job.id);
      if (error) {
        throw new Error(`Failed updating rewrite item ${original.id}: ${error.message}`);
      }
      regenerated += 1;
    }
  }

  await writeAuditLog({
    actor: session.user,
    action: 'rewrite_items_regenerated',
    siteId: job.site_id,
    metadata: {
      rewriteJobId: job.id,
      regeneratedItems: regenerated,
    },
  });
  await writeRewriteAuditLog({
    jobId: job.id,
    action: 'item_regenerated',
    actorId: session.user.id,
    actorEmail: session.user.email,
    metadata: {
      regeneratedItems: regenerated,
      requestedItems: itemIds.length,
    },
  });

  return NextResponse.json({
    success: true,
    jobId: job.id,
    requestedItems: itemIds.length,
    regeneratedItems: regenerated,
  });
}
