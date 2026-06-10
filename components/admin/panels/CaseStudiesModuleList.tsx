interface ContentFileRef {
  id: string;
  path: string;
}

interface CaseStudiesModuleListProps {
  caseStudiesPageFile: ContentFileRef | null;
  caseStudiesLayoutFile: ContentFileRef | null;
  isCaseStudiesPageSettingsSelected: boolean;
  isCaseStudiesLayoutFileActive: boolean;
  isCaseStudiesPageFileActive: boolean;
  activeCaseStudyCategoryIndex: number;
  activeCaseStudyIndex: number;
  categories: any[];
  caseStudies: any[];
  setActiveFile: (file: ContentFileRef | null) => void;
  setActiveCaseStudyCategoryIndex: (index: number) => void;
  setActiveCaseStudyIndex: (index: number) => void;
  addCaseStudyCategory: () => void;
  deleteSelectedCaseStudyCategory: () => void;
  addCaseStudyItem: () => void;
  deleteSelectedCaseStudyItem: () => void;
  setStatus: (status: string) => void;
}

export function CaseStudiesModuleList({
  caseStudiesPageFile,
  caseStudiesLayoutFile,
  isCaseStudiesPageSettingsSelected,
  isCaseStudiesLayoutFileActive,
  isCaseStudiesPageFileActive,
  activeCaseStudyCategoryIndex,
  activeCaseStudyIndex,
  categories,
  caseStudies,
  setActiveFile,
  setActiveCaseStudyCategoryIndex,
  setActiveCaseStudyIndex,
  addCaseStudyCategory,
  deleteSelectedCaseStudyCategory,
  addCaseStudyItem,
  deleteSelectedCaseStudyItem,
  setStatus,
}: CaseStudiesModuleListProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (caseStudiesPageFile) setActiveFile(caseStudiesPageFile);
          setActiveCaseStudyCategoryIndex(-1);
          setActiveCaseStudyIndex(-1);
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          isCaseStudiesPageSettingsSelected
            ? 'bg-[var(--primary)] text-white'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="font-medium">Page Settings</div>
        <div className="text-xs opacity-70">hero / intro / stats / cta</div>
      </button>
      {caseStudiesLayoutFile && (
        <button
          type="button"
          onClick={() => {
            setActiveFile(caseStudiesLayoutFile);
            setActiveCaseStudyCategoryIndex(-1);
            setActiveCaseStudyIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isCaseStudiesLayoutFileActive
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">Layout</div>
          <div className="text-xs opacity-70">section order</div>
        </button>
      )}

      <div className="pt-1 text-[11px] font-semibold text-gray-500 uppercase">Categories</div>
      <button
        type="button"
        onClick={addCaseStudyCategory}
        disabled={!isCaseStudiesPageFileActive}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Category
      </button>
      <button
        type="button"
        disabled={!isCaseStudiesPageFileActive || activeCaseStudyCategoryIndex < 0}
        onClick={() => {
          if (!isCaseStudiesPageFileActive || activeCaseStudyCategoryIndex < 0) return;
          const currentCategory = categories[activeCaseStudyCategoryIndex];
          if (currentCategory?.id === 'all') {
            setStatus('Cannot delete the "all" category.');
            return;
          }
          const categoryName =
            currentCategory?.name ||
            currentCategory?.id ||
            `Category ${activeCaseStudyCategoryIndex + 1}`;
          const confirmed = window.confirm(
            `Delete "${categoryName}"? Case studies in this category will be reassigned.`
          );
          if (!confirmed) return;
          deleteSelectedCaseStudyCategory();
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
            if (caseStudiesPageFile) setActiveFile(caseStudiesPageFile);
            setActiveCaseStudyCategoryIndex(index);
            setActiveCaseStudyIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isCaseStudiesPageFileActive && activeCaseStudyCategoryIndex === index
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">{category?.name || `Category ${index + 1}`}</div>
          <div className="text-xs opacity-70">{category?.id || `#${index + 1}`}</div>
        </button>
      ))}

      <div className="pt-2 text-[11px] font-semibold text-gray-500 uppercase">Case Studies</div>
      <button
        type="button"
        onClick={addCaseStudyItem}
        disabled={!isCaseStudiesPageFileActive}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Case Study
      </button>
      <button
        type="button"
        disabled={!isCaseStudiesPageFileActive || activeCaseStudyIndex < 0}
        onClick={() => {
          if (!isCaseStudiesPageFileActive || activeCaseStudyIndex < 0) return;
          const currentCase = caseStudies[activeCaseStudyIndex];
          const caseName =
            currentCase?.condition || currentCase?.id || `Case ${activeCaseStudyIndex + 1}`;
          const confirmed = window.confirm(
            `Delete "${caseName}"? This removes only this case study item.`
          );
          if (!confirmed) return;
          deleteSelectedCaseStudyItem();
        }}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Case Study
      </button>
      {caseStudies.map((item: any, index: number) => (
        <button
          key={`${item?.id || 'case'}-${index}`}
          type="button"
          onClick={() => {
            if (caseStudiesPageFile) setActiveFile(caseStudiesPageFile);
            setActiveCaseStudyIndex(index);
            setActiveCaseStudyCategoryIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isCaseStudiesPageFileActive && activeCaseStudyIndex === index
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">{item?.condition || `Case ${index + 1}`}</div>
          <div className="text-xs opacity-70">{item?.id || `#${index + 1}`}</div>
        </button>
      ))}
    </>
  );
}
