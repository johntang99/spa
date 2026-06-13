import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { finalizeGiftCardSession } from '@/lib/gift-cards/commerce';

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
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const localeHint = String(session.metadata?.locale || 'en');
      await finalizeGiftCardSession({
        sessionId: session.id,
        localeHint,
      });
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
