import ReactMarkdown from 'react-markdown';
import { normalizeMarkdown, toSlug } from '@/components/admin/utils/editorHelpers';
import { resolveMediaUrl } from '@/lib/media-url';

interface ServicesPanelProps {
  formData: Record<string, any>;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
  addServicesListItem: () => void;
  removeServicesListItem: (index: number) => void;
  addTrustBarItem: () => void;
  removeTrustBarItem: (index: number) => void;
  addRelatedReadingSlug: () => void;
  removeRelatedReadingSlug: (index: number) => void;
  hideItemsEditor?: boolean;
}

export function ServicesPanel({
  formData,
  markdownPreview,
  toggleMarkdownPreview,
  updateFormValue,
  openImagePicker,
  addServicesListItem,
  removeServicesListItem,
  addTrustBarItem,
  removeTrustBarItem,
  addRelatedReadingSlug,
  removeRelatedReadingSlug,
  hideItemsEditor = false,
}: ServicesPanelProps) {
  const getPreviewUrl = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return resolveMediaUrl(trimmed);
  };

  return (
    <>
      {Array.isArray(formData?.services) && !formData?.servicesList && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Services</div>
          <div className="space-y-4">
            {formData.services.map((service: any, index: number) => (
              <div key={service.id || index} className="border rounded-md p-3">
                <div className="text-xs text-gray-500 mb-2">
                  {service.title || `Service ${index + 1}`}
                </div>
                <input
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Title"
                  value={service.title || ''}
                  onChange={(event) =>
                    updateFormValue(['services', String(index), 'title'], event.target.value)
                  }
                />
                <textarea
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Short description"
                  value={service.shortDescription || ''}
                  onChange={(event) =>
                    updateFormValue(
                      ['services', String(index), 'shortDescription'],
                      event.target.value
                    )
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Image"
                    value={service.image || ''}
                    onChange={(event) =>
                      updateFormValue(['services', String(index), 'image'], event.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => openImagePicker(['services', String(index), 'image'])}
                    className="px-3 rounded-md border border-gray-200 text-xs"
                  >
                    Choose
                  </button>
                </div>
                {getPreviewUrl(service.image) && (
                  <div className="mt-2">
                    <img
                      src={getPreviewUrl(service.image)}
                      alt={`${service.title || `Service ${index + 1}`} image preview`}
                      className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {formData?.servicesList && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase">Services List</div>
            {!hideItemsEditor && (
              <button
                type="button"
                onClick={addServicesListItem}
                className="px-2 py-1 rounded border border-gray-200 text-xs"
              >
                Add Service
              </button>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-2 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Section Badge</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Section badge"
                value={formData.servicesList.badge || ''}
                onChange={(event) => updateFormValue(['servicesList', 'badge'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Section Variant</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Section variant"
                value={formData.servicesList.variant || ''}
                onChange={(event) =>
                  updateFormValue(['servicesList', 'variant'], event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Section Title</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Section title"
                value={formData.servicesList.title || ''}
                onChange={(event) => updateFormValue(['servicesList', 'title'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Section Subtitle</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Section subtitle"
                value={formData.servicesList.subtitle || ''}
                onChange={(event) =>
                  updateFormValue(['servicesList', 'subtitle'], event.target.value)
                }
              />
            </div>
          </div>
          {!hideItemsEditor && Array.isArray(formData.servicesList.items) && (
            <div className="space-y-4 mt-4">
              {formData.servicesList.items.map((service: any, index: number) => (
                <div key={service.id || index} className="border rounded-md p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">
                      {service.title || `Service ${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeServicesListItem(index)}
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
                        placeholder="ID (slug)"
                        value={service.id || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'id'],
                            toSlug(event.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Icon</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Icon (e.g., Syringe)"
                        value={service.icon || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'icon'],
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
                        placeholder="Order"
                        value={service.order ?? ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'order'],
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
                      placeholder="Title"
                      value={service.title || ''}
                      onChange={(event) =>
                        updateFormValue(
                          ['servicesList', 'items', String(index), 'title'],
                          event.target.value
                        )
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">Short Description</label>
                    <textarea
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Short description"
                      value={service.shortDescription || ''}
                      onChange={(event) =>
                        updateFormValue(
                          ['servicesList', 'items', String(index), 'shortDescription'],
                          event.target.value
                        )
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-gray-500">
                        Full Description (Markdown)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          toggleMarkdownPreview(`servicesList-${index}-fullDescription`)
                        }
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        {markdownPreview[`servicesList-${index}-fullDescription`] ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                    {markdownPreview[`servicesList-${index}-fullDescription`] ? (
                      <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                        <ReactMarkdown
                          components={{
                            ul: (props) => <ul className="list-disc pl-5" {...props} />,
                            ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                          }}
                        >
                          {normalizeMarkdown(String(service.fullDescription || ''))}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Full description (Markdown supported)"
                        value={service.fullDescription || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'fullDescription'],
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
                      placeholder="What to expect"
                      value={service.whatToExpect || ''}
                      onChange={(event) =>
                        updateFormValue(
                          ['servicesList', 'items', String(index), 'whatToExpect'],
                          event.target.value
                        )
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">Benefits</label>
                    <textarea
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Benefits (comma separated)"
                      value={Array.isArray(service.benefits) ? service.benefits.join(', ') : ''}
                      onChange={(event) =>
                        updateFormValue(
                          ['servicesList', 'items', String(index), 'benefits'],
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
                        placeholder="Price"
                        value={service.price || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'price'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Duration (min)"
                        type="number"
                        value={service.durationMinutes || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'durationMinutes'],
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
                        placeholder="Image"
                        value={service.image || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'image'],
                            event.target.value
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openImagePicker(['servicesList', 'items', String(index), 'image'])
                        }
                        className="px-3 rounded-md border border-gray-200 text-xs"
                      >
                        Choose
                      </button>
                    </div>
                    {getPreviewUrl(service.image) && (
                      <div className="mt-2">
                        <img
                          src={getPreviewUrl(service.image)}
                          alt={`${service.title || `Service ${index + 1}`} image preview`}
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
                        checked={Boolean(service.featured)}
                        onChange={(event) =>
                          updateFormValue(
                            ['servicesList', 'items', String(index), 'featured'],
                            event.target.checked
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Featured (for featured-large variant)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {formData?.trustBar && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase">Trust Bar</div>
            <button
              type="button"
              onClick={addTrustBarItem}
              className="px-2 py-1 rounded border border-gray-200 text-xs"
            >
              Add Item
            </button>
          </div>
          <div className="space-y-3">
            {Array.isArray(formData.trustBar.items) &&
              formData.trustBar.items.map((item: any, index: number) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => removeTrustBarItem(index)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Icon</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Icon"
                        value={item.icon || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['trustBar', 'items', String(index), 'icon'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Title"
                        value={item.title || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['trustBar', 'items', String(index), 'title'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Description"
                        value={item.description || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['trustBar', 'items', String(index), 'description'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {formData?.legacyLabels && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Legacy Labels</div>
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Service Prefix</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Service prefix"
                value={formData.legacyLabels.servicePrefix || ''}
                onChange={(event) =>
                  updateFormValue(['legacyLabels', 'servicePrefix'], event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Key Benefits Title</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Key benefits title"
                value={formData.legacyLabels.keyBenefitsTitle || ''}
                onChange={(event) =>
                  updateFormValue(['legacyLabels', 'keyBenefitsTitle'], event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">What to Expect Title</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="What to expect title"
                value={formData.legacyLabels.whatToExpectTitle || ''}
                onChange={(event) =>
                  updateFormValue(['legacyLabels', 'whatToExpectTitle'], event.target.value)
                }
              />
            </div>
          </div>
        </div>
      )}

      {formData?.relatedReading && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Related Reading</div>
          <div className="grid gap-2 md:grid-cols-2 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Title"
                value={formData.relatedReading.title || ''}
                onChange={(event) =>
                  updateFormValue(['relatedReading', 'title'], event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">View All Text</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="View all text"
                value={formData.relatedReading.viewAllText || ''}
                onChange={(event) =>
                  updateFormValue(['relatedReading', 'viewAllText'], event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Default Category</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Default category"
                value={formData.relatedReading.defaultCategory || ''}
                onChange={(event) =>
                  updateFormValue(['relatedReading', 'defaultCategory'], event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Subtitle</label>
              <input
                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                placeholder="Subtitle"
                value={formData.relatedReading.subtitle || ''}
                onChange={(event) =>
                  updateFormValue(['relatedReading', 'subtitle'], event.target.value)
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase">Preferred Slugs</span>
            <button
              type="button"
              onClick={addRelatedReadingSlug}
              className="px-2 py-1 rounded border border-gray-200 text-xs"
            >
              Add Slug
            </button>
          </div>
          <div className="space-y-2">
            {Array.isArray(formData.relatedReading.preferredSlugs) &&
              formData.relatedReading.preferredSlugs.map((slug: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={slug || ''}
                    placeholder="blog-slug"
                    onChange={(event) =>
                      updateFormValue(
                        ['relatedReading', 'preferredSlugs', String(index)],
                        event.target.value
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeRelatedReadingSlug(index)}
                    className="px-3 rounded-md border border-gray-200 text-xs text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
