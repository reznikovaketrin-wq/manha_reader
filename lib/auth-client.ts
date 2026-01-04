// lib/auth-client.ts
// ✅ ПРАВИЛЬНО: SignOut вызывается В БРАУЗЕРЕ, Supabase синхронизируется мгновенно

'use client';

import { supabase } from '@/lib/supabase-client';

/**
 * ✅ ПРАВИЛЬНЫЙ способ выхода из аккаунта
 * 
 * Что происходит:
 * 1. supabase.auth.signOut() вызывается в браузере
 * 2. onAuthStateChange срабатывает автоматически
 * 3. localStorage очищается
 * 4. cookies синхронизируются
 * 5. UserProvider обновляет состояние
 * 
 * ➡️ БЕЗ reload, БЕЗ задержек, мгновенно
 */
export async function signOutClient() {
  try {
    console.log('🔐 [AuthClient] Signing out from browser...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ [AuthClient] SignOut error:', error.message);
      throw error;
    }
    
    console.log('✅ [AuthClient] SignOut successful');
    console.log('🔔 [AuthClient] onAuthStateChange will trigger automatically');
    
    return { success: true };
  } catch (error) {
    console.error('❌ [AuthClient] SignOut failed:', error);
    throw error;
  }
}

/**
 * Optional: Проверить текущую сессию в браузере
 */
export async function getSessionClient() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return data.session;
  } catch (error) {
    console.error('❌ [AuthClient] Get session error:', error);
    return null;
  }
}