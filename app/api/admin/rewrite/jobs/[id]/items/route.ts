import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canAccessSite } from '@/lib/admin/permissions';
import { canUseRewriteDb, getRewriteJobById, listRewriteItems } from '@/lib/admin/rewriteDb';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (!canUseRewriteDb()) {
    return NextResponse.json({ message: 'Rewrite DB unavailable' }, { status: 503 });
  }

  const job = await getRewriteJobById(params.id);
  if (!job) {
    return NextResponse.json({ message: 'Rewrite job not found' }, { status: 404 });
  }
  if (!canAccessSite(session.user, job.site_id)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const limit = Number(request.nextUrl.searchParams.get('limit') || 500);
  const items = await listRewriteItems({
    jobId: job.id,
    limit: Number.isFinite(limit) ? limit : 500,
  });

  return NextResponse.json({
    job: {
      id: job.id,
      siteId: job.site_id,
      locale: job.locale,
      status: job.status,
      scope: job.scope,
      mode: job.mode,
      provider: job.provider,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      error: job.error,
    },
    items,
  });
}
