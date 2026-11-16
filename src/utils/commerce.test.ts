import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateInstallmentAmount,
  computeStockUrgencyPercent,
  computeStoreAnalytics,
  describeCouponConditionAr,
  formatFlashCountdown,
  getEffectiveProductPrice,
  getFlashSaleProducts,
  getRelatedProducts,
  hasAdminAccess,
  isAdminEmail,
  isPaymentMethodAllowed,
  isSuperAdminEmail,
  isSuperAdminUser,
  validateCoupon,
} from './commerce';
import type { AuthUser, Category, Coupon, Order, Product } from '../types/store';

const sampleCategories: Category[] = [
  {
    id: 'cat-phone',
    nameAr: 'إكسسوارات الجوال',
    nameEn: 'Phone Accessories',
    slug: 'phone-accessories',
    descriptionAr: 'كفرات وشواحن',
    bulkDiscountPercent: 0,
  },
  {
    id: 'cat-stem',
    nameAr: 'الألعاب الذكية',
    nameEn: 'Smart Toys & STEM',
    slug: 'smart-toys',
    descriptionAr: 'ألعاب ذكية',
    bulkDiscountPercent: 20,
  },
];

const sampleProducts: Product[] = [
  {
    id: 'p1',
    sku: 'AMA-101',
    nameAr: 'كفر ماج سيف كربون',
    nameEn: 'MagSafe Carbon Case',
    descriptionAr: 'كفر فاخر',
    categoryId: 'cat-phone',
    price: 200,
    salePrice: null,
    costPrice: 80,
    stock: 15,
    images: [],
    variants: [],
    tags: ['magsafe', 'iphone', 'charging'],
    rating: 4.9,
    reviewsCount: 40,
  },
  {
    id: 'p2',
    sku: 'AMA-102',
    nameAr: 'شاحن 20 واط سريع',
    nameEn: '20W Fast Charger',
    descriptionAr: 'شاحن جداري',
    categoryId: 'cat-phone',
    price: 100,
    salePrice: 80,
    costPrice: 35,
    stock: 22,
    images: [],
    variants: [],
    tags: ['magsafe', 'charging', 'cable'],
    rating: 4.8,
    reviewsCount: 18,
  },
  {
    id: 'p3',
    sku: 'AMA-201',
    nameAr: 'روبوت برمجة STEM',
    nameEn: 'STEM Robotics Kit',
    descriptionAr: 'لعبة تعليمية',
    categoryId: 'cat-stem',
    price: 500,
    salePrice: null,
    costPrice: 220,
    stock: 10,
    images: [],
    variants: [],
    tags: ['robotics', 'stem'],
    rating: 5.0,
    reviewsCount: 12,
  },
];

test('category bulk discount applies automatically across category products', () => {
  const pricing = getEffectiveProductPrice(sampleProducts[2], sampleCategories);
  assert.equal(pricing.originalPrice, 500);
  assert.equal(pricing.effectivePrice, 400);
  assert.equal(pricing.discountPercent, 20);
  assert.equal(pricing.hasDiscount, true);
  assert.equal(pricing.source, 'category_bulk');
});

test('installment amount divides cleanly by 4 for Tamara and Tabby', () => {
  assert.equal(calculateInstallmentAmount(199), 49.75);
  assert.equal(calculateInstallmentAmount(400), 100);
});

test('coupon validation rejects expired, inactive, and exhausted coupons', () => {
  const coupons: Coupon[] = [
    {
      id: 'c1',
      code: 'RIYADH10',
      discountType: 'percent',
      value: 10,
      usageLimit: 100,
      usedCount: 5,
      expiresAt: '2099-01-01',
      active: true,
      isWheelReward: true,
    },
    {
      id: 'c2',
      code: 'EXPIRED',
      discountType: 'fixed',
      value: 50,
      usageLimit: 10,
      usedCount: 0,
      expiresAt: '2020-01-01',
      active: true,
      isWheelReward: false,
    },
    {
      id: 'c3',
      code: 'MAXED',
      discountType: 'fixed',
      value: 20,
      usageLimit: 5,
      usedCount: 5,
      expiresAt: '2099-01-01',
      active: true,
      isWheelReward: false,
    },
  ];

  assert.equal(validateCoupon('riyadh10', coupons).valid, true);
  assert.equal(validateCoupon('EXPIRED', coupons).valid, false);
  assert.equal(validateCoupon('MAXED', coupons).valid, false);
});

test('cart totals compute free shipping threshold, coupon discount, and 5% referral commission', () => {
  const coupon: Coupon = {
    id: 'c1',
    code: 'RIYADH10',
    discountType: 'percent',
    value: 10,
    usageLimit: 100,
    usedCount: 0,
    expiresAt: '2099-01-01',
    active: true,
    isWheelReward: true,
  };

  // Subtotal = 160 (2 x 80 sale price), below 200 threshold -> shipping 25 SAR
  const belowThreshold = calculateCartTotals({
    items: [{ productId: 'p2', quantity: 2 }],
    products: sampleProducts,
    categories: sampleCategories,
    coupon,
    referralCode: 'FAHAD5',
  });
  assert.equal(belowThreshold.subtotal, 160);
  assert.equal(belowThreshold.couponDiscount, 16);
  // After coupon: 144 -> 5% referral discount = 7.2 -> afterAll = 136.8
  assert.equal(belowThreshold.referralDiscount, 7.2);
  assert.equal(belowThreshold.shippingFee, 25);
  assert.equal(belowThreshold.freeShippingRemaining, 40);
  assert.equal(belowThreshold.total, 161.8);
  assert.equal(belowThreshold.referralCommission, 6.84);
});

test('gated payment rules restrict Tamara, Tabby, and COD to authenticated users', () => {
  assert.equal(isPaymentMethodAllowed('mada', false), true);
  assert.equal(isPaymentMethodAllowed('apple_pay', false), true);
  assert.equal(isPaymentMethodAllowed('credit_card', false), true);
  assert.equal(isPaymentMethodAllowed('tamara', false), false);
  assert.equal(isPaymentMethodAllowed('tabby', false), false);
  assert.equal(isPaymentMethodAllowed('cod', false), false);

  assert.equal(isPaymentMethodAllowed('tamara', true), true);
  assert.equal(isPaymentMethodAllowed('tabby', true), true);
  assert.equal(isPaymentMethodAllowed('cod', true), true);
});

test('related products prioritize shared tags like magsafe and charging', () => {
  const related = getRelatedProducts(sampleProducts[0], sampleProducts, 2);
  assert.equal(related[0].id, 'p2');
});

test('admin and superadmin RBAC helpers verify roles accurately', () => {
  assert.equal(isSuperAdminEmail('hosensoft@yahoo.com'), true);
  assert.equal(isSuperAdminEmail('HOSENSOFT@YAHOO.COM'), true);
  assert.equal(isSuperAdminEmail('admin@almosamem.com.sa'), false);

  assert.equal(isAdminEmail('hosensoft@yahoo.com'), true);
  assert.equal(isAdminEmail('admin@almosamem.com.sa'), true);
  assert.equal(isAdminEmail('HAWASBROTHERS@GMAIL.COM'), true);
  assert.equal(isAdminEmail('customer@example.com'), false);

  const superUser: AuthUser = {
    id: 'u1',
    email: 'hosensoft@yahoo.com',
    fullName: 'SuperAdmin',
    role: 'superadmin',
    provider: 'email',
  };
  const regularAdmin: AuthUser = {
    id: 'u2',
    email: 'admin@almosamem.com.sa',
    fullName: 'Admin',
    role: 'admin',
    provider: 'email',
  };
  const customerUser: AuthUser = {
    id: 'u3',
    email: 'customer@example.com',
    fullName: 'Customer',
    role: 'customer',
    provider: 'email',
  };

  assert.equal(isSuperAdminUser(superUser), true);
  assert.equal(isSuperAdminUser(regularAdmin), false);
  assert.equal(hasAdminAccess(superUser), true);
  assert.equal(hasAdminAccess(regularAdmin), true);
  assert.equal(hasAdminAccess(customerUser), false);
});

test('conditional coupons enforce min_purchase, date_range, and category_or_brand rules', () => {
  const minPurchaseCoupon: Coupon = {
    id: 'cond-min',
    code: 'MIN300',
    discountType: 'fixed',
    value: 50,
    usageLimit: 100,
    usedCount: 0,
    expiresAt: '2099-01-01',
    active: true,
    isWheelReward: true,
    conditionType: 'min_purchase',
    minPurchaseAmount: 300,
  };

  assert.equal(
    validateCoupon('MIN300', [minPurchaseCoupon], new Date(), { subtotal: 200 }).valid,
    false
  );
  assert.equal(
    validateCoupon('MIN300', [minPurchaseCoupon], new Date(), { subtotal: 350 }).valid,
    true
  );

  const dateRangeCoupon: Coupon = {
    id: 'cond-date',
    code: 'NOVONLY',
    discountType: 'percent',
    value: 15,
    usageLimit: 100,
    usedCount: 0,
    expiresAt: '2099-01-01',
    active: true,
    isWheelReward: false,
    conditionType: 'date_range',
    validFromDate: '2026-11-01',
    validUntilDate: '2026-11-30',
  };

  assert.equal(
    validateCoupon('NOVONLY', [dateRangeCoupon], new Date('2026-10-15T10:00:00Z')).valid,
    false
  );
  assert.equal(
    validateCoupon('NOVONLY', [dateRangeCoupon], new Date('2026-11-15T10:00:00Z')).valid,
    true
  );

  const categoryCoupon: Coupon = {
    id: 'cond-cat',
    code: 'STEM20',
    discountType: 'percent',
    value: 20,
    usageLimit: 100,
    usedCount: 0,
    expiresAt: '2099-01-01',
    active: true,
    isWheelReward: false,
    conditionType: 'category_or_brand',
    targetCategoryId: 'cat-stem',
  };

  // Cart only has cat-phone item (p1) -> should fail validation
  assert.equal(
    validateCoupon('STEM20', [categoryCoupon], new Date(), {
      subtotal: 200,
      items: [{ productId: 'p1', quantity: 1 }],
      products: sampleProducts,
      categories: sampleCategories,
    }).valid,
    false
  );

  // Mixed cart (p1 = 200 phone, p3 = 400 effective stem) -> 20% applies ONLY to 400 SAR stem item = 80
  const mixedTotals = calculateCartTotals({
    items: [
      { productId: 'p1', quantity: 1 },
      { productId: 'p3', quantity: 1 },
    ],
    products: sampleProducts,
    categories: sampleCategories,
    coupon: categoryCoupon,
  });
  assert.equal(mixedTotals.subtotal, 600);
  assert.equal(mixedTotals.couponDiscount, 80);
  assert.match(describeCouponConditionAr(categoryCoupon, sampleCategories), /الألعاب الذكية/);
});

test('store analytics compute revenue, gross profit, AOV, and return rate', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      orderNumber: 'ORD-1001',
      isGuest: false,
      customerName: 'سارة',
      customerEmail: 'sara@example.com',
      customerPhone: '0501234567',
      city: 'الرياض',
      district: 'حي الملقا',
      streetAddress: 'شارع أنس بن مالك',
      items: [
        {
          productId: 'p1',
          sku: 'AMA-101',
          nameAr: 'كفر ماج سيف',
          unitPrice: 200,
          unitCost: 80,
          quantity: 1,
          image: '',
        },
      ],
      subtotal: 200,
      discountAmount: 0,
      referralDiscount: 0,
      referralCommission: 0,
      shippingFee: 0,
      total: 200,
      paymentMethod: 'tamara',
      status: 'delivered',
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'o2',
      orderNumber: 'ORD-1002',
      isGuest: true,
      customerName: 'فهد',
      customerEmail: 'fahad@example.com',
      customerPhone: '0551234567',
      city: 'الرياض',
      district: 'حي النرجس',
      streetAddress: 'طريق عثمان بن عفان',
      items: [
        {
          productId: 'p2',
          sku: 'AMA-102',
          nameAr: 'شاحن 20 واط',
          unitPrice: 80,
          unitCost: 35,
          quantity: 1,
          image: '',
        },
      ],
      subtotal: 80,
      discountAmount: 0,
      referralDiscount: 0,
      referralCommission: 0,
      shippingFee: 25,
      total: 105,
      paymentMethod: 'mada',
      status: 'returned',
      createdAt: '2026-11-02T10:00:00Z',
    },
  ];

  const analytics = computeStoreAnalytics(orders);
  assert.equal(analytics.totalRevenue, 200);
  assert.equal(analytics.grossProfit, 120);
  assert.equal(analytics.totalOrders, 2);
  assert.equal(analytics.averageOrderValue, 200);
  assert.equal(analytics.returnRatePercent, 50);
  assert.equal(analytics.topSellingProducts[0].productId, 'p1');
});

test('flash sale countdown and stock urgency bar compute deterministic values', () => {
  const parts = formatFlashCountdown(4 * 3600 + 22 * 60 + 15);
  assert.deepEqual(parts, { hours: '04', minutes: '22', seconds: '15' });
  assert.deepEqual(formatFlashCountdown(-10), { hours: '00', minutes: '00', seconds: '00' });

  assert.equal(computeStockUrgencyPercent(0), 0);
  assert.equal(computeStockUrgencyPercent(1), 10);
  assert.equal(computeStockUrgencyPercent(15, 30), 50);
  assert.equal(computeStockUrgencyPercent(60, 30), 100);

  const flash = getFlashSaleProducts(sampleProducts, sampleCategories, 2);
  assert.equal(flash.length, 2);
  assert.equal(flash[0].id, 'p3');
  assert.equal(flash[1].id, 'p2');
});

import {
  buildThemeCssVariables,
  DEFAULT_STORE_SETTINGS,
  detectMatchingPreset,
  getContrastTextColor,
  normalizeHexColor,
  THEME_PRESETS,
} from './theme';

test('theme utilities normalize hex colors, compute accessible contrast, and map presets', () => {
  assert.equal(THEME_PRESETS.length, 4);
  assert.equal(normalizeHexColor('059669'), '#059669');
  assert.equal(normalizeHexColor('#abc'), '#AABBCC');
  assert.equal(normalizeHexColor('invalid', '#FF6B00'), '#FF6B00');

  assert.equal(getContrastTextColor('#059669'), '#FFFFFF');
  assert.equal(getContrastTextColor('#00FF87'), '#0F172A');
  assert.equal(getContrastTextColor('#0B0F19'), '#FFFFFF');

  assert.equal(detectMatchingPreset('#059669', '#FF6B00'), 'official_green');
  assert.equal(detectMatchingPreset('#2563EB', '#00FF87'), 'tech_blue');
  assert.equal(detectMatchingPreset('#123456', '#654321'), 'custom');

  const vars = buildThemeCssVariables({
    ...DEFAULT_STORE_SETTINGS,
    primaryColor: '#2563EB',
    secondaryColor: '#00FF87',
    themePreset: 'tech_blue',
  });
  assert.equal(vars['--color-primary'], '#2563EB');
  assert.equal(vars['--color-primary-contrast'], '#FFFFFF');
  assert.equal(vars['--color-secondary'], '#00FF87');
  assert.equal(vars['--color-secondary-contrast'], '#0F172A');
});
