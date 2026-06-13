// Gift Cards (Phase 2B) — seasonal hero, denomination + treatment grids, how-it-works,
// corporate inquiry, FAQ, testimonials. Supports Stripe Checkout with post-payment
// certificate generation + buyer email fulfillment.
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import SectionRenderer from '@/components/spa/SectionRenderer';
import { loadSpaPage, spaPageMetadata } from '@/lib/spa/page-data';
import { finalizeGiftCardSession } from '@/lib/gift-cards/commerce';

interface PageProps {
  params: { locale: Locale };
  searchParams?: Record<string, string | string[] | undefined>;
}

function readParam(
  source: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = source?.[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

type GiftCardNotice = {
  tone: 'success' | 'warning' | 'error';
  title: string;
  body: string;
};

export async function generateMetadata({ params }: PageProps) {
  return spaPageMetadata('gift-cards', params.locale);
}

export default async function GiftCardsPage({ params, searchParams }: PageProps) {
  const locale = params.locale === 'zh' ? 'zh' : 'en';
  let notice: GiftCardNotice | null = null;
  const checkoutState = readParam(searchParams, 'checkout');
  const sessionId = readParam(searchParams, 'session_id');

  if (checkoutState === 'success' && sessionId) {
    try {
      const finalized = await finalizeGiftCardSession({
        sessionId,
        localeHint: locale,
      });
      if (finalized.ok) {
        notice = {
          tone: 'success',
          title:
            locale === 'zh' ? '礼品卡购买成功' : 'Gift card purchase successful',
          body:
            locale === 'zh'
              ? `礼券代码 ${finalized.certificateCode} 已发送到 ${finalized.buyerEmail}。`
              : `Certificate code ${finalized.certificateCode} was sent to ${finalized.buyerEmail}.`,
        };
      } else {
        notice = {
          tone: 'warning',
          title:
            locale === 'zh'
              ? '付款已完成，礼券处理中'
              : 'Payment received, certificate pending',
          body:
            locale === 'zh'
              ? `${finalized.message} 请致电 (845) 800-6600，我们会立即协助。`
              : `${finalized.message} Please call (845) 800-6600 and we will help right away.`,
        };
      }
    } catch (error) {
      notice = {
        tone: 'warning',
        title:
          locale === 'zh'
            ? '付款已完成，礼券处理中'
            : 'Payment received, certificate pending',
        body:
          locale === 'zh'
            ? '系统正在处理您的礼券。请致电 (845) 800-6600，我们会立即协助。'
            : 'We are processing your certificate. Please call (845) 800-6600 and we will help right away.',
      };
    }
  } else if (checkoutState === 'cancelled') {
    notice = {
      tone: 'warning',
      title: locale === 'zh' ? '购买已取消' : 'Purchase cancelled',
      body:
        locale === 'zh'
          ? '您已取消本次结账，礼品卡尚未购买。'
          : 'You cancelled checkout. No gift card was purchased.',
    };
  } else if (checkoutState === 'error') {
    const rawMessage = decodeURIComponent(readParam(searchParams, 'message') || '');
    notice = {
      tone: 'error',
      title:
        locale === 'zh'
          ? '礼品卡结账未成功'
          : 'Gift card checkout could not start',
      body:
        rawMessage ||
        (locale === 'zh'
          ? '请稍后重试，或致电 (845) 800-6600。'
          : 'Please try again or call (845) 800-6600.'),
    };
  }

  const { page, layout, ctx } = await loadSpaPage('gift-cards', params.locale);
  if (!page) notFound();
  return (
    <>
      {notice ? (
        <section className="section on-light" style={{ paddingBottom: 0 }}>
          <div className="container">
            <div
              style={{
                borderRadius: 'var(--radius-card)',
                border:
                  notice.tone === 'success'
                    ? '1px solid #86efac'
                    : notice.tone === 'error'
                      ? '1px solid #fca5a5'
                      : '1px solid #fde68a',
                background:
                  notice.tone === 'success'
                    ? '#f0fdf4'
                    : notice.tone === 'error'
                      ? '#fef2f2'
                      : '#fffbeb',
                color: '#1f2937',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{notice.title}</div>
              <div style={{ fontSize: '0.95rem' }}>{notice.body}</div>
            </div>
          </div>
        </section>
      ) : null}
      <SectionRenderer page={page} layout={layout} ctx={ctx} />
    </>
  );
}
