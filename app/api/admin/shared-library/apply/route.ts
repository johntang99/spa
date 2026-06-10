import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canWriteContent, isSuperAdmin, requireSiteAccess } from '@/lib/admin/permissions';
import { resolveContentPath } from '@/lib/admin/content';
import {
  canUseContentDb,
  fetchContentEntry,
  upsertContentEntry,
} from '@/lib/contentDb';
import {
  generateServicesForSite,
  resolveSharedLibraryGenerationInput,
  SharedLibraryForbiddenOverrideError,
} from '@/lib/admin/servicesLibrary';

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function isLocalhostRequest(request?: NextRequest): boolean {
  if (!request) return false;
  try {
    const { hostname } = new URL(request.url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function shouldWriteThroughFile(request?: NextRequest): boolean {
  if (isLocalhostRequest(request)) {
    return true;
  }
  const override = parseBooleanEnv(process.env.CONTENT_WRITE_THROUGH_FILE);
  if (override !== null) {
    return override;
  }
  return process.env.NODE_ENV !== 'production';
}

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
  const locale = (payload?.locale as string | undefined) || 'en';
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
    const generatedItems = generateServicesForSite(master, profiles, siteId);

    const filePath = 'pages/services.json';
    const resolved = resolveContentPath(siteId, locale, filePath);
    if (!resolved) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }

    let current: Record<string, any> = {};
    if (canUseContentDb()) {
      const entry = await fetchContentEntry(siteId, locale, filePath);
      if (entry?.data && typeof entry.data === 'object') {
        current = entry.data as Record<string, any>;
      }
    }

    if (Object.keys(current).length === 0) {
      try {
        const raw = await fs.readFile(resolved, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          current = parsed as Record<string, any>;
        }
      } catch {
        current = {};
      }
    }

    const next = {
      ...current,
      servicesList: {
        ...(current.servicesList && typeof current.servicesList === 'object'
          ? current.servicesList
          : {}),
        items: generatedItems,
      },
    };

    if (canUseContentDb()) {
      await upsertContentEntry({
        siteId,
        locale,
        path: filePath,
        data: next,
        updatedBy: session.user.email,
      });
      if (!shouldWriteThroughFile(request)) {
        return NextResponse.json({
          success: true,
          count: generatedItems.length,
          fileSync: 'skipped',
          message: `Applied ${generatedItems.length} services to DB.`,
        });
      }
    }

    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, JSON.stringify(next, null, 2));
    return NextResponse.json({
      success: true,
      count: generatedItems.length,
      fileSync: 'synced',
      message: `Applied ${generatedItems.length} services to ${siteId}/${locale}.`,
    });
  } catch (error: any) {
    if (error instanceof SharedLibraryForbiddenOverrideError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to apply generated services' },
      { status: 400 }
    );
  }
}
