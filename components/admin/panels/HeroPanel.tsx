import { resolveMediaUrl } from '@/lib/media-url';

interface HeroPanelProps {
  hero: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function HeroPanel({ hero, updateFormValue, openImagePicker }: HeroPanelProps) {
  const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(hero, key);
  const hasMediaObject =
    !!hero.media && typeof hero.media === 'object' && !Array.isArray(hero.media);
  const media = hasMediaObject ? (hero.media as Record<string, any>) : {};

  const getPreviewUrl = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return resolveMediaUrl(trimmed);
  };

  const backgroundPreviewUrl = getPreviewUrl(hero.backgroundImage);
  const imageValue =
    typeof hero.image === 'string'
      ? hero.image
      : typeof media.image === 'string'
        ? media.image
        : '';
  const imagePreviewUrl = getPreviewUrl(imageValue);
  const imagePath = hasOwn('image') ? ['hero', 'image'] : ['hero', 'media', 'image'];
  const galleryPath = Array.isArray(hero.gallery)
    ? ['hero', 'gallery']
    : ['hero', 'media', 'gallery'];
  const overlayOpacityValue =
    typeof hero.photoOverlayOpacity === 'number'
      ? hero.photoOverlayOpacity
      : typeof media.overlayOpacity === 'number'
        ? media.overlayOpacity
        : typeof media.scrim === 'number'
          ? media.scrim / 100
          : 0.2;
  const screenwideDesktopHeightValue =
    typeof hero.screenwideHeightDesktop === 'number'
      ? hero.screenwideHeightDesktop
      : typeof media.height === 'number'
        ? media.height
        : 600;
  const contentPositionValue =
    hero.photoContentPosition === 'center' ||
    hero.photoContentPosition === 'center-below' ||
    hero.photoContentPosition === 'left' ||
    hero.photoContentPosition === 'left-below'
      ? hero.photoContentPosition
      : media.contentPosition === 'center' ||
          media.contentPosition === 'center-below' ||
          media.contentPosition === 'left' ||
          media.contentPosition === 'left-below'
        ? media.contentPosition
        : hero.photoContentPosition === 'lower' || media.contentPosition === 'lower'
        ? 'left-below'
        : 'left-below';
  const galleryImages = Array.isArray(hero.gallery)
    ? hero.gallery.filter((item) => typeof item === 'string')
    : Array.isArray(media.gallery)
      ? media.gallery.filter((item) => typeof item === 'string')
    : [];
  const overlayOpacityPath = hasOwn('photoOverlayOpacity')
    ? ['hero', 'photoOverlayOpacity']
    : ['hero', 'media', 'overlayOpacity'];
  const contentPositionPath = hasOwn('photoContentPosition')
    ? ['hero', 'photoContentPosition']
    : ['hero', 'media', 'contentPosition'];
  const screenwideHeightPath = hasOwn('screenwideHeightDesktop')
    ? ['hero', 'screenwideHeightDesktop']
    : ['hero', 'media', 'height'];
  const titlePath = hasOwn('title') ? ['hero', 'title'] : ['hero', 'headline'];
  const subtitlePath = hasOwn('subtitle') ? ['hero', 'subtitle'] : ['hero', 'subline'];
  const primaryCtaPath = hasOwn('ctaPrimary')
    ? ['hero', 'ctaPrimary']
    : hasOwn('primaryCta')
      ? ['hero', 'primaryCta']
      : ['hero', 'ctaPrimary'];
  const secondaryCtaPath = hasOwn('ctaSecondary')
    ? ['hero', 'ctaSecondary']
    : hasOwn('secondaryCta')
      ? ['hero', 'secondaryCta']
      : ['hero', 'ctaSecondary'];
  const primaryCta = (getPath(primaryCtaPath) as Record<string, any> | undefined) || {};
  const secondaryCta = (getPath(secondaryCtaPath) as Record<string, any> | undefined) || {};
  const primaryLabelKey = hasOwn('ctaPrimary') ? 'label' : hasOwn('primaryCta') ? 'text' : 'label';
  const primaryHrefKey = hasOwn('ctaPrimary') ? 'href' : hasOwn('primaryCta') ? 'link' : 'href';
  const secondaryLabelKey = hasOwn('ctaSecondary')
    ? 'label'
    : hasOwn('secondaryCta')
      ? 'text'
      : 'label';
  const secondaryHrefKey = hasOwn('ctaSecondary')
    ? 'href'
    : hasOwn('secondaryCta')
      ? 'link'
      : 'href';
  const badgesPath = ['hero', 'badges'];
  const badges = Array.isArray(hero.badges)
    ? hero.badges.filter((item) => item && typeof item === 'object')
    : [];

  function getPath(path: string[]) {
    let cursor: any = hero;
    for (const segment of path) {
      if (!cursor || typeof cursor !== 'object') return undefined;
      cursor = cursor[segment];
    }
    return cursor;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Hero</div>
      {(hasOwn('title') || hasOwn('headline')) && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Title</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={hero.title || hero.headline || ''}
            onChange={(event) => updateFormValue(titlePath, event.target.value)}
          />
        </div>
      )}
      {(hasOwn('subtitle') || hasOwn('subline')) && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Subtitle</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={hero.subtitle || hero.subline || ''}
            onChange={(event) => updateFormValue(subtitlePath, event.target.value)}
          />
        </div>
      )}
      {('businessName' in hero || 'clinicName' in hero) && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Business Name</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={hero.businessName || hero.clinicName || ''}
            onChange={(event) =>
              updateFormValue(
                ['hero', 'businessName' in hero ? 'businessName' : 'clinicName'],
                event.target.value
              )
            }
          />
        </div>
      )}
      {'tagline' in hero && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Tagline</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={hero.tagline || ''}
            onChange={(event) => updateFormValue(['hero', 'tagline'], event.target.value)}
          />
        </div>
      )}
      {'description' in hero && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Description</label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={hero.description || ''}
            onChange={(event) => updateFormValue(['hero', 'description'], event.target.value)}
          />
        </div>
      )}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border border-gray-100 p-3">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Primary CTA</div>
          <label className="block text-xs text-gray-500">Label</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={String(primaryCta[primaryLabelKey] || '')}
            onChange={(event) =>
              updateFormValue([...primaryCtaPath, primaryLabelKey], event.target.value)
            }
          />
          <label className="mt-2 block text-xs text-gray-500">URL</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={String(primaryCta[primaryHrefKey] || '')}
            onChange={(event) =>
              updateFormValue([...primaryCtaPath, primaryHrefKey], event.target.value)
            }
          />
        </div>
        <div className="rounded-md border border-gray-100 p-3">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Secondary CTA</div>
          <label className="block text-xs text-gray-500">Label</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={String(secondaryCta[secondaryLabelKey] || '')}
            onChange={(event) =>
              updateFormValue([...secondaryCtaPath, secondaryLabelKey], event.target.value)
            }
          />
          <label className="mt-2 block text-xs text-gray-500">URL</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={String(secondaryCta[secondaryHrefKey] || '')}
            onChange={(event) =>
              updateFormValue([...secondaryCtaPath, secondaryHrefKey], event.target.value)
            }
          />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-gray-500">Badge Pills (top row)</label>
          <button
            type="button"
            onClick={() =>
              updateFormValue(badgesPath, [...badges, { label: '', iconKey: 'star' }])
            }
            className="rounded-md border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-50"
          >
            Add Badge
          </button>
        </div>
        <div className="space-y-2">
          {badges.map((badge: any, index: number) => (
            <div key={`badge-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-center">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={String(badge?.label || '')}
                placeholder="Badge text"
                onChange={(event) =>
                  updateFormValue([...badgesPath, String(index), 'label'], event.target.value)
                }
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={String(badge?.iconKey || '')}
                placeholder="iconKey (optional)"
                onChange={(event) =>
                  updateFormValue([...badgesPath, String(index), 'iconKey'], event.target.value)
                }
              />
              <button
                type="button"
                onClick={() =>
                  updateFormValue(
                    badgesPath,
                    badges.filter((_, badgeIndex) => badgeIndex !== index)
                  )
                }
                className="px-3 rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      {'backgroundImage' in hero && (
        <div>
          <label className="block text-xs text-gray-500">Background Image</label>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={hero.backgroundImage || ''}
              onChange={(event) => updateFormValue(['hero', 'backgroundImage'], event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['hero', 'backgroundImage'])}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
          {backgroundPreviewUrl && (
            <div className="mt-2">
              <img
                src={backgroundPreviewUrl}
                alt="Hero background preview"
                className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
      {(hasOwn('image') || hasMediaObject) && (
        <div className="mt-3">
          <label className="block text-xs text-gray-500">Image</label>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={imageValue}
              onChange={(event) => updateFormValue(imagePath, event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(imagePath)}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
          {imagePreviewUrl && (
            <div className="mt-2">
              <img
                src={imagePreviewUrl}
                alt="Hero image preview"
                className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-gray-500">Gallery Images</label>
          <button
            type="button"
            onClick={() =>
              updateFormValue(galleryPath, [...galleryImages, ''])
            }
            className="rounded-md border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-50"
          >
            Add Photo
          </button>
        </div>
        <div className="space-y-2">
          {galleryImages.map((imageUrl: string, index: number) => (
            <div key={index} className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={imageUrl || ''}
                  onChange={(event) =>
                    updateFormValue([...galleryPath, String(index)], event.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => openImagePicker([...galleryPath, String(index)])}
                  className="px-3 rounded-md border border-gray-200 text-xs"
                >
                  Choose
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateFormValue(
                      galleryPath,
                      galleryImages.filter((_, imageIndex) => imageIndex !== index)
                    )
                  }
                  className="px-3 rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              {getPreviewUrl(imageUrl) && (
                <img
                  src={getPreviewUrl(imageUrl)}
                  alt={`Hero gallery preview ${index + 1}`}
                  className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500">Photo Overlay Opacity (0-1)</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={overlayOpacityValue}
            onChange={(event) => {
              const next = Number(event.target.value);
              const normalized = Number.isFinite(next)
                ? Math.min(1, Math.max(0, next))
                : 0.2;
              updateFormValue(overlayOpacityPath, normalized);
            }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Photo Content Position</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
            value={contentPositionValue}
            onChange={(event) =>
              updateFormValue(contentPositionPath, event.target.value)
            }
          >
            <option value="center">Center</option>
            <option value="center-below">Center Below</option>
            <option value="left">Left</option>
            <option value="left-below">Left Below</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">
            Screenwide Desktop Height (px)
          </label>
          <input
            type="number"
            min={320}
            max={1200}
            step={10}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={screenwideDesktopHeightValue}
            onChange={(event) => {
              const next = Number(event.target.value);
              const normalized = Number.isFinite(next)
                ? Math.min(1200, Math.max(320, Math.round(next)))
                : 600;
              updateFormValue(screenwideHeightPath, normalized);
            }}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Applies to `photo-screenwide-top` and `gallery-screenwide-top`.
          </p>
        </div>
      </div>
    </div>
  );
}
