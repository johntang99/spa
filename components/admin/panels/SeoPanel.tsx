interface SeoPanelProps {
  formData: Record<string, any>;
  seoPopulating: boolean;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
  populateSeoFromHeroes: () => void;
  addSeoPage: () => void;
  removeSeoPage: (slug: string) => void;
}

export function SeoPanel({
  formData,
  seoPopulating,
  updateFormValue,
  openImagePicker,
  populateSeoFromHeroes,
  addSeoPage,
  removeSeoPage,
}: SeoPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">SEO</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={populateSeoFromHeroes}
            disabled={seoPopulating}
            className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {seoPopulating ? 'Populating...' : 'Auto-populate'}
          </button>
          <button
            type="button"
            onClick={addSeoPage}
            className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Add Page SEO
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-500">Default Title</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={formData.title || ''}
            onChange={(event) => updateFormValue(['title'], event.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Default Description</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={formData.description || ''}
            onChange={(event) => updateFormValue(['description'], event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500">Open Graph Image</label>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.ogImage || ''}
              onChange={(event) => updateFormValue(['ogImage'], event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['ogImage'])}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Home Page SEO</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-500">Home Title</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.home?.title || ''}
              onChange={(event) => updateFormValue(['home', 'title'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Home Description</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.home?.description || ''}
              onChange={(event) => updateFormValue(['home', 'description'], event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Page SEO</div>
        {formData.pages && typeof formData.pages === 'object' ? (
          <div className="space-y-3">
            {Object.entries(formData.pages as Record<string, any>).map(([slug, values]) => (
              <div key={slug} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-700">{slug}</div>
                  <button
                    type="button"
                    onClick={() => removeSeoPage(slug)}
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
                      value={values?.title || ''}
                      onChange={(event) =>
                        updateFormValue(['pages', slug, 'title'], event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Description</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={values?.description || ''}
                      onChange={(event) =>
                        updateFormValue(['pages', slug, 'description'], event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(formData.pages).length === 0 && (
              <div className="text-xs text-gray-500">No page-specific SEO entries yet.</div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">No page-specific SEO entries yet.</div>
        )}
      </div>
    </div>
  );
}
