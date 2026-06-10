interface ContentFileRef {
  id: string;
  path: string;
}

interface ConditionsModuleListProps {
  conditionsPageFile: ContentFileRef | null;
  conditionsLayoutFile: ContentFileRef | null;
  isConditionsPageSettingsSelected: boolean;
  isConditionsLayoutFileActive: boolean;
  isConditionsPageFileActive: boolean;
  activeConditionCategoryIndex: number;
  activeConditionIndex: number;
  categories: any[];
  conditionItems: any[];
  setActiveFile: (file: ContentFileRef | null) => void;
  setActiveConditionCategoryIndex: (index: number) => void;
  setActiveConditionIndex: (index: number) => void;
  addConditionCategory: () => void;
  removeConditionCategory: (index: number) => void;
  addConditionItem: () => void;
  removeConditionItem: (index: number) => void;
  setStatus: (status: string) => void;
}

export function ConditionsModuleList({
  conditionsPageFile,
  conditionsLayoutFile,
  isConditionsPageSettingsSelected,
  isConditionsLayoutFileActive,
  isConditionsPageFileActive,
  activeConditionCategoryIndex,
  activeConditionIndex,
  categories,
  conditionItems,
  setActiveFile,
  setActiveConditionCategoryIndex,
  setActiveConditionIndex,
  addConditionCategory,
  removeConditionCategory,
  addConditionItem,
  removeConditionItem,
  setStatus,
}: ConditionsModuleListProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (conditionsPageFile) setActiveFile(conditionsPageFile);
          setActiveConditionCategoryIndex(-1);
          setActiveConditionIndex(-1);
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          isConditionsPageSettingsSelected
            ? 'bg-[var(--primary)] text-white'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="font-medium">Page Settings</div>
        <div className="text-xs opacity-70">hero / featured / categories</div>
      </button>
      {conditionsLayoutFile && (
        <button
          type="button"
          onClick={() => {
            setActiveFile(conditionsLayoutFile);
            setActiveConditionCategoryIndex(-1);
            setActiveConditionIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isConditionsLayoutFileActive ? 'bg-[var(--primary)] text-white' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">Layout</div>
          <div className="text-xs opacity-70">section order</div>
        </button>
      )}
      <div className="pt-1 text-[11px] font-semibold text-gray-500 uppercase">Categories</div>
      <button
        type="button"
        onClick={addConditionCategory}
        disabled={!isConditionsPageFileActive}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Category
      </button>
      <button
        type="button"
        disabled={!isConditionsPageFileActive || activeConditionCategoryIndex < 0}
        onClick={() => {
          if (!isConditionsPageFileActive || activeConditionCategoryIndex < 0) return;
          const currentCategory = categories[activeConditionCategoryIndex];
          if (currentCategory?.id === 'all') {
            setStatus('Cannot delete the "all" category.');
            return;
          }
          const categoryName =
            currentCategory?.name ||
            currentCategory?.id ||
            `Category ${activeConditionCategoryIndex + 1}`;
          const confirmed = window.confirm(
            `Delete "${categoryName}"? Conditions in this category will be reassigned.`
          );
          if (!confirmed) return;
          removeConditionCategory(activeConditionCategoryIndex);
        }}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Category
      </button>
      {categories.map((category: any, index: number) => (
        <button
          key={`${category?.id || 'category'}-${index}`}
          type="button"
          onClick={() => {
            if (conditionsPageFile) setActiveFile(conditionsPageFile);
            setActiveConditionCategoryIndex(index);
            setActiveConditionIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isConditionsPageFileActive && activeConditionCategoryIndex === index
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">{category?.name || `Category ${index + 1}`}</div>
          <div className="text-xs opacity-70">{category?.id || `#${index + 1}`}</div>
        </button>
      ))}

      <div className="pt-2 text-[11px] font-semibold text-gray-500 uppercase">Conditions</div>
      <button
        type="button"
        onClick={addConditionItem}
        disabled={!isConditionsPageFileActive}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Condition
      </button>
      <button
        type="button"
        disabled={!isConditionsPageFileActive || activeConditionIndex < 0}
        onClick={() => {
          if (!isConditionsPageFileActive || activeConditionIndex < 0) return;
          const currentCondition = conditionItems[activeConditionIndex];
          const conditionName =
            currentCondition?.title ||
            currentCondition?.id ||
            `Condition ${activeConditionIndex + 1}`;
          const confirmed = window.confirm(
            `Delete "${conditionName}"? This removes only this condition item.`
          );
          if (!confirmed) return;
          removeConditionItem(activeConditionIndex);
        }}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Condition
      </button>
      {conditionItems.map((condition: any, index: number) => (
        <button
          key={`${condition?.id || 'condition'}-${index}`}
          type="button"
          onClick={() => {
            if (conditionsPageFile) setActiveFile(conditionsPageFile);
            setActiveConditionIndex(index);
            setActiveConditionCategoryIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isConditionsPageFileActive && activeConditionIndex === index
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">{condition?.title || `Condition ${index + 1}`}</div>
          <div className="text-xs opacity-70">{condition?.id || `#${index + 1}`}</div>
        </button>
      ))}
    </>
  );
}
