// System S footer — matches prototypes/*.html .site-footer. NAP renders from site.json
// (single source); columns + compliance bar from footer.json. Server component.
import Link from 'next/link';

interface FooterLink { url: string; text: string }
interface FooterConfig {
  brand?: { name?: string; description?: string };
  services?: FooterLink[];
  quickLinks?: FooterLink[];
  legalLinks?: FooterLink[];
  copyright?: string;
}
interface SiteInfo {
  clinicName?: string; address?: string; phone?: string; phoneHref?: string;
  email?: string; licenseLine?: string;
}

export default function SpaFooter({
  locale,
  footer,
  siteInfo,
}: {
  locale: 'en' | 'zh';
  footer?: FooterConfig;
  siteInfo?: SiteInfo;
}) {
  const name = siteInfo?.clinicName || footer?.brand?.name || 'Spa Paradise';
  const phone = siteInfo?.phone || '';
  const phoneHref = `tel:${(phone || '').replace(/[^0-9]/g, '')}`;
  const hoursLabel = locale === 'zh' ? '每天营业 · 9:00–21:00' : 'Open every day · 9:00am – 9:00pm';
  const year = new Date().getFullYear();
  const copyright = (footer?.copyright || `© {year} ${name}`).replace('{year}', String(year));

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link className="logo" href={`/${locale}`} style={{ color: 'var(--porcelain)' }}>
              <span>{name}</span><span className="mark" aria-hidden>◦</span>
            </Link>
            <address className="footer-nap" style={{ marginTop: 14 }}>
              <strong>{name}</strong><br />
              {siteInfo?.address}<br />
              <a href={phoneHref}>{phone}</a><br />
              {siteInfo?.email}<br />
              {hoursLabel}
            </address>
          </div>

          {footer?.services?.length ? (
            <div>
              <h4>{locale === 'zh' ? '护理项目' : 'Services'}</h4>
              {footer.services.map((l) => (
                <span key={l.url}><Link href={l.url}>{l.text}</Link><br /></span>
              ))}
            </div>
          ) : null}

          {footer?.quickLinks?.length ? (
            <div>
              <h4>{locale === 'zh' ? '快速链接' : 'Explore'}</h4>
              {footer.quickLinks.map((l) => (
                <span key={l.url}><Link href={l.url}>{l.text}</Link><br /></span>
              ))}
            </div>
          ) : null}

          <div>
            <h4>{locale === 'zh' ? '到访' : 'Visit'}</h4>
            <Link href={`/${locale}/book`}>{locale === 'zh' ? '立即预约' : 'Book Now'}</Link><br />
            <Link href={`/${locale}/contact`}>{locale === 'zh' ? '联系与时间' : 'Contact & Hours'}</Link><br />
            <Link href={`/${locale}/massage-middletown-ny`}>{locale === 'zh' ? '米德尔敦按摩' : 'Massage in Middletown, NY'}</Link>
          </div>
        </div>

        <div className="compliance-bar">
          <span>{copyright} · {siteInfo?.licenseLine}</span>
          <span>
            {(footer?.legalLinks || []).map((l, i) => (
              <span key={l.url}>{i > 0 ? ' · ' : ''}<Link href={l.url}>{l.text}</Link></span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
