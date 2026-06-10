import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canWriteContent, requireSiteAccess } from '@/lib/admin/permissions';
import {
  canUseContentDb,
  deleteContentEntry,
  listContentEntries,
  upsertContentEntry,
} from '@/lib/contentDb';

const CONTENT_DIR = path.join(process.cwd(), 'content');

type BlogLike = {
  slug?: string;
  title?: string;
  translationGroup?: string;
  status?: 'draft' | 'scheduled' | 'published';
  publishAt?: string;
  publishDate?: string;
};

function toTranslationKey(pathValue: string, data: BlogLike): string {
  if (typeof data.translationGroup === 'string' && data.translationGroup.trim()) {
    return data.translationGroup.trim();
  }
  if (typeof data.slug === 'string' && data.slug.trim()) {
    return data.slug.trim();
  }
  return pathValue
    .replace(/^blog-scheduled\//, '')
    .replace(/^blog\//, '')
    .replace(/\.json$/, '');
}

function toIsoAtMidMorning(dateText: string): string {
  const [yearText, monthText, dayText] = dateText.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error('startDate must be YYYY-MM-DD');
  }
  return new Date(Date.UTC(year, month - 1, day, 9, 0, 0)).toISOString();
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

async function loadFileBlogEntries(siteId: string, locale: string) {
  const rows: Array<{ locale: string; path: string; data: BlogLike }> = [];
  for (const directory of ['blog', 'blog-scheduled'] as const) {
    const blogDir = path.join(CONTENT_DIR, siteId, locale, directory);
    try {
      const files = await fs.readdir(blogDir);
      for (const file of files.filter((entry) => entry.endsWith('.json'))) {
        const resolved = path.join(blogDir, file);
        try {
          const raw = await fs.readFile(resolved, 'utf-8');
          rows.push({
            locale,
            path: `${directory}/${file}`,
            data: JSON.parse(raw),
          });
        } catch {
          // ignore invalid file
        }
      }
    } catch {
      // ignore missing dir
    }
  }
  return rows;
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !canWriteContent(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const siteId = typeof payload.siteId === 'string' ? payload.siteId : '';
  const locales = Array.isArray(payload.locales)
    ? payload.locales.filter((item: unknown) => item === 'en' || item === 'zh')
    : ['en', 'zh'];
  const startDate = typeof payload.startDate === 'string' ? payload.startDate : '';
  const intervalDays = Number.isFinite(Number(payload.intervalDays))
    ? Number(payload.intervalDays)
    : 7;
  const onlyDrafts = payload.onlyDrafts !== false;

  if (!siteId || !startDate) {
    return NextResponse.json({ message: 'siteId and startDate are required' }, { status: 400 });
  }

  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const allRowsMap = new Map<string, { locale: string; path: string; data: BlogLike }>();
  if (canUseContentDb()) {
    for (const locale of locales) {
      const entries = await listContentEntries(siteId, locale);
      for (const entry of entries.filter(
        (item) =>
          item.path.startsWith('blog/') || item.path.startsWith('blog-scheduled/')
      )) {
        allRowsMap.set(`${locale}:${entry.path}`, {
          locale,
          path: entry.path,
          data: (entry.data || {}) as BlogLike,
        });
      }
    }
  }
  for (const locale of locales) {
    const fileRows = await loadFileBlogEntries(siteId, locale);
    for (const row of fileRows) {
      if (!allRowsMap.has(`${row.locale}:${row.path}`)) {
        allRowsMap.set(`${row.locale}:${row.path}`, row);
      }
    }
  }
  const allRows = Array.from(allRowsMap.values());
  const translationLocaleMap = new Map<string, { locale: string; path: string; data: BlogLike }>();
  for (const row of allRows) {
    const groupKey = toTranslationKey(row.path, row.data);
    const dedupeKey = `${row.locale}:${groupKey}`;
    const existing = translationLocaleMap.get(dedupeKey);
    if (!existing) {
      translationLocaleMap.set(dedupeKey, row);
      continue;
    }
    const existingIsScheduledPath = existing.path.startsWith('blog-scheduled/');
    const currentIsScheduledPath = row.path.startsWith('blog-scheduled/');
    if (!existingIsScheduledPath && currentIsScheduledPath) {
      translationLocaleMap.set(dedupeKey, row);
    }
  }
  const rowsForScheduling = Array.from(translationLocaleMap.values());

  const groups = new Map<string, Array<{ locale: string; path: string; data: BlogLike }>>();
  for (const row of rowsForScheduling) {
    const key = toTranslationKey(row.path, row.data);
    const existing = groups.get(key) || [];
    existing.push(row);
    groups.set(key, existing);
  }

  const orderedGroups = Array.from(groups.entries())
    .map(([key, rows]) => ({
      key,
      rows,
      sortDate: rows.reduce((best, row) => {
        const value = Date.parse(row.data.publishAt || row.data.publishDate || '');
        if (Number.isNaN(value)) return best;
        return best === 0 ? value : Math.min(best, value);
      }, 0),
      title:
        rows.find((row) => typeof row.data.title === 'string' && row.data.title)?.data.title || key,
    }))
    .sort((a, b) => {
      if (a.sortDate && b.sortDate) return a.sortDate - b.sortDate;
      if (a.sortDate) return -1;
      if (b.sortDate) return 1;
      return a.key.localeCompare(b.key);
    });

  let baseIso = '';
  try {
    baseIso = toIsoAtMidMorning(startDate);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Invalid startDate. Use YYYY-MM-DD.' },
      { status: 400 }
    );
  }
  const updated: Array<{ translationGroup: string; locale: string; path: string; publishAt: string }> = [];
  let seriesIndex = 0;

  for (const group of orderedGroups) {
    const eligibleRows = onlyDrafts
      ? group.rows.filter((row) => !row.data.status || row.data.status === 'draft')
      : group.rows;
    if (eligibleRows.length === 0) continue;

    const publishAt = addDays(baseIso, seriesIndex * intervalDays);
    const publishDate = publishAt.slice(0, 10);

    for (const row of eligibleRows) {
      const destinationPath = row.path.startsWith('blog-scheduled/')
        ? row.path
        : row.path.replace(/^blog\//, 'blog-scheduled/');
      const sourcePath = row.path;
      const nextData = {
        ...row.data,
        translationGroup: toTranslationKey(row.path, row.data),
        status: 'scheduled' as const,
        publishAt,
        publishDate,
      };

      if (canUseContentDb()) {
        await upsertContentEntry({
          siteId,
          locale: row.locale,
          path: destinationPath,
          data: nextData,
          updatedBy: session.user.email,
        });
        if (sourcePath !== destinationPath) {
          const deletion = await deleteContentEntry({
            siteId,
            locale: row.locale,
            path: sourcePath,
          });
          if (!deletion.success) {
            console.warn(
              `Source cleanup failed for ${siteId}/${row.locale}/${sourcePath}: ${deletion.error || 'unknown error'}`
            );
          }
        }
      }

      const destinationResolved = path.join(CONTENT_DIR, siteId, row.locale, destinationPath);
      await fs.mkdir(path.dirname(destinationResolved), { recursive: true });
      await fs.writeFile(destinationResolved, JSON.stringify(nextData, null, 2));
      if (sourcePath !== destinationPath) {
        const sourceResolved = path.join(CONTENT_DIR, siteId, row.locale, sourcePath);
        await fs.unlink(sourceResolved).catch(() => {});
      }
      updated.push({
        translationGroup: String(nextData.translationGroup || ''),
        locale: row.locale,
        path: destinationPath,
        publishAt,
      });
    }

    seriesIndex += 1;
  }

  return NextResponse.json({
    success: true,
    count: updated.length,
    groupsScheduled: seriesIndex,
    updated,
    message: updated.length
      ? `Scheduled ${seriesIndex} weekly article group${seriesIndex === 1 ? '' : 's'} (${updated.length} locale file${updated.length === 1 ? '' : 's'}).`
      : 'No eligible blog posts were found to schedule.',
  });
}
