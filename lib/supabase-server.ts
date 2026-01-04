// lib/supabase-server.ts
// ✅ Все серверные Supabase клиенты в одном месте

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ===== AUTH CLIENT (с cookies) =====

/**
 * ✅ Основной клиент для auth операций
 * Читает/пишет cookies через Next.js middleware
 * ИСПОЛЬЗУЙ для signIn, signUp, getUser, signOut
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // ✅ ИСПРАВЛЕНО: Правильный синтаксис для cookies().set()
            // name, value, options - отдельные аргументы!
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
            console.log('🍪 [Supabase] Cookies set successfully:', cookiesToSet.length);
          } catch (error) {
            console.error('❌ [Supabase] Error setting cookies:', error);
          }
        },
      },
    }
  );
}

// ===== DATA CLIENTS (для API routes) =====

/**
 * ✅ Admin client - использует SERVICE_ROLE
 * ⚠️ НИКОГДА не давай в браузер!
 * ИСПОЛЬЗУЙ для админ операций, записи в БД
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url, serviceRoleKey);
}

/**
 * ✅ Anon client - использует ANON_KEY
 * ИСПОЛЬЗУЙ для публичных операций (data fetch)
 */
export function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(url, anonKey);
}

/**
 * ✅ Client з custom token - для авторизованных пользователей
 * ИСПОЛЬЗУЙ в API routes когда нужно использовать user token
 */
export function getSupabaseWithToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// ===== ALIAS для совместимости =====

/**
 * ✅ Alias для getSupabaseAdmin()
 * Используется в старых API routes
 */
export function getSupabaseAdminClient() {
  return getSupabaseAdmin();
}

// ===== UTILITY: Verify Admin =====

/**
 * ✅ Проверить что пользователь админ
 * Используй в protected API routes / Server Actions
 */
export async function verifyAdminAccess() {
  try {
    const supabase = await getSupabaseServerClient();

    // 1. Получить текущего пользователя
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      throw new Error('Not authenticated');
    }

    // 2. Проверить роль в БД
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      throw new Error('Not an admin');
    }

    console.log('✅ Admin access verified:', authData.user.email);
    return authData.user;
  } catch (error) {
    console.error('❌ Admin verification failed:', error);
    throw error;
  }
}