'use client';

const DEFAULT_ORGANIZATION = {
  name: '',
  role: '',
};

interface AboutAffiliationsPanelProps {
  affiliations: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

export function AboutAffiliationsPanel({ affiliations, updateFormValue }: AboutAffiliationsPanelProps) {
  const title = typeof affiliations.title === 'string' ? affiliations.title : '';
  const variant =
    affiliations.variant === 'detailed' ? 'detailed' : 'compact';
  const organizations = Array.isArray(affiliations.organizations)
    ? affiliations.organizations
    : [];

  const setOrganizations = (next: typeof organizations) => {
    updateFormValue(['affiliations', 'organizations'], next);
  };

  const addOrganization = () => {
    setOrganizations([...organizations, { ...DEFAULT_ORGANIZATION }]);
  };

  const removeOrganization = (index: number) => {
    setOrganizations(organizations.filter((_, i) => i !== index));
  };

  const patchOrg = (index: number, patch: Record<string, string>) => {
    const next = [...organizations];
    next[index] = { ...next[index], ...patch };
    setOrganizations(next);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">Affiliations</div>
      <p className="text-xs text-gray-500">
        Professional memberships shown on the About page. Add or remove organizations as needed.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-500">Title</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => updateFormValue(['affiliations', 'title'], e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Variant</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={variant}
            onChange={(e) => updateFormValue(['affiliations', 'variant'], e.target.value)}
          >
            <option value="compact">compact</option>
            <option value="detailed">detailed</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">
          Organizations ({organizations.length})
        </span>
        <button
          type="button"
          onClick={addOrganization}
          className="rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
        >
          Add organization
        </button>
      </div>

      <div className="space-y-4">
        {organizations.map((org: Record<string, any>, index: number) => (
          <div key={`aff-${index}`} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Item {index + 1}</span>
              <button
                type="button"
                onClick={() => removeOrganization(index)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Name</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={org.name || ''}
                onChange={(e) => patchOrg(index, { name: e.target.value })}
                placeholder="Organization name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Role</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={org.role || ''}
                onChange={(e) => patchOrg(index, { role: e.target.value })}
                placeholder="e.g. Active Member"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
