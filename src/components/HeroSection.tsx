import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { DEFAULT_TEMU_JUMIA_SLICES, SpinWheelVisual } from './SpinWheelVisual';

interface HeroSectionProps {
  onExploreCatalog: () => void;
  onJumpToFlashSales: () => void;
  onSelectCategory: (catId: string) => void;
  onOpenWheel: () => void;
  totalProductsCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreCatalog,
  onJumpToFlashSales,
  onSelectCategory,
  onOpenWheel,
  totalProductsCount,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="max-w-[1280px] mx-auto px-3 sm:px-6 pt-4">
      <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200/70 bg-[#0B0F19] min-h-[320px] sm:min-h-[370px]">
        {/* SLIDE 0: Official Emerald Green + Temu/Jumia Interactive Spin Wheel Banner */}
        {activeSlide === 0 && (
          <div
            className="relative min-h-[320px] sm:min-h-[370px] text-white px-6 sm:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            style={{
              background:
                'linear-gradient(115deg, #0B0F19 0%, #064E3B 45%, var(--color-primary, #059669) 100%)',
            }}
          >
            {/* Subtle cyber green radial light */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full bg-[#00FF87]/20 blur-[90px]"
            />

            {/* Right: Copy & Primary Action */}
            <div className="lg:col-span-7 space-y-4 relative z-10 text-right">
              <div
                className="inline-flex items-center gap-2 text-xs font-extrabold px-3.5 py-1.5 rounded-md shadow-sm"
                style={{
                  backgroundColor: 'var(--color-secondary, #FF6B00)',
                  color: 'var(--color-secondary-contrast, #FFFFFF)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>الكل كسبان 🎡 · {totalProductsCount} منتجاً فاخراً في الرياض</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl lg:text-[2.5rem] font-extrabold leading-[1.2] text-white text-balance">
                عروض المصمّم الأول الكبرى — أدر العجلة واكسب كود خصمك الفوري!
              </h1>

              <p className="text-sm sm:text-base text-emerald-50/90 max-w-xl leading-relaxed">
                جوائز مضمونة للجميع: 50 ر.س، خصم 30%، شحن مجاني، أو 100 ر.س خصم فوري — تطبّق تلقائياً في سلة التسوق.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenWheel}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-extrabold text-sm shadow-lg transition-transform hover:-translate-y-0.5 hover:brightness-110 cursor-pointer whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: 'var(--color-secondary, #FF6B00)',
                    color: 'var(--color-secondary-contrast, #FFFFFF)',
                  }}
                >
                  <span>العب واكسب الآن 🎡</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onJumpToFlashSales}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-sm backdrop-blur-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>عروض الفلاش اليومية ⚡</span>
                </button>
              </div>
            </div>

            {/* Center/Left: Temu & Jumia Interactive Spin Wheel Showcase */}
            <div className="lg:col-span-5 flex items-center justify-center relative z-10">
              <div className="transition-transform duration-300 hover:scale-[1.03]">
                <SpinWheelVisual
                  slices={DEFAULT_TEMU_JUMIA_SLICES}
                  size="hero"
                  onCenterClick={onOpenWheel}
                />
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: Phone & MagSafe Tech Essentials */}
        {activeSlide === 1 && (
          <div className="relative min-h-[320px] sm:min-h-[370px] flex items-center">
            <img
              src="/assets/images/promo_tech_essentials_1794729734876.jpg"
              alt="تشكيلة إكسسوارات MagSafe وشواحن GaN"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/55 to-black/20" />
            <div className="relative z-10 px-6 sm:px-12 py-8 max-w-2xl space-y-4 text-white">
              <span
                className="inline-block text-xs font-extrabold px-3 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-primary, #059669)',
                  color: 'var(--color-primary-contrast, #FFFFFF)',
                }}
              >
                خصم حتى 30% على إكسسوارات MagSafe
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold leading-tight">
                كفرات الأراميد ومنصات الشحن اللاسلكي الأحدث في الرياض
              </h2>
              <p className="text-sm sm:text-base text-slate-200">
                توصيل خلال ساعات + ضمان استبدال سنتين على جميع إكسسوارات الجوال والشواحن.
              </p>
              <button
                type="button"
                onClick={() => onSelectCategory('cat-accessories')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm shadow-lg hover:brightness-110 transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary, #059669)',
                  color: 'var(--color-primary-contrast, #FFFFFF)',
                }}
              >
                <span>تسوق إكسسوارات الهواتف</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 2: Smart STEM Toys & Luxury Gifts */}
        {activeSlide === 2 && (
          <div className="relative min-h-[320px] sm:min-h-[370px] flex items-center">
            <img
              src="/assets/images/promo_stem_gifts_1794729737354.jpg"
              alt="روبوتات STEM والهدايا الفاخرة"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/55 to-black/20" />
            <div className="relative z-10 px-6 sm:px-12 py-8 max-w-2xl space-y-4 text-white">
              <span
                className="inline-block text-xs font-extrabold px-3 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-secondary, #FF6B00)',
                  color: 'var(--color-secondary-contrast, #FFFFFF)',
                }}
              >
                ألعاب STEM الذكية وبوكسات الهدايا
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold leading-tight">
                هدية تليق بأحبابك — روبوتات تعليمية وتحف إضاءة عصرية
              </h2>
              <p className="text-sm sm:text-base text-slate-200">
                قسّم فاتورتك على 4 دفعات بدون فوائد مع تمارا وتابي أو ادفع عبر Apple Pay ومدى.
              </p>
              <button
                type="button"
                onClick={onExploreCatalog}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm shadow-lg hover:brightness-110 transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary, #059669)',
                  color: 'var(--color-primary-contrast, #FFFFFF)',
                }}
              >
                <span>استكشف كل المنتجات ({totalProductsCount})</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Carousel Arrows */}
        <button
          type="button"
          onClick={() => setActiveSlide((prev) => (prev + 2) % 3)}
          aria-label="الشريحة السابقة"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/75 text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
          aria-label="الشريحة التالية"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/75 text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              aria-label={`عرض الشريحة ${idx + 1}`}
              className="h-2 rounded-full transition-all cursor-pointer"
              style={
                activeSlide === idx
                  ? { width: '1.75rem', backgroundColor: 'var(--color-secondary, #FF6B00)' }
                  : { width: '0.5rem', backgroundColor: 'rgba(255,255,255,0.5)' }
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
};
