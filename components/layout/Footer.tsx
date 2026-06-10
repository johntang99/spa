import Link from 'next/link';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { getDefaultFooter } from '@/lib/footer';
import type { FooterSection } from '@/lib/types';
import { Locale } from '@/lib/i18n';

interface FooterProps {
  locale: Locale;
  siteId: string;
  footer?: FooterSection;
}

export default function Footer({ locale, siteId, footer }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const resolvedFooter = footer ?? getDefaultFooter(locale);
  const copyright =
    resolvedFooter.copyright.replace('{year}', String(currentYear));
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                {resolvedFooter.brand.logoText}
              </div>
              <div className="font-bold text-xl text-white">
                {resolvedFooter.brand.name}
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {resolvedFooter.brand.description}
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {resolvedFooter.quickLinksTitle || (locale === 'en' ? 'Quick Links' : '快速链接')}
            </h3>
            <ul className="space-y-2">
              {resolvedFooter.quickLinks.map((link) => (
                <li key={link.url}>
                  <Link
                    href={link.url}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {resolvedFooter.servicesTitle || (locale === 'en' ? 'Services' : '服务')}
            </h3>
            <ul className="space-y-2">
              {resolvedFooter.services.map((service) => (
                <li key={service.url}>
                  <Link
                    href={service.url}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {service.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {locale === 'en' ? 'Contact Us' : '联系我们'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary-light" />
                <span>
                  {resolvedFooter.contact.addressLines.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {line}
                      {index < resolvedFooter.contact.addressLines.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0 text-primary-light" />
                <a
                  href={resolvedFooter.contact.phoneLink || '#'}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {resolvedFooter.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0 text-primary-light" />
                <a
                  href={resolvedFooter.contact.emailLink || '#'}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {resolvedFooter.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 mt-1 flex-shrink-0 text-primary-light" />
                <div>
                  {resolvedFooter.hours.map((line, index) => (
                    <div key={`${line}-${index}`}>{line}</div>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div>{copyright}</div>
            {resolvedFooter.legalLinks && resolvedFooter.legalLinks.length > 0 && (
              <div className="flex gap-6">
                {resolvedFooter.legalLinks.map((link) => (
                  <Link
                    key={link.url}
                    href={link.url}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {resolvedFooter.disclaimer?.trim() && (
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              {resolvedFooter.disclaimer}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
