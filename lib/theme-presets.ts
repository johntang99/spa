import type { ThemeConfig } from '@/lib/types';
import luxuryNavy from '@/data/theme-presets/luxury-navy.json';
import luxuryBurgundy from '@/data/theme-presets/luxury-burgundy.json';
import luxuryCharcoal from '@/data/theme-presets/luxury-charcoal.json';
import warmSage from '@/data/theme-presets/warm-sage.json';
import warmTerracotta from '@/data/theme-presets/warm-terracotta.json';
import boldMidnight from '@/data/theme-presets/bold-midnight.json';
import classicForest from '@/data/theme-presets/classic-forest.json';
import freshOcean from '@/data/theme-presets/fresh-ocean.json';

export type ThemePresetCategory = 'luxury' | 'warm' | 'bold' | 'classic' | 'fresh';

export type ThemePreset = ThemeConfig & {
  shape: { radius: string; shadow: string };
  layout: { heroVariant: string; featureVariant: string; spacingDensity: 'compact' | 'comfortable' | 'spacious' };
  _preset: {
    id: string;
    name: string;
    category: ThemePresetCategory;
    description: string;
  };
};

const PRESET_LIST = [
  luxuryNavy,
  luxuryBurgundy,
  luxuryCharcoal,
  warmSage,
  warmTerracotta,
  boldMidnight,
  classicForest,
  freshOcean,
] as const;

export const THEME_PRESETS: ThemePreset[] = PRESET_LIST.map((preset) => preset as ThemePreset);

export function getPresetsByCategory(): Record<ThemePresetCategory, ThemePreset[]> {
  return THEME_PRESETS.reduce(
    (acc, preset) => {
      acc[preset._preset.category].push(preset);
      return acc;
    },
    {
      luxury: [],
      warm: [],
      bold: [],
      classic: [],
      fresh: [],
    } as Record<ThemePresetCategory, ThemePreset[]>
  );
}

