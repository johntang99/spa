interface PricingPanelProps {
  formData: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

const DEFAULT_TREATMENT_ITEM = {
  name: '',
  description: '',
  price: '',
  duration: '',
  notes: '',
};

const DEFAULT_PACKAGE_ITEM = {
  name: '',
  description: '',
  sessions: 0,
  totalPrice: '',
  perSessionPrice: '',
  regularPrice: '',
  savings: '',
  popular: false,
  includes: [''],
  bestFor: '',
};

export function PricingPanel({ formData, updateFormValue }: PricingPanelProps) {
  const treatmentSection = formData?.individualTreatments || {};
  const packageSection = formData?.packages || {};
  const treatmentItems = Array.isArray(treatmentSection?.items) ? treatmentSection.items : [];
  const packageItems = Array.isArray(packageSection?.items) ? packageSection.items : [];

  const addTreatmentItem = () => {
    updateFormValue(['individualTreatments', 'items'], [...treatmentItems, { ...DEFAULT_TREATMENT_ITEM }]);
  };

  const removeTreatmentItem = (index: number) => {
    const next = [...treatmentItems];
    next.splice(index, 1);
    updateFormValue(['individualTreatments', 'items'], next);
  };

  const addPackageItem = () => {
    updateFormValue(['packages', 'items'], [...packageItems, { ...DEFAULT_PACKAGE_ITEM }]);
  };

  const removePackageItem = (index: number) => {
    const next = [...packageItems];
    next.splice(index, 1);
    updateFormValue(['packages', 'items'], next);
  };

  const addPackageInclude = (packageIndex: number) => {
    const current = Array.isArray(packageItems[packageIndex]?.includes)
      ? packageItems[packageIndex].includes
      : [];
    updateFormValue(
      ['packages', 'items', String(packageIndex), 'includes'],
      [...current, '']
    );
  };

  const removePackageInclude = (packageIndex: number, includeIndex: number) => {
    const current = Array.isArray(packageItems[packageIndex]?.includes)
      ? [...packageItems[packageIndex].includes]
      : [];
    current.splice(includeIndex, 1);
    updateFormValue(['packages', 'items', String(packageIndex), 'includes'], current);
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Unit Prices (Individual Treatments)
          </div>
          <button
            type="button"
            onClick={addTreatmentItem}
            className="px-2 py-1 rounded border border-gray-200 text-xs"
          >
            Add Unit Price Item
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Title</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(treatmentSection?.title || '')}
              onChange={(event) =>
                updateFormValue(['individualTreatments', 'title'], event.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Subtitle</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(treatmentSection?.subtitle || '')}
              onChange={(event) =>
                updateFormValue(['individualTreatments', 'subtitle'], event.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Variant</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(treatmentSection?.variant || '')}
              onChange={(event) =>
                updateFormValue(['individualTreatments', 'variant'], event.target.value)
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          {treatmentItems.map((item: any, index: number) => (
            <div key={`unit-price-${index}`} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">{item?.name || `Unit Item ${index + 1}`}</div>
                <button
                  type="button"
                  onClick={() => removeTreatmentItem(index)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.name || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['individualTreatments', 'items', String(index), 'name'],
                        event.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.price || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['individualTreatments', 'items', String(index), 'price'],
                        event.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Duration</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.duration || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['individualTreatments', 'items', String(index), 'duration'],
                        event.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Notes</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.notes || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['individualTreatments', 'items', String(index), 'notes'],
                        event.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.description || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['individualTreatments', 'items', String(index), 'description'],
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

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Package Prices
          </div>
          <button
            type="button"
            onClick={addPackageItem}
            className="px-2 py-1 rounded border border-gray-200 text-xs"
          >
            Add Package
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Title</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(packageSection?.title || '')}
              onChange={(event) => updateFormValue(['packages', 'title'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Subtitle</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(packageSection?.subtitle || '')}
              onChange={(event) => updateFormValue(['packages', 'subtitle'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section Variant</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(packageSection?.variant || '')}
              onChange={(event) => updateFormValue(['packages', 'variant'], event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {packageItems.map((item: any, index: number) => (
            <div key={`package-price-${index}`} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">{item?.name || `Package ${index + 1}`}</div>
                <button
                  type="button"
                  onClick={() => removePackageItem(index)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Package Name</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.name || '')}
                    onChange={(event) =>
                      updateFormValue(['packages', 'items', String(index), 'name'], event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sessions</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={item?.sessions ?? ''}
                    onChange={(event) =>
                      updateFormValue(
                        ['packages', 'items', String(index), 'sessions'],
                        event.target.value === '' ? 0 : Number(event.target.value)
                      )
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 pt-6">
                  <input
                    type="checkbox"
                    checked={Boolean(item?.popular)}
                    onChange={(event) =>
                      updateFormValue(
                        ['packages', 'items', String(index), 'popular'],
                        event.target.checked
                      )
                    }
                  />
                  Popular
                </label>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Total Price</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.totalPrice || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['packages', 'items', String(index), 'totalPrice'],
                        event.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Per Session Price</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.perSessionPrice || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['packages', 'items', String(index), 'perSessionPrice'],
                        event.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Regular Price</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.regularPrice || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['packages', 'items', String(index), 'regularPrice'],
                        event.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Savings</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.savings || '')}
                    onChange={(event) =>
                      updateFormValue(['packages', 'items', String(index), 'savings'], event.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Best For</label>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.bestFor || '')}
                    onChange={(event) =>
                      updateFormValue(['packages', 'items', String(index), 'bestFor'], event.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={String(item?.description || '')}
                    onChange={(event) =>
                      updateFormValue(
                        ['packages', 'items', String(index), 'description'],
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="mt-3 border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Package Includes</div>
                  <button
                    type="button"
                    onClick={() => addPackageInclude(index)}
                    className="px-2 py-1 rounded border border-gray-200 text-xs"
                  >
                    Add Include
                  </button>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(item?.includes) ? item.includes : []).map(
                    (include: string, includeIndex: number) => (
                      <div key={`package-${index}-include-${includeIndex}`} className="flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={String(include || '')}
                          onChange={(event) =>
                            updateFormValue(
                              ['packages', 'items', String(index), 'includes', String(includeIndex)],
                              event.target.value
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removePackageInclude(index, includeIndex)}
                          className="px-2 rounded border border-red-200 text-xs text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
