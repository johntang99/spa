import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

async function fetchProduct(storeSlug: string, slug: string, locale: string) {
  try {
    const herbStoreUrl = process.env.HERB_STORE_URL || 'http://localhost:3005';
    const res = await fetch(`${herbStoreUrl}/api/products/${slug}?locale=${locale}`, {
      headers: { 'x-store-slug': storeSlug },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.item ?? json;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { locale: Locale; slug: string };
}) {
  const storeSlug = headers().get('x-store-slug') ?? '';
  const product = await fetchProduct(storeSlug, params.slug, params.locale);
  if (!product) notFound();

  return <ProductDetailClient product={product} locale={params.locale} storeSlug={storeSlug} />;
}
