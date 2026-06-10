"use client";

import { useCart } from '@/lib/shop/cart-context';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// ─── Nav bar (breadcrumb + cart count) ────────────────────────────────────────

function CartNavBar({ locale, itemCount }: { locale: string; itemCount: number }) {
  const isZh = locale === 'zh';

  // sticky: travels in document flow, sticks at 80px (nav height after topbar scrolls away)
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
            {isZh ? '购物车' : 'Cart'}
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

// ─── Product type for recommendations ─────────────────────────────────────────

type SuggestedProduct = {
  id: string;
  slug: string;
  name: string;
  name_zh?: string | null;
  short_description?: string | null;
  price: number;
  primary_image?: { url: string; alt: string } | null;
  category?: { name: string; name_zh?: string | null } | null;
  rating_avg?: number;
  stock_status?: string;
};

// ─── Main cart page ────────────────────────────────────────────────────────────

export default function CartPage() {
  const cart = useCart();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isZh = locale === 'zh';
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const [suggested, setSuggested] = useState<SuggestedProduct[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Fetch "you might also like" from the same /api/products endpoint as the shop page,
  // excluding products already in the cart
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cart.storeSlug) return;
      const cartProductIds = new Set(cart.items.map((i) => i.product_id));
      try {
        const params = new URLSearchParams({ store_slug: cart.storeSlug, locale, sort: 'best_selling', per_page: '24' });
        const res = await fetch(`/api/products?${params}`, { cache: 'no-store' });
        const data = await res.json() as { products?: SuggestedProduct[] };
        const filtered = (data.products ?? []).filter((p) => !cartProductIds.has(p.id));
        if (!cancelled) setSuggested(filtered.slice(0, 6));
      } catch { /* ignore */ }
    }
    void load();
    return () => { cancelled = true; };
  }, [cart.items, cart.storeSlug, locale]);

  const subtotal = cart.subtotal;
  const shipping = subtotal >= 75 || itemCount === 0 ? 0 : 6.99;
  const total = subtotal + shipping;

  const handleAddSuggested = async (productId: string) => {
    setAddingId(productId);
    try {
      await cart.addItem({ product_id: productId });
    } finally {
      setAddingId(null);
    }
  };

  if (cart.isLoading) {
    return (
      <div style={{ paddingTop: 124, maxWidth: 1280, margin: '0 auto', padding: '92px 24px 40px', textAlign: 'center', color: '#6b7280' }}>
        <CartNavBar locale={locale} itemCount={0} />
        {isZh ? '加载中…' : 'Loading cart…'}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 92, background: '#f8fafc', minHeight: '100vh' }}>
      <CartNavBar locale={locale} itemCount={itemCount} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>
        {itemCount === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 18, marginBottom: 16 }}>{isZh ? '购物车为空' : 'Your cart is empty'}</p>
            <a
              href={`/${locale}/shop`}
              style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--primary, #166534)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
            >
              {isZh ? '浏览产品' : 'Browse Products'}
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

            {/* ── Left column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Items table */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr 36px',
                  padding: '10px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#94a3b8',
                }}>
                  <span>{isZh ? '产品' : 'Product'}</span>
                  <span style={{ textAlign: 'center' }}>{isZh ? '单价' : 'Unit Price'}</span>
                  <span style={{ textAlign: 'center' }}>{isZh ? '数量' : 'Quantity'}</span>
                  <span style={{ textAlign: 'center' }}>{isZh ? '小计' : 'Total'}</span>
                  <span />
                </div>

                {/* Items */}
                {cart.items.map((item) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr 36px',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid #f8fafc',
                  }}>
                    {/* Product info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {item.product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #f1f5f9' }}
                        />
                      ) : (
                        <div style={{ width: 68, height: 68, background: 'var(--primary-50, #f0fdf4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🌿</div>
                      )}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 3 }}>{item.product.name}</p>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '2px 7px' }}>
                          ● {isZh ? '有货' : 'In Stock'}
                        </span>
                      </div>
                    </div>

                    {/* Unit price */}
                    <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                      ${(item.unit_price_cents / 100).toFixed(2)}
                    </p>

                    {/* Qty controls */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                        <button
                          onClick={() => cart.updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          style={{ width: 30, height: 30, background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                        >−</button>
                        <span style={{ width: 36, textAlign: 'center', fontSize: 13, fontWeight: 700, borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', height: 30, lineHeight: '30px' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => cart.updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                          style={{ width: 30, height: 30, background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                        >+</button>
                      </div>
                    </div>

                    {/* Total */}
                    <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                      ${(item.total_price_cents / 100).toFixed(2)}
                    </p>

                    {/* Remove */}
                    <button
                      onClick={() => cart.removeItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 20, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title={isZh ? '删除' : 'Remove'}
                    >×</button>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { icon: '🔒', en: 'SSL Secure', zh: 'SSL安全' },
                  { icon: '🏭', en: 'GMP Certified', zh: 'GMP认证' },
                  { icon: '↩️', en: '30-Day Returns', zh: '30天退货' },
                  { icon: '📦', en: 'Free Ship $75+', zh: '满$75免运' },
                ].map((b) => (
                  <div key={b.en} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20, marginBottom: 4 }}>{b.icon}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{isZh ? b.zh : b.en}</p>
                  </div>
                ))}
              </div>

              {/* You might also like */}
              {suggested.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                    {isZh ? '猜你喜欢' : 'You might also like'}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {suggested.slice(0, 6).map((product) => (
                      <div key={product.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <a href={`/${locale}/shop/product/${product.slug}`} style={{ display: 'block', position: 'relative', aspectRatio: '1', background: 'var(--primary-50, #f0fdf4)', overflow: 'hidden' }}>
                          {product.primary_image?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.primary_image.url} alt={product.primary_image.alt || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🌿</div>
                          )}
                        </a>
                        <div style={{ padding: '12px 14px' }}>
                          {product.category && (
                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary, #166534)', marginBottom: 4 }}>
                              {isZh ? (product.category.name_zh || product.category.name) : product.category.name}
                            </p>
                          )}
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>{isZh ? (product.name_zh || product.name) : product.name}</p>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 10 }}>${product.price.toFixed(2)}</p>
                          <button
                            onClick={() => void handleAddSuggested(product.id)}
                            disabled={addingId === product.id}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: addingId === product.id ? '#e2e8f0' : 'var(--primary, #166534)',
                              color: addingId === product.id ? '#94a3b8' : 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: addingId === product.id ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {addingId === product.id ? (isZh ? '添加中…' : 'Adding…') : (isZh ? '加入购物车' : 'Add to Cart')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column: Order Summary ── */}
            <aside style={{ position: 'sticky', top: 136, alignSelf: 'start' }}>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>
                  {isZh ? '订单摘要' : 'Order Summary'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{isZh ? '小计' : 'Subtotal'}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{isZh ? '运费' : 'Shipping'}</span>
                    <span style={{ fontWeight: 600, color: shipping === 0 ? '#16a34a' : '#1e293b' }}>
                      {shipping === 0 ? (isZh ? '免费 ✓' : 'FREE ✓') : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {subtotal < 75 && subtotal > 0 && (
                    <p style={{ fontSize: 12, color: 'var(--primary, #166534)', background: 'var(--primary-50, #f0fdf4)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--primary-100, #dcfce7)' }}>
                      {isZh ? `再买 $${(75 - subtotal).toFixed(2)} 即可享受免费运费` : `Add $${(75 - subtotal).toFixed(2)} more for FREE shipping`}
                    </p>
                  )}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                    <span>{isZh ? '合计' : 'Total'}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <a
                  href={`/${locale}/checkout?store_slug=${cart.storeSlug}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    marginTop: 20,
                    padding: '13px',
                    background: 'var(--primary, #166534)',
                    color: '#fff',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {isZh ? '前往结账 →' : 'Proceed to Checkout →'}
                </a>
                <a
                  href={`/${locale}/shop`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    marginTop: 10,
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {isZh ? '← 继续购物' : '← Continue Shopping'}
                </a>

                <p style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                  {isZh
                    ? '以上声明未经FDA评估，不用于诊断、治疗或预防任何疾病。'
                    : 'These statements have not been evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.'}
                </p>
              </div>
            </aside>

          </div>
        )}
      </div>
    </div>
  );
}
