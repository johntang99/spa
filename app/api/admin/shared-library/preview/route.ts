import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requireSiteAccess } from '@/lib/admin/permissions';
import {
  generateServicesForSite,
  resolveSharedLibraryGenerationInput,
  SharedLibraryForbiddenOverrideError,
} from '@/lib/admin/servicesLibrary';
import { canWriteContent, isSuperAdmin } from '@/lib/admin/permissions';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (!canWriteContent(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json();
  const siteId = payload?.siteId as string | undefined;
  if (!siteId) {
    return NextResponse.json({ message: 'siteId is required' }, { status: 400 });
  }

  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const superAdmin = isSuperAdmin(session.user);
    const { master, profiles } = await resolveSharedLibraryGenerationInput(payload, {
      isSuperAdmin: superAdmin,
      siteId,
    });

    const items = generateServicesForSite(master, profiles, siteId);
    return NextResponse.json({ items, count: items.length });
  } catch (error: any) {
    if (error instanceof SharedLibraryForbiddenOverrideError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to generate preview' },
      { status: 400 }
    );
  }
}
