import React from 'react';
import { X, Trash2, ShoppingBag, Truck, ArrowLeft } from 'lucide-react';
import type { CartItem, Category, Coupon, Product } from '../types/store';
import {
  calculateCartTotals,
  formatSAR,
  FREE_SHIPPING_THRESHOLD_SAR,
  getEffectiveProductPrice,
} from '../utils/commerce';
import { getFallbackProductArt } from '../data/seedData';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  products: Product[];
  categories: Category[];
  appliedCoupon: Coupon | null;
  referralCode: string | null;
  onClose: () => void;
  onUpdateQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  onRemoveItem: (productId: string, variantId: string | undefined) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  products,
  categories,
  appliedCoupon,
  referralCode,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totals = calculateCartTotals({
    items,
    products,
    categories,
    coupon: appliedCoupon,
    referralCode,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="سلة التسوق"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-r border-slate-200 text-slate-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="font-display text-lg font-bold text-[#1E293B]">
              سلة التسوق ({totals.itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق سلة التسوق"
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Free Shipping Progress Bar */}
        <div className="px-6 py-4 bg-[#F8F9FA] border-b border-slate-100 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E293B]">
            <Truck className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
            {totals.freeShippingRemaining > 0 ? (
              <span>
                أضف{' '}
                <strong className="tabular-nums" style={{ color: 'var(--color-secondary)' }}>
                  {formatSAR(totals.freeShippingRemaining)}
                </strong>{' '}
                لتحصل على شحن مجاني داخل الرياض!
              </span>
            ) : (
              <span style={{ color: 'var(--color-primary)' }}>
                تهانينا! طلبك مؤهل للشحن الفوري المجاني داخل الرياض (فوق{' '}
                {FREE_SHIPPING_THRESHOLD_SAR} ر.س)
              </span>
            )}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${totals.freeShippingProgressPercent}%`,
                backgroundColor: 'var(--color-primary)',
              }}
            />
          </div>
        </div>

        {/* Cart Items & Active Coupon Notice */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {appliedCoupon && (
            <div
              data-testid="cart-active-coupon-banner"
              className="p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs shadow-xs"
              style={{
                backgroundColor: 'var(--color-primary-soft)',
                borderColor: 'var(--color-primary-border)',
              }}
            >
              <div>
                <div className="font-extrabold text-[#1E293B]">
                  كود الخصم مفعّل في سلتك 🎉
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  سيتم تطبيق الخصم تلقائياً عند إضافة أي منتج أو إتمام الطلب
                </div>
              </div>
              <span
                className="font-mono font-black px-2.5 py-1 rounded-md text-xs shrink-0"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-contrast)',
                }}
              >
                {appliedCoupon.code}
              </span>
            </div>
          )}

          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-slate-400" />
              </div>
              <div className="font-display text-base font-bold text-[#1E293B]">
                سلتك فارغة حالياً
              </div>
              <p className="text-xs text-[#64748B] max-w-xs leading-relaxed">
                أضف إكسسوارات الجوال الفاخرة أو الألعاب الذكية واستمتع بالتوصيل السريع خلال ساعات في الرياض.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-contrast)',
                }}
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              const pricing = getEffectiveProductPrice(product, categories);
              const variant = product.variants.find((v) => v.id === item.variantId);
              const img = variant?.imageUrl || product.images[0];

              return (
                <div
                  key={`${item.productId}-${item.variantId || 'default'}`}
                  className="flex gap-3.5 p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-100"
                >
                  <img
                    src={img}
                    alt={product.nameAr}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallbackApplied) {
                        target.dataset.fallbackApplied = '1';
                        target.src = getFallbackProductArt(product.sku);
                      }
                    }}
                    className="w-20 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-xs font-bold text-[#1E293B] line-clamp-2">
                      {product.nameAr}
                    </div>
                    {variant && (
                      <div className="text-[11px] text-[#64748B]">{variant.nameAr}</div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden">
                        <button
                          type="button"
                          aria-label={`إنقاص كمية ${product.nameAr}`}
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 text-xs font-bold tabular-nums text-[#1E293B]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`زيادة كمية ${product.nameAr}`}
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {formatSAR(pricing.effectivePrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          aria-label={`حذف ${product.nameAr}`}
                          onClick={() => onRemoveItem(item.productId, item.variantId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Totals */}
        {items.length > 0 && (
          <div className="p-6 bg-[#F8F9FA] border-t border-slate-200 space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>المجموع الفرعي</span>
                <span className="tabular-nums font-semibold text-[#1E293B]">
                  {formatSAR(totals.subtotal)}
                </span>
              </div>
              {totals.couponDiscount > 0 && (
                <div className="flex justify-between font-bold" style={{ color: 'var(--color-primary)' }}>
                  <span>خصم الكوبون ({appliedCoupon?.code})</span>
                  <span className="tabular-nums font-semibold">
                    -{formatSAR(totals.couponDiscount)}
                  </span>
                </div>
              )}
              {totals.referralDiscount > 0 && (
                <div className="flex justify-between font-bold" style={{ color: 'var(--color-primary)' }}>
                  <span>خصم الإحالة ({referralCode})</span>
                  <span className="tabular-nums font-semibold">
                    -{formatSAR(totals.referralDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#64748B]">
                <span>التوصيل داخل الرياض</span>
                <span className="tabular-nums font-semibold text-[#1E293B]">
                  {totals.shippingFee === 0 ? 'مجاني' : formatSAR(totals.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1E293B] pt-2.5 border-t border-slate-200">
                <span>الإجمالي المستحق</span>
                <span className="tabular-nums" style={{ color: 'var(--color-primary)' }}>
                  {formatSAR(totals.total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 font-bold text-sm rounded-lg shadow-md hover:brightness-110 transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
              }}
            >
              <span>إتمام الطلب السريع</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
