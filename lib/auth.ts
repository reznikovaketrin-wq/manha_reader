// lib/auth.ts
// ✅ ИСПРАВЛЕНО: Загружает role из таблицы users!

'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from './supabase-server';

// ===== EMAIL & PASSWORD =====

export async function signUpWithEmail(email: string, password: string, username: string) {
  console.log('📝 [Auth] Signing up:', email);

  const supabase = await getSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('❌ [Auth] Signup error:', authError.message);
    return { error: authError.message };
  }

  if (!authData.user) {
    const msg = 'User creation failed';
    console.error('❌ [Auth]', msg);
    return { error: msg };
  }

  console.log('✅ [Auth] Auth user created:', authData.user.id);

  const supabaseAdmin = getSupabaseAdminClient();
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      username,
      role: 'user',
    });

  if (profileError) {
    console.error('❌ [Auth] Profile creation error:', profileError.message);
    return { error: profileError.message };
  }

  console.log('✅ [Auth] Profile created');
  console.log('🍪 [Auth] Cookies set');

  return {
    success: true,
    user: {
      id: authData.user.id,
      email: authData.user.email!,
      user_metadata: { role: 'user', username },
    },
  };
}

export async function signInWithEmail(email: string, password: string) {
  console.log('🔐 [Auth] Signing in:', email);

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ [Auth] Signin error:', error.message);
    return { error: error.message };
  }

  console.log('✅ [Auth] User signed in:', data.user?.email);

  // ✅ Загружаем роль из таблицы users!
  const supabaseAdmin = getSupabaseAdminClient();
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role, username')
    .eq('id', data.user!.id)
    .single();

  console.log('📋 [Auth] User data from DB:', userData);

  console.log('🍪 [Auth] Cookies set');

  return {
    success: true,
    user: {
      id: data.user!.id,
      email: data.user!.email!,
      user_metadata: {
        role: userData?.role || 'user',
        username: userData?.username,
      },
    },
  };
}

// ===== OAUTH =====

export async function signInWithGoogle() {
  console.log('🌐 [Auth] Starting Google OAuth...');

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    console.error('❌ [Auth] Google signin error:', error.message);
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithGithub() {
  console.log('🌐 [Auth] Starting GitHub OAuth...');

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    console.error('❌ [Auth] Github signin error:', error.message);
    return { error: error.message };
  }

  return { success: true };
}

// ===== SESSION =====

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ [Auth] Get user error:', error);
    return null;
  }

  if (!data.user) {
    return null;
  }

  // ✅ Загружаем роль из таблицы users!
  const supabaseAdmin = getSupabaseAdminClient();
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role, username')
    .eq('id', data.user.id)
    .single();

  console.log('👤 [Auth] Current user:', data.user.email, 'Role:', userData?.role || 'user');

  return {
    id: data.user.id,
    email: data.user.email,
    user_metadata: {
      ...data.user.user_metadata,
      role: userData?.role || 'user',
      username: userData?.username,
    },
  };
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

export async function signOut() {
  console.log('👋 [Auth] Signing out...');

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('❌ [Auth] signOut error:', error.message);
    return { error: error.message };
  }

  console.log('✅ [Auth] signOut completed successfully');
  console.log('🍪 [Auth] Cookies cleared');

  return { success: true };
}

export async function resetPassword(email: string) {
  console.log('📧 [Auth] Resetting password for:', email);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) {
    console.error('❌ [Auth] Reset password error:', error.message);
    return { error: error.message };
  }

  return { success: true };
}

// ===== USERNAME =====

export async function checkUsernameAvailable(username: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (error && error.code === 'PGRST116') {
    return { available: true };
  }

  if (error) {
    console.error('❌ [Auth] Check username error:', error);
    return { available: false };
  }

  return { available: false };
}

// ===== ADMIN FUNCTIONS =====

export async function getUserRole(userId: string): Promise<'user' | 'admin' | null> {
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

export async function getCurrentUserRole(): Promise<'user' | 'admin' | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return getUserRole(data.user.id);
}

export async function setUserRole(userId: string, role: 'user' | 'admin') {
  const supabaseAdmin = getSupabaseAdminClient();

  const { error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('❌ [Auth] Error setting user role:', error);
    return { error: error.message };
  }

  return { success: true };
}