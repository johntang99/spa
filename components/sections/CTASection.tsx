import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Phone, Mail } from 'lucide-react';

export interface CTASectionProps {
  title: string;
  subtitle?: string;
  primaryCta?: {
    text: string;
    link: string;
  };
  secondaryCta?: {
    text: string;
    link: string;
  };
  contactInfo?: string;
  variant?: 'centered' | 'split' | 'banner' | 'card-elevated';
  image?: string;
  className?: string;
}

export default function CTASection({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  contactInfo,
  variant = 'centered',
  image,
  className,
}: CTASectionProps) {
  const sectionSpacingStyle = {
    paddingTop: 'var(--section-padding-y, 5rem)',
    paddingBottom: 'var(--section-padding-y, 5rem)',
  };
  const tokenSurfaceStyle = {
    borderRadius: 'var(--radius-base, 0.75rem)',
    boxShadow: 'var(--shadow-base, 0 4px 20px rgba(0,0,0,0.08))',
  };
  // Render based on variant
  switch (variant) {
    case 'split':
      return (
        <section className={cn('bg-gray-50', className)} style={sectionSpacingStyle}>
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div>
                <h2 className="text-heading font-bold mb-4">{title}</h2>
                {subtitle && (
                  <p className="text-body text-gray-600 mb-8">{subtitle}</p>
                )}
                <div className="flex gap-4 flex-wrap">
                  {primaryCta && (
                    <Button variant="primary" size="lg" asChild>
                      <Link href={primaryCta.link}>{primaryCta.text}</Link>
                    </Button>
                  )}
                  {secondaryCta && (
                    <Button variant="outline" size="lg" asChild>
                      <Link href={secondaryCta.link}>{secondaryCta.text}</Link>
                    </Button>
                  )}
                </div>
                {contactInfo && (
                  <p className="mt-6 text-gray-600 flex items-center gap-2">
                    <Phone size={18} className="text-primary" />
                    {contactInfo}
                  </p>
                )}
              </div>
              
              {/* Image */}
              {image && (
                <div className="relative h-64 md:h-96 overflow-hidden" style={tokenSurfaceStyle}>
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      );
    
    case 'banner':
      return (
        <section className={cn('relative overflow-hidden', className)}>
          {/* Background */}
          {image ? (
            <>
              <div className="absolute inset-0 z-0">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary/90 to-primary-dark/90" />
            </>
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary to-primary-dark" />
          )}
          
          {/* Content */}
          <div className="relative z-10 container-custom text-center text-white" style={sectionSpacingStyle}>
            <h2 className="text-heading font-bold mb-6">{title}</h2>
            {subtitle && (
              <p className="text-subheading mb-8 max-w-2xl mx-auto text-white/90">{subtitle}</p>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              {primaryCta && (
                <Button variant="outline" size="lg" asChild className="bg-white text-primary hover:bg-gray-100">
                  <Link href={primaryCta.link}>{primaryCta.text}</Link>
                </Button>
              )}
              {secondaryCta && (
                <Button variant="ghost" size="lg" asChild className="text-white border-2 border-white hover:bg-white/10">
                  <Link href={secondaryCta.link}>{secondaryCta.text}</Link>
                </Button>
              )}
            </div>
            {contactInfo && (
              <p className="mt-8 text-white/90">{contactInfo}</p>
            )}
          </div>
        </section>
      );
    
    case 'card-elevated':
      return (
        <section className={cn('bg-gray-50', className)} style={sectionSpacingStyle}>
          <div className="container-custom">
            <Card variant="elevated" className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-primary-dark text-white">
              <CardContent
                className="text-center"
                style={{
                  paddingTop: 'calc(var(--section-padding-y, 5rem) * 0.6)',
                  paddingBottom: 'calc(var(--section-padding-y, 5rem) * 0.6)',
                }}
              >
                <h2 className="text-heading font-bold mb-4">{title}</h2>
                {subtitle && (
                  <p className="text-body mb-8 text-white/90 max-w-2xl mx-auto">{subtitle}</p>
                )}
                <div className="flex gap-4 justify-center flex-wrap">
                  {primaryCta && (
                    <Button variant="outline" size="lg" asChild className="bg-white text-primary hover:bg-gray-100">
                      <Link href={primaryCta.link}>{primaryCta.text}</Link>
                    </Button>
                  )}
                  {secondaryCta && (
                    <Button variant="ghost" size="lg" asChild className="text-white border-2 border-white hover:bg-white/10">
                      <Link href={secondaryCta.link}>{secondaryCta.text}</Link>
                    </Button>
                  )}
                </div>
                {contactInfo && (
                  <p className="mt-6 text-white/90">{contactInfo}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      );
    
    case 'centered':
    default:
      return (
        <section className={cn('section-padding gradient-backdrop', className)}>
          <div className="container-custom text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-heading font-bold mb-6">{title}</h2>
              {subtitle && (
                <p className="text-body text-gray-600 mb-8">{subtitle}</p>
              )}
              <div className="flex gap-4 justify-center flex-wrap">
                {primaryCta && (
                  <Button size="lg" asChild>
                    <Link href={primaryCta.link}>{primaryCta.text}</Link>
                  </Button>
                )}
                {secondaryCta && (
                  <Button variant="outline" size="lg" asChild>
                    <Link href={secondaryCta.link}>{secondaryCta.text}</Link>
                  </Button>
                )}
              </div>
              {contactInfo && (
                <p className="mt-8 text-gray-600 flex items-center justify-center gap-2">
                  <Phone size={18} className="text-primary" />
                  {contactInfo}
                </p>
              )}
            </div>
          </div>
        </section>
      );
  }
}
