import { NextRequest, NextResponse } from 'next/server';
import { getRequestSiteId } from '@/lib/content';
import { createGiftCardCheckoutSession } from '@/lib/gift-cards/commerce';

function normalizeLocale(input: string | null) {
  return input === 'zh' ? 'zh' : 'en';
}

function safeMessage(message: string) {
  return encodeURIComponent(message.replace(/\s+/g, ' ').trim().slice(0, 160));
}

function parseRecipientFields(input: {
  recipientName?: unknown;
  recipientEmail?: unknown;
}) {
  const recipientName = String(input.recipientName || '').trim();
  const recipientEmail = String(input.recipientEmail || '').trim().toLowerCase();
  return { recipientName, recipientEmail };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get('locale'));
  const productRef = String(searchParams.get('productRef') || '').trim();
  const recipient = parseRecipientFields({
    recipientName: searchParams.get('recipientName'),
    recipientEmail: searchParams.get('recipientEmail'),
  });
  const fallbackUrl = new URL(`/${locale}/gift-cards`, request.nextUrl.origin);

  if (!productRef) {
    fallbackUrl.searchParams.set('checkout', 'error');
    fallbackUrl.searchParams.set('message', safeMessage('Missing gift card product.'));
    return NextResponse.redirect(fallbackUrl);
  }

  try {
    const siteId = await getRequestSiteId();
    const { url } = await createGiftCardCheckoutSession({
      siteId,
      locale,
      productRef,
      origin: request.nextUrl.origin,
      recipientName: recipient.recipientName,
      recipientEmail: recipient.recipientEmail,
    });
    return NextResponse.redirect(url);
  } catch (error) {
    fallbackUrl.searchParams.set('checkout', 'error');
    fallbackUrl.searchParams.set(
      'message',
      safeMessage(
        error instanceof Error
          ? error.message
          : 'Could not start gift card checkout.'
      )
    );
    return NextResponse.redirect(fallbackUrl);
  }
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const locale = normalizeLocale(String(payload.locale || null));
  const productRef = String(payload.productRef || '').trim();
  const recipient = parseRecipientFields({
    recipientName: payload.recipientName,
    recipientEmail: payload.recipientEmail,
  });

  if (!productRef) {
    return NextResponse.json(
      { message: 'Missing gift card product.' },
      { status: 400 }
    );
  }

  try {
    const siteId = await getRequestSiteId();
    const { url } = await createGiftCardCheckoutSession({
      siteId,
      locale,
      productRef,
      origin: request.nextUrl.origin,
      recipientName: recipient.recipientName,
      recipientEmail: recipient.recipientEmail,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not start gift card checkout.';
    const cleanedMessage = message.replace(/\s+/g, ' ').trim().slice(0, 160);
    return NextResponse.json(
      { message: cleanedMessage },
      { status: 400 }
    );
  }
}
