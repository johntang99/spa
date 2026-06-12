import { resolveMediaUrl } from '@/lib/media-url';

interface HomeSectionPhotosPanelProps {
  homePhotoFields: Array<{ path: string[]; label: string }>;
  getPathValue: (path: string[]) => any;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function HomeSectionPhotosPanel({
  homePhotoFields,
  getPathValue,
  updateFormValue,
  openImagePicker,
}: HomeSectionPhotosPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Home Section Photos</div>
      <div className="space-y-3">
        {homePhotoFields.map((field) => {
          const rawValue = String(getPathValue(field.path) || '').trim();
          const previewUrl = rawValue ? resolveMediaUrl(rawValue) : '';
          return (
            <div
              key={field.path.join('.')}
              className="grid gap-2 md:grid-cols-[220px_1fr_72px_auto_auto] items-center"
            >
              <label className="text-xs text-gray-600">{field.label}</label>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={String(getPathValue(field.path) || '')}
                onChange={(event) => updateFormValue(field.path, event.target.value)}
                placeholder="/uploads/..."
              />
              <div className="h-12 w-[72px] rounded-md border border-gray-200 bg-gray-50 overflow-hidden">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={`${field.label} preview`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => openImagePicker(field.path)}
                className="px-3 py-2 rounded-md border border-gray-200 text-xs"
              >
                Choose
              </button>
              <button
                type="button"
                onClick={() => updateFormValue(field.path, '')}
                className="px-3 py-2 rounded-md border border-gray-200 text-xs"
              >
                Clear
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
