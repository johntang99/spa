import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { canAccessSite, canWriteContent } from '@/lib/admin/permissions';
import { fetchContentEntry, insertContentRevision, upsertContentEntry } from '@/lib/contentDb';
import {
  canUseRewriteDb,
  getRewriteJobById,
  listRewriteItems,
  markRewriteItemsApplied,
  updateRewriteJob,
  writeRewriteAuditLog,
} from '@/lib/admin/rewriteDb';

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

async function loadContentForApply(params: {
  siteId: string;
  locale: string;
  contentPath: string;
  sourceOfTruth: 'db' | 'local';
}): Promise<{ data: any; entryId?: string } | null> {
  if (params.sourceOfTruth === 'db') {
    const entry = await fetchContentEntry(params.siteId, params.locale, params.contentPath);
    if (!entry) return null;
    return { data: entry.data, entryId: entry.id };
  }

  const filePath = path.join(
    process.cwd(),
    'content',
    params.siteId,
    params.locale,
    params.contentPath
  );
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return { data: JSON.parse(raw) };
  } catch {
    return null;
  }
}

async function saveContentAfterApply(params: {
  siteId: string;
  locale: string;
  contentPath: string;
  sourceOfTruth: 'db' | 'local';
  data: unknown;
  updatedBy: string;
  entryId?: string;
}) {
  if (params.sourceOfTruth === 'db') {
    await upsertContentEntry({
      siteId: params.siteId,
      locale: params.locale,
      path: params.contentPath,
      data: params.data,
      updatedBy: params.updatedBy,
    });
    if (params.entryId) {
      await insertContentRevision({
        entryId: params.entryId,
        data: params.data,
        createdBy: params.updatedBy,
        note: 'Applied approved rewrite items',
      });
    }
    return;
  }

  const filePath = path.join(
    process.cwd(),
    'content',
    params.siteId,
    params.locale,
    params.contentPath
  );
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(params.data, null, 2) + '\n');
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

  const items = await listRewriteItems({ jobId: job.id, limit: 5000 });
  const approvedItems = items.filter(
    (item) =>
      item.approved === true &&
      item.applied !== true &&
      typeof item.rewritten_text === 'string' &&
      item.rewritten_text.trim().length > 0
  );
  const blockedItems = items.filter(
    (item) =>
      item.approved === true &&
      item.applied !== true &&
      (typeof item.rewritten_text !== 'string' || item.rewritten_text.trim().length === 0)
  );

  if (approvedItems.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No approved items to apply.',
      appliedItems: 0,
      updatedPaths: 0,
      blockedItems: blockedItems.length,
    });
  }

  const byPath = new Map<string, typeof approvedItems>();
  for (const item of approvedItems) {
    const list = byPath.get(item.path) || [];
    list.push(item);
    byPath.set(item.path, list);
  }

  const appliedItemIds: string[] = [];
  const failedItems: Array<{ itemId: string; reason: string }> = [];
  let updatedPaths = 0;

  for (const [contentPath, pathItems] of byPath.entries()) {
    const loaded = await loadContentForApply({
      siteId: job.site_id,
      locale: job.locale,
      contentPath,
      sourceOfTruth: job.source_of_truth,
    });
    if (!loaded) {
      pathItems.forEach((item) =>
        failedItems.push({ itemId: item.id, reason: `Target path missing: ${contentPath}` })
      );
      continue;
    }

    let changedInPath = 0;
    for (const item of pathItems) {
      const ok = setValueAtFieldPath(
        loaded.data,
        item.field_path,
        String(item.rewritten_text || '')
      );
      if (ok) {
        changedInPath += 1;
        appliedItemIds.push(item.id);
      } else {
        failedItems.push({
          itemId: item.id,
          reason: `Field path not found: ${item.field_path}`,
        });
      }
    }

    if (changedInPath > 0) {
      await saveContentAfterApply({
        siteId: job.site_id,
        locale: job.locale,
        contentPath,
        sourceOfTruth: job.source_of_truth,
        data: loaded.data,
        updatedBy: session.user.id,
        entryId: loaded.entryId,
      });
      updatedPaths += 1;
    }
  }

  await markRewriteItemsApplied({
    jobId: job.id,
    itemIds: appliedItemIds,
  });

  const nextStatus =
    appliedItemIds.length > 0 && failedItems.length === 0 ? 'completed' : 'needs_review';
  await updateRewriteJob({
    jobId: job.id,
    status: nextStatus,
    completedAt: new Date().toISOString(),
    error: failedItems.length > 0 ? `Some items failed (${failedItems.length})` : null,
  });

  await writeAuditLog({
    actor: session.user,
    action: 'rewrite_job_applied',
    siteId: job.site_id,
    metadata: {
      rewriteJobId: job.id,
      appliedItems: appliedItemIds.length,
      failedItems: failedItems.length,
      updatedPaths,
    },
  });

  await writeRewriteAuditLog({
    jobId: job.id,
    action: 'job_applied',
    actorId: session.user.id,
    actorEmail: session.user.email,
    metadata: {
      appliedItems: appliedItemIds.length,
      failedItems: failedItems.length,
      updatedPaths,
    },
  });

  return NextResponse.json({
    success: true,
    status: nextStatus,
    appliedItems: appliedItemIds.length,
    failedItems,
    updatedPaths,
    blockedItems: blockedItems.length,
  });
}
