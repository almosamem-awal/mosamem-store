import { useEffect, useState } from 'react';
import type {
  AuthUser,
  CartItem,
  Category,
  Coupon,
  MarketingSeoSettings,
  Order,
  OrderStatus,
  PaymentGatewaysSettings,
  Product,
  ReturnPolicySettings,
} from './types/store';
import {
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_MARKETING_SEO,
  INITIAL_ORDERS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_PRODUCTS,
  INITIAL_RETURN_POLICY,
  INITIAL_STORE_SETTINGS,
} from './data/seedData';
import {
  captureReferralFromUrl,
  createOrderRecord,
  hasSeenLuckyWheel,
  loadCartItems,
  loadInitialStoreState,
  markLuckyWheelSeen,
  persistCategories,
  persistCoupons,
  persistGateways,
  persistProducts,
  persistReturnPolicy,
  persistSeoSettings,
  persistStoreSettings,
  saveCartItems,
  updateOrderStatusRecord,
} from './lib/api';
import { getCurrentSessionUser } from './lib/supabase';
import { syncSeoAndPixels, trackPixelEvent } from './lib/analytics';
import { validateCoupon } from './utils/commerce';
import { buildThemeCssVariables } from './utils/theme';
import { Navbar, type MarketplaceQuickFilter } from './components/Navbar';
import { StorefrontPage } from './pages/StorefrontPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { LuckySpinWheelModal } from './components/LuckySpinWheelModal';
import { ReturnPolicyModal } from './components/ReturnPolicyModal';

export default function App() {
  const [activeView, setActiveView] = useState<'store' | 'admin'>(() =>
    window.location.pathname.startsWith('/admin') ? 'admin' : 'store'
  );

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [gateways, setGateways] = useState<PaymentGatewaysSettings>(INITIAL_PAYMENT_GATEWAYS);
  const [seoSettings, setSeoSettings] = useState<MarketingSeoSettings>(INITIAL_MARKETING_SEO);
  const [returnPolicy, setReturnPolicy] = useState<ReturnPolicySettings>(INITIAL_RETURN_POLICY);
  const [storeSettings, setStoreSettings] = useState(INITIAL_STORE_SETTINGS);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartItems());
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  // Storefront search & filter controls shared with Jumia header
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [specialFilter, setSpecialFilter] = useState<MarketplaceQuickFilter>('all');

  // Hydrate store state, session, referral attribution, and SEO/Pixels
  useEffect(() => {
    let mounted = true;
    void loadInitialStoreState().then((snapshot) => {
      if (!mounted) return;
      setProducts(snapshot.products);
      setCategories(snapshot.categories);
      setCoupons(snapshot.coupons);
      setOrders(snapshot.orders);
      setGateways(snapshot.gateways);
      setSeoSettings(snapshot.seo);
      setReturnPolicy(snapshot.policy);
      setStoreSettings(snapshot.storeSettings);
      syncSeoAndPixels(snapshot.seo);
    });

    void getCurrentSessionUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });

    const ref = captureReferralFromUrl();
    if (ref) {
      setReferralCode(ref.code);
    }

    const handlePopState = () => {
      setActiveView(window.location.pathname.startsWith('/admin') ? 'admin' : 'store');
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      mounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // First-time visitor Spin Wheel dwell trigger (>= 12s, never on initial load)
  useEffect(() => {
    if (activeView !== 'store' || hasSeenLuckyWheel()) return;
    const timer = window.setTimeout(() => {
      if (hasSeenLuckyWheel()) return;
      setIsWheelOpen(true);
      markLuckyWheelSeen();
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [activeView]);

  useEffect(() => {
    saveCartItems(cartItems);
  }, [cartItems]);

  const themeCssVars = buildThemeCssVariables(storeSettings);

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    Object.entries(themeCssVars).forEach(([prop, value]) => {
      rootStyle.setProperty(prop, value);
    });
  }, [themeCssVars]);

  const navigateView = (view: 'store' | 'admin') => {
    setActiveView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, variantId?: string, quantity = 1) => {
    const resolvedVariantId = variantId || product.variants[0]?.id;
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.id && i.variantId === resolvedVariantId
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.variantId === resolvedVariantId
            ? { ...i, quantity: Math.min(product.stock || 99, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { productId: product.id, variantId: resolvedVariantId, quantity }];
    });

    trackPixelEvent('AddToCart', {
      content_name: product.nameAr,
      content_ids: [product.sku],
      value: product.salePrice ?? product.price,
      currency: 'SAR',
    });

    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, variantId?: string) => {
    const resolvedVariantId = variantId || product.variants[0]?.id;
    setCartItems((prev) => {
      const exists = prev.some(
        (i) => i.productId === product.id && i.variantId === resolvedVariantId
      );
      if (exists) return prev;
      return [...prev, { productId: product.id, variantId: resolvedVariantId, quantity: 1 }];
    });
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = (
    productId: string,
    variantId: string | undefined,
    qty: number
  ) => {
    if (qty <= 0) {
      setCartItems((prev) =>
        prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
      );
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i
      )
    );
  };

  const handleRemoveCartItem = (productId: string, variantId: string | undefined) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const handleOrderCompleted = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    void createOrderRecord(newOrder);

    // Decrement product stock
    const updatedProducts = products.map((p) => {
      const orderedQty = newOrder.items
        .filter((item) => item.productId === p.id)
        .reduce((acc, item) => acc + item.quantity, 0);
      return orderedQty > 0 ? { ...p, stock: Math.max(0, p.stock - orderedQty) } : p;
    });
    setProducts(updatedProducts);
    persistProducts(updatedProducts);

    // Increment coupon usage count if applied
    if (newOrder.couponCode) {
      const updatedCoupons = coupons.map((c) =>
        c.code.toUpperCase() === newOrder.couponCode?.toUpperCase()
          ? { ...c, usedCount: c.usedCount + 1 }
          : c
      );
      setCoupons(updatedCoupons);
      persistCoupons(updatedCoupons);
    }

    setCartItems([]);
    setAppliedCoupon(null);
  };

  const handleApplyCouponCode = (code: string) => {
    const validation = validateCoupon(code, coupons);
    if (validation.valid && validation.coupon) {
      setAppliedCoupon(validation.coupon);
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      dir="rtl"
      style={themeCssVars as React.CSSProperties}
      className="min-h-screen flex flex-col overflow-x-hidden bg-[#F8F9FA] text-[#1E293B]"
    >
      <Navbar
        cartCount={totalCartCount}
        currentUser={currentUser}
        activeView={activeView}
        products={products}
        categories={categories}
        logoUrl={storeSettings.logoUrl}
        searchQuery={searchQuery}
        selectedCategoryId={selectedCategoryId}
        specialFilter={specialFilter}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() =>
          window.setTimeout(() => {
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 50)
        }
        onSelectCategory={setSelectedCategoryId}
        onSelectSpecialFilter={setSpecialFilter}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onNavigateView={navigateView}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWheel={() => {
          markLuckyWheelSeen();
          setIsWheelOpen(true);
        }}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onJumpToFlashSales={() => {
          navigateView('store');
          window.setTimeout(() => {
            document.getElementById('flash-sales-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
      />

      <main className="flex-1">
        {activeView === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            products={products}
            categories={categories}
            coupons={coupons}
            orders={orders}
            gateways={gateways}
            seoSettings={seoSettings}
            returnPolicy={returnPolicy}
            storeSettings={storeSettings}
            onAuthenticated={(user) => setCurrentUser(user)}
            onSaveProducts={(next) => {
              setProducts(next);
              persistProducts(next);
            }}
            onSaveCategories={(next) => {
              setCategories(next);
              persistCategories(next);
            }}
            onSaveCoupons={(next) => {
              setCoupons(next);
              persistCoupons(next);
            }}
            onUpdateOrderStatus={(orderId, status: OrderStatus) => {
              setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status } : o))
              );
              void updateOrderStatusRecord(orderId, status);
            }}
            onSaveGateways={(next) => {
              setGateways(next);
              persistGateways(next);
            }}
            onSaveSeo={(next) => {
              setSeoSettings(next);
              persistSeoSettings(next);
              syncSeoAndPixels(next);
            }}
            onSavePolicy={(next) => {
              setReturnPolicy(next);
              persistReturnPolicy(next);
            }}
            onSaveStoreSettings={(next) => {
              setStoreSettings(next);
              persistStoreSettings(next);
            }}
            onBackToStore={() => navigateView('store')}
          />
        ) : (
          <StorefrontPage
            products={products}
            categories={categories}
            referralCode={referralCode}
            logoUrl={storeSettings.logoUrl}
            searchQuery={searchQuery}
            selectedCategoryId={selectedCategoryId}
            specialFilter={specialFilter}
            onSearchChange={setSearchQuery}
            onSelectCategory={setSelectedCategoryId}
            onSelectSpecialFilter={setSpecialFilter}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onQuickAdd={(p) => handleAddToCart(p, p.variants[0]?.id, 1)}
            onApplyCouponCode={handleApplyCouponCode}
            onOpenWheel={() => {
              markLuckyWheelSeen();
              setIsWheelOpen(true);
            }}
            onOpenPolicy={() => setIsPolicyOpen(true)}
            onNavigateAdmin={() => navigateView('admin')}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        allProducts={products}
        categories={categories}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        products={products}
        categories={categories}
        appliedCoupon={appliedCoupon}
        referralCode={referralCode}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={(user) => setCurrentUser(user)}
        onSignedOut={() => setCurrentUser(null)}
        onContinueAsGuest={() => {
          if (cartItems.length > 0) setIsCheckoutOpen(true);
        }}
        showGuestOption={cartItems.length > 0}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        items={cartItems}
        products={products}
        categories={categories}
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        referralCode={referralCode}
        currentUser={currentUser}
        gateways={gateways}
        seoSettings={seoSettings}
        onClose={() => setIsCheckoutOpen(false)}
        onApplyCoupon={(c) => setAppliedCoupon(c)}
        onOpenAuthForCheckout={() => {
          setIsAuthOpen(true);
        }}
        onOrderCompleted={handleOrderCompleted}
      />

      <LuckySpinWheelModal
        isOpen={isWheelOpen}
        coupons={coupons}
        onClose={() => {
          markLuckyWheelSeen();
          setIsWheelOpen(false);
        }}
        onApplyCouponCode={handleApplyCouponCode}
        onAppliedAndProceed={() => {
          if (cartItems.length > 0) {
            setIsCheckoutOpen(true);
          } else {
            setIsCartOpen(true);
          }
        }}
      />

      <ReturnPolicyModal
        isOpen={isPolicyOpen}
        policy={returnPolicy}
        seoSettings={seoSettings}
        onClose={() => setIsPolicyOpen(false)}
      />
    </div>
  );
}
