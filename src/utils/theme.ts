import type {
  HeroSlide,
  StorefrontVisibilitySettings,
  StoreThemeSettings,
  ThemePresetId,
} from '../types/store';

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

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-slide-wheel',
    kind: 'wheel',
    imageUrl: '',
    badgeAr: 'الكل كسبان 🎡',
    titleAr: 'عروض المصمّم الأول الكبرى — أدر العجلة واكسب كود خصمك الفوري!',
    subtitleAr:
      'جوائز مضمونة للجميع: 50 ر.س، خصم 30%، شحن مجاني، أو 100 ر.س خصم فوري — تطبّق تلقائياً في سلة التسوق.',
    ctaLabelAr: 'العب واكسب الآن 🎡',
    actionType: 'wheel',
    active: true,
  },
  {
    id: 'hero-slide-magsafe',
    kind: 'image',
    imageUrl: '/assets/images/promo_tech_essentials_1794729734876.jpg',
    badgeAr: 'خصم حتى 30% على إكسسوارات MagSafe',
    titleAr: 'كفرات الأراميد ومنصات الشحن اللاسلكي الأحدث في الرياض',
    subtitleAr: 'توصيل خلال ساعات + ضمان استبدال سنتين على جميع إكسسوارات الجوال والشواحن.',
    ctaLabelAr: 'تسوق إكسسوارات الهواتف',
    actionType: 'category',
    targetCategoryId: 'cat-accessories',
    active: true,
  },
  {
    id: 'hero-slide-stem',
    kind: 'image',
    imageUrl: '/assets/images/promo_stem_gifts_1794729737354.jpg',
    badgeAr: 'ألعاب STEM الذكية وبوكسات الهدايا',
    titleAr: 'هدية تليق بأحبابك — روبوتات تعليمية وتحف إضاءة عصرية',
    subtitleAr: 'قسّم فاتورتك على 4 دفعات بدون فوائد مع تمارا وتابي أو ادفع عبر Apple Pay ومدى.',
    ctaLabelAr: 'استكشف كل المنتجات',
    actionType: 'catalog',
    active: true,
  },
];

export const DEFAULT_VISIBILITY_SETTINGS: StorefrontVisibilitySettings = {
  showQuickFeatureStrip: true,
  quickFeatureItems: {
    flash: true,
    coupon: true,
    wheel: true,
    shipping: true,
    magsafe: true,
    gifts: true,
  },
  showCircularCategories: true,
  showFlashSales: true,
  showNewArrivalsBanner: true,
  showGiftSeasonBanner: true,
  showCatalogSection: true,
  showAmbassadorSection: true,
};

export function resolveHeroSlides(slides?: HeroSlide[] | null): HeroSlide[] {
  if (!Array.isArray(slides)) return DEFAULT_HERO_SLIDES;
  return slides;
}

export function resolveStoreVisibility(
  visibility?: Partial<StorefrontVisibilitySettings> | null
): StorefrontVisibilitySettings {
  return {
    ...DEFAULT_VISIBILITY_SETTINGS,
    ...(visibility || {}),
    quickFeatureItems: {
      ...DEFAULT_VISIBILITY_SETTINGS.quickFeatureItems,
      ...(visibility?.quickFeatureItems || {}),
    },
  };
}

export const DEFAULT_STORE_SETTINGS: StoreThemeSettings = {
  primaryColor: '#059669',
  secondaryColor: '#FF6B00',
  logoUrl: '',
  themePreset: 'official_green',
  wheelTargetCouponId: '',
  heroSlides: DEFAULT_HERO_SLIDES,
  visibility: DEFAULT_VISIBILITY_SETTINGS,
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
