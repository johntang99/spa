// S25 productGrid (GiftCardCommerce) — denominations | treatments. Renders gift products
// from the collection by productRefs. Internal checkout requires recipient info before
// redirecting to Stripe.
'use client';

import { useMemo, useState } from 'react';
import type { SectionCtx } from './index';
import { Media } from './index';
import { fmtPrice } from '@/lib/spa/catalog';
import Modal, { ModalFooter } from '@/components/ui/Modal';

type GiftProduct = {
  id: string;
  label: string;
  amount: number;
  active?: boolean;
  image?: string;
  stripeLink?: string;
};

export default function ProductGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const refs: string[] = data.productRefs || [];
  const products = refs
    .map((id) => (ctx.giftCards || []).find((p: GiftProduct) => p.id === id))
    .filter(Boolean) as GiftProduct[];
  const tr = (en: string, zh: string) => (ctx.locale === 'zh' ? zh : en);
  const [selectedProduct, setSelectedProduct] = useState<GiftProduct | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const hasProducts = useMemo(() => products.length > 0, [products]);
  if (!hasProducts) return null;

  function resetModal() {
    setSelectedProduct(null);
    setRecipientName('');
    setRecipientEmail('');
    setCheckoutError('');
    setSubmitting(false);
  }

  async function startInternalCheckout() {
    if (!selectedProduct) return;
    const name = recipientName.trim();
    const email = recipientEmail.trim().toLowerCase();
    if (!name || !email) {
      setCheckoutError(
        tr(
          'Please enter recipient name and email.',
          '请填写收礼人姓名和邮箱。'
        )
      );
      return;
    }
    setSubmitting(true);
    setCheckoutError('');
    try {
      const response = await fetch('/api/gift-cards/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productRef: selectedProduct.id,
          locale: ctx.locale,
          recipientName: name,
          recipientEmail: email,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) {
        throw new Error(
          payload?.message ||
            tr(
              'Could not start checkout right now.',
              '当前无法开始结账，请稍后重试。'
            )
        );
      }
      window.location.href = payload.url as string;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : tr(
              'Could not start checkout right now.',
              '当前无法开始结账，请稍后重试。'
            )
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <section
        id={data.variant === 'denominations' ? 'denominations' : undefined}
        className={`section on-${ctx.mode || 'light'}`}
      >
        <div className="container">
          {data.heading && (
            <h2 className="reveal" style={{ marginBottom: 6 }}>
              {data.heading}
            </h2>
          )}
          {data.intro && (
            <p className="reveal small" style={{ marginBottom: 20 }}>
              {data.intro}
            </p>
          )}
          <div className="grid cols-3">
            {products.map((p) => {
              const canBuy = p.active !== false;
              const externalStripeLink =
                typeof p.stripeLink === 'string' && /^https?:\/\//.test(p.stripeLink)
                  ? p.stripeLink
                  : '';
              return (
                <div key={p.id} className="card reveal">
                  <Media
                    image={p.image}
                    label={p.label}
                    phClass="ph ph-warm"
                    style={{ aspectRatio: '16/9' }}
                  />
                  <div className="card-body">
                    <h3 style={{ marginBottom: 4 }}>{p.label}</h3>
                    <p
                      className="num"
                      style={{
                        fontFamily: 'var(--s-font-display)',
                        fontSize: '1.6rem',
                        color: 'var(--candle-deep)',
                      }}
                    >
                      {fmtPrice(p.amount)}
                    </p>
                    {canBuy ? externalStripeLink ? (
                      <a
                        className="btn btn-primary btn-sm"
                        href={externalStripeLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {tr('Buy', '购买')}
                      </a>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setCheckoutError('');
                        }}
                      >
                        {tr('Buy', '购买')}
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-outline btn-sm" disabled>
                          {tr('Buy', '购买')}
                        </button>
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

      <Modal
        open={Boolean(selectedProduct)}
        onClose={resetModal}
        title={tr('Recipient details', '收礼人信息')}
        description={tr(
          'Enter who should receive this gift card email.',
          '请输入礼品卡收件人信息，我们会把礼券发送到该邮箱。'
        )}
        size="md"
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            {selectedProduct ? `${selectedProduct.label} · ${fmtPrice(selectedProduct.amount)}` : ''}
          </div>
          <label className="block text-sm text-gray-700">
            <span className="font-medium">
              {tr('Recipient name', '收礼人姓名')}
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={tr('e.g. Amy Chen', '例如：Amy Chen')}
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              maxLength={80}
            />
          </label>
          <label className="block text-sm text-gray-700">
            <span className="font-medium">
              {tr('Recipient email', '收礼人邮箱')}
            </span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={tr('name@example.com', 'name@example.com')}
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              maxLength={160}
            />
          </label>
          {checkoutError ? (
            <p className="text-sm text-rose-600">{checkoutError}</p>
          ) : null}
        </div>
        <ModalFooter>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={resetModal}
            disabled={submitting}
          >
            {tr('Cancel', '取消')}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={startInternalCheckout}
            disabled={submitting}
          >
            {submitting ? tr('Starting...', '跳转中...') : tr('Continue to checkout', '继续结账')}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
