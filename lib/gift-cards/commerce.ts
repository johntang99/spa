import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { loadContent } from '@/lib/content';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteById } from '@/lib/sites';
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

export type GiftCardOrderStatus =
  | 'paid'
  | 'fulfilled'
  | 'redeemed'
  | 'refunded'
  | 'frozen';

export type GiftCardOrder = {
  id: string;
  site_id?: string;
  stripe_session_id: string;
  certificate_code: string;
  buyer_email: string;
  buyer_name: string;
  recipient_email?: string;
  recipient_name?: string;
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
  original_amount?: number;
  redeemed_amount?: number;
  remaining_amount?: number;
  redemption_count?: number;
  last_redeemed_at?: string | null;
  redemptions?: GiftCardRedemption[];
  gross_collected_amount?: number;
  net_collected_amount?: number;
  stripe_fee_amount?: number;
  reimbursement_due_amount?: number;
};

export type GiftCardRedemption = {
  id: string;
  order_id: string;
  certificate_code: string;
  amount: number;
  currency: string;
  redeemed_at: string;
  redeemed_by?: string | null;
  note?: string;
};

type GiftCardRecipientProfile = {
  id: string;
  order_id?: string;
  stripe_session_id?: string;
  certificate_code?: string;
  recipient_email: string;
  recipient_name: string;
  buyer_email?: string;
  buyer_name?: string;
  view_token?: string;
  updated_at: string;
};

type GiftCardFinanceRecord = {
  id: string;
  order_id?: string;
  stripe_session_id: string;
  payment_intent_id?: string;
  charge_id?: string;
  currency: string;
  gross_amount: number;
  net_amount: number;
  stripe_fee_amount: number;
  reimbursement_due_amount: number;
  refunded_amount?: number;
  status?: 'paid' | 'refunded' | 'frozen';
  updated_at: string;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-05-27.dahlia',
    })
  : null;

const REDEMPTIONS_CONTENT_PATH = 'commerce/gift-card-redemptions.json';
const REDEMPTIONS_CONTENT_LOCALE: 'en' = 'en';
const RECIPIENTS_CONTENT_PATH = 'commerce/gift-card-recipients.json';
const RECIPIENTS_CONTENT_LOCALE: 'en' = 'en';
const FINANCE_CONTENT_PATH = 'commerce/gift-card-finance.json';
const FINANCE_CONTENT_LOCALE: 'en' = 'en';

function toCents(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function fromCents(value: number) {
  return Math.max(0, Number((value / 100).toFixed(2)));
}

function isValidEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

function escapeHtml(input: string) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeBaseUrl(input: string) {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  return `https://${trimmed.replace(/\/+$/, '')}`;
}

async function resolveGiftCardBaseUrl(siteId: string) {
  const site = await getSiteById(siteId);
  const siteDomain = normalizeBaseUrl(site?.domain || '');
  if (siteDomain) return siteDomain;
  const envUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (envUrl && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(envUrl)) return envUrl;
  return 'https://www.spaparadisenewyork.com';
}

function normalizeLocale(input?: string): 'en' | 'zh' {
  return input === 'zh' ? 'zh' : 'en';
}

function normalizeStripeAccountId(input?: string | null) {
  const value = String(input || '').trim();
  return /^acct_[A-Za-z0-9]+$/.test(value) ? value : '';
}

function siteIdEnvSuffix(siteId: string) {
  return String(siteId || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function resolveConnectedStripeAccountId(siteId: string) {
  const site = await getSiteById(siteId);
  const fromSiteConfig = normalizeStripeAccountId(
    (site as { stripeConnectedAccountId?: string } | null)?.stripeConnectedAccountId
  );
  if (fromSiteConfig) return fromSiteConfig;

  const suffix = siteIdEnvSuffix(siteId);
  const siteScoped = normalizeStripeAccountId(
    process.env[`STRIPE_CONNECTED_ACCOUNT_ID_${suffix}`]
  );
  if (siteScoped) return siteScoped;

  return normalizeStripeAccountId(process.env.STRIPE_CONNECTED_ACCOUNT_ID);
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

async function loadGiftCardAmountMap(siteId: string) {
  const [enItems, zhItems] = await Promise.all([
    loadGiftCards(siteId, 'en'),
    loadGiftCards(siteId, 'zh'),
  ]);
  const map = new Map<string, number>();
  for (const item of [...enItems, ...zhItems]) {
    const amount = Number(item.amount || 0);
    if (!map.has(item.id) && Number.isFinite(amount) && amount > 0) {
      map.set(item.id, amount);
    }
  }
  return map;
}

function generateCertificateCode() {
  const token = randomBytes(5).toString('hex').toUpperCase();
  return `SPA-${token}`;
}

function getLocalOrdersPath(siteId: string) {
  return path.join(process.cwd(), 'content', siteId, 'commerce', 'orders.json');
}

function getLocalRedemptionsPath(siteId: string) {
  return path.join(
    process.cwd(),
    'content',
    siteId,
    'commerce',
    'gift-card-redemptions.json'
  );
}

function getLocalRecipientsPath(siteId: string) {
  return path.join(
    process.cwd(),
    'content',
    siteId,
    'commerce',
    'gift-card-recipients.json'
  );
}

function getLocalFinancePath(siteId: string) {
  return path.join(
    process.cwd(),
    'content',
    siteId,
    'commerce',
    'gift-card-finance.json'
  );
}

function normalizeRedemptionsPayload(payload: unknown): GiftCardRedemption[] {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? Array.isArray((payload as { redemptions?: unknown[] }).redemptions)
        ? (payload as { redemptions: unknown[] }).redemptions
        : Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items: unknown[] }).items
          : []
      : [];
  return source
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const amount = Number(row.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      const orderId = String(row.order_id || '').trim();
      const certificateCode = String(row.certificate_code || '').trim();
      const redeemedAt = String(row.redeemed_at || '').trim();
      if (!orderId || !certificateCode || !redeemedAt) return null;
      return {
        id:
          String(row.id || '').trim() ||
          `red_${redeemedAt}_${randomBytes(2).toString('hex')}`,
        order_id: orderId,
        certificate_code: certificateCode,
        amount,
        currency: String(row.currency || 'usd').toLowerCase(),
        redeemed_at: redeemedAt,
        redeemed_by: String(row.redeemed_by || '').trim() || null,
        note: String(row.note || '').trim(),
      } as GiftCardRedemption;
    })
    .filter((entry): entry is GiftCardRedemption => Boolean(entry));
}

function normalizeRecipientsPayload(payload: unknown): GiftCardRecipientProfile[] {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? Array.isArray((payload as { recipients?: unknown[] }).recipients)
        ? (payload as { recipients: unknown[] }).recipients
        : Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items: unknown[] }).items
          : []
      : [];
  return source
    .map<GiftCardRecipientProfile | null>((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const recipientEmail = String(row.recipient_email || '').trim().toLowerCase();
      if (!isValidEmail(recipientEmail)) return null;
      const recipientName = String(row.recipient_name || '').trim() || 'Guest';
      const profile: GiftCardRecipientProfile = {
        id:
          String(row.id || '').trim() ||
          `rcp_${Date.now()}_${randomBytes(2).toString('hex')}`,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        updated_at:
          String(row.updated_at || '').trim() || new Date().toISOString(),
      };
      const orderId = String(row.order_id || '').trim();
      const sessionId = String(row.stripe_session_id || '').trim();
      const certificateCode = String(row.certificate_code || '').trim();
      const buyerEmail = String(row.buyer_email || '').trim();
      const buyerName = String(row.buyer_name || '').trim();
      const viewToken = String(row.view_token || '').trim();
      if (orderId) profile.order_id = orderId;
      if (sessionId) profile.stripe_session_id = sessionId;
      if (certificateCode) profile.certificate_code = certificateCode;
      if (buyerEmail) profile.buyer_email = buyerEmail;
      if (buyerName) profile.buyer_name = buyerName;
      if (viewToken) profile.view_token = viewToken;
      return profile;
    })
    .filter((entry): entry is GiftCardRecipientProfile => Boolean(entry));
}

function normalizeFinancePayload(payload: unknown): GiftCardFinanceRecord[] {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? Array.isArray((payload as { records?: unknown[] }).records)
        ? (payload as { records: unknown[] }).records
        : Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items: unknown[] }).items
          : []
      : [];
  return source
    .map<GiftCardFinanceRecord | null>((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const sessionId = String(row.stripe_session_id || '').trim();
      if (!sessionId) return null;
      const grossAmount = Number(row.gross_amount || 0);
      const netAmount = Number(row.net_amount || 0);
      const feeAmount = Number(row.stripe_fee_amount || 0);
      const reimbursement = Number(row.reimbursement_due_amount || feeAmount || 0);
      const record: GiftCardFinanceRecord = {
        id:
          String(row.id || '').trim() ||
          `fin_${Date.now()}_${randomBytes(2).toString('hex')}`,
        stripe_session_id: sessionId,
        currency: String(row.currency || 'usd').toLowerCase(),
        gross_amount: Number.isFinite(grossAmount) ? grossAmount : 0,
        net_amount: Number.isFinite(netAmount) ? netAmount : 0,
        stripe_fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        reimbursement_due_amount: Number.isFinite(reimbursement)
          ? reimbursement
          : 0,
        updated_at:
          String(row.updated_at || '').trim() || new Date().toISOString(),
      };
      const orderId = String(row.order_id || '').trim();
      const paymentIntentId = String(row.payment_intent_id || '').trim();
      const chargeId = String(row.charge_id || '').trim();
      const refundedAmount = Number(row.refunded_amount);
      const status = String(row.status || '').trim();
      if (orderId) record.order_id = orderId;
      if (paymentIntentId) record.payment_intent_id = paymentIntentId;
      if (chargeId) record.charge_id = chargeId;
      if (Number.isFinite(refundedAmount) && refundedAmount >= 0) {
        record.refunded_amount = refundedAmount;
      }
      if (status === 'paid' || status === 'refunded' || status === 'frozen') {
        record.status = status;
      }
      return record;
    })
    .filter((entry): entry is GiftCardFinanceRecord => Boolean(entry));
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

async function readLocalRedemptions(siteId: string): Promise<GiftCardRedemption[]> {
  try {
    const filePath = getLocalRedemptionsPath(siteId);
    const raw = await fs.readFile(filePath, 'utf-8');
    return normalizeRedemptionsPayload(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function writeLocalRedemptions(
  siteId: string,
  redemptions: GiftCardRedemption[]
) {
  const filePath = getLocalRedemptionsPath(siteId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify({ redemptions }, null, 2),
    'utf-8'
  );
}

async function readLocalRecipients(
  siteId: string
): Promise<GiftCardRecipientProfile[]> {
  try {
    const filePath = getLocalRecipientsPath(siteId);
    const raw = await fs.readFile(filePath, 'utf-8');
    return normalizeRecipientsPayload(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function writeLocalRecipients(
  siteId: string,
  recipients: GiftCardRecipientProfile[]
) {
  const filePath = getLocalRecipientsPath(siteId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify({ recipients }, null, 2),
    'utf-8'
  );
}

async function readLocalFinance(siteId: string): Promise<GiftCardFinanceRecord[]> {
  try {
    const filePath = getLocalFinancePath(siteId);
    const raw = await fs.readFile(filePath, 'utf-8');
    return normalizeFinancePayload(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function writeLocalFinance(
  siteId: string,
  records: GiftCardFinanceRecord[]
) {
  const filePath = getLocalFinancePath(siteId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify({ records }, null, 2), 'utf-8');
}

async function readGiftCardRedemptions(siteId: string) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('content_entries')
      .select('data')
      .eq('site_id', siteId)
      .eq('locale', REDEMPTIONS_CONTENT_LOCALE)
      .eq('path', REDEMPTIONS_CONTENT_PATH)
      .maybeSingle();
    if (!error && data) {
      return normalizeRedemptionsPayload(
        (data as { data?: unknown }).data
      );
    }
  }
  return readLocalRedemptions(siteId);
}

async function writeGiftCardRedemptions(
  siteId: string,
  redemptions: GiftCardRedemption[]
) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase
      .from('content_entries')
      .upsert(
        {
          site_id: siteId,
          locale: REDEMPTIONS_CONTENT_LOCALE,
          path: REDEMPTIONS_CONTENT_PATH,
          data: { redemptions },
          updated_by: 'gift-card-system',
        },
        { onConflict: 'site_id,locale,path' }
      );
    if (!error) return;
  }
  await writeLocalRedemptions(siteId, redemptions);
}

async function readGiftCardRecipients(siteId: string) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('content_entries')
      .select('data')
      .eq('site_id', siteId)
      .eq('locale', RECIPIENTS_CONTENT_LOCALE)
      .eq('path', RECIPIENTS_CONTENT_PATH)
      .maybeSingle();
    if (!error && data) {
      return normalizeRecipientsPayload((data as { data?: unknown }).data);
    }
  }
  return readLocalRecipients(siteId);
}

async function writeGiftCardRecipients(
  siteId: string,
  recipients: GiftCardRecipientProfile[]
) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase
      .from('content_entries')
      .upsert(
        {
          site_id: siteId,
          locale: RECIPIENTS_CONTENT_LOCALE,
          path: RECIPIENTS_CONTENT_PATH,
          data: { recipients },
          updated_by: 'gift-card-system',
        },
        { onConflict: 'site_id,locale,path' }
      );
    if (!error) return;
  }
  await writeLocalRecipients(siteId, recipients);
}

async function readGiftCardFinance(siteId: string) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('content_entries')
      .select('data')
      .eq('site_id', siteId)
      .eq('locale', FINANCE_CONTENT_LOCALE)
      .eq('path', FINANCE_CONTENT_PATH)
      .maybeSingle();
    if (!error && data) {
      return normalizeFinancePayload((data as { data?: unknown }).data);
    }
  }
  return readLocalFinance(siteId);
}

async function writeGiftCardFinance(siteId: string, records: GiftCardFinanceRecord[]) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase
      .from('content_entries')
      .upsert(
        {
          site_id: siteId,
          locale: FINANCE_CONTENT_LOCALE,
          path: FINANCE_CONTENT_PATH,
          data: { records },
          updated_by: 'gift-card-system',
        },
        { onConflict: 'site_id,locale,path' }
      );
    if (!error) return;
  }
  await writeLocalFinance(siteId, records);
}

async function upsertGiftCardRecipientProfile(args: {
  siteId: string;
  orderId: string;
  stripeSessionId: string;
  certificateCode: string;
  recipientName: string;
  recipientEmail: string;
  buyerName: string;
  buyerEmail: string;
}) {
  const recipients = await readGiftCardRecipients(args.siteId);
  const normalizedRecipientEmail = args.recipientEmail.trim().toLowerCase();
  const matchIndex = recipients.findIndex(
    (entry) =>
      entry.order_id === args.orderId ||
      entry.stripe_session_id === args.stripeSessionId ||
      (entry.certificate_code &&
        entry.certificate_code === args.certificateCode)
  );
  const now = new Date().toISOString();
  const next: GiftCardRecipientProfile = {
    id:
      matchIndex >= 0
        ? recipients[matchIndex].id
        : `rcp_${Date.now()}_${randomBytes(3).toString('hex')}`,
    order_id: args.orderId,
    stripe_session_id: args.stripeSessionId,
    certificate_code: args.certificateCode,
    recipient_email: normalizedRecipientEmail,
    recipient_name: args.recipientName.trim() || 'Guest',
    buyer_email: args.buyerEmail.trim().toLowerCase(),
    buyer_name: args.buyerName.trim() || 'Guest',
    view_token:
      matchIndex >= 0 && recipients[matchIndex].view_token
        ? recipients[matchIndex].view_token
        : `gcv_${randomBytes(18).toString('hex')}`,
    updated_at: now,
  };
  if (matchIndex >= 0) {
    recipients[matchIndex] = next;
  } else {
    recipients.push(next);
  }
  await writeGiftCardRecipients(args.siteId, recipients);
  return next;
}

async function buildGiftCardViewUrl(args: {
  siteId: string;
  locale: 'en' | 'zh';
  viewToken?: string;
}) {
  const token = String(args.viewToken || '').trim();
  if (!token) return '';
  const baseUrl = await resolveGiftCardBaseUrl(args.siteId);
  return `${baseUrl}/${args.locale}/gift-cards/view?token=${encodeURIComponent(
    token
  )}`;
}

export async function getGiftCardPublicView(args: {
  siteId: string;
  token: string;
}) {
  const token = String(args.token || '').trim();
  if (!token) return null;
  const recipients = await readGiftCardRecipients(args.siteId);
  const recipient = recipients.find((entry) => entry.view_token === token);
  if (!recipient) return null;
  const orders = await listGiftCardOrders({
    siteId: args.siteId,
    status: 'all',
  });
  const order = orders.find((entry) => {
    if (recipient.order_id && entry.id === recipient.order_id) return true;
    if (
      recipient.stripe_session_id &&
      entry.stripe_session_id === recipient.stripe_session_id
    ) {
      return true;
    }
    if (
      recipient.certificate_code &&
      entry.certificate_code === recipient.certificate_code
    ) {
      return true;
    }
    return false;
  });
  if (!order) return null;
  return {
    order,
    recipient: {
      name:
        recipient.recipient_name || order.recipient_name || order.buyer_name || 'Guest',
      email:
        recipient.recipient_email ||
        order.recipient_email ||
        order.buyer_email ||
        '',
    },
  };
}

async function upsertGiftCardFinanceRecord(args: {
  siteId: string;
  orderId?: string;
  stripeSessionId: string;
  paymentIntentId?: string;
  chargeId?: string;
  currency: string;
  grossAmount: number;
  netAmount: number;
  stripeFeeAmount: number;
  reimbursementDueAmount?: number;
  refundedAmount?: number;
  status?: 'paid' | 'refunded' | 'frozen';
}) {
  const records = await readGiftCardFinance(args.siteId);
  const matchIndex = records.findIndex(
    (entry) =>
      entry.stripe_session_id === args.stripeSessionId ||
      (args.orderId && entry.order_id === args.orderId) ||
      (args.paymentIntentId &&
        entry.payment_intent_id === args.paymentIntentId) ||
      (args.chargeId && entry.charge_id === args.chargeId)
  );
  const now = new Date().toISOString();
  const next: GiftCardFinanceRecord = {
    id:
      matchIndex >= 0
        ? records[matchIndex].id
        : `fin_${Date.now()}_${randomBytes(3).toString('hex')}`,
    stripe_session_id: args.stripeSessionId,
    currency: String(args.currency || 'usd').toLowerCase(),
    gross_amount: Number(args.grossAmount || 0),
    net_amount: Number(args.netAmount || 0),
    stripe_fee_amount: Number(args.stripeFeeAmount || 0),
    reimbursement_due_amount: Number(
      args.reimbursementDueAmount ?? args.stripeFeeAmount ?? 0
    ),
    updated_at: now,
  };
  if (args.orderId) next.order_id = args.orderId;
  if (args.paymentIntentId) next.payment_intent_id = args.paymentIntentId;
  if (args.chargeId) next.charge_id = args.chargeId;
  if (Number.isFinite(Number(args.refundedAmount))) {
    next.refunded_amount = Number(args.refundedAmount || 0);
  }
  if (args.status) next.status = args.status;
  if (matchIndex >= 0) {
    records[matchIndex] = {
      ...records[matchIndex],
      ...next,
    };
  } else {
    records.push(next);
  }
  await writeGiftCardFinance(args.siteId, records);
  return next;
}

async function findStripeSessionIdByPaymentIntent(args: {
  paymentIntentId: string;
  stripeAccountId?: string;
}) {
  if (!stripe) return '';
  try {
    const requestOptions = args.stripeAccountId
      ? { stripeAccount: args.stripeAccountId }
      : undefined;
    const sessions = await stripe.checkout.sessions.list(
      {
        payment_intent: args.paymentIntentId,
        limit: 1,
      },
      requestOptions
    );
    return String(sessions.data?.[0]?.id || '').trim();
  } catch {
    return '';
  }
}

async function getGiftCardViewTokenForOrder(
  siteId: string,
  order: GiftCardOrder
) {
  const recipients = await readGiftCardRecipients(siteId);
  const found = recipients.find((entry) => {
    if (entry.order_id && entry.order_id === order.id) return true;
    if (
      entry.stripe_session_id &&
      entry.stripe_session_id === order.stripe_session_id
    ) {
      return true;
    }
    if (
      entry.certificate_code &&
      entry.certificate_code === order.certificate_code
    ) {
      return true;
    }
    return false;
  });
  return String(found?.view_token || '').trim();
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
  recipientName?: string;
  recipientEmail?: string;
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
    recipient_name: String(args.recipientName || '').trim() || args.buyerName,
    recipient_email: String(args.recipientEmail || '').trim() || args.buyerEmail,
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

async function enrichGiftCardOrders(
  siteId: string,
  orders: GiftCardOrder[]
) {
  if (orders.length === 0) return [];
  const [redemptions, recipients, finances, amountMap] = await Promise.all([
    readGiftCardRedemptions(siteId),
    readGiftCardRecipients(siteId),
    readGiftCardFinance(siteId),
    loadGiftCardAmountMap(siteId),
  ]);
  const byOrderId = new Map<string, GiftCardRedemption[]>();
  const byCertificate = new Map<string, GiftCardRedemption[]>();
  for (const redemption of redemptions) {
    const listByOrder = byOrderId.get(redemption.order_id) || [];
    listByOrder.push(redemption);
    byOrderId.set(redemption.order_id, listByOrder);

    const cert = redemption.certificate_code;
    const listByCode = byCertificate.get(cert) || [];
    listByCode.push(redemption);
    byCertificate.set(cert, listByCode);
  }
  const recipientByOrder = new Map<string, GiftCardRecipientProfile>();
  const recipientBySession = new Map<string, GiftCardRecipientProfile>();
  const recipientByCertificate = new Map<string, GiftCardRecipientProfile>();
  for (const recipient of recipients) {
    if (recipient.order_id) recipientByOrder.set(recipient.order_id, recipient);
    if (recipient.stripe_session_id) {
      recipientBySession.set(recipient.stripe_session_id, recipient);
    }
    if (recipient.certificate_code) {
      recipientByCertificate.set(recipient.certificate_code, recipient);
    }
  }
  const financeByOrder = new Map<string, GiftCardFinanceRecord>();
  const financeBySession = new Map<string, GiftCardFinanceRecord>();
  for (const finance of finances) {
    if (finance.order_id) financeByOrder.set(finance.order_id, finance);
    if (finance.stripe_session_id) {
      financeBySession.set(finance.stripe_session_id, finance);
    }
  }

  return orders.map((order) => {
    const faceAmount =
      Number(order.amount || 0) > 0
        ? Number(order.amount || 0)
        : Number(amountMap.get(order.product_ref) || 0);
    const redemptionsForOrder =
      byOrderId.get(order.id) ||
      byCertificate.get(order.certificate_code) ||
      [];
    const redeemedCents = redemptionsForOrder.reduce(
      (sum, row) => sum + toCents(row.amount),
      0
    );
    const originalCents = toCents(faceAmount);
    const remainingCents = Math.max(originalCents - redeemedCents, 0);
    let status = order.status;
    if (status !== 'refunded' && status !== 'frozen') {
      if (redeemedCents > 0 && remainingCents <= 0) {
        status = 'redeemed';
      } else if (redeemedCents > 0 && status !== 'redeemed') {
        status = 'fulfilled';
      }
    }
    const sortedRedemptions = [...redemptionsForOrder].sort((a, b) =>
      b.redeemed_at.localeCompare(a.redeemed_at)
    );
    const lastRedeemedAt =
      sortedRedemptions.length > 0 ? sortedRedemptions[0].redeemed_at : null;
    const recipient =
      recipientByOrder.get(order.id) ||
      recipientBySession.get(order.stripe_session_id) ||
      recipientByCertificate.get(order.certificate_code);
    const recipientName =
      String(recipient?.recipient_name || '').trim() || order.buyer_name || 'Guest';
    const recipientEmailRaw =
      String(recipient?.recipient_email || '').trim() ||
      String(order.buyer_email || '').trim();
    const recipientEmail =
      isValidEmail(recipientEmailRaw) ? recipientEmailRaw.toLowerCase() : '';
    const finance =
      financeByOrder.get(order.id) || financeBySession.get(order.stripe_session_id);
    const grossCollected = Number(
      finance?.gross_amount ?? order.amount ?? faceAmount
    );
    const netCollected = Number(finance?.net_amount ?? order.amount ?? faceAmount);
    const stripeFee = Number(finance?.stripe_fee_amount || 0);
    const reimbursementDue = Number(
      finance?.reimbursement_due_amount ?? stripeFee ?? 0
    );
    return {
      ...order,
      amount: faceAmount || Number(order.amount || 0),
      status,
      recipient_name: recipientName,
      recipient_email: recipientEmail || order.buyer_email,
      gross_collected_amount: grossCollected,
      net_collected_amount: netCollected,
      stripe_fee_amount: stripeFee,
      reimbursement_due_amount: reimbursementDue,
      original_amount: fromCents(originalCents),
      redeemed_amount: fromCents(redeemedCents),
      remaining_amount: fromCents(remainingCents),
      redemption_count: sortedRedemptions.length,
      last_redeemed_at: lastRedeemedAt,
      redemptions: sortedRedemptions,
    } satisfies GiftCardOrder;
  });
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
  let orders: GiftCardOrder[] = [];
  if (supabase) {
    let query = supabase
      .from('orders')
      .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
      .eq('site_id', args.siteId)
      .eq('product_kind', 'gift_card');

    if (args.from) query = query.gte('created_at', toIsoDateTimeStart(args.from));
    if (args.to) query = query.lte('created_at', toIsoDateTimeEnd(args.to));

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      orders = data as GiftCardOrder[];
    }
  }

  if (orders.length === 0) {
    const localOrders = await readLocalOrders(args.siteId);
    orders = localOrders.filter((order) =>
      inDateRange(order.created_at, args.from, args.to)
    );
    orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const enriched = await enrichGiftCardOrders(args.siteId, orders);
  if (!args.status || args.status === 'all') {
    return enriched;
  }
  return enriched.filter((order) => order.status === args.status);
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
      const [enriched] = await enrichGiftCardOrders(args.siteId, [
        data as GiftCardOrder,
      ]);
      return enriched || (data as GiftCardOrder);
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
  const [enriched] = await enrichGiftCardOrders(args.siteId, [updated]);
  return enriched || updated;
}

async function getGiftCardOrderById(args: { siteId: string; orderId: string }) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
      .eq('site_id', args.siteId)
      .eq('id', args.orderId)
      .eq('product_kind', 'gift_card')
      .maybeSingle();
    if (!error && data) {
      const [enriched] = await enrichGiftCardOrders(args.siteId, [
        data as GiftCardOrder,
      ]);
      return enriched || (data as GiftCardOrder);
    }
  }

  const localOrders = await readLocalOrders(args.siteId);
  const found = localOrders.find((order) => order.id === args.orderId);
  if (!found) return null;
  const [enriched] = await enrichGiftCardOrders(args.siteId, [found]);
  return enriched || found;
}

async function getGiftCardOrderBySessionId(args: {
  siteId: string;
  stripeSessionId: string;
}) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('id,site_id,stripe_session_id,certificate_code,buyer_email,buyer_name,amount,currency,status,product_ref,product_kind,buyer_locale,created_at,updated_at,fulfilled_at,redeemed_at')
      .eq('site_id', args.siteId)
      .eq('stripe_session_id', args.stripeSessionId)
      .eq('product_kind', 'gift_card')
      .maybeSingle();
    if (!error && data) {
      const [enriched] = await enrichGiftCardOrders(args.siteId, [
        data as GiftCardOrder,
      ]);
      return enriched || (data as GiftCardOrder);
    }
  }
  const localOrders = await readLocalOrders(args.siteId);
  const found = localOrders.find(
    (order) => order.stripe_session_id === args.stripeSessionId
  );
  if (!found) return null;
  const [enriched] = await enrichGiftCardOrders(args.siteId, [found]);
  return enriched || found;
}

export async function redeemGiftCardOrder(args: {
  siteId: string;
  orderId: string;
  amount: number;
  note?: string;
  redeemedBy?: string;
}) {
  const order = await getGiftCardOrderById({
    siteId: args.siteId,
    orderId: args.orderId,
  });
  if (!order) {
    return { ok: false as const, message: 'Gift card order not found.' };
  }
  const amountCents = toCents(args.amount);
  if (amountCents <= 0) {
    return { ok: false as const, message: 'Redeem amount must be greater than zero.' };
  }

  const remainingCents = toCents(
    Number(order.remaining_amount ?? order.amount ?? 0)
  );
  if (remainingCents <= 0) {
    return { ok: false as const, message: 'Gift card is already fully redeemed.' };
  }
  if (amountCents > remainingCents) {
    return {
      ok: false as const,
      message: 'Redeem amount cannot exceed remaining balance.',
    };
  }

  const now = new Date().toISOString();
  const redemptions = await readGiftCardRedemptions(args.siteId);
  const redemption: GiftCardRedemption = {
    id: `red_${Date.now()}_${randomBytes(3).toString('hex')}`,
    order_id: order.id,
    certificate_code: order.certificate_code,
    amount: fromCents(amountCents),
    currency: String(order.currency || 'usd').toLowerCase(),
    redeemed_at: now,
    redeemed_by: args.redeemedBy || null,
    note: String(args.note || '').trim(),
  };
  redemptions.push(redemption);
  await writeGiftCardRedemptions(args.siteId, redemptions);

  const remainingAfterCents = Math.max(remainingCents - amountCents, 0);
  const nextStatus: GiftCardOrderStatus =
    remainingAfterCents <= 0 ? 'redeemed' : 'fulfilled';
  const updated = await updateGiftCardOrderStatus({
    siteId: args.siteId,
    orderId: order.id,
    status: nextStatus,
  });
  if (!updated) {
    return { ok: false as const, message: 'Could not update gift card status.' };
  }

  try {
    const recipientName =
      String(updated.recipient_name || '').trim() || updated.buyer_name || 'Guest';
    const recipientEmailRaw =
      String(updated.recipient_email || '').trim().toLowerCase() ||
      String(updated.buyer_email || '').trim().toLowerCase();
    if (isValidEmail(recipientEmailRaw)) {
      const viewToken = await getGiftCardViewTokenForOrder(args.siteId, updated);
      const viewUrl = await buildGiftCardViewUrl({
        siteId: args.siteId,
        locale: updated.buyer_locale || 'en',
        viewToken,
      });
      await sendGiftCardRedemptionEmail({
        locale: updated.buyer_locale || 'en',
        buyerName: updated.buyer_name || 'Guest',
        buyerEmail: updated.buyer_email || '',
        recipientName,
        recipientEmail: recipientEmailRaw,
        certificateCode: updated.certificate_code,
        redeemedAmount: fromCents(amountCents),
        remainingAmount: Number(updated.remaining_amount ?? 0),
        currency: updated.currency || 'usd',
        note: redemption.note,
        viewUrl,
      });
    }
  } catch (error) {
    console.warn('Gift card redemption notification failed:', error);
  }

  return {
    ok: true as const,
    order: updated,
    redemption,
  };
}

export async function resendGiftCardCertificateEmail(args: {
  siteId: string;
  orderId: string;
  localeHint?: 'en' | 'zh';
}) {
  const order = await getGiftCardOrderById({
    siteId: args.siteId,
    orderId: args.orderId,
  });
  if (!order) {
    return { ok: false as const, message: 'Gift card order not found.' };
  }

  const locale = order.buyer_locale || args.localeHint || 'en';
  const product = await loadGiftCardProduct(
    args.siteId,
    locale === 'zh' ? 'zh' : 'en',
    order.product_ref
  );
  const productLabel = product?.label || order.product_ref;
  const recipientName =
    String(order.recipient_name || '').trim() || order.buyer_name || 'Guest';
  const recipientEmail =
    String(order.recipient_email || '').trim().toLowerCase() ||
    String(order.buyer_email || '').trim().toLowerCase();
  if (!isValidEmail(recipientEmail)) {
    return { ok: false as const, message: 'Recipient email is missing or invalid.' };
  }
  const viewToken = await getGiftCardViewTokenForOrder(args.siteId, order);
  const viewUrl = await buildGiftCardViewUrl({
    siteId: args.siteId,
    locale: locale === 'zh' ? 'zh' : 'en',
    viewToken,
  });
  await sendGiftCardCertificateEmail({
    siteId: args.siteId,
    locale: locale === 'zh' ? 'zh' : 'en',
    buyerName: order.buyer_name || 'Guest',
    buyerEmail: order.buyer_email || '',
    recipientName,
    recipientEmail,
    certificateCode: order.certificate_code,
    productLabel,
    amount: Number(order.original_amount ?? order.amount ?? 0),
    currency: order.currency || 'usd',
    viewUrl,
  });
  return { ok: true as const };
}

export async function handleGiftCardChargeEvent(args: {
  siteId?: string;
  stripeAccountId?: string;
  paymentIntentId?: string;
  chargeId?: string;
  status: 'refunded' | 'frozen';
  refundedAmount?: number;
}) {
  const stripeAccountId = normalizeStripeAccountId(args.stripeAccountId);
  const requestOptions = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined;
  let paymentIntentId = String(args.paymentIntentId || '').trim();
  const chargeId = String(args.chargeId || '').trim();
  let sessionId = '';
  if (paymentIntentId) {
    sessionId = await findStripeSessionIdByPaymentIntent({
      paymentIntentId,
      stripeAccountId: stripeAccountId || undefined,
    });
  }
  if (!sessionId && chargeId && stripe) {
    try {
      const charge = await stripe.charges.retrieve(chargeId, {}, requestOptions);
      const chargePaymentIntent =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : String(charge.payment_intent || '');
      if (chargePaymentIntent) {
        paymentIntentId = paymentIntentId || chargePaymentIntent;
        sessionId = await findStripeSessionIdByPaymentIntent({
          paymentIntentId: chargePaymentIntent,
          stripeAccountId: stripeAccountId || undefined,
        });
      }
    } catch {
      // ignore
    }
  }
  if (!sessionId) {
    return { ok: false as const, message: 'Checkout session not found for event.' };
  }
  let resolvedSiteId = String(args.siteId || '').trim();
  try {
    if (stripe) {
      const session = await stripe.checkout.sessions.retrieve(
        sessionId,
        {},
        requestOptions
      );
      const metadataSiteId = String(session.metadata?.siteId || '').trim();
      if (metadataSiteId) {
        resolvedSiteId = metadataSiteId;
      }
    }
  } catch {
    // keep fallback siteId passed from caller
  }
  if (!resolvedSiteId) {
    return { ok: false as const, message: 'Site id is missing for charge event.' };
  }
  const order = await getGiftCardOrderBySessionId({
    siteId: resolvedSiteId,
    stripeSessionId: sessionId,
  });
  if (!order) {
    return { ok: false as const, message: 'Gift card order not found for event.' };
  }

  await updateGiftCardOrderStatus({
    siteId: resolvedSiteId,
    orderId: order.id,
    status: args.status,
  });
  await upsertGiftCardFinanceRecord({
    siteId: resolvedSiteId,
    orderId: order.id,
    stripeSessionId: sessionId,
    paymentIntentId: paymentIntentId || undefined,
    chargeId: chargeId || undefined,
    currency: order.currency || 'usd',
    grossAmount: Number(order.gross_collected_amount ?? 0),
    netAmount: Number(order.net_collected_amount ?? 0),
    stripeFeeAmount: Number(order.stripe_fee_amount ?? 0),
    reimbursementDueAmount:
      args.status === 'refunded' ? 0 : Number(order.reimbursement_due_amount ?? 0),
    refundedAmount:
      Number(args.refundedAmount ?? 0) > 0 ? Number(args.refundedAmount || 0) : undefined,
    status: args.status,
  });

  return {
    ok: true as const,
    orderId: order.id,
    stripeSessionId: sessionId,
  };
}

async function sendGiftCardCertificateEmail(args: {
  siteId: string;
  locale: 'en' | 'zh';
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
  certificateCode: string;
  productLabel: string;
  amount: number;
  currency: string;
  viewUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resendFrom =
    process.env.RESEND_FROM || 'Spa Paradise <no-reply@baamplatform.com>';
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
        `${args.recipientName} 您好，`,
        '',
        '您收到了一张天堂水疗礼品卡，以下是礼券信息：',
        `礼券代码：${args.certificateCode}`,
        `礼品：${args.productLabel}`,
        `金额：${amountText}`,
        '',
        '使用方式：预约任意护理，在到店时出示此代码即可兑换。',
        '法律说明：礼品卡永不过期，不收取任何休眠费、服务费或维护费；未使用余额会保留在卡内。',
        '',
        '若需帮助，请致电 (845) 800-6600。',
        args.viewUrl ? `查看礼品卡：${args.viewUrl}` : '',
      ]
    : [
        `Hi ${args.recipientName},`,
        '',
        'You received a Spa Paradise gift card. Here are your certificate details:',
        `Certificate code: ${args.certificateCode}`,
        `Gift: ${args.productLabel}`,
        `Amount: ${amountText}`,
        '',
        'How to redeem: book any service and present this code at check-in.',
        'Legal notice: gift cards do not expire and carry no dormancy, service, or maintenance fees; any remaining balance stays on the card.',
        '',
        'Need help? Call us at (845) 800-6600.',
        args.viewUrl ? `View gift card: ${args.viewUrl}` : '',
      ];
  const safeName = escapeHtml(args.recipientName);
  const safeBuyerName = escapeHtml(args.buyerName);
  const safeRecipientEmail = escapeHtml(args.recipientEmail);
  const safeCode = escapeHtml(args.certificateCode);
  const safeProduct = escapeHtml(args.productLabel);
  const safeAmount = escapeHtml(amountText);
  const safeViewUrl = escapeHtml(args.viewUrl || '');
  const html = isZh
    ? `
      <div style="font-family: Arial, sans-serif; background:#f6f7f8; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#0f766e; color:#fff; padding:20px 24px;">
            <div style="font-size:20px; font-weight:700;">Spa Paradise 礼品卡</div>
            <div style="opacity:0.9; margin-top:4px;">您收到了一张数字礼品卡</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">${safeName} 您好，</p>
            <p style="margin:0 0 16px;">您收到了一张 Spa Paradise 礼品卡，详情如下：</p>
            <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:16px; background:#fafafa;">
              <div style="font-size:12px; color:#6b7280; margin-bottom:4px;">礼券代码</div>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:22px; font-weight:700; letter-spacing:1px; color:#111827;">${safeCode}</div>
              <div style="margin-top:12px; font-size:14px; color:#374151;">礼品：${safeProduct}</div>
              <div style="font-size:14px; color:#374151;">金额：${safeAmount}</div>
            </div>
            ${
              safeViewUrl
                ? `<a href="${safeViewUrl}" style="display:inline-block; background:#111827; color:#fff; text-decoration:none; border-radius:8px; padding:11px 16px; font-weight:600; margin-bottom:14px;">查看礼品卡</a>`
                : ''
            }
            <p style="margin:0 0 8px; color:#374151;">使用方式：预约任意护理，在到店时出示礼券代码即可兑换。</p>
            <p style="margin:0 0 8px; color:#374151;">礼品卡永不过期，不收取任何休眠费、服务费或维护费；未使用余额会保留在卡内。</p>
            <p style="margin:14px 0 0; color:#111827;">需要帮助？请致电 (845) 800-6600。</p>
          </div>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; background:#f6f7f8; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#0f766e; color:#fff; padding:20px 24px;">
            <div style="font-size:20px; font-weight:700;">Spa Paradise Gift Card</div>
            <div style="opacity:0.9; margin-top:4px;">You received a digital gift card</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">Hi ${safeName},</p>
            <p style="margin:0 0 16px;">You received a Spa Paradise gift card. Here are your details:</p>
            <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:16px; background:#fafafa;">
              <div style="font-size:12px; color:#6b7280; margin-bottom:4px;">Certificate code</div>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:22px; font-weight:700; letter-spacing:1px; color:#111827;">${safeCode}</div>
              <div style="margin-top:12px; font-size:14px; color:#374151;">Gift: ${safeProduct}</div>
              <div style="font-size:14px; color:#374151;">Amount: ${safeAmount}</div>
            </div>
            ${
              safeViewUrl
                ? `<a href="${safeViewUrl}" style="display:inline-block; background:#111827; color:#fff; text-decoration:none; border-radius:8px; padding:11px 16px; font-weight:600; margin-bottom:14px;">View Gift Card</a>`
                : ''
            }
            <p style="margin:0 0 8px; color:#374151;">How to redeem: book any service and present this certificate code at check-in.</p>
            <p style="margin:0 0 8px; color:#374151;">Gift cards do not expire and carry no dormancy, service, or maintenance fees; any remaining balance stays on the card.</p>
            <p style="margin:14px 0 0; color:#111827;">Need help? Call us at (845) 800-6600.</p>
          </div>
        </div>
      </div>
    `;
  const buyerHtml = isZh
    ? `
      <div style="font-family: Arial, sans-serif; background:#f6f7f8; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#0f766e; color:#fff; padding:20px 24px;">
            <div style="font-size:20px; font-weight:700;">Spa Paradise 礼品卡</div>
            <div style="opacity:0.9; margin-top:4px;">礼品卡已发送给收礼人</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">${safeBuyerName} 您好，</p>
            <p style="margin:0 0 16px;">您的礼品卡已发送至 ${safeRecipientEmail}。</p>
            <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:16px; background:#fafafa;">
              <div style="font-size:12px; color:#6b7280; margin-bottom:4px;">礼券代码</div>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:22px; font-weight:700; letter-spacing:1px; color:#111827;">${safeCode}</div>
              <div style="margin-top:12px; font-size:14px; color:#374151;">礼品：${safeProduct}</div>
              <div style="font-size:14px; color:#374151;">金额：${safeAmount}</div>
            </div>
            ${
              safeViewUrl
                ? `<a href="${safeViewUrl}" style="display:inline-block; background:#111827; color:#fff; text-decoration:none; border-radius:8px; padding:11px 16px; font-weight:600; margin-bottom:14px;">查看礼品卡</a>`
                : ''
            }
          </div>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; background:#f6f7f8; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#0f766e; color:#fff; padding:20px 24px;">
            <div style="font-size:20px; font-weight:700;">Spa Paradise Gift Card</div>
            <div style="opacity:0.9; margin-top:4px;">Gift card sent to recipient</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">Hi ${safeBuyerName},</p>
            <p style="margin:0 0 16px;">Your gift card was sent to ${safeRecipientEmail}.</p>
            <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:16px; background:#fafafa;">
              <div style="font-size:12px; color:#6b7280; margin-bottom:4px;">Certificate code</div>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:22px; font-weight:700; letter-spacing:1px; color:#111827;">${safeCode}</div>
              <div style="margin-top:12px; font-size:14px; color:#374151;">Gift: ${safeProduct}</div>
              <div style="font-size:14px; color:#374151;">Amount: ${safeAmount}</div>
            </div>
            ${
              safeViewUrl
                ? `<a href="${safeViewUrl}" style="display:inline-block; background:#111827; color:#fff; text-decoration:none; border-radius:8px; padding:11px 16px; font-weight:600; margin-bottom:14px;">View Gift Card</a>`
                : ''
            }
          </div>
        </div>
      </div>
    `;

  try {
    await resend.emails.send({
      from: resendFrom,
      to: args.recipientEmail,
      subject,
      text: lines.join('\n'),
      html,
    });
    const buyerEmail = String(args.buyerEmail || '').trim().toLowerCase();
    const recipientEmail = String(args.recipientEmail || '').trim().toLowerCase();
    if (isValidEmail(buyerEmail) && buyerEmail !== recipientEmail) {
      await resend.emails.send({
        from: resendFrom,
        to: buyerEmail,
        subject: isZh
          ? `礼品卡已发送：${args.certificateCode}`
          : `Gift card sent: ${args.certificateCode}`,
        text: isZh
          ? [
              `${args.buyerName} 您好，`,
              '',
              `您的礼品卡已发送至 ${args.recipientEmail}。`,
              `礼券代码：${args.certificateCode}`,
              `礼品：${args.productLabel}`,
              `金额：${amountText}`,
              args.viewUrl ? `查看礼品卡：${args.viewUrl}` : '',
            ].join('\n')
          : [
              `Hi ${args.buyerName},`,
              '',
              `Your gift card was sent to ${args.recipientEmail}.`,
              `Certificate code: ${args.certificateCode}`,
              `Gift: ${args.productLabel}`,
              `Amount: ${amountText}`,
              args.viewUrl ? `View gift card: ${args.viewUrl}` : '',
            ].join('\n'),
        html: buyerHtml,
      });
    }
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
        `Recipient: ${args.recipientName}`,
        `Recipient email: ${args.recipientEmail}`,
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

async function sendGiftCardRedemptionEmail(args: {
  locale: 'en' | 'zh';
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
  certificateCode: string;
  redeemedAmount: number;
  remainingAmount: number;
  currency: string;
  note?: string;
  viewUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resendFrom =
    process.env.RESEND_FROM || 'Spa Paradise <no-reply@baamplatform.com>';
  const redeemedText = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (args.currency || 'usd').toUpperCase(),
  }).format(args.redeemedAmount || 0);
  const remainingText = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (args.currency || 'usd').toUpperCase(),
  }).format(args.remainingAmount || 0);
  const isZh = args.locale === 'zh';
  const subject = isZh
    ? `礼品卡使用通知：${args.certificateCode}`
    : `Gift card redemption update: ${args.certificateCode}`;

  const recipientBody = isZh
    ? [
        `${args.recipientName} 您好，`,
        '',
        `您的礼品卡（代码：${args.certificateCode}）已使用 ${redeemedText}。`,
        `剩余余额：${remainingText}`,
        args.note ? `本次使用说明：${args.note}` : '',
        args.viewUrl ? `查看礼品卡：${args.viewUrl}` : '',
        '',
        '如有疑问，请致电 (845) 800-6600。',
      ]
    : [
        `Hi ${args.recipientName},`,
        '',
        `Your gift card (${args.certificateCode}) was redeemed for ${redeemedText}.`,
        `Remaining balance: ${remainingText}`,
        args.note ? `Redeem note: ${args.note}` : '',
        args.viewUrl ? `View gift card: ${args.viewUrl}` : '',
        '',
        'Questions? Call us at (845) 800-6600.',
      ];
  const safeName = escapeHtml(args.recipientName);
  const safeCode = escapeHtml(args.certificateCode);
  const safeRedeemed = escapeHtml(redeemedText);
  const safeRemaining = escapeHtml(remainingText);
  const safeNote = escapeHtml(args.note || '');
  const safeViewUrl = escapeHtml(args.viewUrl || '');
  const html = isZh
    ? `
      <div style="font-family: Arial, sans-serif; background:#f6f7f8; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#fff; border-radius:14px; border:1px solid #e5e7eb; overflow:hidden;">
          <div style="background:#1f2937; color:#fff; padding:18px 24px;">
            <div style="font-size:19px; font-weight:700;">礼品卡使用通知</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">${safeName} 您好，</p>
            <p style="margin:0 0 8px;">礼品卡（${safeCode}）已使用 <strong>${safeRedeemed}</strong>。</p>
            <p style="margin:0 0 12px;">剩余余额：<strong>${safeRemaining}</strong></p>
            ${safeNote ? `<p style="margin:0 0 12px; color:#374151;">本次使用说明：${safeNote}</p>` : ''}
            ${
              safeViewUrl
                ? `<a href="${safeViewUrl}" style="display:inline-block; background:#111827; color:#fff; text-decoration:none; border-radius:8px; padding:10px 14px; font-weight:600;">查看礼品卡</a>`
                : ''
            }
          </div>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; background:#f6f7f8; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#fff; border-radius:14px; border:1px solid #e5e7eb; overflow:hidden;">
          <div style="background:#1f2937; color:#fff; padding:18px 24px;">
            <div style="font-size:19px; font-weight:700;">Gift Card Redemption Update</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">Hi ${safeName},</p>
            <p style="margin:0 0 8px;">Gift card (${safeCode}) was redeemed for <strong>${safeRedeemed}</strong>.</p>
            <p style="margin:0 0 12px;">Remaining balance: <strong>${safeRemaining}</strong></p>
            ${safeNote ? `<p style="margin:0 0 12px; color:#374151;">Redeem note: ${safeNote}</p>` : ''}
            ${
              safeViewUrl
                ? `<a href="${safeViewUrl}" style="display:inline-block; background:#111827; color:#fff; text-decoration:none; border-radius:8px; padding:10px 14px; font-weight:600;">View Gift Card</a>`
                : ''
            }
          </div>
        </div>
      </div>
    `;

  const buyerBody = isZh
    ? [
        `${args.buyerName} 您好，`,
        '',
        `礼品卡（代码：${args.certificateCode}）已使用 ${redeemedText}。`,
        `剩余余额：${remainingText}`,
        args.note ? `本次使用说明：${args.note}` : '',
        args.viewUrl ? `查看礼品卡：${args.viewUrl}` : '',
      ]
    : [
        `Hi ${args.buyerName},`,
        '',
        `Gift card (${args.certificateCode}) was redeemed for ${redeemedText}.`,
        `Remaining balance: ${remainingText}`,
        args.note ? `Redeem note: ${args.note}` : '',
        args.viewUrl ? `View gift card: ${args.viewUrl}` : '',
      ];

  try {
    await resend.emails.send({
      from: resendFrom,
      to: args.recipientEmail,
      subject,
      text: recipientBody.filter(Boolean).join('\n'),
      html,
    });
    const buyerEmail = String(args.buyerEmail || '').trim().toLowerCase();
    const recipientEmail = String(args.recipientEmail || '').trim().toLowerCase();
    if (isValidEmail(buyerEmail) && buyerEmail !== recipientEmail) {
      await resend.emails.send({
        from: resendFrom,
        to: buyerEmail,
        subject,
        text: buyerBody.filter(Boolean).join('\n'),
      });
    }
  } catch (error) {
    console.warn('Gift card redemption email failed:', error);
  }
}

export async function createGiftCardCheckoutSession(args: {
  siteId: string;
  locale: string;
  productRef: string;
  origin: string;
  recipientName?: string;
  recipientEmail?: string;
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
  const recipientName = String(args.recipientName || '').trim();
  const recipientEmail = String(args.recipientEmail || '').trim().toLowerCase();
  if (!recipientName) {
    throw new Error('Recipient name is required.');
  }
  if (!isValidEmail(recipientEmail)) {
    throw new Error('Recipient email is invalid.');
  }

  const successUrl = `${args.origin}/${locale}/gift-cards?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${args.origin}/${locale}/gift-cards?checkout=cancelled`;
  const connectedAccountId = await resolveConnectedStripeAccountId(args.siteId);
  const requestOptions = connectedAccountId
    ? { stripeAccount: connectedAccountId }
    : undefined;

  const session = await stripe.checkout.sessions.create(
    {
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
        recipientName,
        recipientEmail,
        stripeAccountId: connectedAccountId,
      },
    },
    requestOptions
  );

  if (!session.url) {
    throw new Error('Could not create checkout session.');
  }

  return { url: session.url };
}

async function deriveFinanceFromCheckoutSession(
  session: Stripe.Checkout.Session,
  stripeAccountId?: string
) {
  const currency = String(session.currency || 'usd').toLowerCase();
  let grossAmount = Number(session.amount_total || 0) / 100;
  let netAmount = grossAmount;
  let stripeFeeAmount = 0;
  let paymentIntentId = '';
  let chargeId = '';

  const rawPaymentIntent = session.payment_intent;
  if (typeof rawPaymentIntent === 'string' && rawPaymentIntent) {
    paymentIntentId = rawPaymentIntent;
  }
  if (paymentIntentId && stripe) {
    try {
      const requestOptions = stripeAccountId
        ? { stripeAccount: stripeAccountId }
        : undefined;
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        {
          expand: ['latest_charge.balance_transaction'],
        },
        requestOptions
      );
      const latestCharge = paymentIntent.latest_charge;
      if (latestCharge && typeof latestCharge !== 'string') {
        chargeId = latestCharge.id;
        const balanceTransaction = latestCharge.balance_transaction;
        if (balanceTransaction && typeof balanceTransaction !== 'string') {
          grossAmount = Number(balanceTransaction.amount || 0) / 100;
          netAmount = Number(balanceTransaction.net || 0) / 100;
          stripeFeeAmount = Number(balanceTransaction.fee || 0) / 100;
        }
      }
    } catch {
      // keep fallback totals from checkout session
    }
  }

  return {
    currency,
    grossAmount: Number.isFinite(grossAmount) ? grossAmount : 0,
    netAmount: Number.isFinite(netAmount) ? netAmount : 0,
    stripeFeeAmount: Number.isFinite(stripeFeeAmount) ? stripeFeeAmount : 0,
    paymentIntentId,
    chargeId,
  };
}

export async function finalizeGiftCardSession(args: {
  sessionId: string;
  localeHint?: string;
  siteIdHint?: string;
  stripeAccountId?: string;
  session?: Stripe.Checkout.Session;
}) {
  if (!stripe) {
    return { ok: false as const, message: 'Gift card checkout is not configured.' };
  }

  const explicitStripeAccountId = normalizeStripeAccountId(args.stripeAccountId);
  let inferredStripeAccountId = explicitStripeAccountId;
  if (!inferredStripeAccountId && args.siteIdHint) {
    inferredStripeAccountId = await resolveConnectedStripeAccountId(args.siteIdHint);
  }

  const retrieveOptions = inferredStripeAccountId
    ? { stripeAccount: inferredStripeAccountId }
    : undefined;
  const session =
    args.session ||
    (await stripe.checkout.sessions.retrieve(args.sessionId, {}, retrieveOptions));
  if (!session) {
    return { ok: false as const, message: 'Checkout session not found.' };
  }
  if (session.payment_status !== 'paid') {
    return { ok: false as const, message: 'Payment has not completed yet.' };
  }

  const metadata = session.metadata || {};
  const siteId = String(metadata.siteId || args.siteIdHint || '').trim();
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
  const recipientNameRaw = String(metadata.recipientName || '').trim();
  const recipientEmailRaw = String(metadata.recipientEmail || '').trim().toLowerCase();
  const recipientName = recipientNameRaw || buyerName || 'Guest';
  const recipientEmail = isValidEmail(recipientEmailRaw)
    ? recipientEmailRaw
    : buyerEmail;
  const amount = Number(product.amount || 0);
  const currency = String(session.currency || 'usd').toLowerCase();
  const metadataAccountId = normalizeStripeAccountId(
    String(metadata.stripeAccountId || '')
  );
  const effectiveStripeAccountId =
    explicitStripeAccountId ||
    metadataAccountId ||
    (await resolveConnectedStripeAccountId(siteId));

  const upserted = await upsertGiftCardOrder({
    siteId,
    stripeSessionId: session.id,
    productRef: product.id,
    amount,
    currency,
    buyerName,
    buyerEmail,
    buyerLocale: locale,
    recipientName,
    recipientEmail,
  });

  const recipientProfile = await upsertGiftCardRecipientProfile({
    siteId,
    orderId: upserted.order.id,
    stripeSessionId: session.id,
    certificateCode: upserted.order.certificate_code,
    recipientName,
    recipientEmail,
    buyerName,
    buyerEmail,
  });
  const finance = await deriveFinanceFromCheckoutSession(
    session,
    effectiveStripeAccountId || undefined
  );
  await upsertGiftCardFinanceRecord({
    siteId,
    orderId: upserted.order.id,
    stripeSessionId: session.id,
    paymentIntentId: finance.paymentIntentId,
    chargeId: finance.chargeId,
    currency: finance.currency || currency,
    grossAmount: finance.grossAmount,
    netAmount: finance.netAmount,
    stripeFeeAmount: finance.stripeFeeAmount,
    reimbursementDueAmount: finance.stripeFeeAmount,
    status: 'paid',
  });
  const viewUrl = await buildGiftCardViewUrl({
    siteId,
    locale,
    viewToken: recipientProfile.view_token,
  });

  if (upserted.created) {
    await sendGiftCardCertificateEmail({
      siteId,
      locale,
      buyerName,
      buyerEmail,
      recipientName,
      recipientEmail,
      certificateCode: upserted.order.certificate_code,
      productLabel: product.label,
      amount,
      currency,
      viewUrl,
    });
  }

  return {
    ok: true as const,
    created: upserted.created,
    certificateCode: upserted.order.certificate_code,
    buyerEmail,
    recipientEmail,
    viewUrl,
    productLabel: product.label,
  };
}
