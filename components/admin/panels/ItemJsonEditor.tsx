interface ItemJsonEditorProps {
  error: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onApply: () => void;
  placeholder: string;
}

export function ItemJsonEditor({
  error,
  draft,
  onDraftChange,
  onApply,
  placeholder,
}: ItemJsonEditorProps) {
  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <textarea
        className="w-full min-h-[520px] rounded-lg border border-gray-200 p-3 font-mono text-xs text-gray-800"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder={placeholder}
      />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!!error}
          onClick={onApply}
          className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Apply JSON Changes
        </button>
      </div>
    </div>
  );
}
