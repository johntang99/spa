'use client';

import ReactMarkdown from 'react-markdown';

const DEFAULT_ITEM = {
  icon: 'GraduationCap',
  year: '',
  location: '',
  credential: '',
  institution: '',
};

interface AboutCredentialsPanelProps {
  credentials: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
}

export function AboutCredentialsPanel({
  credentials,
  updateFormValue,
  markdownPreview,
  toggleMarkdownPreview,
}: AboutCredentialsPanelProps) {
  const title = typeof credentials.title === 'string' ? credentials.title : '';
  const variant = credentials.variant === 'grid' ? 'grid' : 'list';
  const items = Array.isArray(credentials.items) ? credentials.items : [];

  const setItems = (next: typeof items) => {
    updateFormValue(['credentials', 'items'], next);
  };

  const addItem = () => {
    setItems([...items, { ...DEFAULT_ITEM }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const patchItem = (index: number, patch: Record<string, string>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    setItems(next);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">Education &amp; Credentials</div>
      <p className="text-xs text-gray-500">
        Add or remove credential rows. Institution supports <strong>Markdown</strong> (lists, links, emphasis).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-500">Title</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => updateFormValue(['credentials', 'title'], e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Variant</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={variant}
            onChange={(e) => updateFormValue(['credentials', 'variant'], e.target.value)}
          >
            <option value="list">list</option>
            <option value="grid">grid</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">Items ({items.length})</span>
        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
        >
          Add credential
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item: Record<string, any>, index: number) => {
          const previewKey = `about-cred-inst-${index}`;
          const showPreview = Boolean(markdownPreview[previewKey]);
          const institution = String(item.institution || '');
          return (
            <div key={`cred-${index}`} className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-500">Icon</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={item.icon || ''}
                    onChange={(e) => patchItem(index, { icon: e.target.value })}
                    placeholder="GraduationCap"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Year</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={item.year || ''}
                    onChange={(e) => patchItem(index, { year: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Location</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={item.location || ''}
                    onChange={(e) => patchItem(index, { location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Credential</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={item.credential || ''}
                    onChange={(e) => patchItem(index, { credential: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-gray-500">Institution (Markdown)</label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => toggleMarkdownPreview(previewKey)}
                  >
                    {showPreview ? 'Edit' : 'Preview'}
                  </button>
                </div>
                {showPreview ? (
                  <div className="mt-1 min-h-[120px] rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm prose prose-sm max-w-none">
                    {institution.trim() ? (
                      <ReactMarkdown>{institution}</ReactMarkdown>
                    ) : (
                      <span className="text-gray-400">Nothing to preview</span>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="mt-1 w-full min-h-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                    value={institution}
                    onChange={(e) => patchItem(index, { institution: e.target.value })}
                    placeholder="- Line one&#10;- Line two&#10;[Link](https://example.com)"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
