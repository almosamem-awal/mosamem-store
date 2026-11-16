import React, { useEffect, useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Share2,
  Check,
  Plus,
  Clock,
  ArrowLeft,
  Sparkles,
  Tag,
} from 'lucide-react';
import type { Category, Product } from '../types/store';
import {
  computeStockUrgencyPercent,
  formatFlashCountdown,
  formatSAR,
  getEffectiveProductPrice,
  getFlashSaleProducts,
} from '../utils/commerce';
import { getFallbackProductArt } from '../data/seedData';
import { HeroSection } from '../components/HeroSection';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import type { MarketplaceQuickFilter } from '../components/Navbar';

interface StorefrontPageProps {
  products: Product[];
  categories: Category[];
  referralCode: string | null;
  logoUrl?: string;
  wishlistIds: string[];
  searchQuery: string;
  selectedCategoryId: string;
  specialFilter: MarketplaceQuickFilter;
  onSearchChange: (q: string) => void;
  onSelectCategory: (catId: string) => void;
  onSelectSpecialFilter: (filter: MarketplaceQuickFilter) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onApplyCouponCode: (code: string) => void;
  onOpenWheel: () => void;
  onOpenPolicy: () => void;
}

export const StorefrontPage: React.FC<StorefrontPageProps> = ({
  products,
  categories,
  referralCode,
  logoUrl,
  wishlistIds,
  searchQuery,
  selectedCategoryId,
  specialFilter,
  onSearchChange,
  onSelectCategory,
  onSelectSpecialFilter,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
  onApplyCouponCode,
  onOpenWheel,
  onOpenPolicy,
}) => {
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<'featured' | 'top_rated' | 'price_asc' | 'price_desc'>(
    'featured'
  );
  const [copiedRef, setCopiedRef] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  // Live Flash Sales ticking countdown initialized at 02:45:18
  const [flashSecondsRemaining, setFlashSecondsRemaining] = useState(2 * 3600 + 45 * 60 + 18);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFlashSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 2 * 3600 + 45 * 60 + 18));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const countdown = useMemo(
    () => formatFlashCountdown(flashSecondsRemaining),
    [flashSecondsRemaining]
  );

  const flashSaleProducts = useMemo(
    () => getFlashSaleProducts(products, categories, 10),
    [products, categories]
  );

  const circularCategories = useMemo(() => {
    const pickImg = (id: string, fallbackIdx: number) =>
      products.find((p) => p.id === id)?.images[0] || products[fallbackIdx]?.images[0] || '';

    return [
      {
        id: 'bubble-phone',
        titleAr: 'إكسسوارات الهواتف',
        image: pickImg('prod-01', 0),
        sku: 'AMA-PA-001',
        categoryId: 'cat-accessories',
        special: 'all' as MarketplaceQuickFilter,
      },
      {
        id: 'bubble-magsafe',
        titleAr: 'شواحن MagSafe',
        image: pickImg('prod-08', 7),
        sku: 'AMA-PA-008',
        categoryId: 'cat-accessories',
        special: 'magsafe' as MarketplaceQuickFilter,
      },
      {
        id: 'bubble-audio',
        titleAr: 'سماعات عازلة',
        image: pickImg('prod-10', 9),
        sku: 'AMA-PA-010',
        categoryId: 'cat-accessories',
        special: 'all' as MarketplaceQuickFilter,
      },
      {
        id: 'bubble-car',
        titleAr: 'شواحن السيارة',
        image: pickImg('prod-04', 3),
        sku: 'AMA-PA-004',
        categoryId: 'cat-accessories',
        special: 'all' as MarketplaceQuickFilter,
      },
      {
        id: 'bubble-robots',
        titleAr: 'روبوتات ذكية',
        image: pickImg('prod-21', 20),
        sku: 'AMA-ST-021',
        categoryId: 'cat-stem',
        special: 'all' as MarketplaceQuickFilter,
      },
      {
        id: 'bubble-drones',
        titleAr: 'طائرات درون',
        image: pickImg('prod-22', 21),
        sku: 'AMA-ST-022',
        categoryId: 'cat-stem',
        special: 'all' as MarketplaceQuickFilter,
      },
      {
        id: 'bubble-lights',
        titleAr: 'إضاءات محيطية',
        image: pickImg('prod-36', 35),
        sku: 'AMA-LX-036',
        categoryId: 'cat-luxury',
        special: 'all' as MarketplaceQuickFilter,
      },
      {
        id: 'bubble-gifts',
        titleAr: 'بوكسات الهدايا',
        image: pickImg('prod-47', 46),
        sku: 'AMA-LX-047',
        categoryId: 'cat-luxury',
        special: 'all' as MarketplaceQuickFilter,
      },
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) {
        return false;
      }
      const pricing = getEffectiveProductPrice(p, categories);
      if (pricing.effectivePrice > maxPrice) {
        return false;
      }
      if (specialFilter === 'flash' && !pricing.hasDiscount) {
        return false;
      }
      if (
        specialFilter === 'magsafe' &&
        !p.tags.some((t) => t.toLowerCase().includes('magsafe')) &&
        !p.nameAr.toLowerCase().includes('magsafe')
      ) {
        return false;
      }
      if (specialFilter === 'top_rated' && p.rating < 4.8) {
        return false;
      }
      if (!q) return true;
      return (
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.descriptionAr.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'price_asc') {
      return [...list].sort(
        (a, b) =>
          getEffectiveProductPrice(a, categories).effectivePrice -
          getEffectiveProductPrice(b, categories).effectivePrice
      );
    }
    if (sortBy === 'price_desc') {
      return [...list].sort(
        (a, b) =>
          getEffectiveProductPrice(b, categories).effectivePrice -
          getEffectiveProductPrice(a, categories).effectivePrice
      );
    }
    if (sortBy === 'top_rated' || specialFilter === 'top_rated') {
      return [...list].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    }
    return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [products, categories, selectedCategoryId, specialFilter, maxPrice, searchQuery, sortBy]);

  const jumpToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const jumpToFlashSales = () => {
    document.getElementById('flash-sales-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const activateCouponBanner = async (code: string, label: string) => {
    onApplyCouponCode(code);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore clipboard restriction
    }
    setCouponFeedback(`تم تفعيل ونسخ كود الخصم ${code} (${label}) تلقائياً على سلة التسوق!`);
    window.setTimeout(() => setCouponFeedback(null), 5000);
  };

  const handleCopyAffiliateLink = async () => {
    const shareUrl = `${window.location.origin}/?ref=RIYADH5`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ignore
    }
    setCopiedRef(true);
    window.setTimeout(() => setCopiedRef(false), 2500);
  };

  const quickFeatureCards = [
    {
      id: 'qf-flash',
      icon: '⚡',
      title: 'فلاش سيل',
      subtitle: 'لفترة محدودة',
      onClick: jumpToFlashSales,
    },
    {
      id: 'qf-coupon',
      icon: '🎫',
      title: 'كوبون حصري',
      subtitle: 'خصم إضافي',
      onClick: () => {
        void activateCouponBanner('RIYADH10', 'خصم إضافي 10%');
        jumpToCatalog();
      },
    },
    {
      id: 'qf-wheel',
      icon: '🎡',
      title: 'العب واكسب',
      subtitle: 'عجلة الحظ',
      onClick: onOpenWheel,
    },
    {
      id: 'qf-shipping',
      icon: '🚚',
      title: 'شحن مجاني',
      subtitle: 'للطلبات المؤهلة',
      onClick: onOpenPolicy,
    },
    {
      id: 'qf-magsafe',
      icon: '📱',
      title: 'إكسسوارات MagSafe',
      subtitle: 'تثبيت مغناطيسي',
      onClick: () => {
        onSelectCategory('cat-accessories');
        onSelectSpecialFilter('magsafe');
        jumpToCatalog();
      },
    },
    {
      id: 'qf-gifts',
      icon: '🎁',
      title: 'بوكسات الهدايا',
      subtitle: 'تغليف فاخر بالرياض',
      onClick: () => {
        onSelectCategory('cat-luxury');
        onSelectSpecialFilter('all');
        jumpToCatalog();
      },
    },
  ];

  return (
    <div className="bg-[#F8F9FA] text-[#1E293B] space-y-5 pb-10">
      {/* 1. Hero Carousel with Official Green & Temu/Jumia Spin Wheel */}
      <HeroSection
        onExploreCatalog={jumpToCatalog}
        onJumpToFlashSales={jumpToFlashSales}
        onSelectCategory={(catId) => {
          onSelectCategory(catId);
          onSelectSpecialFilter('all');
          jumpToCatalog();
        }}
        onOpenWheel={onOpenWheel}
        totalProductsCount={products.length}
      />

      {/* Active Coupon / Referral Feedback Strip */}
      {(couponFeedback || referralCode) && (
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 space-y-2">
          {couponFeedback && (
            <div
              className="p-3 rounded-lg text-xs sm:text-sm font-bold text-[#1E293B] flex items-center justify-between gap-3 shadow-xs border"
              style={{
                backgroundColor: 'var(--color-primary-soft)',
                borderColor: 'var(--color-primary-border)',
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Tag className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                <span>{couponFeedback}</span>
              </span>
              <button
                type="button"
                onClick={() => setCouponFeedback(null)}
                className="text-xs font-extrabold hover:underline shrink-0"
                style={{ color: 'var(--color-primary)' }}
              >
                إخفاء
              </button>
            </div>
          )}
          {referralCode && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 flex items-center justify-between shadow-xs">
              <span>
                تم تفعيل كود الإحالة الخاص بك:{' '}
                <strong className="font-mono text-emerald-700">{referralCode}</strong> (خصم إضافي 5% عند إتمام الطلب)
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Quick Access 6 Feature Cards */}
      <section aria-label="وصول سريع للعروض والأقسام" className="max-w-[1280px] mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {quickFeatureCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className="group bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[var(--color-primary)] hover:-translate-y-0.5 transition-all text-right flex items-center gap-2.5 cursor-pointer"
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-primary-soft)' }}
              >
                {card.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1E293B] leading-snug">
                  {card.title}
                </div>
                <div className="text-[11px] text-[#64748B] truncate">{card.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Circular Categories (2 Rows of 4 on Desktop) with Coupon Badges */}
      <section aria-label="الأقسام الدائرية وكوبونات الخصم" className="max-w-[1280px] mx-auto px-3 sm:px-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base sm:text-xl font-extrabold text-[#1E293B]">
              تسوق حسب القسم مع كوبونات خصم فورية
            </h2>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-extrabold"
              style={{ color: 'var(--color-primary)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>خصم حتى 30% | كود: ALM30</span>
            </span>
          </div>

          {/* 2 neat rows of 4 on sm/lg desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {circularCategories.map((bubble) => (
              <button
                key={bubble.id}
                type="button"
                onClick={() => {
                  onSelectCategory(bubble.categoryId);
                  onSelectSpecialFilter(bubble.special);
                  void activateCouponBanner('ALM30', 'خصم حتى 30%');
                  jumpToCatalog();
                }}
                className="group flex flex-col items-center text-center gap-2.5 p-2 rounded-xl hover:bg-[#F8F9FA] transition-colors cursor-pointer"
              >
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] shadow-sm bg-[#F8F9FA] transition-transform duration-300 group-hover:scale-105"
                  style={{ borderColor: 'var(--color-primary)' }}
                >
                  <img
                    src={bubble.image}
                    alt={bubble.titleAr}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallbackApplied) {
                        target.dataset.fallbackApplied = '1';
                        target.src = getFallbackProductArt(bubble.sku);
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#1E293B] leading-tight line-clamp-1">
                  {bubble.titleAr}
                </span>
                <span className="inline-flex items-center rounded-md overflow-hidden text-[10px] font-extrabold leading-none shadow-xs">
                  <span
                    className="px-2 py-1"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-primary-contrast)',
                    }}
                  >
                    خصم حتى 30%
                  </span>
                  <span
                    className="px-2 py-1 font-mono"
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-secondary-contrast)',
                    }}
                  >
                    كود: ALM30
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Flash Sales Section with Live Countdown Timer Styled with var(--color-secondary) */}
      <section
        id="flash-sales-section"
        aria-label="عروض الفلاش اليومية"
        className="max-w-[1280px] mx-auto px-3 sm:px-6"
      >
        <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200/80 bg-white">
          <div
            className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-secondary-contrast)',
            }}
          >
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base sm:text-xl font-extrabold tracking-tight">
                Flash Sales كل يوم!! ⚡
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold bg-black/20 text-white px-3.5 py-1.5 rounded-lg tabular-nums">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                ينتهي خلال: {countdown.hours}:{countdown.minutes}:{countdown.seconds}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onSelectSpecialFilter('flash');
                jumpToCatalog();
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold hover:underline whitespace-nowrap cursor-pointer"
            >
              <span>عرض الكل ⬅</span>
            </button>
          </div>

          {/* Horizontal Scrolling Flash Sale Cards */}
          <div className="p-4 flex overflow-x-auto gap-3.5 bg-white">
            {flashSaleProducts.map((product) => {
              const pricing = getEffectiveProductPrice(product, categories);
              const urgencyPct = computeStockUrgencyPercent(product.stock, 30);

              return (
                <article
                  key={`flash-${product.id}`}
                  data-testid={`flash-card-${product.id}`}
                  className="w-48 sm:w-52 shrink-0 bg-white rounded-xl border border-slate-200/80 p-2.5 hover:shadow-md hover:border-[var(--color-primary)] transition-all flex flex-col justify-between gap-2 group"
                >
                  {/* Image + Corner Instant + Add Button + Discount Badge */}
                  <div className="relative aspect-[4/3] w-full rounded-lg bg-[#F8F9FA] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      aria-label={`عرض ${product.nameAr}`}
                      className="w-full h-full block"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.nameAr}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = '1';
                            target.src = getFallbackProductArt(product.sku);
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>

                    {/* Instant '+' Quick Add to Cart Button in Top Corner */}
                    <button
                      type="button"
                      onClick={() => onQuickAdd(product)}
                      aria-label={`إضافة فورية ${product.nameAr} إلى السلة`}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-primary-contrast)',
                      }}
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>

                    {pricing.hasDiscount && (
                      <span
                        className="absolute top-2 right-2 font-extrabold text-[11px] px-1.5 py-0.5 rounded tabular-nums shadow-xs"
                        style={{
                          backgroundColor: 'var(--color-secondary)',
                          color: 'var(--color-secondary-contrast)',
                        }}
                      >
                        -{pricing.discountPercent}%
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="text-right"
                  >
                    <h3 className="text-xs font-semibold text-[#1E293B] line-clamp-2 min-h-[2rem]">
                      {product.nameAr}
                    </h3>
                  </button>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-[#1E293B] tabular-nums">
                        {formatSAR(pricing.effectivePrice)}
                      </span>
                      {pricing.hasDiscount && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">
                          {formatSAR(pricing.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="space-y-1">
                      <div
                        className="text-[11px] font-bold tabular-nums"
                        style={{
                          color: product.stock <= 10 ? '#DC2626' : 'var(--color-secondary)',
                        }}
                      >
                        {product.stock <= 10
                          ? `بقي ${product.stock} قطع فقط!`
                          : `متبقي ${product.stock} قطعة`}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${urgencyPct}%`,
                            backgroundColor: 'var(--color-secondary)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Dual Promo Promotional Banners */}
      <section aria-label="عروض ترويجية موسمية" className="max-w-[1280px] mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              onSelectCategory('cat-accessories');
              onSelectSpecialFilter('all');
              jumpToCatalog();
            }}
            className="group relative rounded-xl overflow-hidden shadow-xs border border-slate-200/80 aspect-[16/8] sm:aspect-[16/7] text-right cursor-pointer"
          >
            <img
              src="/assets/images/promo_tech_essentials_1794729734876.jpg"
              alt="تشكيلة MagSafe وشواحن GaN الفاخرة"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/45 to-transparent" />
            <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-center items-start gap-2 text-white max-w-md">
              <span
                className="text-[11px] font-extrabold px-2.5 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-contrast)',
                }}
              >
                وصل حديثاً · إكسسوارات الجوال
              </span>
              <h3 className="font-display text-lg sm:text-2xl font-extrabold leading-snug">
                تشكيلة MagSafe وشواحن GaN الفاخرة
              </h3>
              <p className="text-xs sm:text-sm text-slate-200">
                خصومات تصل إلى 30% وتوصيل فوري داخل الرياض
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#00FF87] pt-1">
                <span>تسوق التشكيلة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('cat-stem');
              onSelectSpecialFilter('all');
              jumpToCatalog();
            }}
            className="group relative rounded-xl overflow-hidden shadow-xs border border-slate-200/80 aspect-[16/8] sm:aspect-[16/7] text-right cursor-pointer"
          >
            <img
              src="/assets/images/promo_stem_gifts_1794729737354.jpg"
              alt="عالم الألعاب الذكية STEM والهدايا الفاخرة"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/45 to-transparent" />
            <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-center items-start gap-2 text-white max-w-md">
              <span
                className="text-[11px] font-extrabold px-2.5 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-secondary-contrast)',
                }}
              >
                موسم الهدايا · STEM & Decor
              </span>
              <h3 className="font-display text-lg sm:text-2xl font-extrabold leading-snug">
                عالم الألعاب الذكية والهدايا التنفيذية
              </h3>
              <p className="text-xs sm:text-sm text-slate-200">
                تغليف هدايا مجاني + تقسيط تمارا وتابي بدون فوائد
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#FACC15] pt-1">
                <span>اكتشف الهدايا الآن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 6. Full Marketplace Product Catalog Grid */}
      <section id="catalog-section" className="max-w-[1280px] mx-auto px-3 sm:px-6 space-y-4">
        <div
          id="categories-bar"
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg sm:text-2xl font-extrabold text-[#1E293B]">
                المجموعة المختارة ({filteredProducts.length} منتج)
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                جميع منتجات المصمم الأول متوفرة في مستودع الرياض للشحن الفوري
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-2 bg-[#F8F9FA] border border-slate-200 rounded-lg px-3 py-2">
                <SlidersHorizontal
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--color-primary)' }}
                />
                <label htmlFor="price-range" className="text-[#1E293B] font-semibold whitespace-nowrap">
                  السعر حتى: <strong className="tabular-nums">{formatSAR(maxPrice)}</strong>
                </label>
                <input
                  id="price-range"
                  type="range"
                  min={50}
                  max={1000}
                  step={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-24"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
              </div>

              <select
                aria-label="ترتيب المنتجات"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#1E293B] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="featured">المميزة أولاً</option>
                <option value="top_rated">الأعلى تقييماً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onSelectSpecialFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              style={
                selectedCategoryId === 'all' && specialFilter === 'all'
                  ? {
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-primary-contrast)',
                    }
                  : { backgroundColor: '#F8F9FA', color: '#1E293B' }
              }
            >
              الكل ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const active = selectedCategoryId === cat.id && specialFilter === 'all';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onSelectSpecialFilter('all');
                  }}
                  className="px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-contrast)',
                        }
                      : { backgroundColor: '#F8F9FA', color: '#1E293B' }
                  }
                >
                  {cat.nameAr} ({count})
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onSelectSpecialFilter('flash');
              }}
              className="px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              style={
                specialFilter === 'flash'
                  ? {
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-secondary-contrast)',
                    }
                  : {
                      backgroundColor: 'var(--color-secondary-soft)',
                      color: 'var(--color-secondary)',
                    }
              }
            >
              ⚡ عروض الفلاش فقط
            </button>

            {(searchQuery || selectedCategoryId !== 'all' || specialFilter !== 'all' || maxPrice < 1000) && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onSelectCategory('all');
                  onSelectSpecialFilter('all');
                  setMaxPrice(1000);
                }}
                className="px-3 py-1.5 rounded-md text-xs font-bold text-[#64748B] hover:text-[#1E293B] underline cursor-pointer"
              >
                إعادة ضبط الكل
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-10 text-center space-y-3">
            <h3 className="font-display text-lg font-bold text-[#1E293B]">
              لا توجد منتجات مطابقة لبحثك
            </h3>
            <p className="text-xs text-[#64748B]">
              جرّب تعديل كلمة البحث أو توسيع نطاق السعر لعرض جميع المنتجات المتاحة.
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
                onSelectSpecialFilter('all');
                setMaxPrice(1000);
              }}
              className="px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
              }}
            >
              عرض جميع المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onSelectProduct={onSelectProduct}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. Affiliate & Riyadh Trust Guarantee Card */}
      <section className="max-w-[1280px] mx-auto px-3 sm:px-6">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded"
              style={{
                backgroundColor: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
              }}
            >
              برنامج سفراء المصمم الأول · الرياض
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#1E293B]">
              شارك الفخامة واكسب عمولة 5% على كل طلب عبر رابط الإحالة الخاص بك
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl">
              يمنح رابط الإحالة الخاص بك أصدقاءك في الرياض خصماً فورياً بنسبة 5% على طلبهم، وتُسجّل لك عمولة 5% تلقائياً على كل عملية شراء مكتملة.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopyAffiliateLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm shadow-xs hover:brightness-110 transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-contrast)',
                }}
              >
                {copiedRef ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedRef ? 'تم نسخ رابط الإحالة (?ref=RIYADH5)' : 'نسخ رابط الإحالة الخاص بك'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenPolicy}
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-[#F8F9FA] hover:bg-slate-200 text-xs sm:text-sm font-bold text-[#1E293B] transition-colors cursor-pointer"
              >
                الضمان الذهبي وسياسة الاسترجاع
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="rounded-xl bg-[#F8F9FA] p-4 w-full max-w-[220px] border border-slate-200 flex items-center justify-center">
              <img
                src={logoUrl?.trim() || '/assets/brand/almosamem-full.png'}
                alt="هوية المصمم الأول الرسمية"
                referrerPolicy="no-referrer"
                className="w-full h-36 object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer with Safeer Marketing attribution and zero public admin links */}
      <Footer
        logoUrl={logoUrl}
        onOpenPolicy={onOpenPolicy}
        onOpenWheel={onOpenWheel}
      />
    </div>
  );
};
