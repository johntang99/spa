// S21 galleryGrid — filtered | strip | video. Supports photos[] (src + description)
// with click-to-open modal, and falls back to images[] placeholders.
'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { SectionCtx } from './index';

type GalleryPhoto = {
  src: string;
  alt: string;
  description: string;
};

const COLL_LABEL: Record<string, { en: string; zh: string }> = {
  rooms: { en: 'Rooms', zh: '房间' },
  treatments: { en: 'Treatments', zh: '护理' },
  details: { en: 'Details', zh: '细节' },
};

export default function GalleryGrid({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const photos = useMemo<GalleryPhoto[]>(() => {
    if (Array.isArray(data?.photos)) {
      return data.photos
        .map((item: any) => {
          if (!item || typeof item !== 'object') return null;
          return {
            src: typeof item.src === 'string' ? item.src : '',
            alt: typeof item.alt === 'string' ? item.alt : '',
            description: typeof item.description === 'string' ? item.description : '',
          };
        })
        .filter(
          (item: { src: string; alt: string; description: string } | null): item is {
            src: string;
            alt: string;
            description: string;
          } => Boolean(item?.src)
        );
    }

    const fallbackDescriptions: string[] = Array.isArray(data?.imageDescriptions)
      ? data.imageDescriptions
      : Array.isArray(data?.descriptions)
        ? data.descriptions
        : [];
    const fallbackImages: string[] = Array.isArray(data?.images)
      ? data.images.filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
      : [];
    return fallbackImages.map((src, index) => ({
      src,
      alt: '',
      description:
        typeof fallbackDescriptions[index] === 'string' ? fallbackDescriptions[index] : '',
    }));
  }, [data]);

  const collections: string[] = data.collections || ['rooms', 'treatments', 'details'];
  const variant = data.variant || 'filtered';
  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  if (variant === 'video') {
    return (
      <section className={`section on-${ctx.mode || 'dark'}`}>
        <div className="container">
          {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
          {data.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.image}
              alt="Video"
              className="reveal"
              style={{ width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-card)', objectFit: 'cover' }}
            />
          ) : (
            <div className="ph reveal" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-card)' }} data-label="Video" />
          )}
        </div>
      </section>
    );
  }

  // Real photos take over when present; otherwise fall back to collection placeholders.
  const tiles: string[] = photos.length
    ? photos.map((photo) => photo.src)
    : (variant === 'strip' ? collections : collections.flatMap((c) => [c, c]));
  const count = tiles.length;
  const cols = photos.length > 0 ? 3 : count <= 3 ? count : count === 4 ? 4 : 3; // 2→cols-2, 4→cols-4, else cols-3

  return (
    <>
      <section className={`section on-${ctx.mode || 'light'}`}>
        <div className="container">
          {data.heading && <h2 className="reveal" style={{ marginBottom: 16 }}>{data.heading}</h2>}
          <div className={`grid cols-${cols}`}>
            {tiles.map((tile, i) => {
              const style = { aspectRatio: '4/3', borderRadius: 'var(--radius-card)' } as const;
              if (photos.length) {
                const photo = photos[i];
                return (
                  <button
                    key={`${photo.src}-${i}`}
                    type="button"
                    className="reveal"
                    onClick={() => setActivePhotoIndex(i)}
                    style={{
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt={photo.alt || photo.description || `Gallery photo ${i + 1}`}
                      style={{
                        ...style,
                        width: '100%',
                        objectFit: 'cover',
                        marginBottom: photo.description ? 8 : 0,
                      }}
                    />
                    {photo.description ? (
                      <p className="small" style={{ margin: 0 }}>
                        {photo.description}
                      </p>
                    ) : null}
                  </button>
                );
              }
              const lbl = COLL_LABEL[tile] ? (ctx.locale === 'zh' ? COLL_LABEL[tile].zh : COLL_LABEL[tile].en) : tile;
              const cls = i % 3 === 0 ? 'ph' : i % 3 === 1 ? 'ph-light' : 'ph-warm';
              return <div key={i} className={`ph ${cls} reveal`} style={style} data-label={lbl} />;
            })}
          </div>
        </div>
      </section>

      <Modal
        open={activePhotoIndex !== null && Boolean(activePhoto)}
        onClose={() => setActivePhotoIndex(null)}
        title={activePhoto?.description || data.heading || 'Photo'}
        size="xl"
      >
        {activePhoto ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.src}
              alt={activePhoto.alt || activePhoto.description || 'Gallery photo'}
              style={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-card)',
                background: '#fff',
              }}
            />
            {activePhoto.description ? (
              <p className="small" style={{ margin: 0 }}>
                {activePhoto.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
