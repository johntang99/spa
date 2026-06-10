import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canAccessSite, canWriteContent } from '@/lib/admin/permissions';
import { writeAuditLog } from '@/lib/admin/audit';
import {
  canUseRewriteDb,
  getRewriteJobById,
  updateRewriteItemDecision,
  writeRewriteAuditLog,
} from '@/lib/admin/rewriteDb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

  const payload = await request.json();
  const approved = payload?.approved;
  if (typeof approved !== 'boolean') {
    return NextResponse.json({ message: 'approved (boolean) is required' }, { status: 400 });
  }

  const updated = await updateRewriteItemDecision({
    jobId: job.id,
    itemId: params.itemId,
    approved,
    approvedBy: session.user.id,
  });
  if (!updated) {
    return NextResponse.json({ message: 'Failed to update item decision' }, { status: 500 });
  }

  await writeAuditLog({
    actor: session.user,
    action: approved ? 'rewrite_item_approved' : 'rewrite_item_rejected',
    siteId: job.site_id,
    metadata: {
      rewriteJobId: job.id,
      rewriteItemId: updated.id,
      path: updated.path,
      fieldPath: updated.field_path,
    },
  });

  await writeRewriteAuditLog({
    jobId: job.id,
    action: approved ? 'item_approved' : 'item_rejected',
    actorId: session.user.id,
    actorEmail: session.user.email,
    metadata: {
      itemId: updated.id,
      path: updated.path,
      fieldPath: updated.field_path,
    },
  });

  return NextResponse.json({ item: updated });
}
