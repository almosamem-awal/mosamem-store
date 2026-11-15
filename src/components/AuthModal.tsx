import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, LogOut, ShieldCheck, KeyRound } from 'lucide-react';
import type { AuthUser } from '../types/store';
import {
  sendPasswordResetEmail,
  signInWithEmailPassword,
  signInWithGoogleOAuth,
  signOutUser,
  signUpWithEmailPassword,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: AuthUser | null;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
  onSignedOut: () => void;
  onContinueAsGuest?: () => void;
  showGuestOption?: boolean;
}

type AuthTab = 'login' | 'signup' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onAuthenticated,
  onSignedOut,
  onContinueAsGuest,
  showGuestOption = true,
}) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await signInWithGoogleOAuth();
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
      return;
    }
    if (res.user) {
      onAuthenticated(res.user);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    if (tab === 'login') {
      const res = await signInWithEmailPassword(email, password);
      setLoading(false);
      if (res.error || !res.user) {
        setErrorMsg(res.error || 'تعذر تسجيل الدخول.');
        return;
      }
      onAuthenticated(res.user);
      onClose();
      return;
    }

    if (tab === 'signup') {
      const res = await signUpWithEmailPassword({
        email,
        password,
        fullName,
        phone,
      });
      setLoading(false);
      if (res.error || !res.user) {
        setErrorMsg(res.error || 'تعذر إنشاء الحساب.');
        return;
      }
      onAuthenticated(res.user);
      onClose();
      return;
    }

    const resetRes = await sendPasswordResetEmail(email);
    setLoading(false);
    if (!resetRes.ok) {
      setErrorMsg(resetRes.messageAr);
    } else {
      setInfoMsg(resetRes.messageAr);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    onSignedOut();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="حساب العميل والمصادقة"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-[#0B0F19] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">
              {currentUser ? 'حسابي في المصمم الأول' : 'تسجيل الدخول أو إنشاء حساب'}
            </h2>
            <p className="text-xs text-slate-400">
              فعّل خيارات تمارا وتابي والدفع عند الاستلام بالرياض
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الحساب"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B0F19]">{currentUser.fullName}</span>
                  <span className="text-xs font-semibold text-[#059669]">
                    {currentUser.role === 'admin' ? 'مدير النظام' : 'عضو موثق'}
                  </span>
                </div>
                <div className="text-xs text-slate-600">{currentUser.email}</div>
                {currentUser.phone && (
                  <div className="text-xs text-slate-500 font-mono">{currentUser.phone}</div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span>حسابك موثق: جميع بوابات الدفع (مدى، تمارا، تابي، عند الاستلام) متاحة لك.</span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`py-2 rounded-md transition-colors ${
                    tab === 'login' ? 'bg-white text-[#0B0F19] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  دخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`py-2 rounded-md transition-colors ${
                    tab === 'signup' ? 'bg-white text-[#0B0F19] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  حساب جديد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('reset');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`py-2 rounded-md transition-colors ${
                    tab === 'reset' ? 'bg-white text-[#0B0F19] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  استعادة كلمة المرور
                </button>
              </div>

              {/* Google OAuth Button */}
              {tab !== 'reset' && (
                <>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-[#0B0F19] text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                    <span>المتابعة بحساب Google</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <span className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-xs text-slate-400 shrink-0">أو</span>
                    <span className="border-t border-slate-200 w-full" />
                  </div>
                </>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {tab === 'signup' && (
                  <>
                    <div>
                      <label htmlFor="auth-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                        الاسم الكامل
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        <input
                          id="auth-fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="محمد العبدالله"
                          className="w-full pr-9 pl-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="auth-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                        رقم الجوال (السعودية)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        <input
                          id="auth-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05XXXXXXXX"
                          className="w-full pr-9 pl-3 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:border-[#059669] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pr-9 pl-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                </div>

                {tab !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="auth-password" className="text-xs font-semibold text-slate-700">
                        كلمة المرور
                      </label>
                      {tab === 'login' && (
                        <button
                          type="button"
                          onClick={() => setTab('reset')}
                          className="text-xs text-[#059669] hover:underline"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        id="auth-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-9 pl-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#059669] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {errorMsg}
                  </p>
                )}

                {infoMsg && (
                  <p role="status" className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                    {infoMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg hover:opacity-90 font-bold text-sm transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-contrast)',
                  }}
                >
                  {tab === 'reset' && <KeyRound className="w-4 h-4" />}
                  <span>
                    {loading
                      ? 'جاري التنفيذ...'
                      : tab === 'login'
                      ? 'تسجيل الدخول'
                      : tab === 'signup'
                      ? 'إنشاء الحساب'
                      : 'إرسال رابط استعادة كلمة المرور'}
                  </span>
                </button>
              </form>

              {tab === 'login' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">حسابات تجريبية سريعة:</div>
                  <div>
                    عميل الرياض: <span className="font-mono">riyadh@almosamem.com.sa</span> /{' '}
                    <span className="font-mono">Riyadh123!</span>
                  </div>
                  <div>
                    مدير المتجر: <span className="font-mono">admin@almosamem.com.sa</span> /{' '}
                    <span className="font-mono">Admin123!</span>
                  </div>
                </div>
              )}

              {showGuestOption && onContinueAsGuest && (
                <button
                  type="button"
                  onClick={() => {
                    onContinueAsGuest();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  دخول زائر كضيف (يتيح الدفع بمدى، Apple Pay، والبطاقات)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
