// auth.ts
import { supabase } from './supabase';

// ===== EMAIL & PASSWORD =====

export async function signUpWithEmail(email: string, password: string, username: string) {
  try {
    // Регистрация через Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Создаём профиль в таблице users с role = 'user'
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        role: 'user', // По умолчанию обычный пользователь
      });

    if (profileError) throw profileError;

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Signin error:', error);
    return { success: false, error };
  }
}

// ===== OAUTH =====

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Google signin error:', error);
    return { success: false, error };
  }
}

export async function signInWithGithub() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Github signin error:', error);
    return { success: false, error };
  }
}

// ===== SESSION =====

/**
 * Возвращает актуальную сессию/пользователя.
 * Гарантированно вызывает refreshSession() перед чтением.
 */
export async function getCurrentUser() {
  try {
    // Обновляем сессию (если есть refresh token)
    await supabase.auth.refreshSession();

    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return data.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Получить актуальный access token (или null).
 * Используй перед fetch('/api/...') чтобы быть уверенным, что токен свежий.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    await supabase.auth.refreshSession();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token ?? null;
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function signOut(): Promise<{ success: boolean; error?: any }> {
  try {
    // Попробуем корректно выйти
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [Auth] signOut error:', error);
      return { success: false, error };
    }
    console.log('✅ [Auth] signOut completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ [Auth] signOut exception:', error);
    // Даже если что-то сломалось — считаем, что клиент должен уйти с защищённых страниц
    return { success: true };
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error };
  }
}

// ===== CHECK USERNAME =====

export async function checkUsernameAvailable(username: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // No results = username is available
      return { available: true };
    }

    if (error) throw error;

    // если вернулось что-то — username занят
    return { available: false };
  } catch (error) {
    console.error('Check username error:', error);
    return { available: false };
  }
}

// ===== ADMIN FUNCTIONS =====

export async function getUserRole(userId: string): Promise<'user' | 'admin' | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.role || 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function getCurrentUserRole(): Promise<'user' | 'admin' | null> {
  try {
    // Обновляем сессию перед чтением пользователя
    await supabase.auth.refreshSession();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return getUserRole(data.user.id);
  } catch (error) {
    console.error('Error getting current user role:', error);
    return null;
  }
}

export async function setUserRole(userId: string, role: 'user' | 'admin') {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    return { success: false, error };
  }
}
