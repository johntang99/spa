import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { isSuperAdmin } from '@/lib/admin/permissions';

interface Step3RunPayload {
  sites?: string[];
  fix?: boolean;
  skipMigration?: boolean;
  skipNormalize?: boolean;
  failOnBroken?: boolean;
  failOnVariant?: boolean;
}

function cleanSites(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

async function runStep3(projectRoot: string, args: string[]) {
  return new Promise<{
    exitCode: number | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    const child = spawn('node', args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

function pickReportPath(text: string, label: 'JSON report' | 'MD report'): string | null {
  const regex = new RegExp(`${label}:\\s*(.+)`);
  const match = text.match(regex);
  if (!match?.[1]) return null;
  return match[1].trim();
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!isSuperAdmin(session.user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: Step3RunPayload;
  try {
    payload = (await request.json()) as Step3RunPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sites = cleanSites(payload.sites);
  if (!sites.length) {
    return Response.json({ error: 'Please provide at least one site ID.' }, { status: 400 });
  }

  const args = ['scripts/step3-agent.mjs', '--sites', sites.join(',')];
  if (payload.fix) args.push('--fix');
  if (payload.skipMigration) args.push('--skip-migration');
  if (payload.skipNormalize) args.push('--skip-normalize');
  if (payload.failOnBroken) args.push('--fail-on-broken');
  if (payload.failOnVariant) args.push('--fail-on-variant');

  const projectRoot = process.cwd();

  try {
    const runResult = await runStep3(projectRoot, args);
    const mergedOutput = `${runResult.stdout}\n${runResult.stderr}`;
    const reportJsonPath = pickReportPath(mergedOutput, 'JSON report');
    const reportMdPath = pickReportPath(mergedOutput, 'MD report');

    let report: unknown = null;
    if (reportJsonPath) {
      const absJsonPath = path.isAbsolute(reportJsonPath)
        ? reportJsonPath
        : path.join(projectRoot, reportJsonPath);
      try {
        const raw = await fs.readFile(absJsonPath, 'utf-8');
        report = JSON.parse(raw);
      } catch {
        report = null;
      }
    }

    return Response.json({
      ok: runResult.exitCode === 0,
      exitCode: runResult.exitCode,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      reportJsonPath,
      reportMdPath,
      report,
    });
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        error: error?.message || 'Step 3 run failed',
      },
      { status: 500 }
    );
  }
}
