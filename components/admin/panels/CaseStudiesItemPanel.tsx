import ReactMarkdown from 'react-markdown';
import { normalizeMarkdown, toSlug } from '@/components/admin/utils/editorHelpers';
import { resolveMediaUrl } from '@/lib/media-url';

interface CaseStudyCategoryItemPanelProps {
  category: any;
  index: number;
  updateFormValue: (path: string[], value: any) => void;
}

export function CaseStudyCategoryItemPanel({
  category,
  index,
  updateFormValue,
}: CaseStudyCategoryItemPanelProps) {
  const isAllCategory = category?.id === 'all';
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        {category?.name || `Category ${index + 1}`}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Category Name"
          value={category?.name || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'name'], event.target.value)
          }
        />
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Category ID (slug)"
          value={category?.id || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'id'], toSlug(event.target.value))
          }
          disabled={isAllCategory}
        />
      </div>
      <input
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        placeholder="Icon (e.g., Activity)"
        value={category?.icon || ''}
        onChange={(event) =>
          updateFormValue(['categories', String(index), 'icon'], event.target.value)
        }
      />
    </div>
  );
}

interface CaseStudyItemPanelProps {
  item: any;
  index: number;
  caseStudyCategories: Array<{ id: string; name: string }>;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function CaseStudyItemPanel({
  item,
  index,
  caseStudyCategories,
  markdownPreview,
  toggleMarkdownPreview,
  updateFormValue,
  openImagePicker,
}: CaseStudyItemPanelProps) {
  const getPreviewUrl = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return resolveMediaUrl(trimmed);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        {item?.condition || `Case ${index + 1}`}
      </div>
      <input
        className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        placeholder="ID (slug)"
        value={item?.id || ''}
        onChange={(event) =>
          updateFormValue(['caseStudies', String(index), 'id'], toSlug(event.target.value))
        }
      />
      <input
        className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        placeholder="Condition"
        value={item?.condition || ''}
        onChange={(event) =>
          updateFormValue(['caseStudies', String(index), 'condition'], event.target.value)
        }
      />
      <div className="mb-2">
        <label className="block text-xs text-gray-500 mb-1">Category</label>
        <select
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={item?.category || ''}
          onChange={(event) =>
            updateFormValue(['caseStudies', String(index), 'category'], event.target.value)
          }
        >
          <option value="">Select category</option>
          {caseStudyCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Summary (Markdown)</span>
        <button
          type="button"
          onClick={() => toggleMarkdownPreview(`caseStudies-${index}-summary`)}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          {markdownPreview[`caseStudies-${index}-summary`] ? 'Edit' : 'Preview'}
        </button>
      </div>
      {markdownPreview[`caseStudies-${index}-summary`] ? (
        <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2 mb-2">
          <ReactMarkdown
            components={{
              ul: (props) => <ul className="list-disc pl-5" {...props} />,
              ol: (props) => <ol className="list-decimal pl-5" {...props} />,
              li: (props) => <li className="mb-1" {...props} />,
            }}
          >
            {normalizeMarkdown(item?.summary || '')}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Summary (Markdown supported)"
          value={item?.summary || ''}
          onChange={(event) =>
            updateFormValue(['caseStudies', String(index), 'summary'], event.target.value)
          }
        />
      )}
      <div className="grid gap-2 md:grid-cols-3">
        <div className="flex gap-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Image"
            value={item?.image || ''}
            onChange={(event) =>
              updateFormValue(['caseStudies', String(index), 'image'], event.target.value)
            }
          />
          <button
            type="button"
            onClick={() => openImagePicker(['caseStudies', String(index), 'image'])}
            className="px-3 rounded-md border border-gray-200 text-xs"
          >
            Choose
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Before image"
            value={item?.beforeImage || ''}
            onChange={(event) =>
              updateFormValue(['caseStudies', String(index), 'beforeImage'], event.target.value)
            }
          />
          <button
            type="button"
            onClick={() => openImagePicker(['caseStudies', String(index), 'beforeImage'])}
            className="px-3 rounded-md border border-gray-200 text-xs"
          >
            Choose
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="After image"
            value={item?.afterImage || ''}
            onChange={(event) =>
              updateFormValue(['caseStudies', String(index), 'afterImage'], event.target.value)
            }
          />
          <button
            type="button"
            onClick={() => openImagePicker(['caseStudies', String(index), 'afterImage'])}
            className="px-3 rounded-md border border-gray-200 text-xs"
          >
            Choose
          </button>
        </div>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        {getPreviewUrl(item?.image) ? (
          <img
            src={getPreviewUrl(item?.image)}
            alt={`${item?.condition || `Case ${index + 1}`} image preview`}
            className="h-20 w-36 rounded-md border border-gray-200 object-cover"
            loading="lazy"
          />
        ) : (
          <div />
        )}
        {getPreviewUrl(item?.beforeImage) ? (
          <img
            src={getPreviewUrl(item?.beforeImage)}
            alt={`${item?.condition || `Case ${index + 1}`} before image preview`}
            className="h-20 w-36 rounded-md border border-gray-200 object-cover"
            loading="lazy"
          />
        ) : (
          <div />
        )}
        {getPreviewUrl(item?.afterImage) ? (
          <img
            src={getPreviewUrl(item?.afterImage)}
            alt={`${item?.condition || `Case ${index + 1}`} after image preview`}
            className="h-20 w-36 rounded-md border border-gray-200 object-cover"
            loading="lazy"
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
