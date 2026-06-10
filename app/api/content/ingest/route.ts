import { NextRequest, NextResponse } from 'next/server';
import { upsertContentEntry } from '@/lib/contentDb';
import { getSiteById } from '@/lib/sites';
import {
  upsertLandingPage,
  findByIdempotencyKey,
} from '@/lib/landingPagesDb';

/**
 * Bridge/Ingest API – receives content from baam-platform.
 *
 * Supports both contract versions:
 *
 *   v1 (default; X-BAAM-Contract-Version: 1 or absent)
 *     Body: ArticlePublishRequestV1 — articles only.
 *
 *   v2 (X-BAAM-Contract-Version: 2)
 *     Body: { type: 'article', ... }       → article handler
 *           { type: 'landing_page', ... }  → LP handler (NEW)
 *
 * Auth: Bearer <INGEST_API_KEY>
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  const expectedKey = process.env.INGEST_API_KEY;
  if (!expectedKey || !auth || auth !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const contractVersion =
    req.headers.get('x-baam-contract-version') ?? '1';

  if (contractVersion === '2') {
    const type = body.type as string | undefined;
    if (type === 'landing_page') {
      return handleLandingPageV2(body);
    }
    if (type === 'article') {
      return handleArticleV1(body); // v2 article = v1 superset
    }
    return NextResponse.json(
      { error: `unknown body.type: ${type}` },
      { status: 400 },
    );
  }

  // v1 default
  return handleArticleV1(body);
}

// ---------- v1 article handler (unchanged behavior) ----------

async function handleArticleV1(body: Record<string, unknown>) {
  try {
    const {
      siteId,
      locale = 'en',
      slug: rawSlug,
      title,
      content,
      excerpt,
      image,
      imageAlt,
      tags,
      category,
      author,
      seoData,
      relatedServices,
      relatedConditions,
    } = body as Record<string, any>;

    if (!siteId || !rawSlug || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, slug, title, content' },
        { status: 400 },
      );
    }

    const slug = (rawSlug as string)
      .replace(/[*_~`#>\[\]()!]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    const blogData: Record<string, unknown> = {
      slug,
      title,
      author: author || 'Staff',
      excerpt: excerpt || '',
      category: category || 'blog',
      featured: false,
      image: image || null,
      imageAlt: imageAlt || title,
      imageCredit: '',
      imageSource: image || null,
      publishDate: new Date().toISOString().split('T')[0],
      contentMarkdown: content,
      relatedServices: relatedServices || [],
      relatedConditions: relatedConditions || [],
      tags: tags || [],
    };

    if (seoData) {
      if (seoData.metaTitle) blogData.metaTitle = seoData.metaTitle;
      if (seoData.metaDescription)
        blogData.metaDescription = seoData.metaDescription;
    }

    const path = `blog/${slug}.json`;
    const result = await upsertContentEntry({
      siteId,
      locale,
      path,
      data: blogData,
      updatedBy: 'baam-automation',
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to write content entry' },
        { status: 500 },
      );
    }

    let domain = 'https://example.com';
    try {
      const siteConfig = await getSiteById(siteId);
      if (siteConfig?.domain) {
        domain = siteConfig.domain.startsWith('http')
          ? siteConfig.domain
          : `https://${siteConfig.domain}`;
      }
    } catch {
      /* fallback */
    }

    const localePrefix = locale === 'en' ? '' : `${locale}/`;
    const publishedUrl = `${domain}/${localePrefix}blog/${slug}`;

    return NextResponse.json({
      ok: true,
      url: publishedUrl,
      entryId: result.id,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Ingest failed' },
      { status: 500 },
    );
  }
}

// ---------- v2 landing_page handler ----------

async function handleLandingPageV2(body: Record<string, unknown>) {
  try {
    const siteId = body.siteId as string | undefined;
    const language = body.language as 'en' | 'zh' | 'es' | undefined;
    const rawSlug = body.slug as string | undefined;
    const content = body.content;
    const variantGroup = (body.variantGroup as string | undefined) ?? null;
    const isControl = (body.isControl as boolean | undefined) ?? true;
    const trafficWeight = (body.trafficWeight as number | undefined) ?? 100;
    const idempotencyKey = (body.idempotencyKey as string | undefined) ?? null;

    if (!siteId || !rawSlug || !language || !content) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: siteId, slug, language, content',
        },
        { status: 400 },
      );
    }
    if (!['en', 'zh', 'es'].includes(language)) {
      return NextResponse.json(
        { error: `invalid language: ${language}` },
        { status: 400 },
      );
    }

    // Strip optional 'lp/' prefix that BAAM sends as a path-style slug.
    const slug = rawSlug.replace(/^lp\//, '').trim();

    // Idempotency short-circuit: same key → return existing url, no rewrite.
    if (idempotencyKey) {
      const existing = await findByIdempotencyKey(siteId, idempotencyKey);
      if (existing) {
        const url = await buildLpUrl(siteId, existing.slug, existing.language);
        return NextResponse.json({ ok: true, url, entryId: existing.id });
      }
    }

    const result = await upsertLandingPage({
      siteId,
      slug,
      language,
      content,
      variantGroup,
      isControl,
      trafficWeight,
      idempotencyKey,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to upsert landing page' },
        { status: 500 },
      );
    }

    const url = await buildLpUrl(siteId, slug, language);
    return NextResponse.json({ ok: true, url, entryId: result.id });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'LP ingest failed' },
      { status: 500 },
    );
  }
}

async function buildLpUrl(
  siteId: string,
  slug: string,
  language: string,
): Promise<string> {
  let domain = 'https://example.com';
  try {
    const siteConfig = await getSiteById(siteId);
    if (siteConfig?.domain) {
      domain = siteConfig.domain.startsWith('http')
        ? siteConfig.domain
        : `https://${siteConfig.domain}`;
    }
  } catch {
    /* fallback */
  }
  return `${domain}/${language}/lp/${slug}`;
}
