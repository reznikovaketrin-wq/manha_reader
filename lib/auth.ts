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

    // Создаём профиль в таблице users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
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

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return data.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Signout error:', error);
    return { success: false, error };
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

    return { available: false };
  } catch (error) {
    console.error('Check username error:', error);
    return { available: false };
  }
}