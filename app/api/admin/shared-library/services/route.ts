import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import {
  canWriteContent,
  isSuperAdmin,
  requireSiteAccess,
} from '@/lib/admin/permissions';
import {
  generateServicesForSite,
  readServicesMaster,
  readSiteVoiceProfiles,
  writeServicesMaster,
  writeSiteVoiceProfiles,
  type ServicesMasterData,
  type SiteVoiceProfilesData,
} from '@/lib/admin/servicesLibrary';
import { canUseContentDb, upsertContentEntry } from '@/lib/contentDb';

function parseBody(input: unknown) {
  return (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get('siteId') || '';
    if (siteId) {
      requireSiteAccess(session.user, siteId);
    }

    const [master, profiles] = await Promise.all([
      readServicesMaster(),
      readSiteVoiceProfiles(),
    ]);
    const superAdmin = isSuperAdmin(session.user);
    const visibleProfiles = superAdmin
      ? profiles.sites
      : Object.fromEntries(
          session.user.sites
            .filter((entry) => typeof profiles.sites?.[entry] === 'object')
            .map((entry) => [entry, profiles.sites[entry]])
        );

    return NextResponse.json({
      master,
      profiles: {
        ...profiles,
        sites: visibleProfiles,
      },
      selectedProfile: siteId ? profiles.sites?.[siteId] ?? null : null,
      permissions: {
        isSuperAdmin: superAdmin,
        canWrite: canWriteContent(session.user),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to load shared library' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (!canWriteContent(session.user)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const payload = parseBody(await request.json());
    const action = asString(payload.action);

    if (action === 'updateMaster') {
      if (!isSuperAdmin(session.user)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
      const master = payload.master as ServicesMasterData;
      await writeServicesMaster(master);
      return NextResponse.json({ success: true, message: 'Master services updated' });
    }

    if (action === 'updateSiteProfile') {
      const siteId = asString(payload.siteId);
      if (!siteId) {
        return NextResponse.json({ message: 'Missing siteId' }, { status: 400 });
      }
      requireSiteAccess(session.user, siteId);
      const profile = payload.profile;
      if (!profile || typeof profile !== 'object') {
        return NextResponse.json({ message: 'Missing profile payload' }, { status: 400 });
      }
      const profiles = await readSiteVoiceProfiles();
      const next: SiteVoiceProfilesData = {
        ...profiles,
        sites: {
          ...profiles.sites,
          [siteId]: profile as SiteVoiceProfilesData['sites'][string],
        },
      };
      await writeSiteVoiceProfiles(next);
      return NextResponse.json({ success: true, message: `Profile updated for ${siteId}` });
    }

    if (action === 'preview' || action === 'applyToSite') {
      const siteId = asString(payload.siteId);
      const locale = asString(payload.locale, 'en');
      if (!siteId) {
        return NextResponse.json({ message: 'Missing siteId' }, { status: 400 });
      }
      requireSiteAccess(session.user, siteId);

      const [master, profiles] = await Promise.all([
        readServicesMaster(),
        readSiteVoiceProfiles(),
      ]);
      const generatedItems = generateServicesForSite(master, profiles, siteId);

      if (action === 'preview') {
        return NextResponse.json({ success: true, generatedItems });
      }

      const servicesPath = path.join(
        process.cwd(),
        'content',
        siteId,
        locale,
        'pages',
        'services.json'
      );
      const raw = await fs.readFile(servicesPath, 'utf-8');
      const pageData = JSON.parse(raw) as Record<string, any>;

      const existingItems = Array.isArray(pageData.servicesList?.items)
        ? pageData.servicesList.items
        : [];
      const existingById = new Map<string, Record<string, any>>();
      for (const item of existingItems) {
        if (item && typeof item === 'object' && typeof item.id === 'string') {
          existingById.set(item.id, item);
        }
      }

      const mergedItems = generatedItems.map((item) => {
        const existing = existingById.get(item.id) || {};
        return {
          ...existing,
          ...item,
        };
      });

      const nextPageData = {
        ...pageData,
        servicesList: {
          ...(pageData.servicesList || {}),
          items: mergedItems,
        },
      };

      const serialized = JSON.stringify(nextPageData, null, 2);
      await fs.writeFile(servicesPath, serialized);

      if (canUseContentDb()) {
        await upsertContentEntry({
          siteId,
          locale,
          path: 'pages/services.json',
          data: nextPageData,
          updatedBy: session.user.email,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Applied generated services to ${siteId}/${locale}/pages/services.json`,
        generatedCount: mergedItems.length,
      });
    }

    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    const message = error?.message || 'Shared library action failed';
    const status = message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ message }, { status });
  }
}
