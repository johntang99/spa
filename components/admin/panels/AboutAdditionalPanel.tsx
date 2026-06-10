'use client';

interface AboutAdditionalPanelProps {
  formData: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

const SECTION_KEYS = [
  'clinic',
  'journey',
  'philosophy',
  'specializations',
  'continuingEducation',
] as const;

type SectionKey = (typeof SECTION_KEYS)[number];

function sectionTitle(key: SectionKey): string {
  if (key === 'continuingEducation') return 'Continuing Education';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function fieldTitle(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function AboutAdditionalPanel({ formData, updateFormValue }: AboutAdditionalPanelProps) {
  const renderPrimitiveField = (
    value: string | number | boolean,
    path: string[],
    label: string
  ) => {
    if (typeof value === 'boolean') {
      return (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={value}
            onChange={(event) => updateFormValue(path, event.target.checked)}
          />
          {label}
        </label>
      );
    }

    const isLongText =
      typeof value === 'string' && (value.includes('\n') || value.length > 120);
    if (isLongText) {
      return (
        <div>
          <label className="block text-xs text-gray-500">{label}</label>
          <textarea
            className="mt-1 w-full min-h-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={String(value)}
            onChange={(event) => updateFormValue(path, event.target.value)}
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-xs text-gray-500">{label}</label>
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={String(value)}
          onChange={(event) =>
            updateFormValue(
              path,
              typeof value === 'number' ? Number(event.target.value || 0) : event.target.value
            )
          }
        />
      </div>
    );
  };

  const renderNode = (value: any, path: string[], label?: string): JSX.Element | null => {
    if (value === null || value === undefined) return null;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return renderPrimitiveField(value, path, label || fieldTitle(path[path.length - 1] || 'Field'));
    }

    if (Array.isArray(value)) {
      const arrayLabel = label || fieldTitle(path[path.length - 1] || 'Items');
      const isPrimitiveArray = value.every(
        (item) =>
          typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
      );

      return (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase">{arrayLabel}</div>
          {value.map((item, index) => (
            <div key={`${path.join('.')}.${index}`} className="rounded-md border border-gray-200 p-3 space-y-2">
              {isPrimitiveArray ? (
                renderPrimitiveField(
                  item as string | number | boolean,
                  [...path, String(index)],
                  `${arrayLabel} ${index + 1}`
                )
              ) : (
                <>
                  <div className="text-xs text-gray-500">Item {index + 1}</div>
                  {renderNode(item, [...path, String(index)])}
                </>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (isPlainObject(value)) {
      const entries = Object.entries(value);
      return (
        <div className="space-y-3">
          {label ? <div className="text-xs font-semibold text-gray-500 uppercase">{label}</div> : null}
          {entries.map(([key, nestedValue]) => (
            <div key={`${path.join('.')}.${key}`} className="space-y-2">
              {renderNode(nestedValue, [...path, key], fieldTitle(key))}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const sectionKeys = SECTION_KEYS.filter((key) => isPlainObject(formData[key]));

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">About Additional Sections</div>
      <p className="text-xs text-gray-500">
        Edit all About sections here in form format (no raw JSON needed).
      </p>

      {sectionKeys.map((sectionKey) => (
        <div key={sectionKey} className="rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">{sectionTitle(sectionKey)}</h3>
          {renderNode(formData[sectionKey], [sectionKey])}
        </div>
      ))}
    </div>
  );
}
