// lib/admin.ts
// ✅ Server-side only utility for verifying admin access

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'vip' | 'user';
}

// Кэш ролей (in-memory на сервере)
const adminCache = new Map<string, { user: AdminUser; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

function getCachedAdmin(userId: string): AdminUser | null {
  const cached = adminCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  adminCache.delete(userId);
  return null;
}

function setCachedAdmin(userId: string, user: AdminUser) {
  adminCache.set(userId, { user, timestamp: Date.now() });
}

/**
 * ✅ Server-side функция для проверки админ-доступа
 * Используется в app/admin/layout.tsx
 *
 * Возвращает:
 * - null если пользователь не авторизован
 * - { error: 'message' } если пользователь не админ
 * - { admin: AdminUser } если пользователь админ
 */
export async function verifyAdminAccess(): Promise<
  { admin: AdminUser } | { error: string } | null
> {
  try {
    if (process.env.NODE_ENV !== 'production') {
    }

    // ✅ Получаем cookies - это async в Next.js 14+
    const cookieStore = await cookies();

    if (process.env.NODE_ENV !== 'production') {
    }

    // ✅ Создаем Supabase client с правильной конфигурацией cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set({ name, value, ...options });
              });
            } catch (error) {
              console.error('[Supabase] Error setting cookies:', error);
            }
          },
        },
      }
    );

    if (process.env.NODE_ENV !== 'production') {
    }

    // ✅ Получаем пользователя из Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (process.env.NODE_ENV !== 'production') {
    }

    if (userError || !user) {
      if (process.env.NODE_ENV !== 'production') {
      }
      return null;
    }

    const userId = user.id;
    if (process.env.NODE_ENV !== 'production') {
    }

    // ✅ Проверка кэша
    const cachedAdmin = getCachedAdmin(userId);
    if (cachedAdmin) {
      if (process.env.NODE_ENV !== 'production') {
      }
      return { admin: cachedAdmin };
    }

    if (process.env.NODE_ENV !== 'production') {
    }

    // ✅ Получаем роль из БД
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, username, role')
      .eq('id', userId)
      .single();

    if (process.env.NODE_ENV !== 'production') {
    }

    if (profileError || !profile) {
      console.error('🔴 [verifyAdminAccess] Profile not found:', profileError?.message);
      return { error: 'User profile not found' };
    }

    // ✅ Проверяем роль
    if (profile.role !== 'admin') {
      if (process.env.NODE_ENV !== 'production') {
      }
      return { error: 'Not an admin' };
    }

    // ✅ Кешируем админа
    const adminUser: AdminUser = {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      role: 'admin',
    };

    setCachedAdmin(userId, adminUser);
    if (process.env.NODE_ENV !== 'production') {
    }

    return { admin: adminUser };
  } catch (error) {
    console.error('🔴 [verifyAdminAccess] Server error:', error);
    return { error: 'Server error' };
  }
}

/**
 * ✅ Альтернативная версия с собственным token'ом
 * (если нужна проверка при прямом запросе токена)
 */
export async function verifyAdminWithToken(
  token: string
): Promise<AdminUser | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // Нет необходимости устанавливать cookies при прямом токене
          },
        },
      }
    );

    const { data: userData, error } = await supabase.auth.getUser(token);

    if (error || !userData?.user) {
      console.error('🔴 [verifyAdminWithToken] Token invalid:', error?.message);
      return null;
    }

    const userId = userData.user.id;

    // ✅ Проверить кэш
    const cachedAdmin = getCachedAdmin(userId);
    if (cachedAdmin) return cachedAdmin;

    // ✅ Получить роль с БД
    const { data: userDB } = await supabase
      .from('users')
      .select('id, email, username, role')
      .eq('id', userId)
      .single();

    if (!userDB || userDB.role !== 'admin') {
      if (process.env.NODE_ENV !== 'production') {
      }
      return null;
    }

    const adminUser: AdminUser = {
      id: userDB.id,
      email: userDB.email,
      username: userDB.username,
      role: 'admin',
    };

    setCachedAdmin(userId, adminUser);
    if (process.env.NODE_ENV !== 'production') {
    }
    return adminUser;
  } catch (error) {
    console.error('🔴 [verifyAdminWithToken] Token verify error:', error);
    return null;
  }
}