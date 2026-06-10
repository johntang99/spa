interface IntroductionPanelProps {
  introduction: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

export function IntroductionPanel({
  introduction,
  updateFormValue,
}: IntroductionPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Introduction</div>
      {'text' in introduction && (
        <div>
          <label className="block text-xs text-gray-500">Text</label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={introduction.text || ''}
            onChange={(event) => updateFormValue(['introduction', 'text'], event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
