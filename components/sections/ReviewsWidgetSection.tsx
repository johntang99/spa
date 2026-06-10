import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ReviewsWidgetFrame } from './ReviewsWidgetFrame';

export type ReviewsWidgetLayout = 'cards' | 'carousel' | 'single' | 'compact';

export interface ReviewsWidgetSectionProps {
  /** BAAM Review location slug — required. Owner finds this in the BAAM admin. */
  slug?: string;
  /** Override the BAAM host. Defaults to NEXT_PUBLIC_BAAM_REVIEW_URL or the prod URL. */
  baamUrl?: string;
  /** Current locale — propagated to the widget so it can pick the right comment translation. */
  locale?: string;

  // Visible header (mirrors TestimonialsSection so the section feels native).
  badge?: string;
  title?: string;
  subtitle?: string;

  // Widget shape — each field is optional. When omitted the BAAM admin's
  // saved widget_config for this location is used as the fallback.
  layout?: ReviewsWidgetLayout;
  minRating?: 4 | 5;
  maxCount?: number;
  accentColor?: string;
  showAggregate?: boolean;
  showLeaveOwn?: boolean;
  showReply?: boolean;
  /** Optional max-width to constrain the iframe on wide layouts. */
  maxWidth?: number;

  className?: string;
}

const DEFAULT_BAAM_URL = 'https://review.baamplatform.com';

export default function ReviewsWidgetSection({
  slug,
  baamUrl,
  locale,
  badge,
  title,
  subtitle,
  layout,
  minRating,
  maxCount,
  accentColor,
  showAggregate,
  showLeaveOwn,
  showReply,
  maxWidth,
  className,
}: ReviewsWidgetSectionProps) {
  if (!slug) {
    // Quiet no-op when the section is added but not yet configured.
    return null;
  }

  const base =
    baamUrl?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_BAAM_REVIEW_URL?.replace(/\/$/, '') ||
    DEFAULT_BAAM_URL;

  const params = new URLSearchParams();
  if (layout) params.set('layout', layout);
  if (minRating) params.set('min_rating', String(minRating));
  if (typeof maxCount === 'number') params.set('max', String(maxCount));
  if (accentColor) params.set('accent', accentColor);
  if (typeof showAggregate === 'boolean')
    params.set('aggregate', showAggregate ? '1' : '0');
  if (typeof showLeaveOwn === 'boolean')
    params.set('leave_own', showLeaveOwn ? '1' : '0');
  if (typeof showReply === 'boolean')
    params.set('reply', showReply ? '1' : '0');
  // Pass the current locale so the widget can show original-language
  // reviews instead of Google's translation when they match.
  if (locale === 'zh' || locale === 'es' || locale === 'en') {
    params.set('lang', locale);
  }

  const qs = params.toString();
  const widgetUrl = `${base}/widget/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`;

  // Outer container is max-w-screen-2xl (1536px) so the widget can grow to
  // any reasonable user-configured maxWidth. The header keeps its own narrower
  // max so titles don't stretch awkwardly when the widget is very wide.
  return (
    <section className={cn('py-16 sm:py-24', className)}>
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        {(badge || title || subtitle) && (
          <div className="mx-auto mb-10 max-w-3xl text-center">
            {badge && <Badge>{badge}</Badge>}
            {title && (
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div
          className="mx-auto"
          style={{ maxWidth: maxWidth ? `${maxWidth}px` : '100%' }}
        >
          <ReviewsWidgetFrame src={widgetUrl} />
        </div>
      </div>
    </section>
  );
}
