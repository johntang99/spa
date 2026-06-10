'use client';

import { useEffect, useMemo, useState } from 'react';

interface SiteOption {
  id: string;
  name: string;
}

interface SharedLibraryManagerProps {
  sites: SiteOption[];
  selectedSiteId: string;
}

interface LoadPayload {
  master: Record<string, unknown>;
  profiles: Record<string, unknown>;
  selectedProfile: Record<string, unknown> | null;
  permissions?: {
    isSuperAdmin?: boolean;
    canWrite?: boolean;
  };
}

export function SharedLibraryManager({
  sites,
  selectedSiteId: initialSiteId,
}: SharedLibraryManagerProps) {
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId || sites[0]?.id || '');
  const [locale, setLocale] = useState('en');
  const [masterDraft, setMasterDraft] = useState('');
  const [profileDraft, setProfileDraft] = useState('');
  const [previewDraft, setPreviewDraft] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canWrite, setCanWrite] = useState(false);

  const selectedSiteLabel = useMemo(
    () => sites.find((site) => site.id === selectedSiteId)?.name || selectedSiteId,
    [sites, selectedSiteId]
  );

  const load = async (siteId: string) => {
    if (!siteId) return;
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/admin/shared-library/services?siteId=${encodeURIComponent(siteId)}`
      );
      const payload = (await response.json()) as LoadPayload;
      if (!response.ok) {
        setStatus((payload as any)?.message || 'Failed to load shared library');
        return;
      }
      setMasterDraft(JSON.stringify(payload.master ?? {}, null, 2));
      const selectedProfile = payload.selectedProfile ?? {};
      setProfileDraft(JSON.stringify(selectedProfile, null, 2));
      setIsSuperAdmin(Boolean(payload.permissions?.isSuperAdmin));
      setCanWrite(Boolean(payload.permissions?.canWrite));
    } catch (error: any) {
      setStatus(error?.message || 'Failed to load shared library');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedSiteId(initialSiteId || sites[0]?.id || '');
  }, [initialSiteId, sites]);

  useEffect(() => {
    if (!selectedSiteId) return;
    load(selectedSiteId);
  }, [selectedSiteId]);

  const postAction = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/admin/shared-library/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || 'Action failed');
    }
    return payload as Record<string, any>;
  };

  const handleSaveMaster = async () => {
    try {
      setStatus(null);
      const parsed = JSON.parse(masterDraft);
      const result = await postAction({ action: 'updateMaster', master: parsed });
      setStatus(result.message || 'Master services updated');
    } catch (error: any) {
      setStatus(error?.message || 'Invalid master JSON');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setStatus(null);
      const parsed = JSON.parse(profileDraft);
      const result = await postAction({
        action: 'updateSiteProfile',
        siteId: selectedSiteId,
        profile: parsed,
      });
      setStatus(result.message || 'Site profile updated');
    } catch (error: any) {
      setStatus(error?.message || 'Invalid profile JSON');
    }
  };

  const handlePreview = async () => {
    try {
      setStatus(null);
      const result = await postAction({
        action: 'preview',
        siteId: selectedSiteId,
        locale,
      });
      setPreviewDraft(JSON.stringify(result.generatedItems ?? [], null, 2));
      setStatus(`Preview generated for ${selectedSiteLabel}`);
    } catch (error: any) {
      setStatus(error?.message || 'Preview failed');
    }
  };

  const handleApply = async () => {
    if (!selectedSiteId) return;
    const ok = window.confirm(
      `Apply generated service wording to ${selectedSiteId}/${locale}/pages/services.json?`
    );
    if (!ok) return;
    try {
      setStatus(null);
      const result = await postAction({
        action: 'applyToSite',
        siteId: selectedSiteId,
        locale,
      });
      setStatus(result.message || 'Applied to site services.json');
    } catch (error: any) {
      setStatus(error?.message || 'Apply failed');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Shared Library</h1>
        <p className="text-sm text-gray-600">
          Manage canonical services and per-site voice profiles, then preview/apply generated
          services content.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700 space-y-1">
            <span className="font-medium">Target site</span>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={selectedSiteId}
              onChange={(event) => setSelectedSiteId(event.target.value)}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.id})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-700 space-y-1">
            <span className="font-medium">Locale</span>
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
            You have read-only access for shared library actions.
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Master services (global)</h2>
          <button
            type="button"
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={handleSaveMaster}
            disabled={!isSuperAdmin || isLoading}
          >
            Save master
          </button>
        </div>
        <textarea
          className="w-full h-64 rounded-md border border-gray-200 px-3 py-2 text-xs font-mono"
          value={masterDraft}
          onChange={(event) => setMasterDraft(event.target.value)}
          disabled={!isSuperAdmin || isLoading}
        />
        {!isSuperAdmin && (
          <p className="text-xs text-gray-500">Only platform admins can edit master services.</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Site voice profile ({selectedSiteLabel})
          </h2>
          <button
            type="button"
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={handleSaveProfile}
            disabled={!canWrite || isLoading || !selectedSiteId}
          >
            Save profile
          </button>
        </div>
        <textarea
          className="w-full h-56 rounded-md border border-gray-200 px-3 py-2 text-xs font-mono"
          value={profileDraft}
          onChange={(event) => setProfileDraft(event.target.value)}
          disabled={!canWrite || isLoading}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Generated preview</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              onClick={handlePreview}
              disabled={!canWrite || isLoading || !selectedSiteId}
            >
              Generate preview
            </button>
            <button
              type="button"
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
              onClick={handleApply}
              disabled={!canWrite || isLoading || !selectedSiteId}
            >
              Apply to site
            </button>
          </div>
        </div>
        <textarea
          className="w-full h-64 rounded-md border border-gray-200 px-3 py-2 text-xs font-mono"
          value={previewDraft}
          onChange={(event) => setPreviewDraft(event.target.value)}
          placeholder="Click Generate preview to inspect generated servicesList.items JSON."
        />
      </div>
    </div>
  );
}
