interface ContentFileRef {
  id: string;
  path: string;
}

interface ServicesModuleListProps {
  servicesPageFile: ContentFileRef | null;
  servicesLayoutFile: ContentFileRef | null;
  isServicesPageSettingsSelected: boolean;
  isServicesLayoutFileActive: boolean;
  isServicesPageFileActive: boolean;
  activeServiceIndex: number;
  serviceItems: any[];
  setActiveFile: (file: ContentFileRef | null) => void;
  setActiveServiceIndex: (index: number) => void;
  addServicesListItem: () => void;
  deleteSelectedService: () => void;
}

export function ServicesModuleList({
  servicesPageFile,
  servicesLayoutFile,
  isServicesPageSettingsSelected,
  isServicesLayoutFileActive,
  isServicesPageFileActive,
  activeServiceIndex,
  serviceItems,
  setActiveFile,
  setActiveServiceIndex,
  addServicesListItem,
  deleteSelectedService,
}: ServicesModuleListProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (servicesPageFile) setActiveFile(servicesPageFile);
          setActiveServiceIndex(-1);
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          isServicesPageSettingsSelected
            ? 'bg-[var(--primary)] text-white'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="font-medium">Page Settings</div>
        <div className="text-xs opacity-70">hero / overview / faq / cta</div>
      </button>
      {servicesLayoutFile && (
        <button
          type="button"
          onClick={() => setActiveFile(servicesLayoutFile)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isServicesLayoutFileActive ? 'bg-[var(--primary)] text-white' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">Layout</div>
          <div className="text-xs opacity-70">section order</div>
        </button>
      )}
      <button
        type="button"
        onClick={addServicesListItem}
        disabled={!isServicesPageFileActive}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Service
      </button>
      <button
        type="button"
        disabled={!isServicesPageFileActive || activeServiceIndex < 0}
        onClick={deleteSelectedService}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Service
      </button>
      {serviceItems.map((service: any, index: number) => (
        <button
          key={`${service?.id || 'service'}-${index}`}
          type="button"
          onClick={() => {
            if (servicesPageFile) setActiveFile(servicesPageFile);
            setActiveServiceIndex(index);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isServicesPageFileActive && activeServiceIndex === index
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">{service?.title || `Service ${index + 1}`}</div>
          <div className="text-xs opacity-70">{service?.id || `#${index + 1}`}</div>
        </button>
      ))}
      {serviceItems.length === 0 && (
        <div className="text-sm text-gray-500">
          {isServicesPageFileActive
            ? 'No services yet. Click Add Service.'
            : 'Open Page Settings to edit service content.'}
        </div>
      )}
    </>
  );
}
