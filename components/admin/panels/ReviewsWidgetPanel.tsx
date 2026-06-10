interface ReviewsWidgetPanelProps {
  reviewsWidget: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

const LAYOUTS: { value: 'cards' | 'carousel' | 'single' | 'compact'; label: string; hint: string }[] = [
  { value: 'cards', label: 'Grid', hint: 'Three-up cards' },
  { value: 'carousel', label: 'Carousel', hint: 'Horizontal scroll' },
  { value: 'single', label: 'Single', hint: 'One at a time, auto-rotates' },
  { value: 'compact', label: 'Compact', hint: 'Short clips list' },
];

export function ReviewsWidgetPanel({
  reviewsWidget,
  updateFormValue,
}: ReviewsWidgetPanelProps) {
  const set = (key: string, value: any) =>
    updateFormValue(['reviewsWidget', key], value);

  const layout = reviewsWidget.layout ?? 'cards';
  const minRating = reviewsWidget.minRating ?? 4;
  const maxCount = reviewsWidget.maxCount ?? 6;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        Reviews widget
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500">BAAM location slug</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
          placeholder="dr-huang-acupuncture-and-green-eastern-b-xn4w"
          value={reviewsWidget.slug ?? ''}
          onChange={(e) => set('slug', e.target.value)}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Find in BAAM Review admin → Locations → slug column.
        </p>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500">Badge</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="VERIFIED GOOGLE REVIEWS"
          value={reviewsWidget.badge ?? ''}
          onChange={(e) => set('badge', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500">Title</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="What patients say on Google"
          value={reviewsWidget.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500">Subtitle</label>
        <textarea
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          rows={2}
          placeholder="One line of context shown under the title."
          value={reviewsWidget.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Layout</label>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUTS.map((opt) => {
            const active = layout === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('layout', opt.value)}
                className={
                  'rounded-md border px-3 py-2 text-left text-sm transition-colors ' +
                  (active
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
                }
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-[11px] text-gray-500">{opt.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500">How many to show</label>
          <input
            type="number"
            min={3}
            max={20}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={maxCount}
            onChange={(e) => {
              const n = Number(e.target.value);
              set(
                'maxCount',
                Number.isFinite(n) ? Math.max(3, Math.min(20, n)) : 6,
              );
            }}
          />
          <p className="mt-1 text-[11px] text-gray-400">3–20.</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Minimum rating</label>
          <div className="mt-1 flex gap-1.5">
            {[4, 5].map((r) => {
              const active = minRating === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('minRating', r)}
                  className={
                    'flex-1 rounded-md border px-3 py-2 text-sm transition-colors ' +
                    (active
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
                  }
                >
                  {r === 5 ? '★★★★★ only' : '★★★★+'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500">Accent color</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded-md border border-gray-200 bg-white p-1"
              value={reviewsWidget.accentColor || '#1F4D3F'}
              onChange={(e) => set('accentColor', e.target.value)}
            />
            <input
              className="w-28 rounded-md border border-gray-200 px-3 py-2 text-sm font-mono uppercase"
              value={reviewsWidget.accentColor || ''}
              onChange={(e) => set('accentColor', e.target.value)}
              placeholder="#1F4D3F"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Max width (px)</label>
          <input
            type="number"
            min={320}
            max={1600}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="1100"
            value={reviewsWidget.maxWidth ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (!raw) {
                set('maxWidth', undefined);
                return;
              }
              const n = Number(raw);
              if (Number.isFinite(n))
                set('maxWidth', Math.max(320, Math.min(1600, n)));
            }}
          />
          <p className="mt-1 text-[11px] text-gray-400">Leave blank to fill container.</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Toggle
          label="Show aggregate rating bar"
          checked={reviewsWidget.showAggregate !== false}
          onChange={(v) => set('showAggregate', v)}
        />
        <Toggle
          label="Show “Leave your own review” button"
          checked={reviewsWidget.showLeaveOwn !== false}
          onChange={(v) => set('showLeaveOwn', v)}
        />
        <Toggle
          label="Show owner replies"
          checked={!!reviewsWidget.showReply}
          onChange={(v) => set('showReply', v)}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
