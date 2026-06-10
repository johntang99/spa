'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface SiteOption {
  id: string;
  name: string;
}

interface SharedLibraryEditorProps {
  sites: SiteOption[];
  initialSiteId: string;
  canWrite: boolean;
  isSuperAdmin: boolean;
  mode: 'master' | 'profiles';
}

interface SiteVoiceProfileFormValue {
  clinicName: string;
  toneDescriptor: string;
  localContext: string;
  lexiconReplacements: Record<string, string>;
  templates: {
    shortDescription: string;
    fullDescriptionLead: string;
    whatToExpectLead: string;
  };
}

const EMPTY_SITE_VOICE_PROFILE: SiteVoiceProfileFormValue = {
  clinicName: '',
  toneDescriptor: '',
  localContext: '',
  lexiconReplacements: {},
  templates: {
    shortDescription: '',
    fullDescriptionLead: '',
    whatToExpectLead: '',
  },
};

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeSiteVoiceProfile(input: unknown): SiteVoiceProfileFormValue {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const templates =
    source.templates && typeof source.templates === 'object'
      ? (source.templates as Record<string, unknown>)
      : {};
  const lexiconSource =
    source.lexiconReplacements && typeof source.lexiconReplacements === 'object'
      ? (source.lexiconReplacements as Record<string, unknown>)
      : {};
  const lexiconReplacements = Object.fromEntries(
    Object.entries(lexiconSource)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, value]) => [key, String(value)])
  );

  return {
    clinicName: asString(source.clinicName),
    toneDescriptor: asString(source.toneDescriptor),
    localContext: asString(source.localContext),
    lexiconReplacements,
    templates: {
      shortDescription: asString(templates.shortDescription),
      fullDescriptionLead: asString(templates.fullDescriptionLead),
      whatToExpectLead: asString(templates.whatToExpectLead),
    },
  };
}

function stringifyLexiconInput(value: Record<string, string>) {
  return Object.entries(value)
    .map(([key, replacement]) => `${key}=${replacement}`)
    .join('\n');
}

function parseLexiconInput(value: string) {
  const entries = value.split('\n');
  const next: Record<string, string> = {};
  for (const line of entries) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separator = trimmed.includes('=') ? '=' : ':';
    const index = trimmed.indexOf(separator);
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const replacement = trimmed.slice(index + 1).trim();
    if (!key) continue;
    next[key] = replacement;
  }
  return next;
}

export function SharedLibraryEditor({
  sites,
  initialSiteId,
  canWrite,
  isSuperAdmin,
  mode,
}: SharedLibraryEditorProps) {
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId || sites[0]?.id || '');
  const [locale, setLocale] = useState('en');
  const [draft, setDraft] = useState('');
  const [previewDraft, setPreviewDraft] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profilesMode, setProfilesMode] = useState<'full' | 'scoped'>('full');
  const [editableSiteIds, setEditableSiteIds] = useState<string[]>([]);

  const isMasterMode = mode === 'master';
  const canEditMaster = isMasterMode && isSuperAdmin && canWrite;
  const canEditProfiles = !isMasterMode && canWrite;
  const selectedSiteLabel = useMemo(
    () => sites.find((site) => site.id === selectedSiteId)?.name || selectedSiteId,
    [sites, selectedSiteId]
  );
  const profileFormState = useMemo(() => {
    if (isMasterMode) {
      return {
        profile: EMPTY_SITE_VOICE_PROFILE,
        parseError: null as string | null,
      };
    }
    try {
      const parsed = JSON.parse(draft || '{}') as Record<string, unknown>;
      if (profilesMode === 'scoped') {
        return {
          profile: normalizeSiteVoiceProfile(parsed),
          parseError: null as string | null,
        };
      }
      const sitesPayload =
        parsed.sites && typeof parsed.sites === 'object'
          ? (parsed.sites as Record<string, unknown>)
          : {};
      return {
        profile: normalizeSiteVoiceProfile(sitesPayload[selectedSiteId]),
        parseError: null as string | null,
      };
    } catch {
      return {
        profile: EMPTY_SITE_VOICE_PROFILE,
        parseError: 'Raw JSON is invalid. Fix JSON to keep form and JSON in sync.',
      };
    }
  }, [draft, isMasterMode, profilesMode, selectedSiteId]);
  const lexiconInputValue = useMemo(
    () => stringifyLexiconInput(profileFormState.profile.lexiconReplacements),
    [profileFormState.profile.lexiconReplacements]
  );

  useEffect(() => {
    setSelectedSiteId(initialSiteId || sites[0]?.id || '');
  }, [initialSiteId, sites]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatus(null);
      try {
        if (isMasterMode) {
          const response = await fetch('/api/admin/shared-library/master-services');
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload?.message || 'Failed to load master services');
          }
          setDraft(payload.content || '');
          return;
        }

        const query = selectedSiteId
          ? `?siteId=${encodeURIComponent(selectedSiteId)}`
          : '';
        const response = await fetch(
          `/api/admin/shared-library/site-voice-profiles${query}`
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to load voice profiles');
        }
        setProfilesMode(payload.mode === 'scoped' ? 'scoped' : 'full');
        const ids = Array.isArray(payload.editableSiteIds)
          ? payload.editableSiteIds
          : [];
        setEditableSiteIds(ids);
        if (payload.siteId && payload.siteId !== selectedSiteId) {
          setSelectedSiteId(payload.siteId);
        }
        setDraft(payload.content || '');
      } catch (error: any) {
        setStatus(error?.message || 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isMasterMode, selectedSiteId]);

  const handleSave = async () => {
    try {
      setStatus(null);
      JSON.parse(draft);
      const endpoint = isMasterMode
        ? '/api/admin/shared-library/master-services'
        : '/api/admin/shared-library/site-voice-profiles';
      const body = isMasterMode
        ? { content: draft }
        : profilesMode === 'full'
          ? { content: draft }
          : { siteId: selectedSiteId, content: draft };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Save failed');
      }
      setStatus(payload?.message || 'Saved.');
    } catch (error: any) {
      setStatus(error?.message || 'Invalid JSON');
    }
  };

  const handlePreview = async () => {
    if (!selectedSiteId) return;
    try {
      setStatus(null);
      const body: Record<string, unknown> = { siteId: selectedSiteId };
      if (isMasterMode) {
        JSON.parse(draft);
        body.masterContent = draft;
      } else if (profilesMode === 'full') {
        JSON.parse(draft);
        body.profilesContent = draft;
      } else {
        JSON.parse(draft);
        body.profileContent = draft;
      }
      const response = await fetch('/api/admin/shared-library/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Preview failed');
      }
      setPreviewDraft(JSON.stringify(payload.items || [], null, 2));
      setStatus(`Generated ${payload.count || 0} services for ${selectedSiteLabel}.`);
    } catch (error: any) {
      setStatus(error?.message || 'Preview failed');
    }
  };

  const handleApply = async () => {
    if (!selectedSiteId) return;
    if (
      !window.confirm(
        `Apply generated services to ${selectedSiteId}/${locale}/pages/services.json?`
      )
    ) {
      return;
    }
    try {
      setStatus(null);
      const body: Record<string, unknown> = {
        siteId: selectedSiteId,
        locale,
      };
      if (isMasterMode) {
        JSON.parse(draft);
        body.masterContent = draft;
      } else if (profilesMode === 'full') {
        JSON.parse(draft);
        body.profilesContent = draft;
      } else {
        JSON.parse(draft);
        body.profileContent = draft;
      }
      const response = await fetch('/api/admin/shared-library/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Apply failed');
      }
      setStatus(payload?.message || 'Applied.');
    } catch (error: any) {
      setStatus(error?.message || 'Apply failed');
    }
  };

  const updateProfileDraft = (nextProfile: SiteVoiceProfileFormValue) => {
    if (isMasterMode) return;
    if (profilesMode === 'scoped') {
      setDraft(JSON.stringify(nextProfile, null, 2));
      return;
    }

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(draft || '{}') as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    const sitesPayload =
      parsed.sites && typeof parsed.sites === 'object'
        ? (parsed.sites as Record<string, unknown>)
        : {};

    const nextPayload: Record<string, unknown> = {
      ...parsed,
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      locale: typeof parsed.locale === 'string' ? parsed.locale : 'en',
      sites: {
        ...sitesPayload,
        [selectedSiteId]: nextProfile,
      },
    };

    setDraft(JSON.stringify(nextPayload, null, 2));
  };

  const canEdit = isMasterMode ? canEditMaster : canEditProfiles;
  const canRunActions =
    canWrite && !!selectedSiteId && (!isMasterMode || isSuperAdmin);
  const siteOptions =
    profilesMode === 'scoped'
      ? sites.filter((site) => editableSiteIds.includes(site.id))
      : sites;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Shared Library</h1>
        <p className="text-sm text-gray-600">
          Manage cross-site services wording and apply generated items to each site.
        </p>
        <div className="flex gap-2">
          <Link
            href="/admin/shared-library/master-services"
            className={`rounded-md border px-3 py-1.5 text-xs ${
              isMasterMode
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Master Services
          </Link>
          <Link
            href="/admin/shared-library/site-voice-profiles"
            className={`rounded-md border px-3 py-1.5 text-xs ${
              !isMasterMode
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Site Voice Profiles
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700 space-y-1">
            <span className="font-medium">Target site</span>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={selectedSiteId}
              onChange={(event) => setSelectedSiteId(event.target.value)}
              disabled={siteOptions.length === 0}
            >
              {siteOptions.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.id})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-700 space-y-1">
            <span className="font-medium">Locale (apply target)</span>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
            >
              <option value="en">en</option>
              <option value="zh">zh</option>
            </select>
          </label>
        </div>
        {status && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {status}
          </div>
        )}
        {!canWrite && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You have read-only access.
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {isMasterMode ? 'Master services JSON' : 'Site voice profiles JSON'}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit || isLoading}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Save
          </button>
        </div>
        {!isMasterMode && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
            <p className="text-xs text-gray-600">
              Use this form to edit the selected site profile. Raw JSON is still available below.
            </p>
            {profileFormState.parseError && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {profileFormState.parseError}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-gray-700 space-y-1">
                <span className="font-medium">Clinic name</span>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={profileFormState.profile.clinicName}
                  onChange={(event) =>
                    updateProfileDraft({
                      ...profileFormState.profile,
                      clinicName: event.target.value,
                    })
                  }
                  disabled={!canEdit || isLoading || !selectedSiteId}
                />
              </label>
              <label className="text-xs text-gray-700 space-y-1">
                <span className="font-medium">Tone descriptor</span>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={profileFormState.profile.toneDescriptor}
                  onChange={(event) =>
                    updateProfileDraft({
                      ...profileFormState.profile,
                      toneDescriptor: event.target.value,
                    })
                  }
                  disabled={!canEdit || isLoading || !selectedSiteId}
                />
              </label>
            </div>
            <label className="block text-xs text-gray-700 space-y-1">
              <span className="font-medium">Local context</span>
              <textarea
                className="w-full h-20 rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={profileFormState.profile.localContext}
                onChange={(event) =>
                  updateProfileDraft({
                    ...profileFormState.profile,
                    localContext: event.target.value,
                  })
                }
                disabled={!canEdit || isLoading || !selectedSiteId}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-gray-700 space-y-1">
                <span className="font-medium">Template: short description</span>
                <textarea
                  className="w-full h-20 rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                  value={profileFormState.profile.templates.shortDescription}
                  onChange={(event) =>
                    updateProfileDraft({
                      ...profileFormState.profile,
                      templates: {
                        ...profileFormState.profile.templates,
                        shortDescription: event.target.value,
                      },
                    })
                  }
                  disabled={!canEdit || isLoading || !selectedSiteId}
                />
              </label>
              <label className="text-xs text-gray-700 space-y-1">
                <span className="font-medium">Template: full description lead</span>
                <textarea
                  className="w-full h-20 rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                  value={profileFormState.profile.templates.fullDescriptionLead}
                  onChange={(event) =>
                    updateProfileDraft({
                      ...profileFormState.profile,
                      templates: {
                        ...profileFormState.profile.templates,
                        fullDescriptionLead: event.target.value,
                      },
                    })
                  }
                  disabled={!canEdit || isLoading || !selectedSiteId}
                />
              </label>
            </div>
            <label className="block text-xs text-gray-700 space-y-1">
              <span className="font-medium">Template: what to expect lead</span>
              <textarea
                className="w-full h-20 rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                value={profileFormState.profile.templates.whatToExpectLead}
                onChange={(event) =>
                  updateProfileDraft({
                    ...profileFormState.profile,
                    templates: {
                      ...profileFormState.profile.templates,
                      whatToExpectLead: event.target.value,
                    },
                  })
                }
                disabled={!canEdit || isLoading || !selectedSiteId}
              />
            </label>
            <label className="block text-xs text-gray-700 space-y-1">
              <span className="font-medium">Lexicon replacements</span>
              <textarea
                className="w-full h-24 rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                value={lexiconInputValue}
                onChange={(event) =>
                  updateProfileDraft({
                    ...profileFormState.profile,
                    lexiconReplacements: parseLexiconInput(event.target.value),
                  })
                }
                disabled={!canEdit || isLoading || !selectedSiteId}
                placeholder={'personalized=individualized\nsupports=helps support'}
              />
            </label>
          </div>
        )}
        <textarea
          className="w-full h-72 rounded-md border border-gray-200 px-3 py-2 text-xs font-mono"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!canEdit || isLoading}
          placeholder={isMasterMode ? '{ "modalities": [] }' : '{ "sites": {} }'}
        />
        {isMasterMode && !isSuperAdmin && (
          <p className="text-xs text-gray-500">
            Only platform admins can edit master services.
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Generated services preview</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!canRunActions || isLoading}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Generate Preview
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canRunActions || isLoading}
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              Apply to Site
            </button>
          </div>
        </div>
        <textarea
          className="w-full h-64 rounded-md border border-gray-200 px-3 py-2 text-xs font-mono"
          value={previewDraft}
          onChange={(event) => setPreviewDraft(event.target.value)}
          placeholder="Generated servicesList.items will appear here."
        />
      </div>
    </div>
  );
}
