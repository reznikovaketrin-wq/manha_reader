/**
 * lib/supabase-server.ts
 * 
 * ✅ Серверные Supabase клиенты
 * Создаются во время runtime (не на build time)
 * Безопасно использовать в API routes и Server Components
 */

import { createClient } from '@supabase/supabase-js';

// ✅ Клиент с SERVICE_ROLE (для админ операций и записи в БД)
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key);
}

// ✅ Клиент с ANON_KEY (для публичных операций)
export function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, key);
}

// ✅ Клиент с кастомным токеном (для авторизованных пользователей)
export function getSupabaseWithToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// ✅ Утилита для верификации админа
export async function verifyAdmin(token: string) {
  try {
    const supabaseUser = getSupabaseWithToken(token);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: authData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authData.user) {
      throw new Error('Unauthorized');
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      throw new Error('Not an admin');
    }

    return authData.user;
  } catch (error) {
    console.error('❌ Admin verification failed:', error);
    throw error;
  }
}