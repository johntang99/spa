'use client';

import { useMemo, useState } from 'react';
import { type ThemePreset, type ThemePresetCategory, getPresetsByCategory } from '@/lib/theme-presets';

interface ThemePresetsTabProps {
  currentTheme: Record<string, any> | null;
  onApply: (preset: ThemePreset) => void;
}

const CATEGORY_LABELS: Record<ThemePresetCategory, string> = {
  luxury: 'Luxury',
  warm: 'Warm & Local',
  bold: 'Bold & Modern',
  classic: 'Classic & Professional',
  fresh: 'Fresh & Clean',
};

export default function ThemePresetsTab({ currentTheme, onApply }: ThemePresetsTabProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const currentPresetId = currentTheme?._preset?.id || null;
  const groupedPresets = useMemo(() => getPresetsByCategory(), []);

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">
        Applying a preset replaces the current theme in editor state. Save to persist to DB + JSON.
      </p>

      {(Object.keys(groupedPresets) as ThemePresetCategory[]).map((category) => {
        const presets = groupedPresets[category];
        if (presets.length === 0) return null;
        return (
          <section key={category}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {presets.map((preset) => {
                const isApplied = currentPresetId === preset._preset.id;
                const isConfirming = confirmId === preset._preset.id;
                return (
                  <article
                    key={preset._preset.id}
                    className={`rounded-lg border p-4 transition-all ${
                      isApplied ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="mb-3 flex gap-1.5">
                      <span className="h-7 w-7 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors.primary.DEFAULT }} />
                      <span className="h-7 w-7 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors.secondary.DEFAULT }} />
                      <span className="h-7 w-7 rounded-full border border-gray-200" style={{ backgroundColor: preset.colors.backdrop.primary }} />
                    </div>

                    <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: preset.typography.fonts?.heading }}>
                      {preset._preset.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 leading-snug">{preset._preset.description}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">radius: {preset.shape.radius}</span>
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{preset.layout.heroVariant}</span>
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{preset.layout.spacingDensity}</span>
                    </div>

                    <div className="mt-4">
                      {isApplied ? (
                        <span className="text-xs font-semibold text-blue-700">Currently applied</span>
                      ) : isConfirming ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
                            onClick={() => {
                              onApply(preset);
                              setConfirmId(null);
                            }}
                          >
                            Confirm Apply
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-xs font-semibold text-blue-600 hover:underline"
                          onClick={() => setConfirmId(preset._preset.id)}
                        >
                          Apply Preset
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
