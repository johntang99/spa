interface GalleryPhotosPanelProps {
  images: any[];
  galleryCategories: Array<{ id: string; name: string; icon?: string; description?: string; order?: number }>;
  addGalleryCategory: () => void;
  removeGalleryCategory: (index: number) => void;
  addGalleryImage: () => void;
  removeGalleryImage: (index: number) => void;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function GalleryPhotosPanel({
  images,
  galleryCategories,
  addGalleryCategory,
  removeGalleryCategory,
  addGalleryImage,
  removeGalleryImage,
  updateFormValue,
  openImagePicker,
}: GalleryPhotosPanelProps) {
  const photoCategoryOptions = galleryCategories.filter((category) => category.id !== 'all');

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Photo Categories</div>
          <button
            type="button"
            onClick={addGalleryCategory}
            className="px-3 py-1 rounded-md border border-gray-200 text-xs"
          >
            Add Category
          </button>
        </div>
        <div className="space-y-3">
          {galleryCategories.map((category, index) => (
            <div key={category.id || `category-${index}`} className="border border-gray-100 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-500">Category {index + 1}</div>
                <button
                  type="button"
                  onClick={() => removeGalleryCategory(index)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-500">ID</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={category.id || ''}
                    onChange={(event) =>
                      updateFormValue(['categories', String(index), 'id'], event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Name</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={category.name || ''}
                    onChange={(event) =>
                      updateFormValue(['categories', String(index), 'name'], event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Icon</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={category.icon || ''}
                    onChange={(event) =>
                      updateFormValue(['categories', String(index), 'icon'], event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Order</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={category.order ?? ''}
                    onChange={(event) =>
                      updateFormValue(
                        ['categories', String(index), 'order'],
                        event.target.value === '' ? '' : Number(event.target.value)
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500">Description</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={category.description || ''}
                    onChange={(event) =>
                      updateFormValue(['categories', String(index), 'description'], event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Gallery Photos</div>
          <button
            type="button"
            onClick={addGalleryImage}
            className="px-3 py-1 rounded-md border border-gray-200 text-xs"
          >
            Add Photo
          </button>
        </div>
        <div className="space-y-4">
          {images.map((image: any, index: number) => (
            <div key={image.id || index} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-gray-500">Photo {index + 1}</div>
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-500">Title</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={image.title || ''}
                  onChange={(event) =>
                    updateFormValue(['images', index, 'title'] as string[], event.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Category</label>
                {photoCategoryOptions.length > 0 ? (
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
                    value={image.category || ''}
                    onChange={(event) =>
                      updateFormValue(['images', index, 'category'] as string[], event.target.value)
                    }
                  >
                    <option value="">Select category</option>
                    {photoCategoryOptions.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={image.category || ''}
                    onChange={(event) =>
                      updateFormValue(['images', index, 'category'] as string[], event.target.value)
                    }
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500">Source</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-10 w-16 overflow-hidden rounded border border-gray-200 bg-gray-50 shrink-0">
                    {image.src ? (
                      <img
                        src={image.src}
                        alt={image.alt || image.title || `Photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <input
                    readOnly
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                    value={image.src || ''}
                  />
                  <button
                    type="button"
                    onClick={() => openImagePicker(['images', index, 'src'] as string[])}
                    className="px-3 rounded-md border border-gray-200 text-xs"
                  >
                    Choose
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormValue(['images', index, 'src'] as string[], '')}
                    className="px-3 rounded-md border border-gray-200 text-xs"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Alt</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={image.alt || ''}
                  onChange={(event) =>
                    updateFormValue(['images', index, 'alt'] as string[], event.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Order</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={image.order ?? ''}
                  onChange={(event) =>
                    updateFormValue(
                      ['images', index, 'order'] as string[],
                      event.target.value === '' ? '' : Number(event.target.value)
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={Boolean(image.featured)}
                  onChange={(event) =>
                    updateFormValue(['images', index, 'featured'] as string[], event.target.checked)
                  }
                />
                <span className="text-xs text-gray-600">Featured</span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500">Description</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={image.description || ''}
                  onChange={(event) =>
                    updateFormValue(['images', index, 'description'] as string[], event.target.value)
                  }
                />
              </div>
            </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
