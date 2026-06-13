import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { loadContent } from '@/lib/content';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n';

type GiftCardProduct = {
  id: string;
  type: 'denomination' | 'treatment';
  label: string;
  amount: number;
  active?: boolean;
  stripeLink?: string;
  stripePriceId?: string;
};

export type GiftCardOrderStatus = 'paid' | 'fulfilled' | 'redeemed';

export type GiftCardOrder = {
  id: string;
  site_id?: string;
  stripe_session_id: string;
  certificate_code: string;
  buyer_email: string;
  buyer_name: string;
  amount: number;
  currency: string;
  status: GiftCardOrderStatus;
  product_ref: string;
  product_kind: string;
  buyer_locale: 'en' | 'zh';
  created_at: string;
  updated_at: string;
  fulfilled_at?: string | null;
  redeemed_at?: string | null;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-05-27.dahlia',
    })
  : null;

function normalizeLocale(input?: string): 'en' | 'zh' {
  return input === 'zh' ? 'zh' : 'en';
}

async function loadGiftCards(siteId: string, locale: 'en' | 'zh') {
  const localCards =
    (await loadContent<{ items?: GiftCardProduct[] }>(
      siteId,
      locale as Locale,
      'collections/gift-cards.json'
    )) || {};
  const localItems = Array.isArray(localCards.items) ? localCards.items : [];
  if (localItems.length > 0) return localItems;
  if (locale === 'en') return [];
  const fallbackEn =
    (await loadContent<{ items?: GiftCardProduct[] }>(
      siteId,
      'en',
      'collections/gift-cards.json'
    )) || {};
  return Array.isArray(fallbackEn.items) ? fallbackEn.items : [];
}

async function loadGiftCardProduct(
  siteId: string,
  locale: 'en' | 'zh',
  productRef: string
) {
  const items = await loadGiftCards(siteId, locale);
  return items.find((item) => item.id === productRef) || null;
}

function generateCertificateCode() {
  const token = randomBytes(5).toString('hex').toUpperCase();
  return `SPA-${token}`;
}

function getLocalOrdersPath(siteId: string) {
  return path.join(process.cwd(), 'content', siteId, 'commerce', 'orders.json');
}

async function readLocalOrders(siteId: string): Promise<GiftCardOrder[]> {
  try {
    const filePath = getLocalOrdersPath(siteId);
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalOrders(siteId: string, orders: GiftCardOrder[]) {
  const filePath = getLocalOrdersPath(siteId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(orders, null, 2), 'utf-8');
}

async function upsertGiftCardOrder(args: {
  siteId: string;
  stripeSessionId: string;
  productRef: string;
  amount: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  buyerLocale: 'en' | 'zh';
}) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data: existing, error: existingError } = await supabase
      .from('orders')
      .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
      .eq('stripe_session_id', args.stripeSessionId)
      .maybeSingle();
    if (!existingError && existing) {
      return {
        created: false,
        order: existing as unknown as GiftCardOrder,
      };
    }
    const certificateCode = generateCertificateCode();
    const now = new Date().toISOString();
    const insertPayload = {
      site_id: args.siteId,
      stripe_session_id: args.stripeSessionId,
      product_ref: args.productRef,
      product_kind: 'gift_card',
      amount: args.amount,
      currency: args.currency,
      buyer_name: args.buyerName,
      buyer_email: args.buyerEmail,
      buyer_locale: args.buyerLocale,
      certificate_code: certificateCode,
      status: 'paid',
      created_at: now,
      updated_at: now,
    };
    const { data: inserted, error: insertError } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
      .single();
    if (!insertError && inserted) {
      return {
        created: true,
        order: inserted as unknown as GiftCardOrder,
      };
    }
    const { data: afterInsertExisting, error: afterInsertExistingError } =
      await supabase
        .from('orders')
        .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
        .eq('stripe_session_id', args.stripeSessionId)
        .maybeSingle();
    if (!afterInsertExistingError && afterInsertExisting) {
      return {
        created: false,
        order: afterInsertExisting as unknown as GiftCardOrder,
      };
    }
  }

  const localOrders = await readLocalOrders(args.siteId);
  const existingLocal = localOrders.find(
    (order) => order.stripe_session_id === args.stripeSessionId
  );
  if (existingLocal) {
    return { created: false, order: existingLocal };
  }
  const now = new Date().toISOString();
  const localOrder: GiftCardOrder = {
    id: `local_${Date.now()}_${randomBytes(3).toString('hex')}`,
    site_id: args.siteId,
    stripe_session_id: args.stripeSessionId,
    certificate_code: generateCertificateCode(),
    buyer_email: args.buyerEmail,
    buyer_name: args.buyerName,
    amount: args.amount,
    currency: args.currency,
    status: 'paid',
    product_ref: args.productRef,
    product_kind: 'gift_card',
    buyer_locale: args.buyerLocale,
    created_at: now,
    updated_at: now,
  };
  localOrders.push(localOrder);
  await writeLocalOrders(args.siteId, localOrders);
  return { created: true, order: localOrder };
}

function toIsoDateTimeStart(date: string) {
  return `${date}T00:00:00.000Z`;
}

function toIsoDateTimeEnd(date: string) {
  return `${date}T23:59:59.999Z`;
}

function inDateRange(
  valueIso: string,
  from?: string,
  to?: string
) {
  const ts = new Date(valueIso).getTime();
  if (!Number.isFinite(ts)) return false;
  if (from) {
    const fromTs = new Date(toIsoDateTimeStart(from)).getTime();
    if (ts < fromTs) return false;
  }
  if (to) {
    const toTs = new Date(toIsoDateTimeEnd(to)).getTime();
    if (ts > toTs) return false;
  }
  return true;
}

export async function listGiftCardOrders(args: {
  siteId: string;
  from?: string;
  to?: string;
  status?: GiftCardOrderStatus | 'all';
}) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    let query = supabase
      .from('orders')
      .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
      .eq('site_id', args.siteId)
      .eq('product_kind', 'gift_card');

    if (args.from) query = query.gte('created_at', toIsoDateTimeStart(args.from));
    if (args.to) query = query.lte('created_at', toIsoDateTimeEnd(args.to));
    if (args.status && args.status !== 'all') query = query.eq('status', args.status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data as GiftCardOrder[];
    }
  }

  const localOrders = await readLocalOrders(args.siteId);
  const filtered = localOrders.filter((order) => {
    if (args.status && args.status !== 'all' && order.status !== args.status) {
      return false;
    }
    return inDateRange(order.created_at, args.from, args.to);
  });
  filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return filtered;
}

export async function updateGiftCardOrderStatus(args: {
  siteId: string;
  orderId: string;
  status: GiftCardOrderStatus;
}) {
  const now = new Date().toISOString();
  const nextFields: Record<string, string | null> = {
    status: args.status,
    updated_at: now,
  };
  if (args.status === 'fulfilled') {
    nextFields.fulfilled_at = now;
  } else if (args.status === 'redeemed') {
    nextFields.fulfilled_at = now;
    nextFields.redeemed_at = now;
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update(nextFields)
      .eq('site_id', args.siteId)
      .eq('id', args.orderId)
      .eq('product_kind', 'gift_card')
      .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
      .maybeSingle();
    if (!error && data) {
      return data as GiftCardOrder;
    }
  }

  const localOrders = await readLocalOrders(args.siteId);
  const index = localOrders.findIndex((order) => order.id === args.orderId);
  if (index === -1) return null;
  const current = localOrders[index];
  const updated: GiftCardOrder = {
    ...current,
    status: args.status,
    updated_at: now,
    fulfilled_at:
      args.status === 'fulfilled' || args.status === 'redeemed'
        ? now
        : current.fulfilled_at || null,
    redeemed_at:
      args.status === 'redeemed' ? now : current.redeemed_at || null,
  };
  localOrders[index] = updated;
  await writeLocalOrders(args.siteId, localOrders);
  return updated;
}

async function sendGiftCardCertificateEmail(args: {
  siteId: string;
  locale: 'en' | 'zh';
  buyerName: string;
  buyerEmail: string;
  certificateCode: string;
  productLabel: string;
  amount: number;
  currency: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resendFrom =
    process.env.RESEND_FROM || 'No-Reply <no-reply@baamplatform.com>';
  const resend = new Resend(process.env.RESEND_API_KEY);
  const amountText = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (args.currency || 'usd').toUpperCase(),
  }).format(args.amount || 0);
  const isZh = args.locale === 'zh';
  const subject = isZh
    ? `您的天堂水疗礼品卡：${args.certificateCode}`
    : `Your Spa Paradise gift card: ${args.certificateCode}`;
  const lines = isZh
    ? [
        `${args.buyerName} 您好，`,
        '',
        '感谢您购买天堂水疗礼品卡。以下是您的礼券信息：',
        `礼券代码：${args.certificateCode}`,
        `礼品：${args.productLabel}`,
        `金额：${amountText}`,
        '',
        '使用方式：预约任意护理，在到店时出示此代码即可兑换。',
        '法律说明：礼品卡永不过期，不收取任何休眠费、服务费或维护费；未使用余额会保留在卡内。',
        '',
        '若需帮助，请致电 (845) 800-6600。',
      ]
    : [
        `Hi ${args.buyerName},`,
        '',
        'Thank you for purchasing a Spa Paradise gift card. Here are your certificate details:',
        `Certificate code: ${args.certificateCode}`,
        `Gift: ${args.productLabel}`,
        `Amount: ${amountText}`,
        '',
        'How to redeem: book any service and present this code at check-in.',
        'Legal notice: gift cards do not expire and carry no dormancy, service, or maintenance fees; any remaining balance stays on the card.',
        '',
        'Need help? Call us at (845) 800-6600.',
      ];

  try {
    await resend.emails.send({
      from: resendFrom,
      to: args.buyerEmail,
      subject,
      text: lines.join('\n'),
    });
  } catch (error) {
    console.warn('Gift card certificate email failed:', error);
  }

  const adminRecipients = (process.env.CONTACT_FALLBACK_TO || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (adminRecipients.length === 0) return;
  try {
    await resend.emails.send({
      from: resendFrom,
      to: adminRecipients,
      subject: `[Admin] Gift card paid — ${args.certificateCode}`,
      text: [
        `Site: ${args.siteId}`,
        `Buyer: ${args.buyerName}`,
        `Buyer email: ${args.buyerEmail}`,
        `Product: ${args.productLabel}`,
        `Amount: ${amountText}`,
        `Certificate: ${args.certificateCode}`,
      ].join('\n'),
      reply_to: args.buyerEmail,
    });
  } catch (error) {
    console.warn('Gift card admin email failed:', error);
  }
}

export async function createGiftCardCheckoutSession(args: {
  siteId: string;
  locale: string;
  productRef: string;
  origin: string;
}) {
  if (!stripe) {
    throw new Error('Gift card checkout is not configured yet.');
  }

  const locale = normalizeLocale(args.locale);
  const product = await loadGiftCardProduct(args.siteId, locale, args.productRef);
  if (!product || product.active === false) {
    throw new Error('Gift card product is unavailable.');
  }
  if (!Number.isFinite(Number(product.amount)) || Number(product.amount) <= 0) {
    throw new Error('Gift card amount is invalid.');
  }
  const amountCents = Math.round(Number(product.amount) * 100);
  const stripePriceId = String(product.stripePriceId || '').trim();

  const successUrl = `${args.origin}/${locale}/gift-cards?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${args.origin}/${locale}/gift-cards?checkout=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_creation: 'always',
    allow_promotion_codes: true,
    line_items: stripePriceId
      ? [
          {
            quantity: 1,
            price: stripePriceId,
          },
        ]
      : [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: {
                name: product.label,
                description:
                  product.type === 'treatment'
                    ? 'Spa Paradise treatment gift card'
                    : 'Spa Paradise denomination gift card',
              },
            },
          },
        ],
    metadata: {
      siteId: args.siteId,
      locale,
      productRef: product.id,
      productType: product.type,
      productLabel: product.label,
    },
  });

  if (!session.url) {
    throw new Error('Could not create checkout session.');
  }

  return { url: session.url };
}

export async function finalizeGiftCardSession(args: {
  sessionId: string;
  localeHint?: string;
}) {
  if (!stripe) {
    return { ok: false as const, message: 'Gift card checkout is not configured.' };
  }

  const session = await stripe.checkout.sessions.retrieve(args.sessionId);
  if (!session) {
    return { ok: false as const, message: 'Checkout session not found.' };
  }
  if (session.payment_status !== 'paid') {
    return { ok: false as const, message: 'Payment has not completed yet.' };
  }

  const metadata = session.metadata || {};
  const siteId = String(metadata.siteId || '').trim();
  const productRef = String(metadata.productRef || '').trim();
  const locale = normalizeLocale(
    String(metadata.locale || args.localeHint || 'en').trim()
  );
  if (!siteId || !productRef) {
    return {
      ok: false as const,
      message: 'Gift card checkout metadata is incomplete.',
    };
  }

  const product = await loadGiftCardProduct(siteId, locale, productRef);
  if (!product) {
    return { ok: false as const, message: 'Gift card product not found.' };
  }

  const buyerEmail = String(session.customer_details?.email || '').trim();
  if (!buyerEmail) {
    return { ok: false as const, message: 'Buyer email is missing from checkout.' };
  }
  const buyerName = String(session.customer_details?.name || 'Guest').trim();
  const amount =
    typeof session.amount_total === 'number'
      ? session.amount_total / 100
      : Number(product.amount);
  const currency = String(session.currency || 'usd').toLowerCase();

  const upserted = await upsertGiftCardOrder({
    siteId,
    stripeSessionId: session.id,
    productRef: product.id,
    amount,
    currency,
    buyerName,
    buyerEmail,
    buyerLocale: locale,
  });

  if (upserted.created) {
    await sendGiftCardCertificateEmail({
      siteId,
      locale,
      buyerName,
      buyerEmail,
      certificateCode: upserted.order.certificate_code,
      productLabel: product.label,
      amount,
      currency,
    });
  }

  return {
    ok: true as const,
    created: upserted.created,
    certificateCode: upserted.order.certificate_code,
    buyerEmail,
    productLabel: product.label,
  };
}
