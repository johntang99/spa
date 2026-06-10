import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canWriteContent } from '@/lib/admin/permissions';
import {
  canUseContentDb,
  deleteContentEntry,
  listContentEntriesForSite,
  upsertContentEntry,
} from '@/lib/contentDb';
import { normalizeBlogPostForPublish, isBlogPostDue } from '@/lib/blog';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const SITES_CONFIG_PATH = path.join(CONTENT_DIR, '_sites.json');

async function listSiteIds(): Promise<string[]> {
  try {
    const raw = await fs.readFile(SITES_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { sites?: Array<{ id?: string; enabled?: boolean }> };
    return Array.isArray(parsed.sites)
      ? parsed.sites.filter((site) => site?.id && site.enabled !== false).map((site) => String(site.id))
      : [];
  } catch {
    return [];
  }
}

async function listBlogFilesForSite(
  siteId: string,
  directory: 'blog' | 'blog-scheduled' = 'blog'
): Promise<Array<{ locale: string; path: string; data: any; sourceDirectory: 'blog' | 'blog-scheduled' }>> {
  const results: Array<{ locale: string; path: string; data: any; sourceDirectory: 'blog' | 'blog-scheduled' }> = [];
  for (const locale of ['en', 'zh']) {
    const blogDir = path.join(CONTENT_DIR, siteId, locale, directory);
    try {
      const files = await fs.readdir(blogDir);
      for (const file of files.filter((entry) => entry.endsWith('.json'))) {
        const filePath = path.join(blogDir, file);
        try {
          const raw = await fs.readFile(filePath, 'utf-8');
          results.push({ locale, path: `${directory}/${file}`, data: JSON.parse(raw), sourceDirectory: directory });
        } catch {
          // ignore bad file
        }
      }
    } catch {
      // ignore missing locale dir
    }
  }
  return results;
}

function isCronAuthorized(request: NextRequest): boolean {
  const configured = process.env.BLOG_PUBLISH_CRON_SECRET;
  if (!configured) return false;
  const provided = request.headers.get('x-cron-secret');
  if (provided && provided === configured) return true;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length).trim();
    if (bearerToken === configured) return true;
  }
  return false;
}

async function runDuePublisher(request: NextRequest, payload: any) {
  const session = await getSessionFromRequest(request);
  const cronAuthorized = isCronAuthorized(request);
  if (!cronAuthorized && (!session || !canWriteContent(session.user))) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const requestedSiteId = typeof payload.siteId === 'string' ? payload.siteId : '';
  const siteIds = requestedSiteId ? [requestedSiteId] : await listSiteIds();
  const now = new Date();
  const published: Array<{ siteId: string; locale: string; path: string; title?: string }> = [];

  for (const siteId of siteIds) {
    const rowsMap = new Map<string, { locale: string; path: string; data: any; sourceDirectory: 'blog' | 'blog-scheduled' }>();
    if (canUseContentDb()) {
      const entries = await listContentEntriesForSite(siteId);
      for (const entry of entries.filter((item) => item.path.startsWith('blog-scheduled/'))) {
        rowsMap.set(`${entry.locale}:${entry.path}`, {
          locale: entry.locale,
          path: entry.path,
          data: entry.data as any,
          sourceDirectory: 'blog-scheduled',
        });
      }
    }

    const scheduledFileRows = await listBlogFilesForSite(siteId, 'blog-scheduled');
    for (const row of scheduledFileRows) {
      if (!rowsMap.has(`${row.locale}:${row.path}`)) {
        rowsMap.set(`${row.locale}:${row.path}`, row);
      }
    }

    for (const row of rowsMap.values()) {
      if (!isBlogPostDue(row.data, now)) continue;
      const normalized = normalizeBlogPostForPublish(row.data);
      const destinationPath = row.path.replace(/^blog-scheduled\//, 'blog/');
      if (canUseContentDb()) {
        await upsertContentEntry({
          siteId,
          locale: row.locale,
          path: destinationPath,
          data: normalized,
          updatedBy: session?.user.email || 'cron',
        });
        if (row.sourceDirectory === 'blog-scheduled') {
          const deletion = await deleteContentEntry({
            siteId,
            locale: row.locale,
            path: row.path,
          });
          if (!deletion.success) {
            console.warn(
              `Scheduled source cleanup failed for ${siteId}/${row.locale}/${row.path}: ${deletion.error || 'unknown error'}`
            );
          }
        }
      }
      const sourceResolved = path.join(CONTENT_DIR, siteId, row.locale, row.path);
      const destinationResolved = path.join(CONTENT_DIR, siteId, row.locale, destinationPath);
      try {
        await fs.mkdir(path.dirname(destinationResolved), { recursive: true });
        await fs.writeFile(destinationResolved, JSON.stringify(normalized, null, 2));
        if (row.sourceDirectory === 'blog-scheduled') {
          await fs.unlink(sourceResolved).catch(() => {});
        }
      } catch {
        // best-effort file sync
      }
      published.push({ siteId, locale: row.locale, path: destinationPath, title: normalized.title });
    }
  }

  return NextResponse.json({
    success: true,
    count: published.length,
    published,
    message: published.length
      ? `Published ${published.length} scheduled blog post${published.length === 1 ? '' : 's'}.`
      : 'No scheduled blog posts were due.',
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  return runDuePublisher(request, payload);
}

export async function GET(request: NextRequest) {
  return runDuePublisher(request, {});
}
