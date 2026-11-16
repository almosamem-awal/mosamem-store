import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  HelpCircle,
  Smartphone,
  Bot,
  Gift,
  Zap,
  Disc,
  Star,
  X,
  ChevronDown,
  Package,
  Heart,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import type { AuthUser, Category, Product } from '../types/store';
import { formatSAR, getEffectiveProductPrice } from '../utils/commerce';
import { getFallbackProductArt } from '../data/seedData';
import { BrandMark } from './BrandLogo';
import type { CustomerPortalTab } from './CustomerAccountModal';

export type MarketplaceQuickFilter = 'all' | 'flash' | 'magsafe' | 'top_rated';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  currentUser: AuthUser | null;
  activeView: 'store' | 'admin';
  products: Product[];
  categories: Category[];
  logoUrl?: string;
  searchQuery: string;
  selectedCategoryId: string;
  specialFilter: MarketplaceQuickFilter;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onSelectCategory: (catId: string) => void;
  onSelectSpecialFilter: (filter: MarketplaceQuickFilter) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateView: (view: 'store' | 'admin') => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenAccountPortal: (tab: CustomerPortalTab) => void;
  onSignOut: () => void;
  onOpenWheel: () => void;
  onOpenPolicy: () => void;
  onJumpToFlashSales: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  currentUser,
  activeView,
  products,
  categories,
  logoUrl,
  searchQuery,
  selectedCategoryId,
  specialFilter,
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
  onSelectSpecialFilter,
  onSelectProduct,
  onNavigateView,
  onOpenCart,
  onOpenAuth,
  onOpenAccountPortal,
  onSignOut,
  onOpenWheel,
  onOpenPolicy,
  onJumpToFlashSales,
}) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [headerCatChoice, setHeaderCatChoice] = useState<string>('all');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const autocompleteMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) => {
        if (headerCatChoice !== 'all' && p.categoryId !== headerCatChoice) return false;
        return (
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice(0, 5);
  }, [products, searchQuery, headerCatChoice]);

  const handleGlobalSearchInput = (value: string) => {
    onSearchChange(value);
    if (value.trim().length > 0) {
      if (headerCatChoice === 'all' && selectedCategoryId !== 'all') {
        onSelectCategory('all');
      }
      if (specialFilter !== 'all') {
        onSelectSpecialFilter('all');
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAutocomplete(false);
    onSelectCategory(headerCatChoice);
    if (specialFilter !== 'all') onSelectSpecialFilter('all');
    if (activeView !== 'store') onNavigateView('store');
    onSearchSubmit();
  };

  return (
    <>
      {/* Slim Non-Sticky Marketplace Utility Top Strip */}
      <div className="bg-[#F8F9FA] border-b border-slate-200/80 text-[11px] sm:text-xs text-[#1E293B]">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 h-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 truncate">
            <Zap
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: 'var(--color-primary)' }}
              aria-hidden="true"
            />
            <span className="font-medium truncate">
              المصمم الأول — توصيل فوري داخل الرياض خلال ساعات · شحن مجاني فوق 200 ر.س
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <span className="font-mono font-semibold text-[#059669] hidden sm:inline">
              almosamem.com.sa · الرياض
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Jumia-Style Pure White Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 lg:gap-6">
          {/* Right: Official Brand Logo */}
          <button
            type="button"
            onClick={() => {
              onNavigateView('store');
              setHeaderCatChoice('all');
              onSelectCategory('all');
              onSelectSpecialFilter('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 whitespace-nowrap shrink-0 text-right group focus-visible:outline-2 rounded-lg"
          >
            <BrandMark
              logoUrl={logoUrl}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition-transform group-hover:scale-105"
            />
            <span className="font-display text-lg sm:text-2xl font-extrabold text-[#1E293B] tracking-tight">
              المصمم{' '}
              <span style={{ color: 'var(--color-primary)' }}>الأول</span>
            </span>
          </button>

          {/* Center: Giant Central Search Bar with Category Selector (Desktop) */}
          <form
            onSubmit={handleFormSubmit}
            className="hidden md:flex flex-1 max-w-2xl items-center gap-2 relative"
          >
            <div className="relative flex-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-[var(--color-primary)]">
              <select
                aria-label="اختر القسم للبحث"
                value={headerCatChoice}
                onChange={(e) => setHeaderCatChoice(e.target.value)}
                className="bg-slate-50 border-l border-slate-200 px-3 py-2.5 text-xs font-bold text-[#1E293B] rounded-r-lg focus:outline-none max-w-[155px] truncate cursor-pointer"
              >
                <option value="all">كل الأقسام</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  aria-label="البحث عن منتجات، والعلامات التجارية والأقسام"
                  value={searchQuery}
                  onFocus={() => setShowAutocomplete(true)}
                  onBlur={() => window.setTimeout(() => setShowAutocomplete(false), 180)}
                  onChange={(e) => {
                    handleGlobalSearchInput(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  placeholder="البحث عن منتجات، والعلامات التجارية والأقسام"
                  className="w-full pr-9 pl-8 py-2.5 rounded-l-lg bg-transparent text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="مسح البحث"
                    onClick={() => onSearchChange('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1E293B]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showAutocomplete && autocompleteMatches.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-1.5 bg-white rounded-lg border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                  {autocompleteMatches.map((match) => {
                    const pr = getEffectiveProductPrice(match, categories);
                    return (
                      <button
                        key={match.id}
                        type="button"
                        onMouseDown={() => {
                          onSelectProduct(match);
                          setShowAutocomplete(false);
                        }}
                        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-right transition-colors"
                      >
                        <img
                          src={match.images[0]}
                          alt={match.nameAr}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallbackApplied) {
                              target.dataset.fallbackApplied = '1';
                              target.src = getFallbackProductArt(match.sku);
                            }
                          }}
                          className="w-10 h-10 rounded object-cover bg-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#1E293B] truncate">
                            {match.nameAr}
                          </div>
                          <div className="text-[11px] font-mono text-[#64748B]">{match.sku}</div>
                        </div>
                        <span
                          className="text-xs font-extrabold tabular-nums shrink-0"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {formatSAR(pr.effectivePrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:brightness-110 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
              }}
            >
              ابحث
            </button>
          </form>

          {/* Left: Account Dropdown (or Login), Help, and Cart with Item Count Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {currentUser ? (
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label={`قائمة حساب ${currentUser.fullName}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span
                    className="w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-primary-contrast)',
                    }}
                  >
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:inline max-w-[130px] truncate">
                    مرحباً، {currentUser.fullName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {accountMenuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3.5 bg-[#F8FAFC] border-b border-slate-200 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[#0B0F19] truncate">
                          {currentUser.fullName}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          <span>عميل موثق</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" dir="ltr">
                        {currentUser.email}
                        {currentUser.phone ? ` · ${currentUser.phone}` : ''}
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenAccountPortal('profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#1E293B] hover:bg-slate-50 text-right cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#059669]" />
                        <span>لوحة تحكم العميل</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenAccountPortal('orders');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#1E293B] hover:bg-slate-50 text-right cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-[#059669]" />
                        <span>طلباتي ومتابعة الشحنات</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenAccountPortal('wishlist');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#1E293B] hover:bg-slate-50 text-right cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2.5">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>قائمة الرغبات</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-700">
                          {wishlistCount}
                        </span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-right cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                aria-label="مرحباً، تسجيل الدخول"
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E293B]" />
                <span className="hidden lg:inline max-w-[140px] truncate">
                  مرحباً، تسجيل الدخول
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenPolicy}
              aria-label="المساعدة"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E293B]" />
              <span className="hidden sm:inline">المساعدة</span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label="سلة التسوق"
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-[#1E293B] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="relative inline-flex">
                <ShoppingCart className="w-5 h-5 text-[#1E293B]" />
                <span
                  data-testid="cart-badge-count"
                  className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-extrabold flex items-center justify-center tabular-nums shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-secondary-contrast)',
                  }}
                >
                  {cartCount}
                </span>
              </span>
              <span className="hidden sm:inline">سلة التسوق</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar (Non-sticky to preserve mobile sticky cap) */}
      {activeView === 'store' && (
        <div className="md:hidden bg-white px-3 pb-2.5 pt-2 border-b border-slate-200">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="البحث عن منتجات، والعلامات التجارية والأقسام"
                value={searchQuery}
                onChange={(e) => handleGlobalSearchInput(e.target.value)}
                placeholder="البحث عن منتجات، والعلامات التجارية والأقسام"
                className="w-full pr-9 pl-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs text-[#1E293B] placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-bold text-xs shrink-0"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
              }}
            >
              ابحث
            </button>
          </form>
        </div>
      )}

      {/* Sub-Header Category Navigation Strip */}
      {activeView === 'store' && (
        <nav
          aria-label="الأقسام والعروض السريعة"
          className="bg-white border-b border-slate-200"
        >
          <div className="max-w-[1280px] mx-auto px-3 sm:px-6 flex items-center justify-start lg:justify-between gap-1 sm:gap-2 overflow-x-auto py-2">
            <button
              type="button"
              onClick={() => {
                onSelectCategory('cat-accessories');
                onSelectSpecialFilter('all');
                onSearchSubmit();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              style={
                selectedCategoryId === 'cat-accessories'
                  ? { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }
                  : { color: '#1E293B' }
              }
            >
              <Smartphone className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
              <span>إكسسوارات الهواتف</span>
            </button>

            <span className="text-slate-300 text-xs hidden sm:inline" aria-hidden="true">|</span>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('cat-stem');
                onSelectSpecialFilter('all');
                onSearchSubmit();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              style={
                selectedCategoryId === 'cat-stem'
                  ? { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }
                  : { color: '#1E293B' }
              }
            >
              <Bot className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
              <span>ألعاب الأطفال الذكية</span>
            </button>

            <span className="text-slate-300 text-xs hidden sm:inline" aria-hidden="true">|</span>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('cat-luxury');
                onSelectSpecialFilter('all');
                onSearchSubmit();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              style={
                selectedCategoryId === 'cat-luxury'
                  ? { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }
                  : { color: '#1E293B' }
              }
            >
              <Gift className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
              <span>الهدايا والتحف</span>
            </button>

            <span className="text-slate-300 text-xs hidden sm:inline" aria-hidden="true">|</span>

            <button
              type="button"
              onClick={onJumpToFlashSales}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-extrabold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              style={
                specialFilter === 'flash'
                  ? {
                      backgroundColor: 'var(--color-secondary-soft)',
                      color: 'var(--color-secondary)',
                    }
                  : { color: 'var(--color-secondary)' }
              }
            >
              <Zap className="w-3.5 h-3.5" />
              <span>عروض الفلاش</span>
            </button>

            <span className="text-slate-300 text-xs hidden sm:inline" aria-hidden="true">|</span>

            <button
              type="button"
              onClick={onOpenWheel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#1E293B] hover:bg-slate-50 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Disc className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
              <span>عجلة الحظ</span>
            </button>

            <span className="text-slate-300 text-xs hidden sm:inline" aria-hidden="true">|</span>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onSelectSpecialFilter('top_rated');
                onSearchSubmit();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              style={
                specialFilter === 'top_rated'
                  ? { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }
                  : { color: '#1E293B' }
              }
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>أفضل التقييمات</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
