import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canManageMedia, requireSiteAccess } from '@/lib/admin/permissions';
import { listMedia } from '@/lib/admin/media';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = String(payload?.siteId || '');
  if (!siteId) {
    return NextResponse.json({ message: 'siteId is required' }, { status: 400 });
  }

  try {
    requireSiteAccess(session.user, siteId);
    if (!canManageMedia(session.user)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const items = await listMedia(siteId);
  return NextResponse.json({ success: true, imported: items.length });
}
