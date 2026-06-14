import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getRequestSiteId } from '@/lib/content';
import {
  finalizeGiftCardSession,
  handleGiftCardChargeEvent,
} from '@/lib/gift-cards/commerce';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-05-27.dahlia',
    })
  : null;

export async function POST(request: NextRequest) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json(
      { message: 'Stripe webhook is not configured.' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { message: 'Missing stripe-signature header.' },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid webhook signature.';
    return NextResponse.json({ message }, { status: 400 });
  }

  try {
    const fallbackSiteId = await getRequestSiteId();
    const stripeAccountId =
      typeof event.account === 'string' ? String(event.account).trim() : '';
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const localeHint = String(session.metadata?.locale || 'en');
      await finalizeGiftCardSession({
        sessionId: session.id,
        localeHint,
        siteIdHint: String(session.metadata?.siteId || fallbackSiteId),
        stripeAccountId,
        session,
      });
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : '';
      await handleGiftCardChargeEvent({
        siteId: fallbackSiteId,
        stripeAccountId,
        paymentIntentId,
        chargeId: charge.id,
        status: charge.refunded ? 'refunded' : 'frozen',
        refundedAmount: Number(charge.amount_refunded || 0) / 100,
      });
    } else if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = String(dispute.charge || '').trim();
      if (chargeId) {
        await handleGiftCardChargeEvent({
          siteId: fallbackSiteId,
          stripeAccountId,
          chargeId,
          status: 'frozen',
        });
      }
    }
  } catch (error) {
    console.error('Stripe webhook handler failed:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
