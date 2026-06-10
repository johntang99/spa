/**
 * Mirror of LandingPageJsonV2 from baam-platform's
 * src/shared/industry-contract-v2.ts. Kept in sync manually — both sides
 * are owned by us, and the platform is the source of truth.
 */

export type LandingPageJsonV2 = {
  meta: {
    vertical: string;
    service_slug: string;
    geo_target: string;
    language: string;
    offer: string;
    variant_group?: string;
    traffic_weight?: number;
  };
  hero: {
    h1: string;
    subheadline: string;
    primary_cta: { label: string; action: 'scroll_to_form' | 'tel' };
    secondary_cta?: { label: string; action: string };
  };
  trust?: {
    years_experience?: number;
    practitioners?: Array<{
      name: string;
      credentials: string;
      license_number?: string;
    }>;
    review_count?: number;
    average_rating?: number;
    review_source?: string;
  };
  benefits: Array<{ title: string; description: string }>;
  social_proof?: Array<{ quote: string; author: string; source: string }>;
  service_explanation?: {
    what_is_it: string;
    what_to_expect: string;
    how_many_sessions?: string;
  };
  faq?: Array<{ q: string; a: string }>;
  location_signals?: {
    address?: string;
    nearby_landmarks?: string[];
    parking_info?: string;
    directions_cta?: boolean;
    wechat_qr?: string;
  };
  form: {
    fields: string[];
    optional_fields?: string[];
    submit_endpoint?: string;
    thank_you_slug?: string;
  };
  final_cta: { headline: string; cta_label: string };
  compliance: {
    required_disclaimers: string[];
    license_display_required?: boolean;
    herbal_disclaimer_required?: boolean;
    vertical: string;
  };
  tracking: {
    gtm_container_id?: string;
    gtm_events?: string[];
    enhanced_conversions?: boolean;
  };
};
