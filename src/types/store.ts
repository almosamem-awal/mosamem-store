export type OrderStatus = 'new' | 'processing' | 'shipping' | 'delivered' | 'returned';

export type PaymentMethodId = 'mada' | 'apple_pay' | 'credit_card' | 'tamara' | 'tabby' | 'cod';

export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  provider: 'email' | 'google';
}

export interface ProductVariant {
  id: string;
  nameAr: string;
  hex: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  categoryId: string;
  price: number;
  salePrice?: number | null;
  costPrice: number;
  stock: number;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  featured?: boolean;
  rating: number;
  reviewsCount: number;
  deliveryBadge?: string;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string;
  bulkDiscountPercent: number;
}

export type CouponDiscountType = 'percent' | 'fixed' | 'free_shipping';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  value: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  isWheelReward: boolean;
  wheelLabel?: string;
  wheelColor?: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface OrderItemSnapshot {
  productId: string;
  sku: string;
  nameAr: string;
  variantNameAr?: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  isGuest: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  district: string;
  streetAddress: string;
  notes?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discountAmount: number;
  referralDiscount: number;
  couponCode?: string | null;
  referralCode?: string | null;
  referralCommission: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethodId;
  status: OrderStatus;
  createdAt: string;
}

export interface GatewayConfig {
  enabled: boolean;
  publicKey: string;
  secretKey: string;
  mode: 'sandbox' | 'live';
}

export interface PaymentGatewaysSettings {
  moyasar: GatewayConfig;
  tamara: GatewayConfig;
  tabby: GatewayConfig;
  stripe: GatewayConfig;
}

export interface MarketingSeoSettings {
  metaPixelId: string;
  googleAnalyticsId: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  web3FormsAccessKey: string;
  managerEmail: string;
}

export interface ReturnPolicySettings {
  titleAr: string;
  updatedAt: string;
  contentAr: string;
}

export interface ReferralAttribution {
  code: string;
  capturedAt: string;
  discountPercent: number;
  commissionRate: number;
}

export interface StoreAnalytics {
  totalRevenue: number;
  grossProfit: number;
  totalOrders: number;
  averageOrderValue: number;
  returnRatePercent: number;
  topSellingProducts: Array<{
    productId: string;
    nameAr: string;
    unitsSold: number;
    revenue: number;
  }>;
}

export type ThemePresetId =
  | 'official_green'
  | 'jumia_classic'
  | 'tech_blue'
  | 'royal_luxury'
  | 'custom';

export interface StoreThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  themePreset: ThemePresetId;
}

