import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Button, Badge, Icon, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import ContactForm from '@/components/ContactForm';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';

interface ContactPageContent {
  hero: {
    variant?:
      | 'centered'
      | 'split-photo-right'
      | 'split-photo-left'
      | 'photo-background'
      | 'gallery-background';
    title: string;
    subtitle: string;
    backgroundImage?: string;
    gallery?: string[];
    photoOverlayOpacity?: number;
    photoContentPosition?: 'center' | 'center-below' | 'left' | 'left-below' | 'lower';
  };
  introduction: { variant?: 'centered' | 'left'; text: string };
  contactMethods: Array<{
    icon: string;
    title: string;
    primary: string;
    secondary: string | null;
    description: string;
    action: { text: string; link: string };
  }>;
  hours: {
    variant?: 'grid' | 'list';
    title: string;
    schedule: Array<{ day: string; time: string; isOpen: boolean; note?: string }>;
    note: string;
  };
  form: {
    variant?: 'single-column' | 'two-column' | 'multi-step' | 'modal' | 'inline-minimal';
    title: string;
    subtitle: string;
    fields: {
      name: { label: string; placeholder: string; required: boolean };
      email: { label: string; placeholder: string; required: boolean };
      phone: { label: string; placeholder: string; required: boolean };
      reason: { label: string; placeholder: string; required: boolean; options: string[] };
      message: { label: string; placeholder: string; required: boolean };
    };
    submitButton: { text: string };
    successMessage: string;
    errorMessage: string;
  };
  map: {
    variant?: 'shown' | 'hidden';
    title: string;
    embedUrl: string;
    showMap: boolean;
    directions: string;
  };
  emergency: {
    title: string;
    message: string;
    phone: string;
    visible: boolean;
  };
  faq: {
    variant?: 'card' | 'simple';
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  cta?: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
  };
}

interface ContactPageProps {
  params: {
    locale: Locale;
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

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ContactPageContent>('contact', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('contact.layout', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'contact',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.introduction?.text,
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ContactPageContent>('contact', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('contact.layout', locale, siteId);
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');
  
  if (!content) {
    notFound();
  }

  const { hero, introduction, contactMethods, hours, form, map, emergency, faq, cta } = content;
  const introVariant = introduction.variant || 'centered';
  const hoursVariant = hours.variant || 'grid';
  const showMap = map.variant === 'hidden' ? false : map.showMap;
  const faqVariant = faq.variant || 'card';
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => !useLayout || layoutOrder.has(sectionId);
  const sectionStyle = (sectionId: string) =>
    useLayout ? { order: layoutOrder.get(sectionId) ?? 0 } : undefined;
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const renderEmailWithPreferredBreaks = (value: string) => {
    const atIndex = value.indexOf('@');
    if (atIndex === -1) return value;
    const local = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1);
    const domainParts = domain.split('.');
    return (
      <>
        {local}
        <wbr />@<wbr />
        {domainParts.map((part, index) => (
          <span key={`${part}-${index}`}>
            {index > 0 && (
              <>
                <wbr />.
              </>
            )}
            {part}
          </span>
        ))}
      </>
    );
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {isEnabled('hero') && (
        <div style={sectionStyle('hero')}>
          <HeroSection
            variant={(hero.variant as HeroVariant) || 'centered'}
            topSpacingMode={isTransparentMenu ? 'extra' : 'default'}
            tagline={hero.title}
            description={hero.subtitle}
            badgeText="Contact Us"
            image={hero.backgroundImage || undefined}
            gallery={Array.isArray(hero.gallery) ? hero.gallery : undefined}
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

      {/* Introduction */}
      {isEnabled('introduction') && (
        <section className="py-12 bg-white" style={sectionStyle('introduction')}>
        <div className="container mx-auto px-4">
          <div className={`max-w-4xl mx-auto ${introVariant === 'left' ? 'text-left' : 'text-center'}`}>
            <p className="text-lg text-gray-700">
              {introduction.text}
            </p>
          </div>
        </div>
        </section>
      )}

      {/* Emergency Notice */}
      {isEnabled('emergency') && emergency.visible && (
        <section
          className="py-6 bg-red-50 border-y border-red-100"
          style={sectionStyle('emergency')}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto flex items-start gap-4">
              <Icon name="AlertTriangle" className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">{emergency.title}</h3>
                <p className="text-red-800 text-sm">
                  {emergency.message}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Methods */}
      {isEnabled('contactMethods') && (
        <section
          className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white"
          style={sectionStyle('contactMethods')}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon name={method.icon as any} className="text-primary" size="lg" />
                    </div>
                    <CardTitle>{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`font-bold text-primary mb-1 leading-tight ${
                        method.icon === 'Mail'
                          ? 'text-xl md:text-2xl whitespace-normal break-words [overflow-wrap:anywhere]'
                          : 'text-2xl'
                      }`}
                    >
                      {method.icon === 'Mail'
                        ? renderEmailWithPreferredBreaks(method.primary)
                        : method.primary}
                    </p>
                    {method.secondary && (
                      <p className="text-gray-600 mb-4">{method.secondary}</p>
                    )}
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={method.action.link} target={method.icon === 'MapPin' ? '_blank' : undefined} rel={method.icon === 'MapPin' ? 'noopener noreferrer' : undefined}>
                        {method.action.text}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Hours of Operation */}
            <Card className="mb-16">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon name="Clock" className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>{hours.title}</CardTitle>
                    <CardDescription>{hours.note}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={hoursVariant === 'list' ? 'space-y-3' : 'grid sm:grid-cols-2 gap-4'}>
                  {hours.schedule.map((schedule) => (
                    <div key={schedule.day} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-900">{schedule.day}</span>
                        {schedule.note && (
                          <p className="text-xs text-primary mt-1">{schedule.note}</p>
                        )}
                      </div>
                      <span className={schedule.isOpen ? 'text-gray-600' : 'text-gray-400'}>
                        {schedule.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </section>
      )}

      {/* Contact Form & Map */}
      {isEnabled('formMap') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('formMap')}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-heading font-bold text-gray-900 mb-4">
                  {form.title}
                </h2>
                <p className="text-gray-600 mb-8">
                  {form.subtitle}
                </p>

                <ContactForm 
                  formConfig={form}
                  locale={locale}
                />
              </div>

              {/* Map & Quick Answers */}
              <div className="space-y-8">
                {/* Map */}
                {showMap && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{map.title}</h3>
                    <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                      <iframe
                        title="Business location map"
                        src={map.embedUrl}
                        className="absolute inset-0 w-full h-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {map.directions}
                    </p>
                  </div>
                )}

                {/* Quick Answers */}
                {faqVariant === 'simple' ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">{faq.title}</h3>
                    {faq.items.map((item, index) => (
                      <div key={index}>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.question}</h4>
                        <p className="text-gray-600 text-sm">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{faq.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {faq.items.map((item, index) => (
                        <div key={index}>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.question}</h4>
                          <p className="text-gray-600 text-sm">{item.answer}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* CTA Section */}
      {isEnabled('cta') && (
        <section
          className="py-16 px-4 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]"
          style={sectionStyle('cta')}
        >
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-heading text-white mb-4">
            {cta?.title || (locale === 'en' ? 'Need help getting started?' : '初次了解服务？')}
          </h2>
          <p className="text-subheading mb-10 leading-relaxed max-w-3xl mx-auto text-white/95">
            {cta?.subtitle ||
              (locale === 'en'
                ? 'Learn what to expect before getting started'
                : '了解开始服务前需要准备的内容')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={cta?.buttonLink || `/${locale}/book`}
              className="bg-white text-[var(--primary)] px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-subheading transition-all shadow-lg"
            >
              {cta?.buttonText || (locale === 'en' ? 'Getting Started Guide' : '新手指南')}
            </Link>
          </div>
        </div>
        </section>
      )}
    </main>
  );
}
