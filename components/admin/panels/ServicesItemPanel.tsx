import ReactMarkdown from 'react-markdown';
import { toSlug, normalizeMarkdown } from '@/components/admin/utils/editorHelpers';
import { resolveMediaUrl } from '@/lib/media-url';

interface ServicesItemPanelProps {
  servicesList: Record<string, any>;
  selectedService: Record<string, any>;
  selectedIndex: number;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
  removeServicesListItem: (index: number) => void;
}

export function ServicesItemPanel({
  servicesList,
  selectedService,
  selectedIndex,
  markdownPreview,
  toggleMarkdownPreview,
  updateFormValue,
  openImagePicker,
  removeServicesListItem,
}: ServicesItemPanelProps) {
  const markdownKey = `servicesList-${selectedIndex}-fullDescription`;
  const serviceImagePreview =
    typeof selectedService?.image === 'string' && selectedService.image.trim()
      ? resolveMediaUrl(selectedService.image.trim())
      : '';

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Services List</div>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Badge</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={servicesList.badge || ''}
              onChange={(event) => updateFormValue(['servicesList', 'badge'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Variant</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={servicesList.variant || ''}
              onChange={(event) => updateFormValue(['servicesList', 'variant'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Title</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={servicesList.title || ''}
              onChange={(event) => updateFormValue(['servicesList', 'title'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Subtitle</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={servicesList.subtitle || ''}
              onChange={(event) => updateFormValue(['servicesList', 'subtitle'], event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            {selectedService.title || `Service ${selectedIndex + 1}`}
          </div>
          <button
            type="button"
            onClick={() => removeServicesListItem(selectedIndex)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ID (slug)</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={selectedService.id || ''}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'id'],
                  toSlug(event.target.value)
                )
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Icon</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={selectedService.icon || ''}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'icon'],
                  event.target.value
                )
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              type="number"
              value={selectedService.order ?? ''}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'order'],
                  event.target.value === '' ? '' : Number(event.target.value)
                )
              }
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Title</label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={selectedService.title || ''}
            onChange={(event) =>
              updateFormValue(
                ['servicesList', 'items', String(selectedIndex), 'title'],
                event.target.value
              )
            }
          />
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Short Description</label>
          <textarea
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={selectedService.shortDescription || ''}
            onChange={(event) =>
              updateFormValue(
                ['servicesList', 'items', String(selectedIndex), 'shortDescription'],
                event.target.value
              )
            }
          />
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-gray-500">Full Description (Markdown)</label>
            <button
              type="button"
              onClick={() => toggleMarkdownPreview(markdownKey)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              {markdownPreview[markdownKey] ? 'Edit' : 'Preview'}
            </button>
          </div>
          {markdownPreview[markdownKey] ? (
            <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
              <ReactMarkdown
                components={{
                  ul: (props) => <ul className="list-disc pl-5" {...props} />,
                  ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                }}
              >
                {normalizeMarkdown(String(selectedService.fullDescription || ''))}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={selectedService.fullDescription || ''}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'fullDescription'],
                  event.target.value
                )
              }
            />
          )}
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">What to Expect</label>
          <textarea
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={selectedService.whatToExpect || ''}
            onChange={(event) =>
              updateFormValue(
                ['servicesList', 'items', String(selectedIndex), 'whatToExpect'],
                event.target.value
              )
            }
          />
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Benefits</label>
          <textarea
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={Array.isArray(selectedService.benefits) ? selectedService.benefits.join(', ') : ''}
            onChange={(event) =>
              updateFormValue(
                ['servicesList', 'items', String(selectedIndex), 'benefits'],
                event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={selectedService.price || ''}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'price'],
                  event.target.value
                )
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              type="number"
              value={selectedService.durationMinutes || ''}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'durationMinutes'],
                  parseInt(event.target.value, 10) || 0
                )
              }
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Image</label>
          <div className="flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={selectedService.image || ''}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'image'],
                  event.target.value
                )
              }
            />
            <button
              type="button"
              onClick={() =>
                openImagePicker(['servicesList', 'items', String(selectedIndex), 'image'])
              }
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
          {serviceImagePreview && (
            <div className="mt-2">
              <img
                src={serviceImagePreview}
                alt={`${selectedService.title || `Service ${selectedIndex + 1}`} image preview`}
                className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Featured</label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(selectedService.featured)}
              onChange={(event) =>
                updateFormValue(
                  ['servicesList', 'items', String(selectedIndex), 'featured'],
                  event.target.checked
                )
              }
              className="rounded border-gray-300"
            />
            <span className="text-gray-700">Featured (for featured-large variant)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
