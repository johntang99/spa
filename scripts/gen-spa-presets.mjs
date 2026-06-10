// Generate the 5 System S preset theme.json files with STRUCTURALLY IDENTICAL keys.
// Token-only overrides (A5 §3): same structure.css, primitives swapped per preset.
// Active preset (jade-hour) is also written to content/spa-paradise/theme.json by 0B.
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'data', 'spa-theme-presets');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Shared, preset-invariant pieces (typography + shape are constant across presets per A5).
const SHARED = {
  shape: { radius: '16px', shadow: '0 8px 28px rgba(30,45,40,0.10)' },
  layout: { heroVariant: 'full-bleed-image', featureVariant: 'grid', spacingDensity: 'comfortable' },
  typography: {
    body: '1.0625rem',
    small: '0.875rem',
    display: 'clamp(2.4rem, 5vw, 4.2rem)',
    heading: 'clamp(1.7rem, 3vw, 2.4rem)',
    subheading: '1.35rem',
    fonts: {
      body: "var(--font-schibsted), 'Noto Sans SC', var(--font-noto-sans-sc), sans-serif",
      small: 'var(--font-schibsted), sans-serif',
      display: "var(--font-marcellus), 'Noto Serif SC', var(--font-noto-serif-sc), serif",
      heading: "var(--font-marcellus), 'Noto Serif SC', var(--font-noto-serif-sc), serif",
      subheading: 'var(--font-schibsted), sans-serif',
    },
  },
  divider: 'ripple-curve',
};

// 15 primitive tokens per preset (identical KEYS, swapped VALUES).
const PRESETS = {
  'jade-hour': {
    name: 'Jade Hour', category: 'luxury',
    description: 'Dusk calm, East-meets-West premium. Porcelain/ink-pine surfaces, candle gold accent.',
    primitives: {
      'ink-pine': '#1E2D28', 'pine-soft': '#2C4138', 'pine-deep': '#16221E',
      'porcelain': '#F7F4EE', 'linen': '#ECE6DC', 'linen-deep': '#E2DACB',
      'candle': '#C9A35C', 'candle-bright': '#D9B873', 'candle-deep': '#A98444',
      'blush-stone': '#C98D7B', 'mist': '#9FB0A9', 'mist-strong': '#7E948B',
      'char': '#23211D', 'char-soft': '#4A463E', 'white': '#FFFFFF',
    },
  },
  'porcelain-blush': {
    name: 'Porcelain Blush', category: 'warm',
    description: 'Bright, feminine day-spa. Warm white / deep taupe surfaces, clay rose accent, soft gold secondary.',
    primitives: {
      'ink-pine': '#4A3F3A', 'pine-soft': '#5C4F49', 'pine-deep': '#3A312D',
      'porcelain': '#FBF7F4', 'linen': '#F2E9E3', 'linen-deep': '#E8DAD1',
      'candle': '#BE7C6B', 'candle-bright': '#D29A8A', 'candle-deep': '#9E5F50',
      'blush-stone': '#D8B877', 'mist': '#B3A8A0', 'mist-strong': '#94877E',
      'char': '#2E2723', 'char-soft': '#5A4F49', 'white': '#FFFFFF',
    },
  },
  'onsen-charcoal': {
    name: 'Onsen Charcoal', category: 'bold',
    description: 'Modern, quiet, unisex. Paper grey / warm charcoal surfaces, cypress green accent, brushed brass secondary.',
    primitives: {
      'ink-pine': '#2B2A28', 'pine-soft': '#3C3A37', 'pine-deep': '#1F1E1C',
      'porcelain': '#F2F1ED', 'linen': '#E6E4DE', 'linen-deep': '#D8D5CD',
      'candle': '#5C7363', 'candle-bright': '#738C7B', 'candle-deep': '#46594E',
      'blush-stone': '#B79867', 'mist': '#A6A8A2', 'mist-strong': '#82847E',
      'char': '#232220', 'char-soft': '#4C4A45', 'white': '#FFFFFF',
    },
  },
  'lotus-vermilion': {
    name: 'Lotus Vermilion', category: 'bold',
    description: 'Chinese-forward, festive-premium. Rice cream / lacquer ink surfaces, vermilion accent, antique gold secondary.',
    primitives: {
      'ink-pine': '#1C1A18', 'pine-soft': '#2E2A26', 'pine-deep': '#141210',
      'porcelain': '#F8F3E9', 'linen': '#EFE6D4', 'linen-deep': '#E4D8C0',
      'candle': '#C8462E', 'candle-bright': '#DC5C42', 'candle-deep': '#A6371F',
      'blush-stone': '#C49A4E', 'mist': '#A8A096', 'mist-strong': '#877F74',
      'char': '#221E1A', 'char-soft': '#4E473E', 'white': '#FFFFFF',
    },
  },
  'coastal-sage': {
    name: 'Coastal Sage', category: 'classic',
    description: 'Familiar, conservative spa-calm. Sand / driftwood brown surfaces, sage accent, seafoam secondary.',
    primitives: {
      'ink-pine': '#3E3A31', 'pine-soft': '#504B41', 'pine-deep': '#302D26',
      'porcelain': '#F5F1E8', 'linen': '#EBE4D6', 'linen-deep': '#DFD6C4',
      'candle': '#7C8E6B', 'candle-bright': '#94A684', 'candle-deep': '#617152',
      'blush-stone': '#9FC4BC', 'mist': '#ABA89C', 'mist-strong': '#87847A',
      'char': '#2A2823', 'char-soft': '#524E45', 'white': '#FFFFFF',
    },
  },
};

function buildPreset(id, spec) {
  const p = spec.primitives;
  // Legacy colors block (kept so non-System-S components reskin too):
  // primary = dark immersion surface, secondary = accent, backdrop = light surfaces.
  return {
    _preset: { id, name: spec.name, category: spec.category, description: spec.description },
    shape: SHARED.shape,
    colors: {
      primary: { '50': p['linen'], '100': p['linen-deep'], dark: p['pine-deep'], light: p['pine-soft'], DEFAULT: p['ink-pine'] },
      secondary: { '50': p['linen-deep'], dark: p['candle-deep'], light: p['candle-bright'], DEFAULT: p['candle'] },
      backdrop: { primary: p['porcelain'], secondary: p['linen'] },
    },
    layout: SHARED.layout,
    typography: SHARED.typography,
    tokens: { divider: SHARED.divider, primitives: p },
  };
}

const written = [];
for (const [id, spec] of Object.entries(PRESETS)) {
  const preset = buildPreset(id, spec);
  fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify(preset, null, 2) + '\n');
  written.push(id);
}

// Key-parity assertion: every preset must have identical key signature.
function keySig(obj) {
  if (Array.isArray(obj)) return '[]';
  if (obj && typeof obj === 'object') {
    return '{' + Object.keys(obj).sort().map((k) => `${k}:${keySig(obj[k])}`).join(',') + '}';
  }
  return '*';
}
const sigs = written.map((id) => keySig(JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${id}.json`), 'utf-8'))));
const allMatch = sigs.every((s) => s === sigs[0]);

console.log(`Wrote ${written.length} presets to data/spa-theme-presets/: ${written.join(', ')}`);
console.log(`Key-parity across all 5 presets: ${allMatch ? 'IDENTICAL ✓' : 'MISMATCH ✗'}`);
if (!allMatch) process.exit(1);
