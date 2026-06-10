import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { resolveContentPath } from '@/lib/admin/content';
import { CONTENT_TEMPLATES } from '@/lib/admin/templates';
import {
  canUseContentDb,
  deleteContentEntry,
  fetchContentEntry,
  insertContentRevision,
  upsertContentEntry,
} from '@/lib/contentDb';
import { canWriteContent, requireSiteAccess } from '@/lib/admin/permissions';
import { locales } from '@/lib/i18n';
import { normalizeMediaUrlsInData } from '@/lib/media-url';

function isEmptyHeaderPayload(filePath: string, data: any): boolean {
  if (filePath !== 'header.json' || !data || typeof data !== 'object') return false;
  const topbar = data.topbar || {};
  const menu = data.menu || {};
  const logo = menu.logo || {};
  const cta = data.cta || {};
  const items = Array.isArray(menu.items) ? menu.items : [];

  const isBlank = (value: unknown) => typeof value !== 'string' || value.trim() === '';
  return (
    isBlank(topbar.phone) &&
    isBlank(topbar.address) &&
    isBlank(topbar.badge) &&
    isBlank(logo.text) &&
    items.length === 0 &&
    isBlank(cta.text) &&
    isBlank(cta.link)
  );
}

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function isLocalhostRequest(request?: NextRequest): boolean {
  if (!request) return false;
  try {
    const { hostname } = new URL(request.url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function validateBlogContent(filePath: string, data: any): string | null {
  if (!filePath.startsWith('blog/') && !filePath.startsWith('blog-scheduled/')) return null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'Blog post JSON must be an object';
  }
  if (typeof data.slug !== 'string' || !data.slug.trim()) {
    return 'Blog post slug is required';
  }
  if (data.status && !['draft', 'scheduled', 'published'].includes(data.status)) {
    return 'Blog post status must be draft, scheduled, or published';
  }
  if (data.status === 'scheduled') {
    if (typeof data.publishAt !== 'string' || !data.publishAt.trim()) {
      return 'Scheduled blog posts require publishAt';
    }
    if (Number.isNaN(Date.parse(data.publishAt))) {
      return 'publishAt must be a valid ISO datetime';
    }
  }
  return null;
}

function shouldWriteThroughFile(request?: NextRequest): boolean {
  // Always sync local JSON while operating on localhost to keep DB/file in lockstep.
  if (isLocalhostRequest(request)) {
    return true;
  }
  const override = parseBooleanEnv(process.env.CONTENT_WRITE_THROUGH_FILE);
  if (override !== null) {
    return override;
  }
  return process.env.NODE_ENV !== 'production';
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const locale = searchParams.get('locale');
  const filePath = searchParams.get('path');

  if (!siteId || !locale || !filePath) {
    return NextResponse.json(
      { message: 'siteId, locale, and path are required' },
      { status: 400 }
    );
  }

  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const resolved = resolveContentPath(siteId, locale, filePath);
  if (!resolved) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  try {
    if (canUseContentDb()) {
      const entry = await fetchContentEntry(siteId, locale, filePath);
      if (entry?.data && !isEmptyHeaderPayload(filePath, entry.data)) {
        return NextResponse.json({ content: JSON.stringify(entry.data, null, 2) });
      }
      if (!shouldWriteThroughFile(request)) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
      }
    }

    const content = await fs.readFile(resolved, 'utf-8');
    if (canUseContentDb()) {
      try {
        const parsed = JSON.parse(content);
        await upsertContentEntry({
          siteId,
          locale,
          path: filePath,
          data: parsed,
          updatedBy: session.user.email,
        });
      } catch (error) {
        // ignore invalid JSON during fallback
      }
    }

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = payload.siteId as string | undefined;
  const locale = payload.locale as string | undefined;
  const filePath = payload.path as string | undefined;
  const content = payload.content as string | undefined;

  if (!siteId || !locale || !filePath || typeof content !== 'string') {
    return NextResponse.json(
      { message: 'siteId, locale, path, and content are required' },
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

  const resolved = resolveContentPath(siteId, locale, filePath);
  if (!resolved) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const normalizedParsed = normalizeMediaUrlsInData(parsed, siteId);
  const blogValidationError = validateBlogContent(filePath, normalizedParsed);
  if (blogValidationError) {
    return NextResponse.json({ message: blogValidationError }, { status: 400 });
  }
  const normalizedContent = JSON.stringify(normalizedParsed, null, 2);

  if (canUseContentDb()) {
    const existing = await fetchContentEntry(siteId, locale, filePath);
    if (existing?.data) {
      await insertContentRevision({
        entryId: existing.id,
        data: existing.data,
        createdBy: session.user.email,
        note: 'Admin update',
      });
    }
    if (filePath === 'theme.json') {
      await Promise.all(
        locales.map((entryLocale) =>
          upsertContentEntry({
            siteId,
            locale: entryLocale,
            path: filePath,
            data: normalizedParsed,
            updatedBy: session.user.email,
          })
        )
      );
    } else {
      await upsertContentEntry({
        siteId,
        locale,
        path: filePath,
        data: normalizedParsed,
        updatedBy: session.user.email,
      });
    }

    if (!shouldWriteThroughFile(request)) {
      return NextResponse.json({
        success: true,
        fileSync: 'skipped',
        message: 'Saved to DB (JSON sync disabled in production).',
      });
    }

    try {
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, normalizedContent);
      return NextResponse.json({
        success: true,
        fileSync: 'synced',
        message: 'Saved to DB + JSON.',
      });
    } catch (error: any) {
      return NextResponse.json({
        success: true,
        fileSync: 'failed',
        message: `Saved to DB (JSON sync failed: ${error?.message || 'unknown error'}).`,
      });
    }
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  try {
    const existing = await fs.readFile(resolved, 'utf-8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const historyPath = path.join(
      process.cwd(),
      'content',
      '_history',
      siteId,
      locale,
      `${filePath}.${timestamp}.json`
    );
    await fs.mkdir(path.dirname(historyPath), { recursive: true });
    await fs.writeFile(historyPath, existing);
  } catch (error) {
    // ignore missing existing file
  }

  await fs.writeFile(resolved, normalizedContent);
  return NextResponse.json({ success: true, fileSync: 'synced', message: 'Saved to JSON.' });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = payload.siteId as string | undefined;
  const locale = payload.locale as string | undefined;
  const action = payload.action as string | undefined;

  if (!siteId || !locale || !action) {
    return NextResponse.json(
      { message: 'siteId, locale, and action are required' },
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

  if (action === 'create') {
    const slug = payload.slug as string | undefined;
    const templateId = (payload.templateId as string | undefined) || 'basic';
    const targetDir = (payload.targetDir as string | undefined) || 'pages';
    if (!slug) {
      return NextResponse.json({ message: 'slug is required' }, { status: 400 });
    }
    if (!['pages', 'blog', 'blog-scheduled'].includes(targetDir)) {
      return NextResponse.json({ message: 'Invalid target directory' }, { status: 400 });
    }
    const normalized = slug.trim().toLowerCase();
    const filePath = `${targetDir}/${normalized}.json`;
    const resolved = resolveContentPath(siteId, locale, filePath);
    if (!resolved) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }
    try {
      await fs.access(resolved);
      return NextResponse.json({ message: 'File already exists' }, { status: 409 });
    } catch (error) {
      // ok
    }
    const template =
      CONTENT_TEMPLATES.find((item) => item.id === templateId) ||
      CONTENT_TEMPLATES[0];
    const templateContent =
      targetDir === 'blog'
        ? {
            slug: normalized,
            title: 'New Blog Post',
            excerpt: '',
            image: '',
            imageAlt: '',
            imageCredit: '',
            imageSource: '',
            category: '',
            author: '',
            publishDate: '',
            publishAt: '',
            status: 'draft',
            translationGroup: normalized,
            featured: false,
            contentMarkdown: '',
            relatedServices: [],
            relatedConditions: [],
          }
        : template.content;
    if (canUseContentDb()) {
      const existing = await fetchContentEntry(siteId, locale, filePath);
      if (existing) {
        return NextResponse.json({ message: 'File already exists' }, { status: 409 });
      }
      await upsertContentEntry({
        siteId,
        locale,
        path: filePath,
        data: templateContent,
        updatedBy: session.user.email,
      });
      return NextResponse.json({ path: filePath });
    }

    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, JSON.stringify(templateContent, null, 2));
    return NextResponse.json({ path: filePath });
  }

  if (action === 'duplicate') {
    const sourcePath = payload.path as string | undefined;
    const slug = payload.slug as string | undefined;
    const targetDir = payload.targetDir as string | undefined;
    if (!sourcePath || !slug) {
      return NextResponse.json(
        { message: 'path and slug are required' },
        { status: 400 }
      );
    }
    const normalized = slug.trim().toLowerCase();
    const sourceDir = sourcePath.startsWith('blog-scheduled/')
      ? 'blog-scheduled'
      : sourcePath.startsWith('blog/')
        ? 'blog'
        : 'pages';
    const resolvedTargetDir =
      sourceDir === 'blog' || sourceDir === 'blog-scheduled'
        ? sourceDir
        : targetDir && ['pages', 'blog', 'blog-scheduled'].includes(targetDir)
          ? targetDir
          : 'pages';
    if (
      (sourceDir === 'blog' && resolvedTargetDir !== 'blog') ||
      (sourceDir === 'blog-scheduled' && resolvedTargetDir !== 'blog-scheduled')
    ) {
      return NextResponse.json(
        { message: `Blog posts must be duplicated into ${sourceDir}/` },
        { status: 400 }
      );
    }
    const targetPath = `${resolvedTargetDir}/${normalized}.json`;
    const sourceResolved = resolveContentPath(siteId, locale, sourcePath);
    const targetResolved = resolveContentPath(siteId, locale, targetPath);
    if (!sourceResolved || !targetResolved) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }
    let content = '';
    if (canUseContentDb()) {
      const sourceEntry = await fetchContentEntry(siteId, locale, sourcePath);
      if (sourceEntry?.data) {
        content = JSON.stringify(sourceEntry.data, null, 2);
      }
    }
    if (!content) {
      content = await fs.readFile(sourceResolved, 'utf-8');
    }

    let nextContent = content;
    if (sourceDir === 'blog' || sourceDir === 'blog-scheduled') {
      try {
        const parsed = JSON.parse(content);
        parsed.slug = normalized;
        nextContent = JSON.stringify(parsed, null, 2);
      } catch (error) {
        // fallback to raw content if JSON is invalid
      }
    }
    if (canUseContentDb()) {
      const parsed = JSON.parse(nextContent);
      await upsertContentEntry({
        siteId,
        locale,
        path: targetPath,
        data: parsed,
        updatedBy: session.user.email,
      });
      return NextResponse.json({ path: targetPath });
    }

    await fs.mkdir(path.dirname(targetResolved), { recursive: true });
    await fs.writeFile(targetResolved, nextContent);
    return NextResponse.json({ path: targetPath });
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const locale = searchParams.get('locale');
  const filePath = searchParams.get('path');

  if (!siteId || !locale || !filePath) {
    return NextResponse.json(
      { message: 'siteId, locale, and path are required' },
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

  if (['theme.json', 'site.json', 'navigation.json'].includes(filePath)) {
    return NextResponse.json(
      { message: 'Protected file cannot be deleted' },
      { status: 400 }
    );
  }

  const resolved = resolveContentPath(siteId, locale, filePath);
  if (!resolved) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  if (canUseContentDb()) {
    const deletion = await deleteContentEntry({ siteId, locale, path: filePath });
    if (!deletion.success) {
      return NextResponse.json(
        {
          message:
            deletion.error || 'Failed to delete from DB.',
          fileSync: 'skipped',
        },
        { status: 500 }
      );
    }
    if (!shouldWriteThroughFile(request)) {
      return NextResponse.json({ success: true, fileSync: 'skipped' });
    }
    try {
      await fs.unlink(resolved);
      return NextResponse.json({ success: true, fileSync: 'synced' });
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return NextResponse.json({ success: true, fileSync: 'missing' });
      }
      return NextResponse.json({
        success: true,
        fileSync: 'failed',
        message: `Deleted from DB (JSON delete failed: ${error?.message || 'unknown error'}).`,
      });
    }
  }

  await fs.unlink(resolved);
  return NextResponse.json({ success: true, fileSync: 'synced' });
}
