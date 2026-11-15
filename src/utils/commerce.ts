import type {
  CartItem,
  Category,
  Coupon,
  Order,
  PaymentMethodId,
  Product,
  StoreAnalytics,
} from '../types/store';

export const FREE_SHIPPING_THRESHOLD_SAR = 200;
export const STANDARD_RIYADH_SHIPPING_SAR = 25;
export const REFERRAL_DISCOUNT_PERCENT = 5;
export const REFERRAL_COMMISSION_RATE = 0.05;

export const ADMIN_EMAILS = ['admin@almosamem.com.sa', 'hawasbrothers@gmail.com'];

export const RIYADH_DISTRICTS = [
  'حي الملقا',
  'حي النرجس',
  'حي الياسمين',
  'حي العليا',
  'حي حطين',
  'حي الصحافة',
  'حي القيروان',
  'حي العقيق',
  'حي الورود',
  'حي السليمانية',
  'حي الربيع',
  'حي النخيل',
  'حي الروضة',
  'حي قرطبة',
  'حي السفارات',
  'حي المحمدية',
] as const;

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export interface EffectivePricing {
  originalPrice: number;
  effectivePrice: number;
  discountPercent: number;
  hasDiscount: boolean;
  source: 'none' | 'sale' | 'category_bulk';
}

/**
 * Computes effective selling price factoring in product-level salePrice
 * and category-level bulkDiscountPercent. Takes the best customer price
 * if both exist, or applies bulk discount on base price cleanly.
 */
export function getEffectiveProductPrice(
  product: Product,
  categories: Category[]
): EffectivePricing {
  const category = categories.find((c) => c.id === product.categoryId);
  const bulkPercent = category?.bulkDiscountPercent ?? 0;

  const basePrice = Math.max(0, product.price);
  const saleCandidate =
    product.salePrice !== undefined &&
    product.salePrice !== null &&
    product.salePrice > 0 &&
    product.salePrice < basePrice
      ? product.salePrice
      : null;

  const bulkCandidate =
    bulkPercent > 0 && bulkPercent < 100
      ? Number((basePrice * (1 - bulkPercent / 100)).toFixed(2))
      : null;

  if (saleCandidate !== null && bulkCandidate !== null) {
    if (bulkCandidate <= saleCandidate) {
      return {
        originalPrice: basePrice,
        effectivePrice: bulkCandidate,
        discountPercent: Math.round(((basePrice - bulkCandidate) / basePrice) * 100),
        hasDiscount: true,
        source: 'category_bulk',
      };
    }
    return {
      originalPrice: basePrice,
      effectivePrice: saleCandidate,
      discountPercent: Math.round(((basePrice - saleCandidate) / basePrice) * 100),
      hasDiscount: true,
      source: 'sale',
    };
  }

  if (bulkCandidate !== null) {
    return {
      originalPrice: basePrice,
      effectivePrice: bulkCandidate,
      discountPercent: Math.round(bulkPercent),
      hasDiscount: true,
      source: 'category_bulk',
    };
  }

  if (saleCandidate !== null) {
    return {
      originalPrice: basePrice,
      effectivePrice: saleCandidate,
      discountPercent: Math.round(((basePrice - saleCandidate) / basePrice) * 100),
      hasDiscount: true,
      source: 'sale',
    };
  }

  return {
    originalPrice: basePrice,
    effectivePrice: basePrice,
    discountPercent: 0,
    hasDiscount: false,
    source: 'none',
  };
}

/**
 * Tamara and Tabby split total into 4 equal interest-free installments.
 */
export function calculateInstallmentAmount(totalAmount: number, installments = 4): number {
  if (totalAmount <= 0 || installments <= 0) return 0;
  return Number((totalAmount / installments).toFixed(2));
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  errorAr?: string;
}

export function validateCoupon(
  codeInput: string,
  coupons: Coupon[],
  nowDate: Date = new Date()
): CouponValidationResult {
  const normalized = codeInput.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, errorAr: 'الرجاء إدخال رمز الكوبون.' };
  }

  const found = coupons.find((c) => c.code.trim().toUpperCase() === normalized);
  if (!found) {
    return { valid: false, errorAr: 'رمز الكوبون غير صحيح.' };
  }
  if (!found.active) {
    return { valid: false, errorAr: 'هذا الكوبون متوقف حالياً.' };
  }
  if (found.usedCount >= found.usageLimit) {
    return { valid: false, errorAr: 'تم استنفاد الحد الأقصى لاستخدام هذا الكوبون.' };
  }
  if (found.expiresAt) {
    const expiry = new Date(found.expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < nowDate.getTime()) {
      return { valid: false, errorAr: 'انتهت صلاحية هذا الكوبون.' };
    }
  }

  return { valid: true, coupon: found };
}

export interface CartTotals {
  subtotal: number;
  couponDiscount: number;
  referralDiscount: number;
  shippingFee: number;
  freeShippingRemaining: number;
  freeShippingProgressPercent: number;
  total: number;
  referralCommission: number;
  itemCount: number;
}

export function calculateCartTotals(params: {
  items: CartItem[];
  products: Product[];
  categories: Category[];
  coupon?: Coupon | null;
  referralCode?: string | null;
}): CartTotals {
  const { items, products, categories, coupon, referralCode } = params;

  let subtotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || item.quantity <= 0) continue;
    const { effectivePrice } = getEffectiveProductPrice(product, categories);
    subtotal += effectivePrice * item.quantity;
    itemCount += item.quantity;
  }

  subtotal = Number(subtotal.toFixed(2));

  let couponDiscount = 0;
  let waivesShipping = false;

  if (coupon && subtotal > 0) {
    if (coupon.discountType === 'percent') {
      couponDiscount = Number(((subtotal * coupon.value) / 100).toFixed(2));
    } else if (coupon.discountType === 'fixed') {
      couponDiscount = Number(Math.min(subtotal, coupon.value).toFixed(2));
    } else if (coupon.discountType === 'free_shipping') {
      waivesShipping = true;
    }
  }

  const afterCoupon = Math.max(0, Number((subtotal - couponDiscount).toFixed(2)));

  const hasReferral = Boolean(referralCode && referralCode.trim().length > 0);
  const referralDiscount =
    hasReferral && afterCoupon > 0
      ? Number(((afterCoupon * REFERRAL_DISCOUNT_PERCENT) / 100).toFixed(2))
      : 0;

  const afterAllDiscounts = Math.max(
    0,
    Number((afterCoupon - referralDiscount).toFixed(2))
  );

  const qualifiesFreeShipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_SAR || waivesShipping || subtotal === 0;
  const shippingFee = qualifiesFreeShipping ? 0 : STANDARD_RIYADH_SHIPPING_SAR;

  const freeShippingRemaining =
    subtotal >= FREE_SHIPPING_THRESHOLD_SAR
      ? 0
      : Number((FREE_SHIPPING_THRESHOLD_SAR - subtotal).toFixed(2));

  const freeShippingProgressPercent = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD_SAR) * 100)
  );

  const total = Number((afterAllDiscounts + shippingFee).toFixed(2));
  const referralCommission = hasReferral
    ? Number((afterAllDiscounts * REFERRAL_COMMISSION_RATE).toFixed(2))
    : 0;

  return {
    subtotal,
    couponDiscount,
    referralDiscount,
    shippingFee,
    freeShippingRemaining,
    freeShippingProgressPercent,
    total,
    referralCommission,
    itemCount,
  };
}

/**
 * Gated Payment Rule:
 * - Guest checkout allows: mada, apple_pay, credit_card
 * - BNPL (tamara, tabby) and Cash on Delivery (cod) are strictly restricted to logged-in users!
 */
export function isPaymentMethodAllowed(
  method: PaymentMethodId,
  isAuthenticated: boolean
): boolean {
  if (method === 'tamara' || method === 'tabby' || method === 'cod') {
    return isAuthenticated;
  }
  return true;
}

/**
 * Automatically finds related products using shared tags and fallback category affinity.
 */
export function getRelatedProducts(
  currentProduct: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  const currentTags = new Set(currentProduct.tags.map((t) => t.toLowerCase()));

  const scored = allProducts
    .filter((p) => p.id !== currentProduct.id)
    .map((candidate) => {
      let score = 0;
      for (const tag of candidate.tags) {
        if (currentTags.has(tag.toLowerCase())) {
          score += 3;
        }
      }
      if (candidate.categoryId === currentProduct.categoryId) {
        score += 1;
      }
      if (candidate.stock > 0) {
        score += 0.5;
      }
      return { product: candidate, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}

/**
 * Aggregates Executive Dashboard analytics from real orders state.
 */
export function computeStoreAnalytics(orders: Order[]): StoreAnalytics {
  if (orders.length === 0) {
    return {
      totalRevenue: 0,
      grossProfit: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      returnRatePercent: 0,
      topSellingProducts: [],
    };
  }

  let totalRevenue = 0;
  let totalCost = 0;
  let returnedCount = 0;
  const productMap = new Map<
    string,
    { productId: string; nameAr: string; unitsSold: number; revenue: number }
  >();

  for (const order of orders) {
    if (order.status === 'returned') {
      returnedCount += 1;
      continue;
    }

    totalRevenue += order.total;

    for (const item of order.items) {
      totalCost += item.unitCost * item.quantity;
      const existing = productMap.get(item.productId) ?? {
        productId: item.productId,
        nameAr: item.nameAr,
        unitsSold: 0,
        revenue: 0,
      };
      existing.unitsSold += item.quantity;
      existing.revenue += item.unitPrice * item.quantity;
      productMap.set(item.productId, existing);
    }
  }

  const nonReturnedOrders = orders.length - returnedCount;
  const averageOrderValue =
    nonReturnedOrders > 0 ? Number((totalRevenue / nonReturnedOrders).toFixed(2)) : 0;
  const grossProfit = Number((totalRevenue - totalCost).toFixed(2));
  const returnRatePercent = Number(((returnedCount / orders.length) * 100).toFixed(1));

  const topSellingProducts = Array.from(productMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    grossProfit,
    totalOrders: orders.length,
    averageOrderValue,
    returnRatePercent,
    topSellingProducts,
  };
}

export function formatSAR(amount: number): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ر.س`;
}

export function buildWhatsAppOrderLink(order: Order): string {
  const digits = order.customerPhone.replace(/[^\d]/g, '');
  const normalizedPhone = digits.startsWith('05')
    ? `966${digits.slice(1)}`
    : digits.startsWith('5')
    ? `966${digits}`
    : digits;

  const message = `مرحباً ${order.customerName}، معك فريق المصمم الأول بالرياض. بخصوص طلبك رقم ${order.orderNumber} بقيمة ${order.total} ر.س إلى ${order.district}، يسعدنا تأكيد التوصيل السريع لك.`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export interface CountdownParts {
  hours: string;
  minutes: string;
  seconds: string;
}

/**
 * Formats remaining seconds into padded HH : MM : SS parts for the Flash Sales live countdown timer.
 */
export function formatFlashCountdown(totalSeconds: number): CountdownParts {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return {
    hours: String(hrs).padStart(2, '0'),
    minutes: String(mins).padStart(2, '0'),
    seconds: String(secs).padStart(2, '0'),
  };
}

/**
 * Computes remaining stock urgency bar percentage (between 10% and 100%, or 0% if out of stock).
 */
export function computeStockUrgencyPercent(stock: number, maxDisplayStock = 30): number {
  if (stock <= 0) return 0;
  const pct = Math.round((stock / Math.max(1, maxDisplayStock)) * 100);
  return Math.max(10, Math.min(100, pct));
}

/**
 * Selects top active Flash Sale products prioritized by highest discount percentage and scarcity.
 */
export function getFlashSaleProducts(
  products: Product[],
  categories: Category[],
  limit = 10
): Product[] {
  return [...products]
    .filter((p) => p.stock > 0 && getEffectiveProductPrice(p, categories).hasDiscount)
    .sort((a, b) => {
      const discA = getEffectiveProductPrice(a, categories).discountPercent;
      const discB = getEffectiveProductPrice(b, categories).discountPercent;
      if (discB !== discA) return discB - discA;
      return a.stock - b.stock;
    })
    .slice(0, limit);
}
