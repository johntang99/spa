import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canAccessSite, canWriteContent, filterSitesForUser, isSuperAdmin } from '@/lib/admin/permissions';
import { getSites } from '@/lib/sites';
import { writeAuditLog } from '@/lib/admin/audit';
import {
  canUseRewriteDb,
  createRewriteJob,
  listRewriteJobs,
  writeRewriteAuditLog,
  type RewriteMode,
  type RewriteScope,
} from '@/lib/admin/rewriteDb';

const ALLOWED_SCOPES = new Set<RewriteScope>(['services', 'conditions', 'custom']);
const ALLOWED_MODES = new Set<RewriteMode>(['conservative', 'balanced', 'aggressive']);

function normalizeLocale(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim().toLowerCase() : 'en';
  return raw || 'en';
}

function normalizeTargetPaths(scope: RewriteScope, targetPaths: unknown): string[] {
  if (Array.isArray(targetPaths)) {
    return targetPaths
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (scope === 'services') return ['pages/services.json'];
  if (scope === 'conditions') return ['pages/conditions.json'];
  return [];
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (!canUseRewriteDb()) {
    return NextResponse.json({ message: 'Rewrite DB unavailable' }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const locale = normalizeLocale(searchParams.get('locale'));
  const siteId = (searchParams.get('siteId') || '').trim();
  const limit = Number(searchParams.get('limit') || 30);

  const allSites = await getSites();
  const visibleSites = filterSitesForUser(allSites, session.user);
  const visibleSiteIds = visibleSites.map((site) => site.id);

  if (siteId && !canAccessSite(session.user, siteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const jobs = await listRewriteJobs({
    siteIds: siteId ? [siteId] : visibleSiteIds,
    locale: locale || undefined,
    limit: Number.isFinite(limit) ? limit : 30,
  });

  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
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

  const payload = await request.json();
  const siteId = typeof payload?.siteId === 'string' ? payload.siteId.trim() : '';
  const scope = payload?.scope as RewriteScope;
  const mode = payload?.mode as RewriteMode;
  const locale = normalizeLocale(payload?.locale);
  const provider = typeof payload?.provider === 'string' && payload.provider.trim()
    ? payload.provider.trim()
    : 'claude';
  const model = typeof payload?.model === 'string' && payload.model.trim()
    ? payload.model.trim()
    : null;
  const sourceOfTruth = payload?.sourceOfTruth === 'local' ? 'local' : 'db';

  if (!siteId) {
    return NextResponse.json({ message: 'siteId is required' }, { status: 400 });
  }
  if (!canAccessSite(session.user, siteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!ALLOWED_SCOPES.has(scope)) {
    return NextResponse.json({ message: 'Invalid scope' }, { status: 400 });
  }
  if (!ALLOWED_MODES.has(mode)) {
    return NextResponse.json({ message: 'Invalid mode' }, { status: 400 });
  }

  const targetPaths = normalizeTargetPaths(scope, payload?.targetPaths);
  if (targetPaths.length === 0) {
    return NextResponse.json({ message: 'targetPaths is required' }, { status: 400 });
  }

  const requirements =
    payload?.requirements && typeof payload.requirements === 'object' && !Array.isArray(payload.requirements)
      ? payload.requirements
      : {};

  const job = await createRewriteJob({
    siteId,
    locale,
    scope,
    targetPaths,
    mode,
    provider,
    model,
    requirements,
    sourceOfTruth,
    createdBy: session.user.id,
  });

  if (!job) {
    return NextResponse.json({ message: 'Failed to create rewrite job' }, { status: 500 });
  }

  await writeAuditLog({
    actor: session.user,
    action: 'rewrite_job_created',
    siteId,
    metadata: {
      rewriteJobId: job.id,
      scope,
      mode,
      locale,
      targetPaths,
      provider,
      sourceOfTruth,
      superAdmin: isSuperAdmin(session.user),
    },
  });

  await writeRewriteAuditLog({
    jobId: job.id,
    action: 'job_created',
    actorId: session.user.id,
    actorEmail: session.user.email,
    metadata: {
      scope,
      mode,
      locale,
      targetPaths,
      provider,
      model,
    },
  });

  return NextResponse.json({ job }, { status: 201 });
}
