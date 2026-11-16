import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  ShoppingBag,
  Zap,
  Check,
  Truck,
  ShieldCheck,
  Star,
  Heart,
} from 'lucide-react';
import type { Category, Product } from '../types/store';
import {
  calculateInstallmentAmount,
  formatSAR,
  getEffectiveProductPrice,
  getRelatedProducts,
} from '../utils/commerce';
import { trackPixelEvent } from '../lib/analytics';
import { getFallbackProductArt } from '../data/seedData';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts: Product[];
  categories: Category[];
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, variantId?: string, quantity?: number) => void;
  onBuyNow: (product: Product, variantId?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts,
  categories,
  isWishlisted = false,
  onToggleWishlist,
  onClose,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [zoomed, setZoomed] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedImageIdx(0);
      setSelectedVariantId(product.variants[0]?.id);
      setZoomed(false);
      setQuantity(1);
      trackPixelEvent('ViewContent', {
        content_name: product.nameAr,
        content_ids: [product.sku],
        content_type: 'product',
        value: product.salePrice ?? product.price,
        currency: 'SAR',
      });
    }
  }, [product]);

  if (!product) return null;

  const category = categories.find((c) => c.id === product.categoryId);
  const pricing = getEffectiveProductPrice(product, categories);
  const installment = calculateInstallmentAmount(pricing.effectivePrice, 4);
  const relatedProducts = getRelatedProducts(product, allProducts, 4);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const galleryImages = Array.from(
    new Set([
      ...(selectedVariant?.imageUrl ? [selectedVariant.imageUrl] : []),
      ...product.images,
    ])
  );
  const activeImage = galleryImages[selectedImageIdx] || galleryImages[0];
  const outOfStock = product.stock <= 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`تفاصيل المنتج ${product.nameAr}`}
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex items-start justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full my-4 overflow-hidden shadow-2xl text-slate-900">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{category?.nameAr}</span>
            <span aria-hidden="true">/</span>
            <span className="font-mono text-emerald-700 font-semibold">{product.sku}</span>
          </div>
          <div className="flex items-center gap-2">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{isWishlisted ? 'في المفضلة' : 'أضف للمفضلة'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق تفاصيل المنتج"
              className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-column Contiguous Purchase Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-7">
          {/* Gallery + Zoom */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative aspect-[4/3] bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
              <img
                src={activeImage}
                alt={product.nameAr}
                referrerPolicy="no-referrer"
                onClick={() => setZoomed((z) => !z)}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallbackApplied) {
                    target.dataset.fallbackApplied = '1';
                    target.src = getFallbackProductArt(product.sku);
                  }
                }}
                className={`w-full h-full object-cover cursor-zoom-in transition-transform duration-500 ${
                  zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? 'تصغير الصورة' : 'تكبير الصورة'}
                className="absolute bottom-3 left-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 hover:border-emerald-600 shadow-md"
              >
                {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>
            </div>

            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedImageIdx(idx);
                      setZoomed(false);
                    }}
                    aria-label={`صورة المنتج ${idx + 1}`}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                      selectedImageIdx === idx
                        ? 'border-[#F68B1E]'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.nameAr} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = '1';
                          target.src = getFallbackProductArt(product.sku);
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Info */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono uppercase tracking-wider">{product.nameEn}</span>
                <span className="inline-flex items-center gap-1 tabular-nums text-slate-900 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {product.rating.toFixed(1)} ({product.reviewsCount} تقييم)
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {product.nameAr}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {product.descriptionAr}
              </p>

              {/* Price & Stock */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                  {formatSAR(pricing.effectivePrice)}
                </span>
                {pricing.hasDiscount && (
                  <>
                    <span className="text-base text-slate-400 line-through tabular-nums">
                      {formatSAR(pricing.originalPrice)}
                    </span>
                    <span className="bg-orange-500 text-white font-bold text-xs px-3 py-1 rounded-full tabular-nums">
                      وفر {pricing.discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="text-xs font-semibold">
                {outOfStock ? (
                  <span className="text-red-600">نفدت الكمية مؤقتاً</span>
                ) : (
                  <span className="text-emerald-700">
                    متوفر في مستودع الرياض · {product.stock} قطعة جاهزة للشحن الفوري
                  </span>
                )}
              </div>

              {/* Color Variants */}
              {product.variants.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-slate-600">
                    اللون المختار:{' '}
                    <span className="text-slate-900 font-bold">{selectedVariant?.nameAr}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {product.variants.map((variant) => {
                      const active = variant.id === selectedVariantId;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(variant.id);
                            setSelectedImageIdx(0);
                          }}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                            active
                              ? 'border-emerald-600 bg-emerald-50 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: variant.hex }}
                          />
                          <span>{variant.nameAr}</span>
                          {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tamara & Tabby BNPL Calculation Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>تمارا · Tamara</span>
                    <span className="text-emerald-700">بدون فوائد</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 tabular-nums">
                    أو قسّمها على 4 دفعات بقيمة{' '}
                    <strong className="text-slate-900">{formatSAR(installment)}</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>تابي · Tabby</span>
                    <span className="text-emerald-700">بدون رسوم</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 tabular-nums">
                    4 دفعات شهرية بقيمة{' '}
                    <strong className="text-slate-900">{formatSAR(installment)}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity & CTA Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-slate-200 bg-[#F8FAFC] rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    aria-label="إنقاص الكمية"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-3 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 text-sm font-bold tabular-nums text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="زيادة الكمية"
                    onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                    className="px-3.5 py-3 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => onAddToCart(product, selectedVariantId, quantity)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 font-bold text-sm rounded-lg shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none hover:brightness-110 transition-all cursor-pointer"
                  style={
                    outOfStock
                      ? undefined
                      : {
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-contrast)',
                        }
                  }
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>أضف إلى السلة</span>
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => onBuyNow(product, selectedVariantId)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#0B0F19] hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                <span>شراء فوري — توصيل سريع بالرياض</span>
              </button>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  توصيل خلال ساعات بالرياض
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ضمان استبدال عامين
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel matched via shared tags */}
        {relatedProducts.length > 0 && (
          <div className="bg-[#F8FAFC] border-t border-slate-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                المنتجات ذات الصلة
              </h3>
              <span className="text-xs text-slate-600">مختارة بناءً على التوافق والتقنية</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => {
                const relPrice = getEffectiveProductPrice(rel, categories);
                return (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectProduct(rel)}
                    className="group bg-white rounded-3xl p-3 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-right transition-all flex flex-col gap-2"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-50 rounded-2xl overflow-hidden">
                      <img
                        src={rel.images[0]}
                        alt={rel.nameAr}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = '1';
                            target.src = getFallbackProductArt(rel.sku);
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {rel.nameAr}
                    </div>
                    <div className="text-xs font-bold text-emerald-700 tabular-nums">
                      {formatSAR(relPrice.effectivePrice)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
