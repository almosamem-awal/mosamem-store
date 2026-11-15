import type { StoreThemeSettings, ThemePresetId } from '../types/store';

export interface ThemePresetDefinition {
  id: Exclude<ThemePresetId, 'custom'>;
  labelAr: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  descriptionAr: string;
}

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'official_green',
    labelAr: 'المصمم الأول (الأخضر المعتمد)',
    emoji: '🟢',
    primaryColor: '#059669',
    secondaryColor: '#FF6B00',
    descriptionAr: 'الهوية الرسمية لمتجر المصمم الأول: أخضر زمردي + برتقالي العروض',
  },
  {
    id: 'jumia_classic',
    labelAr: 'جوميا كلاسيك (البرتقالي الصريح)',
    emoji: '🟠',
    primaryColor: '#F68B1E',
    secondaryColor: '#0F172A',
    descriptionAr: 'مظهر الأسواق الكبرى الكلاسيكي بالبرتقالي الصريح والأوبسيديان',
  },
  {
    id: 'tech_blue',
    labelAr: 'أزرق تكنولوجي',
    emoji: '🔵',
    primaryColor: '#2563EB',
    secondaryColor: '#00FF87',
    descriptionAr: 'طابع تقني عصري للأجهزة الذكية وإكسسوارات الجيل الجديد',
  },
  {
    id: 'royal_luxury',
    labelAr: 'فخامة ملكية',
    emoji: '✨',
    primaryColor: '#0B0F19',
    secondaryColor: '#D4AF37',
    descriptionAr: 'أناقة تنفيذية فاخرة باللون الكربوني الداكن والذهب الملكي',
  },
];

export const DEFAULT_STORE_SETTINGS: StoreThemeSettings = {
  primaryColor: '#059669',
  secondaryColor: '#FF6B00',
  logoUrl: '',
  themePreset: 'official_green',
};

/**
 * Validates and normalizes a HEX color string to #RRGGBB format.
 * Falls back to provided default hex if invalid.
 */
export function normalizeHexColor(input: string, fallback = '#059669'): string {
  const cleaned = input.trim();
  const shortMatch = /^#?([0-9a-fA-F]{3})$/.exec(cleaned);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const fullMatch = /^#?([0-9a-fA-F]{6})$/.exec(cleaned);
  if (fullMatch) {
    return `#${fullMatch[1]}`.toUpperCase();
  }
  return fallback.toUpperCase();
}

export function hexToRgba(hexInput: string, alpha: number): string {
  const hex = normalizeHexColor(hexInput, '#059669').slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

/**
 * Determines accessible contrasting foreground (#FFFFFF or #0F172A) for any dynamic HEX color.
 */
export function getContrastTextColor(hexInput: string): '#FFFFFF' | '#0F172A' {
  const hex = normalizeHexColor(hexInput, '#059669').slice(1);
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.48 ? '#0F172A' : '#FFFFFF';
}

export function detectMatchingPreset(
  primaryColor: string,
  secondaryColor: string
): ThemePresetId {
  const p = normalizeHexColor(primaryColor, DEFAULT_STORE_SETTINGS.primaryColor);
  const s = normalizeHexColor(secondaryColor, DEFAULT_STORE_SETTINGS.secondaryColor);
  const match = THEME_PRESETS.find(
    (preset) =>
      normalizeHexColor(preset.primaryColor) === p &&
      normalizeHexColor(preset.secondaryColor) === s
  );
  return match ? match.id : 'custom';
}

export function buildThemeCssVariables(settings: StoreThemeSettings): Record<string, string> {
  const primary = normalizeHexColor(settings.primaryColor, DEFAULT_STORE_SETTINGS.primaryColor);
  const secondary = normalizeHexColor(
    settings.secondaryColor,
    DEFAULT_STORE_SETTINGS.secondaryColor
  );

  return {
    '--color-primary': primary,
    '--color-primary-contrast': getContrastTextColor(primary),
    '--color-primary-soft': hexToRgba(primary, 0.1),
    '--color-primary-border': hexToRgba(primary, 0.35),
    '--color-secondary': secondary,
    '--color-secondary-contrast': getContrastTextColor(secondary),
    '--color-secondary-soft': hexToRgba(secondary, 0.12),
  };
}
