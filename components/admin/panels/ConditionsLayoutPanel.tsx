interface ConditionsLayoutPanelProps {
  layoutVariant: string;
  updateFormValue: (path: string[], value: any) => void;
}

export function ConditionsLayoutPanel({
  layoutVariant,
  updateFormValue,
}: ConditionsLayoutPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        Conditions Layout Variant
      </div>
      <div>
        <label className="block text-xs text-gray-500">Layout Variant</label>
        <select
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
          value={layoutVariant}
          onChange={(event) => updateFormValue(['layoutVariant'], event.target.value)}
        >
          <option value="categories-tabs">categories-tabs</option>
          <option value="category-detail-alternating">category-detail-alternating</option>
        </select>
      </div>
    </div>
  );
}
