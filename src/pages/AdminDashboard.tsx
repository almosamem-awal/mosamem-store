import React, { useEffect, useState } from 'react';
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
  Users,
  UserCog,
  Store,
  RefreshCw,
  KeyRound,
  X,
  PhoneCall,
  Image as ImageIcon,
  Eye,
  EyeOff,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  Upload,
} from 'lucide-react';
import type {
  AuthUser,
  Category,
  Coupon,
  CouponConditionType,
  CouponDiscountType,
  HeroSlide,
  ManagedUserRecord,
  MarketingSeoSettings,
  Order,
  OrderStatus,
  PaymentGatewaysSettings,
  Product,
  QuickFeatureVisibility,
  ReturnPolicySettings,
  SallaIntegrationSettings,
  SallaWebhookEventRecord,
  StorefrontVisibilitySettings,
  StoreThemeSettings,
  UserRole,
} from '../types/store';
import {
  buildWhatsAppOrderLink,
  computeStoreAnalytics,
  describeCouponConditionAr,
  formatSAR,
  hasAdminAccess,
  isSuperAdminEmail,
  isSuperAdminUser,
} from '../utils/commerce';
import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_VISIBILITY_SETTINGS,
  detectMatchingPreset,
  getContrastTextColor,
  normalizeHexColor,
  resolveHeroSlides,
  resolveStoreVisibility,
  THEME_PRESETS,
} from '../utils/theme';
import { createStudioProductImage } from '../lib/productArt';
import {
  changeUserPassword,
  deleteManagedUser,
  listManagedUsers,
  resetManagedUserPassword,
  signInWithEmailPassword,
  signOutUser,
  updateManagedUserRole,
  updateUserProfile,
} from '../lib/supabase';
import { fetchSallaWebhookEvents, triggerSallaSync } from '../lib/api';
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
  sallaSettings: SallaIntegrationSettings;
  onAuthenticated: (user: AuthUser) => void;
  onSaveProducts: (products: Product[]) => void;
  onSaveCategories: (categories: Category[]) => void;
  onSaveCoupons: (coupons: Coupon[]) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSaveGateways: (gateways: PaymentGatewaysSettings) => void;
  onSaveSeo: (seo: MarketingSeoSettings) => void;
  onSavePolicy: (policy: ReturnPolicySettings) => void;
  onSaveStoreSettings: (settings: StoreThemeSettings) => void;
  onSaveSallaSettings: (salla: SallaIntegrationSettings) => void;
  onBackToStore: () => void;
}

type AdminTab =
  | 'analytics'
  | 'branding'
  | 'storefront_layout'
  | 'hero'
  | 'products'
  | 'categories'
  | 'coupons'
  | 'orders'
  | 'gateways'
  | 'salla'
  | 'users'
  | 'profile'
  | 'seo'
  | 'policy';

const SUPERADMIN_ONLY_TABS: AdminTab[] = [
  'branding',
  'storefront_layout',
  'gateways',
  'salla',
  'users',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  shipping: 'جاري التوصيل',
  delivered: 'تم التسليم',
  returned: 'مرتجع',
};

const CONDITION_LABELS: Record<CouponConditionType, string> = {
  none: 'بدون شروط مسبقة',
  min_purchase: 'أن يتجاوز مشتريات بمبلغ محدد',
  date_range: 'أن يتم الشراء في الفترة من : إلى',
  category_or_brand: 'ينطبق على ماركة أو تصنيف محدد',
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
  sallaSettings,
  onAuthenticated,
  onSaveProducts,
  onSaveCategories,
  onSaveCoupons,
  onUpdateOrderStatus,
  onSaveGateways,
  onSaveSeo,
  onSavePolicy,
  onSaveStoreSettings,
  onSaveSallaSettings,
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

  // Category creation & editing state
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatNameAr, setEditCatNameAr] = useState('');
  const [editCatNameEn, setEditCatNameEn] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Coupon creation state
  const [newCpnCode, setNewCpnCode] = useState('');
  const [newCpnType, setNewCpnType] = useState<CouponDiscountType>('percent');
  const [newCpnVal, setNewCpnVal] = useState('10');
  const [newCpnLimit, setNewCpnLimit] = useState('200');
  const [newCpnExpiry, setNewCpnExpiry] = useState('2027-12-31');
  const [newCpnWheel, setNewCpnWheel] = useState(true);
  const [newCpnWheelLabel, setNewCpnWheelLabel] = useState('خصم 10%');
  const [newCpnCondType, setNewCpnCondType] = useState<CouponConditionType>('none');
  const [newCpnCondDetails, setNewCpnCondDetails] = useState('');
  const [newCpnFromDate, setNewCpnFromDate] = useState('');
  const [newCpnUntilDate, setNewCpnUntilDate] = useState('');
  const [newCpnTargetCat, setNewCpnTargetCat] = useState('');
  const [newCpnPrizeMessage, setNewCpnPrizeMessage] = useState('');

  // Coupon Edit Modal state
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Local editable states for Gateways, SEO, Policy, Theme, Salla
  const [draftGateways, setDraftGateways] = useState<PaymentGatewaysSettings>(gateways);
  const [draftSeo, setDraftSeo] = useState<MarketingSeoSettings>(seoSettings);
  const [draftPolicy, setDraftPolicy] = useState<ReturnPolicySettings>(returnPolicy);
  const [draftTheme, setDraftTheme] = useState<StoreThemeSettings>(storeSettings);
  const [draftHeroSlides, setDraftHeroSlides] = useState<HeroSlide[]>(() =>
    resolveHeroSlides(storeSettings.heroSlides)
  );
  const [draftVisibility, setDraftVisibility] = useState<StorefrontVisibilitySettings>(() =>
    resolveStoreVisibility(storeSettings.visibility)
  );
  const [draftSalla, setDraftSalla] = useState<SallaIntegrationSettings>(sallaSettings);
  const [sallaSyncing, setSallaSyncing] = useState<'catalog' | 'orders' | null>(null);
  const [sallaEvents, setSallaEvents] = useState<SallaWebhookEventRecord[]>([]);
  const [savedNotice, setSavedNotice] = useState('');

  // SuperAdmin User Management state
  const [managedUsers, setManagedUsers] = useState<ManagedUserRecord[]>(() => listManagedUsers());
  const [userSearch, setUserSearch] = useState('');
  const [resetPwdTargetId, setResetPwdTargetId] = useState<string | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');

  // Admin Profile & Security state
  const [corrEmail, setCorrEmail] = useState(currentUser?.correspondenceEmail || currentUser?.email || '');
  const [adminPhone, setAdminPhone] = useState(currentUser?.phone || '');
  const [smsSentCode, setSmsSentCode] = useState<string | null>(null);
  const [smsVerifyInput, setSmsVerifyInput] = useState('');
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setDraftTheme(storeSettings);
    setDraftHeroSlides(resolveHeroSlides(storeSettings.heroSlides));
    setDraftVisibility(resolveStoreVisibility(storeSettings.visibility));
  }, [storeSettings]);

  useEffect(() => {
    setDraftSalla(sallaSettings);
  }, [sallaSettings]);

  useEffect(() => {
    if (currentUser) {
      setCorrEmail(currentUser.correspondenceEmail || currentUser.email);
      setAdminPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const isAuthorizedAdmin = hasAdminAccess(currentUser);
  const isSuperAdmin = isSuperAdminUser(currentUser);

  useEffect(() => {
    if (!isSuperAdmin && SUPERADMIN_ONLY_TABS.includes(activeTab)) {
      setActiveTab('analytics');
    }
  }, [activeTab, isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'users') {
      setManagedUsers(listManagedUsers());
    }
    if (isSuperAdmin && activeTab === 'salla') {
      void fetchSallaWebhookEvents().then(setSallaEvents);
    }
  }, [activeTab, isSuperAdmin]);

  const showSaved = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(''), 3500);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const res = await signInWithEmailPassword(loginEmail, loginPassword);
    setLoginLoading(false);
    if (res.error || !res.user) {
      setLoginError(res.error || 'تعذر التحقق من بيانات الدخول.');
      return;
    }
    if (!hasAdminAccess(res.user)) {
      await signOutUser();
      setLoginError('هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة التنفيذية.');
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
                بوابة الإدارة التنفيذية (/admino)
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
                البريد الإلكتروني أو رقم الجوال للإدارة
              </label>
              <input
                id="adm-email"
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com أو 05XXXXXXXX"
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
              className="w-full py-3 rounded-lg bg-[#0B0F19] hover:bg-[#059669] text-white font-bold text-sm transition-colors cursor-pointer"
            >
              {loginLoading ? 'جاري التحقق...' : 'دخول لوحة الإدارة'}
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-[#0B0F19] cursor-pointer"
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
    if (editingCategoryId === catId) setEditingCategoryId(null);
    showSaved('تم حذف القسم.');
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCatNameAr(cat.nameAr);
    setEditCatNameEn(cat.nameEn);
    setEditCatDesc(cat.descriptionAr);
  };

  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId || !editCatNameAr.trim()) return;
    const updated = categories.map((c) =>
      c.id === editingCategoryId
        ? {
            ...c,
            nameAr: editCatNameAr.trim(),
            nameEn: editCatNameEn.trim() || editCatNameAr.trim(),
            descriptionAr: editCatDesc.trim() || c.descriptionAr,
          }
        : c
    );
    onSaveCategories(updated);
    setEditingCategoryId(null);
    showSaved('تم تحديث اسم وبيانات القسم بنجاح وانعكس فوراً في المتجر.');
  };

  const handleToggleCategoryVisibility = (cat: Category) => {
    const nextHidden = !cat.hidden;
    const updated = categories.map((c) =>
      c.id === cat.id ? { ...c, hidden: nextHidden } : c
    );
    onSaveCategories(updated);
    showSaved(
      nextHidden
        ? `تم إخفاء قسم "${cat.nameAr}" بالكامل عن واجهة المتجر.`
        : `تم إظهار قسم "${cat.nameAr}" في واجهة المتجر.`
    );
  };

  const saveHeroSlides = (nextSlides: HeroSlide[], message?: string) => {
    setDraftHeroSlides(nextSlides);
    onSaveStoreSettings({
      ...storeSettings,
      heroSlides: nextSlides,
    });
    if (message) showSaved(message);
  };

  const handleAddHeroSlide = () => {
    const newSlide: HeroSlide = {
      id: `hero-slide-${Date.now()}`,
      kind: 'image',
      imageUrl: '/assets/images/promo_tech_essentials_1794729734876.jpg',
      badgeAr: 'عرض حصري جديد',
      titleAr: 'عنوان البانر الترويجي الجديد',
      subtitleAr: 'تشكيلة المصمم الأول المختارة مع شحن سريع داخل الرياض.',
      ctaLabelAr: 'تسوق الآن',
      actionType: 'catalog',
      active: true,
    };
    saveHeroSlides(
      [...draftHeroSlides, newSlide],
      'تمت إضافة صورة/شريحة هيرو جديدة. يمكنك تعديل الصورة والنصوص الآن.'
    );
  };

  const handleHeroImageUpload = (slideId: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const next = draftHeroSlides.map((slide) =>
        slide.id === slideId ? { ...slide, imageUrl: reader.result as string } : slide
      );
      saveHeroSlides(next, 'تم رفع صورة الهيرو وتطبيقها على الشريحة بنجاح.');
    };
    reader.readAsDataURL(file);
  };

  const handleMoveHeroSlide = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draftHeroSlides.length) return;
    const copy = [...draftHeroSlides];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    saveHeroSlides(copy, 'تم تحديث ترتيب شرائح الهيرو.');
  };

  const updateStorefrontVisibility = (next: StorefrontVisibilitySettings, notice?: string) => {
    setDraftVisibility(next);
    onSaveStoreSettings({
      ...storeSettings,
      visibility: next,
    });
    showSaved(notice || 'تم تحديث إعدادات ظهور أقسام الواجهة في المتجر فوراً.');
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
      conditionType: newCpnCondType,
      conditionDetails: newCpnCondDetails.trim(),
      minPurchaseAmount:
        newCpnCondType === 'min_purchase'
          ? Number(newCpnCondDetails.replace(/[^\d.]/g, '')) || undefined
          : undefined,
      validFromDate: newCpnCondType === 'date_range' && newCpnFromDate ? newCpnFromDate : undefined,
      validUntilDate:
        newCpnCondType === 'date_range' && newCpnUntilDate ? newCpnUntilDate : undefined,
      targetCategoryId:
        newCpnCondType === 'category_or_brand' && newCpnTargetCat ? newCpnTargetCat : undefined,
      prizeMessageAr: newCpnPrizeMessage.trim() || undefined,
    };
    onSaveCoupons([created, ...coupons]);
    setNewCpnCode('');
    setNewCpnCondType('none');
    setNewCpnCondDetails('');
    setNewCpnFromDate('');
    setNewCpnUntilDate('');
    setNewCpnTargetCat('');
    setNewCpnPrizeMessage('');
    showSaved(`تم إنشاء الكوبون ${code}.`);
  };

  const handleSaveEditedCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    const parsedMinFromDetails = Number(
      (editingCoupon.conditionDetails || '').replace(/[^\d.]/g, '')
    );
    const cleaned: Coupon = {
      ...editingCoupon,
      code: editingCoupon.code.trim().toUpperCase(),
      minPurchaseAmount:
        editingCoupon.conditionType === 'min_purchase'
          ? (parsedMinFromDetails > 0 ? parsedMinFromDetails : editingCoupon.minPurchaseAmount) ||
            undefined
          : undefined,
    };
    onSaveCoupons(coupons.map((c) => (c.id === cleaned.id ? cleaned : c)));
    setEditingCoupon(null);
    showSaved(`تم تحديث إعدادات الكوبون ${cleaned.code} بنجاح.`);
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

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; superOnly?: boolean }> = [
    { id: 'analytics', label: 'التحليلات التنفيذية', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'branding', label: '🎨 الهوية والمظهر', icon: <Palette className="w-4 h-4" />, superOnly: true },
    { id: 'storefront_layout', label: 'التحكم بأقسام الواجهة', icon: <LayoutGrid className="w-4 h-4" />, superOnly: true },
    { id: 'hero', label: `صور وبنرات الهيرو (${draftHeroSlides.length})`, icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'products', label: `المنتجات (${products.length})`, icon: <Package className="w-4 h-4" /> },
    { id: 'categories', label: 'الأقسام والخصم الجماعي', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'coupons', label: 'الكوبونات وعجلة الحظ', icon: <Ticket className="w-4 h-4" /> },
    { id: 'orders', label: `الطلبات (${orders.length})`, icon: <Truck className="w-4 h-4" /> },
    { id: 'gateways', label: 'بوابات الدفع API', icon: <CreditCard className="w-4 h-4" />, superOnly: true },
    { id: 'salla', label: 'ربط منصة سلة (Salla Integration)', icon: <Store className="w-4 h-4" />, superOnly: true },
    { id: 'users', label: 'إدارة المستخدمين والصلاحيات', icon: <Users className="w-4 h-4" />, superOnly: true },
    { id: 'profile', label: 'حسابي وإعدادات المشرف', icon: <UserCog className="w-4 h-4" /> },
    { id: 'seo', label: 'البكسل و SEO', icon: <LineChart className="w-4 h-4" /> },
    { id: 'policy', label: 'سياسة الاسترجاع', icon: <FileText className="w-4 h-4" /> },
  ];

  const visibleNavItems = navItems.filter((item) => !item.superOnly || isSuperAdmin);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-68 shrink-0 space-y-2">
          <div className="bg-[#0B0F19] text-white rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-[#00FF87]">
                {isSuperAdmin ? 'SUPERADMIN CMS' : 'ADMIN CMS'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 font-mono text-slate-300">
                /admino
              </span>
            </div>
            <div className="font-display text-base font-bold">{currentUser?.fullName}</div>
            <div className="text-[11px] text-slate-400 truncate">{currentUser?.email}</div>
          </div>

          <nav aria-label="أقسام لوحة الإدارة" className="bg-white rounded-xl border border-slate-200 p-2 space-y-1">
            {visibleNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-right cursor-pointer ${
                    active
                      ? 'bg-[#0B0F19] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B0F19]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 min-w-0">
                    <span className={active ? 'text-[#00FF87]' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#0B0F19] cursor-pointer"
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

          <>
              {/* 1. BRANDING & DYNAMIC THEME MANAGER (SUPERADMIN ONLY) */}
              {isSuperAdmin && activeTab === 'branding' && (
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
                        ...draftTheme,
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

          {/* 1B. SUPERADMIN STOREFRONT SECTIONS & QUICK BAR VISIBILITY (SUPERADMIN ONLY) */}
          {isSuperAdmin && activeTab === 'storefront_layout' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#0B0F19]">
                    التحكم بإظهار وإخفاء أقسام الواجهة (SuperAdmin)
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    إظهار أو إخفاء الشريط أسفل الهيرو (كامل أو عناصر منفردة) وأقسام الصفحة الرئيسية فوراً
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateStorefrontVisibility(
                      DEFAULT_VISIBILITY_SETTINGS,
                      'تمت استعادة الإعداد الافتراضي وإظهار كافة أقسام وعناصر الواجهة.'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#0B0F19] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إظهار كافة الأقسام</span>
                </button>
              </div>

              {/* Card 1: Quick Strip Below Hero */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#0B0F19]">
                      1. الشريط التالي للهيرو (شريط المزايا والوصول السريع)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      يمكنك إخفاء الشريط بالكامل أو التحكم في إظهار وإخفاء كل بطاقة داخله بشكل مستقل
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-quick-strip-master"
                    onClick={() =>
                      updateStorefrontVisibility({
                        ...draftVisibility,
                        showQuickFeatureStrip: !draftVisibility.showQuickFeatureStrip,
                      })
                    }
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      draftVisibility.showQuickFeatureStrip
                        ? 'bg-[#059669] text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {draftVisibility.showQuickFeatureStrip ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>الشريط الكامل: ظاهر</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>الشريط الكامل: مخفي</span>
                      </>
                    )}
                  </button>
                </div>

                {!draftVisibility.showQuickFeatureStrip && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                    تنبيه: الشريط الكامل مخفي حالياً من المتجر. يمكنك تفعيل الزر أعلاه لإعادة إظهار العناصر المحددة أدناه.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(
                    [
                      { key: 'flash', icon: '⚡', label: 'فلاش سيل (لفترة محدودة)' },
                      { key: 'coupon', icon: '🎫', label: 'كوبون حصري (خصم إضافي)' },
                      { key: 'wheel', icon: '🎡', label: 'العب واكسب (عجلة الحظ)' },
                      { key: 'shipping', icon: '🚚', label: 'شحن مجاني (للطلبات المؤهلة)' },
                      { key: 'magsafe', icon: '📱', label: 'إكسسوارات MagSafe' },
                      { key: 'gifts', icon: '🎁', label: 'بوكسات الهدايا' },
                    ] as Array<{ key: keyof QuickFeatureVisibility; icon: string; label: string }>
                  ).map((item) => {
                    const enabled = draftVisibility.quickFeatureItems[item.key];
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between gap-2 p-3.5 rounded-xl border transition-colors ${
                          enabled
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{item.icon}</span>
                          <span className="text-xs font-bold text-[#0B0F19] truncate">
                            {item.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid={`toggle-quick-item-${item.key}`}
                          onClick={() =>
                            updateStorefrontVisibility({
                              ...draftVisibility,
                              quickFeatureItems: {
                                ...draftVisibility.quickFeatureItems,
                                [item.key]: !enabled,
                              },
                            })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                            enabled
                              ? 'bg-[#059669] text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{enabled ? 'ظاهر' : 'مخفي'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Storefront Major Sections */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div>
                  <h2 className="font-display text-base font-bold text-[#0B0F19]">
                    2. أقسام الصفحة الرئيسية للمتجر
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تحكم فوري في ظهور كل قسم رئيسي بصفحة المتجر
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        key: 'showCircularCategories',
                        title: 'تسوق حسب القسم مع كوبونات خصم فورية',
                        desc: 'الأقسام الدائرية التفاعلية مع شارات الخصم وكود ALM30',
                      },
                      {
                        key: 'showFlashSales',
                        title: 'فلاش سيل كل يوم',
                        desc: 'قسم Flash Sales كل يوم مع المؤقت التنازلي والرابط في الشريط العلوي',
                      },
                      {
                        key: 'showNewArrivalsBanner',
                        title: 'وصل حديثاً',
                        desc: 'البنر الترويجي الخاص بتشكيلة MagSafe وإكسسوارات الجوال',
                      },
                      {
                        key: 'showGiftSeasonBanner',
                        title: 'موسم الهدايا',
                        desc: 'البنر الترويجي الخاص بعالم الألعاب الذكية STEM والهدايا التنفيذية',
                      },
                      {
                        key: 'showCatalogSection',
                        title: 'المجموعة المختارة (50 منتج)',
                        desc: 'كتالوج المنتجات الكامل مع الفلاتر وشريط السعر والترتيب',
                      },
                      {
                        key: 'showAmbassadorSection',
                        title: 'برنامج سفراء المصمم الأول · الرياض',
                        desc: 'قسم رابط الإحالة وعمولة السفراء بنسبة 5% والضمان الذهبي',
                      },
                    ] as const
                  ).map((sec) => {
                    const isVisible = draftVisibility[sec.key];
                    return (
                      <div
                        key={sec.key}
                        className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
                          isVisible
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#0B0F19]">{sec.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{sec.desc}</div>
                        </div>

                        <button
                          type="button"
                          data-testid={`toggle-section-${sec.key}`}
                          onClick={() =>
                            updateStorefrontVisibility({
                              ...draftVisibility,
                              [sec.key]: !isVisible,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                            isVisible
                              ? 'bg-[#059669] text-white hover:bg-[#047857]'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isVisible ? 'ظاهر' : 'مخفي'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 1C. HERO SLIDES & BANNERS MANAGER (REGULAR ADMIN & SUPERADMIN) */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                    إدارة صور وبنرات الهيرو ({draftHeroSlides.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إضافة وتعديل وحذف صور الهيرو وترتيبها وإظهارها أو إخفاؤها في واجهة المتجر
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      saveHeroSlides(
                        DEFAULT_HERO_SLIDES,
                        'تمت استعادة بنرات وصور الهيرو الافتراضية.'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#0B0F19] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الافتراضي</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddHeroSlide}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B0F19] hover:bg-[#059669] text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة صورة هيرو جديدة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      saveHeroSlides(
                        draftHeroSlides,
                        'تم حفظ كافة تعديلات صور وبنرات الهيرو وتحديث الواجهة.'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ التغييرات</span>
                  </button>
                </div>
              </div>

              {draftHeroSlides.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-[#0B0F19]">لا توجد شرائح هيرو مضافة حالياً.</p>
                  <button
                    type="button"
                    onClick={handleAddHeroSlide}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول صورة للهيرو</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftHeroSlides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className={`bg-white rounded-xl border p-5 space-y-4 transition-opacity ${
                        slide.active !== false
                          ? 'border-slate-200'
                          : 'border-slate-200 bg-slate-50/70 opacity-80'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[#0B0F19] font-mono text-xs font-bold">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-bold text-[#0B0F19]">
                            {slide.titleAr || 'شريحة هيرو'}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                              slide.active !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {slide.active !== false ? 'ظاهرة' : 'مخفية'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveHeroSlide(idx, -1)}
                            aria-label="تحريك للأعلى"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === draftHeroSlides.length - 1}
                            onClick={() => handleMoveHeroSlide(idx, 1)}
                            aria-label="تحريك للأسفل"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = draftHeroSlides.map((s) =>
                                s.id === slide.id ? { ...s, active: s.active === false } : s
                              );
                              saveHeroSlides(
                                next,
                                slide.active === false
                                  ? 'تم تفعيل ظهور شريحة الهيرو.'
                                  : 'تم إخفاء شريحة الهيرو.'
                              );
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                              slide.active !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {slide.active !== false ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>إخفاء</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>إظهار</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              saveHeroSlides(
                                draftHeroSlides.filter((s) => s.id !== slide.id),
                                'تمت إزالة شريحة الهيرو بنجاح.'
                              )
                            }
                            aria-label={`حذف شريحة ${slide.titleAr}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>إزالة</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        {/* Image Preview + Upload */}
                        <div className="lg:col-span-4 space-y-2.5">
                          <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative">
                            {slide.imageUrl ? (
                              <img
                                src={slide.imageUrl}
                                alt={slide.titleAr}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4 text-xs text-slate-500">
                                {slide.kind === 'wheel'
                                  ? '🎡 شريحة عجلة الحظ التفاعلية (خلفية متدرجة تلقائياً)'
                                  : 'لا توجد صورة محددة'}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-[#0B0F19] cursor-pointer">
                              <Upload className="w-3.5 h-3.5 text-[#059669]" />
                              <span>رفع صورة من الجهاز</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  handleHeroImageUpload(slide.id, e.target.files?.[0]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            {slide.imageUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftHeroSlides((prev) =>
                                    prev.map((s) =>
                                      s.id === slide.id ? { ...s, imageUrl: '' } : s
                                    )
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                              >
                                مسح الصورة
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Slide Fields */}
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold mb-1">
                              رابط صورة الهيرو (Image URL)
                            </label>
                            <input
                              type="text"
                              value={slide.imageUrl}
                              onChange={(e) =>
                                setDraftHeroSlides((prev) =>
                                  prev.map((s) =>
                                    s.id === slide.id ? { ...s, imageUrl: e.target.value } : s
                                  )
                                )
                              }
                              placeholder="/assets/images/promo_tech_essentials_1794729734876.jpg أو https://..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1">نوع الشريحة</label>
                            <select
                              value={slide.kind}
                              onChange={(e) =>
                                setDraftHeroSlides((prev) =>
                                  prev.map((s) =>
                                    s.id === slide.id
                                      ? { ...s, kind: e.target.value as HeroSlide['kind'] }
                                      : s
                                  )
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                            >
                              <option value="image">صورة / بانر إعلاني</option>
                              <option value="wheel">شريحة عجلة الحظ التفاعلية</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1">الشارة العلوية</label>
                            <input
                              type="text"
                              value={slide.badgeAr}
                              onChange={(e) =>
                                setDraftHeroSlides((prev) =>
                                  prev.map((s) =>
                                    s.id === slide.id ? { ...s, badgeAr: e.target.value } : s
                                  )
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold mb-1">العنوان الرئيسي</label>
                            <input
                              type="text"
                              value={slide.titleAr}
                              onChange={(e) =>
                                setDraftHeroSlides((prev) =>
                                  prev.map((s) =>
                                    s.id === slide.id ? { ...s, titleAr: e.target.value } : s
                                  )
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold mb-1">النص الفرعي</label>
                            <textarea
                              rows={2}
                              value={slide.subtitleAr}
                              onChange={(e) =>
                                setDraftHeroSlides((prev) =>
                                  prev.map((s) =>
                                    s.id === slide.id ? { ...s, subtitleAr: e.target.value } : s
                                  )
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1">نص زر الإجراء</label>
                            <input
                              type="text"
                              value={slide.ctaLabelAr}
                              onChange={(e) =>
                                setDraftHeroSlides((prev) =>
                                  prev.map((s) =>
                                    s.id === slide.id ? { ...s, ctaLabelAr: e.target.value } : s
                                  )
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1">وجهة الضغط على الزر</label>
                            <select
                              value={slide.actionType}
                              onChange={(e) =>
                                setDraftHeroSlides((prev) =>
                                  prev.map((s) =>
                                    s.id === slide.id
                                      ? { ...s, actionType: e.target.value as HeroSlide['actionType'] }
                                      : s
                                  )
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                            >
                              <option value="catalog">استكشاف الكتالوج</option>
                              <option value="flash">الانتقال إلى فلاش سيل</option>
                              <option value="wheel">فتح عجلة الحظ</option>
                              <option value="category">فتح قسم محدد</option>
                            </select>
                          </div>

                          {slide.actionType === 'category' && (
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold mb-1">
                                القسم المستهدف
                              </label>
                              <select
                                value={slide.targetCategoryId || categories[0]?.id || ''}
                                onChange={(e) =>
                                  setDraftHeroSlides((prev) =>
                                    prev.map((s) =>
                                      s.id === slide.id
                                        ? { ...s, targetCategoryId: e.target.value }
                                        : s
                                    )
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.nameAr}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                {categories.map((cat) => {
                  const isEditingThis = editingCategoryId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className={`bg-white rounded-xl border p-5 space-y-4 transition-opacity ${
                        cat.hidden ? 'border-amber-300 bg-amber-50/20 opacity-85' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-bold text-[#0B0F19]">
                              {cat.nameAr}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                cat.hidden
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {cat.hidden ? 'مخفي عن المتجر' : 'ظاهر في المتجر'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{cat.descriptionAr}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryVisibility(cat)}
                            aria-label={cat.hidden ? `إظهار قسم ${cat.nameAr}` : `إخفاء قسم ${cat.nameAr}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                              cat.hidden
                                ? 'bg-[#059669] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {cat.hidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>إظهار</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>إخفاء</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              isEditingThis ? setEditingCategoryId(null) : startEditCategory(cat)
                            }
                            aria-label={`تعديل اسم قسم ${cat.nameAr}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-[#0B0F19] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تغيير الاسم</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            aria-label={`حذف قسم ${cat.nameAr}`}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isEditingThis && (
                        <form
                          onSubmit={handleSaveCategoryEdit}
                          className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2.5"
                        >
                          <div className="text-xs font-bold text-[#0B0F19]">تعديل اسم ووصف القسم</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              aria-label="اسم القسم الجديد بالعربية"
                              value={editCatNameAr}
                              onChange={(e) => setEditCatNameAr(e.target.value)}
                              placeholder="اسم القسم بالعربية"
                              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                            />
                            <input
                              type="text"
                              aria-label="اسم القسم الجديد بالإنجليزية"
                              value={editCatNameEn}
                              onChange={(e) => setEditCatNameEn(e.target.value)}
                              placeholder="Category Name (EN)"
                              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                            />
                          </div>
                          <input
                            type="text"
                            aria-label="وصف القسم الجديد"
                            value={editCatDesc}
                            onChange={(e) => setEditCatDesc(e.target.value)}
                            placeholder="وصف القسم"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              className="px-3.5 py-1.5 rounded-lg bg-[#059669] text-white text-xs font-bold cursor-pointer"
                            >
                              حفظ الاسم
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      )}

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
                  );
                })}
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
                  إنشاء وتحرير أكواد الخصم، الشروط الذكية، وتحديد النتيجة الافتراضية لعجلة الحظ
                </p>
              </div>

              {/* Rigged / Default Lucky Spin Wheel Target */}
              <div className="bg-white rounded-xl border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label htmlFor="wheel-target-select" className="block text-xs font-extrabold text-[#0B0F19]">
                    النتيجة الافتراضية لعجلة الحظ (توجيه الجائزة عند الدوران)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    اختر الجائزة المستهدفة لكي تتوقف العجلة عليها دائماً، أو اتركها عشوائية بالكامل.
                  </p>
                </div>
                <select
                  id="wheel-target-select"
                  value={storeSettings.wheelTargetCouponId || ''}
                  onChange={(e) => {
                    const nextSettings: StoreThemeSettings = {
                      ...storeSettings,
                      wheelTargetCouponId: e.target.value,
                    };
                    onSaveStoreSettings(nextSettings);
                    showSaved(
                      e.target.value
                        ? 'تم تثبيت النتيجة الافتراضية المستهدفة لعجلة الحظ بنجاح.'
                        : 'تم تفعيل الوضع العشوائي لجميع جوائز عجلة الحظ.'
                    );
                  }}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-[#0B0F19] min-w-[240px]"
                >
                  <option value="">🎲 عشوائي بالكامل (حسب الحظ)</option>
                  {coupons
                    .filter((c) => c.active && c.isWheelReward)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        🎯 {c.wheelLabel || c.code} ({c.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Add Coupon Form */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">الشرط</label>
                    <select
                      value={newCpnCondType}
                      onChange={(e) => setNewCpnCondType(e.target.value as CouponConditionType)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      {(Object.keys(CONDITION_LABELS) as CouponConditionType[]).map((ct) => (
                        <option key={ct} value={ct}>
                          {CONDITION_LABELS[ct]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">تفاصيل الشرط</label>
                    <input
                      type="text"
                      value={newCpnCondDetails}
                      onChange={(e) => setNewCpnCondDetails(e.target.value)}
                      placeholder={
                        newCpnCondType === 'min_purchase'
                          ? 'مثال: 300'
                          : newCpnCondType === 'date_range'
                          ? 'مثال: عرض الويكند أو حدد التاريخين أدناه'
                          : newCpnCondType === 'category_or_brand'
                          ? 'مثال: MagSafe أو اختر التصنيف أدناه'
                          : 'اختياري'
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                {newCpnCondType === 'date_range' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">من تاريخ</label>
                      <input
                        type="date"
                        value={newCpnFromDate}
                        onChange={(e) => setNewCpnFromDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">إلى تاريخ</label>
                      <input
                        type="date"
                        value={newCpnUntilDate}
                        onChange={(e) => setNewCpnUntilDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {newCpnCondType === 'category_or_brand' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">التصنيف المستهدف (اختياري)</label>
                    <select
                      value={newCpnTargetCat}
                      onChange={(e) => setNewCpnTargetCat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="">حسب النص المدخل في تفاصيل الشرط</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1">رسالة الهدية والشروط (تظهر عند الفوز في العجلة)</label>
                  <textarea
                    rows={2}
                    value={newCpnPrizeMessage}
                    onChange={(e) => setNewCpnPrizeMessage(e.target.value)}
                    placeholder="مبارك لك الفوز! استخدم الكود الآن للاستفادة من العرض الحصري."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
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
                    className="px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold cursor-pointer"
                  >
                    إضافة الكوبون
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">الكود</th>
                        <th className="py-3 px-4">القيمة</th>
                        <th className="py-3 px-4">الاستخدام</th>
                        <th className="py-3 px-4">عجلة الحظ</th>
                        <th className="py-3 px-4">الشرط</th>
                        <th className="py-3 px-4">الحالة</th>
                        <th className="py-3 px-4">تحرير</th>
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
                          <td className="py-3 px-4 text-[11px] text-slate-600 max-w-[180px] truncate">
                            {describeCouponConditionAr(cpn, categories)}
                          </td>
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
                              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
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
                              aria-label={`تحرير كوبون ${cpn.code}`}
                              onClick={() => setEditingCoupon({ ...cpn })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-[#0B0F19] cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>تحرير</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              aria-label={`حذف كوبون ${cpn.code}`}
                              onClick={() => onSaveCoupons(coupons.filter((c) => c.id !== cpn.id))}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
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

              {/* Edit Coupon Modal */}
              {editingCoupon && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`تحرير الكوبون ${editingCoupon.code}`}
                  className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto"
                >
                  <form
                    onSubmit={handleSaveEditedCoupon}
                    className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <h3 className="font-display text-lg font-bold text-[#0B0F19]">
                        تحرير الكوبون ({editingCoupon.code})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingCoupon(null)}
                        aria-label="إغلاق تحرير الكوبون"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">الكود</label>
                        <input
                          type="text"
                          required
                          value={editingCoupon.code}
                          onChange={(e) =>
                            setEditingCoupon({ ...editingCoupon, code: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">نوع الخصم</label>
                        <select
                          value={editingCoupon.discountType}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              discountType: e.target.value as CouponDiscountType,
                            })
                          }
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
                          value={editingCoupon.value}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              value: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">حد الاستخدام</label>
                        <input
                          type="number"
                          value={editingCoupon.usageLimit}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              usageLimit: Number(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">تاريخ الانتهاء</label>
                        <input
                          type="date"
                          value={editingCoupon.expiresAt}
                          onChange={(e) =>
                            setEditingCoupon({ ...editingCoupon, expiresAt: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">عنوان شريحة العجلة</label>
                        <input
                          type="text"
                          value={editingCoupon.wheelLabel || ''}
                          onChange={(e) =>
                            setEditingCoupon({ ...editingCoupon, wheelLabel: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label htmlFor="edit-cpn-cond-type" className="block text-xs font-semibold mb-1">
                          الشرط
                        </label>
                        <select
                          id="edit-cpn-cond-type"
                          value={editingCoupon.conditionType || 'none'}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              conditionType: e.target.value as CouponConditionType,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          {(Object.keys(CONDITION_LABELS) as CouponConditionType[]).map((ct) => (
                            <option key={ct} value={ct}>
                              {CONDITION_LABELS[ct]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="edit-cpn-cond-details" className="block text-xs font-semibold mb-1">
                          تفاصيل الشرط
                        </label>
                        <input
                          id="edit-cpn-cond-details"
                          type="text"
                          value={editingCoupon.conditionDetails || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = Number(val.replace(/[^\d.]/g, ''));
                            setEditingCoupon({
                              ...editingCoupon,
                              conditionDetails: val,
                              ...(editingCoupon.conditionType === 'min_purchase'
                                ? { minPurchaseAmount: num > 0 ? num : undefined }
                                : {}),
                            });
                          }}
                          placeholder={
                            editingCoupon.conditionType === 'min_purchase'
                              ? 'أدخل الحد الأدنى بالريال (مثال: 300)'
                              : editingCoupon.conditionType === 'date_range'
                              ? 'من : إلى (مثال: 2026-01-01 | 2026-12-31)'
                              : 'معرّف التصنيف أو الماركة'
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    {editingCoupon.conditionType === 'date_range' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">من تاريخ</label>
                          <input
                            type="date"
                            value={editingCoupon.validFromDate || ''}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                validFromDate: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">إلى تاريخ</label>
                          <input
                            type="date"
                            value={editingCoupon.validUntilDate || ''}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                validUntilDate: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {editingCoupon.conditionType === 'category_or_brand' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1">التصنيف المستهدف (اختياري)</label>
                        <select
                          value={editingCoupon.targetCategoryId || ''}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              targetCategoryId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          <option value="">حسب النص المدخل في تفاصيل الشرط</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nameAr}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label htmlFor="edit-cpn-prize-msg" className="block text-xs font-semibold mb-1">
                        رسالة الهدية والشروط
                      </label>
                      <textarea
                        id="edit-cpn-prize-msg"
                        rows={3}
                        value={editingCoupon.prizeMessageAr || ''}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            prizeMessageAr: e.target.value,
                          })
                        }
                        placeholder="رسالة مخصصة تظهر للعميل عند الفوز أو تفعيل الكود..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={editingCoupon.isWheelReward}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              isWheelReward: e.target.checked,
                            })
                          }
                        />
                        <span>عرض كجائزة في عجلة الحظ</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCoupon(null)}
                          className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                        >
                          حفظ التعديلات
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
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

          {/* 6. PAYMENT GATEWAYS API (SUPERADMIN ONLY) */}
          {isSuperAdmin && activeTab === 'gateways' && (
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

          {/* 9. SALLA INTEGRATION HUB (SUPERADMIN ONLY) */}
          {isSuperAdmin && activeTab === 'salla' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                    ربط منصة سلة (Salla Integration)
                  </h2>
                  <p className="text-xs text-slate-500">
                    إدارة مفاتيح Salla OAuth ومزامنة المنتجات والطلبات والـ Webhook الحي
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSaveSallaSettings(draftSalla);
                    showSaved('تم حفظ إعدادات الربط مع منصة سلة.');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ إعدادات سلة</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-[#0B0F19]">حالة الربط مع منصة سلة</span>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSalla.enabled}
                      onChange={(e) =>
                        setDraftSalla({ ...draftSalla, enabled: e.target.checked })
                      }
                    />
                    <span>{draftSalla.enabled ? 'مفعّل' : 'معطّل'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Salla App Client ID</label>
                    <input
                      type="text"
                      value={draftSalla.clientId}
                      onChange={(e) =>
                        setDraftSalla({ ...draftSalla, clientId: e.target.value })
                      }
                      placeholder="salla_client_id..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Salla Client Secret</label>
                    <input
                      type="password"
                      value={draftSalla.clientSecret}
                      onChange={(e) =>
                        setDraftSalla({ ...draftSalla, clientSecret: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Salla Access Token / Bearer Token</label>
                    <input
                      type="password"
                      value={draftSalla.accessToken}
                      onChange={(e) =>
                        setDraftSalla({ ...draftSalla, accessToken: e.target.value })
                      }
                      placeholder="Bearer Token..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Salla Webhook Secret</label>
                    <input
                      type="password"
                      value={draftSalla.webhookSecret}
                      onChange={(e) =>
                        setDraftSalla({ ...draftSalla, webhookSecret: e.target.value })
                      }
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">رابط Webhook للاستقبال من سلة:</span>
                  <code className="font-mono bg-white px-3 py-1 rounded border border-slate-200 text-[#059669]">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/api/salla/webhook`
                      : '/api/salla/webhook'}
                  </code>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={sallaSyncing !== null}
                    onClick={async () => {
                      setSallaSyncing('catalog');
                      const res = await triggerSallaSync({
                        action: 'catalog',
                        accessToken: draftSalla.accessToken,
                        localCount: products.length,
                      });
                      setSallaSyncing(null);
                      const updated: SallaIntegrationSettings = {
                        ...draftSalla,
                        lastCatalogSyncAt: new Date().toISOString(),
                        syncedProductsCount: res.syncedCount,
                      };
                      setDraftSalla(updated);
                      onSaveSallaSettings(updated);
                      showSaved(res.messageAr);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B0F19] hover:bg-[#059669] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sallaSyncing === 'catalog' ? 'animate-spin' : ''}`} />
                    <span>مزامنة المنتجات مع سلة</span>
                  </button>

                  <button
                    type="button"
                    disabled={sallaSyncing !== null}
                    onClick={async () => {
                      setSallaSyncing('orders');
                      const res = await triggerSallaSync({
                        action: 'orders',
                        accessToken: draftSalla.accessToken,
                        localCount: orders.length,
                      });
                      setSallaSyncing(null);
                      const updated: SallaIntegrationSettings = {
                        ...draftSalla,
                        lastOrdersSyncAt: new Date().toISOString(),
                        syncedOrdersCount: res.syncedCount,
                      };
                      setDraftSalla(updated);
                      onSaveSallaSettings(updated);
                      showSaved(res.messageAr);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#0B0F19] text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sallaSyncing === 'orders' ? 'animate-spin' : ''}`} />
                    <span>مزامنة الطلبات</span>
                  </button>
                </div>

                {(draftSalla.lastCatalogSyncAt || draftSalla.lastOrdersSyncAt) && (
                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-4 pt-1">
                    {draftSalla.lastCatalogSyncAt && (
                      <span>
                        آخر مزامنة للمنتجات: {draftSalla.syncedProductsCount ?? products.length} منتج
                      </span>
                    )}
                    {draftSalla.lastOrdersSyncAt && (
                      <span>
                        آخر مزامنة للطلبات: {draftSalla.syncedOrdersCount ?? orders.length} طلب
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#0B0F19]">
                    سجل أحداث Webhook الواردة من سلة
                  </h3>
                  <button
                    type="button"
                    onClick={() => void fetchSallaWebhookEvents().then(setSallaEvents)}
                    className="text-xs font-bold text-[#059669] hover:underline cursor-pointer"
                  >
                    تحديث السجل
                  </button>
                </div>
                {sallaEvents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    لا توجد أحداث Webhook واردة حتى الآن.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {sallaEvents.map((evt) => (
                      <div key={evt.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-mono font-bold text-[#0B0F19]">{evt.event}</div>
                          <div className="text-[11px] text-slate-500">{evt.summary}</div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(evt.receivedAt).toLocaleTimeString('ar-SA')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 10. USER & ADMINISTRATOR MANAGEMENT (SUPERADMIN ONLY) */}
          {isSuperAdmin && activeTab === 'users' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                  إدارة المستخدمين والصلاحيات (SuperAdmin)
                </h2>
                <p className="text-xs text-slate-500">
                  استعراض كافة الحسابات، ترقية أو سحب صلاحيات الإدارة، إعادة تعيين كلمات المرور، وحذف الحسابات
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="بحث بالاسم أو البريد أو الجوال..."
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">الاسم</th>
                        <th className="py-3 px-4">البريد / الجوال</th>
                        <th className="py-3 px-4">الصلاحية</th>
                        <th className="py-3 px-4">إعادة تعيين كلمة المرور</th>
                        <th className="py-3 px-4">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {managedUsers
                        .filter((u) => {
                          const q = userSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            u.fullName.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            (u.phone || '').includes(q)
                          );
                        })
                        .map((u) => {
                          const isPrimarySuper = isSuperAdminEmail(u.email);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-[#0B0F19]">{u.fullName}</td>
                              <td className="py-3 px-4">
                                <div className="font-mono text-[#0B0F19]">{u.email}</div>
                                {u.phone && (
                                  <div className="text-[11px] font-mono text-slate-500">{u.phone}</div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  aria-label={`تعديل صلاحية ${u.email}`}
                                  disabled={isPrimarySuper}
                                  value={u.role}
                                  onChange={(e) => {
                                    const updated = updateManagedUserRole(
                                      u.id,
                                      e.target.value as UserRole
                                    );
                                    setManagedUsers(updated);
                                    showSaved(`تم تحديث صلاحية الحساب ${u.email}.`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold disabled:bg-slate-100"
                                >
                                  <option value="superadmin">SuperAdmin</option>
                                  <option value="admin">مشرف (Admin)</option>
                                  <option value="customer">عميل (Customer)</option>
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                {resetPwdTargetId === u.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="password"
                                      value={resetPwdValue}
                                      onChange={(e) => setResetPwdValue(e.target.value)}
                                      placeholder="كلمة مرور جديدة"
                                      className="px-2.5 py-1 rounded border border-slate-300 text-xs w-32"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = resetManagedUserPassword(u.id, resetPwdValue);
                                        if (!res.ok) {
                                          showSaved(res.error || 'تعذر التعيين');
                                          return;
                                        }
                                        setResetPwdTargetId(null);
                                        setResetPwdValue('');
                                        showSaved(`تم تعيين كلمة مرور جديدة للحساب ${u.email}.`);
                                      }}
                                      className="px-2.5 py-1 rounded bg-[#059669] text-white text-[11px] font-bold"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResetPwdTargetId(null);
                                        setResetPwdValue('');
                                      }}
                                      className="px-2 py-1 text-[11px] text-slate-500"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetPwdTargetId(u.id);
                                      setResetPwdValue('');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 text-[11px] font-bold"
                                  >
                                    <KeyRound className="w-3 h-3" />
                                    <span>إعادة تعيين</span>
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  disabled={isPrimarySuper}
                                  onClick={() => {
                                    const res = deleteManagedUser(u.id);
                                    setManagedUsers(res.users);
                                    showSaved(
                                      res.ok
                                        ? `تم حذف الحساب ${u.email}.`
                                        : res.error || 'لا يمكن الحذف'
                                    );
                                  }}
                                  aria-label={`حذف حساب ${u.email}`}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 11. ADMIN PROFILE, PASSWORD & PHONE VERIFICATION */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B0F19]">
                  حسابي وإعدادات المشرف
                </h2>
                <p className="text-xs text-slate-500">
                  تحديث بريد المراسلات، ربط وتوثيق رقم الجوال السعودي (05XXXXXXXX)، وتغيير كلمة المرور
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Correspondence Email & Phone Verification */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentUser) return;
                    const res = await updateUserProfile({
                      userId: currentUser.id,
                      correspondenceEmail: corrEmail,
                      phone: adminPhone,
                    });
                    if (res.ok && res.user) {
                      onAuthenticated(res.user);
                      showSaved('تم تحديث بريد المراسلات ورقم الجوال.');
                    }
                  }}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <h3 className="font-display text-base font-bold text-[#0B0F19]">
                    بريد المراسلات وتوثيق الجوال
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold mb-1">البريد الإلكتروني للمراسلات</label>
                    <input
                      type="email"
                      required
                      value={corrEmail}
                      onChange={(e) => setCorrEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold">رقم الجوال السعودي (لتسجيل الدخول والتنبيهات)</label>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          currentUser?.phoneVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {currentUser?.phoneVerified ? 'موثق ✓' : 'غير موثق'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="05XXXXXXXX"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const code = String(Math.floor(1000 + Math.random() * 9000));
                          setSmsSentCode(code);
                          setSmsVerifyInput('');
                          showSaved(`تم إرسال رمز التحقق SMS (${code}) إلى ${adminPhone || 'جوالك'}.`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold shrink-0 cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-[#059669]" />
                        <span>إرسال رمز SMS</span>
                      </button>
                    </div>

                    {smsSentCode && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                        <input
                          type="text"
                          value={smsVerifyInput}
                          onChange={(e) => setSmsVerifyInput(e.target.value)}
                          placeholder="أدخل رمز التحقق"
                          className="flex-1 px-3 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (smsVerifyInput.trim() !== smsSentCode || !currentUser) {
                              showSaved('رمز التحقق غير متطابق.');
                              return;
                            }
                            const res = await updateUserProfile({
                              userId: currentUser.id,
                              phone: adminPhone,
                              phoneVerified: true,
                            });
                            if (res.ok && res.user) {
                              onAuthenticated(res.user);
                              setSmsSentCode(null);
                              showSaved('تم توثيق رقم الجوال بنجاح ويمكنك الدخول به مستقبلاً.');
                            }
                          }}
                          className="px-3 py-1.5 rounded bg-[#059669] text-white text-xs font-bold cursor-pointer"
                        >
                          تأكيد التوثيق
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                  >
                    حفظ بيانات المراسلات والجوال
                  </button>
                </form>

                {/* Change Password */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setProfileError('');
                    if (!currentUser) return;
                    if (newPwd !== confirmPwd) {
                      setProfileError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
                      return;
                    }
                    const res = await changeUserPassword({
                      userId: currentUser.id,
                      currentPassword: currPwd,
                      newPassword: newPwd,
                    });
                    if (!res.ok) {
                      setProfileError(res.error || 'تعذر تغيير كلمة المرور.');
                      return;
                    }
                    setCurrPwd('');
                    setNewPwd('');
                    setConfirmPwd('');
                    showSaved('تم تحديث كلمة المرور الخاصة بك بنجاح.');
                  }}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <h3 className="font-display text-base font-bold text-[#0B0F19]">
                    تغيير كلمة المرور
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold mb-1">كلمة المرور الحالية</label>
                    <input
                      type="password"
                      required
                      value={currPwd}
                      onChange={(e) => setCurrPwd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  {profileError && (
                    <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                      {profileError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-[#0B0F19] hover:bg-[#059669] text-white text-xs font-bold cursor-pointer"
                  >
                    تحديث كلمة المرور
                  </button>
                </form>
              </div>
            </div>
          )}
          </>
        </main>
      </div>
    </div>
  );
};
