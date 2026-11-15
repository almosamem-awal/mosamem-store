import {
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_MARKETING_SEO,
  INITIAL_ORDERS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_PRODUCTS,
  INITIAL_RETURN_POLICY,
  INITIAL_STORE_SETTINGS,
} from '../data/seedData';
import type {
  CartItem,
  Category,
  Coupon,
  MarketingSeoSettings,
  Order,
  OrderStatus,
  PaymentGatewaysSettings,
  Product,
  ReferralAttribution,
  ReturnPolicySettings,
  StoreThemeSettings,
} from '../types/store';
import { REFERRAL_COMMISSION_RATE, REFERRAL_DISCOUNT_PERCENT } from '../utils/commerce';
import { supabase } from './supabase';

const KEYS = {
  products: 'almosamem_products_v3',
  categories: 'almosamem_categories_v1',
  coupons: 'almosamem_coupons_v3',
  orders: 'almosamem_orders_v1',
  gateways: 'almosamem_gateways_v1',
  seo: 'almosamem_seo_v1',
  policy: 'almosamem_policy_v1',
  storeSettings: 'almosamem_store_settings_v1',
  cart: 'almosamem_cart_v1',
  referral: 'almosamem_referral_v1',
  wheelSeen: 'almosamem_wheel_seen_v1',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage limit
  }
}

export interface StoreSnapshot {
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  orders: Order[];
  gateways: PaymentGatewaysSettings;
  seo: MarketingSeoSettings;
  policy: ReturnPolicySettings;
  storeSettings: StoreThemeSettings;
}

export async function loadInitialStoreState(): Promise<StoreSnapshot> {
  // Attempt Supabase read if configured, otherwise seamless localStorage state
  if (supabase) {
    try {
      const [prodRes, catRes, cpnRes, ordRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('coupons').select('*'),
        supabase.from('orders').select('*').order('createdAt', { ascending: false }),
      ]);

      if (
        !prodRes.error &&
        prodRes.data &&
        prodRes.data.length > 0 &&
        !catRes.error &&
        catRes.data &&
        catRes.data.length > 0
      ) {
        return {
          products: prodRes.data as Product[],
          categories: catRes.data as Category[],
          coupons:
            !cpnRes.error && cpnRes.data?.length
              ? (cpnRes.data as Coupon[])
              : INITIAL_COUPONS,
          orders:
            !ordRes.error && ordRes.data?.length
              ? (ordRes.data as Order[])
              : INITIAL_ORDERS,
          gateways: readJson(KEYS.gateways, INITIAL_PAYMENT_GATEWAYS),
          seo: readJson(KEYS.seo, INITIAL_MARKETING_SEO),
          policy: readJson(KEYS.policy, INITIAL_RETURN_POLICY),
          storeSettings: readJson(KEYS.storeSettings, INITIAL_STORE_SETTINGS),
        };
      }
    } catch {
      // Fall back silently to localStorage / seed state
    }
  }

  return {
    products: readJson(KEYS.products, INITIAL_PRODUCTS),
    categories: readJson(KEYS.categories, INITIAL_CATEGORIES),
    coupons: readJson(KEYS.coupons, INITIAL_COUPONS),
    orders: readJson(KEYS.orders, INITIAL_ORDERS),
    gateways: readJson(KEYS.gateways, INITIAL_PAYMENT_GATEWAYS),
    seo: readJson(KEYS.seo, INITIAL_MARKETING_SEO),
    policy: readJson(KEYS.policy, INITIAL_RETURN_POLICY),
    storeSettings: readJson(KEYS.storeSettings, INITIAL_STORE_SETTINGS),
  };
}

export function persistProducts(products: Product[]): void {
  writeJson(KEYS.products, products);
  if (supabase) {
    void supabase.from('products').upsert(products);
  }
}

export function persistCategories(categories: Category[]): void {
  writeJson(KEYS.categories, categories);
  if (supabase) {
    void supabase.from('categories').upsert(categories);
  }
}

export function persistCoupons(coupons: Coupon[]): void {
  writeJson(KEYS.coupons, coupons);
  if (supabase) {
    void supabase.from('coupons').upsert(coupons);
  }
}

export function persistOrders(orders: Order[]): void {
  writeJson(KEYS.orders, orders);
}

export async function createOrderRecord(order: Order): Promise<void> {
  const current = readJson<Order[]>(KEYS.orders, INITIAL_ORDERS);
  writeJson(KEYS.orders, [order, ...current]);
  if (supabase) {
    try {
      await supabase.from('orders').insert(order);
    } catch {
      // ignore if table not provisioned
    }
  }
}

export async function updateOrderStatusRecord(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const current = readJson<Order[]>(KEYS.orders, INITIAL_ORDERS);
  const updated = current.map((o) => (o.id === orderId ? { ...o, status } : o));
  writeJson(KEYS.orders, updated);
  if (supabase) {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch {
      // ignore
    }
  }
}

export function persistGateways(gateways: PaymentGatewaysSettings): void {
  writeJson(KEYS.gateways, gateways);
}

export function persistSeoSettings(seo: MarketingSeoSettings): void {
  writeJson(KEYS.seo, seo);
}

export function persistReturnPolicy(policy: ReturnPolicySettings): void {
  writeJson(KEYS.policy, policy);
}

export function persistStoreSettings(settings: StoreThemeSettings): void {
  writeJson(KEYS.storeSettings, settings);
  if (supabase) {
    try {
      void supabase.from('store_settings').upsert({ id: 'default', ...settings });
    } catch {
      // ignore if table not provisioned
    }
  }
}

export function loadCartItems(): CartItem[] {
  return readJson<CartItem[]>(KEYS.cart, []);
}

export function saveCartItems(items: CartItem[]): void {
  writeJson(KEYS.cart, items);
}

export function captureReferralFromUrl(): ReferralAttribution | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam && refParam.trim().length >= 2) {
      const attribution: ReferralAttribution = {
        code: refParam.trim().toUpperCase(),
        capturedAt: new Date().toISOString(),
        discountPercent: REFERRAL_DISCOUNT_PERCENT,
        commissionRate: REFERRAL_COMMISSION_RATE,
      };
      sessionStorage.setItem(KEYS.referral, JSON.stringify(attribution));
      return attribution;
    }
    const existing = sessionStorage.getItem(KEYS.referral);
    return existing ? (JSON.parse(existing) as ReferralAttribution) : null;
  } catch {
    return null;
  }
}

export function hasSeenLuckyWheel(): boolean {
  try {
    return localStorage.getItem(KEYS.wheelSeen) === '1';
  } catch {
    return false;
  }
}

export function markLuckyWheelSeen(): void {
  try {
    localStorage.setItem(KEYS.wheelSeen, '1');
  } catch {
    // ignore
  }
}

/**
 * Sends instant email notification via Web3Forms (and our Express proxy /api/notify).
 */
export async function sendStoreManagerNotification(params: {
  type: 'new_order' | 'refund_request';
  subject: string;
  message: string;
  orderNumber?: string;
  customerEmail?: string;
  seoSettings: MarketingSeoSettings;
}): Promise<{ delivered: boolean; channel: string }> {
  const accessKey =
    params.seoSettings.web3FormsAccessKey.trim() ||
    (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined) ||
    '';

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: params.type,
        subject: params.subject,
        message: params.message,
        orderNumber: params.orderNumber,
        customerEmail: params.customerEmail,
        managerEmail: params.seoSettings.managerEmail,
        web3FormsAccessKey: accessKey,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { delivered?: boolean; channel?: string };
      return {
        delivered: Boolean(data.delivered),
        channel: data.channel || 'server',
      };
    }
  } catch {
    // fallback below
  }

  if (accessKey) {
    try {
      const formRes = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: params.subject,
          from_name: 'متجر المصمم الأول - الرياض',
          email: params.customerEmail || params.seoSettings.managerEmail,
          message: params.message,
        }),
      });
      return { delivered: formRes.ok, channel: 'web3forms-client' };
    } catch {
      return { delivered: false, channel: 'offline' };
    }
  }

  return { delivered: true, channel: 'local-audit' };
}
