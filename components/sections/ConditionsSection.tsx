import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, Badge, Tabs, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Condition } from '@/lib/types';

export interface ConditionsSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  conditions: Condition[];
  moreLink?: {
    text: string;
    url: string;
  };
  variant?:
    | 'grid-cards'
    | 'grid-cards-4x'
    | 'grid-cards-3x'
    | 'categories-tabs'
    | 'list-detailed'
    | 'icon-grid';
  className?: string;
}

export default function ConditionsSection({
  badge,
  title,
  subtitle,
  conditions,
  moreLink,
  variant = 'grid-cards-4x',
  className,
}: ConditionsSectionProps) {
  // Backward compatibility for existing content that still uses "grid-cards".
  const normalizedVariant = variant === 'grid-cards' ? 'grid-cards-4x' : variant;

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

        {/* Render based on variant */}
        {(normalizedVariant === 'grid-cards-4x' || normalizedVariant === 'grid-cards-3x') && (
          <ConditionsGrid
            conditions={conditions}
            columns={normalizedVariant === 'grid-cards-3x' ? 3 : 4}
          />
        )}
        
        {normalizedVariant === 'categories-tabs' && (
          <ConditionsTabs conditions={conditions} />
        )}
        
        {normalizedVariant === 'list-detailed' && (
          <ConditionsList conditions={conditions} />
        )}
        
        {normalizedVariant === 'icon-grid' && (
          <ConditionsIconGrid conditions={conditions} />
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

function ConditionsGrid({
  conditions,
  columns,
}: {
  conditions: Condition[];
  columns: 3 | 4;
}) {
  const gridClassName =
    columns === 3 ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid md:grid-cols-2 lg:grid-cols-4 gap-6';
  return (
    <div className={gridClassName}>
      {conditions.map((condition) => (
        <ConditionCard key={condition.id} condition={condition} />
      ))}
    </div>
  );
}

function ConditionsTabs({ conditions }: { conditions: Condition[] }) {
  // Group by category
  const categories = Array.from(new Set(conditions.map(c => c.category)));
  
  const tabs = categories.map((category) => ({
    id: category,
    label: category,
    content: (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {conditions
          .filter(c => c.category === category)
          .map(condition => (
            <ConditionCard key={condition.id} condition={condition} compact />
          ))}
      </div>
    ),
  }));
  
  return <Tabs tabs={tabs} variant="pills" />;
}

function ConditionsList({ conditions }: { conditions: Condition[] }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {conditions.map((condition) => (
        <Card key={condition.id} variant="default" hover>
          <CardContent className="md:flex gap-6 items-start">
            {/* Icon */}
            {condition.image ? (
              <div className="relative flex-shrink-0 w-full md:w-28 h-20 md:h-24 rounded-xl overflow-hidden bg-gray-200 mb-4 md:mb-0">
                <Image
                  src={condition.image}
                  alt={condition.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-4 md:mb-0">
                <Icon name={condition.icon as any} size="lg" className="text-primary" />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-subheading font-bold">{condition.title}</h3>
                <Badge variant="secondary" size="sm">
                  {condition.category}
                </Badge>
              </div>
              <p className="text-gray-700 mb-4">{condition.description}</p>
              
              {/* Symptoms */}
              {condition.symptoms && condition.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {condition.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="primary" size="sm">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ConditionsIconGrid({ conditions }: { conditions: Condition[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {conditions.map((condition) => (
        <Link
          key={condition.id}
          href={condition.link || '#'}
          className="group"
        >
          <div className="text-center p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all">
            {condition.image ? (
              <div className="relative w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden bg-gray-200 group-hover:scale-105 transition-transform">
                <Image
                  src={condition.image}
                  alt={condition.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Icon name={condition.icon as any} size="lg" className="text-primary" />
              </div>
            )}
            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {condition.title}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============================================
// CONDITION CARD COMPONENT
// ============================================

interface ConditionCardProps {
  condition: Condition;
  compact?: boolean;
}

function ConditionCard({ condition, compact }: ConditionCardProps) {
  const CardWrapper = condition.link ? Link : 'div';
  
  return (
    <CardWrapper href={condition.link || '#'} className={condition.link ? 'block' : ''}>
      <Card variant="default" hover padding="none" className="h-full overflow-hidden">
        {condition.image && (
          <div className="relative w-full aspect-[4/3] bg-gray-200">
            <Image
              src={condition.image}
              alt={condition.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <CardHeader className="mb-3">
            {/* Icon (fallback when no image) */}
            {!condition.image && (
              <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                <Icon name={condition.icon as any} size="md" className="text-primary" />
              </div>
            )}
            
            {/* Category Badge */}
            <Badge variant="secondary" size="sm" className="mb-2">
              {condition.category}
            </Badge>
            
            <CardTitle>{condition.title}</CardTitle>
          </CardHeader>
          
          <CardContent>
            {!compact && (
              <p className="text-gray-700 text-sm mb-4">{condition.description}</p>
            )}
            
            {/* Symptoms */}
            {condition.symptoms && condition.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {condition.symptoms.slice(0, compact ? 2 : 3).map((symptom, index) => (
                  <Badge key={index} variant="primary" size="sm">
                    {symptom}
                  </Badge>
                ))}
                {condition.symptoms.length > (compact ? 2 : 3) && (
                  <Badge variant="primary" size="sm">
                    +{condition.symptoms.length - (compact ? 2 : 3)}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </CardWrapper>
  );
}
