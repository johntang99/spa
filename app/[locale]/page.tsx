import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadPageContent, loadSiteInfo, loadAllItems } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { getServiceSEOLinks } from '@/lib/seo-pages';
import type { SiteInfo } from '@/lib/types';
import HeroSection, { CredentialsSection } from '@/components/sections/HeroSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import ConditionsSection from '@/components/sections/ConditionsSection';
import ServicesSection from '@/components/sections/ServicesSection';
import BlogPreviewSection from '@/components/sections/BlogPreviewSection';
import GalleryPreviewSection from '@/components/sections/GalleryPreviewSection';
import FirstVisitSection from '@/components/sections/FirstVisitSection';
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection';
import CTASection from '@/components/sections/CTASection';
import SeoHubLinksSection from '@/components/sections/SeoHubLinksSection';
import ReviewsWidgetSection from '@/components/sections/ReviewsWidgetSection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { getSiteDisplayName } from '@/lib/siteInfo';

interface PageProps {
  params: {
    locale: Locale;
  };
}

interface HomePageContent {
  menu?: {
    variant?: string;
  };
  topBar?: {
    address?: string;
    phone?: string;
    email?: string;
    badge?: {
      text: string;
      visible?: boolean;
    };
  };
  hero: {
    variant:
      | 'centered'
      | 'split-photo-right'
      | 'split-photo-left'
      | 'overlap'
      | 'photo-background'
      | 'photo-screenwide-top'
      | 'video-background'
      | 'gallery-background'
      | 'gallery-screenwide-top';
    businessName?: string;
    clinicName?: string;
    tagline: string;
    description: string;
    primaryCta?: { text: string; link: string };
    secondaryCta?: { text: string; link: string };
    image?: string;
    video?: string;
    gallery?: string[];
    photoOverlayOpacity?: number;
    photoContentPosition?: 'center' | 'center-below' | 'left' | 'left-below' | 'lower';
    screenwideHeightDesktop?: number;
    floatingTags?: string[];
    stats?: Array<{
      icon?: string;
      number: string;
      label: string;
    }>;
    credentials?: Array<{
      icon: string;
      text: string;
    }>;
  };
  testimonials?: any;
  reviewsWidget?: {
    slug?: string;
    baamUrl?: string;
    badge?: string;
    title?: string;
    subtitle?: string;
    layout?: 'cards' | 'carousel' | 'single' | 'compact';
    minRating?: 4 | 5;
    maxCount?: number;
    accentColor?: string;
    showAggregate?: boolean;
    showLeaveOwn?: boolean;
    showReply?: boolean;
    maxWidth?: number;
  };
  howItWorks?: any;
  conditions?: any;
  services?: any;
  blog?: any;
  gallery?: any;
  firstVisit?: any;
  whyChooseUs?: any;
  seoHub?: {
    badge?: string;
    title: string;
    subtitle?: string;
    links: Array<{ text: string; url: string }>;
  };
  cta?: any;
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}

const sectionRevealConfig: Record<
  string,
  { distance?: number; duration?: number }
> = {
  hero: { distance: 30, duration: 760 },
  credentials: { distance: 28, duration: 740 },
  testimonials: { distance: 40, duration: 860 },
  reviewsWidget: { distance: 40, duration: 860 },
  howItWorks: { distance: 38, duration: 840 },
  conditions: { distance: 42, duration: 880 },
  services: { distance: 44, duration: 900 },
  seoHub: { distance: 42, duration: 880 },
  blog: { distance: 42, duration: 880 },
  gallery: { distance: 40, duration: 860 },
  firstVisit: { distance: 38, duration: 840 },
  whyChooseUs: { distance: 40, duration: 860 },
  cta: { distance: 48, duration: 940 },
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const [content, siteInfo] = await Promise.all([
    loadPageContent<HomePageContent>('home', locale, siteId),
    loadSiteInfo(siteId, locale as Locale) as Promise<SiteInfo | null>,
  ]);

  const businessName = getSiteDisplayName(siteInfo, 'Business');
  const location = siteInfo?.city && siteInfo?.state
    ? `${siteInfo.city}, ${siteInfo.state}`
    : '';
  const heroTagline = content?.hero?.tagline || '';
  const title = [heroTagline, location, businessName]
    .filter(Boolean)
    .join(' | ')
    .trim();

  const description =
    content?.hero?.description ||
    siteInfo?.description ||
    'Professional services tailored to your needs and goals.';

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'home',
    title: title || businessName,
    description,
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = params;
  
  // Load homepage content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<HomePageContent>('home', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('home.layout', locale, siteId);
  
  if (!content) {
    notFound();
  }
  
  const { hero } = content;
  const hasTopBar =
    Boolean(content.topBar?.badge?.visible) ||
    Boolean(content.topBar?.address) ||
    Boolean(content.topBar?.phone) ||
    Boolean(content.topBar?.email);
  const heroBusinessName = hero.businessName || hero.clinicName || 'Business';

  // Resolve SEO service page links for homepage services section
  const seoLinks = await getServiceSEOLinks(siteId, locale);
  if (content.services?.services && seoLinks.size > 0) {
    content.services.services = content.services.services.map((service: any) => {
      const seoLink = seoLinks.get(service.id);
      return seoLink ? { ...service, link: seoLink } : service;
    });
    if (content.services.featured) {
      const featuredLink = seoLinks.get(content.services.featured.id);
      if (featuredLink) {
        content.services.featured = { ...content.services.featured, link: featuredLink };
      }
    }
  }
  // Load latest blog posts dynamically instead of using hardcoded slugs
  if (content.blog) {
    type BlogListItem = { slug: string; title: string; excerpt?: string; image?: string; category?: string; publishDate?: string; readTime?: string; type?: string; featured?: boolean; status?: string };
    const allPosts = await loadAllItems<BlogListItem>(siteId, locale, 'blog');
    if (allPosts.length > 0) {
      const latestPosts = [...allPosts]
        .filter(p => !p.status || p.status === 'published')
        .filter(p => p.title && p.slug)
        .sort((a, b) => {
          const da = new Date(a.publishDate || 0).getTime();
          const db = new Date(b.publishDate || 0).getTime();
          return db - da;
        })
        .slice(0, 3);
      content.blog.posts = latestPosts;
    }
  }

  const defaultSections = [
    'hero',
    'credentials',
    'testimonials',
    'howItWorks',
    'conditions',
    'services',
    'seoHub',
    'blog',
    'gallery',
    'firstVisit',
    'whyChooseUs',
    'cta',
  ];
  const layoutSections =
    layout?.sections?.map((section) => section.id).filter(Boolean) || defaultSections;
  if (content.seoHub && !layoutSections.includes('seoHub')) {
    const servicesIndex = layoutSections.indexOf('services');
    if (servicesIndex >= 0) {
      layoutSections.splice(servicesIndex + 1, 0, 'seoHub');
    } else {
      layoutSections.push('seoHub');
    }
  }

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <HeroSection
            variant={hero.variant}
            topSpacingMode={hasTopBar ? 'extra' : 'default'}
            businessName={heroBusinessName}
            tagline={hero.tagline}
            description={hero.description}
            badgeText={content.topBar?.badge?.visible ? content.topBar.badge.text : undefined}
            primaryCta={hero.primaryCta}
            secondaryCta={hero.secondaryCta}
            image={hero.image}
            video={hero.video}
            gallery={hero.gallery}
            photoOverlayOpacity={
              typeof hero.photoOverlayOpacity === 'number' ? hero.photoOverlayOpacity : 0.2
            }
            photoContentPosition={
              hero.photoContentPosition === 'center' ||
              hero.photoContentPosition === 'center-below' ||
              hero.photoContentPosition === 'left' ||
              hero.photoContentPosition === 'left-below' ||
              hero.photoContentPosition === 'lower'
                ? hero.photoContentPosition
                : 'left-below'
            }
            screenwideHeightDesktop={
              typeof hero.screenwideHeightDesktop === 'number'
                ? hero.screenwideHeightDesktop
                : undefined
            }
            floatingTags={hero.floatingTags}
            stats={hero.stats}
          />
        );
      case 'credentials':
        return hero.credentials && hero.credentials.length > 0 ? (
          <CredentialsSection credentials={hero.credentials} />
        ) : null;
      case 'testimonials':
        return content.testimonials ? (
          <TestimonialsSection {...content.testimonials} />
        ) : null;
      case 'reviewsWidget':
        return content.reviewsWidget ? (
          <ReviewsWidgetSection {...content.reviewsWidget} locale={locale} />
        ) : null;
      case 'howItWorks':
        return content.howItWorks ? <HowItWorksSection {...content.howItWorks} /> : null;
      case 'conditions':
        return content.conditions ? <ConditionsSection {...content.conditions} /> : null;
      case 'services':
        return content.services ? <ServicesSection {...content.services} /> : null;
      case 'seoHub':
        return content.seoHub ? <SeoHubLinksSection {...content.seoHub} /> : null;
      case 'blog':
        return content.blog ? <BlogPreviewSection locale={locale} {...content.blog} /> : null;
      case 'gallery':
        return content.gallery ? <GalleryPreviewSection {...content.gallery} /> : null;
      case 'firstVisit':
        return content.firstVisit ? <FirstVisitSection {...content.firstVisit} /> : null;
      case 'whyChooseUs':
        return content.whyChooseUs ? <WhyChooseUsSection {...content.whyChooseUs} /> : null;
      case 'cta':
        return content.cta ? <CTASection {...content.cta} /> : null;
      default:
        return null;
    }
  };
  
  return (
    <main>
      {layoutSections.map((sectionId, index) => (
        <Fragment key={`${sectionId}-${index}`}>
          <ScrollReveal
            delay={index * 70}
            distance={sectionRevealConfig[sectionId]?.distance}
            duration={sectionRevealConfig[sectionId]?.duration}
          >
            {renderSection(sectionId)}
          </ScrollReveal>
        </Fragment>
      ))}
    </main>
  );
}
