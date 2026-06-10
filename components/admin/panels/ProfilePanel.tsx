interface ProfilePanelProps {
  profile: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function ProfilePanel({ profile, updateFormValue, openImagePicker }: ProfilePanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Profile</div>
      {'name' in profile && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Name</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={profile.name || ''}
            onChange={(event) => updateFormValue(['profile', 'name'], event.target.value)}
          />
        </div>
      )}
      {'title' in profile && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Title</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={profile.title || ''}
            onChange={(event) => updateFormValue(['profile', 'title'], event.target.value)}
          />
        </div>
      )}
      {'bio' in profile && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">
            Bio <span className="font-normal text-gray-400">(Markdown — include pull quotes with &gt; lines)</span>
          </label>
          <textarea
            className="mt-1 w-full min-h-[280px] rounded-md border border-gray-200 px-3 py-2 text-sm font-mono leading-relaxed"
            value={profile.bio || ''}
            onChange={(event) => updateFormValue(['profile', 'bio'], event.target.value)}
            placeholder={'Intro paragraphs...\n\n> Pull quote text here.\n\n**Name, credentials**'}
          />
        </div>
      )}
      {'image' in profile && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500">Profile Photo</label>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={profile.image || ''}
              onChange={(event) => updateFormValue(['profile', 'image'], event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['profile', 'image'])}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
        </div>
      )}
      {'signature' in profile && (
        <div>
          <label className="block text-xs text-gray-500">Signature Image</label>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={profile.signature || ''}
              onChange={(event) => updateFormValue(['profile', 'signature'], event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['profile', 'signature'])}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
