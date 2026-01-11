// lib/supabase-server.ts
// ✅ Все серверные Supabase клиенты в одном месте

import { cookies } from 'next/headers';

// ===== AUTH CLIENT (с cookies) =====

/**
 * ✅ Основной клиент для auth операций
 * Читает/пишет cookies через Next.js middleware
 * ИСПОЛЬЗУЙ для signIn, signUp, getUser, signOut в Server Actions и Route Handlers
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  // Dynamic import to avoid running @supabase/ssr initialization during
  // Next.js prerender/build when env vars are not present in the environment.
  const { createServerClient } = await import('@supabase/auth-helpers-nextjs');

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.error('❌ [Supabase] Error setting cookies:', error);
          }
        },
      },
    }
  );
}

/**
 * ✅ Read-only клиент для Server Components
 * Только читает cookies, НЕ ПИШЕТ
 * ИСПОЛЬЗУЙ для getUser, getData в Server Components
 */
export async function getSupabaseServerComponentClient() {
  const cookieStore = await cookies();
  const { createServerClient } = await import('@supabase/auth-helpers-nextjs');

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server Components can't modify cookies - do nothing
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

  // Dynamic import to defer module initialization until runtime where envs exist
  // This prevents build-time errors when Vercel isn't configured with env vars.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js');
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

  const { createClient } = require('@supabase/supabase-js');
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

  const { createClient } = require('@supabase/supabase-js');
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

// ===== VIEWS - Server-side implementation =====

/**
 * Server-side track view with dedupe using `views_logs` and `views` tables.
 * Uses admin client to modify DB.
 */
export async function trackManhwaViewServer(
  manhwaId: string,
  chapterId?: string,
  userId?: string,
  dedupeHours: number = 24
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - dedupeHours * 3600 * 1000).toISOString();

    try {
      if (userId) {
        const { data: recent, error: recentErr } = await supabaseAdmin
          .from('views_logs')
          .select('id, created_at')
          .eq('manhwa_id', manhwaId)
          .eq('user_id', userId)
          .gt('created_at', cutoff)
          .limit(1)
          .maybeSingle();

        if (recentErr) throw recentErr;

        if (!recent) {
          const { error: insertErr } = await supabaseAdmin.from('views_logs').insert({
            manhwa_id: manhwaId,
            chapter_id: chapterId || null,
            user_id: userId,
            created_at: new Date().toISOString(),
          });
          if (insertErr) throw insertErr;

          const { data: existingView, error: viewErr } = await supabaseAdmin
            .from('views')
            .select('view_count')
            .eq('manhwa_id', manhwaId)
            .maybeSingle();
          if (viewErr) throw viewErr;

          if (existingView) {
            const { error } = await supabaseAdmin
              .from('views')
              .update({
                view_count: existingView.view_count + 1,
                last_viewed_at: new Date().toISOString(),
              })
              .eq('manhwa_id', manhwaId);
            if (error) throw error;
          } else {
            const { error } = await supabaseAdmin.from('views').insert({
              manhwa_id: manhwaId,
              view_count: 1,
              last_viewed_at: new Date().toISOString(),
            });
            if (error) throw error;
          }
        }

        return { success: true };
      }
    } catch (err) {
      console.warn('views_logs dedupe failed, falling back to simple increment', err);
    }

    // Fallback: simple increment
    const { data: existingView, error: existingErr } = await getSupabaseAdmin()
      .from('views')
      .select('view_count')
      .eq('manhwa_id', manhwaId)
      .maybeSingle();

    if (existingErr) throw existingErr;

    if (existingView) {
      const { error } = await getSupabaseAdmin()
        .from('views')
        .update({ view_count: existingView.view_count + 1, last_viewed_at: new Date().toISOString() })
        .eq('manhwa_id', manhwaId);
      if (error) throw error;
    } else {
      const { error } = await getSupabaseAdmin().from('views').insert({
        manhwa_id: manhwaId,
        view_count: 1,
        last_viewed_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking view (server):', error);
    return { success: false, error };
  }
}