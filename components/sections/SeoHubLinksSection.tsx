import Link from 'next/link';
import { Badge } from '@/components/ui';

interface SeoHubLinkItem {
  text: string;
  url: string;
}

interface SeoHubLinksSectionProps {
  badge?: string;
  title: string;
  subtitle?: string;
  links: SeoHubLinkItem[];
}

export default function SeoHubLinksSection({
  badge,
  title,
  subtitle,
  links,
}: SeoHubLinksSectionProps) {
  if (!Array.isArray(links) || links.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16 lg:py-20">
      <div className="container-custom">
        <div className="mb-10 text-center">
          {badge && (
            <Badge variant="primary" className="mb-4">
              {badge}
            </Badge>
          )}
          <h2 className="text-heading font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mx-auto mt-3 max-w-3xl text-gray-600">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <Link
              key={`${item.text}-${item.url}`}
              href={item.url}
              className="group rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-900">{item.text}</span>
                <span className="text-primary transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
