// S21 galleryGrid — filtered | strip | video. Renders media from the named collections.
// Until real media is uploaded, shows labelled gradient placeholders (prototype standard).
import type { SectionCtx } from './index';

const COLL_LABEL: Record<string, { en: string; zh: string }> = {
  rooms: { en: 'Rooms', zh: '房间' },
  treatments: { en: 'Treatments', zh: '护理' },
  details: { en: 'Details', zh: '细节' },
};

export default function GalleryGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const collections: string[] = data.collections || ['rooms', 'treatments', 'details'];
  const variant = data.variant || 'filtered';

  if (variant === 'video') {
    return (
      <section className={`section on-${ctx.mode || 'dark'}`}>
        <div className="container">
          {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
          <div className="ph" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-card)' }} data-label="Video" />
        </div>
      </section>
    );
  }

  // strip: single row; filtered: grid of placeholder tiles per collection.
  const tiles = variant === 'strip' ? collections : collections.flatMap((c) => [c, c]);
  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <div className={`grid ${variant === 'strip' ? 'cols-3' : 'cols-4'}`}>
          {tiles.map((c, i) => {
            const lbl = COLL_LABEL[c] ? (ctx.locale === 'zh' ? COLL_LABEL[c].zh : COLL_LABEL[c].en) : c;
            const cls = i % 3 === 0 ? 'ph' : i % 3 === 1 ? 'ph-light' : 'ph-warm';
            return <div key={i} className={`ph ${cls} reveal`} style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-card)' }} data-label={lbl} />;
          })}
        </div>
      </div>
    </section>
  );
}
