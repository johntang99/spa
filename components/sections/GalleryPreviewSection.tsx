import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { Badge, Carousel } from '@/components/ui';
import { cn } from '@/lib/utils';
import { GalleryImage } from '@/lib/types';

export interface GalleryPreviewSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  images: GalleryImage[];
  moreLink?: {
    text: string;
    url: string;
  };
  variant?: 'grid-masonry' | 'grid-uniform' | 'carousel';
  className?: string;
}

export default function GalleryPreviewSection({
  badge,
  title,
  subtitle,
  images,
  moreLink,
  variant = 'grid-uniform',
  className,
}: GalleryPreviewSectionProps) {
  const tokenSurfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  return (
    <section className={cn('section-padding gradient-backdrop', className)}>
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          {badge && (
            <Badge variant="primary" className="mb-4">
              {badge}
            </Badge>
          )}
          <h2 className="text-heading font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Render based on variant */}
        {variant === 'grid-masonry' && (
          <GalleryMasonry images={images} tokenSurfaceStyle={tokenSurfaceStyle} />
        )}
        
        {variant === 'grid-uniform' && (
          <GalleryUniform images={images} tokenSurfaceStyle={tokenSurfaceStyle} />
        )}
        
        {variant === 'carousel' && (
          <GalleryCarousel images={images} tokenSurfaceStyle={tokenSurfaceStyle} />
        )}

        {/* More Link */}
        {moreLink && (
          <div className="text-center mt-12">
            <Link
              href={moreLink.url}
              className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-2 group"
            >
              {moreLink.text}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================
// VARIANT COMPONENTS
// ============================================

function GalleryMasonry({
  images,
  tokenSurfaceStyle,
}: {
  images: GalleryImage[];
  tokenSurfaceStyle: CSSProperties;
}) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {images.map((image, index) => (
        <div key={index} className="break-inside-avoid">
          <GalleryImageCard image={image} tokenSurfaceStyle={tokenSurfaceStyle} />
        </div>
      ))}
    </div>
  );
}

function GalleryUniform({
  images,
  tokenSurfaceStyle,
}: {
  images: GalleryImage[];
  tokenSurfaceStyle: CSSProperties;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <GalleryImageCard key={index} image={image} uniform tokenSurfaceStyle={tokenSurfaceStyle} />
      ))}
    </div>
  );
}

function GalleryCarousel({
  images,
  tokenSurfaceStyle,
}: {
  images: GalleryImage[];
  tokenSurfaceStyle: CSSProperties;
}) {
  return (
    <Carousel autoPlay interval={4000} showDots showArrows>
      {images.map((image, index) => (
        <div key={index} className="relative h-[400px] md:h-[500px] overflow-hidden" style={tokenSurfaceStyle}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
          />
          {image.label && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <p className="text-white font-semibold text-lg">{image.label}</p>
            </div>
          )}
        </div>
      ))}
    </Carousel>
  );
}

// ============================================
// GALLERY IMAGE CARD
// ============================================

interface GalleryImageCardProps {
  image: GalleryImage;
  uniform?: boolean;
  tokenSurfaceStyle: CSSProperties;
}

function GalleryImageCard({ image, uniform, tokenSurfaceStyle }: GalleryImageCardProps) {
  return (
    <div
      className="group relative overflow-hidden transition-all duration-300 cursor-pointer"
      style={tokenSurfaceStyle}
    >
      <div className={cn(
        'relative bg-gray-200',
        uniform ? 'aspect-square' : 'aspect-auto'
      )}>
        <Image
          src={image.src}
          alt={image.alt}
          fill={uniform}
          width={uniform ? undefined : 400}
          height={uniform ? undefined : 300}
          className={cn(
            'object-cover group-hover:scale-110 transition-transform duration-500',
            uniform ? '' : 'w-full h-auto'
          )}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
          {image.label && (
            <div className="w-full p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white font-semibold">{image.label}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
