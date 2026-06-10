interface ContentFileRef {
  id: string;
  label: string;
  path: string;
}

interface SeoProgramsModuleListProps {
  locations: string[];
  selectedLocation: string;
  pages: ContentFileRef[];
  activeFilePath?: string;
  onSelectLocation: (location: string) => void;
  setActiveFile: (file: ContentFileRef | null) => void;
  addLocation: () => void;
  deleteSelectedLocation: () => void;
  addPage: () => void;
  deleteSelectedPage: () => void;
}

function toTitleCase(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getLocationDisplayName(location: string) {
  if (/^[\u4e00-\u9fff]+$/u.test(location)) return location;
  return toTitleCase(location);
}

export function SeoProgramsModuleList({
  locations,
  selectedLocation,
  pages,
  activeFilePath,
  onSelectLocation,
  setActiveFile,
  addLocation,
  deleteSelectedLocation,
  addPage,
  deleteSelectedPage,
}: SeoProgramsModuleListProps) {
  return (
    <>
      <div className="pt-1 text-[11px] font-semibold text-gray-500 uppercase">Locations</div>
      <button
        type="button"
        onClick={addLocation}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
      >
        Add Location
      </button>
      <button
        type="button"
        onClick={deleteSelectedLocation}
        disabled={!selectedLocation}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Location
      </button>
      {locations.map((location) => (
        <button
          key={location}
          type="button"
          onClick={() => onSelectLocation(location)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            selectedLocation === location
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">{getLocationDisplayName(location)}</div>
          <div className="text-xs opacity-70">{location}</div>
        </button>
      ))}

      <div className="pt-2 text-[11px] font-semibold text-gray-500 uppercase">SEO Pages</div>
      <button
        type="button"
        onClick={addPage}
        disabled={!selectedLocation}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Page
      </button>
      <button
        type="button"
        onClick={deleteSelectedPage}
        disabled={!activeFilePath || activeFilePath.includes('/') || activeFilePath.endsWith('.json')}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Page
      </button>

      {pages.map((page) => {
        const isActive = activeFilePath === page.path;
        return (
          <button
            key={page.id}
            type="button"
            onClick={() => setActiveFile(page)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              isActive ? 'bg-[var(--primary)] text-white' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="font-medium">{page.label.replace(/^SEO Page:\s*/i, '')}</div>
            <div className="text-xs opacity-70">{page.path}</div>
          </button>
        );
      })}

      {selectedLocation && pages.length === 0 && (
        <div className="text-sm text-gray-500">
          No SEO pages for this location yet. Click Add Page.
        </div>
      )}
    </>
  );
}
