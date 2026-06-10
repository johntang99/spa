"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/shop/cart-context';

// ─── Types ────────────────────────────────────────────────────────────────────

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
} | null;

// ─── Trust Bar ────────────────────────────────────────────────────────────────

function ShopNavBar({ locale }: { locale: string }) {
  const cart = useCart();
  const isZh = locale === 'zh';
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

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
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          <a href={`/${locale}`} style={{ color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            {isZh ? '首页' : 'Home'}
          </a>
          <span style={{ color: '#cbd5e1' }}>›</span>
          <span style={{ color: 'var(--primary, #166534)', fontWeight: 600 }}>
            {isZh ? '中草药商店' : 'Shop'}
          </span>
        </nav>

        {/* Cart */}
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
            transition: 'all 0.2s',
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
              lineHeight: 1,
            }}>
              {itemCount}
            </span>
          )}
        </a>
      </div>
    </div>
  );
}

function TrustBar({ locale, practitionerName }: { locale: string; practitionerName: string }) {
  const isZh = locale === 'zh';
  const items = isZh
    ? ['🔒 安全结账', '📦 满$75免运费', '↩️ 30天退货', `✓ ${practitionerName}精选产品`]
    : ['🔒 Secure Checkout', '📦 Free Shipping $75+', '↩️ 30-Day Returns', `✓ ${practitionerName}–Verified Quality`];
  return (
    <div style={{ background: 'var(--primary-50, #f0fdf4)', borderBottom: '1px solid var(--primary-100, #dcfce7)', padding: '7px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 28, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--primary, #166534)', fontWeight: 500 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Shop Hero ────────────────────────────────────────────────────────────────

function ShopHero({
  locale,
  practitionerName,
  practitionerTitle,
  bookingUrl,
  storeName,
  featuredProducts,
}: {
  locale: string;
  practitionerName: string;
  practitionerTitle: string;
  bookingUrl: string | null;
  storeName: string;
  featuredProducts: Product[];
}) {
  const isZh = locale === 'zh';
  const firstName = practitionerName.split(' ')[1] ?? practitionerName.split(',')[0] ?? 'Dr.';

  return (
    <section style={{ background: 'linear-gradient(120deg, var(--primary, #166534) 0%, var(--primary-dark, #14532d) 100%)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>

        {/* Left — hero copy */}
        <div style={{ color: 'white' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 16, letterSpacing: '0.05em' }}>
            ✦ {isZh ? '中医师精选草药商店' : 'Practitioner-Curated Herbal Store'}
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>
            {isZh
              ? <><span style={{ color: 'var(--secondary-light, #f59e0b)' }}>AI智能</span> TCM健康商店</>
              : <><span style={{ color: 'var(--secondary-light, #f59e0b)' }}>AI-Powered</span> TCM Wellness Store</>}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 14, fontStyle: 'normal' }}>
            {isZh ? `${practitionerName}的 · 中医草药专卖店` : `${storeName} · 中医草药专卖店`}
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 24, maxWidth: 420 }}>
            {isZh
              ? `由${practitionerName}亲自为您的健康之旅精选的产品。每款产品均经过质量审核，来源于可信赖的供应商，并获得患者使用认可。`
              : `Products personally selected by ${practitionerName} for your wellness journey. Each item has been vetted for quality, sourced from trusted suppliers, and approved for patient use.`}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={`/${locale}/shop`}
              style={{ background: 'var(--secondary-light, #f59e0b)', color: '#1e293b', border: 'none', padding: '11px 22px', borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
            >
              🌿 {isZh ? '浏览所有产品' : 'Shop All Products'}
            </a>
            <a
              href={`/${locale}/quiz`}
              style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '11px 22px', borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
            >
              ✦ {isZh ? '测试您的体质' : 'Take Constitution Quiz'}
            </a>
          </div>
        </div>

        {/* Right — practitioner card */}
        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>
              🌿
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 15, color: 'white' }}>{practitionerName}</strong>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{practitionerTitle}</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 14 }}>
            {isZh
              ? `"在我15年的临床经验中，我亲眼见证了草药的真实效果。这家店里的每一款产品，都是我会放心推荐给自己家人的。"`
              : `"I've carefully selected these products for my patients over 15 years of practice. Every item in this store meets my standards for purity, potency, and safety."`}
          </p>
          {featuredProducts.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--secondary-light, #f59e0b)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                ★ {isZh ? '本周精选' : "WEEK'S PICKS"}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {featuredProducts.slice(0, 3).map((p) => (
                  <a
                    key={p.id}
                    href={`/${locale}/shop/product/${p.slug}`}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', flex: 1, textDecoration: 'none', transition: 'background 0.15s', display: 'block' }}
                  >
                    <span style={{ display: 'block', fontSize: 12, color: 'white', fontWeight: 500, lineHeight: 1.3 }}>
                      {locale === 'zh' && p.name_zh ? p.name_zh : p.name}
                    </span>
                    <span style={{ display: 'block', fontSize: 13, color: 'var(--secondary-light, #f59e0b)', fontWeight: 700, marginTop: 2 }}>
                      ${p.price.toFixed(2)}
                    </span>
                  </a>
                ))}
              </div>
            </>
          )}
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 14, textAlign: 'center', background: 'var(--secondary-light, #f59e0b)', color: '#1e293b', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
            >
              📅 {isZh ? '预约就诊' : 'Book Appointment'}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Category Chips ───────────────────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  'herbal-formulas': '🌿',
  'single-herbs': '🌱',
  'herbal-teas': '🍵',
  'moxibustion': '🔥',
  'wellness-tools': '🧰',
  'top-picks': '⭐',
};

function CategoryChips({
  categories,
  selectedCategory,
  locale,
  onSelect,
}: {
  categories: Category[];
  selectedCategory?: string;
  locale: string;
  onSelect: (slug: string | undefined) => void;
}) {
  const isZh = locale === 'zh';
  return (
    <div style={{ background: 'white', padding: '28px 24px', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary, #166534)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          {isZh ? '浏览分类' : 'Browse Categories'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelect(undefined)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 20,
              border: `1px solid ${!selectedCategory ? 'var(--primary, #166534)' : 'var(--primary-100, #dcfce7)'}`,
              background: !selectedCategory ? 'var(--primary, #166534)' : 'var(--primary-50, #f0fdf4)',
              color: !selectedCategory ? 'white' : '#475569',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            🛍 {isZh ? '全部产品' : 'All Products'}
          </button>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            const emoji = CATEGORY_EMOJIS[cat.slug] ?? '🌿';
            return (
              <button
                key={cat.slug}
                onClick={() => onSelect(cat.slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 20,
                  border: `1px solid ${isActive ? 'var(--primary, #166534)' : 'var(--primary-100, #dcfce7)'}`,
                  background: isActive ? 'var(--primary, #166534)' : 'var(--primary-50, #f0fdf4)',
                  color: isActive ? 'white' : '#475569',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                }}
              >
                {emoji} {isZh && cat.name_zh ? cat.name_zh : cat.name}
                {cat.name_zh && !isZh && <span style={{ fontSize: 11, opacity: 0.7 }}>{cat.name_zh}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function StarRating({ avg = 4.8, count = 0 }: { avg?: number; count?: number }) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
      <span style={{ color: '#f59e0b', fontSize: 12, letterSpacing: 1 }}>
        {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      </span>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>
        {avg.toFixed(1)}{count > 0 ? ` (${count})` : ''}
      </span>
    </div>
  );
}

function ProductCard({ product, locale }: { product: Product; locale: string }) {
  const cart = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);
  const isZh = locale === 'zh';

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(false);
    try {
      await cart.addItem({ product_id: product.id });
      window.location.href = `/${locale}/cart`;
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
      setAdding(false);
    }
  };

  const savingsPct = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : null;

  const badges = product.badges ?? [];
  const hasSale = savingsPct && savingsPct > 0;

  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 20px -4px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <a href={`/${locale}/shop/product/${product.slug}`} style={{ display: 'block', position: 'relative', aspectRatio: '1', background: 'var(--primary-50, #f0fdf4)', overflow: 'hidden', flexShrink: 0 }}>
        {product.primary_image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.primary_image.url} alt={product.primary_image.alt || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>🌿</div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {badges.includes('best_seller') && (
            <span style={{ background: 'var(--secondary-light, #f59e0b)', color: '#1e293b', padding: '3px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>★ Best Seller</span>
          )}
          {badges.includes('dr_pick') && (
            <span style={{ background: 'var(--primary, #166534)', color: 'white', padding: '3px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ Dr. Pick</span>
          )}
          {hasSale && (
            <span style={{ background: '#ef4444', color: 'white', padding: '3px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>SALE {savingsPct}% OFF</span>
          )}
          {badges.includes('new') && (
            <span style={{ background: '#3b82f6', color: 'white', padding: '3px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>NEW</span>
          )}
        </div>
      </a>

      {/* Info */}
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary, #166534)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
          {isZh && product.category?.name_zh ? product.category.name_zh : product.category?.name}
        </p>
        <a href={`/${locale}/shop/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', lineHeight: 1.3, color: '#0f172a' }}>
            {product.name}
          </h3>
        </a>
        {product.name_zh && (
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{product.name_zh}</p>
        )}
        <StarRating avg={product.rating_avg} count={product.rating_count} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>${product.price.toFixed(2)}</span>
          {product.compare_at_price && (
            <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>${product.compare_at_price.toFixed(2)}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: product.stock_status === 'in_stock' ? '#16a34a' : '#f59e0b', flexShrink: 0 }} />
          <span style={{ color: product.stock_status === 'in_stock' ? '#16a34a' : '#d97706' }}>
            {product.stock_status === 'in_stock' ? (isZh ? '有库存' : 'In Stock') : (isZh ? '库存有限' : 'Low Stock')}
          </span>
        </div>
        <div style={{ marginTop: 'auto' }}>
          {added ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ flex: 1, padding: '9px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: 6, fontWeight: 600, fontSize: 12, textAlign: 'center' }}>✓ {isZh ? '已添加' : 'Added'}</span>
              <a href={`/${locale}/cart`} style={{ flex: 1, padding: '9px', background: 'var(--primary, #166534)', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 12, textDecoration: 'none', textAlign: 'center', display: 'block' }}>{isZh ? '查看购物车' : 'View Cart'}</a>
            </div>
          ) : (
            <button
              onClick={(e) => void handleAdd(e)}
              disabled={adding}
              style={{ width: '100%', padding: '9px', background: error ? '#ef4444' : 'var(--primary, #166534)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: adding ? 'wait' : 'pointer', transition: 'background 0.15s' }}
            >
              {adding ? (isZh ? '添加中…' : 'Adding…') : error ? (isZh ? '失败–重试' : 'Failed – retry') : `+ ${isZh ? '加入购物车' : 'Add to Cart'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Practitioner Section ─────────────────────────────────────────────────────

const CONDITIONS = [
  { en: 'Sleep Issues', zh: '睡眠问题', herb: 'Reishi Sleep', herbZh: '灵芝安眠' },
  { en: 'Low Energy', zh: '低能量', herb: 'Astragalus', herbZh: '黄芪' },
  { en: 'Immunity', zh: '免疫力', herb: 'Immune Formula', herbZh: '免疫配方' },
  { en: 'Stress / Anxiety', zh: '压力/焦虑', herb: 'Calm Shen', herbZh: '养心安神' },
  { en: 'Joint Pain', zh: '关节疼痛', herb: 'Du Huo Ji Sheng', herbZh: '独活寄生丸' },
  { en: "Women's Health", zh: '女性健康', herb: 'Dong Quai', herbZh: '当归' },
];

function PractitionerSection({
  locale,
  practitionerName,
  practitionerTitle,
  products,
}: {
  locale: string;
  practitionerName: string;
  practitionerTitle: string;
  products: Product[];
}) {
  const isZh = locale === 'zh';
  return (
    <section style={{ background: 'white', padding: '40px 24px', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40, alignItems: 'start' }}>
        {/* Left — profile */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--primary-100, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, margin: '0 auto 14px', border: '3px solid var(--primary-100, #dcfce7)' }}>
            👨‍⚕️
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{practitionerName}</p>
          <p style={{ fontSize: 13, color: 'var(--primary, #166534)', fontWeight: 500, marginBottom: 4 }}>{practitionerTitle}</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>{isZh ? '15年以上临床经验' : '15+ years of clinical practice'}</p>
        </div>

        {/* Right — message + conditions */}
        <div>
          <h3 style={{ fontSize: 17, color: '#0f172a', marginBottom: 10 }}>
            {isZh ? `来自${practitionerName}的话` : <>{`A Message from `}<span style={{ color: 'var(--primary, #166534)' }}>{practitionerName}</span></>}
          </h3>
          <blockquote style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 16, borderLeft: '3px solid var(--primary-100, #dcfce7)', paddingLeft: 16 }}>
            {isZh
              ? `"在我15年的行医生涯中，我亲眼见证了草药能带来真实的改变。这家店里的每一款产品，都是我会放心推荐给自己家人的。质量与安全是我的底线——这些产品已经赢得了一席之地。"`
              : `"After 15 years of treating patients, I've seen firsthand which herbs make a real difference. Every product in this store is one I'd confidently recommend to my own family. Quality and safety are non-negotiable — these products have earned their place here."`}
          </blockquote>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary, #166534)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            🌿 {isZh ? '常见病症推荐' : 'Top Picks for Common Conditions'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {CONDITIONS.map((c) => (
              <div key={c.en} style={{ border: '1px solid var(--primary-100, #dcfce7)', borderRadius: 8, padding: 10, display: 'flex', gap: 8, alignItems: 'center', cursor: 'default' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🌿</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{isZh ? c.zh : c.en}</p>
                  <p style={{ fontSize: 12, color: 'var(--primary, #166534)', fontWeight: 700, margin: 0 }}>{isZh ? c.herbZh : c.herb} →</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main ShopClient ──────────────────────────────────────────────────────────

export default function ShopClient({
  products,
  categories,
  total,
  locale,
  storeSlug,
  selectedCategory,
  currentSort,
  searchQuery,
  storeInfo,
}: {
  products: Product[];
  categories: Category[];
  total: number;
  locale: string;
  storeSlug: string;
  selectedCategory?: string;
  currentSort?: string;
  searchQuery?: string;
  storeInfo: StoreInfo;
}) {
  const router = useRouter();
  const isZh = locale === 'zh';

  const practitionerName = storeInfo?.ai_practitioner_name ?? 'Dr. Wei Huang, L.Ac., DAOM';
  const practitionerTitle = storeInfo?.ai_practitioner_title ?? 'Licensed Acupuncturist · Doctor of Oriental Medicine';
  const bookingUrl = storeInfo?.ai_booking_url ?? null;
  const storeName = storeInfo?.name ?? 'TCM Network Herbs';
  const shortName = practitionerName.split(',')[0] ?? practitionerName;

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/${locale}/shop?${params.toString()}`);
  };

  return (
    <div style={{ paddingTop: '92px' }}>
      {/* Breadcrumb + cart nav bar */}
      <ShopNavBar locale={locale} />

      {/* Trust bar */}
      <TrustBar locale={locale} practitionerName={shortName} />

      {/* Hero */}
      <ShopHero
        locale={locale}
        practitionerName={practitionerName}
        practitionerTitle={practitionerTitle}
        bookingUrl={bookingUrl}
        storeName={storeName}
        featuredProducts={products.slice(0, 3)}
      />

      {/* Category chips */}
      <CategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        locale={locale}
        onSelect={(slug) => updateParam('category', slug)}
      />

      {/* Products section */}
      <div style={{ padding: '40px 24px', background: 'var(--backdrop-primary, #f0fdf4)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, color: '#0f172a', margin: 0 }}>
                {isZh ? '医师精选产品' : <>{`Products curated by `}<span style={{ color: 'var(--primary, #166534)' }}>Our Practitioners</span></>}
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                <strong style={{ color: '#111' }}>{total}</strong> {isZh ? '件商品' : 'products'}
                {selectedCategory && categories.find(c => c.slug === selectedCategory) && (
                  <span style={{ marginLeft: 6, color: 'var(--primary, #166534)' }}>
                    · {isZh ? categories.find(c => c.slug === selectedCategory)?.name_zh : categories.find(c => c.slug === selectedCategory)?.name}
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={currentSort ?? 'best_selling'}
                onChange={(e) => updateParam('sort', e.target.value)}
                style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#475569', background: 'white', cursor: 'pointer' }}
              >
                <option value="best_selling">{isZh ? '热销优先' : 'Best Sellers'}</option>
                <option value="newest">{isZh ? '最新' : 'Newest'}</option>
                <option value="price_asc">{isZh ? '价格从低到高' : 'Price: Low to High'}</option>
                <option value="price_desc">{isZh ? '价格从高到低' : 'Price: High to Low'}</option>
                <option value="name_asc">{isZh ? '名称 A-Z' : 'Name A–Z'}</option>
              </select>
            </div>
          </div>

          {/* Product grid */}
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
              <p style={{ fontSize: 18 }}>{isZh ? '暂无产品' : 'No products found'}</p>
              <button onClick={() => updateParam('category', undefined)} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--primary, #166534)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                {isZh ? '查看全部' : 'View All Products'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Practitioner message */}
      <PractitionerSection
        locale={locale}
        practitionerName={shortName}
        practitionerTitle={practitionerTitle}
        products={products}
      />
    </div>
  );
}
