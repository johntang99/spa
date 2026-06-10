import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { getRequestSiteId, loadContent, loadPageContent, loadSiteInfo } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale, SiteInfo } from '@/lib/types';
import { getSiteDisplayName } from '@/lib/siteInfo';
import { resolveMediaUrl } from '@/lib/media-url';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';
import { CheckCircle2, MapPin, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { buildProfileBioMarkdown } from '@/lib/about-profile-bio';

interface AboutPageData {
  hero: {
    variant?:
      | 'centered'
      | 'split-photo-right'
      | 'split-photo-left'
      | 'photo-background'
      | 'gallery-background';
    title: string;
    subtitle: string;
    description?: string;
    backgroundImage?: string;
    gallery?: string[];
    photoOverlayOpacity?: number;
    photoContentPosition?: 'center' | 'center-below' | 'left' | 'left-below' | 'lower';
  };
  profile: {
    variant?: 'split' | 'stacked';
    name: string;
    title: string;
    image: string;
    bio: string;
    quote?: string;
    signature?: string;
  };
  staffs?: {
    title: string;
    members: Array<{
      image: string;
      name: string;
      title: string;
      description: string;
    }>;
  };
  /** @deprecated use `staffs` */
  team?: {
    title: string;
    members: Array<{
      image: string;
      name: string;
      title: string;
      description: string;
    }>;
  };
  credentials: {
    variant?: 'list' | 'grid';
    title: string;
    items: Array<{
      icon: string;
      credential: string;
      institution: string;
      year: string;
      location: string;
    }>;
  };
  specializations: {
    variant?: 'grid-2' | 'grid-3' | 'list';
    title: string;
    description: string;
    areas: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  philosophy: {
    variant?: 'cards' | 'timeline';
    title: string;
    introduction: string;
    principles: Array<{
      title: string;
      description: string;
    }>;
  };
  journey: {
    variant?: 'prose' | 'card';
    title: string;
    story: string;
  };
  affiliations: {
    variant?: 'compact' | 'detailed';
    title: string;
    organizations: Array<{
      name: string;
      role: string;
    }>;
  };
  continuingEducation: {
    variant?: 'compact' | 'detailed';
    title: string;
    description: string;
    items: string[];
  };
  clinic: {
    variant?: 'split' | 'cards';
    title: string;
    description: string | string[];
    features?: string[];
    values: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    environment: string;
  };
  cta: {
    variant?: 'centered' | 'split' | 'banner' | 'card-elevated';
    title: string;
    description: string;
    primaryCta: {
      text: string;
      link: string;
    };
    secondaryCta: {
      text: string;
      link: string;
    };
  };
}

interface AboutPageProps {
  params: {
    locale: Locale;
  };
}

interface ContactHoursSchedule {
  day: string;
  time: string;
  isOpen: boolean;
  note?: string;
}

interface ContactPageData {
  hours?: {
    title?: string;
    schedule: ContactHoursSchedule[];
    note?: string;
  };
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}

interface HeaderMenuConfig {
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
  };
}

function isSparseAboutContent(content: AboutPageData | null): boolean {
  if (!content) return true;

  const hasProfileBio = Boolean(content.profile?.bio?.trim());
  const hasCredentials = Array.isArray(content.credentials?.items) && content.credentials.items.length > 0;
  const hasSpecializations =
    Array.isArray(content.specializations?.areas) && content.specializations.areas.length > 0;
  const hasPhilosophy =
    Array.isArray(content.philosophy?.principles) && content.philosophy.principles.length > 0;
  const hasJourney = Boolean(content.journey?.story?.trim());
  const hasAffiliations =
    Array.isArray(content.affiliations?.organizations) && content.affiliations.organizations.length > 0;
  const hasContinuingEducation =
    Array.isArray(content.continuingEducation?.items) && content.continuingEducation.items.length > 0;
  const hasBusinessValues = Array.isArray(content.clinic?.values) && content.clinic.values.length > 0;

  return !(
    hasProfileBio &&
    hasCredentials &&
    hasSpecializations &&
    hasPhilosophy &&
    hasJourney &&
    hasAffiliations &&
    hasContinuingEducation &&
    hasBusinessValues
  );
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<AboutPageData>('about', locale, siteId);
  const title = content?.hero?.title;
  const description = content?.hero?.description || content?.hero?.subtitle;

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'about',
    title,
    description,
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  let content = await loadPageContent<AboutPageData>('about', locale, siteId);
  if (isSparseAboutContent(content)) {
    try {
      const localPath = path.join(
        process.cwd(),
        'content',
        siteId,
        locale,
        'pages',
        'about.json'
      );
      const raw = await fs.readFile(localPath, 'utf-8');
      const localContent = JSON.parse(raw) as AboutPageData;
      if (!isSparseAboutContent(localContent)) {
        content = localContent;
      }
    } catch {
      // Ignore local fallback read errors; keep DB content.
    }
  }
  const layout = await loadPageContent<PageLayoutConfig>('about.layout', locale, siteId);
  const contactContent = await loadPageContent<ContactPageData>('contact', locale, siteId);
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');
  const siteInfo = await loadSiteInfo(siteId, locale) as SiteInfo | null;
  
  if (!content) {
    notFound();
  }

  const hero = content.hero || {
    variant: 'split-photo-right',
    title: locale === 'en' ? 'About Us' : '关于我们',
    subtitle: '',
    description: '',
    backgroundImage: '',
  };
  const profile = content.profile || {
    variant: 'split',
    name: getSiteDisplayName(siteInfo, 'Our Team'),
    title: siteInfo?.tagline || '',
    image: '',
    bio: '',
    signature: '',
  };
  const staffs = {
    title:
      content.staffs?.title ??
      content.team?.title ??
      (locale === 'en' ? 'Meet Our Team' : '導師簡介'),
    members: content.staffs?.members ?? content.team?.members ?? [],
  };
  const staffMembersVisible = staffs.members.filter(
    (m) =>
      m &&
      (String(m.name || '').trim() ||
        String(m.title || '').trim() ||
        String(m.description || '').trim() ||
        String(m.image || '').trim())
  );
  const credentials = content.credentials || {
    variant: 'list',
    title: locale === 'en' ? 'Credentials' : '资质',
    items: [],
  };
  const specializations = content.specializations || {
    variant: 'grid-2',
    title: locale === 'en' ? 'Specializations' : '专业领域',
    description: '',
    areas: [],
  };
  const philosophy = content.philosophy || {
    variant: 'cards',
    title: locale === 'en' ? 'Philosophy' : '理念',
    introduction: '',
    principles: [],
  };
  const journey = content.journey || {
    variant: 'prose',
    title: locale === 'en' ? 'Journey' : '经历',
    story: '',
  };
  const affiliations = content.affiliations || {
    variant: 'compact',
    title: locale === 'en' ? 'Affiliations' : '协会会员',
    organizations: [],
  };
  const continuingEducation = content.continuingEducation || {
    variant: 'compact',
    title: locale === 'en' ? 'Continuing Education' : '继续教育',
    description: '',
    items: [],
  };
  const businessSection = content.clinic || {
    variant: 'split',
    title: locale === 'en' ? 'About Our Business' : '关于我们',
    description: '',
    features: [],
    values: [],
    environment: '',
  };
  const cta = {
    variant: content.cta?.variant || 'centered',
    title: content.cta?.title || (locale === 'en' ? 'Ready to get started?' : '准备好开始了吗？'),
    description: content.cta?.description || '',
    primaryCta: {
      text: content.cta?.primaryCta?.text || (locale === 'en' ? 'Get Started' : '立即开始'),
      link: content.cta?.primaryCta?.link || `/${locale}/book`,
    },
    secondaryCta: {
      text: content.cta?.secondaryCta?.text || (locale === 'en' ? 'Contact Us' : '联系我们'),
      link: content.cta?.secondaryCta?.link || 'tel:+18453811106',
    },
  };
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => {
    if (!useLayout) return true;
    if (layoutOrder.has(sectionId)) return true;
    if (sectionId === 'staffs' && layoutOrder.has('team')) return true;
    // Layout files often predate `staffs`; still show the grid when content exists.
    if (sectionId === 'staffs' && staffMembersVisible.length > 0) return true;
    return false;
  };
  const sectionStyle = (sectionId: string) => {
    if (!useLayout) return undefined;
    if (layoutOrder.has(sectionId)) return { order: layoutOrder.get(sectionId) ?? 0 };
    if (sectionId === 'staffs' && layoutOrder.has('team'))
      return { order: layoutOrder.get('team') ?? 0 };
    // Slot staffs between profile and credentials when visible but not listed in layout.
    if (
      sectionId === 'staffs' &&
      staffMembersVisible.length > 0 &&
      !layoutOrder.has('staffs') &&
      !layoutOrder.has('team')
    ) {
      const pOrder = layoutOrder.get('profile');
      const cOrder = layoutOrder.get('credentials');
      if (typeof pOrder === 'number' && typeof cOrder === 'number') {
        return { order: (pOrder + cOrder) / 2 };
      }
      if (typeof pOrder === 'number') return { order: pOrder + 0.5 };
      if (typeof cOrder === 'number') return { order: cOrder - 0.5 };
    }
    return undefined;
  };
  const resolvedHeroBackgroundImage = resolveMediaUrl(hero.backgroundImage);
  const resolvedHeroGallery = Array.isArray(hero.gallery)
    ? hero.gallery.map((item) => resolveMediaUrl(item)).filter(Boolean)
    : [];
  const resolvedProfileImage = resolveMediaUrl(profile.image);
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const profileVariant = profile.variant || 'split';
  const credentialsVariant = credentials.variant || 'list';
  const specializationsVariant = specializations.variant || 'grid-2';
  const philosophyVariant = philosophy.variant || 'cards';
  const journeyVariant = journey.variant || 'prose';
  const affiliationsVariant = affiliations.variant || 'compact';
  const continuingEducationVariant = continuingEducation.variant || 'compact';
  const businessSectionVariant = businessSection.variant || 'split';
  const sectionSpacingStyle = {
    paddingTop: 'var(--section-padding-y, 5rem)',
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };
  const tokenSurfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  const profileBioMarkdown = buildProfileBioMarkdown(profile);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {isEnabled('hero') && (
        <div style={sectionStyle('hero')}>
          <HeroSection
            variant={(hero.variant as HeroVariant) || 'split-photo-right'}
            topSpacingMode={isTransparentMenu ? 'extra' : 'default'}
            tagline={hero.title}
            description={hero.description || hero.subtitle}
            image={resolvedHeroBackgroundImage || undefined}
            gallery={resolvedHeroGallery}
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
          />
        </div>
      )}

      {/* Profile Section */}
      {isEnabled('profile') && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('profile') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className={profileVariant === 'stacked' ? 'space-y-10' : 'grid lg:grid-cols-5 gap-12 items-start'}>
              {/* Photo */}
              <div className={profileVariant === 'stacked' ? 'max-w-md mx-auto' : 'lg:col-span-2'}>
                <div className="sticky top-8">
                  <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-gray-100" style={tokenSurfaceStyle}>
                    {resolvedProfileImage ? (
                      <Image
                        src={resolvedProfileImage}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Icon name="User" size="xl" className="text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-heading font-bold text-gray-900 mb-2">
                      {profile.name}
                    </h2>
                    <p className="text-gray-600 mb-6">{profile.title}</p>
                    <div className="flex gap-4 justify-center">
                      <Button asChild size="sm">
                        <Link href={cta.primaryCta.link}>Get Started</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={cta.secondaryCta.link}>Contact Us</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio (Markdown — quote + attribution live in `profile.bio`) */}
              <div
                className={
                  profileVariant === 'stacked'
                    ? 'max-w-3xl mx-auto space-y-8 text-left'
                    : 'lg:col-span-3 space-y-8 text-left'
                }
              >
                <div className="about-profile-bio prose prose-gray max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="text-body text-gray-700 leading-relaxed mb-4 last:mb-0">{children}</p>
                      ),
                      blockquote: ({ children }) => (
                        <div
                          className="bg-gradient-to-br from-primary/5 to-backdrop-primary border-l-4 border-primary p-8 my-6"
                          style={{
                            borderTopRightRadius: 'var(--radius-base, 0.75rem)',
                            borderBottomRightRadius: 'var(--radius-base, 0.75rem)',
                          }}
                        >
                          <div className="text-subheading italic text-gray-800 [&_p]:mb-0 [&_p:last-child]:mb-0">
                            {children}
                          </div>
                        </div>
                      ),
                      strong: ({ children }) => (
                        <strong className="block text-right font-semibold text-gray-900 not-italic text-body mt-3">
                          {children}
                        </strong>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 mb-4 text-body text-gray-700">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 mb-4 text-body text-gray-700">{children}</ol>
                      ),
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="text-primary underline hover:text-primary-dark"
                          rel="noopener noreferrer"
                          target={href?.startsWith('http') ? '_blank' : undefined}
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {profileBioMarkdown}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Staffs — own section above Education & Credentials */}
      {isEnabled('staffs') && staffMembersVisible.length > 0 && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('staffs') || {}), ...sectionSpacingStyle }}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-heading font-bold text-gray-900 text-center mb-12 md:mb-14">
                {staffs.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {staffMembersVisible.map((member, index) => {
                  const src = resolveMediaUrl(member.image);
                  return (
                    <article
                      key={`${member.name || 'staff'}-${index}`}
                      className="flex flex-col overflow-hidden bg-white border border-gray-100"
                      style={tokenSurfaceStyle}
                    >
                      <div className="relative w-full aspect-[3/4] bg-gray-100">
                        {src ? (
                          <Image
                            src={src}
                            alt={member.name || 'Team member'}
                            fill
                            unoptimized
                            className="object-cover object-top"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 to-gray-100">
                            <Icon name="User" size="xl" className="text-primary/25" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-gray-50 px-4 py-5">
                        <h3 className="text-subheading font-bold text-gray-900 text-center">
                          {member.name}
                        </h3>
                        <p className="text-small text-gray-600 text-center mt-1">{member.title}</p>
                        <p className="text-xs sm:text-sm text-gray-700 text-left leading-relaxed mt-4 whitespace-pre-line">
                          {member.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Credentials */}
      {isEnabled('credentials') && (
        <section
          className="bg-gradient-to-br from-backdrop-secondary to-white"
          style={{ ...(sectionStyle('credentials') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Qualifications</Badge>
              <h2 className="text-heading font-bold text-gray-900">
                {credentials.title}
              </h2>
            </div>

            <div className={credentialsVariant === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'grid gap-4'}>
              {credentials.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-6 border border-gray-100 hover:border-primary/30 transition-all"
                  style={tokenSurfaceStyle}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}>
                      <Icon name={item.icon as any} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-subheading font-bold text-gray-900 mb-1">
                        {item.credential}
                      </h3>
                      <div className="text-gray-700 mb-2 prose prose-sm max-w-none credential-institution-md">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            a: ({ children, href }) => (
                              <a
                                href={href}
                                className="text-primary underline hover:text-primary-dark"
                                rel="noopener noreferrer"
                                target={href?.startsWith('http') ? '_blank' : undefined}
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {String(item.institution || '')}
                        </ReactMarkdown>
                      </div>
                      <div className="flex flex-wrap gap-3 text-small text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size="sm" />
                          {item.year}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="MapPin" size="sm" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Specializations */}
      {isEnabled('specializations') && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('specializations') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Expertise</Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {specializations.title}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {specializations.description}
              </p>
            </div>

            <div
              className={
                specializationsVariant === 'grid-3'
                  ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : specializationsVariant === 'list'
                    ? 'grid gap-4'
                    : 'grid md:grid-cols-2 gap-6'
              }
            >
              {specializations.areas.map((area, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div
                      className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4"
                      style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}
                    >
                      <Icon name={area.icon as any} className="text-primary" />
                    </div>
                    <CardTitle>{area.title}</CardTitle>
                    <CardDescription>{area.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Philosophy */}
      {isEnabled('philosophy') && (
        <section
          className="bg-gradient-to-br from-primary/5 to-backdrop-primary"
          style={{ ...(sectionStyle('philosophy') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Philosophy</Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {philosophy.title}
              </h2>
              <p className="text-body text-gray-700">
                {philosophy.introduction}
              </p>
            </div>

            <div className={philosophyVariant === 'timeline' ? 'space-y-4' : 'grid md:grid-cols-2 gap-6'}>
              {philosophy.principles.map((principle, index) => (
                <div
                  key={index}
                  className={`bg-white p-6 ${
                    philosophyVariant === 'timeline' ? 'border-l-4 border-primary' : ''
                  }`}
                  style={tokenSurfaceStyle}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold" style={{ borderRadius: 'var(--radius-base, 0.5rem)' }}>
                      {index + 1}
                    </div>
                    <h3 className="text-subheading font-bold text-gray-900 pt-0.5">
                      {principle.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Journey Story */}
      {isEnabled('journey') && (
        <section
          className="bg-white"
          style={{ ...(sectionStyle('journey') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">My Story</Badge>
              <h2 className="text-heading font-bold text-gray-900">
                {journey.title}
              </h2>
            </div>

            <div
              className={journeyVariant === 'card' ? 'bg-white p-8 border border-gray-100' : 'prose prose-lg max-w-none'}
              style={journeyVariant === 'card' ? tokenSurfaceStyle : undefined}
            >
              {journey.story.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Affiliations & Continuing Ed */}
      {isEnabled('affiliationsEducation') && (
        <section
          className="bg-gradient-to-br from-backdrop-secondary to-white"
          style={{ ...(sectionStyle('affiliationsEducation') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className={affiliationsVariant === 'detailed' || continuingEducationVariant === 'detailed' ? 'grid md:grid-cols-2 gap-12' : 'grid md:grid-cols-2 gap-8'}>
              {/* Affiliations */}
              <div>
                <h2 className="text-subheading font-bold text-gray-900 mb-6">
                  {affiliations.title}
                </h2>
                <div className="space-y-4">
                  {affiliations.organizations.map((org, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 border border-gray-100"
                      style={{ borderRadius: 'var(--radius-base, 0.5rem)', ...(affiliationsVariant === 'detailed' ? { boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))' } : {}) }}
                    >
                      <p className="font-semibold text-gray-900 mb-1">
                        {org.name}
                      </p>
                      <p className="text-small text-gray-600">{org.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continuing Education */}
              <div>
                <h2 className="text-subheading font-bold text-gray-900 mb-4">
                  {continuingEducation.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {continuingEducation.description}
                </p>
                <ul className={continuingEducationVariant === 'detailed' ? 'space-y-4' : 'space-y-3'}>
                  {continuingEducation.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Icon name="Check" className="text-primary mt-1 flex-shrink-0" size="sm" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* About the Business */}
      {isEnabled('clinic') && (
        <section
          className="px-4 bg-gray-50"
          style={{ ...(sectionStyle('clinic') || {}), ...sectionSpacingStyle }}
        >
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-heading font-bold text-gray-900 mb-8 text-center">{businessSection.title}</h2>

          {/* Description */}
          <div className="max-w-3xl mx-auto mb-12">
            {(Array.isArray(businessSection.description)
              ? businessSection.description
              : businessSection.description.split('\n\n')
            ).map((paragraph, idx) => (
              <p key={idx} className="text-subheading text-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className={businessSectionVariant === 'cards' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid lg:grid-cols-2 gap-8'}>
            {/* Features List */}
            <div className="bg-white border-2 border-gray-200 p-8" style={tokenSurfaceStyle}>
              <h3 className="text-subheading font-bold text-gray-900 mb-6">
                {locale === 'en' ? 'Business Features' : '业务特色'}
              </h3>
              <ul className="space-y-3">
                {(businessSection.features && businessSection.features.length > 0
                  ? businessSection.features
                  : businessSection.values.map(value => value.title)
                ).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Location & Hours */}
            <div className={`space-y-6 ${businessSectionVariant === 'cards' ? 'md:col-span-2 lg:col-span-2' : ''}`}>
              {/* Location Card */}
              <div className="bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)] border-2 border-gray-200 p-8" style={tokenSurfaceStyle}>
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0" />
                  <h3 className="text-subheading font-bold text-gray-900">
                    {locale === 'en' ? 'Location' : '地址'}
                  </h3>
                </div>
                <p className="text-gray-700 mb-2">{siteInfo?.address}</p>
                <p className="text-gray-700 mb-4">
                  {siteInfo?.city}, {siteInfo?.state} {siteInfo?.zip}
                </p>
                {siteInfo?.addressMapUrl && (
                  <a
                    href={siteInfo.addressMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary hover:text-primary-dark font-semibold text-small"
                  >
                    {locale === 'en' ? 'Get Directions' : '获取路线'} →
                  </a>
                )}
              </div>

              {/* Hours Card */}
              <div className="bg-white border-2 border-gray-200 p-8" style={tokenSurfaceStyle}>
                <div className="flex items-start gap-3 mb-4">
                  <Clock className="w-6 h-6 text-primary shrink-0" />
                  <h3 className="text-subheading font-bold text-gray-900">
                    {locale === 'en' ? 'Office Hours' : '营业时间'}
                  </h3>
                </div>
                <div className="space-y-2">
                  {(contactContent?.hours?.schedule || []).map((hour, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span className="font-medium">{hour.day}</span>
                      <span>{hour.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* CTA Section */}
      {isEnabled('cta') && (
        <div style={sectionStyle('cta')}>
          <CTASection
            title={cta.title}
            subtitle={cta.description}
            primaryCta={cta.primaryCta}
            secondaryCta={cta.secondaryCta}
            variant={cta.variant || 'centered'}
            className=""
          />
        </div>
      )}
    </main>
  );
}
