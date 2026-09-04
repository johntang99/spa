import { randomBytes } from 'crypto';
import Stripe from 'stripe';
import type { Locale } from '@/lib/i18n';
import type { Catalog, Service, Tier } from '@/lib/spa/catalog';
import { loadContent } from '@/lib/content';
import { getSiteById } from '@/lib/sites';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { loadBookingSettings } from '@/lib/booking/storage';
import { sendBookingEmails } from '@/lib/booking/email';
import { sendBookingSms } from '@/lib/booking/sms';
import { forwardToLeadHub } from '@/lib/lead-hub-forward';
import type { BookingRecord } from '@/lib/types';

type BookingTimeWindow = 'morning' | 'afternoon' | 'evening';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-05-27.dahlia',
    })
  : null;

const TIME_WINDOWS: BookingTimeWindow[] = ['morning', 'afternoon', 'evening'];

export type BookingCheckoutPayload = {
  locale?: string;
  serviceId?: string;
  durationTier?: number;
  preferredDate?: string;
  timeWindow?: string;
  name?: string;
  phone?: string;
  email?: string;
  therapistPref?: string;
  notes?: string;
  promoCode?: string;
  company?: string;
  sourcePage?: string;
};

export type BookingFinalizeResult = {
  ok: boolean;
  created: boolean;
  message: string;
  leadId?: string;
  serviceName?: string;
  amountPaid?: number;
};

type BookingCheckoutSessionArgs = {
  siteId: string;
  origin: string;
  payload: BookingCheckoutPayload;
};

type FinalizeBookingCheckoutArgs = {
  sessionId: string;
  siteIdHint?: string;
  localeHint?: string;
  stripeAccountId?: string;
  session?: Stripe.Checkout.Session;
};

function normalizeLocale(input?: string): Locale {
  if (input === 'zh' || input === 'es') return input;
  return 'en';
}

function normalizeDbLocale(locale: Locale): 'en' | 'zh' {
  return locale === 'zh' ? 'zh' : 'en';
}

function normalizeStripeAccountId(input?: string | null) {
  const value = String(input || '').trim();
  return /^acct_[A-Za-z0-9]+$/.test(value) ? value : '';
}

function isStripeConnectPlatformError(error: unknown) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';
  return message.includes(
    'Only Stripe Connect platforms can work with other accounts'
  );
}

function isStripeMissingCheckoutSessionError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  const type = 'type' in error ? String((error as { type?: unknown }).type || '') : '';
  const message =
    'message' in error ? String((error as { message?: unknown }).message || '') : '';
  if (code === 'resource_missing') return true;
  if (type === 'StripeInvalidRequestError' && message.includes('No such checkout.session')) {
    return true;
  }
  return false;
}

function sanitizeText(value: unknown, max = 240) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);
}

function safeMetadataValue(value: unknown, max = 450) {
  const text = sanitizeText(value, max);
  return text || '';
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function asTimeWindow(value: unknown): BookingTimeWindow | null {
  const next = String(value || '').trim() as BookingTimeWindow;
  return TIME_WINDOWS.includes(next) ? next : null;
}

function asOptionalNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function toIsoDate(value: string) {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return '';
  return trimmed;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isDateInAllowedRange(date: string) {
  const today = todayIsoDate();
  if (date < today) return false;
  const max = new Date();
  max.setDate(max.getDate() + 90);
  const maxIso = max.toISOString().slice(0, 10);
  return date <= maxIso;
}

function buildOrderCode(prefix: string) {
  return `${prefix}-${randomBytes(5).toString('hex').toUpperCase()}`;
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

async function loadBookableService(args: {
  siteId: string;
  locale: Locale;
  serviceId: string;
  requestedMinutes: number | null;
}) {
  const catalog =
    (await loadContent<Catalog>(args.siteId, args.locale, 'collections/services.json')) ||
    (await loadContent<Catalog>(args.siteId, 'en', 'collections/services.json'));
  const services = Array.isArray(catalog?.services) ? catalog!.services : [];
  const service = services.find((entry) => entry.id === args.serviceId && entry.enabled);
  if (!service) return null;
  const tiers = Array.isArray(service.tiers)
    ? service.tiers.filter((tier) => Number.isFinite(Number(tier?.price || 0)))
    : [];
  if (tiers.length === 0) return null;
  const matchedTier =
    (args.requestedMinutes
      ? tiers.find((tier) => Number(tier.minutes) === args.requestedMinutes)
      : null) || tiers[0];
  return { service, tier: matchedTier };
}

async function resolvePromotionCodeId(args: {
  promoCode: string;
  requestOptions?: Stripe.RequestOptions;
}) {
  if (!stripe) return null;
  const code = sanitizeText(args.promoCode, 64);
  if (!code) return null;
  const listed = await stripe.promotionCodes.list(
    { code, active: true, limit: 20 },
    args.requestOptions
  );
  const exact = listed.data.find(
    (entry) => String(entry.code || '').toLowerCase() === code.toLowerCase()
  );
  if (!exact) {
    throw new Error('Promo code is invalid or inactive.');
  }
  return exact.id;
}

async function createSessionForAccount(args: {
  requestOptions?: Stripe.RequestOptions;
  stripeAccountId: string;
  origin: string;
  siteId: string;
  locale: Locale;
  service: Service;
  tier: Tier;
  preferredDate: string;
  timeWindow: BookingTimeWindow;
  name: string;
  phone: string;
  email: string;
  therapistPref: string;
  notes: string;
  promoCode: string;
  sourcePage: string;
}) {
  if (!stripe) throw new Error('Stripe checkout is not configured yet.');
  const amountCents = Math.max(0, Math.round(Number(args.tier.price || 0) * 100));
  if (amountCents <= 0) {
    throw new Error('Service price is invalid.');
  }

  const successUrl = `${args.origin}/${args.locale}/book?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${args.origin}/${args.locale}/book?checkout=cancelled`;
  const promotionCodeId = args.promoCode
    ? await resolvePromotionCodeId({
        promoCode: args.promoCode,
        requestOptions: args.requestOptions,
      })
    : null;
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_creation: 'always',
      allow_promotion_codes: promotionCodeId ? undefined : true,
      discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${args.service.name} (${args.tier.minutes} min)`,
              description: 'Spa treatment booking payment',
            },
          },
        },
      ],
      metadata: {
        checkoutKind: 'booking',
        siteId: args.siteId,
        locale: args.locale,
        serviceId: args.service.id,
        serviceName: safeMetadataValue(args.service.name),
        durationTier: String(args.tier.minutes),
        preferredDate: args.preferredDate,
        timeWindow: args.timeWindow,
        name: safeMetadataValue(args.name),
        phone: safeMetadataValue(args.phone),
        email: safeMetadataValue(args.email),
        therapistPref: safeMetadataValue(args.therapistPref),
        notes: safeMetadataValue(args.notes),
        sourcePage: safeMetadataValue(args.sourcePage),
        promoCode: safeMetadataValue(args.promoCode),
        stripeAccountId: args.stripeAccountId,
      },
    },
    args.requestOptions
  );

  if (!session.url) {
    throw new Error('Could not create booking checkout session.');
  }
  return session;
}

export async function createBookingCheckoutSession({
  siteId,
  origin,
  payload,
}: BookingCheckoutSessionArgs) {
  if (!stripe) {
    throw new Error('Stripe checkout is not configured yet.');
  }
  if (payload.company) {
    throw new Error('Submission rejected.');
  }

  const locale = normalizeLocale(payload.locale);
  const serviceId = sanitizeText(payload.serviceId, 100);
  const preferredDate = toIsoDate(String(payload.preferredDate || ''));
  const timeWindow = asTimeWindow(payload.timeWindow);
  const name = sanitizeText(payload.name, 120);
  const phone = sanitizeText(payload.phone, 40);
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const therapistPref = sanitizeText(payload.therapistPref, 120);
  const notes = sanitizeText(payload.notes, 450);
  const promoCode = sanitizeText(payload.promoCode, 80);
  const requestedMinutes = asOptionalNumber(payload.durationTier);
  const sourcePage = sanitizeText(payload.sourcePage, 180) || `/${locale}/book`;

  if (!serviceId || !preferredDate || !timeWindow || !name || !phone || !email) {
    throw new Error('Missing required booking fields.');
  }
  if (!isEmail(email)) {
    throw new Error('A valid email is required to complete payment.');
  }
  if (!isDateInAllowedRange(preferredDate)) {
    throw new Error('Preferred date is outside the booking window.');
  }

  const resolved = await loadBookableService({
    siteId,
    locale,
    serviceId,
    requestedMinutes,
  });
  if (!resolved) {
    throw new Error('Selected service is unavailable.');
  }

  const connectedAccountId = await resolveConnectedStripeAccountId(siteId);
  const requestOptions = connectedAccountId
    ? ({ stripeAccount: connectedAccountId } as Stripe.RequestOptions)
    : undefined;

  try {
    const session = await createSessionForAccount({
      requestOptions,
      stripeAccountId: connectedAccountId,
      origin,
      siteId,
      locale,
      service: resolved.service,
      tier: resolved.tier,
      preferredDate,
      timeWindow,
      name,
      phone,
      email,
      therapistPref,
      notes,
      promoCode,
      sourcePage,
    });
    return { url: session.url, sessionId: session.id };
  } catch (error) {
    if (!requestOptions || !isStripeConnectPlatformError(error)) {
      throw error;
    }
    console.warn(
      `Stripe Connect account ${connectedAccountId} rejected booking checkout; retrying on platform account.`
    );
    const session = await createSessionForAccount({
      requestOptions: undefined,
      stripeAccountId: '',
      origin,
      siteId,
      locale,
      service: resolved.service,
      tier: resolved.tier,
      preferredDate,
      timeWindow,
      name,
      phone,
      email,
      therapistPref,
      notes,
      promoCode,
      sourcePage,
    });
    return { url: session.url, sessionId: session.id };
  }
}

async function retrieveBookingSession(args: {
  sessionId: string;
  siteIdHint?: string;
  stripeAccountId?: string;
}) {
  if (!stripe) throw new Error('Stripe checkout is not configured yet.');
  const explicitAccount = normalizeStripeAccountId(args.stripeAccountId);
  if (explicitAccount) {
    const session = await stripe.checkout.sessions.retrieve(
      args.sessionId,
      {},
      { stripeAccount: explicitAccount }
    );
    return { session, stripeAccountId: explicitAccount };
  }

  const connectedAccountId = args.siteIdHint
    ? await resolveConnectedStripeAccountId(args.siteIdHint)
    : '';
  if (connectedAccountId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        args.sessionId,
        {},
        { stripeAccount: connectedAccountId }
      );
      return { session, stripeAccountId: connectedAccountId };
    } catch {
      // fallback to platform account
    }
  }
  const session = await stripe.checkout.sessions.retrieve(args.sessionId);
  return { session, stripeAccountId: '' };
}

export async function finalizeBookingCheckoutSession({
  sessionId,
  siteIdHint,
  localeHint,
  stripeAccountId,
  session: providedSession,
}: FinalizeBookingCheckoutArgs): Promise<BookingFinalizeResult> {
  if (!stripe) {
    return {
      ok: false,
      created: false,
      message: 'Stripe checkout is not configured.',
    };
  }

  let stripeSession = providedSession;
  if (!stripeSession) {
    try {
      const retrieved = await retrieveBookingSession({
        sessionId,
        siteIdHint,
        stripeAccountId,
      });
      stripeSession = retrieved.session;
    } catch (error) {
      if (isStripeMissingCheckoutSessionError(error)) {
        return {
          ok: false,
          created: false,
          message: 'Checkout session not found.',
        };
      }
      throw error;
    }
  }
  if (!stripeSession) {
    return { ok: false, created: false, message: 'Checkout session not found.' };
  }
  if (stripeSession.payment_status !== 'paid') {
    return { ok: false, created: false, message: 'Payment has not completed yet.' };
  }

  const metadata = stripeSession.metadata || {};
  if (metadata.checkoutKind !== 'booking') {
    return { ok: false, created: false, message: 'Session is not a booking payment.' };
  }

  const siteId = sanitizeText(metadata.siteId, 100) || sanitizeText(siteIdHint, 100);
  if (!siteId) {
    return { ok: false, created: false, message: 'Missing site for booking payment.' };
  }

  const locale = normalizeLocale(metadata.locale || localeHint);
  const dbLocale = normalizeDbLocale(locale);
  const serviceId = sanitizeText(metadata.serviceId, 100);
  const serviceName = sanitizeText(metadata.serviceName, 180) || serviceId;
  const preferredDate = toIsoDate(metadata.preferredDate || '');
  const timeWindow = asTimeWindow(metadata.timeWindow);
  const durationTier = asOptionalNumber(metadata.durationTier);
  const name =
    sanitizeText(stripeSession.customer_details?.name, 120) ||
    sanitizeText(metadata.name, 120) ||
    'Guest';
  const phone =
    sanitizeText(stripeSession.customer_details?.phone, 40) ||
    sanitizeText(metadata.phone, 40);
  const email =
    sanitizeText(stripeSession.customer_details?.email, 160).toLowerCase() ||
    sanitizeText(metadata.email, 160).toLowerCase();
  const therapistPref = sanitizeText(metadata.therapistPref, 120) || null;
  const notes = sanitizeText(metadata.notes, 450) || null;
  const sourcePage = sanitizeText(metadata.sourcePage, 180) || `/${locale}/book`;

  if (
    !serviceId ||
    !preferredDate ||
    !timeWindow ||
    !durationTier ||
    !name ||
    !phone ||
    !email
  ) {
    return { ok: false, created: false, message: 'Booking metadata is incomplete.' };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, created: false, message: 'Database is not configured.' };
  }

  const { data: existingOrder, error: existingError } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', stripeSession.id)
    .maybeSingle();
  if (!existingError && existingOrder?.id) {
    return {
      ok: true,
      created: false,
      message: 'Booking payment already processed.',
      serviceName,
      amountPaid: Number((stripeSession.amount_total || 0) / 100),
    };
  }

  const amountPaid = Number((stripeSession.amount_total || 0) / 100);
  const now = new Date().toISOString();
  const { error: orderInsertError } = await supabase.from('orders').insert({
    site_id: siteId,
    stripe_session_id: stripeSession.id,
    product_ref: serviceId,
    product_kind: 'booking',
    amount: amountPaid,
    currency: String(stripeSession.currency || 'usd').toLowerCase(),
    buyer_name: name,
    buyer_email: email,
    buyer_locale: dbLocale,
    certificate_code: buildOrderCode('BOOK'),
    status: 'paid',
    created_at: now,
    updated_at: now,
  });

  if (orderInsertError) {
    // Unique race: another process may have inserted first.
    if (!String(orderInsertError.message || '').toLowerCase().includes('duplicate')) {
      return {
        ok: false,
        created: false,
        message: `Could not save payment record: ${orderInsertError.message}`,
      };
    }
  }

  const paymentNote = `Stripe payment confirmed (${stripeSession.id}, ${amountPaid.toFixed(
    2
  )} ${String(stripeSession.currency || 'usd').toUpperCase()})`;
  const combinedNotes = [notes, paymentNote].filter(Boolean).join('\n');
  const { data: insertedLead, error: leadError } = await supabase
    .from('leads')
    .insert({
      site_id: siteId,
      type: 'booking',
      service: serviceId,
      duration_tier: durationTier,
      preferred_date: preferredDate,
      time_window: timeWindow,
      name,
      phone,
      email,
      language_pref: dbLocale,
      therapist_pref: therapistPref,
      notes: combinedNotes || null,
      message: null,
      source_page: sourcePage,
      locale: dbLocale,
      utm: {
        paid: true,
        stripe_session_id: stripeSession.id,
        promo_code: sanitizeText(metadata.promoCode, 80) || null,
      },
      status: 'new',
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (leadError) {
    return {
      ok: false,
      created: false,
      message: `Payment received, but lead creation failed: ${leadError.message}`,
      serviceName,
      amountPaid,
    };
  }

  const bookingRecord: BookingRecord = {
    id: insertedLead?.id ? `paid_${insertedLead.id}` : `paid_${stripeSession.id}`,
    siteId,
    serviceId,
    date: preferredDate,
    time: timeWindow,
    durationMinutes: durationTier,
    name,
    phone,
    email,
    note: combinedNotes || undefined,
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  };
  const bookingService = {
    id: serviceId,
    name: serviceName,
    durationMinutes: durationTier,
    price: amountPaid,
    serviceType: 'appointment' as const,
    active: true,
  };

  try {
    const settings = await loadBookingSettings(siteId);
    await sendBookingEmails({
      booking: bookingRecord,
      service: bookingService,
      subject: 'Your booking is confirmed',
      message: 'Thank you. We received your booking payment and confirmed your request.',
      adminRecipients: settings?.notificationEmails || [],
    });
    await sendBookingSms({
      booking: bookingRecord,
      service: bookingService,
      message: 'Booking request confirmed.',
      adminRecipients: settings?.notificationPhones || [],
    });
  } catch {
    // non-blocking
  }

  try {
    await forwardToLeadHub(siteId, {
      source: 'booking',
      source_form_name: 'booking_paid',
      source_landing_page: sourcePage,
      contact: {
        name,
        phone,
        email,
        language_preference: locale,
      },
      service_requested: serviceName,
      message: combinedNotes || null,
      raw_payload: {
        serviceId,
        serviceName,
        durationTier,
        preferredDate,
        timeWindow,
        stripe_session_id: stripeSession.id,
        amount_paid: amountPaid,
      },
    });
  } catch {
    // forwarder is best-effort
  }

  return {
    ok: true,
    created: true,
    message: 'Booking payment confirmed.',
    leadId: insertedLead?.id,
    serviceName,
    amountPaid,
  };
}
