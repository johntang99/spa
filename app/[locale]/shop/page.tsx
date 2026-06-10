import { headers } from 'next/headers';
import type { Locale } from '@/lib/i18n';
import ShopClient from './ShopClient';

export const dynamic = 'force-dynamic';

type Product = {
  id: string;
  slug: string;
  name: string;
  name_zh?: string | null;
  short_description: string;
  short_description_zh?: string | null;
  price: number;
  compare_at_price?: number | null;
  primary_image: { url: string; alt: string };
  category: { slug: string; name: string; name_zh?: string | null };
  stock_status: string;
  rating_avg?: number;
  rating_count?: number;
  badges?: string[];
};

type Category = { slug: string; name: string; name_zh?: string | null; count: number };

type StoreInfo = {
  name: string;
  ai_practitioner_name: string | null;
  ai_practitioner_title: string | null;
  ai_booking_url: string | null;
  logo_url: string | null;
};

async function fetchProducts(storeSlug: string, locale: string, category?: string, sort?: string, search?: string) {
  const params = new URLSearchParams({ store_slug: storeSlug, locale, sort: sort || 'best_selling', per_page: '24' });
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  try {
    const herbStoreUrl = process.env.HERB_STORE_URL || 'http://localhost:3005';
    const res = await fetch(`${herbStoreUrl}/api/products?${params}`, {
      headers: { 'x-store-slug': storeSlug },
      cache: 'no-store',
    });
    if (!res.ok) return { products: [], categories: [], total: 0 };
    return await res.json();
  } catch {
    return { products: [], categories: [], total: 0 };
  }
}

async function fetchStoreInfo(storeSlug: string): Promise<StoreInfo | null> {
  try {
    const herbStoreUrl = process.env.HERB_STORE_URL || 'http://localhost:3005';
    const res = await fetch(`${herbStoreUrl}/api/stores?store_slug=${storeSlug}`, {
      headers: { 'x-store-slug': storeSlug },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stores?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const storeSlug = headers().get('x-store-slug') ?? '';
  const locale = params.locale;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'best_selling';
  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined;

  const [data, storeInfo] = await Promise.all([
    fetchProducts(storeSlug, locale, category, sort, search),
    fetchStoreInfo(storeSlug),
  ]);

  const products: Product[] = data.products ?? [];
  const categories: Category[] = data.filters?.categories ?? [];
  const total: number = data.pagination?.total ?? products.length;

  return (
    <ShopClient
      products={products}
      categories={categories}
      total={total}
      locale={locale}
      storeSlug={storeSlug}
      selectedCategory={category}
      currentSort={sort}
      searchQuery={search}
      storeInfo={storeInfo}
    />
  );
}
