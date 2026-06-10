# BAAM Theme Preset System — Implementation Plan

## Overview

Extend the existing `theme.json` editor in Site Settings to support:
1. A **Preset Library** — one-click apply pre-built themes
2. A **Form Editor** — tweak individual values visually
3. A **JSON Editor** — raw edit (already exists)

Each site always owns its own `theme.json`. Presets are copied, not linked.

---

## Architecture

```
/data
  /theme-presets
    luxury-navy.json
    luxury-burgundy.json
    luxury-charcoal.json
    warm-sage.json
    warm-terracotta.json
    bold-midnight.json
    classic-forest.json
    fresh-ocean.json

/sites
  /[site-slug]
    /settings
      theme.json              ← active theme for this site
```

---

## Phase 1 — Create Preset JSON Files

Create the folder `/data/theme-presets/` and add the following files.

Each file follows the EXACT same structure as the current `theme.json`, with two additional sections: `shape` and `layout`.

---

### Updated theme.json Schema

```json
{
  "colors": {
    "primary": {
      "50": "",
      "100": "",
      "light": "",
      "DEFAULT": "",
      "dark": ""
    },
    "secondary": {
      "50": "",
      "light": "",
      "DEFAULT": "",
      "dark": ""
    },
    "backdrop": {
      "primary": "",
      "secondary": ""
    }
  },
  "typography": {
    "fonts": {
      "display": "",
      "heading": "",
      "subheading": "",
      "body": "",
      "small": ""
    },
    "sizes": {
      "display": "3rem",
      "heading": "2.25rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "8px",
    "shadow": "0 4px 20px rgba(0,0,0,0.08)"
  },
  "layout": {
    "heroVariant": "split",
    "featureVariant": "grid",
    "spacingDensity": "comfortable"
  },
  "_preset": {
    "id": "preset-id",
    "name": "Preset Display Name",
    "category": "luxury | warm | bold | classic | fresh",
    "description": "One line description"
  }
}
```

---

### Preset Files to Create

#### `/data/theme-presets/luxury-navy.json`
```json
{
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "100": "#dbeafe",
      "light": "#93c5fd",
      "DEFAULT": "#1e3a8a",
      "dark": "#1e2d6e"
    },
    "secondary": {
      "50": "#fef2f2",
      "light": "#fca5a5",
      "DEFAULT": "#dc2626",
      "dark": "#b91c1c"
    },
    "backdrop": {
      "primary": "#f8faff",
      "secondary": "#fef2f2"
    }
  },
  "typography": {
    "fonts": {
      "display": "Cormorant Garamond, Georgia, serif",
      "heading": "Cormorant Garamond, Georgia, serif",
      "subheading": "Inter, system-ui, sans-serif",
      "body": "Inter, system-ui, sans-serif",
      "small": "Inter, system-ui, sans-serif"
    },
    "sizes": {
      "display": "3.5rem",
      "heading": "2.5rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "2px",
    "shadow": "0 8px 40px rgba(0,0,0,0.12)"
  },
  "layout": {
    "heroVariant": "fullbleed",
    "featureVariant": "alternating",
    "spacingDensity": "spacious"
  },
  "_preset": {
    "id": "luxury-navy",
    "name": "Luxury Navy",
    "category": "luxury",
    "description": "Deep navy with sharp edges and elegant serif typography"
  }
}
```

#### `/data/theme-presets/luxury-burgundy.json`
```json
{
  "colors": {
    "primary": {
      "50": "#fdf2f4",
      "100": "#fce7ea",
      "light": "#e88a99",
      "DEFAULT": "#7f1d1d",
      "dark": "#5c1414"
    },
    "secondary": {
      "50": "#fefce8",
      "light": "#fde047",
      "DEFAULT": "#ca8a04",
      "dark": "#a16207"
    },
    "backdrop": {
      "primary": "#fdf8f8",
      "secondary": "#fefce8"
    }
  },
  "typography": {
    "fonts": {
      "display": "Playfair Display, Georgia, serif",
      "heading": "Playfair Display, Georgia, serif",
      "subheading": "Lato, system-ui, sans-serif",
      "body": "Lato, system-ui, sans-serif",
      "small": "Lato, system-ui, sans-serif"
    },
    "sizes": {
      "display": "3.5rem",
      "heading": "2.5rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "0px",
    "shadow": "none"
  },
  "layout": {
    "heroVariant": "split",
    "featureVariant": "grid",
    "spacingDensity": "spacious"
  },
  "_preset": {
    "id": "luxury-burgundy",
    "name": "Luxury Burgundy",
    "category": "luxury",
    "description": "Rich burgundy with flat design and classic Playfair typography"
  }
}
```

#### `/data/theme-presets/luxury-charcoal.json`
```json
{
  "colors": {
    "primary": {
      "50": "#f8f8f8",
      "100": "#f0f0f0",
      "light": "#9ca3af",
      "DEFAULT": "#1c1917",
      "dark": "#0c0a09"
    },
    "secondary": {
      "50": "#f0f9ff",
      "light": "#7dd3fc",
      "DEFAULT": "#0ea5e9",
      "dark": "#0369a1"
    },
    "backdrop": {
      "primary": "#fafafa",
      "secondary": "#f0f9ff"
    }
  },
  "typography": {
    "fonts": {
      "display": "EB Garamond, Georgia, serif",
      "heading": "EB Garamond, Georgia, serif",
      "subheading": "DM Sans, system-ui, sans-serif",
      "body": "DM Sans, system-ui, sans-serif",
      "small": "DM Sans, system-ui, sans-serif"
    },
    "sizes": {
      "display": "4rem",
      "heading": "2.75rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "4px",
    "shadow": "0 2px 8px rgba(0,0,0,0.06)"
  },
  "layout": {
    "heroVariant": "centered",
    "featureVariant": "masonry",
    "spacingDensity": "spacious"
  },
  "_preset": {
    "id": "luxury-charcoal",
    "name": "Luxury Charcoal",
    "category": "luxury",
    "description": "Near-black with sky blue accent and dramatic heading scale"
  }
}
```

#### `/data/theme-presets/warm-sage.json`
```json
{
  "colors": {
    "primary": {
      "50": "#f1f8f1",
      "100": "#dcf0dc",
      "light": "#86c986",
      "DEFAULT": "#4d7c0f",
      "dark": "#365708"
    },
    "secondary": {
      "50": "#fffbeb",
      "light": "#fcd34d",
      "DEFAULT": "#b45309",
      "dark": "#8c4009"
    },
    "backdrop": {
      "primary": "#f6fbf0",
      "secondary": "#fffbeb"
    }
  },
  "typography": {
    "fonts": {
      "display": "Nunito, system-ui, sans-serif",
      "heading": "Nunito, system-ui, sans-serif",
      "subheading": "Nunito, system-ui, sans-serif",
      "body": "Open Sans, system-ui, sans-serif",
      "small": "Open Sans, system-ui, sans-serif"
    },
    "sizes": {
      "display": "3rem",
      "heading": "2.25rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "12px",
    "shadow": "0 4px 16px rgba(77,124,15,0.1)"
  },
  "layout": {
    "heroVariant": "split",
    "featureVariant": "grid",
    "spacingDensity": "comfortable"
  },
  "_preset": {
    "id": "warm-sage",
    "name": "Warm Sage",
    "category": "warm",
    "description": "Earthy green with rounded corners and friendly rounded typography"
  }
}
```

#### `/data/theme-presets/warm-terracotta.json`
```json
{
  "colors": {
    "primary": {
      "50": "#fef3ee",
      "100": "#fde3d1",
      "light": "#f4a57a",
      "DEFAULT": "#c2510f",
      "dark": "#9a3d08"
    },
    "secondary": {
      "50": "#fdf4ff",
      "light": "#e879f9",
      "DEFAULT": "#a21caf",
      "dark": "#701a75"
    },
    "backdrop": {
      "primary": "#fff8f4",
      "secondary": "#fdf4ff"
    }
  },
  "typography": {
    "fonts": {
      "display": "Merriweather, Georgia, serif",
      "heading": "Merriweather, Georgia, serif",
      "subheading": "Source Sans Pro, system-ui, sans-serif",
      "body": "Source Sans Pro, system-ui, sans-serif",
      "small": "Source Sans Pro, system-ui, sans-serif"
    },
    "sizes": {
      "display": "3rem",
      "heading": "2.25rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "8px",
    "shadow": "0 4px 20px rgba(194,81,15,0.1)"
  },
  "layout": {
    "heroVariant": "fullbleed",
    "featureVariant": "alternating",
    "spacingDensity": "comfortable"
  },
  "_preset": {
    "id": "warm-terracotta",
    "name": "Warm Terracotta",
    "category": "warm",
    "description": "Earthy orange with warm serif headings, inviting and local feel"
  }
}
```

#### `/data/theme-presets/bold-midnight.json`
```json
{
  "colors": {
    "primary": {
      "50": "#f0fdf4",
      "100": "#dcfce7",
      "light": "#4ade80",
      "DEFAULT": "#15803d",
      "dark": "#0f5f2d"
    },
    "secondary": {
      "50": "#fdf4ff",
      "light": "#c084fc",
      "DEFAULT": "#7c3aed",
      "dark": "#5b21b6"
    },
    "backdrop": {
      "primary": "#0f172a",
      "secondary": "#1e293b"
    }
  },
  "typography": {
    "fonts": {
      "display": "Syne, system-ui, sans-serif",
      "heading": "Syne, system-ui, sans-serif",
      "subheading": "Manrope, system-ui, sans-serif",
      "body": "Manrope, system-ui, sans-serif",
      "small": "Manrope, system-ui, sans-serif"
    },
    "sizes": {
      "display": "4rem",
      "heading": "2.75rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "4px",
    "shadow": "0 0 30px rgba(21,128,61,0.2)"
  },
  "layout": {
    "heroVariant": "fullbleed",
    "featureVariant": "masonry",
    "spacingDensity": "spacious"
  },
  "_preset": {
    "id": "bold-midnight",
    "name": "Bold Midnight",
    "category": "bold",
    "description": "Dark backgrounds with neon green accent, modern agency feel"
  }
}
```

#### `/data/theme-presets/classic-forest.json`
```json
{
  "colors": {
    "primary": {
      "50": "#f0fdf4",
      "100": "#dcfce7",
      "light": "#6ee7b7",
      "DEFAULT": "#059669",
      "dark": "#065f46"
    },
    "secondary": {
      "50": "#fef9c3",
      "light": "#fde047",
      "DEFAULT": "#854d0e",
      "dark": "#5c3708"
    },
    "backdrop": {
      "primary": "#f6fef9",
      "secondary": "#fef9c3"
    }
  },
  "typography": {
    "fonts": {
      "display": "Georgia, Times New Roman, serif",
      "heading": "Georgia, Times New Roman, serif",
      "subheading": "Arial, Helvetica Neue, sans-serif",
      "body": "Arial, Helvetica Neue, sans-serif",
      "small": "Arial, Helvetica Neue, sans-serif"
    },
    "sizes": {
      "display": "3rem",
      "heading": "2.25rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "6px",
    "shadow": "0 2px 12px rgba(5,150,105,0.08)"
  },
  "layout": {
    "heroVariant": "split",
    "featureVariant": "grid",
    "spacingDensity": "comfortable"
  },
  "_preset": {
    "id": "classic-forest",
    "name": "Classic Forest",
    "category": "classic",
    "description": "Timeless forest green with traditional serif headings, professional"
  }
}
```

#### `/data/theme-presets/fresh-ocean.json`
```json
{
  "colors": {
    "primary": {
      "50": "#f0f9ff",
      "100": "#e0f2fe",
      "light": "#7dd3fc",
      "DEFAULT": "#0369a1",
      "dark": "#075985"
    },
    "secondary": {
      "50": "#fff7ed",
      "light": "#fdba74",
      "DEFAULT": "#ea580c",
      "dark": "#c2410c"
    },
    "backdrop": {
      "primary": "#f0f9ff",
      "secondary": "#fff7ed"
    }
  },
  "typography": {
    "fonts": {
      "display": "Poppins, system-ui, sans-serif",
      "heading": "Poppins, system-ui, sans-serif",
      "subheading": "Poppins, system-ui, sans-serif",
      "body": "Inter, system-ui, sans-serif",
      "small": "Inter, system-ui, sans-serif"
    },
    "sizes": {
      "display": "3rem",
      "heading": "2.25rem",
      "subheading": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "shape": {
    "radius": "10px",
    "shadow": "0 4px 20px rgba(3,105,161,0.1)"
  },
  "layout": {
    "heroVariant": "split",
    "featureVariant": "grid",
    "spacingDensity": "comfortable"
  },
  "_preset": {
    "id": "fresh-ocean",
    "name": "Fresh Ocean",
    "category": "fresh",
    "description": "Clean ocean blue with Poppins, modern and approachable"
  }
}
```

---

## Phase 2 — Create Preset Loader Utility

Create file: `/lib/theme-presets.ts`

```typescript
import luxuryNavy from '@/data/theme-presets/luxury-navy.json'
import luxuryBurgundy from '@/data/theme-presets/luxury-burgundy.json'
import luxuryCharcoal from '@/data/theme-presets/luxury-charcoal.json'
import warmSage from '@/data/theme-presets/warm-sage.json'
import warmTerracotta from '@/data/theme-presets/warm-terracotta.json'
import boldMidnight from '@/data/theme-presets/bold-midnight.json'
import classicForest from '@/data/theme-presets/classic-forest.json'
import freshOcean from '@/data/theme-presets/fresh-ocean.json'

export const THEME_PRESETS = [
  luxuryNavy,
  luxuryBurgundy,
  luxuryCharcoal,
  warmSage,
  warmTerracotta,
  boldMidnight,
  classicForest,
  freshOcean,
]

export type ThemePreset = typeof luxuryNavy

export function getPresetsByCategory() {
  return THEME_PRESETS.reduce((acc, preset) => {
    const cat = preset._preset.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(preset)
    return acc
  }, {} as Record<string, ThemePreset[]>)
}
```

---

## Phase 3 — Update Theme Editor UI

### File to edit: wherever your current Theme tab renders

The Theme section currently shows 3 tabs: `Form | JSON`

**Change to:** `Presets | Form | JSON`

---

### New Component: `ThemePresetsTab.tsx`

Create file: `/components/admin/ThemePresetsTab.tsx`

```tsx
'use client'

import { useState } from 'react'
import { THEME_PRESETS, getPresetsByCategory, ThemePreset } from '@/lib/theme-presets'

interface Props {
  currentTheme: any
  onApply: (preset: ThemePreset) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  luxury: 'Luxury',
  warm: 'Warm & Local',
  bold: 'Bold & Modern',
  classic: 'Classic & Professional',
  fresh: 'Fresh & Clean',
}

export default function ThemePresetsTab({ currentTheme, onApply }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    currentTheme?._preset?.id ?? null
  )
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const presetsByCategory = getPresetsByCategory()

  function handleApplyClick(preset: ThemePreset) {
    // If there's unsaved custom work, confirm first
    setConfirmId(preset._preset.id)
  }

  function handleConfirmApply(preset: ThemePreset) {
    setSelectedId(preset._preset.id)
    setConfirmId(null)
    onApply(preset)
  }

  return (
    <div className="space-y-8 py-4">
      {Object.entries(presetsByCategory).map(([category, presets]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {CATEGORY_LABELS[category] ?? category}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => {
              const isActive = selectedId === preset._preset.id
              const isConfirming = confirmId === preset._preset.id

              return (
                <div
                  key={preset._preset.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${isActive
                      ? 'border-2 border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                    }
                  `}
                  onClick={() => !isActive && handleApplyClick(preset)}
                >
                  {/* Color swatches */}
                  <div className="flex gap-1.5 mb-3">
                    <div
                      className="w-8 h-8 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: preset.colors.primary.DEFAULT }}
                    />
                    <div
                      className="w-8 h-8 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: preset.colors.secondary.DEFAULT }}
                    />
                    <div
                      className="w-8 h-8 rounded-full border border-gray-200"
                      style={{ backgroundColor: preset.colors.backdrop.primary }}
                    />
                  </div>

                  {/* Preview text */}
                  <div className="mb-2">
                    <p
                      className="font-semibold text-sm text-gray-900"
                      style={{ fontFamily: preset.typography.fonts.heading }}
                    >
                      {preset._preset.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {preset._preset.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      r: {preset.shape.radius}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {preset.layout.heroVariant}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {preset.layout.spacingDensity}
                    </span>
                  </div>

                  {/* Action */}
                  {isActive ? (
                    <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      ✓ Currently Applied
                    </div>
                  ) : isConfirming ? (
                    <div className="flex gap-2">
                      <button
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded font-semibold"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConfirmApply(preset)
                        }}
                      >
                        Confirm Apply
                      </button>
                      <button
                        className="text-xs text-gray-500 px-2 py-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmId(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="text-xs text-blue-600 font-semibold hover:underline">
                      Apply Preset →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Phase 4 — Wire Into Existing Theme Editor

### In your existing Theme editor component (wherever Form/JSON tabs are):

**Step 1:** Import the new component
```tsx
import ThemePresetsTab from '@/components/admin/ThemePresetsTab'
```

**Step 2:** Add 'presets' to tab state
```tsx
const [activeTab, setActiveTab] = useState<'presets' | 'form' | 'json'>('presets')
```

**Step 3:** Add Presets tab button (alongside existing Form/JSON buttons)
```tsx
<button
  onClick={() => setActiveTab('presets')}
  className={activeTab === 'presets' ? 'tab-active' : 'tab-inactive'}
>
  Presets
</button>
```

**Step 4:** Add Presets tab panel
```tsx
{activeTab === 'presets' && (
  <ThemePresetsTab
    currentTheme={themeData}
    onApply={(preset) => {
      setThemeData(preset)      // update local state
      saveThemeJson(preset)     // save to site's theme.json
    }}
  />
)}
```

---

## Phase 5 — Update globals.css to Read New Shape/Layout Variables

### In `/app/globals.css`, add to `:root`:

```css
:root {
  /* existing color + typography variables ... */

  /* Shape — controlled by theme.json */
  --radius-base: 8px;
  --shadow-base: 0 4px 20px rgba(0,0,0,0.08);

  /* Layout density — controlled by theme.json */
  --section-padding-y: 5rem;   /* comfortable default */
}
```

### In your theme loader (wherever you inject CSS variables from theme.json), add:

```typescript
// shape
document.documentElement.style.setProperty('--radius-base', theme.shape.radius)
document.documentElement.style.setProperty('--shadow-base', theme.shape.shadow)

// spacing density
const densityMap = {
  compact: '3rem',
  comfortable: '5rem',
  spacious: '8rem',
}
document.documentElement.style.setProperty(
  '--section-padding-y',
  densityMap[theme.layout.spacingDensity]
)
```

---

## Phase 6 — Use New Variables in Components

Update components to use the new tokens instead of hardcoded values:

```tsx
// Before
<div className="rounded-lg shadow-md">

// After  
<div style={{ borderRadius: 'var(--radius-base)', boxShadow: 'var(--shadow-base)' }}>
```

```tsx
// Before
<section className="py-20">

// After
<section style={{ paddingTop: 'var(--section-padding-y)', paddingBottom: 'var(--section-padding-y)' }}>
```

---

## Summary of Files to Create / Edit

| Action | File |
|--------|------|
| CREATE | `/data/theme-presets/luxury-navy.json` |
| CREATE | `/data/theme-presets/luxury-burgundy.json` |
| CREATE | `/data/theme-presets/luxury-charcoal.json` |
| CREATE | `/data/theme-presets/warm-sage.json` |
| CREATE | `/data/theme-presets/warm-terracotta.json` |
| CREATE | `/data/theme-presets/bold-midnight.json` |
| CREATE | `/data/theme-presets/classic-forest.json` |
| CREATE | `/data/theme-presets/fresh-ocean.json` |
| CREATE | `/lib/theme-presets.ts` |
| CREATE | `/components/admin/ThemePresetsTab.tsx` |
| EDIT   | Theme editor component — add Presets tab |
| EDIT   | `/app/globals.css` — add shape + layout variables |
| EDIT   | Theme CSS variable injector — add shape + density |
| EDIT   | Shared components — use `--radius-base`, `--shadow-base`, `--section-padding-y` |

---

## End Result

```
Site owner or editor opens Admin → Site Settings → Theme

[Presets]  [Form]  [JSON]

Luxury
  [Luxury Navy]    [Luxury Burgundy]    [Luxury Charcoal]

Warm & Local
  [Warm Sage]      [Warm Terracotta]

Bold & Modern
  [Bold Midnight]

Classic & Professional
  [Classic Forest]

Fresh & Clean
  [Fresh Ocean]

→ Click any preset → Confirm Apply
→ Theme JSON is replaced with preset
→ Editor can then go to Form tab to tweak colors/fonts for this client
→ Saved as site's own theme.json (preset is a copy, not a link)
```

**Total distinct looks from one codebase:**
- 8 presets × industry color customization × Form tweaks = hundreds of unique sites ✅
