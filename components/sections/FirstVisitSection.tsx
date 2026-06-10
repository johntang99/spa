import Link from 'next/link';
import { Badge, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Step } from '@/lib/types';

export interface FirstVisitSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  steps: Step[];
  cta?: {
    title: string;
    description: string;
    link: {
      text: string;
      url: string;
    };
  };
  className?: string;
}

export default function FirstVisitSection({
  badge,
  title,
  subtitle,
  steps,
  cta,
  className,
}: FirstVisitSectionProps) {
  return (
    <section className={cn('section-padding bg-gray-50', className)}>
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

        {/* Steps Timeline */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line (Desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-primary/30">
                    <div className="h-full bg-primary w-1/2 animate-pulse" />
                  </div>
                )}
                
                <Card variant="default" hover className="relative z-10 text-center h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">
                      {step.number}
                    </span>
                  </div>
                  
                  <CardContent className="pt-8">
                    <h3 className="font-bold mb-2">{step.title}</h3>
                    {step.duration && (
                      <Badge variant="secondary" size="sm" className="mb-3">
                        {step.duration}
                      </Badge>
                    )}
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Box */}
        {cta && (
          <Card variant="bordered" className="max-w-5xl mx-auto bg-white">
            <CardContent className="text-center py-10 md:py-12">
              <h3 className="text-subheading font-bold mb-3 text-gray-900">{cta.title}</h3>
              <p className="mb-8 text-gray-600 max-w-2xl mx-auto">{cta.description}</p>
              <Link
                href={cta.link.url}
                className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
              >
                {cta.link.text}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
