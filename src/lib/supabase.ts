import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser, ManagedUserRecord, UserRole } from '../types/store';
import { isAdminEmail, isSuperAdminEmail, SUPERADMIN_EMAIL } from '../utils/commerce';

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
const LOCAL_USERS_DB_KEY = 'almosamem_local_users_v2';

interface LocalUserRecord {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  phoneVerified?: boolean;
  correspondenceEmail?: string;
  defaultDistrict?: string;
  streetAddress?: string;
  role: UserRole;
  createdAt: string;
}

const DEFAULT_SEEDED_USERS: LocalUserRecord[] = [
  {
    id: 'usr-superadmin-1',
    email: SUPERADMIN_EMAIL,
    password: 'SoRa%%777TT',
    fullName: 'المدير التنفيذي للنظام (SuperAdmin)',
    phone: '0500000000',
    phoneVerified: true,
    correspondenceEmail: SUPERADMIN_EMAIL,
    defaultDistrict: 'حي الملقا',
    role: 'superadmin',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-admin-1',
    email: 'admin@almosamem.com.sa',
    password: 'Admin123!',
    fullName: 'مشرف المبيعات — المصمم الأول',
    phone: '0500000001',
    phoneVerified: true,
    correspondenceEmail: 'admin@almosamem.com.sa',
    defaultDistrict: 'حي العليا',
    role: 'admin',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'usr-admin-2',
    email: 'hawasbrothers@gmail.com',
    password: 'Admin123!',
    fullName: 'Hawas Brothers Operations',
    phone: '0500000002',
    phoneVerified: false,
    correspondenceEmail: 'hawasbrothers@gmail.com',
    role: 'admin',
    createdAt: '2026-01-06T00:00:00Z',
  },
  {
    id: 'usr-customer-1',
    email: 'riyadh@almosamem.com.sa',
    password: 'Riyadh123!',
    fullName: 'سلمان العتيبي',
    phone: '0551234567',
    phoneVerified: true,
    defaultDistrict: 'حي الملقا',
    streetAddress: 'طريق أنس بن مالك، مبنى 22',
    role: 'customer',
    createdAt: '2026-02-10T00:00:00Z',
  },
];

function resolveUserRole(email: string, storedRole?: UserRole): UserRole {
  if (isSuperAdminEmail(email)) return 'superadmin';
  if (storedRole === 'superadmin' || storedRole === 'admin' || storedRole === 'customer') {
    return storedRole;
  }
  return isAdminEmail(email) ? 'admin' : 'customer';
}

function readLocalUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_DB_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(DEFAULT_SEEDED_USERS));
      return DEFAULT_SEEDED_USERS;
    }
    const parsed = JSON.parse(raw) as LocalUserRecord[];
    // Ensure primary SuperAdmin always exists with valid role
    const hasSuperAdmin = parsed.some((u) => isSuperAdminEmail(u.email));
    if (!hasSuperAdmin) {
      const merged = [DEFAULT_SEEDED_USERS[0], ...parsed];
      localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed.map((u) => ({
      ...u,
      role: resolveUserRole(u.email, u.role),
      createdAt: u.createdAt || '2026-01-01T00:00:00Z',
    }));
  } catch {
    return DEFAULT_SEEDED_USERS;
  }
}

function saveLocalUsers(users: LocalUserRecord[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(users));
  } catch {
    // ignore storage quota error
  }
}

function toAuthUser(record: LocalUserRecord, provider: 'email' | 'google' = 'email'): AuthUser {
  return {
    id: record.id,
    email: record.email,
    fullName: record.fullName,
    phone: record.phone,
    phoneVerified: record.phoneVerified,
    correspondenceEmail: record.correspondenceEmail || record.email,
    defaultDistrict: record.defaultDistrict,
    streetAddress: record.streetAddress,
    role: resolveUserRole(record.email, record.role),
    provider,
  };
}

export function getLocalSessionUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return {
      ...parsed,
      role: resolveUserRole(parsed.email, parsed.role),
    };
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
        const storedRole = supaUser.user_metadata?.role as UserRole | undefined;
        return {
          id: supaUser.id,
          email: supaUser.email,
          fullName:
            (supaUser.user_metadata?.full_name as string | undefined) ||
            supaUser.email.split('@')[0],
          phone: supaUser.user_metadata?.phone as string | undefined,
          phoneVerified: Boolean(supaUser.user_metadata?.phone_verified),
          correspondenceEmail:
            (supaUser.user_metadata?.correspondence_email as string | undefined) || supaUser.email,
          defaultDistrict: supaUser.user_metadata?.default_district as string | undefined,
          streetAddress: supaUser.user_metadata?.street_address as string | undefined,
          role: resolveUserRole(supaUser.email, storedRole),
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

  const googleUser: AuthUser = {
    id: `google-${Date.now()}`,
    email: 'customer.google@almosamem.com.sa',
    fullName: 'مستخدم جوجل — الرياض',
    phone: '0508881122',
    phoneVerified: true,
    role: 'customer',
    provider: 'google',
  };
  setLocalSessionUser(googleUser);
  return { user: googleUser };
}

export async function signInWithEmailPassword(
  emailOrPhone: string,
  password: string
): Promise<{ user?: AuthUser; error?: string }> {
  const cleanIdentifier = emailOrPhone.trim().toLowerCase();
  if (!cleanIdentifier || !password) {
    return { error: 'يرجى إدخال البريد الإلكتروني (أو رقم الجوال) وكلمة المرور.' };
  }

  if (supabase && cleanIdentifier.includes('@')) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanIdentifier,
      password,
    });
    if (!error && data.user?.email) {
      const storedRole = data.user.user_metadata?.role as UserRole | undefined;
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        fullName:
          (data.user.user_metadata?.full_name as string | undefined) ||
          data.user.email.split('@')[0],
        phone: data.user.user_metadata?.phone as string | undefined,
        phoneVerified: Boolean(data.user.user_metadata?.phone_verified),
        correspondenceEmail:
          (data.user.user_metadata?.correspondence_email as string | undefined) || data.user.email,
        defaultDistrict: data.user.user_metadata?.default_district as string | undefined,
        streetAddress: data.user.user_metadata?.street_address as string | undefined,
        role: resolveUserRole(data.user.email, storedRole),
        provider: 'email',
      };
      setLocalSessionUser(user);
      return { user };
    }
  }

  const users = readLocalUsers();
  const normalizedPhone = cleanIdentifier.replace(/[\s-]/g, '');
  const match = users.find(
    (u) =>
      u.email.toLowerCase() === cleanIdentifier ||
      (u.phone && u.phone.replace(/[\s-]/g, '') === normalizedPhone)
  );
  if (!match || match.password !== password) {
    return { error: 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني/الجوال وكلمة المرور.' };
  }

  const user = toAuthUser(match, 'email');
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
        role: resolveUserRole(data.user.email),
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
    role: resolveUserRole(cleanEmail),
    createdAt: new Date().toISOString(),
  };
  saveLocalUsers([...users, created]);

  const user = toAuthUser(created, 'email');
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

// ---------- Profile & RBAC Management Helpers ----------

export function listManagedUsers(): ManagedUserRecord[] {
  return readLocalUsers().map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    phoneVerified: u.phoneVerified,
    correspondenceEmail: u.correspondenceEmail,
    defaultDistrict: u.defaultDistrict,
    streetAddress: u.streetAddress,
    role: resolveUserRole(u.email, u.role),
    createdAt: u.createdAt,
  }));
}

export function updateManagedUserRole(userId: string, role: UserRole): ManagedUserRecord[] {
  const users = readLocalUsers().map((u) => {
    if (u.id !== userId) return u;
    if (isSuperAdminEmail(u.email)) return { ...u, role: 'superadmin' as UserRole };
    return { ...u, role };
  });
  saveLocalUsers(users);

  const session = getLocalSessionUser();
  if (session && session.id === userId) {
    const updatedTarget = users.find((u) => u.id === userId);
    if (updatedTarget) {
      setLocalSessionUser(toAuthUser(updatedTarget, session.provider));
    }
  }
  return listManagedUsers();
}

export function resetManagedUserPassword(
  userId: string,
  newPassword: string
): { ok: boolean; error?: string } {
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.' };
  }
  const users = readLocalUsers();
  const exists = users.some((u) => u.id === userId);
  if (!exists) return { ok: false, error: 'الحساب غير موجود.' };

  saveLocalUsers(users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)));
  return { ok: true };
}

export function deleteManagedUser(userId: string): {
  ok: boolean;
  users: ManagedUserRecord[];
  error?: string;
} {
  const users = readLocalUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) {
    return { ok: false, users: listManagedUsers(), error: 'الحساب غير موجود.' };
  }
  if (isSuperAdminEmail(target.email)) {
    return {
      ok: false,
      users: listManagedUsers(),
      error: 'لا يمكن حذف حساب مدير التطبيق الأساسي (SuperAdmin).',
    };
  }
  const filtered = users.filter((u) => u.id !== userId);
  saveLocalUsers(filtered);
  return { ok: true, users: listManagedUsers() };
}

export async function updateUserProfile(params: {
  userId: string;
  fullName?: string;
  phone?: string;
  phoneVerified?: boolean;
  correspondenceEmail?: string;
  defaultDistrict?: string;
  streetAddress?: string;
}): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  const users = readLocalUsers();
  const existingIdx = users.findIndex((u) => u.id === params.userId);
  const currentSession = getLocalSessionUser();

  if (existingIdx >= 0) {
    const prev = users[existingIdx];
    const next: LocalUserRecord = {
      ...prev,
      fullName: params.fullName !== undefined ? params.fullName.trim() : prev.fullName,
      phone: params.phone !== undefined ? params.phone.trim() : prev.phone,
      phoneVerified:
        params.phoneVerified !== undefined ? params.phoneVerified : prev.phoneVerified,
      correspondenceEmail:
        params.correspondenceEmail !== undefined
          ? params.correspondenceEmail.trim()
          : prev.correspondenceEmail,
      defaultDistrict:
        params.defaultDistrict !== undefined ? params.defaultDistrict : prev.defaultDistrict,
      streetAddress:
        params.streetAddress !== undefined ? params.streetAddress.trim() : prev.streetAddress,
    };
    const updatedUsers = [...users];
    updatedUsers[existingIdx] = next;
    saveLocalUsers(updatedUsers);

    const updatedAuth = toAuthUser(next, currentSession?.provider || 'email');
    if (currentSession && currentSession.id === params.userId) {
      setLocalSessionUser(updatedAuth);
    }
    return { ok: true, user: updatedAuth };
  }

  if (currentSession && currentSession.id === params.userId) {
    const updatedSession: AuthUser = {
      ...currentSession,
      fullName: params.fullName !== undefined ? params.fullName.trim() : currentSession.fullName,
      phone: params.phone !== undefined ? params.phone.trim() : currentSession.phone,
      phoneVerified:
        params.phoneVerified !== undefined ? params.phoneVerified : currentSession.phoneVerified,
      correspondenceEmail:
        params.correspondenceEmail !== undefined
          ? params.correspondenceEmail.trim()
          : currentSession.correspondenceEmail,
      defaultDistrict:
        params.defaultDistrict !== undefined
          ? params.defaultDistrict
          : currentSession.defaultDistrict,
      streetAddress:
        params.streetAddress !== undefined
          ? params.streetAddress.trim()
          : currentSession.streetAddress,
    };
    setLocalSessionUser(updatedSession);
    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: updatedSession.fullName,
            phone: updatedSession.phone,
            phone_verified: updatedSession.phoneVerified,
            correspondence_email: updatedSession.correspondenceEmail,
            default_district: updatedSession.defaultDistrict,
            street_address: updatedSession.streetAddress,
          },
        });
      } catch {
        // ignore metadata sync error
      }
    }
    return { ok: true, user: updatedSession };
  }

  return { ok: false, error: 'لم يتم العثور على بيانات المستخدم.' };
}

export async function changeUserPassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.newPassword || params.newPassword.length < 6) {
    return { ok: false, error: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.' };
  }

  if (supabase) {
    try {
      const { error } = await supabase.auth.updateUser({ password: params.newPassword });
      if (!error) return { ok: true };
    } catch {
      // fall through to local user db
    }
  }

  const users = readLocalUsers();
  const target = users.find((u) => u.id === params.userId);
  if (!target) {
    return { ok: false, error: 'الحساب غير موجود.' };
  }
  if (target.password !== params.currentPassword) {
    return { ok: false, error: 'كلمة المرور الحالية غير صحيحة.' };
  }
  saveLocalUsers(
    users.map((u) => (u.id === params.userId ? { ...u, password: params.newPassword } : u))
  );
  return { ok: true };
}

