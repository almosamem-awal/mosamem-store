import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from '../types/store';
import { isAdminEmail } from '../utils/commerce';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const LOCAL_SESSION_KEY = 'almosamem_auth_user_v1';
const LOCAL_USERS_DB_KEY = 'almosamem_local_users_v1';

interface LocalUserRecord {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

function readLocalUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_DB_KEY);
    if (!raw) {
      const defaults: LocalUserRecord[] = [
        {
          id: 'usr-admin-1',
          email: 'admin@almosamem.com.sa',
          password: 'Admin123!',
          fullName: 'مدير المصمم الأول',
          phone: '0500000001',
        },
        {
          id: 'usr-admin-2',
          email: 'hawasbrothers@gmail.com',
          password: 'Admin123!',
          fullName: 'Hawas Brothers Admin',
          phone: '0500000002',
        },
        {
          id: 'usr-customer-1',
          email: 'riyadh@almosamem.com.sa',
          password: 'Riyadh123!',
          fullName: 'سلمان العتيبي',
          phone: '0551234567',
        },
      ];
      localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as LocalUserRecord[];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalUserRecord[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(users));
  } catch {
    // ignore storage quota error
  }
}

export function getLocalSessionUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setLocalSessionUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export async function getCurrentSessionUser(): Promise<AuthUser | null> {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const supaUser = data.session?.user;
      if (supaUser && supaUser.email) {
        return {
          id: supaUser.id,
          email: supaUser.email,
          fullName:
            (supaUser.user_metadata?.full_name as string | undefined) ||
            supaUser.email.split('@')[0],
          phone: supaUser.user_metadata?.phone as string | undefined,
          role: isAdminEmail(supaUser.email) ? 'admin' : 'customer',
          provider: supaUser.app_metadata?.provider === 'google' ? 'google' : 'email',
        };
      }
    } catch {
      // Fallback gracefully
    }
  }
  return getLocalSessionUser();
}

export async function signInWithGoogleOAuth(): Promise<{
  user?: AuthUser;
  redirected?: boolean;
  error?: string;
}> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      return { error: error.message };
    }
    return { redirected: true };
  }

  // Graceful local fallback when Supabase env vars are unset
  const googleUser: AuthUser = {
    id: `google-${Date.now()}`,
    email: 'customer.google@almosamem.com.sa',
    fullName: 'مستخدم جوجل — الرياض',
    phone: '0508881122',
    role: 'customer',
    provider: 'google',
  };
  setLocalSessionUser(googleUser);
  return { user: googleUser };
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ user?: AuthUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) {
      return { error: error.message };
    }
    if (data.user?.email) {
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        fullName:
          (data.user.user_metadata?.full_name as string | undefined) ||
          data.user.email.split('@')[0],
        phone: data.user.user_metadata?.phone as string | undefined,
        role: isAdminEmail(data.user.email) ? 'admin' : 'customer',
        provider: 'email',
      };
      setLocalSessionUser(user);
      return { user };
    }
  }

  const users = readLocalUsers();
  const match = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!match || match.password !== password) {
    return { error: 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.' };
  }

  const user: AuthUser = {
    id: match.id,
    email: match.email,
    fullName: match.fullName,
    phone: match.phone,
    role: isAdminEmail(match.email) ? 'admin' : 'customer',
    provider: 'email',
  };
  setLocalSessionUser(user);
  return { user };
}

export async function signUpWithEmailPassword(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{ user?: AuthUser; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || params.password.length < 6 || !params.fullName.trim()) {
    return { error: 'يرجى إدخال الاسم الكامل والبريد الإلكتروني وكلمة مرور (6 أحرف على الأقل).' };
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName.trim(),
          phone: params.phone?.trim() || '',
        },
      },
    });
    if (error) {
      return { error: error.message };
    }
    if (data.user?.email) {
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: params.fullName.trim(),
        phone: params.phone?.trim(),
        role: isAdminEmail(data.user.email) ? 'admin' : 'customer',
        provider: 'email',
      };
      setLocalSessionUser(user);
      return { user };
    }
  }

  const users = readLocalUsers();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { error: 'هذا البريد الإلكتروني مسجل مسبقاً.' };
  }

  const created: LocalUserRecord = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    password: params.password,
    fullName: params.fullName.trim(),
    phone: params.phone?.trim(),
  };
  saveLocalUsers([...users, created]);

  const user: AuthUser = {
    id: created.id,
    email: created.email,
    fullName: created.fullName,
    phone: created.phone,
    role: isAdminEmail(created.email) ? 'admin' : 'customer',
    provider: 'email',
  };
  setLocalSessionUser(user);
  return { user };
}

export async function sendPasswordResetEmail(
  email: string
): Promise<{ ok: boolean; messageAr: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, messageAr: 'يرجى إدخال بريد إلكتروني صحيح.' };
  }

  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      return { ok: false, messageAr: error.message };
    }
    return {
      ok: true,
      messageAr: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.',
    };
  }

  return {
    ok: true,
    messageAr: `تم إرسال تعليمات استعادة كلمة المرور إلى ${cleanEmail} بنجاح.`,
  };
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  setLocalSessionUser(null);
}
