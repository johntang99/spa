'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { Button, Badge, Icon } from '@/components/ui';
import { HeroVariant, heroVariantConfig, getSectionClasses } from '@/lib/section-variants';
import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  variant?: HeroVariant;
  topSpacingMode?: 'default' | 'extra';
  businessName?: string;
  clinicName?: string;
  tagline: string;
  description: string;
  badgeText?: string;
  primaryCta?: {
    text: string;
    link: string;
  };
  secondaryCta?: {
    text: string;
    link: string;
  };
  image?: string;
  video?: string;
  gallery?: string[];
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
  trustBadges?: string[];
  className?: string;
  priority?: boolean;
  photoOverlayOpacity?: number;
  photoContentPosition?: 'center' | 'center-below' | 'left' | 'left-below' | 'lower';
  screenwideHeightDesktop?: number;
}

export default function HeroSection({
  variant = 'centered',
  topSpacingMode = 'default',
  businessName,
  clinicName: legacyName,
  tagline,
  description,
  badgeText,
  primaryCta,
  secondaryCta,
  image,
  video,
  gallery,
  floatingTags,
  stats,
  credentials,
  trustBadges,
  className,
  priority,
  photoOverlayOpacity = 0.5,
  photoContentPosition = 'center',
  screenwideHeightDesktop,
}: HeroSectionProps) {
  const config = heroVariantConfig[variant];
  const sectionClasses = getSectionClasses(config);
  const displayName = businessName || legacyName || '';
  const normalizedPhotoContentPosition =
    photoContentPosition === 'lower' ? 'left-below' : photoContentPosition;
  const isBelowPosition =
    normalizedPhotoContentPosition === 'center-below' ||
    normalizedPhotoContentPosition === 'left-below';
  const isCenterAlignedPosition =
    normalizedPhotoContentPosition === 'center' ||
    normalizedPhotoContentPosition === 'center-below';
  const topPaddingValue =
    topSpacingMode === 'extra'
      ? 'calc(var(--section-padding-y, 5rem) + 2.5rem)'
      : 'var(--section-padding-y, 5rem)';
  const backdropGradientStyle = {
    backgroundImage:
      'linear-gradient(135deg, var(--backdrop-primary), var(--backdrop-secondary), var(--backdrop-primary))',
  };
  const galleryImages = useMemo(
    () =>
      Array.isArray(gallery)
        ? gallery.filter((src): src is string => typeof src === 'string' && src.trim().length > 0)
        : [],
    [gallery]
  );
  const galleryBackgroundImages = useMemo(() => {
    if (variant !== 'gallery-background' && variant !== 'gallery-screenwide-top') return galleryImages;
    const merged = [image, ...galleryImages].filter(
      (src): src is string => typeof src === 'string' && src.trim().length > 0
    );
    return Array.from(new Set(merged));
  }, [variant, image, galleryImages]);
  const useGalleryBackground =
    (variant === 'gallery-background' || variant === 'gallery-screenwide-top') &&
    galleryBackgroundImages.length > 0;
  const shouldRotateGallery = useGalleryBackground && galleryBackgroundImages.length > 1;
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const normalizedScreenwideDesktopHeight =
    typeof screenwideHeightDesktop === 'number' && Number.isFinite(screenwideHeightDesktop)
      ? Math.min(1200, Math.max(320, Math.round(screenwideHeightDesktop)))
      : 600;
  const screenwideMediaStyle = {
    '--hero-screenwide-height-lg': `${normalizedScreenwideDesktopHeight}px`,
  } as CSSProperties;

  useEffect(() => {
    setActiveGalleryIndex(0);
  }, [variant, galleryBackgroundImages]);

  useEffect(() => {
    if (!shouldRotateGallery) return;
    const timerId = window.setInterval(() => {
      setActiveGalleryIndex((current) => (current + 1) % galleryBackgroundImages.length);
    }, 3000);
    return () => window.clearInterval(timerId);
  }, [shouldRotateGallery, galleryBackgroundImages.length]);
  const sectionPaddingStyle = {
    paddingTop: topPaddingValue,
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };
  const surfaceTokenStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  
  // Render based on variant
  switch (variant) {
    case 'split-photo-right':
      return (
        <>
          <section
            className={cn(className)}
            style={{ ...backdropGradientStyle, ...sectionPaddingStyle }}
          >
            <div className="container-custom">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content - Left */}
                <div className="space-y-6 max-w-xl">
                  <HeroContent
                    businessName={displayName}
                    tagline={tagline}
                    description={description}
                    badgeText={badgeText}
                    primaryCta={primaryCta}
                    secondaryCta={secondaryCta}
                    floatingTags={floatingTags}
                    trustBadges={trustBadges}
                    align="left"
                  />
                </div>
                
                {/* Image - Right */}
                {image && (
                  <div className="relative w-full max-w-xl mx-auto lg:mx-0">
                    <div className="bg-white/80 overflow-hidden" style={surfaceTokenStyle}>
                      <Image
                        src={image}
                        alt={displayName}
                        width={1200}
                        height={1200}
                        className="w-full h-auto object-contain"
                        priority={priority}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          
          {stats && <HeroStats stats={stats} style="bar" />}
        </>
      );
    
    case 'split-photo-left':
      return (
        <section
          className={cn(sectionClasses, className)}
          style={{ ...backdropGradientStyle, ...sectionPaddingStyle }}
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image - Left */}
            {image && (
              <div className="relative h-[400px] md:h-[500px] overflow-hidden order-2 md:order-1" style={surfaceTokenStyle}>
                <Image
                  src={image}
                  alt={displayName}
                  fill
                  className="object-cover"
                  priority={priority}
                />
              </div>
            )}
            
            {/* Text Content - Right */}
            <div className="space-y-6 order-1 md:order-2">
              <HeroContent
                businessName={displayName}
                tagline={tagline}
                description={description}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                floatingTags={floatingTags}
                trustBadges={trustBadges}
                align="left"
              />
            </div>
          </div>
          
          {stats && <HeroStats stats={stats} />}
        </section>
      );
    
    case 'overlap':
      return (
        <section className={cn('relative min-h-[600px] md:min-h-[700px]', className)}>
          {/* Background Image */}
          {image && (
            <div className="absolute inset-0 z-0">
              <Image
                src={image}
                alt={displayName}
                fill
                className="object-cover"
                priority={priority}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
            </div>
          )}
          
          {/* Overlapping Content */}
          <div className="relative z-10 container-custom" style={sectionPaddingStyle}>
            <div className="max-w-2xl">
              <div className="bg-white/95 backdrop-blur-sm p-8 md:p-12" style={surfaceTokenStyle}>
                <HeroContent
                  businessName={displayName}
                  tagline={tagline}
                  description={description}
                  primaryCta={primaryCta}
                  secondaryCta={secondaryCta}
                  floatingTags={floatingTags}
                  trustBadges={trustBadges}
                  align="left"
                />
              </div>
            </div>
          </div>
          
          {stats && (
            <div className="relative z-10 container-custom -mt-16">
              <HeroStats stats={stats} elevated />
            </div>
          )}
        </section>
      );
    
    case 'gallery-background':
    case 'photo-background':
      return (
        <>
          <section
            className={cn('relative min-h-[600px] md:min-h-[700px]', className)}
          >
            {/* Background Image */}
            {(image || useGalleryBackground) && (
              <>
                {shouldRotateGallery ? (
                  <div className="absolute inset-0 z-0">
                    {galleryBackgroundImages.map((galleryImage, index) => (
                      <div
                        key={`${galleryImage}-${index}`}
                        className={cn(
                          'absolute inset-0 transition-opacity duration-1000',
                          index === activeGalleryIndex ? 'opacity-100' : 'opacity-0'
                        )}
                      >
                        <Image
                          src={galleryImage}
                          alt={`${displayName} ${index + 1}`}
                          fill
                          className="object-cover"
                          priority={priority && index === 0}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={useGalleryBackground ? galleryBackgroundImages[0] : image!}
                      alt={displayName}
                      fill
                      className="object-cover"
                      priority={priority}
                    />
                  </div>
                )}
                <div
                  className="absolute inset-0 z-0"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${photoOverlayOpacity})` }}
                />
              </>
            )}
            
            {/* Content */}
            <div
              className={cn(
                'relative z-10 container-custom flex min-h-[600px]',
                isBelowPosition ? 'items-end' : 'items-center'
              )}
              style={{
                paddingTop: topPaddingValue,
                paddingBottom: isBelowPosition
                  ? 'max(2.5rem, var(--section-padding-y, 5rem))'
                  : 'var(--section-padding-y, 5rem)',
              }}
            >
              <div
                className={cn(
                  'relative max-w-3xl text-white px-4 md:px-8 py-6 md:py-8',
                  isCenterAlignedPosition ? 'mx-auto' : 'mr-auto',
                  isBelowPosition && 'translate-y-6 md:translate-y-10'
                )}
              >
                <div className="absolute -inset-x-10 -inset-y-8 -z-10 pointer-events-none">
                  <div
                    className="w-full h-full"
                    style={{
                      background:
                        isCenterAlignedPosition
                          ? 'radial-gradient(120% 140% at 50% 75%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.42) 34%, rgba(0,0,0,0.2) 58%, rgba(0,0,0,0.08) 72%, rgba(0,0,0,0) 86%)'
                          : 'radial-gradient(120% 140% at 18% 75%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.42) 34%, rgba(0,0,0,0.2) 58%, rgba(0,0,0,0.08) 72%, rgba(0,0,0,0) 86%)',
                      filter: 'blur(8px)',
                    }}
                  />
                </div>
                <HeroContent
                  businessName={displayName}
                  tagline={tagline}
                  description={description}
                  primaryCta={primaryCta}
                  secondaryCta={secondaryCta}
                  floatingTags={floatingTags}
                  trustBadges={trustBadges}
                  align={isCenterAlignedPosition ? 'center' : 'left'}
                  theme="dark"
                />
              </div>
            </div>
          </section>
          
          {/* Stats Bar - 1/3 Overlap */}
          {stats && (
            <div className="relative -mt-12 z-20">
              <div className="container-custom">
                <HeroStats stats={stats} elevated />
              </div>
            </div>
          )}
        </>
      );

    case 'gallery-screenwide-top':
    case 'photo-screenwide-top':
      return (
        <section className={cn('relative w-full', className)}>
          {(image || useGalleryBackground) && (
            <div
              className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] lg:h-[var(--hero-screenwide-height-lg)] overflow-hidden"
              style={screenwideMediaStyle}
            >
              {shouldRotateGallery ? (
                <>
                  {galleryBackgroundImages.map((galleryImage, index) => (
                    <div
                      key={`${galleryImage}-${index}`}
                      className={cn(
                        'absolute inset-0 transition-opacity duration-1000',
                        index === activeGalleryIndex ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <Image
                        src={galleryImage}
                        alt={`${displayName} ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={priority && index === 0}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <Image
                  src={useGalleryBackground ? galleryBackgroundImages[0] : image!}
                  alt={displayName}
                  fill
                  className="object-cover"
                  priority={priority}
                />
              )}
              {photoOverlayOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${photoOverlayOpacity})` }}
                />
              )}
            </div>
          )}

          <div style={backdropGradientStyle}>
            <div className="container-custom py-10 md:py-14">
              <div className="max-w-4xl mx-auto">
                <HeroContent
                  businessName={displayName}
                  tagline={tagline}
                  description={description}
                  badgeText={badgeText}
                  primaryCta={primaryCta}
                  secondaryCta={secondaryCta}
                  floatingTags={floatingTags}
                  trustBadges={trustBadges}
                  align="center"
                />
              </div>

              {stats && (
                <div className="mt-6">
                  <HeroStats stats={stats} style="bar" />
                </div>
              )}
            </div>
          </div>
        </section>
      );
    
    case 'video-background':
      return (
        <section className={cn('relative min-h-[600px] md:min-h-[700px] overflow-hidden', className)}>
          {/* Video Background */}
          {video && (
            <>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              >
                <source src={video} type="video/mp4" />
              </video>
              <div className="absolute inset-0 z-0 bg-black/40" />
            </>
          )}
          
          {/* Content */}
          <div className="relative z-10 container-custom flex items-center min-h-[600px]" style={sectionPaddingStyle}>
            <div className="max-w-3xl mx-auto text-white">
              <HeroContent
                businessName={displayName}
                tagline={tagline}
                description={description}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                floatingTags={floatingTags}
                trustBadges={trustBadges}
                align="center"
                theme="dark"
              />
            </div>
          </div>
          
          {stats && (
            <div className="relative z-10 container-custom -mt-16">
              <HeroStats stats={stats} elevated />
            </div>
          )}
        </section>
      );
    
    case 'centered':
    default:
      return (
        <section
          className={cn(sectionClasses, className)}
          style={{ ...backdropGradientStyle, ...sectionPaddingStyle }}
        >
          <div className="max-w-4xl mx-auto">
            <HeroContent
              businessName={displayName}
              tagline={tagline}
              description={description}
              primaryCta={primaryCta}
              secondaryCta={secondaryCta}
              floatingTags={floatingTags}
              trustBadges={trustBadges}
              align="center"
            />
          </div>
          
          {stats && <HeroStats stats={stats} />}
        </section>
      );
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface HeroContentProps {
  businessName: string;
  tagline: string;
  description: string;
  badgeText?: string;
  primaryCta?: { text: string; link: string };
  secondaryCta?: { text: string; link: string };
  floatingTags?: string[];
  trustBadges?: string[];
  align: 'left' | 'center';
  theme?: 'light' | 'dark';
}

function HeroContent({
  businessName,
  tagline,
  description,
  badgeText,
  primaryCta,
  secondaryCta,
  floatingTags,
  trustBadges,
  align,
  theme = 'light',
}: HeroContentProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const taglineColor = theme === 'dark' ? 'text-white' : 'text-primary';
  const descColor = theme === 'dark' ? 'text-white/90' : 'text-gray-700';
  
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      {/* Badge */}
      {badgeText && (
        <div className={cn('mb-4', align === 'center' ? 'flex justify-center' : '')}>
          <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
            theme === 'dark'
              ? 'bg-white/20 text-white'
              : 'bg-primary/10 text-primary'
          )}>
            {badgeText}
          </span>
        </div>
      )}
      {/* Business Name */}
      <h1 className={cn('text-display font-bold mb-4 animate-fade-in', textColor)}>
        {businessName}
      </h1>
      
      {/* Tagline */}
      <p className={cn('text-heading mb-6 animate-fade-in animate-delay-100', taglineColor)}>
        {tagline}
      </p>
      
      {/* Description */}
      <p className={cn('text-body mb-8 max-w-2xl animate-fade-in animate-delay-200', descColor, align === 'center' && 'mx-auto')}>
        {description}
      </p>
      
      {/* CTAs */}
      {(primaryCta || secondaryCta) && (
        <div className={cn('flex gap-4 mb-8 animate-fade-in animate-delay-300', align === 'center' ? 'justify-center flex-wrap' : 'flex-wrap')}>
          {primaryCta && (
            <a 
              href={primaryCta.link}
              className={cn(
                'inline-flex items-center justify-center font-semibold transition-all duration-200 px-8 py-4 text-subheading',
                theme === 'dark' 
                  ? 'bg-white text-primary hover:bg-gray-100 border-2 border-white' 
                  : 'bg-primary text-white hover:bg-primary-dark'
              )}
              style={{
                borderRadius: 'var(--radius-base, 0.5rem)',
                boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
              }}
            >
              {primaryCta.text}
            </a>
          )}
          {secondaryCta && (
            <a 
              href={secondaryCta.link}
              className={cn(
                'inline-flex items-center justify-center font-semibold transition-all duration-200 px-8 py-4 text-subheading',
                theme === 'dark' 
                  ? 'border-2 border-white text-white hover:bg-white hover:text-primary bg-white/10 backdrop-blur-sm' 
                  : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
              )}
              style={{
                borderRadius: 'var(--radius-base, 0.5rem)',
                boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
              }}
            >
              {secondaryCta.text}
            </a>
          )}
        </div>
      )}
      
      {/* Floating Tags */}
      {floatingTags && floatingTags.length > 0 && (
        <div className={cn('flex gap-3 mb-6 animate-fade-in animate-delay-300', align === 'center' ? 'justify-center flex-wrap' : 'flex-wrap')}>
          {floatingTags.map((tag, index) => (
            <span
              key={index}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                theme === 'dark'
                  ? 'bg-white/20 text-white'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <CheckCircle2 className={cn(
                'h-4 w-4',
                theme === 'dark'
                  ? 'text-white'
                  : 'text-primary'
              )} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface HeroStatsProps {
  stats: Array<{
    icon?: string;
    number: string;
    label: string;
  }>;
  elevated?: boolean;
  style?: 'card' | 'bar';
}

function HeroStats({ stats, elevated, style = 'card' }: HeroStatsProps) {
  // Map icon names from stats to actual icon components
  const getIconName = (iconName?: string) => {
    if (!iconName) return 'Award';
    // Map common icon names
    const iconMap: Record<string, string> = {
      'Award': 'Award',
      'Heart': 'Heart',
      'Star': 'Star',
      'Sparkles': 'Sparkles',
      'Users': 'Users',
      'Trophy': 'Trophy',
      'Target': 'Target',
      'CheckCircle': 'CheckCircle',
    };
    return iconMap[iconName] || 'Award';
  };

  const content = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm flex items-center justify-center" style={{ borderRadius: 'var(--radius-base, 0.75rem)' }}>
              <Icon 
                name={getIconName(stat.icon) as any} 
                className="text-white" 
                size="lg"
              />
            </div>
          </div>
          
          {/* Number */}
          <div className="text-3xl md:text-4xl font-bold text-white mb-2">
            {stat.number}
          </div>
          
          {/* Label */}
          <div className="text-xs md:text-sm text-white/90 font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );

  if (style === 'bar') {
    return (
      <section className="bg-primary py-10 md:py-12">
        <div className="container-custom max-w-6xl">
          {content}
        </div>
      </section>
    );
  }

  return (
    <div className={cn(
      elevated 
        ? 'bg-primary p-6 md:p-8' 
        : 'mt-16'
    )}
    style={elevated ? { borderRadius: 'var(--radius-base, 0.75rem)', boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))' } : undefined}
    >
      {content}
    </div>
  );
}

// Export Credentials as separate component
export interface CredentialsSectionProps {
  credentials: Array<{
    icon: string;
    text: string;
  }>;
}

export function CredentialsSection({ credentials }: CredentialsSectionProps) {
  // Map icon names
  const getIconName = (iconName: string) => {
    const iconMap: Record<string, string> = {
      'Certificate': 'Award',
      'Award': 'Award',
      'Shield': 'Shield',
      'ShieldCheck': 'ShieldCheck',
      'Users': 'Users',
      'TrendingUp': 'TrendingUp',
      'CheckCircle': 'CheckCircle',
      'UserCheck': 'UserCheck',
    };
    return iconMap[iconName] || 'CheckCircle';
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container-custom">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {credentials.map((credential, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon 
                  name={getIconName(credential.icon) as any} 
                  className="text-primary" 
                  size="md"
                />
              </div>
              <span className="text-sm md:text-base text-gray-700 font-medium whitespace-nowrap">
                {credential.text}
              </span>
            </div>
          ))}
        </div>
    </div>
    </section>
  );
}
