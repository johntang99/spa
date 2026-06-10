import ReactMarkdown from 'react-markdown';
import { normalizeMarkdown, toSlug } from '@/components/admin/utils/editorHelpers';
import { resolveMediaUrl } from '@/lib/media-url';

interface ConditionsPanelProps {
  isConditionsPageFile: boolean;
  categories: any[];
  conditions: any[];
  sortedConditionCategories: Array<{ category: any; index: number }>;
  conditionCategoryOptions: Array<{ id: string; name: string }>;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
  addConditionCategory: () => void;
  removeConditionCategory: (index: number) => void;
  addConditionItem: () => void;
  removeConditionItem: (index: number) => void;
  hideItemsEditor?: boolean;
}

export function ConditionsPanel({
  isConditionsPageFile,
  categories,
  conditions,
  sortedConditionCategories,
  conditionCategoryOptions,
  markdownPreview,
  toggleMarkdownPreview,
  updateFormValue,
  openImagePicker,
  addConditionCategory,
  removeConditionCategory,
  addConditionItem,
  removeConditionItem,
  hideItemsEditor = false,
}: ConditionsPanelProps) {
  const getPreviewUrl = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return resolveMediaUrl(trimmed);
  };

  return (
    <>
      {isConditionsPageFile && Array.isArray(categories) && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase">Categories</div>
            {!hideItemsEditor && (
              <button
                type="button"
                onClick={addConditionCategory}
                className="px-2 py-1 rounded border border-gray-200 text-xs"
              >
                Add Category
              </button>
            )}
          </div>
          {!hideItemsEditor && <div className="space-y-4">
            {sortedConditionCategories.map(({ category, index }: any) => {
              const isAllCategory = category?.id === 'all';
              const markdownPreviewKey = `conditions-category-${index}-description`;
              return (
                <div key={category.id || index} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">{category.name || `Category ${index + 1}`}</div>
                    {!isAllCategory && (
                      <button
                        type="button"
                        onClick={() => removeConditionCategory(index)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Category Name"
                      value={category.name || ''}
                      onChange={(event) =>
                        updateFormValue(['categories', String(index), 'name'], event.target.value)
                      }
                    />
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Category ID (slug)"
                      value={category.id || ''}
                      onChange={(event) =>
                        updateFormValue(['categories', String(index), 'id'], toSlug(event.target.value))
                      }
                      disabled={isAllCategory}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Icon (e.g., Activity)"
                      value={category.icon || ''}
                      onChange={(event) =>
                        updateFormValue(['categories', String(index), 'icon'], event.target.value)
                      }
                    />
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Subtitle"
                      value={category.subtitle || ''}
                      onChange={(event) =>
                        updateFormValue(['categories', String(index), 'subtitle'], event.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mb-2">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Image"
                      value={category.image || ''}
                      onChange={(event) =>
                        updateFormValue(['categories', String(index), 'image'], event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => openImagePicker(['categories', String(index), 'image'])}
                      className="px-3 rounded-md border border-gray-200 text-xs"
                    >
                      Choose
                    </button>
                  </div>
                  {getPreviewUrl(category.image) && (
                    <div className="mb-2">
                      <img
                        src={getPreviewUrl(category.image)}
                        alt={`${category.name || `Category ${index + 1}`} image preview`}
                        className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm mb-2"
                    type="number"
                    placeholder="Order"
                    value={category.order ?? ''}
                    onChange={(event) =>
                      updateFormValue(
                        ['categories', String(index), 'order'],
                        event.target.value === '' ? '' : Number(event.target.value)
                      )
                    }
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Description (Markdown)</span>
                    <button
                      type="button"
                      onClick={() => toggleMarkdownPreview(markdownPreviewKey)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      {markdownPreview[markdownPreviewKey] ? 'Edit' : 'Preview'}
                    </button>
                  </div>
                  {markdownPreview[markdownPreviewKey] ? (
                    <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                      <ReactMarkdown
                        components={{
                          ul: (props) => <ul className="list-disc pl-5" {...props} />,
                          ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                        }}
                      >
                        {normalizeMarkdown(String(category.description || ''))}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Description (Markdown supported)"
                      value={category.description || ''}
                      onChange={(event) =>
                        updateFormValue(['categories', String(index), 'description'], event.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>}
        </div>
      )}

      {Array.isArray(conditions) && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase">Conditions</div>
            {!hideItemsEditor && (
              <button
                type="button"
                onClick={addConditionItem}
                className="px-2 py-1 rounded border border-gray-200 text-xs"
              >
                Add Condition
              </button>
            )}
          </div>
          {!hideItemsEditor && <div className="space-y-4">
            {conditions.map((condition: any, index: number) => (
              <div key={condition.id || index} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">{condition.title || `Condition ${index + 1}`}</div>
                  <button
                    type="button"
                    onClick={() => removeConditionItem(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="ID (slug)"
                  value={condition.id || ''}
                  onChange={(event) =>
                    updateFormValue(['conditions', String(index), 'id'], toSlug(event.target.value))
                  }
                />
                <input
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Title"
                  value={condition.title || ''}
                  onChange={(event) =>
                    updateFormValue(['conditions', String(index), 'title'], event.target.value)
                  }
                />
                {isConditionsPageFile && (
                  <select
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={condition.category || ''}
                    onChange={(event) =>
                      updateFormValue(['conditions', String(index), 'category'], event.target.value)
                    }
                  >
                    <option value="">Select category</option>
                    {conditionCategoryOptions.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Icon (e.g., Activity)"
                  value={condition.icon || ''}
                  onChange={(event) =>
                    updateFormValue(['conditions', String(index), 'icon'], event.target.value)
                  }
                />
                <textarea
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Description"
                  value={condition.description || ''}
                  onChange={(event) =>
                    updateFormValue(['conditions', String(index), 'description'], event.target.value)
                  }
                />
                <textarea
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Common Symptoms (comma separated)"
                  value={Array.isArray(condition.symptoms) ? condition.symptoms.join(', ') : ''}
                  onChange={(event) =>
                    updateFormValue(
                      ['conditions', String(index), 'symptoms'],
                      event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    )
                  }
                />
                <textarea
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="TCM Approach"
                  value={condition.tcmApproach || ''}
                  onChange={(event) =>
                    updateFormValue(['conditions', String(index), 'tcmApproach'], event.target.value)
                  }
                />
                <textarea
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Treatment Methods (comma separated)"
                  value={
                    Array.isArray(condition.treatmentMethods)
                      ? condition.treatmentMethods.join(', ')
                      : ''
                  }
                  onChange={(event) =>
                    updateFormValue(
                      ['conditions', String(index), 'treatmentMethods'],
                      event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    )
                  }
                />
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={Boolean(condition.featured)}
                    onChange={(event) =>
                      updateFormValue(['conditions', String(index), 'featured'], event.target.checked)
                    }
                  />
                  <span className="text-gray-700">Featured</span>
                </label>
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Image"
                    value={condition.image || ''}
                    onChange={(event) =>
                      updateFormValue(['conditions', String(index), 'image'], event.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => openImagePicker(['conditions', String(index), 'image'])}
                    className="px-3 rounded-md border border-gray-200 text-xs"
                  >
                    Choose
                  </button>
                </div>
                {getPreviewUrl(condition.image) && (
                  <div className="mt-2">
                    <img
                      src={getPreviewUrl(condition.image)}
                      alt={`${condition.title || `Condition ${index + 1}`} image preview`}
                      className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>}
        </div>
      )}
    </>
  );
}
