'use client';

interface AboutSpaGalleryPanelProps {
  galleryGrid: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

type GalleryPhoto = {
  src: string;
  alt?: string;
  description?: string;
};

function normalizePhotos(galleryGrid: Record<string, any>): GalleryPhoto[] {
  if (Array.isArray(galleryGrid?.photos)) {
    const result: GalleryPhoto[] = [];
    for (const photo of galleryGrid.photos as any[]) {
      if (!photo || typeof photo !== 'object') continue;
      result.push({
        src: typeof photo.src === 'string' ? photo.src : '',
        alt: typeof photo.alt === 'string' ? photo.alt : '',
        description: typeof photo.description === 'string' ? photo.description : '',
      });
    }
    return result;
  }

  if (Array.isArray(galleryGrid?.images)) {
    return galleryGrid.images
      .filter((value: unknown): value is string => typeof value === 'string')
      .map((src: string) => ({
        src,
        alt: '',
        description: '',
      }));
  }

  return [];
}

export function AboutSpaGalleryPanel({
  galleryGrid,
  updateFormValue,
  openImagePicker,
}: AboutSpaGalleryPanelProps) {
  const photos = normalizePhotos(galleryGrid);

  function pushPhotos(nextPhotos: GalleryPhoto[]) {
    updateFormValue(['galleryGrid', 'photos'], nextPhotos);
  }

  function addPhoto() {
    pushPhotos([...photos, { src: '', alt: '', description: '' }]);
  }

  function removePhoto(index: number) {
    pushPhotos(photos.filter((_, photoIndex) => photoIndex !== index));
  }

  function updatePhotoField(index: number, field: keyof GalleryPhoto, value: string) {
    pushPhotos(
      photos.map((photo, photoIndex) =>
        photoIndex === index ? { ...photo, [field]: value } : photo
      )
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase">Inside Spa Photo Gallery</div>
          <p className="text-xs text-gray-500 mt-1">
            Add photos with a short description. About page will display 3-column gallery with click-to-open modal.
          </p>
        </div>
        <button
          type="button"
          onClick={addPhoto}
          className="px-3 py-1 rounded-md border border-gray-200 text-xs"
        >
          Add Photo
        </button>
      </div>

      <div>
        <label className="block text-xs text-gray-500">Section heading</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={typeof galleryGrid?.heading === 'string' ? galleryGrid.heading : ''}
          onChange={(event) => updateFormValue(['galleryGrid', 'heading'], event.target.value)}
          placeholder="Inside the spa"
        />
      </div>

      <div className="space-y-3">
        {photos.map((photo, index) => (
          <div key={`about-gallery-${index}`} className="rounded-lg border border-gray-200 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500 uppercase">Photo {index + 1}</div>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-500">Photo source</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-10 w-16 overflow-hidden rounded border border-gray-200 bg-gray-50 shrink-0">
                  {photo.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.src} alt={photo.alt || `About gallery ${index + 1}`} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <input
                  readOnly
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                  value={photo.src}
                  placeholder="Choose image from media"
                />
                <button
                  type="button"
                  onClick={() => openImagePicker(['galleryGrid', 'photos', String(index), 'src'])}
                  className="px-3 rounded-md border border-gray-200 text-xs"
                >
                  Choose
                </button>
                <button
                  type="button"
                  onClick={() => updatePhotoField(index, 'src', '')}
                  className="px-3 rounded-md border border-gray-200 text-xs"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-500">Alt text (optional)</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={photo.alt || ''}
                  onChange={(event) => updatePhotoField(index, 'alt', event.target.value)}
                  placeholder="Sauna room interior"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Simple description</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={photo.description || ''}
                  onChange={(event) => updatePhotoField(index, 'description', event.target.value)}
                  placeholder="Quiet cedar sauna for deep relaxation."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
