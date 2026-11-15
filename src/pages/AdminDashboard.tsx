import React, { useState } from 'react';
import {
  BarChart3,
  Package,
  FolderKanban,
  Ticket,
  Truck,
  CreditCard,
  LineChart,
  FileText,
  Plus,
  Trash2,
  Edit3,
  MessageCircle,
  Lock,
  Save,
  Check,
  Search,
  Palette,
  RotateCcw,
} from 'lucide-react';
import type {
  AuthUser,
  Category,
  Coupon,
  CouponDiscountType,
  MarketingSeoSettings,
  Order,
  OrderStatus,
  PaymentGatewaysSettings,
  Product,
  ReturnPolicySettings,
  StoreThemeSettings,
} from '../types/store';
import {
  buildWhatsAppOrderLink,
  computeStoreAnalytics,
  formatSAR,
  isAdminEmail,
} from '../utils/commerce';
import {
  DEFAULT_STORE_SETTINGS,
  detectMatchingPreset,
  getContrastTextColor,
  normalizeHexColor,
  THEME_PRESETS,
} from '../utils/theme';
import { createStudioProductImage } from '../lib/productArt';
import { signInWithEmailPassword } from '../lib/supabase';
import { BrandLogo } from '../components/BrandLogo';

interface AdminDashboardProps {
  currentUser: AuthUser | null;
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  orders: Order[];
  gateways: PaymentGatewaysSettings;
  seoSettings: MarketingSeoSettings;
  returnPolicy: ReturnPolicySettings;
  storeSettings: StoreThemeSettings;
  onAuthenticated: (user: AuthUser) => void;
  onSaveProducts: (products: Product[]) => void;
  onSaveCategories: (categories: Category[]) => void;
  onSaveCoupons: (coupons: Coupon[]) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSaveGateways: (gateways: PaymentGatewaysSettings) => void;
  onSaveSeo: (seo: MarketingSeoSettings) => void;
  onSavePolicy: (policy: ReturnPolicySettings) => void;
  onSaveStoreSettings: (settings: StoreThemeSettings) => void;
  onBackToStore: () => void;
}

type AdminTab =
  | 'analytics'
  | 'branding'
  | 'products'
  | 'categories'
  | 'coupons'
  | 'orders'
  | 'gateways'
  | 'seo'
  | 'policy';

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  processing: 'قيد التجهيز',
  shipping: 'جاري التوصيل',
  delivered: 'تم التسليم',
  returned: 'مرتجع',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  products,
  categories,
  coupons,
  orders,
  gateways,
  seoSettings,
  returnPolicy,
  storeSettings,
  onAuthenticated,
  onSaveProducts,
  onSaveCategories,
  onSaveCoupons,
  onUpdateOrderStatus,
  onSaveGateways,
  onSaveSeo,
  onSavePolicy,
  onSaveStoreSettings,
  onBackToStore,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Product Search & CRUD state
  const [prodSearch, setProdSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Product Form fields
  const [pSku, setPSku] = useState('');
  const [pNameAr, setPNameAr] = useState('');
  const [pNameEn, setPNameEn] = useState('');
  const [pDescAr, setPDescAr] = useState('');
  const [pCatId, setPCatId] = useState(categories[0]?.id || '');
  const [pPrice, setPPrice] = useState('199');
  const [pSalePrice, setPSalePrice] = useState('');
  const [pCostPrice, setPCostPrice] = useState('75');
  const [pStock, setPStock] = useState('20');
  const [pImageUrl, setPImageUrl] = useState('');
  const [pTags, setPTags] = useState('magsafe, luxury');

  // Category creation state
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Coupon creation state
  const [newCpnCode, setNewCpnCode] = useState('');
  const [newCpnType, setNewCpnType] = useState<CouponDiscountType>('percent');
  const [newCpnVal, setNewCpnVal] = useState('10');
  const [newCpnLimit, setNewCpnLimit] = useState('200');
  const [newCpnExpiry, setNewCpnExpiry] = useState('2027-12-31');
  const [newCpnWheel, setNewCpnWheel] = useState(true);
  const [newCpnWheelLabel, setNewCpnWheelLabel] = useState('خصم 10%');

  // Local editable states for Gateways, SEO, Policy, and Branding/Theme
  const [draftGateways, setDraftGateways] = useState<PaymentGatewaysSettings>(gateways);
  const [draftSeo, setDraftSeo] = useState<MarketingSeoSettings>(seoSettings);
  const [draftPolicy, setDraftPolicy] = useState<ReturnPolicySettings>(returnPolicy);
  const [draftTheme, setDraftTheme] = useState<StoreThemeSettings>(storeSettings);
  const [savedNotice, setSavedNotice] = useState('');

  React.useEffect(() => {
    setDraftTheme(storeSettings);
  }, [storeSettings]);

  const isAuthorizedAdmin = isAdminEmail(currentUser?.email);

  const showSaved = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(''), 3000);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!isAdminEmail(loginEmail)) {
      setLoginError('هذا البريد غير مصرح له بالدخول إلى لوحة الإدارة التنفيذية.');
      return;
    }
    setLoginLoading(true);
    const res = await signInWithEmailPassword(loginEmail, loginPassword);
    setLoginLoading(false);
    if (res.error || !res.user) {
      setLoginError(res.error || 'تعذر التحقق من بيانات الدخول.');
      return;
    }
    onAuthenticated(res.user);
  };

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-[75vh] bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-8 shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0B0F19] text-[#00FF87] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#0B0F19]">
                بوابة الإدارة التنفيذية (/admin)
              </h1>
              <p className="text-xs text-slate-500">
                مخصصة لحسابات الإدارة المعتمدة فقط
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              أنت مسجل حالياً بحساب ({currentUser.email}) وهو حساب عميل. يرجى تسجيل الدخول بحساب مدير معتمد.
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="adm-email" className="block text-xs font-semibold text-slate-700 mb-1">
                البريد الإلكتروني للإدارة
              </label>
              <input
                id="adm-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@almosamem.com.sa"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="adm-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                كلمة المرور
              </label>
              <input
                id="adm-pass"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
              />
            </div>

            {loginError && (
              <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-lg bg-[#0B0F19] hover:bg-[#059669] text-white font-bold text-sm transition-colors"
            >
              {loginLoading ? 'جاري التحقق...' : 'دخول لوحة الإدارة'}
            </button>
          </form>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">حسابات الإدارة الافتراضية:</div>
            <div className="font-mono">admin@almosamem.com.sa / Admin123!</div>
            <div className="font-mono">hawasbrothers@gmail.com / Admin123!</div>
          </div>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-[#0B0F19]"
          >
            العودة إلى واجهة المتجر
          </button>
        </div>
      </div>
    );
  }

  const analytics = computeStoreAnalytics(orders);

  const openAddProduct = () => {
    setEditingProduct(null);
    setIsAddingProduct(true);
    setPSku(`AMA-NEW-${Math.floor(100 + Math.random() * 899)}`);
    setPNameAr('');
    setPNameEn('');
    setPDescAr('');
    setPCatId(categories[0]?.id || '');
    setPPrice('249');
    setPSalePrice('');
    setPCostPrice('95');
    setPStock('15');
    setPImageUrl('');
    setPTags('magsafe, luxury');
  };

  const openEditProduct = (prod: Product) => {
    setIsAddingProduct(false);
    setEditingProduct(prod);
    setPSku(prod.sku);
    setPNameAr(prod.nameAr);
    setPNameEn(prod.nameEn);
    setPDescAr(prod.descriptionAr);
    setPCatId(prod.categoryId);
    setPPrice(String(prod.price));
    setPSalePrice(prod.salePrice ? String(prod.salePrice) : '');
    setPCostPrice(String(prod.costPrice));
    setPStock(String(prod.stock));
    setPImageUrl(prod.images[0] || '');
    setPTags(prod.tags.join(', '));
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Math.max(1, Number(pPrice) || 0);
    const numericSale = pSalePrice.trim() ? Number(pSalePrice) : null;
    const numericCost = Math.max(0, Number(pCostPrice) || 0);
    const numericStock = Math.max(0, Math.floor(Number(pStock) || 0));
    const parsedTags = pTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fallbackImg = createStudioProductImage({
      archetype: 'desk',
      primaryHex: '#0F172A',
      accentHex: '#00FF87',
      label: pSku || 'AMA',
    });

    const finalImage = pImageUrl.trim() || fallbackImg;

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              sku: pSku.trim(),
              nameAr: pNameAr.trim(),
              nameEn: pNameEn.trim(),
              descriptionAr: pDescAr.trim(),
              categoryId: pCatId,
              price: numericPrice,
              salePrice: numericSale,
              costPrice: numericCost,
              stock: numericStock,
              images: [finalImage, ...p.images.slice(1)],
              tags: parsedTags,
            }
          : p
      );
      onSaveProducts(updated);
      setEditingProduct(null);
      showSaved('تم تحديث بيانات المنتج بنجاح.');
      return;
    }

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sku: pSku.trim(),
      nameAr: pNameAr.trim(),
      nameEn: pNameEn.trim() || 'Luxury Tech Item',
      descriptionAr: pDescAr.trim() || 'منتج فاخر من تشكيلة المصمم الأول بالرياض.',
      categoryId: pCatId,
      price: numericPrice,
      salePrice: numericSale,
      costPrice: numericCost,
      stock: numericStock,
      images: [finalImage],
      variants: [{ id: 'v1', nameAr: 'أوبسيديان', hex: '#0F172A', imageUrl: finalImage }],
      tags: parsedTags,
      rating: 5.0,
      reviewsCount: 1,
    };

    onSaveProducts([newProd, ...products]);
    setIsAddingProduct(false);
    showSaved('تمت إضافة المنتج الجديد للكتالوج.');
  };

  const handleDeleteProduct = (id: string) => {
    onSaveProducts(products.filter((p) => p.id !== id));
    showSaved('تم حذف المنتج.');
  };

  const handleCategoryBulkDiscount = (catId: string, discountPercent: number) => {
    const clamped = Math.max(0, Math.min(80, Math.round(discountPercent)));
    const updated = categories.map((c) =>
      c.id === catId ? { ...c, bulkDiscountPercent: clamped } : c
    );
    onSaveCategories(updated);
    showSaved(`تم تحديث الخصم الجماعي للقسم (${clamped}%) وانعكست الأسعار فوراً في المتجر.`);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameAr.trim()) return;
    const created: Category = {
      id: `cat-${Date.now()}`,
      nameAr: newCatNameAr.trim(),
      nameEn: newCatNameEn.trim() || newCatNameAr.trim(),
      slug: `cat-${Date.now()}`,
      descriptionAr: newCatDesc.trim() || 'قسم مميز في المصمم الأول',
      bulkDiscountPercent: 0,
    };
    onSaveCategories([...categories, created]);
    setNewCatNameAr('');
    setNewCatNameEn('');
    setNewCatDesc('');
    showSaved('تمت إضافة القسم بنجاح.');
  };

  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) return;
    onSaveCategories(categories.filter((c) => c.id !== catId));
    showSaved('تم حذف القسم.');
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCpnCode.trim().toUpperCase();
    if (!code) return;
    const created: Coupon = {
      id: `cpn-${Date.now()}`,
      code,
      discountType: newCpnType,
      value: Math.max(0, Number(newCpnVal) || 0),
      usageLimit: Math.max(1, Number(newCpnLimit) || 100),
      usedCount: 0,
      expiresAt: newCpnExpiry,
      active: true,
      isWheelReward: newCpnWheel,
      wheelLabel: newCpnWheelLabel.trim() || code,
      wheelColor: coupons.length % 2 === 0 ? '#059669' : '#0F172A',
    };
    onSaveCoupons([created, ...coupons]);
    setNewCpnCode('');
    showSaved(`تم إنشاء الكوبون ${code}.`);
  };

  const filteredProducts = products.filter((p) => {
    const q = prodSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'analytics', label: 'التحليلات التنفيذية', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'branding', label: '🎨 الهوية والمظهر', icon: <Palette className="w-4 h-4" /> },
    { id: 'products', label: `المنتجات (${products.length})`, icon: <Package className="w-4 h-4" /> },
    { id: 'categories', label: 'الأقسام والخصم الجماعي', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'coupons', label: 'الكوبونات وعجلة الحظ', icon: <Ticket className="w-4 h-4" /> },
    { id: 'orders', label: `الطلبات (${orders.length})`, icon: <Truck className="w-4 h-4" /> },
    { id: 'gateways', label: 'بوابات الدفع API', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'seo', label: 'البكسل و SEO', icon: <LineChart className="w-4 h-4" /> },
    { id: 'policy', label: 'سياسة الاسترجاع', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-2">
          <div className="bg-[#0B0F19] text-white rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#00FF87]">EXECUTIVE CMS</div>
            <div className="font-display text-base font-bold">{currentUser?.fullName}</div>
            <div className="text-[11px] text-slate-400 truncate">{currentUser?.email}</div>
          </div>

          <nav aria-label="أقسام لوحة الإدارة" className="bg-white rounded-xl border border-slate-200 p-2 space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-right ${
                    active
                      ? 'bg-[#0B0F19] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B0F19]'
                  }`}
                >
                  <span className={active ? 'text-[#00FF87]' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#0B0F19]"
          >
            معاينة المتجر المباشر
          </button>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 space-y-6">
          {savedNotice && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-[#059669]" />
              <span>{savedNotice}</span>
            </div>
          )}

          {/* 1. BRANDING & DYNAMIC THEME MANAGER */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#1E293B]">
                    🎨 الهوية والمظهر (Branding & Theme)
                  </h1>
                  <p className="text-xs text-[#64748B] mt-1">
                    تخصيص الألوان الرئيسية والفرعية والشعار — تتحدث واجهة المتجر بالكامل لحظياً بدون إعادة تحميل
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftTheme(DEFAULT_STORE_SETTINGS);
                      onSaveStoreSettings(DEFAULT_STORE_SETTINGS);
                      showSaved('تمت استعادة الهوية الخضراء المعتمدة للمصمم الأول.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#1E293B]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>الافتراضي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sanitized: StoreThemeSettings = {
                        primaryColor: normalizeHexColor(
                          draftTheme.primaryColor,
                          DEFAULT_STORE_SETTINGS.primaryColor
                        ),
                        secondaryColor: normalizeHexColor(
                          draftTheme.secondaryColor,
                          DEFAULT_STORE_SETTINGS.secondaryColor
                        ),
                        logoUrl: draftTheme.logoUrl.trim(),
                        themePreset: detectMatchingPreset(
                          draftTheme.primaryColor,
                          draftTheme.secondaryColor
                        ),
                      };
                      setDraftTheme(sanitized);
                      onSaveStoreSettings(sanitized);
                      showSaved('تم حفظ التغييرات وتحديث هوية المتجر وألوانه لحظياً!');
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: normalizeHexColor(
                        draftTheme.primaryColor,
                        DEFAULT_STORE_SETTINGS.primaryColor
                      ),
                      color: getContrastTextColor(
                        normalizeHexColor(
                          draftTheme.primaryColor,
                          DEFAULT_STORE_SETTINGS.primaryColor
                        )
                      ),
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ التغييرات</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Theme Presets */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-[#1E293B]">
                  1. قوالب الهوية الجاهزة (ضغطة زر واحدة)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = draftTheme.themePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        data-testid={`theme-preset-${preset.id}`}
                        onClick={() => {
                          const next: StoreThemeSettings = {
                            ...draftTheme,
                            primaryColor: preset.primaryColor,
                            secondaryColor: preset.secondaryColor,
                            themePreset: preset.id,
                          };
                          setDraftTheme(next);
                        }}
                        className={`p-3.5 rounded-xl border-2 text-right space-y-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#059669] bg-emerald-50/40 shadow-sm'
                            : 'border-slate-200 bg-[#F8F9FA] hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#1E293B]">
                            {preset.emoji} {preset.labelAr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-md border border-slate-200 shadow-xs"
                            style={{ backgroundColor: preset.primaryColor }}
                            title={`Primary ${preset.primaryColor}`}
                          />
                          <span
                            className="w-6 h-6 rounded-md border border-slate-200 shadow-xs"
                            style={{ backgroundColor: preset.secondaryColor }}
                            title={`Secondary ${preset.secondaryColor}`}
                          />
                          <span className="text-[11px] font-mono text-[#64748B]">
                            {preset.primaryColor}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-snug">
                          {preset.descriptionAr}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive HEX Color Pickers & Logo Manager */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-5">
                  <h2 className="font-display text-base font-bold text-[#1E293B]">
                    2. منتقي الألوان التفاعلي والشعار (HEX & Logo)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-slate-200 space-y-2">
                      <label htmlFor="primary-color-hex" className="block text-xs font-bold text-[#1E293B]">
                        اللون الأساسي (Primary)
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          aria-label="منتقي اللون الأساسي"
                          value={normalizeHexColor(
                            draftTheme.primaryColor,
                            DEFAULT_STORE_SETTINGS.primaryColor
                          )}
                          onChange={(e) =>
                            setDraftTheme({
                              ...draftTheme,
                              primaryColor: e.target.value.toUpperCase(),
                              themePreset: detectMatchingPreset(
                                e.target.value,
                                draftTheme.secondaryColor
                              ),
                            })
                          }
                          className="w-11 h-10 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5"
                        />
                        <input
                          id="primary-color-hex"
                          type="text"
                          value={draftTheme.primaryColor}
                          onChange={(e) =>
                            setDraftTheme({
                              ...draftTheme,
                              primaryColor: e.target.value,
                              themePreset: detectMatchingPreset(
                                e.target.value,
                                draftTheme.secondaryColor
                              ),
                            })
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                          placeholder="#059669"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-slate-200 space-y-2">
                      <label htmlFor="secondary-color-hex" className="block text-xs font-bold text-[#1E293B]">
                        اللون الثانوي والفلاش (Secondary)
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          aria-label="منتقي اللون الثانوي"
                          value={normalizeHexColor(
                            draftTheme.secondaryColor,
                            DEFAULT_STORE_SETTINGS.secondaryColor
                          )}
                          onChange={(e) =>
                            setDraftTheme({
                              ...draftTheme,
                              secondaryColor: e.target.value.toUpperCase(),
                              themePreset: detectMatchingPreset(
                                draftTheme.primaryColor,
                                e.target.value
                              ),
                            })
                          }
                          className="w-11 h-10 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5"
                        />
                        <input
                          id="secondary-color-hex"
                          type="text"
                          value={draftTheme.secondaryColor}
                          onChange={(e) =>
                            setDraftTheme({
                              ...draftTheme,
                              secondaryColor: e.target.value,
                              themePreset: detectMatchingPreset(
                                draftTheme.primaryColor,
                                e.target.value
                              ),
                            })
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                          placeholder="#FF6B00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo URL Manager */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label htmlFor="store-logo-url" className="block text-xs font-bold text-[#1E293B]">
                      رابط صورة الشعار المخصص (Logo URL) — اتركه فارغاً لاستخدام الشعار الرسمي ثلاثي الأبعاد
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="store-logo-url"
                        type="url"
                        value={draftTheme.logoUrl}
                        onChange={(e) =>
                          setDraftTheme({ ...draftTheme, logoUrl: e.target.value })
                        }
                        placeholder="https://example.com/logo.png أو /assets/brand/almosamem-mark.png"
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:border-[#059669] focus:outline-none"
                      />
                      {draftTheme.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setDraftTheme({ ...draftTheme, logoUrl: '' })}
                          className="px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#1E293B]"
                        >
                          مسح
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Storefront Preview Box */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <h2 className="font-display text-base font-bold text-[#1E293B]">
                    3. معاينة حية قبل الحفظ
                  </h2>

                  <div className="rounded-xl border border-slate-200 bg-[#F8F9FA] p-4 space-y-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-3">
                      <BrandLogo variant="lockup-light" logoUrl={draftTheme.logoUrl} />
                      <span
                        className="px-3 py-1.5 rounded-md text-xs font-bold"
                        style={{
                          backgroundColor: normalizeHexColor(draftTheme.primaryColor),
                          color: getContrastTextColor(draftTheme.primaryColor),
                        }}
                      >
                        ابحث
                      </span>
                    </div>

                    <div
                      className="rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold"
                      style={{
                        backgroundColor: normalizeHexColor(draftTheme.secondaryColor),
                        color: getContrastTextColor(draftTheme.secondaryColor),
                      }}
                    >
                      <span>Flash Sales كل يوم!! ⚡</span>
                      <span className="font-mono">02:45:18</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="flex-1 text-center py-2 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: normalizeHexColor(draftTheme.primaryColor),
                          color: getContrastTextColor(draftTheme.primaryColor),
                        }}
                      >
                        أضف إلى السلة
                      </span>
                      <span
                        className="px-3 py-2 rounded-lg text-xs font-extrabold"
                        style={{
                          backgroundColor: normalizeHexColor(draftTheme.secondaryColor),
                          color: getContrastTextColor(draftTheme.secondaryColor),
                        }}
                      >
                        -30%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#0B0F19]">
                  لوحة التحليلات التنفيذية — الرياض
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  مؤشرات الأداء المالي والمبيعات والربحية الفعلية لمتجر المصمم الأول
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">إجمالي المبيعات</div>
                  <div className="text-xl font-bold text-[#0B0F19] tabular-nums mt-1">
                    {formatSAR(analytics.totalRevenue)}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">إجمالي الربح (Gross Profit)</div>
                  <div className="text-xl font-bold text-[#059669] tabular-nums mt-1">
                    {formatSAR(analytics.grossProfit)}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">إجمالي الطلبات</div>
                  <div className="text-xl font-bold text-[#0B0F19] tabular-nums mt-1">
                    {analytics.totalOrders}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">متوسط قيمة الطلب (AOV)</div>
                  <div className="text-xl font-bold text-[#0B0F19] tabular-nums mt-1">
                    {formatSAR(analytics.averageOrderValue)}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">نسبة المرتجعات</div>
                  <div className="text-xl font-bold text-[#FF6B00] tabular-nums mt-1">
                    {analytics.returnRatePercent}%
                  </div>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 font-display text-base font-bold text-[#0B0F19]">
                  المنتجات الأكثر مبيعاً في الرياض
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">المنتج</th>
                        <th className="py-3 px-4 font-semibold">الوحدات المباعة</th>
                        <th className="py-3 px-4 font-semibold">الإيرادات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.topSellingProducts.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-500">
                            لا توجد مبيعات مسجلة بعد.
                          </td>
                        </tr>
                      ) : (
                        analytics.topSellingProducts.map((tp) => (
                          <tr key={tp.productId} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-[#0B0F19]">{tp.nameAr}</td>
                            <td className="py-3 px-4 tabular-nums">{tp.unitsSold}</td>
                            <td className="py-3 px-4 tabular-nums font-bold text-[#059669]">
                              {formatSAR(tp.revenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRODUCTS CRUD */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                    إدارة كتالوج المنتجات ({products.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    إضافة وتعديل وحذف المنتجات وتحديد الأسعار والمخزون والوسوم (Tags)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>

              {(isAddingProduct || editingProduct) && (
                <form
                  onSubmit={handleSaveProductForm}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <h3 className="font-display text-base font-bold text-[#0B0F19]">
                    {editingProduct ? `تعديل: ${editingProduct.nameAr}` : 'إضافة منتج جديد'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">رمز SKU</label>
                      <input
                        type="text"
                        required
                        value={pSku}
                        onChange={(e) => setPSku(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">الاسم بالعربية</label>
                      <input
                        type="text"
                        required
                        value={pNameAr}
                        onChange={(e) => setPNameAr(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">الاسم بالإنجليزية</label>
                      <input
                        type="text"
                        value={pNameEn}
                        onChange={(e) => setPNameEn(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">القسم</label>
                      <select
                        value={pCatId}
                        onChange={(e) => setPCatId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">السعر الأساسي (ر.س)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={pPrice}
                        onChange={(e) => setPPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">سعر التخفيض (اختياري)</label>
                      <input
                        type="number"
                        min="0"
                        value={pSalePrice}
                        onChange={(e) => setPSalePrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">التكلفة (ر.س)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={pCostPrice}
                        onChange={(e) => setPCostPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">الكمية بالمخزون</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={pStock}
                        onChange={(e) => setPStock(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">رابط الصورة (Image URL)</label>
                      <input
                        type="text"
                        value={pImageUrl}
                        onChange={(e) => setPImageUrl(e.target.value)}
                        placeholder="اتركه فارغاً لتوليد صورة استوديو تلقائياً"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">الوسوم (Tags مفصولة بفاصلة)</label>
                      <input
                        type="text"
                        value={pTags}
                        onChange={(e) => setPTags(e.target.value)}
                        placeholder="magsafe, charging, iphone"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">الوصف</label>
                    <textarea
                      rows={2}
                      value={pDescAr}
                      onChange={(e) => setPDescAr(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold"
                    >
                      حفظ المنتج
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddingProduct(false);
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="بحث بالاسم أو SKU..."
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">المنتج</th>
                        <th className="py-3 px-4">السعر</th>
                        <th className="py-3 px-4">المخزون</th>
                        <th className="py-3 px-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-slate-600">{prod.sku}</td>
                          <td className="py-3 px-4 font-semibold text-[#0B0F19]">{prod.nameAr}</td>
                          <td className="py-3 px-4 tabular-nums">
                            {prod.salePrice ? (
                              <span>
                                <strong className="text-[#059669]">{formatSAR(prod.salePrice)}</strong>{' '}
                                <span className="line-through text-slate-400">{prod.price}</span>
                              </span>
                            ) : (
                              <span>{formatSAR(prod.price)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 tabular-nums">{prod.stock}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`تعديل ${prod.nameAr}`}
                                onClick={() => openEditProduct(prod)}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label={`حذف ${prod.nameAr}`}
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 rounded hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. CATEGORIES & BULK DISCOUNT MANAGER */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                  إدارة الأقسام والخصومات الجماعية التلقائية
                </h2>
                <p className="text-xs text-slate-500">
                  تطبيق نسبة خصم على قسم كامل يعيد احتساب الأسعار المشطوبة تلقائياً في واجهة المتجر
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-bold text-[#0B0F19]">
                          {cat.nameAr}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{cat.descriptionAr}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        aria-label={`حذف قسم ${cat.nameAr}`}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">نسبة الخصم الجماعي للقسم:</span>
                        <span className="font-bold tabular-nums text-[#FF6B00]">
                          {cat.bulkDiscountPercent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[0, 10, 15, 25].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleCategoryBulkDiscount(cat.id, pct)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              cat.bulkDiscountPercent === pct
                                ? 'bg-[#0B0F19] text-white border-[#0B0F19]'
                                : 'border-slate-200 text-slate-700 hover:border-slate-400'
                            }`}
                          >
                            {pct === 0 ? 'بدون خصم' : `${pct}%`}
                          </button>
                        ))}
                        <input
                          type="number"
                          min={0}
                          max={80}
                          aria-label={`نسبة الخصم المخصصة لقسم ${cat.nameAr}`}
                          value={cat.bulkDiscountPercent}
                          onChange={(e) =>
                            handleCategoryBulkDiscount(cat.id, Number(e.target.value))
                          }
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs tabular-nums text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddCategory}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
              >
                <h3 className="font-display text-sm font-bold text-[#0B0F19]">إضافة قسم جديد</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newCatNameAr}
                    onChange={(e) => setNewCatNameAr(e.target.value)}
                    placeholder="اسم القسم بالعربية"
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    placeholder="Category Name (EN)"
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="وصف مختصر للقسم"
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold"
                >
                  إضافة القسم
                </button>
              </form>
            </div>
          )}

          {/* 4. COUPONS & WHEEL MANAGER */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                  إدارة الكوبونات وعجلة الحظ التفاعلية
                </h2>
                <p className="text-xs text-slate-500">
                  إنشاء أكواد الخصم والتحكم في جوائز عجلة الحظ وحدود الاستخدام
                </p>
              </div>

              <form
                onSubmit={handleAddCoupon}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">الكود</label>
                    <input
                      type="text"
                      required
                      value={newCpnCode}
                      onChange={(e) => setNewCpnCode(e.target.value)}
                      placeholder="RIYADH20"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">النوع</label>
                    <select
                      value={newCpnType}
                      onChange={(e) => setNewCpnType(e.target.value as CouponDiscountType)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="percent">نسبة %</option>
                      <option value="fixed">مبلغ ثابت ر.س</option>
                      <option value="free_shipping">شحن مجاني</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">القيمة</label>
                    <input
                      type="number"
                      value={newCpnVal}
                      onChange={(e) => setNewCpnVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">حد الاستخدام</label>
                    <input
                      type="number"
                      value={newCpnLimit}
                      onChange={(e) => setNewCpnLimit(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={newCpnExpiry}
                      onChange={(e) => setNewCpnExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">عنوان العجلة</label>
                    <input
                      type="text"
                      value={newCpnWheelLabel}
                      onChange={(e) => setNewCpnWheelLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={newCpnWheel}
                      onChange={(e) => setNewCpnWheel(e.target.checked)}
                    />
                    <span>إظهار الكوبون كجائزة في عجلة الحظ</span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold"
                  >
                    إضافة الكوبون
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">الكود</th>
                      <th className="py-3 px-4">القيمة</th>
                      <th className="py-3 px-4">الاستخدام</th>
                      <th className="py-3 px-4">عجلة الحظ</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.map((cpn) => (
                      <tr key={cpn.id}>
                        <td className="py-3 px-4 font-mono font-bold text-[#0B0F19]">{cpn.code}</td>
                        <td className="py-3 px-4 tabular-nums">
                          {cpn.discountType === 'percent'
                            ? `${cpn.value}%`
                            : cpn.discountType === 'fixed'
                            ? formatSAR(cpn.value)
                            : 'شحن مجاني'}
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          {cpn.usedCount} / {cpn.usageLimit}
                        </td>
                        <td className="py-3 px-4">{cpn.isWheelReward ? cpn.wheelLabel : '—'}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() =>
                              onSaveCoupons(
                                coupons.map((c) =>
                                  c.id === cpn.id ? { ...c, active: !c.active } : c
                                )
                              )
                            }
                            className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                              cpn.active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {cpn.active ? 'مفعل' : 'متوقف'}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            aria-label={`حذف كوبون ${cpn.code}`}
                            onClick={() => onSaveCoupons(coupons.filter((c) => c.id !== cpn.id))}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                  إدارة الطلبات والتوصيل في الرياض
                </h2>
                <p className="text-xs text-slate-500">
                  تحديث حالات الشحن ومراسلة عملاء الرياض عبر الواتساب بضغطة زر
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">رقم الطلب</th>
                        <th className="py-3 px-4">العميل</th>
                        <th className="py-3 px-4">الحي</th>
                        <th className="py-3 px-4">الإجمالي</th>
                        <th className="py-3 px-4">الدفع</th>
                        <th className="py-3 px-4">الحالة</th>
                        <th className="py-3 px-4">واتساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-[#0B0F19]">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0B0F19]">{ord.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {ord.customerPhone}
                            </div>
                          </td>
                          <td className="py-3 px-4">{ord.district}</td>
                          <td className="py-3 px-4 tabular-nums font-bold text-[#059669]">
                            {formatSAR(ord.total)}
                          </td>
                          <td className="py-3 px-4 font-mono">{ord.paymentMethod}</td>
                          <td className="py-3 px-4">
                            <select
                              aria-label={`تحديث حالة الطلب ${ord.orderNumber}`}
                              value={ord.status}
                              onChange={(e) =>
                                onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                            >
                              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((st) => (
                                <option key={st} value={st}>
                                  {STATUS_LABELS[st]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={buildWhatsAppOrderLink(ord)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-semibold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. PAYMENT GATEWAYS API */}
          {activeTab === 'gateways' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                    إعدادات بوابات الدفع API
                  </h2>
                  <p className="text-xs text-slate-500">
                    تفعيل وإدارة مفاتيح الربط لبوابات مدى، Apple Pay، تمارا، تابي، و Stripe
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSaveGateways(draftGateways);
                    showSaved('تم حفظ إعدادات بوابات الدفع.');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الإعدادات</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  [
                    { key: 'moyasar', title: 'Moyasar (مدى + Apple Pay)' },
                    { key: 'tamara', title: 'Tamara (تقسيط 4 دفعات)' },
                    { key: 'tabby', title: 'Tabby (تقسيط بدون فوائد)' },
                    { key: 'stripe', title: 'Stripe (بطاقات دولية)' },
                  ] as const
                ).map(({ key, title }) => {
                  const gw = draftGateways[key];
                  return (
                    <div
                      key={key}
                      className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-bold text-[#0B0F19]">{title}</h3>
                        <label className="inline-flex items-center gap-2 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={gw.enabled}
                            onChange={(e) =>
                              setDraftGateways({
                                ...draftGateways,
                                [key]: { ...gw, enabled: e.target.checked },
                              })
                            }
                          />
                          <span>{gw.enabled ? 'مفعّلة' : 'معطّلة'}</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Public / Publishable Key
                        </label>
                        <input
                          type="text"
                          value={gw.publicKey}
                          onChange={(e) =>
                            setDraftGateways({
                              ...draftGateways,
                              [key]: { ...gw, publicKey: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Secret / API Token
                        </label>
                        <input
                          type="password"
                          value={gw.secretKey}
                          onChange={(e) =>
                            setDraftGateways({
                              ...draftGateways,
                              [key]: { ...gw, secretKey: e.target.value },
                            })
                          }
                          placeholder="sk_live_..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. PIXEL & SEO MANAGER */}
          {activeTab === 'seo' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                    مدير Meta Pixel وتحسين محركات البحث SEO والإشعارات
                  </h2>
                  <p className="text-xs text-slate-500">
                    ربط التتبع التلقائي لأحداث PageView و ViewContent و AddToCart و Purchase
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSaveSeo(draftSeo);
                    showSaved('تم تحديث إعدادات البكسل و SEO وإشعارات Web3Forms.');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ وتفعيل</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Meta (Facebook/Instagram) Pixel ID</label>
                    <input
                      type="text"
                      value={draftSeo.metaPixelId}
                      onChange={(e) => setDraftSeo({ ...draftSeo, metaPixelId: e.target.value })}
                      placeholder="123456789012345"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Google Analytics Measurement ID</label>
                    <input
                      type="text"
                      value={draftSeo.googleAnalyticsId}
                      onChange={(e) =>
                        setDraftSeo({ ...draftSeo, googleAnalyticsId: e.target.value })
                      }
                      placeholder="G-XXXXXXXXXX"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">عنوان الصفحة (Meta Title)</label>
                  <input
                    type="text"
                    value={draftSeo.metaTitle}
                    onChange={(e) => setDraftSeo({ ...draftSeo, metaTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">وصف الميتا (Meta Description)</label>
                  <textarea
                    rows={2}
                    value={draftSeo.metaDescription}
                    onChange={(e) =>
                      setDraftSeo({ ...draftSeo, metaDescription: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">الكلمات المفتاحية (Keywords)</label>
                  <input
                    type="text"
                    value={draftSeo.metaKeywords}
                    onChange={(e) => setDraftSeo({ ...draftSeo, metaKeywords: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Web3Forms Access Key (إشعارات الطلبات الفورية)
                    </label>
                    <input
                      type="text"
                      value={draftSeo.web3FormsAccessKey}
                      onChange={(e) =>
                        setDraftSeo({ ...draftSeo, web3FormsAccessKey: e.target.value })
                      }
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">بريد مدير المتجر للإشعارات</label>
                    <input
                      type="email"
                      value={draftSeo.managerEmail}
                      onChange={(e) => setDraftSeo({ ...draftSeo, managerEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. RETURN POLICY EDITOR */}
          {activeTab === 'policy' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                    محرر سياسة الاسترجاع والاستبدال
                  </h2>
                  <p className="text-xs text-slate-500">
                    تحديث الشروط والضمان المعروض للعملاء في المتجر
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSavePolicy({
                      ...draftPolicy,
                      updatedAt: new Date().toISOString().slice(0, 10),
                    });
                    showSaved('تم تحديث سياسة الاسترجاع والاستبدال.');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ السياسة</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">عنوان السياسة</label>
                  <input
                    type="text"
                    value={draftPolicy.titleAr}
                    onChange={(e) => setDraftPolicy({ ...draftPolicy, titleAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">نص السياسة والضمان</label>
                  <textarea
                    rows={12}
                    value={draftPolicy.contentAr}
                    onChange={(e) =>
                      setDraftPolicy({ ...draftPolicy, contentAr: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
