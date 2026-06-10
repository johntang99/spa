'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/types';

type RewriteMode = 'conservative' | 'balanced' | 'aggressive';
type RewriteScope = 'services' | 'conditions' | 'custom';

interface RewriteStudioSite {
  id: string;
  name: string;
  supportedLocales: Locale[];
  defaultLocale: Locale;
}

interface RewriteStudioProps {
  sites: RewriteStudioSite[];
}

interface RewriteJob {
  id: string;
  site_id: string;
  locale: string;
  scope: RewriteScope;
  mode: RewriteMode;
  status: 'queued' | 'running' | 'needs_review' | 'completed' | 'failed';
  provider: string;
  created_at: string;
}

interface RewriteItem {
  id: string;
  path: string;
  field_path: string;
  source_text: string;
  rewritten_text: string | null;
  validation_passed: boolean;
  validation: Record<string, unknown>;
  approved: boolean | null;
  applied: boolean;
  risk_flags: string[];
}

const DEFAULT_PATHS: Record<Exclude<RewriteScope, 'custom'>, string[]> = {
  services: ['pages/services.json'],
  conditions: ['pages/conditions.json'],
};

const MODE_HELP: Record<RewriteMode, string> = {
  conservative: 'Small wording edits, strongest semantic lock.',
  balanced: 'Moderate variation, keeps meaning and structure stable.',
  aggressive: 'Largest variation while preserving intent and safety rules.',
};

const CRITICAL_RISK_FLAGS = new Set(['forbidden_terms_present', 'empty_rewrite']);

export function RewriteStudio({ sites }: RewriteStudioProps) {
  const [scope, setScope] = useState<RewriteScope>('services');
  const [mode, setMode] = useState<RewriteMode>('balanced');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId),
    [sites, selectedSiteId]
  );
  const [locale, setLocale] = useState<Locale>(selectedSite?.defaultLocale || 'en');
  const [customPaths, setCustomPaths] = useState('pages/services.json\npages/conditions.json');
  const [requirements, setRequirements] = useState(
    [
      '- Keep meaning unchanged',
      '- No disease cure claims',
      '- Keep required terms: consultation, personalized',
      '- Keep reading level around grade 8',
    ].join('\n')
  );
  const [jobs, setJobs] = useState<RewriteJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isRunningJobId, setIsRunningJobId] = useState<string | null>(null);
  const [isApplyingJobId, setIsApplyingJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobItems, setJobItems] = useState<RewriteItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSavingItemId, setIsSavingItemId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const targetPaths =
    scope === 'custom'
      ? customPaths
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : DEFAULT_PATHS[scope];

  const availableLocales = selectedSite?.supportedLocales || ['en'];

  const estimatedItems = targetPaths.length * 18;
  const lastRunStatus = jobs[0]?.status || 'idle';

  const loadJobs = useCallback(async () => {
    if (!selectedSiteId) return;
    setIsLoadingJobs(true);
    try {
      const params = new URLSearchParams({
        siteId: selectedSiteId,
        locale,
        limit: '20',
      });
      const response = await fetch(`/api/admin/rewrite/jobs?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load jobs');
      }
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to load jobs.' });
    } finally {
      setIsLoadingJobs(false);
    }
  }, [selectedSiteId, locale]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const loadJobItems = useCallback(async (jobId: string) => {
    setIsLoadingItems(true);
    setSelectedJobId(jobId);
    try {
      const response = await fetch(`/api/admin/rewrite/jobs/${jobId}/items?limit=500`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load rewrite items');
      }
      setJobItems(Array.isArray(data?.items) ? data.items : []);
      setSelectedItemIds([]);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to load rewrite items.' });
      setJobItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const createJob = async () => {
    if (!selectedSiteId) {
      setFeedback({ type: 'error', message: 'Please select a site first.' });
      return;
    }
    if (targetPaths.length === 0) {
      setFeedback({ type: 'error', message: 'Please provide at least one target path.' });
      return;
    }

    setIsCreatingJob(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/rewrite/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSiteId,
          locale,
          scope,
          mode,
          targetPaths,
          requirements: {
            raw: requirements,
            lines: requirements
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean),
          },
          provider: 'claude',
          sourceOfTruth: 'db',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to create rewrite job');
      }

      setFeedback({ type: 'success', message: `Rewrite job created: ${data.job.id}` });
      await loadJobs();
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to create rewrite job.' });
    } finally {
      setIsCreatingJob(false);
    }
  };

  const runJob = async (jobId: string) => {
    setIsRunningJobId(jobId);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/rewrite/jobs/${jobId}/run`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to run rewrite job');
      }
      setFeedback({
        type: 'success',
        message: `Run completed. Generated ${data.generatedItems} items.`,
      });
      await loadJobs();
      await loadJobItems(jobId);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to run rewrite job.' });
    } finally {
      setIsRunningJobId(null);
    }
  };

  const setItemDecision = async (jobId: string, itemId: string, approved: boolean) => {
    setIsSavingItemId(itemId);
    try {
      const response = await fetch(`/api/admin/rewrite/jobs/${jobId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update item');
      }
      setJobItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, approved: data.item?.approved ?? approved } : item
        )
      );
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to update item decision.' });
    } finally {
      setIsSavingItemId(null);
    }
  };

  const bulkApproveSafe = async () => {
    if (!selectedJobId) return;
    const safeItems = jobItems.filter(
      (item) =>
        item.approved !== true &&
        typeof item.rewritten_text === 'string' &&
        item.rewritten_text.trim().length > 0 &&
        !item.risk_flags.some((flag) => CRITICAL_RISK_FLAGS.has(flag))
    );
    for (const item of safeItems) {
      await setItemDecision(selectedJobId, item.id, true);
    }
    setFeedback({
      type: 'success',
      message: `Bulk-approved ${safeItems.length} safe item(s).`,
    });
  };

  const regenerateSelected = async () => {
    if (!selectedJobId || selectedItemIds.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one item to regenerate.' });
      return;
    }
    setIsRegenerating(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/rewrite/jobs/${selectedJobId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedItemIds }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to regenerate selected items');
      }
      setFeedback({
        type: 'success',
        message: `Regenerated ${data.regeneratedItems} item(s). Review before approving.`,
      });
      await loadJobItems(selectedJobId);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to regenerate selected items.' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const applyJob = async (jobId: string) => {
    setIsApplyingJobId(jobId);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/rewrite/jobs/${jobId}/apply`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to apply rewrite job');
      }
      setFeedback({
        type: 'success',
        message: `Applied ${data.appliedItems} items across ${data.updatedPaths} file(s).`,
      });
      await loadJobs();
      await loadJobItems(jobId);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to apply rewrite job.' });
    } finally {
      setIsApplyingJobId(null);
    }
  };

  const isCriticalRisk = (item: RewriteItem) =>
    item.risk_flags.some((flag) => CRITICAL_RISK_FLAGS.has(flag));
  const isWarningRisk = (item: RewriteItem) => item.risk_flags.length > 0 && !isCriticalRisk(item);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || null;
  const reviewedCount = jobItems.filter((item) => item.approved !== null).length;
  const approvedCount = jobItems.filter((item) => item.approved === true).length;
  const appliedCount = jobItems.filter((item) => item.applied === true).length;
  const criticalRiskCount = jobItems.filter((item) => isCriticalRisk(item)).length;
  const warningRiskCount = jobItems.filter((item) => isWarningRisk(item)).length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-gray-900">Content Rewrite Studio</h1>
        <p className="mt-1 text-sm text-gray-600">
          Draft rewrite jobs for services, conditions, or custom JSON targets.
          This first pass includes job setup and review placeholders.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">1) Job Setup</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Site</span>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  value={selectedSiteId}
                  onChange={(event) => {
                    const nextSiteId = event.target.value;
                    setSelectedSiteId(nextSiteId);
                    const nextSite = sites.find((site) => site.id === nextSiteId);
                    setLocale(nextSite?.defaultLocale || 'en');
                  }}
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Locale</span>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as Locale)}
                >
                  {availableLocales.map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Scope</span>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  value={scope}
                  onChange={(event) => setScope(event.target.value as RewriteScope)}
                >
                  <option value="services">Services</option>
                  <option value="conditions">Conditions</option>
                  <option value="custom">Custom Paths</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Rewrite Mode</span>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as RewriteMode)}
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </label>
            </div>

            <p className="mt-2 text-xs text-gray-500">{MODE_HELP[mode]}</p>

            <div className="mt-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Target Paths</span>
                {scope === 'custom' ? (
                  <textarea
                    className="h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    value={customPaths}
                    onChange={(event) => setCustomPaths(event.target.value)}
                    placeholder="One JSON path per line"
                  />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {targetPaths.join(', ')}
                  </div>
                )}
              </label>
            </div>

            <div className="mt-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Requirements</span>
                <textarea
                  className="h-36 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Stored as structured requirements in `rewrite_jobs.requirements`.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={createJob}
                disabled={isCreatingJob}
              >
                {isCreatingJob ? 'Creating...' : 'Create Rewrite Job'}
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Save as Draft Preset
              </button>
            </div>
            {feedback ? (
              <p className={`mt-3 text-sm ${feedback.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                {feedback.message}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">2) Recent Jobs</h2>
            <p className="mt-1 text-sm text-gray-600">
              Run jobs, inspect generated items, approve/reject rows, and apply approved rewrites.
            </p>
            {isLoadingJobs ? (
              <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                No jobs yet for this site/locale.
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Created</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Scope</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Mode</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Provider</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-3 py-2 text-gray-700">
                          {new Date(job.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{job.scope}</td>
                        <td className="px-3 py-2 text-gray-700">{job.mode}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {job.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{job.provider}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              onClick={() => void loadJobItems(job.id)}
                            >
                              Items
                            </button>
                            <button
                              type="button"
                              className="rounded border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                              onClick={() => void runJob(job.id)}
                              disabled={isRunningJobId === job.id}
                            >
                              {isRunningJobId === job.id ? 'Running...' : 'Run'}
                            </button>
                            <button
                              type="button"
                              className="rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              onClick={() => void applyJob(job.id)}
                              disabled={isApplyingJobId === job.id}
                            >
                              {isApplyingJobId === job.id ? 'Applying...' : 'Apply'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">3) Review Queue</h2>
            <p className="mt-1 text-sm text-gray-600">
              {selectedJob
                ? `Selected job: ${selectedJob.id.slice(0, 8)}... (${selectedJob.status})`
                : 'Select a job and click "Items" to review generated rewrites.'}
            </p>

            {selectedJob ? (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                <span>Items: {jobItems.length}</span>
                <span>Reviewed: {reviewedCount}</span>
                <span>Approved: {approvedCount}</span>
                <span>Applied: {appliedCount}</span>
                <span>Critical risk: {criticalRiskCount}</span>
                <span>Warning risk: {warningRiskCount}</span>
              </div>
            ) : null}

            {selectedJob ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => void bulkApproveSafe()}
                >
                  Bulk Approve Safe
                </button>
                <button
                  type="button"
                  className="rounded border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                  onClick={() => void regenerateSelected()}
                  disabled={isRegenerating || selectedItemIds.length === 0}
                >
                  {isRegenerating ? 'Regenerating...' : `Regenerate Selected (${selectedItemIds.length})`}
                </button>
              </div>
            ) : null}

            {isLoadingItems ? (
              <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                Loading items...
              </div>
            ) : jobItems.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                No items loaded.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {jobItems.slice(0, 80).map((item) => (
                  <article key={item.id} className="rounded-md border border-gray-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-gray-700">
                        <label className="mr-2 inline-flex cursor-pointer items-center gap-1 text-[11px] text-gray-500">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={(event) => {
                              setSelectedItemIds((prev) =>
                                event.target.checked
                                  ? [...new Set([...prev, item.id])]
                                  : prev.filter((id) => id !== item.id)
                              );
                            }}
                          />
                          pick
                        </label>
                        {item.path} <span className="text-gray-400">/</span> {item.field_path}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                          {item.applied ? 'applied' : item.approved === true ? 'approved' : item.approved === false ? 'rejected' : 'pending'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            item.validation_passed
                              ? 'bg-emerald-100 text-emerald-700'
                              : isCriticalRisk(item)
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.validation_passed
                            ? 'valid'
                            : isCriticalRisk(item)
                              ? 'critical review'
                              : 'review warning'}
                        </span>
                        {item.risk_flags.length > 0 ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${
                              isCriticalRisk(item)
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isCriticalRisk(item) ? 'critical' : 'warning'}: {item.risk_flags.slice(0, 2).join(', ')}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                            low risk
                          </span>
                        )}
                        {item.approved === true && item.applied !== true && item.risk_flags.length > 0 ? (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-700">
                            approved override
                          </span>
                        ) : null}
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                          change: {typeof item.validation?.changeRatio === 'number' ? Math.round(item.validation.changeRatio * 100) : 0}%
                        </span>
                        <button
                          type="button"
                          className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                          disabled={isSavingItemId === item.id}
                          onClick={() => {
                            if (!selectedJobId) return;
                            void setItemDecision(selectedJobId, item.id, true);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          disabled={isSavingItemId === item.id}
                          onClick={() => {
                            if (!selectedJobId) return;
                            void setItemDecision(selectedJobId, item.id, false);
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
                        <p className="mb-1 font-semibold text-gray-600">Source</p>
                        <p className="line-clamp-4 whitespace-pre-wrap">{item.source_text}</p>
                      </div>
                      <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-gray-700">
                        <p className="mb-1 font-semibold text-blue-700">Rewrite</p>
                        <p className="line-clamp-4 whitespace-pre-wrap">{item.rewritten_text || ''}</p>
                      </div>
                    </div>
                  </article>
                ))}
                {jobItems.length > 80 ? (
                  <p className="text-xs text-gray-500">
                    Showing first 80 items. Use API for full pagination in next iteration.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Run Summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Site</dt>
                <dd className="font-medium text-gray-900">{selectedSiteId || '-'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Locale</dt>
                <dd className="font-medium text-gray-900">{locale.toUpperCase()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Scope</dt>
                <dd className="font-medium text-gray-900">{scope}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Targets</dt>
                <dd className="font-medium text-gray-900">{targetPaths.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Estimated items</dt>
                <dd className="font-medium text-gray-900">~{estimatedItems}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Last status</dt>
                <dd className="font-medium text-gray-900">{lastRunStatus}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-900">Safety Notes</h3>
            <ul className="mt-2 space-y-1 text-xs text-amber-900">
              <li>Apply only writes approved, unapplied items.</li>
              <li>Every decision/apply is audit logged.</li>
              <li>Use small batches first for new sites.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
