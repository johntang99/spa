// System S section components. Each renders one canonical section from its contract data
// using the .spa-site token classes (globals.css / prototypes/theme.css). Server components.
// The SectionRenderer maps a page's layout to these via SECTION_COMPONENTS.
import React from 'react';
import Link from 'next/link';
import {
  Catalog, Service, servicesInCategory, serviceCount, priceFrom, fmtPrice,
  bookHref, resolveServiceSource, getService,
} from '@/lib/spa/catalog';
import { shouldRenderRating } from '@/lib/contracts/validation-rules';
import TreatmentSelector from './TreatmentSelector';
import Faq from './Faq';
import RelatedLinks from './RelatedLinks';
import MenuTable from './MenuTable';
import RichText from './RichText';
import AddOnsList from './AddOnsList';
import StatsBand from './StatsBand';
import Checklist from './Checklist';
import GalleryGrid from './GalleryGrid';
import ContactForm from './ContactForm';
import ProtectedNotice from './ProtectedNotice';
import BookingForm from './BookingForm';
import AltPaths from './AltPaths';

export interface SectionCtx {
  locale: 'en' | 'zh';
  siteInfo: Record<string, any>;
  catalog: Catalog;
  testimonials: any[];
  team: any[];
  faqs: any[];
  packages: any[];
  giftCards: any[];
  /** category id when rendering a /services/[category] page */
  categoryId?: string;
  mode?: 'light' | 'well' | 'dark';
}

const t = (loc: string, en: string, zh: string) => (loc === 'zh' ? zh : en);
const Section: React.FC<{ mode?: string; id?: string; className?: string; children: React.ReactNode }> = ({ mode = 'light', id, className = '', children }) => (
  <section id={id} className={`section on-${mode} ${className}`}>{children}</section>
);

function TierChips({ service, locale }: { service: Service; locale: string }) {
  return (
    <div className="menu-tiers">
      {service.tiers.map((tier) => (
        <Link key={tier.minutes} className="chip" href={bookHref(locale, service.id, tier.minutes)}>
          {tier.minutes}m <strong>{fmtPrice(tier.price)}</strong>
        </Link>
      ))}
    </div>
  );
}

function TrustCluster({ ctx }: { ctx: SectionCtx }) {
  const gbp = ctx.siteInfo?.gbp || {};
  return (
    <div className="trust-cluster">
      {shouldRenderRating(gbp.reviewCount) && (
        <><span><span className="stars">★★★★★</span> {gbp.rating} · {gbp.reviewCount} {t(ctx.locale, 'reviews', '条评价')}</span><span className="sep">·</span></>
      )}
      <span>{t(ctx.locale, 'Licensed NY therapists', '纽约州持牌理疗师')}</span>
      <span className="sep">·</span>
      <span>{t(ctx.locale, 'No payment required to book', '预约无需付款')}</span>
    </div>
  );
}

/* ---- S01 hero ---- */
export function Hero({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const bg = data.media?.image
    ? { backgroundImage: `url(${data.media.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};
  return (
    <section className="section on-dark hero-anim" style={{ position: 'relative', ...bg }}>
      <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: 820 }}>
        {data.eyebrow && <p className="eyebrow reveal">{data.eyebrow}</p>}
        <h1 className="reveal">{data.headline}</h1>
        <p className="reveal" style={{ fontSize: '1.15rem', maxWidth: '60ch', color: 'var(--text-inverse-muted)' }}>{data.subline}</p>
        {data.badges?.length ? (
          <div className="reveal" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '18px 0' }}>
            {data.badges.map((b: any, i: number) => <span key={i} className="badge"><span className="dot" />{b.label}</span>)}
          </div>
        ) : null}
        <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          {data.ctaPrimary && <Link className="btn btn-primary" href={`/${ctx.locale}${data.ctaPrimary.href}`.replace(`/${ctx.locale}/${ctx.locale}`, `/${ctx.locale}`)}>{data.ctaPrimary.label}</Link>}
          {data.ctaSecondary && <Link className="btn btn-outline" href={`/${ctx.locale}${data.ctaSecondary.href}`.replace(`/${ctx.locale}/${ctx.locale}`, `/${ctx.locale}`)}>{data.ctaSecondary.label}</Link>}
        </div>
        <TrustCluster ctx={ctx} />
      </div>
    </section>
  );
}

/* ---- S02 trustBar ---- */
export function TrustBar({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const gbp = ctx.siteInfo?.gbp || {};
  return (
    <Section mode={ctx.mode}>
      <div className="container" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        {(data.items || []).map((item: any, i: number) => {
          if (item.type === 'rating') {
            if (!shouldRenderRating(gbp.reviewCount)) return null;
            return <span key={i} className="chip"><span className="stars" style={{ color: 'var(--candle)' }}>★</span>&nbsp;<strong>{gbp.rating}</strong>&nbsp;· {gbp.reviewCount} {t(ctx.locale, 'reviews', '条评价')}</span>;
          }
          return <span key={i} className="chip">{item.label}</span>;
        })}
      </div>
    </Section>
  );
}

/* ---- S03 categoryGrid ---- */
export function CategoryGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const cats = (ctx.catalog.categories || []).filter((c) => !['combos-packages', 'add-ons'].includes(c.id));
  return (
    <Section mode={ctx.mode}>
      <div className="container">
        {data.intro && <h2 className="reveal" style={{ textAlign: 'center', marginBottom: 32 }}>{data.intro}</h2>}
        <div className="grid cols-3">
          {cats.map((c) => {
            const pf = priceFrom(ctx.catalog, c.id);
            return (
              <Link key={c.id} href={`/${ctx.locale}/services/${c.id}`} className="card reveal" style={{ textDecoration: 'none' }}>
                <div className="ph ph-light" style={{ aspectRatio: '4/3' }} data-label={c.name} />
                <div className="card-body">
                  <h3 style={{ marginBottom: 4 }}>{c.name}</h3>
                  {c.intro && <p className="small">{c.intro}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {data.showCounts && <span className="pill-tag">{serviceCount(ctx.catalog, c.id)} {t(ctx.locale, 'treatments', '项护理')}</span>}
                    {data.showPriceFrom && pf != null && <span className="pill-tag">{t(ctx.locale, 'from', '起')} {fmtPrice(pf)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ---- S04 serviceCards ---- */
export function ServiceCards({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const services = resolveServiceSource(ctx.catalog, data.source || { mode: 'tag', tag: 'popular', limit: 6 });
  return (
    <Section mode={ctx.mode}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ textAlign: 'center', marginBottom: 32 }}>{data.heading}</h2>}
        <div className="grid cols-3">
          {services.map((s) => (
            <div key={s.id} className="card reveal">
              <div className="ph" style={{ aspectRatio: '4/3' }} data-label={s.name} />
              <div className="card-body">
                <h3 style={{ marginBottom: 4 }}>{s.name}{s.badge ? <span className="pill-tag" style={{ marginLeft: 8 }}>{s.badge}</span> : null}</h3>
                <p className="small" style={{ marginBottom: 12 }}>{s.short}</p>
                {data.showTierChips !== false && <TierChips service={s} locale={ctx.locale} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---- S07 steps ---- */
export function Steps({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const cols = `cols-${Math.min((data.items || []).length, 4)}`;
  return (
    <Section mode={ctx.mode}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ textAlign: 'center', marginBottom: 32 }}>{data.heading}</h2>}
        <div className={`grid ${cols}`}>
          {(data.items || []).map((it: any, i: number) => (
            <div key={i} className="reveal">
              <div className="num" style={{ fontFamily: 'var(--s-font-display)', fontSize: '2rem', color: 'var(--candle-deep)' }}>{String(i + 1).padStart(2, '0')}</div>
              <h3 style={{ margin: '6px 0 4px' }}>{it.title}</h3>
              <p className="small">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---- S08 iconGrid ---- */
export function IconGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const cols = `cols-${Math.min((data.items || []).length, 4)}`;
  return (
    <Section mode={ctx.mode}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ textAlign: 'center', marginBottom: 32 }}>{data.heading}</h2>}
        <div className={`grid ${cols}`}>
          {(data.items || []).map((it: any, i: number) => (
            <div key={i} className="reveal">
              <h3 style={{ marginBottom: 6 }}>{it.title}</h3>
              <p className="small">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---- S09 featurePanel ---- */
export function FeaturePanel({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const flip = data.mediaSide === 'left';
  return (
    <Section mode={ctx.mode}>
      <div className={`container split-75 ${flip ? 'flip' : ''}`}>
        {flip && <div className="ph ph-warm" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-card)' }} data-label={data.heading} />}
        <div className="reveal">
          {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
          <h2>{data.heading}</h2>
          <p>{data.body}</p>
          {data.bullets?.length ? <ul>{data.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul> : null}
          {data.cta && <Link className="btn btn-outline" href={`/${ctx.locale}${data.cta.href}`.replace(`/${ctx.locale}/${ctx.locale}`, `/${ctx.locale}`)}>{data.cta.label}</Link>}
        </div>
        {!flip && <div className="ph ph-warm" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-card)' }} data-label={data.heading} />}
      </div>
    </Section>
  );
}

/* ---- S10 promoStrip ---- */
export function PromoStrip({ data, ctx }: { data: any; ctx: SectionCtx }) {
  return (
    <Section mode={ctx.mode}>
      <div className="container reveal" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>{data.heading}</h2>
        {data.subline && <p style={{ marginBottom: 16 }}>{data.subline}</p>}
        {data.cta && <Link className="btn btn-primary" href={`/${ctx.locale}${data.cta.href}`.replace(`/${ctx.locale}/${ctx.locale}`, `/${ctx.locale}`)}>{data.cta.label}</Link>}
      </div>
    </Section>
  );
}

/* ---- S11 testimonials ---- */
export function Testimonials({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const filter = data.filter || {};
  let list = ctx.testimonials || [];
  if (filter.categoryTag) list = list.filter((x) => x.categoryTag === filter.categoryTag);
  if (filter.scopeTag) list = list.filter((x) => (x.scopeTags || []).includes(filter.scopeTag));
  list = list.slice(0, filter.limit || 6);
  return (
    <Section mode={ctx.mode}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ textAlign: 'center', marginBottom: 32 }}>{data.heading}</h2>}
        <div className="grid cols-3">
          {list.map((x, i) => (
            <figure key={i} className="card reveal" style={{ margin: 0 }}>
              <div className="card-body">
                {x.rating && <div className="stars" style={{ color: 'var(--candle)', letterSpacing: 2 }}>{'★'.repeat(x.rating)}</div>}
                <blockquote style={{ margin: '8px 0', fontFamily: 'var(--s-font-display)', fontSize: '1.05rem' }}>“{x.quote}”</blockquote>
                <figcaption className="small">— {x.author}{data.showSource && x.source ? ` · ${x.source}` : ''}</figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---- S12 teamGrid ---- */
export function TeamGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const list = ctx.team || [];
  return (
    <Section mode={ctx.mode}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ textAlign: 'center', marginBottom: 32 }}>{data.heading}</h2>}
        <div className="grid cols-4">
          {list.map((m, i) => (
            <div key={i} className="reveal" style={{ textAlign: 'center' }}>
              <div className="ph ph-light" style={{ aspectRatio: '1', borderRadius: 'var(--radius-card)', marginBottom: 10 }} data-label={m.name} />
              <h4 style={{ margin: 0 }}>{m.name}</h4>
              <p className="small">{m.credential}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---- S16 napHours ---- */
export function NapHours({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const si = ctx.siteInfo || {};
  return (
    <Section mode={ctx.mode}>
      <div className="container split-75">
        <div className="reveal">
          {data.heading && <h2>{data.heading}</h2>}
          <address className="footer-nap" style={{ fontStyle: 'normal', color: ctx.mode === 'dark' ? 'var(--mist)' : 'var(--text-secondary)' }}>
            <strong style={{ color: ctx.mode === 'dark' ? 'var(--porcelain)' : 'var(--char)' }}>{si.clinicName}</strong><br />
            {si.address}<br />
            <a href={`tel:${(si.phone || '').replace(/[^0-9]/g, '')}`}>{si.phone}</a><br />
            {t(ctx.locale, 'Open every day · 9:00am – 9:00pm', '每天营业 · 9:00–21:00')}
          </address>
          {data.note && <p className="small">{data.note}</p>}
        </div>
        <div className="ph ph-light" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-card)' }} data-label="Map" />
      </div>
    </Section>
  );
}

/* ---- S17 mapBlock (embed) ---- */
export function MapBlock({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const si = ctx.siteInfo || {};
  const q = encodeURIComponent(si.address || 'Middletown, NY');
  return (
    <Section mode={ctx.mode}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <iframe
          title="map"
          loading="lazy"
          src={`https://www.google.com/maps?q=${q}&output=embed`}
          style={{ width: '100%', height: 360, border: 0, borderRadius: 'var(--radius-card)' }}
        />
      </div>
    </Section>
  );
}

/* ---- S15 ctaBanner ---- */
export function CtaBanner({ data, ctx }: { data: any; ctx: SectionCtx }) {
  return (
    <section className="section on-dark">
      <div className="container reveal" style={{ textAlign: 'center' }}>
        <h2 style={{ maxWidth: '24ch', margin: '0 auto 12px' }}>{data.heading}</h2>
        {data.subline && <p style={{ color: 'var(--text-inverse-muted)', marginBottom: 18 }}>{data.subline}</p>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {data.ctaPrimary && <Link className="btn btn-primary" href={`/${ctx.locale}${data.ctaPrimary.href}`.replace(`/${ctx.locale}/${ctx.locale}`, `/${ctx.locale}`)}>{data.ctaPrimary.label}</Link>}
          {data.ctaSecondary && <Link className="btn btn-outline" href={data.ctaSecondary.href.startsWith('tel:') ? data.ctaSecondary.href : `/${ctx.locale}${data.ctaSecondary.href}`}>{data.ctaSecondary.label}</Link>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><TrustCluster ctx={ctx} /></div>
      </div>
    </section>
  );
}

export const SECTION_COMPONENTS: Record<string, React.FC<{ data: any; ctx: SectionCtx }>> = {
  hero: Hero,
  trustBar: TrustBar,
  categoryGrid: CategoryGrid,
  serviceCards: ServiceCards,
  steps: Steps,
  iconGrid: IconGrid,
  featurePanel: FeaturePanel,
  promoStrip: PromoStrip,
  testimonials: Testimonials,
  teamGrid: TeamGrid,
  napHours: NapHours,
  mapBlock: MapBlock,
  ctaBanner: CtaBanner,
  treatmentSelector: TreatmentSelector,
  faq: Faq,
  relatedLinks: RelatedLinks,
  conditionLinks: RelatedLinks,
  relatedServices: RelatedLinks,
  menuTable: MenuTable,
  richText: RichText,
  richTextPolicies: RichText,
  addOnsList: AddOnsList,
  promoStripPackages: PromoStrip,
  statsBand: StatsBand,
  checklist: Checklist,
  galleryGrid: GalleryGrid,
  galleryGridVideo: GalleryGrid,
  contactForm: ContactForm,
  protectedNotice: ProtectedNotice,
  bookingForm: BookingForm,
  altPaths: AltPaths,
};
