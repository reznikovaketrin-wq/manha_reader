import { createClient } from '@supabase/supabase-js';
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 [API /admin/check] Request received');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [API] No auth header');
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔑 [API] Token:', token.substring(0, 20) + '...');

    // Создать Supabase client с токеном пользователя
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

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
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (authData.error || !authData.data?.user) {
      console.error('❌ [API] Auth error:', authData.error?.message);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authData.data.user.id;
    console.log('👤 [API] User:', authData.data.user.email);

    // Проверить кеш роли
    const cachedRole = getRoleFromCache(userId);
    if (cachedRole) {
      console.log('💾 [API] Using cached role:', cachedRole);

      if (cachedRole !== 'admin') {
        return NextResponse.json(
          { error: 'Not an admin' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: authData.data.user.email,
          username: authData.data.user.user_metadata?.username || '',
          role: 'admin',
        },
      });
    }

    // Создать admin Supabase client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

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
      return NextResponse.json(
        { error: 'User lookup timeout' },
        { status: 500 }
      );
    }

    if (userData.error) {
      console.error('❌ [API] User query error:', userData.error.message);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('📊 [API] User data:', userData.data);

    // Проверить роль
    const role = userData.data?.role;
    setRoleCache(userId, role);

    if (role !== 'admin') {
      console.error('❌ [API] Not admin, role:', role);
      return NextResponse.json(
        { error: 'Not an admin', role },
        { status: 403 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [API] Admin check passed (${duration}ms)`);

    return NextResponse.json({
      success: true,
      user: {
        id: userData.data.id,
        email: userData.data.email,
        username: userData.data.username,
        role: userData.data.role,
      },
    });
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error);
    const duration = Date.now() - startTime;
    console.log(`⏱️ [API] Total duration: ${duration}ms`);

    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}