import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { getRequestSiteId } from '@/lib/content';
import { getGiftCardPublicView } from '@/lib/gift-cards/commerce';

type Props = {
  params: { locale: Locale };
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(
  source: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = source?.[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(amount || 0);
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}

export default async function GiftCardViewPage({ params, searchParams }: Props) {
  const locale = params.locale === 'zh' ? 'zh' : 'en';
  const token = String(readParam(searchParams, 'token') || '').trim();
  if (!token) notFound();

  const siteId = await getRequestSiteId();
  const data = await getGiftCardPublicView({ siteId, token });
  if (!data) {
    return (
      <main className="section on-light">
        <div className="container">
          <div className="card">
            <div className="card-body">
              <h1 style={{ marginBottom: 8 }}>
                {locale === 'zh' ? '礼品卡链接无效或已失效' : 'Gift card link is invalid'}
              </h1>
              <p className="small" style={{ marginBottom: 16 }}>
                {locale === 'zh'
                  ? '请联系 Spa Paradise 前台获取帮助。'
                  : 'Please contact Spa Paradise front desk for help.'}
              </p>
              <Link className="btn btn-primary btn-sm" href={`/${locale}/gift-cards`}>
                {locale === 'zh' ? '返回礼品卡页面' : 'Back to gift cards'}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const order = data.order;
  const recipient = data.recipient;
  const original = Number(order.original_amount ?? order.amount ?? 0);
  const redeemed = Number(order.redeemed_amount ?? 0);
  const remaining = Number(order.remaining_amount ?? Math.max(original - redeemed, 0));
  const history = order.redemptions || [];

  return (
    <main className="section on-light">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="card">
          <div className="card-body">
            <p className="eyebrow">
              {locale === 'zh' ? 'Spa Paradise 礼品卡' : 'Spa Paradise Gift Card'}
            </p>
            <h1 style={{ marginBottom: 10 }}>
              {locale === 'zh' ? '礼品卡详情' : 'Gift Card Details'}
            </h1>
            <p className="small" style={{ marginBottom: 18 }}>
              {locale === 'zh'
                ? `收礼人：${recipient.name}（${recipient.email}）`
                : `Recipient: ${recipient.name} (${recipient.email})`}
            </p>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
                background: '#fafafa',
              }}
            >
              <div className="small" style={{ marginBottom: 6 }}>
                {locale === 'zh' ? '礼券代码' : 'Certificate code'}
              </div>
              <div
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '1.4rem',
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                {order.certificate_code}
              </div>
              <div className="small" style={{ marginTop: 10 }}>
                {locale === 'zh' ? '产品' : 'Product'}: {order.product_ref}
              </div>
            </div>

            <div className="grid cols-3" style={{ marginBottom: 16 }}>
              <div className="card">
                <div className="card-body">
                  <div className="small">{locale === 'zh' ? '原始金额' : 'Original'}</div>
                  <div style={{ fontWeight: 700 }}>{fmtMoney(original, order.currency)}</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="small">{locale === 'zh' ? '已使用' : 'Redeemed'}</div>
                  <div style={{ fontWeight: 700 }}>{fmtMoney(redeemed, order.currency)}</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="small">{locale === 'zh' ? '剩余余额' : 'Remaining'}</div>
                  <div style={{ fontWeight: 700 }}>{fmtMoney(remaining, order.currency)}</div>
                </div>
              </div>
            </div>

            <div className="small" style={{ marginBottom: 8, fontWeight: 700 }}>
              {locale === 'zh' ? '使用记录' : 'Redemption history'} ({history.length})
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {history.length === 0 ? (
                <p className="small">
                  {locale === 'zh'
                    ? '当前还没有使用记录。'
                    : 'No redemption history yet.'}
                </p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="small">
                    {fmtMoney(entry.amount, entry.currency)} ·{' '}
                    {new Date(entry.redeemed_at).toLocaleString()}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <Link className="btn btn-primary btn-sm" href={`/${locale}/book`}>
                {locale === 'zh' ? '预约服务' : 'Book now'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
