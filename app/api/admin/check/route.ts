import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// Кеш для ролей пользователей (в памяти сервера)
const roleCache = new Map<string, { role: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

function getRoleFromCache(userId: string): string | null {
  const cached = roleCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.role;
  }
  roleCache.delete(userId);
  return null;
}

function setRoleCache(userId: string, role: string) {
  roleCache.set(userId, { role, timestamp: Date.now() });
}

// ✅ Переместить verifyAdmin функцию ВВЕРХ
async function verifyAdmin(token: string) {
  const supabaseUser = getSupabaseWithToken(token);

  // Получить пользователя с timeout
  const getAuthPromise = supabaseUser.auth.getUser();
  const getAuthTimeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Auth timeout')), 3000)
  );

  let authData: any;
  try {
    authData = await Promise.race([getAuthPromise, getAuthTimeout]);
  } catch (err) {
    console.error('❌ [API] Auth timeout or error');
    throw new Error('Authentication failed');
  }

  if (authData.error || !authData.data?.user) {
    console.error('❌ [API] Auth error:', authData.error?.message);
    throw new Error('Unauthorized');
  }

  const userId = authData.data.user.id;

  // Проверить кеш роли
  const cachedRole = getRoleFromCache(userId);
  if (cachedRole) {
    if (cachedRole !== 'admin') {
      throw new Error('Not an admin');
    }
    return {
      id: userId,
      email: authData.data.user.email,
      username: authData.data.user.user_metadata?.username || '',
      role: 'admin',
    };
  }

  // ✅ Используем getSupabaseAdmin() вместо createClient
  const supabaseAdmin = getSupabaseAdmin();

  // Получить данные из таблицы users с timeout
  const getUserPromise = supabaseAdmin
    .from('users')
    .select('id, email, username, role')
    .eq('id', userId)
    .single();

  const getUserTimeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('User query timeout')), 3000)
  );

  let userData: any;
  try {
    userData = await Promise.race([getUserPromise, getUserTimeout]);
  } catch (err) {
    console.error('❌ [API] User query timeout');
    throw new Error('User lookup timeout');
  }

  if (userData.error) {
    console.error('❌ [API] User query error:', userData.error.message);
    throw new Error('User not found');
  }

  // Проверить роль
  const role = userData.data?.role;
  setRoleCache(userId, role);

  if (role !== 'admin') {
    console.error('❌ [API] Not admin, role:', role);
    throw new Error('Not an admin');
  }

  return {
    id: userData.data.id,
    email: userData.data.email,
    username: userData.data.username,
    role: userData.data.role,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [API] No auth header');
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // ✅ Вызвать verifyAdmin функцию
    const user = await verifyAdmin(token);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    const duration = Date.now() - startTime;

    const message = error instanceof Error ? error.message : 'Server error';
    const status =
      message === 'Unauthorized' ? 401 :
      message === 'Not an admin' ? 403 :
      500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}