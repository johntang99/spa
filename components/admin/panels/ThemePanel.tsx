import type { ReactNode } from 'react';

interface ThemePanelProps {
  getPathValue: (path: string[]) => any;
  updateFormValue: (path: string[], value: any) => void;
  renderColorField: (label: string, path: string[]) => ReactNode;
}

export function ThemePanel({ getPathValue, updateFormValue, renderColorField }: ThemePanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-6">
      <div className="text-xs font-semibold text-gray-500 uppercase">Theme</div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Typography Sizes</div>
          {(['display', 'heading', 'subheading', 'body', 'small'] as const).map((key) => (
            <div key={`type-${key}`}>
              <label className="block text-xs text-gray-500">{key}</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={String(getPathValue(['typography', key]) || '')}
                onChange={(event) => updateFormValue(['typography', key], event.target.value)}
                placeholder="e.g. 2rem"
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Typography Fonts</div>
          {(['display', 'heading', 'subheading', 'body', 'small'] as const).map((key) => (
            <div key={`font-${key}`}>
              <label className="block text-xs text-gray-500">{key}</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={String(getPathValue(['typography', 'fonts', key]) || '')}
                onChange={(event) =>
                  updateFormValue(['typography', 'fonts', key], event.target.value)
                }
                placeholder="e.g. Inter, sans-serif"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Primary Colors</div>
          {renderColorField('Primary', ['colors', 'primary', 'DEFAULT'])}
          {renderColorField('Primary Dark', ['colors', 'primary', 'dark'])}
          {renderColorField('Primary Light', ['colors', 'primary', 'light'])}
          {renderColorField('Primary 50', ['colors', 'primary', '50'])}
          {renderColorField('Primary 100', ['colors', 'primary', '100'])}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Secondary Colors</div>
          {renderColorField('Secondary', ['colors', 'secondary', 'DEFAULT'])}
          {renderColorField('Secondary Dark', ['colors', 'secondary', 'dark'])}
          {renderColorField('Secondary Light', ['colors', 'secondary', 'light'])}
          {renderColorField('Secondary 50', ['colors', 'secondary', '50'])}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Backdrop Colors</div>
          {renderColorField('Backdrop Primary', ['colors', 'backdrop', 'primary'])}
          {renderColorField('Backdrop Secondary', ['colors', 'backdrop', 'secondary'])}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Shape Tokens</div>
          <div>
            <label className="block text-xs text-gray-500">Radius</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(getPathValue(['shape', 'radius']) || '')}
              onChange={(event) => updateFormValue(['shape', 'radius'], event.target.value)}
              placeholder="e.g. 8px"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Shadow</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(getPathValue(['shape', 'shadow']) || '')}
              onChange={(event) => updateFormValue(['shape', 'shadow'], event.target.value)}
              placeholder="e.g. 0 4px 20px rgba(0,0,0,0.08)"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Layout Tokens</div>
          <div>
            <label className="block text-xs text-gray-500">Hero Variant</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(getPathValue(['layout', 'heroVariant']) || '')}
              onChange={(event) => updateFormValue(['layout', 'heroVariant'], event.target.value)}
              placeholder="e.g. split"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Feature Variant</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(getPathValue(['layout', 'featureVariant']) || '')}
              onChange={(event) => updateFormValue(['layout', 'featureVariant'], event.target.value)}
              placeholder="e.g. grid"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Spacing Density</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={String(getPathValue(['layout', 'spacingDensity']) || 'comfortable')}
              onChange={(event) => updateFormValue(['layout', 'spacingDensity'], event.target.value)}
            >
              <option value="compact">compact</option>
              <option value="comfortable">comfortable</option>
              <option value="spacious">spacious</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
