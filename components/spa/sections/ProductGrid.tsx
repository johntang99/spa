// S25 productGrid (GiftCardCommerce) — denominations | treatments. Renders gift products
// from the collection by productRefs. Buy goes to either an explicit Stripe payment link
// (if configured) or the internal Stripe Checkout session endpoint.
import type { SectionCtx } from './index';
import { Media } from './index';
import { fmtPrice } from '@/lib/spa/catalog';

export default function ProductGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const refs: string[] = data.productRefs || [];
  const products = refs.map((id) => (ctx.giftCards || []).find((p: any) => p.id === id)).filter(Boolean);
  if (!products.length) return null;
  const tr = (en: string, zh: string) => (ctx.locale === 'zh' ? zh : en);

  return (
    <section id={data.variant === 'denominations' ? 'denominations' : undefined} className={`section on-${ctx.mode || 'light'}`}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ marginBottom: 6 }}>{data.heading}</h2>}
        {data.intro && <p className="reveal small" style={{ marginBottom: 20 }}>{data.intro}</p>}
        <div className="grid cols-3">
          {products.map((p: any) => {
            const canBuy = p.active !== false;
            const externalStripeLink =
              typeof p.stripeLink === 'string' && /^https?:\/\//.test(p.stripeLink)
                ? p.stripeLink
                : '';
            const checkoutLink = externalStripeLink
              ? externalStripeLink
              : `/api/gift-cards/checkout?productRef=${encodeURIComponent(
                  String(p.id || '')
                )}&locale=${encodeURIComponent(ctx.locale)}`;
            return (
              <div key={p.id} className="card reveal">
                <Media image={p.image} label={p.label} phClass="ph ph-warm" style={{ aspectRatio: '16/9' }} />
                <div className="card-body">
                  <h3 style={{ marginBottom: 4 }}>{p.label}</h3>
                  <p className="num" style={{ fontFamily: 'var(--s-font-display)', fontSize: '1.6rem', color: 'var(--candle-deep)' }}>{fmtPrice(p.amount)}</p>
                  {canBuy ? (
                    <a
                      className="btn btn-primary btn-sm"
                      href={checkoutLink}
                      target={externalStripeLink ? '_blank' : undefined}
                      rel={externalStripeLink ? 'noreferrer' : undefined}
                    >
                      {tr('Buy', '购买')}
                    </a>
                  ) : (
                    <>
                      <button className="btn btn-outline btn-sm" disabled>{tr('Buy', '购买')}</button>
                      <p className="small" style={{ marginTop: 8 }}>
                        {tr(
                          'This gift card is temporarily unavailable.',
                          '该礼品卡当前暂不可购买。'
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
