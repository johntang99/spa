import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { isSuperAdmin } from '@/lib/admin/permissions';
import {
  readSiteVoiceProfiles,
  writeSiteVoiceProfiles,
  type SiteVoiceProfilesData,
} from '@/lib/admin/servicesLibrary';

function getEditableSiteIds(sessionSites: string[]) {
  return Array.isArray(sessionSites) ? sessionSites.filter(Boolean) : [];
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const isPlatformAdmin = isSuperAdmin(session.user);
  const data = await readSiteVoiceProfiles();

  if (isPlatformAdmin) {
    return NextResponse.json({
      mode: 'full',
      content: JSON.stringify(data, null, 2),
      editableSiteIds: Object.keys(data.sites || {}),
    });
  }

  const editableSiteIds = getEditableSiteIds(session.user.sites || []);
  if (editableSiteIds.length === 0) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedSiteId = searchParams.get('siteId');
  const siteId =
    requestedSiteId && editableSiteIds.includes(requestedSiteId)
      ? requestedSiteId
      : editableSiteIds[0];

  return NextResponse.json({
    mode: 'scoped',
    siteId,
    editableSiteIds,
    content: JSON.stringify(data.sites?.[siteId] || {}, null, 2),
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  if (typeof payload?.content !== 'string') {
    return NextResponse.json({ message: 'content is required' }, { status: 400 });
  }

  const isPlatformAdmin = isSuperAdmin(session.user);
  try {
    if (isPlatformAdmin && !payload.siteId) {
      const parsed = JSON.parse(payload.content) as SiteVoiceProfilesData;
      await writeSiteVoiceProfiles(parsed);
      return NextResponse.json({ success: true, message: 'Voice profiles saved.' });
    }

    const siteId = typeof payload.siteId === 'string' ? payload.siteId : '';
    if (!siteId) {
      return NextResponse.json({ message: 'siteId is required' }, { status: 400 });
    }

    const editableSiteIds = isPlatformAdmin
      ? null
      : getEditableSiteIds(session.user.sites || []);

    if (editableSiteIds && !editableSiteIds.includes(siteId)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const profile = JSON.parse(payload.content) as Record<string, unknown>;
    const data = await readSiteVoiceProfiles();
    data.sites = data.sites || {};
    data.sites[siteId] = {
      clinicName: String(profile.clinicName || ''),
      toneDescriptor: String(profile.toneDescriptor || ''),
      localContext: String(profile.localContext || ''),
      lexiconReplacements:
        profile.lexiconReplacements && typeof profile.lexiconReplacements === 'object'
          ? (profile.lexiconReplacements as Record<string, string>)
          : {},
      templates:
        profile.templates && typeof profile.templates === 'object'
          ? {
              shortDescription: String(
                (profile.templates as Record<string, unknown>).shortDescription || ''
              ),
              fullDescriptionLead: String(
                (profile.templates as Record<string, unknown>).fullDescriptionLead || ''
              ),
              whatToExpectLead: String(
                (profile.templates as Record<string, unknown>).whatToExpectLead || ''
              ),
            }
          : {
              shortDescription: '',
              fullDescriptionLead: '',
              whatToExpectLead: '',
            },
    };
    await writeSiteVoiceProfiles(data);
    return NextResponse.json({ success: true, message: `Voice profile saved for ${siteId}.` });
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
}
