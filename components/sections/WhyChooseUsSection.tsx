import Image from 'next/image';
import { Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Feature } from '@/lib/types';
import { Award, Heart, Users, Star, Shield, Clock } from 'lucide-react';

export interface WhyChooseUsSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  features: Feature[];
  variant?: 'cards' | 'grid-icons' | 'list';
  className?: string;
}

export default function WhyChooseUsSection({
  badge,
  title,
  subtitle,
  features,
  variant = 'cards',
  className,
}: WhyChooseUsSectionProps) {
  return (
    <section className={cn('section-padding bg-white', className)}>
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
        {variant === 'cards' && (
          <FeaturesCards features={features} />
        )}
        
        {variant === 'grid-icons' && (
          <FeaturesGridIcons features={features} />
        )}
        
        {variant === 'list' && (
          <FeaturesList features={features} />
        )}
      </div>
    </section>
  );
}

// ============================================
// VARIANT COMPONENTS
// ============================================

function FeaturesCards({ features }: { features: Feature[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <Card key={index} variant="default" hover padding="none" className="relative overflow-hidden">
          {/* Image or Icon */}
          {feature.image ? (
            <div className="relative w-full aspect-video bg-gray-200">
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="p-6 pb-0">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <FeatureIcon icon={feature.icon} />
              </div>
            </div>
          )}
          
          <CardHeader className="px-6 pt-6">
            <CardTitle>{feature.title}</CardTitle>
          </CardHeader>
          
          <CardContent className="px-6 pb-6">
            <p className="text-gray-600">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FeaturesGridIcons({ features }: { features: Feature[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <div key={index} className="flex gap-4 items-start p-6 rounded-xl hover:bg-gray-50 transition-colors">
          {/* Image or Icon */}
          {feature.image ? (
            <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              <FeatureIcon icon={feature.icon} />
            </div>
          )}
          
          {/* Content */}
          <div>
            <h3 className="font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturesList({ features }: { features: Feature[] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {features.map((feature, index) => (
        <Card key={index} variant="bordered" hover>
          <CardContent className="flex gap-6 items-start">
            {/* Image or Icon */}
            {feature.image ? (
              <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                <FeatureIcon icon={feature.icon} className="text-white" />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 pt-2">
              <h3 className="text-subheading font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// FEATURE ICON COMPONENT
// ============================================

const iconMap = {
  Award,
  Heart,
  Users,
  Star,
  Shield,
  Clock,
};

function FeatureIcon({ icon, className }: { icon?: string; className?: string }) {
  const IconComponent = icon && iconMap[icon as keyof typeof iconMap] ? iconMap[icon as keyof typeof iconMap] : Star;
  
  return <IconComponent size={24} className={cn('text-primary', className)} />;
}
