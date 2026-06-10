'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, Input } from '@/components/ui';

interface SiteOption {
  id: string;
  name: string;
  enabled: boolean;
}

interface Step3ReportSite {
  siteId: string;
  contentEntries: number;
  mediaAssets: number;
  variantIssuesCount: number;
  urlReachability?: {
    checked: number;
    broken: number;
  };
}

interface Step3Report {
  generatedAt: string;
  mode: string;
  targetHost: string;
  bucket?: string;
  sites: Step3ReportSite[];
}

interface Step3RunResponse {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  reportJsonPath?: string | null;
  reportMdPath?: string | null;
  report?: Step3Report | null;
  error?: string;
}

export function Step3AgentRunner({ sites }: { sites: SiteOption[] }) {
  const defaultSites = useMemo(
    () => sites.filter((site) => site.enabled).map((site) => site.id),
    [sites]
  );
  const [siteInput, setSiteInput] = useState(defaultSites.join(','));
  const [fix, setFix] = useState(false);
  const [skipMigration, setSkipMigration] = useState(false);
  const [skipNormalize, setSkipNormalize] = useState(false);
  const [failOnBroken, setFailOnBroken] = useState(false);
  const [failOnVariant, setFailOnVariant] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Step3RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSites = siteInput
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const handleRun = async () => {
    if (selectedSites.length === 0) {
      setError('Please provide at least one site ID.');
      return;
    }

    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/admin/qa/step3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sites: selectedSites,
          fix,
          skipMigration,
          skipNormalize,
          failOnBroken,
          failOnVariant,
        }),
      });
      const payload = (await response.json()) as Step3RunResponse;
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to run Step 3 agent');
      }
      setResult(payload);
      if (!payload.ok) {
        setError('Step 3 finished with gate/script errors. Check output below.');
      }
    } catch (runError: any) {
      setError(runError?.message || 'Failed to run Step 3 agent');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <Input
          label="Site IDs (comma-separated)"
          fullWidth
          value={siteInput}
          onChange={(event) => setSiteInput(event.target.value)}
          placeholder="dr-huang-clinic,another-site-id"
          helperText="The script uses --sites with these values."
        />
        <div className="flex flex-wrap gap-2">
          {sites.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => {
                const current = new Set(selectedSites);
                if (current.has(site.id)) {
                  current.delete(site.id);
                } else {
                  current.add(site.id);
                }
                setSiteInput(Array.from(current).join(','));
              }}
              className={`rounded-full border px-3 py-1 text-xs ${
                selectedSites.includes(site.id)
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
              title={site.name}
            >
              {site.id}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Checkbox
            label="Run with --fix"
            checked={fix}
            onChange={(event) => setFix(event.target.checked)}
          />
          <Checkbox
            label="Run with --skip-migration"
            checked={skipMigration}
            onChange={(event) => setSkipMigration(event.target.checked)}
          />
          <Checkbox
            label="Run with --skip-normalize"
            checked={skipNormalize}
            onChange={(event) => setSkipNormalize(event.target.checked)}
          />
          <Checkbox
            label="Gate: --fail-on-broken"
            checked={failOnBroken}
            onChange={(event) => setFailOnBroken(event.target.checked)}
          />
          <Checkbox
            label="Gate: --fail-on-variant"
            checked={failOnVariant}
            onChange={(event) => setFailOnVariant(event.target.checked)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" onClick={handleRun} loading={running} disabled={running}>
            {running ? 'Running Step 3…' : 'Run Step 3 Agent'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={running}
            onClick={() => setSiteInput(defaultSites.join(','))}
          >
            Use Enabled Sites
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">Result</h2>
            <div className="mt-3 space-y-1 text-sm text-gray-700">
              <p>Status: {result.ok ? 'Success' : 'Completed with issues'}</p>
              <p>Exit code: {String(result.exitCode)}</p>
              {result.reportJsonPath ? <p>JSON report: {result.reportJsonPath}</p> : null}
              {result.reportMdPath ? <p>Markdown report: {result.reportMdPath}</p> : null}
            </div>
          </div>

          {result.report ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900">Report Summary</h2>
              <p className="mt-1 text-sm text-gray-600">
                Generated {new Date(result.report.generatedAt).toLocaleString()} on{' '}
                {result.report.targetHost}
              </p>
              <div className="mt-4 space-y-3">
                {result.report.sites.map((site) => (
                  <div key={site.siteId} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-900">{site.siteId}</p>
                    <p className="text-gray-700">
                      entries {site.contentEntries} | media {site.mediaAssets} | variant issues{' '}
                      {site.variantIssuesCount} | broken URLs {site.urlReachability?.broken || 0}/
                      {site.urlReachability?.checked || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">Script Output</h2>
            <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
              {`${result.stdout || ''}${result.stderr ? `\n${result.stderr}` : ''}`.trim() || '(No output)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
