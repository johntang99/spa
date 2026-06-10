// relatedLinks — a row of links to related pages (conditions / services / siblings /
// resources). Accepts resolved `links` ([{ href, label }]) from the caller, or raw `refs`
// (slugs) it renders as locale-prefixed links. Renders nothing when empty.
import Link from 'next/link';
import type { SectionCtx } from './index';

function titleCase(slug: string) {
  return slug.replace(/-middletown-ny$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RelatedLinks({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const links: Array<{ href: string; label: string }> =
    data.links ||
    (data.refs || []).map((slug: string) => ({ href: `/${ctx.locale}/${slug}`, label: titleCase(slug) }));
  if (!links.length) return null;

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="chip" style={{ padding: '10px 16px' }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
