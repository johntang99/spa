import { resolveMediaUrl } from '@/lib/media-url';

interface HeaderPanelProps {
  formData: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
  addHeaderMenuItem: () => void;
  removeHeaderMenuItem: (index: number) => void;
  addHeaderLanguage: () => void;
  removeHeaderLanguage: (index: number) => void;
}

export function HeaderPanel({
  formData,
  updateFormValue,
  openImagePicker,
  addHeaderMenuItem,
  removeHeaderMenuItem,
  addHeaderLanguage,
  removeHeaderLanguage,
}: HeaderPanelProps) {
  const logoImagePreview =
    typeof formData.menu?.logo?.image?.src === 'string' && formData.menu.logo.image.src.trim()
      ? resolveMediaUrl(formData.menu.logo.image.src.trim())
      : '';

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Header</div>

      <div className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Topbar</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">Phone</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.topbar?.phone || ''}
                onChange={(event) => updateFormValue(['topbar', 'phone'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Phone Href</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.topbar?.phoneHref || ''}
                onChange={(event) => updateFormValue(['topbar', 'phoneHref'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Address</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.topbar?.address || ''}
                onChange={(event) => updateFormValue(['topbar', 'address'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Address Href</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.topbar?.addressHref || ''}
                onChange={(event) => updateFormValue(['topbar', 'addressHref'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Hours</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.topbar?.hours || ''}
                onChange={(event) => updateFormValue(['topbar', 'hours'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Badge</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.topbar?.badge || ''}
                onChange={(event) => updateFormValue(['topbar', 'badge'], event.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Logo</div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500">Menu Variant</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.menu?.variant || 'default'}
              onChange={(event) => updateFormValue(['menu', 'variant'], event.target.value)}
            >
              <option value="default">Default</option>
              <option value="centered">Centered</option>
              <option value="transparent">Transparent</option>
              <option value="stacked">Stacked</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500">Menu Font Weight</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.menu?.fontWeight || 'semibold'}
              onChange={(event) => updateFormValue(['menu', 'fontWeight'], event.target.value)}
            >
              <option value="regular">Regular</option>
              <option value="semibold">Semibold</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500">Emoji</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.menu?.logo?.emoji || ''}
                onChange={(event) => updateFormValue(['menu', 'logo', 'emoji'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Text</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.menu?.logo?.text || ''}
                onChange={(event) => updateFormValue(['menu', 'logo', 'text'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Subtext</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.menu?.logo?.subtext || ''}
                onChange={(event) =>
                  updateFormValue(['menu', 'logo', 'subtext'], event.target.value)
                }
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">Logo Image</label>
              <div className="mt-1 flex gap-2">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={formData.menu?.logo?.image?.src || ''}
                  onChange={(event) =>
                    updateFormValue(['menu', 'logo', 'image', 'src'], event.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => openImagePicker(['menu', 'logo', 'image', 'src'])}
                  className="px-3 rounded-md border border-gray-200 text-xs"
                >
                  Choose
                </button>
              </div>
              {logoImagePreview && (
                <div className="mt-2">
                  <img
                    src={logoImagePreview}
                    alt="Logo image preview"
                    className="h-16 w-16 rounded-md border border-gray-200 object-contain bg-white"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500">Logo Alt</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.menu?.logo?.image?.alt || ''}
                onChange={(event) =>
                  updateFormValue(['menu', 'logo', 'image', 'alt'], event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">Menu Items</div>
            <button
              type="button"
              onClick={addHeaderMenuItem}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
            >
              Add Item
            </button>
          </div>
          <div className="space-y-3">
            {(Array.isArray(formData.menu?.items) ? formData.menu.items : []).map(
              (item: any, index: number) => (
                <div
                  key={`header-item-${index}`}
                  className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end"
                >
                  <div>
                    <label className="block text-xs text-gray-500">Text</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={item?.text || ''}
                      onChange={(event) =>
                        updateFormValue(['menu', 'items', `${index}`, 'text'], event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">URL</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={item?.url || ''}
                      onChange={(event) =>
                        updateFormValue(['menu', 'items', `${index}`, 'url'], event.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHeaderMenuItem(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )
            )}
            {!Array.isArray(formData.menu?.items) || formData.menu.items.length === 0 ? (
              <div className="text-xs text-gray-500">No menu items yet.</div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">Languages</div>
            <button
              type="button"
              onClick={addHeaderLanguage}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
            >
              Add Language
            </button>
          </div>
          <div className="space-y-3">
            {(Array.isArray(formData.languages) ? formData.languages : []).map(
              (item: any, index: number) => (
                <div
                  key={`header-language-${index}`}
                  className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] items-end"
                >
                  <div>
                    <label className="block text-xs text-gray-500">Label</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={item?.label || ''}
                      onChange={(event) =>
                        updateFormValue(['languages', `${index}`, 'label'], event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Locale</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={item?.locale || ''}
                      onChange={(event) =>
                        updateFormValue(['languages', `${index}`, 'locale'], event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">URL</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={item?.url || ''}
                      onChange={(event) =>
                        updateFormValue(['languages', `${index}`, 'url'], event.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHeaderLanguage(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )
            )}
            {!Array.isArray(formData.languages) || formData.languages.length === 0 ? (
              <div className="text-xs text-gray-500">No languages yet.</div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">CTA</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">Text</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.cta?.text || ''}
                onChange={(event) => updateFormValue(['cta', 'text'], event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Link</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={formData.cta?.link || ''}
                onChange={(event) => updateFormValue(['cta', 'link'], event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
