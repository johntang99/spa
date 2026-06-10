import { headers } from 'next/headers';
import { CartProvider } from '@/lib/shop/cart-context';

export const dynamic = 'force-dynamic';

/**
 * Shop layout: wraps all shop + cart pages with the CartProvider.
 * The store slug is read from the x-store-slug header injected by middleware
 * (derived from the incoming host name via store-map.ts).
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const storeSlug = headers().get('x-store-slug') ?? '';
  return <CartProvider storeSlug={storeSlug}>{children}</CartProvider>;
}
