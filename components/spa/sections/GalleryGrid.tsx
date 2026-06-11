// S21 galleryGrid — filtered | strip | video. Renders real images from `data.images`
// (array of URLs) when provided; otherwise labelled gradient placeholders per collection.
import { Media } from './index';
import type { SectionCtx } from './index';

const COLL_LABEL: Record<string, { en: string; zh: string }> = {
  rooms: { en: 'Rooms', zh: '房间' },
  treatments: { en: 'Treatments', zh: '护理' },
  details: { en: 'Details', zh: '细节' },
};

export default function GalleryGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const images: string[] = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
  const collections: string[] = data.collections || ['rooms', 'treatments', 'details'];
  const variant = data.variant || 'filtered';

  if (variant === 'video') {
    return (
      <section className={`section on-${ctx.mode || 'dark'}`}>
        <div className="container">
          {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
          <Media image={data.image} label="Video" phClass="ph" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-card)' }} />
        </div>
      </section>
    );
  }

  // Real images take over when present; otherwise fall back to collection placeholders.
  const tiles: string[] = images.length
    ? images
    : (variant === 'strip' ? collections : collections.flatMap((c) => [c, c]));
  const count = tiles.length;
  const cols = count <= 3 ? count : count === 4 ? 4 : 3; // 2→cols-2, 4→cols-4, else cols-3

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container">
        {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
        <div className={`grid cols-${cols}`}>
          {tiles.map((tile, i) => {
            const style = { aspectRatio: '4/3', borderRadius: 'var(--radius-card)' } as const;
            if (images.length) {
              return <Media key={i} image={tile} phClass="ph reveal" style={style} />;
            }
            const lbl = COLL_LABEL[tile] ? (ctx.locale === 'zh' ? COLL_LABEL[tile].zh : COLL_LABEL[tile].en) : tile;
            const cls = i % 3 === 0 ? 'ph' : i % 3 === 1 ? 'ph-light' : 'ph-warm';
            return <div key={i} className={`ph ${cls} reveal`} style={style} data-label={lbl} />;
          })}
        </div>
      </div>
    </section>
  );
}
