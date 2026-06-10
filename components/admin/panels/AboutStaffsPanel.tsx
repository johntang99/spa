'use client';

const DEFAULT_MEMBER = {
  image: '',
  name: '',
  title: '',
  description: '',
};

interface AboutStaffsPanelProps {
  staffs: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function AboutStaffsPanel({ staffs, updateFormValue, openImagePicker }: AboutStaffsPanelProps) {
  const title = typeof staffs.title === 'string' ? staffs.title : '';
  const members = Array.isArray(staffs.members) ? staffs.members : [];

  const setMembers = (next: typeof members) => {
    updateFormValue(['staffs', 'members'], next);
  };

  const addMember = () => {
    setMembers([...members, { ...DEFAULT_MEMBER }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">Staffs</div>
      <p className="text-xs text-gray-500">
        Team grid on the About page (photo, name, title, description). Shown above Education &amp; Credentials.
      </p>

      <div>
        <label className="block text-xs text-gray-500">Section title</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => updateFormValue(['staffs', 'title'], e.target.value)}
          placeholder="Meet Our Team"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">Members ({members.length})</span>
        <button
          type="button"
          onClick={addMember}
          className="rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
        >
          Add staff
        </button>
      </div>

      <div className="space-y-4">
        {members.map((member: Record<string, any>, index: number) => (
          <div key={`staff-${index}`} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Staff {index + 1}</span>
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Photo URL</label>
              <div className="mt-1 flex gap-2">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={member.image || ''}
                  onChange={(e) => {
                    const next = [...members];
                    next[index] = { ...next[index], image: e.target.value };
                    setMembers(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => openImagePicker(['staffs', 'members', String(index), 'image'])}
                  className="shrink-0 rounded-md border border-gray-200 px-3 text-xs"
                >
                  Choose
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Name</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={member.name || ''}
                onChange={(e) => {
                  const next = [...members];
                  next[index] = { ...next[index], name: e.target.value };
                  setMembers(next);
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Title / role</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={member.title || ''}
                onChange={(e) => {
                  const next = [...members];
                  next[index] = { ...next[index], title: e.target.value };
                  setMembers(next);
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Description</label>
              <textarea
                className="mt-1 w-full min-h-[100px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={member.description || ''}
                onChange={(e) => {
                  const next = [...members];
                  next[index] = { ...next[index], description: e.target.value };
                  setMembers(next);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
