import React, { useEffect, useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import type { Category, Product } from '../types/store';
import { formatSAR, getEffectiveProductPrice } from '../utils/commerce';
import { getFallbackProductArt } from '../data/seedData';

interface ProductCardProps {
  product: Product;
  categories: Category[];
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categories,
  isWishlisted = false,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
}) => {
  const category = categories.find((c) => c.id === product.categoryId);
  const pricing = getEffectiveProductPrice(product, categories);
  const outOfStock = product.stock <= 0;
  const [imgSrc, setImgSrc] = useState(product.images[0]);

  useEffect(() => {
    setImgSrc(product.images[0]);
  }, [product.images]);

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group bg-white rounded-lg p-3 border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between gap-2.5"
    >
      {/* Framed Studio Photo */}
      <div className="relative aspect-[4/3] w-full rounded-md bg-[#F8F9FA] overflow-hidden">
        <button
          type="button"
          onClick={() => onSelectProduct(product)}
          aria-label={`عرض تفاصيل ${product.nameAr}`}
          className="w-full h-full block text-right cursor-pointer"
        >
          <img
            src={imgSrc}
            alt={product.nameAr}
            referrerPolicy="no-referrer"
            onError={() => {
              const fallback = getFallbackProductArt(product.sku);
              if (imgSrc !== fallback) setImgSrc(fallback);
            }}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {pricing.hasDiscount && (
          <span
            className="absolute top-2 left-2 font-extrabold text-[11px] px-2 py-0.5 rounded tabular-nums shadow-xs pointer-events-none"
            style={{
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-secondary-contrast)',
            }}
          >
            -{pricing.discountPercent}%
          </span>
        )}

        {product.featured && (
          <span className="absolute top-2 right-2 bg-[#1E293B]/90 text-white font-bold text-[10px] px-2 py-0.5 rounded pointer-events-none">
            الأكثر طلباً
          </span>
        )}

        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            aria-label={isWishlisted ? `إزالة ${product.nameAr} من المفضلة` : `إضافة ${product.nameAr} إلى المفضلة`}
            className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-slate-200/80 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600'
              }`}
            />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <span className="truncate">{category?.nameAr || 'منتج مختار'}</span>
            <span aria-hidden="true">·</span>
            <span
              className="font-semibold"
              style={{ color: outOfStock ? '#DC2626' : 'var(--color-primary)' }}
            >
              {outOfStock ? 'نفد المخزون' : `متوفر (${product.stock})`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="text-right block w-full"
          >
            <h3 className="text-xs sm:text-sm font-semibold text-[#1E293B] leading-snug line-clamp-2 min-h-[2.3rem] group-hover:opacity-80 transition-opacity">
              {product.nameAr}
            </h3>
          </button>

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-sm sm:text-base font-extrabold text-[#1E293B] tabular-nums">
              {formatSAR(pricing.effectivePrice)}
            </span>
            {pricing.hasDiscount && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatSAR(pricing.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#64748B] tabular-nums">
            <Star className="w-3.5 h-3.5 fill-[#FACC15] text-[#FACC15]" />
            <span className="font-bold text-[#1E293B]">{product.rating.toFixed(1)}</span>
            <span>({product.reviewsCount})</span>
          </div>
        </div>

        {/* Dynamic Brand Primary CTA */}
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => onQuickAdd(product)}
          aria-label={`أضف ${product.nameAr} إلى السلة`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-bold text-xs rounded-md shadow-xs disabled:bg-slate-200 disabled:text-slate-400 hover:brightness-110 transition-all whitespace-nowrap cursor-pointer"
          style={
            outOfStock
              ? undefined
              : {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-contrast)',
                }
          }
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{outOfStock ? 'غير متوفر' : 'أضف إلى السلة'}</span>
        </button>
      </div>
    </article>
  );
};
