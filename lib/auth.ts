// lib/auth.ts
// Server-side authentication utilities
// Только необходимые функции для админ-панели и server components

'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from './supabase-server';

// ===== ACCESS TOKEN =====
// Используется в админ-панели для API запросов

export async function getAccessToken(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

// ===== ADMIN FUNCTIONS =====
// Функции для проверки и управления ролями пользователей

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getUserRole(userId: string): Promise<'user' | 'vip' | 'admin' | null> {
  const supabaseAdmin = getSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return null;
  }

  return data?.role || 'user';
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function getCurrentUserRole(): Promise<'user' | 'vip' | 'admin' | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return getUserRole(data.user.id);
}

export async function setUserRole(
  userId: string,
  role: 'user' | 'vip' | 'admin',
  durationType: 'permanent' | 'month' | 'custom_days' = 'permanent',
  customDays?: number
) {
  const supabaseAdmin = getSupabaseAdminClient();

  let roleExpiration: string | null = null;

  if (durationType === 'month') {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    roleExpiration = now.toISOString();
  } else if (durationType === 'custom_days' && customDays) {
    const now = new Date();
    now.setDate(now.getDate() + customDays);
    roleExpiration = now.toISOString();
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      role,
      role_duration_type: durationType,
      role_expiration: roleExpiration,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('❌ [Auth] Error setting user role:', error);

    const msg = String(error.message || error);
    if (msg.includes('record "new" has no field "updated_at"')) {
      return {
        error:
          'Database trigger error: missing "updated_at" on users table. Add an "updated_at" column or update the trigger that references it.'
      };
    }

    return { error: error.message };
  }

  return { success: true };
}
