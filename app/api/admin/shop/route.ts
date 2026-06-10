/**
 * /api/admin/shop
 *
 * GET  ?siteId=xxx
 *   Returns store connection status, all available products, and this store's
 *   current product assignments. Calls pureherbhealth APIs server-side.
 *
 * POST ?siteId=xxx  { name, slug?, type? }
 *   Creates a new store in pureherbhealth and links it to this site.
 *
 * PUT  ?siteId=xxx  { herbStoreSlug }
 *   Links an existing pureherbhealth store to this site (saves herbStoreSlug).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requireRole } from '@/lib/admin/permissions';
import { getSiteById, updateSite } from '@/lib/sites';

const HERB_STORE_URL = process.env.HERB_STORE_URL || 'http://localhost:3005';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

function internalHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(INTERNAL_API_SECRET ? { 'x-internal-secret': INTERNAL_API_SECRET } : {}),
    ...extra,
  };
}

async function fetchHerbStore(slug: string) {
  const res = await fetch(`${HERB_STORE_URL}/api/stores`, { cache: 'no-store' });
  if (!res.ok) return null;
  const { stores } = (await res.json()) as { stores: Array<{ id: string; slug: string; name: string; is_active: boolean; contact_email: string | null }> };
  return stores?.find((s) => s.slug === slug) ?? null;
}

async function fetchStoreProducts(storeId: string) {
  const res = await fetch(`${HERB_STORE_URL}/api/admin/stores/${storeId}/products`, {
    cache: 'no-store',
    headers: internalHeaders(),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: unknown[] };
  return data.items ?? [];
}

async function fetchAllProducts() {
  const res = await fetch(`${HERB_STORE_URL}/api/admin/products?per_page=200`, {
    cache: 'no-store',
    headers: internalHeaders(),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: unknown[] };
  return data.products ?? [];
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const siteId = request.nextUrl.searchParams.get('siteId') || '';
  const site = siteId ? await getSiteById(siteId) : null;
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

  const herbStoreSlug = site.herbStoreSlug ?? null;
  if (!herbStoreSlug) {
    return NextResponse.json({ connected: false, site, store: null, storeProducts: [], allProducts: [] });
  }

  const [store, allProducts] = await Promise.all([
    fetchHerbStore(herbStoreSlug),
    fetchAllProducts(),
  ]);

  const storeProducts = store ? await fetchStoreProducts(store.id) : [];

  return NextResponse.json({
    connected: Boolean(store),
    site,
    store: store ?? null,
    storeProducts,
    allProducts,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try { requireRole(session.user, ['super_admin', 'site_admin']); } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const siteId = request.nextUrl.searchParams.get('siteId') || '';
  const site = siteId ? await getSiteById(siteId) : null;
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

  const body = (await request.json()) as { name?: string; slug?: string; type?: string };
  const storeName = body.name || site.name;

  // Create new store in pureherbhealth
  const createRes = await fetch(`${HERB_STORE_URL}/api/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: storeName, slug: body.slug, type: body.type ?? 'embedded' }),
  });
  if (!createRes.ok) {
    const err = (await createRes.json()) as { message?: string };
    return NextResponse.json({ error: err.message ?? 'Failed to create store' }, { status: 400 });
  }
  const { store_slug } = (await createRes.json()) as { store_id: string; store_slug: string };

  // Link the new store to this site
  await updateSite(siteId, { herbStoreSlug: store_slug });

  const store = await fetchHerbStore(store_slug);
  return NextResponse.json({ connected: true, store_slug, store });
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try { requireRole(session.user, ['super_admin', 'site_admin']); } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const siteId = request.nextUrl.searchParams.get('siteId') || '';
  const site = siteId ? await getSiteById(siteId) : null;
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

  const { herbStoreSlug } = (await request.json()) as { herbStoreSlug: string };

  // Verify the store actually exists before saving
  const store = herbStoreSlug ? await fetchHerbStore(herbStoreSlug) : null;
  if (herbStoreSlug && !store) {
    return NextResponse.json({ error: `Store "${herbStoreSlug}" not found in pureherbhealth` }, { status: 404 });
  }

  const updated = await updateSite(siteId, { herbStoreSlug: herbStoreSlug || undefined });
  return NextResponse.json({ connected: Boolean(store), site: updated, store: store ?? null });
}
