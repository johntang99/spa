/**
 * /api/admin/shop/products
 *
 * PUT  ?siteId=xxx  { storeId, updates: [...] }
 *   Saves product assignments (enabled, price, featured, etc.) for this store
 *   by forwarding to pureherbhealth's admin API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requireRole } from '@/lib/admin/permissions';
import { getSiteById } from '@/lib/sites';

const HERB_STORE_URL = process.env.HERB_STORE_URL || 'http://localhost:3005';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try { requireRole(session.user, ['super_admin', 'site_admin']); } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const siteId = request.nextUrl.searchParams.get('siteId') || '';
  const site = siteId ? await getSiteById(siteId) : null;
  if (!site?.herbStoreSlug) {
    return NextResponse.json({ error: 'Site has no connected store' }, { status: 400 });
  }

  const body = (await request.json()) as {
    storeId: string;
    updates: Array<{
      product_id: string;
      enabled?: boolean;
      custom_price?: number | null;
      practitioner_note?: string | null;
      practitioner_recommended?: boolean;
      sort_order?: number;
      is_featured?: boolean;
      store_badges?: string[];
    }>;
  };

  const res = await fetch(`${HERB_STORE_URL}/api/admin/stores/${body.storeId}/products`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(INTERNAL_API_SECRET ? { 'x-internal-secret': INTERNAL_API_SECRET } : {}),
    },
    body: JSON.stringify({ updates: body.updates }),
  });

  const data = (await res.json()) as unknown;
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}
