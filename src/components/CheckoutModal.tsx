import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  CheckCircle2,
  MapPin,
  Ticket,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type {
  AuthUser,
  CartItem,
  Category,
  Coupon,
  MarketingSeoSettings,
  Order,
  OrderItemSnapshot,
  PaymentGatewaysSettings,
  PaymentMethodId,
  Product,
} from '../types/store';
import {
  calculateCartTotals,
  calculateInstallmentAmount,
  formatSAR,
  getEffectiveProductPrice,
  isPaymentMethodAllowed,
  RIYADH_DISTRICTS,
  validateCoupon,
} from '../utils/commerce';
import { sendStoreManagerNotification } from '../lib/api';
import { trackPixelEvent } from '../lib/analytics';

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartItem[];
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  referralCode: string | null;
  currentUser: AuthUser | null;
  gateways: PaymentGatewaysSettings;
  seoSettings: MarketingSeoSettings;
  onClose: () => void;
  onApplyCoupon: (coupon: Coupon | null) => void;
  onOpenAuthForCheckout: () => void;
  onOrderCompleted: (order: Order) => void;
}

interface PaymentOption {
  id: PaymentMethodId;
  labelAr: string;
  subtitleAr: string;
  gated: boolean;
  gatewayEnabled: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  items,
  products,
  categories,
  coupons,
  appliedCoupon,
  referralCode,
  currentUser,
  gateways,
  seoSettings,
  onClose,
  onApplyCoupon,
  onOpenAuthForCheckout,
  onOrderCompleted,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [district, setDistrict] = useState<string>(RIYADH_DISTRICTS[0]);
  const [streetAddress, setStreetAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('mada');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (currentUser) {
      setCustomerName((prev) => prev || currentUser.fullName);
      setCustomerEmail((prev) => prev || currentUser.email);
      setCustomerPhone((prev) => prev || currentUser.phone || '');
      if (currentUser.defaultDistrict) {
        setDistrict(currentUser.defaultDistrict);
      }
      if (currentUser.streetAddress) {
        setStreetAddress((prev) => prev || currentUser.streetAddress || '');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (appliedCoupon) {
      setCouponInput(appliedCoupon.code);
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmedOrder(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  // If user signs out while BNPL/COD selected, revert safely to mada
  useEffect(() => {
    if (!isPaymentMethodAllowed(paymentMethod, Boolean(currentUser))) {
      setPaymentMethod('mada');
    }
  }, [currentUser, paymentMethod]);

  if (!isOpen) return null;

  const isAuthenticated = Boolean(currentUser);
  const totals = calculateCartTotals({
    items,
    products,
    categories,
    coupon: appliedCoupon,
    referralCode,
  });
  const installment = calculateInstallmentAmount(totals.total, 4);

  const paymentOptions: PaymentOption[] = [
    {
      id: 'mada',
      labelAr: 'بطاقة مدى',
      subtitleAr: 'دفع فوري عبر ميسّر (Moyasar)',
      gated: false,
      gatewayEnabled: gateways.moyasar.enabled,
    },
    {
      id: 'apple_pay',
      labelAr: 'Apple Pay',
      subtitleAr: 'دفع بلمسة واحدة',
      gated: false,
      gatewayEnabled: gateways.moyasar.enabled,
    },
    {
      id: 'credit_card',
      labelAr: 'بطاقة ائتمانية (Visa / Mastercard)',
      subtitleAr: 'بوابة آمنة ومشفرة',
      gated: false,
      gatewayEnabled: gateways.stripe.enabled || gateways.moyasar.enabled,
    },
    {
      id: 'tamara',
      labelAr: `تمارا — 4 دفعات (${formatSAR(installment)})`,
      subtitleAr: 'متاح للأعضاء المسجلين فقط',
      gated: true,
      gatewayEnabled: gateways.tamara.enabled,
    },
    {
      id: 'tabby',
      labelAr: `تابي — 4 دفعات (${formatSAR(installment)})`,
      subtitleAr: 'متاح للأعضاء المسجلين فقط',
      gated: true,
      gatewayEnabled: gateways.tabby.enabled,
    },
    {
      id: 'cod',
      labelAr: 'الدفع عند الاستلام (الرياض)',
      subtitleAr: 'متاح للأعضاء المسجلين فقط',
      gated: true,
      gatewayEnabled: true,
    },
  ];

  const handleApplyCoupon = () => {
    const res = validateCoupon(couponInput, coupons, new Date(), {
      subtotal: totals.subtotal,
      items,
      products,
      categories,
    });
    if (!res.valid || !res.coupon) {
      setCouponFeedback({ ok: false, message: res.errorAr || 'كوبون غير صالح' });
      onApplyCoupon(null);
      return;
    }
    onApplyCoupon(res.coupon);
    setCouponFeedback({
      ok: true,
      message: res.coupon.prizeMessageAr
        ? `تم تفعيل الكوبون ${res.coupon.code}: ${res.coupon.prizeMessageAr}`
        : `تم تفعيل الكوبون ${res.coupon.code} بنجاح!`,
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg('سلة التسوق فارغة.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !streetAddress.trim() || !customerEmail.trim()) {
      setErrorMsg('يرجى استكمال كافة بيانات التوصيل والتواصل.');
      return;
    }
    if (!isPaymentMethodAllowed(paymentMethod, isAuthenticated)) {
      setErrorMsg('خيار الدفع المختار متاح للعملاء المسجلين فقط. يرجى تسجيل الدخول أو اختيار مدى/Apple Pay.');
      return;
    }

    setSubmitting(true);

    const snapshots: OrderItemSnapshot[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const pricing = getEffectiveProductPrice(product, categories);
      const variant = product.variants.find((v) => v.id === item.variantId);
      snapshots.push({
        productId: product.id,
        sku: product.sku,
        nameAr: product.nameAr,
        variantNameAr: variant?.nameAr,
        unitPrice: pricing.effectivePrice,
        unitCost: product.costPrice,
        quantity: item.quantity,
        image: variant?.imageUrl || product.images[0],
      });
    }

    const orderNumber = `AM-${Math.floor(10500 + Math.random() * 89000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: currentUser?.id ?? null,
      isGuest: !currentUser,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      city: 'الرياض',
      district,
      streetAddress: streetAddress.trim(),
      notes: notes.trim() || undefined,
      items: snapshots,
      subtotal: totals.subtotal,
      discountAmount: totals.couponDiscount,
      referralDiscount: totals.referralDiscount,
      couponCode: appliedCoupon?.code ?? null,
      referralCode: referralCode ?? null,
      referralCommission: totals.referralCommission,
      shippingFee: totals.shippingFee,
      total: totals.total,
      paymentMethod,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    trackPixelEvent('Purchase', {
      value: newOrder.total,
      currency: 'SAR',
      content_ids: snapshots.map((s) => s.sku),
      order_id: newOrder.orderNumber,
    });

    await sendStoreManagerNotification({
      type: 'new_order',
      subject: `طلب جديد ${newOrder.orderNumber} — ${formatSAR(newOrder.total)} (${newOrder.district})`,
      message: `عميل: ${newOrder.customerName} (${newOrder.customerPhone})\nالحي: ${newOrder.district} - ${newOrder.streetAddress}\nالإجمالي: ${formatSAR(newOrder.total)}\nطريقة الدفع: ${newOrder.paymentMethod}`,
      orderNumber: newOrder.orderNumber,
      customerEmail: newOrder.customerEmail,
      seoSettings,
    });

    setSubmitting(false);
    setConfirmedOrder(newOrder);
    onOrderCompleted(newOrder);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="إتمام الطلب"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6 flex items-start justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl my-4 overflow-hidden shadow-2xl">
        <div className="bg-[#0B0F19] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">
              {confirmedOrder ? 'تم تأكيد طلبك بنجاح' : 'إتمام الطلب — توصيل فوري بالرياض'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAuthenticated
                ? `مسجل باسم ${currentUser?.fullName} · جميع طرق الدفع مفعّلة`
                : 'وضع الزائر (ضيف) · متاح الدفع بمدى، Apple Pay والبطاقات الائتمانية'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق إتمام الطلب"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-8 text-center space-y-5">
            <CheckCircle2 className="w-16 h-16 text-[#059669] mx-auto" />
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#059669] font-bold">
                ORDER #{confirmedOrder.orderNumber}
              </div>
              <h3 className="font-display text-2xl font-bold text-[#0B0F19]">
                شكراً لطلبك من المصمم الأول، {confirmedOrder.customerName}!
              </h3>
              <p className="text-sm text-slate-600">
                جاري تجهيز شحنتك الآن للتوصيل السريع إلى{' '}
                <strong>{confirmedOrder.district}</strong> في الرياض.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-right space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الطلب:</span>
                <span className="font-mono font-bold text-[#0B0F19]">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الإجمالي المدفوع:</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {formatSAR(confirmedOrder.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-semibold text-[#0B0F19]">{confirmedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">العنوان:</span>
                <span className="text-[#0B0F19]">
                  الرياض، {confirmedOrder.district} — {confirmedOrder.streetAddress}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-[#0B0F19] hover:bg-slate-800 text-white text-sm font-bold"
            >
              العودة للمتجر
            </button>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
            {/* Customer & Riyadh Address */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0B0F19]">
                  <MapPin className="w-4 h-4 text-[#059669]" />
                  <span>بيانات التوصيل في الرياض</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="chk-name" className="block text-xs font-semibold text-slate-700 mb-1">
                      الاسم الكامل
                    </label>
                    <input
                      id="chk-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="عبدالله السالم"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="chk-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                      رقم الجوال
                    </label>
                    <input
                      id="chk-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="chk-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      id="chk-email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="chk-district" className="block text-xs font-semibold text-slate-700 mb-1">
                      الحي (الرياض)
                    </label>
                    <select
                      id="chk-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:border-[#059669] focus:outline-none"
                    >
                      {RIYADH_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="chk-street" className="block text-xs font-semibold text-slate-700 mb-1">
                    تفاصيل الشارع والمنزل / المكتب
                  </label>
                  <input
                    id="chk-street"
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="شارع أنس بن مالك، مبنى 22، الدور 3"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="chk-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                    ملاحظات إضافية للمندوب (اختياري)
                  </label>
                  <input
                    id="chk-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: تغليف هدية أو الاتصال قبل الوصول"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Gateway Selector with Gated Payment Rule */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0B0F19]">
                    <CreditCard className="w-4 h-4 text-[#059669]" />
                    <span>اختر طريقة الدفع</span>
                  </div>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={onOpenAuthForCheckout}
                      className="text-xs font-bold hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      سجل دخولك لتفعيل تمارا وتابي والدفع عند الاستلام
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {paymentOptions
                    .filter((opt) => opt.gatewayEnabled)
                    .map((opt) => {
                      const allowed = isPaymentMethodAllowed(opt.id, isAuthenticated);
                      const selected = paymentMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={!allowed}
                          onClick={() => allowed && setPaymentMethod(opt.id)}
                          className={`p-3 rounded-xl border text-right transition-colors flex items-start justify-between gap-2 ${
                            !allowed
                              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                              : selected
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[#0B0F19]'
                              : 'border-slate-200 hover:border-slate-400 text-[#0B0F19]'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{opt.labelAr}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.subtitleAr}</div>
                          </div>
                          {!allowed && <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                </div>

                {!isAuthenticated && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span>
                      تمارا، تابي، والدفع عند الاستلام مخصصة للأعضاء المسجلين. يمكنك الشراء كضيف عبر مدى وApple Pay أو تسجيل الدخول الآن.
                    </span>
                    <button
                      type="button"
                      onClick={onOpenAuthForCheckout}
                      className="px-3 py-1.5 rounded-md bg-[#0B0F19] text-white font-bold whitespace-nowrap shrink-0"
                    >
                      دخول سريع
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary & Coupon */}
            <div className="lg:col-span-5 bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[#0B0F19]">ملخص الطلب</h3>

                {/* Coupon Input */}
                <div className="space-y-1.5">
                  <label htmlFor="chk-coupon" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-[#059669]" />
                    <span>هل لديك كود خصم؟</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="chk-coupon"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="RIYADH10"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono uppercase focus:border-[#059669] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3.5 py-2 rounded-lg bg-[#0B0F19] hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap"
                    >
                      تطبيق
                    </button>
                  </div>
                  {couponFeedback && (
                    <p
                      className={`text-[11px] font-medium ${
                        couponFeedback.ok ? 'text-[#059669]' : 'text-red-600'
                      }`}
                    >
                      {couponFeedback.message}
                    </p>
                  )}
                </div>

                {referralCode && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>تم تطبيق خصم الإحالة 5% عبر الكود {referralCode}</span>
                  </div>
                )}

                {/* Totals breakdown */}
                <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي ({totals.itemCount} منتج)</span>
                    <span className="tabular-nums font-semibold text-[#0B0F19]">
                      {formatSAR(totals.subtotal)}
                    </span>
                  </div>
                  {totals.couponDiscount > 0 && (
                    <div className="flex justify-between text-[#059669]">
                      <span>خصم الكوبون ({appliedCoupon?.code})</span>
                      <span className="tabular-nums font-semibold">
                        -{formatSAR(totals.couponDiscount)}
                      </span>
                    </div>
                  )}
                  {totals.referralDiscount > 0 && (
                    <div className="flex justify-between text-[#059669]">
                      <span>خصم رابط الإحالة (5%)</span>
                      <span className="tabular-nums font-semibold">
                        -{formatSAR(totals.referralDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>رسوم التوصيل (الرياض)</span>
                    <span className="tabular-nums font-semibold text-[#0B0F19]">
                      {totals.shippingFee === 0 ? 'مجاني' : formatSAR(totals.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#0B0F19] pt-2 border-t border-slate-200">
                    <span>الإجمالي النهائي</span>
                    <span className="tabular-nums">{formatSAR(totals.total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {errorMsg && (
                  <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-5 rounded-lg hover:opacity-90 disabled:opacity-60 font-bold text-sm transition-opacity shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-contrast)',
                  }}
                >
                  {submitting ? 'جاري تأكيد الطلب...' : `تأكيد الطلب — ${formatSAR(totals.total)}`}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>دفع مشفر 256-bit متوافق مع أنظمة المملكة</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
