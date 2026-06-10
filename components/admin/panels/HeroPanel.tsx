import { resolveMediaUrl } from '@/lib/media-url';

interface HeroPanelProps {
  hero: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function HeroPanel({ hero, updateFormValue, openImagePicker }: HeroPanelProps) {
  const getPreviewUrl = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return resolveMediaUrl(trimmed);
  };

  const backgroundPreviewUrl = getPreviewUrl(hero.backgroundImage);
  const imagePreviewUrl = getPreviewUrl(hero.image);
  const overlayOpacityValue =
    typeof hero.photoOverlayOpacity === 'number' ? hero.photoOverlayOpacity : 0.2;
  const screenwideDesktopHeightValue =
    typeof hero.screenwideHeightDesktop === 'number' ? hero.screenwideHeightDesktop : 600;
  const contentPositionValue =
    hero.photoContentPosition === 'center' ||
    hero.photoContentPosition === 'center-below' ||
    hero.photoContentPosition === 'left' ||
    hero.photoContentPosition === 'left-below'
      ? hero.photoContentPosition
      : hero.photoContentPosition === 'lower'
        ? 'left-below'
        : 'left-below';
  const galleryImages = Array.isArray(hero.gallery)
    ? hero.gallery.filter((item) => typeof item === 'string')
    : [];

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Hero</div>
      {'title' in hero && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Title</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={hero.title || ''}
            onChange={(event) => updateFormValue(['hero', 'title'], event.target.value)}
          />
        </div>
      )}
      {'subtitle' in hero && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Subtitle</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={hero.subtitle || ''}
            onChange={(event) => updateFormValue(['hero', 'subtitle'], event.target.value)}
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
      {'image' in hero && (
        <div className="mt-3">
          <label className="block text-xs text-gray-500">Image</label>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={hero.image || ''}
              onChange={(event) => updateFormValue(['hero', 'image'], event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['hero', 'image'])}
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
              updateFormValue(['hero', 'gallery'], [...galleryImages, ''])
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
                    updateFormValue(['hero', 'gallery', String(index)], event.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => openImagePicker(['hero', 'gallery', String(index)])}
                  className="px-3 rounded-md border border-gray-200 text-xs"
                >
                  Choose
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateFormValue(
                      ['hero', 'gallery'],
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
              updateFormValue(['hero', 'photoOverlayOpacity'], normalized);
            }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Photo Content Position</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
            value={contentPositionValue}
            onChange={(event) =>
              updateFormValue(['hero', 'photoContentPosition'], event.target.value)
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
              updateFormValue(['hero', 'screenwideHeightDesktop'], normalized);
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
