import { Badge, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Step } from '@/lib/types';

export interface HowItWorksSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  steps: Step[];
  variant?: 'horizontal' | 'vertical' | 'cards' | 'vertical-image-right';
  image?: string;
  imageAlt?: string;
  className?: string;
}

export default function HowItWorksSection({
  badge,
  title,
  subtitle,
  steps,
  variant = 'horizontal',
  image,
  imageAlt,
  className,
}: HowItWorksSectionProps) {
  return (
    <section className={cn('section-padding bg-white', className)}>
      <div className="container-custom">
        <div className="bg-white shadow-lg rounded-3xl p-8 md:p-12">
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
          {variant === 'horizontal' && (
            <HowItWorksHorizontal steps={steps} />
          )}
          
          {variant === 'vertical' && (
            <HowItWorksVertical steps={steps} />
          )}
          
          {variant === 'cards' && (
            <HowItWorksCards steps={steps} />
          )}

          {variant === 'vertical-image-right' && (
            <HowItWorksVerticalImage steps={steps} image={image} imageAlt={imageAlt} />
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================
// VARIANT COMPONENTS
// ============================================

function HowItWorksHorizontal({ steps }: { steps: Step[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {steps.map((step, index) => (
        <div key={index} className="relative">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-primary/30" />
          )}
          
          <div className="relative z-10">
            {/* Step Number */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
              <span className="text-4xl font-bold text-white">
                {step.number}
              </span>
            </div>
            
            {/* Content */}
            <div className="text-center">
              <h3 className="text-subheading font-bold mb-3">{step.title}</h3>
              {step.duration && (
                <Badge variant="secondary" size="sm" className="mb-3">
                  {step.duration}
                </Badge>
              )}
              <p className="text-gray-600">{step.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HowItWorksVertical({ steps }: { steps: Step[] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-6 items-start">
          {/* Step Number */}
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">
              {step.number}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 pt-2">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-subheading font-bold">{step.title}</h3>
              {step.duration && (
                <Badge variant="secondary" size="sm">
                  {step.duration}
                </Badge>
              )}
            </div>
            <p className="text-gray-600">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HowItWorksCards({ steps }: { steps: Step[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {steps.map((step, index) => (
        <Card key={index} variant="default" hover className="relative overflow-hidden">
          {/* Number Badge */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {step.number}
            </span>
          </div>
          
          <CardContent className="pt-6">
            <h3 className="text-subheading font-bold mb-3 pr-12">
              {step.title}
            </h3>
            {step.duration && (
              <Badge variant="secondary" size="sm" className="mb-3">
                {step.duration}
              </Badge>
            )}
            <p className="text-gray-600">{step.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HowItWorksVerticalImage({
  steps,
  image,
  imageAlt,
}: {
  steps: Step[];
  image?: string;
  imageAlt?: string;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-10 items-start">
      <div>
        <HowItWorksVertical steps={steps} />
      </div>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-transparent">
        {image ? (
          <img
            src={image}
            alt={imageAlt || 'How it works'}
            className="h-full w-full object-contain object-top"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
      </div>
    </div>
  );
}
