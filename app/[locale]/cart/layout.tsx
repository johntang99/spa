import { headers } from 'next/headers';
import { CartProvider } from '@/lib/shop/cart-context';

export const dynamic = 'force-dynamic';

export default function CartLayout({ children }: { children: React.ReactNode }) {
  const storeSlug = headers().get('x-store-slug') ?? '';
  return <CartProvider storeSlug={storeSlug}>{children}</CartProvider>;
}
