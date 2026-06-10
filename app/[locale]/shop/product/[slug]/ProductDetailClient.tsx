"use client";

import { useState } from 'react';
import { useCart } from '@/lib/shop/cart-context';

type Product = {
  id: string;
  slug: string;
  name: string;
  short_description?: string;
  long_description?: string;
  price: number;
  images: Array<{ url?: string; alt?: string }>;
  category: { slug: string; name: string };
  variants?: Array<{ id: string; name: string; price: number; is_default: boolean }>;
};

function ProductNavBar({ locale }: { locale: string }) {
  const cart = useCart();
  const isZh = locale === 'zh';
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{
      position: 'sticky',
      top: 80,
      zIndex: 40,
      background: 'white',
      borderBottom: '1px solid var(--primary-100, #dcfce7)',
      height: 44,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          <a href={`/${locale}`} style={{ color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            {isZh ? '首页' : 'Home'}
          </a>
          <span style={{ color: '#cbd5e1' }}>›</span>
          <a href={`/${locale}/shop`} style={{ color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            {isZh ? '商店' : 'Shop'}
          </a>
          <span style={{ color: '#cbd5e1' }}>›</span>
          <span style={{ color: 'var(--primary, #166534)', fontWeight: 600 }}>
            {isZh ? '产品详情' : 'Product'}
          </span>
        </nav>

        <a
          href={`/${locale}/cart`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            background: itemCount > 0 ? 'var(--primary, #166534)' : 'transparent',
            color: itemCount > 0 ? 'white' : '#64748b',
            border: `1px solid ${itemCount > 0 ? 'var(--primary, #166534)' : '#e2e8f0'}`,
            borderRadius: 20,
            padding: '5px 14px 5px 10px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {isZh ? '购物车' : 'Cart'}
          {itemCount > 0 && (
            <span style={{
              background: 'white',
              color: 'var(--primary, #166534)',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
            }}>
              {itemCount}
            </span>
          )}
        </a>
      </div>
    </div>
  );
}

export default function ProductDetailClient({
  product,
  locale,
  storeSlug,
}: {
  product: Product;
  locale: string;
  storeSlug: string;
}) {
  const cart = useCart();
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const isZh = locale === 'zh';
  const primaryImage = product.images?.[0];

  const handleAdd = async () => {
    setAdding(true);
    try {
      await cart.addItem({ product_id: product.id, quantity: qty });
      window.location.href = `/${locale}/cart`;
    } catch {
      setAdding(false);
    }
  };

  return (
    <div style={{ paddingTop: 92 }}>
      <ProductNavBar locale={locale} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
        <a href={`/${locale}/shop`} style={{ fontSize: 14, color: 'var(--primary, #166534)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
          ← {isZh ? '返回商店' : 'Back to Shop'}
        </a>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Image */}
          <div style={{ aspectRatio: '1', background: 'var(--primary-50, #f0fdf4)', borderRadius: 16, overflow: 'hidden' }}>
            {primaryImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryImage.url} alt={primaryImage.alt || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🌿</div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--primary, #166534)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                {product.category?.name}
              </p>
              <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{product.name}</h1>
            </div>

            {product.short_description && (
              <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{product.short_description}</p>
            )}

            <p style={{ fontSize: 36, fontWeight: 700, color: '#111', margin: 0 }}>${product.price.toFixed(2)}</p>

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{isZh ? '数量' : 'Qty'}:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, border: 'none', background: '#f9fafb', cursor: 'pointer', fontSize: 18 }}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(99, q + 1))} style={{ width: 36, height: 36, border: 'none', background: '#f9fafb', cursor: 'pointer', fontSize: 18 }}>+</button>
              </div>
            </div>

            <button
              onClick={() => void handleAdd()}
              disabled={adding}
              style={{ padding: '14px 24px', background: 'var(--primary, #166534)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: adding ? 'wait' : 'pointer' }}
            >
              {adding ? (isZh ? '添加中…' : 'Adding…') : (isZh ? '加入购物车' : 'Add to Cart')}
            </button>

            {product.long_description && (
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{isZh ? '产品详情' : 'Description'}</h3>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>{product.long_description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
