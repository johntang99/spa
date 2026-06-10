import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { fetchContentEntry, upsertContentEntry } from '@/lib/contentDb';
import { canWriteContent, requireSiteAccess } from '@/lib/admin/permissions';
import { locales } from '@/lib/i18n';
import { writeAuditLog } from '@/lib/admin/audit';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const KNOWN_ROOT_ENTRIES = new Set(['pages', 'blog', 'blog-scheduled', '_history']);

async function readJson(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

interface ImportCandidate {
  locale: string;
  path: string;
  data: unknown;
  sourceFilePath: string;
  sourceMtimeMs: number;
}

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function shouldEnforceProdImportGuardrails(): boolean {
  return process.env.NODE_ENV === 'production';
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

async function collectImportCandidates(siteId: string, locale: string): Promise<ImportCandidate[]> {
  const candidates: ImportCandidate[] = [];
  const localeRoot = path.join(CONTENT_DIR, siteId, locale);

  const addCandidate = async (targetLocale: string, contentPath: string, filePath: string) => {
    const [data, stat] = await Promise.all([readJson(filePath), fs.stat(filePath)]);
    candidates.push({
      locale: targetLocale,
      path: contentPath,
      data,
      sourceFilePath: filePath,
      sourceMtimeMs: stat.mtimeMs,
    });
  };

  // Root locale JSON files
  try {
    const rootEntries = await fs.readdir(localeRoot);
    for (const entry of rootEntries) {
      const fullPath = path.join(localeRoot, entry);
      const stat = await fs.stat(fullPath);
      if (!stat.isFile()) continue;
      if (entry === 'theme.json') continue;

      if (entry.endsWith('.json')) {
        await addCandidate(locale, entry, fullPath);
        continue;
      }

      // SEO landing pages use root-level paths without extension
      // e.g. acupuncture-great-neck-ny
      if (entry.includes('.') || KNOWN_ROOT_ENTRIES.has(entry)) continue;
      try {
        await addCandidate(locale, entry, fullPath);
      } catch {
        // skip non-JSON root files
      }
    }
  } catch {
    // ignore missing locale root
  }

  // Pages
  const pagesDir = path.join(localeRoot, 'pages');
  try {
    const pageFiles = await fs.readdir(pagesDir);
    for (const file of pageFiles.filter((item) => item.endsWith('.json'))) {
      await addCandidate(locale, `pages/${file}`, path.join(pagesDir, file));
    }
  } catch {
    // ignore missing pages dir
  }

  // Blog posts
  const blogDir = path.join(localeRoot, 'blog');
  try {
    const blogFiles = await fs.readdir(blogDir);
    for (const file of blogFiles.filter((item) => item.endsWith('.json'))) {
      await addCandidate(locale, `blog/${file}`, path.join(blogDir, file));
    }
  } catch {
    // ignore missing blog dir
  }

  // Theme (site scope) - only check the requested locale;
  // actual import will sync to all locales via upsert
  const themePath = path.join(CONTENT_DIR, siteId, 'theme.json');
  try {
    const [themeData, themeStat] = await Promise.all([readJson(themePath), fs.stat(themePath)]);
    candidates.push({
      locale,
      path: 'theme.json',
      data: themeData,
      sourceFilePath: themePath,
      sourceMtimeMs: themeStat.mtimeMs,
    });
  } catch {
    // ignore missing theme
  }

  return candidates;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = payload.siteId as string | undefined;
  const locale = payload.locale as string | undefined;
  const mode = payload.mode === 'overwrite' ? 'overwrite' : 'missing';
  const dryRun = Boolean(payload.dryRun);
  const force = Boolean(payload.force);
  const includePaths = Array.isArray(payload.includePaths)
    ? payload.includePaths.filter((value: unknown): value is string => typeof value === 'string')
    : [];
  const includePathSet = includePaths.length > 0 ? new Set(includePaths) : null;
  const guardToken = typeof payload.guardToken === 'string' ? payload.guardToken.trim() : '';
  const source = typeof payload.source === 'string' ? payload.source.trim() : '';

  if (!siteId || !locale) {
    return NextResponse.json(
      { message: 'siteId and locale are required' },
      { status: 400 }
    );
  }

  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!canWriteContent(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  if (!dryRun && mode !== 'overwrite' && includePaths.length === 0) {
    return NextResponse.json(
      {
        message:
          'Guardrail: locale-wide import is blocked for missing mode. Use scoped includePaths (changed files only).',
        code: 'SCOPED_IMPORT_REQUIRED',
      },
      { status: 400 }
    );
  }

  if (!dryRun && mode === 'overwrite' && source !== 'admin-overwrite-button') {
    return NextResponse.json(
      {
        message:
          'Guardrail: locale-wide overwrite import is only allowed from the Overwrite Import button flow.',
        code: 'OVERWRITE_SOURCE_REQUIRED',
      },
      { status: 403 }
    );
  }

  if (shouldEnforceProdImportGuardrails() && !dryRun) {
    if (mode === 'overwrite') {
      const overwriteEnabled = parseBooleanEnv(process.env.ALLOW_PROD_OVERWRITE_IMPORT) === true;
      const expectedToken = (process.env.PROD_IMPORT_GUARD_TOKEN || '').trim();
      const tokenRequired = expectedToken.length > 0;
      const tokenValid = !tokenRequired ? false : guardToken === expectedToken;
      if (!overwriteEnabled || !tokenValid) {
        return NextResponse.json(
          {
            message:
              'Production guardrail: overwrite import is blocked unless break-glass env + valid guard token are provided.',
            code: 'PROD_OVERWRITE_BLOCKED',
          },
          { status: 403 }
        );
      }
    }
  }

  const allCandidates = await collectImportCandidates(siteId, locale);
  const candidates =
    includePathSet === null
      ? allCandidates
      : allCandidates.filter((candidate) => includePathSet.has(candidate.path));
  const conflicts: Array<{
    locale: string;
    path: string;
    dbUpdatedAt: string;
    localFile: string;
    localMtime: string;
  }> = [];

  let toCreate = 0;
  let toUpdate = 0;
  let unchanged = 0;
  let skipped = 0;
  let wouldImport = 0;
  const toCreatePaths: string[] = [];
  const toUpdatePaths: string[] = [];

  const existingByKey = new Map<string, Awaited<ReturnType<typeof fetchContentEntry>>>();
  const analysisBatchSize = 30;
  for (let i = 0; i < candidates.length; i += analysisBatchSize) {
    const batch = candidates.slice(i, i + analysisBatchSize);
    const batchExisting = await Promise.all(
      batch.map((candidate) => fetchContentEntry(siteId, candidate.locale, candidate.path))
    );
    batch.forEach((candidate, index) => {
      const key = `${candidate.locale}::${candidate.path}`;
      existingByKey.set(key, batchExisting[index]);
    });
  }

  for (const candidate of candidates) {
    const key = `${candidate.locale}::${candidate.path}`;
    const existing = existingByKey.get(key);

    if (!existing?.data) {
      toCreate += 1;
      wouldImport += 1;
      toCreatePaths.push(`${candidate.locale}:${candidate.path}`);
      continue;
    }

    if (deepEqual(existing.data, candidate.data)) {
      unchanged += 1;
      if (mode === 'missing') {
        skipped += 1;
      }
      continue;
    }

    const dbUpdatedAtMs = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
    if (
      mode === 'overwrite' &&
      Number.isFinite(dbUpdatedAtMs) &&
      dbUpdatedAtMs > candidate.sourceMtimeMs
    ) {
      conflicts.push({
        locale: candidate.locale,
        path: candidate.path,
        dbUpdatedAt: existing.updated_at,
        localFile: candidate.sourceFilePath,
        localMtime: new Date(candidate.sourceMtimeMs).toISOString(),
      });
      continue;
    }

    toUpdate += 1;
    wouldImport += 1;
    toUpdatePaths.push(`${candidate.locale}:${candidate.path}`);
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      mode,
      totalCandidates: candidates.length,
      toCreate,
      toUpdate,
      unchanged,
      skipped,
      wouldImport,
      toCreatePaths,
      toUpdatePaths,
      conflicts,
      message:
        mode === 'overwrite'
          ? `Dry-run: ${toCreate} create, ${toUpdate} update, ${unchanged} unchanged, ${conflicts.length} conflicts.`
          : `Dry-run: ${toCreate} create, ${unchanged} existing.`,
    });
  }

  if (mode === 'overwrite' && conflicts.length > 0 && !force) {
    await writeAuditLog({
      actor: session.user,
      action: 'content_import_overwrite_blocked',
      siteId,
      metadata: {
        locale,
        conflicts: conflicts.length,
      },
    });
    return NextResponse.json(
      {
        message:
          `Abort overwrite: ${conflicts.length} DB entries are newer than local files. ` +
          `Run dry-run and review conflicts, or pass force=true to proceed.`,
        conflicts,
      },
      { status: 409 }
    );
  }

  let imported = 0;
  const importQueue: typeof candidates = [];
  for (const candidate of candidates) {
    const key = `${candidate.locale}::${candidate.path}`;
    const existing = existingByKey.get(key);

    if (mode === 'missing' && existing?.data) {
      skipped += 1;
      continue;
    }

    if (
      mode === 'overwrite' &&
      existing?.data &&
      deepEqual(existing.data, candidate.data)
    ) {
      continue;
    }

    const dbUpdatedAtMs = existing?.updated_at ? new Date(existing.updated_at).getTime() : 0;
    if (
      mode === 'overwrite' &&
      !force &&
      existing?.data &&
      Number.isFinite(dbUpdatedAtMs) &&
      dbUpdatedAtMs > candidate.sourceMtimeMs
    ) {
      continue;
    }
    importQueue.push(candidate);
  }

  const writeBatchSize = 30;
  for (let i = 0; i < importQueue.length; i += writeBatchSize) {
    const batch = importQueue.slice(i, i + writeBatchSize);
    await Promise.all(
      batch.map(async (candidate) => {
        await upsertContentEntry({
          siteId,
          locale: candidate.locale,
          path: candidate.path,
          data: candidate.data,
          updatedBy: session.user.email,
        });
        // Sync theme to all locales (site-scoped)
        if (candidate.path === 'theme.json') {
          await Promise.all(
            locales
              .filter((l) => l !== candidate.locale)
              .map((otherLocale) =>
                upsertContentEntry({
                  siteId,
                  locale: otherLocale,
                  path: 'theme.json',
                  data: candidate.data,
                  updatedBy: session.user.email,
                })
              )
          );
        }
      })
    );
    imported += batch.length;
  }

  await writeAuditLog({
    actor: session.user,
    action: 'content_import_completed',
    siteId,
    metadata: {
      locale,
      mode,
      imported,
      skipped,
      conflicts: mode === 'overwrite' ? conflicts.length : 0,
      durationMs: Date.now() - startedAt,
    },
  });

  return NextResponse.json({
    success: true,
    dryRun: false,
    imported,
    skipped,
    conflicts: mode === 'overwrite' ? conflicts.length : 0,
    message:
      mode === 'overwrite'
        ? `Imported ${imported} items from JSON (overwrite mode).`
        : skipped
          ? `Imported ${imported} items. Skipped ${skipped} existing DB entries.`
          : `Imported ${imported} items from JSON.`,
  });
}
