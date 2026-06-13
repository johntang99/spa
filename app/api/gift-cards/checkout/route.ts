import { NextRequest, NextResponse } from 'next/server';
import { getRequestSiteId } from '@/lib/content';
import { createGiftCardCheckoutSession } from '@/lib/gift-cards/commerce';

function normalizeLocale(input: string | null) {
  return input === 'zh' ? 'zh' : 'en';
}

function safeMessage(message: string) {
  return encodeURIComponent(message.replace(/\s+/g, ' ').trim().slice(0, 160));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get('locale'));
  const productRef = String(searchParams.get('productRef') || '').trim();
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
