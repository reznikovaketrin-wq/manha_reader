// app/auth/callback/route.ts
// ✅ OAuth callback - with SERVICE_ROLE_KEY for security

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side guest→user sync helper
 * Migrates localStorage triw_reading_history to database on successful login
 */
async function syncGuestReadingHistoryServer(userId: string, guestHistory: any[]) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookies().set(name, value, options)
              );
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    const CAP = 200; // chapter cap, same as client

    for (const entry of guestHistory) {
      const { manhwa_id, chapter_id, chapter_number } = entry;
      if (!manhwa_id || !chapter_id || typeof chapter_number !== 'number') continue;

      // Call RPC to atomically add read chapter
      const { error } = await supabase.rpc('add_read_chapter', {
        p_user_id: userId,
        p_manhwa_id: manhwa_id,
        p_chapter_id: chapter_id,
        p_chapter_number: chapter_number,
        p_cap: CAP,
      });

      if (error) {
        console.error(`Failed to sync guest chapter ${chapter_id}:`, error.message);
      }
    }

    console.log(`✅ [Sync] Migrated ${guestHistory.length} guest chapters for user ${userId}`);
  } catch (err) {
    console.error('❌ [Sync] Guest reading history sync failed:', err);
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('🔐 [Callback] Received OAuth callback');
  console.log('📝 [Callback] Code:', code ? 'EXISTS' : 'NO CODE');
  console.log('📝 [Callback] Error:', error || 'NO ERROR');

  // ❌ Если есть ошибка OAuth (пользователь отменил, и т.д.)
  if (error) {
    console.error('❌ [Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // ❌ Если нет кода - ошибка
  if (!code) {
    console.error('❌ [Callback] No code provided');
    return NextResponse.redirect(
      new URL('/auth?error=no_code', request.url)
    );
  }

  // ✅ Обмениваем код на сессию
  try {
    // ✅ ВАЖНО: используем SERVICE_ROLE_KEY для безопасности на сервере!
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← SERVICE_ROLE_KEY вместо ANON_KEY
      {
        cookies: {
          getAll() {
            return cookies().getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookies().set(name, value, options)
              );
            } catch {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware handling
              // cookie setting.
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ [Callback] Exchange error:', exchangeError.message);
      return NextResponse.redirect(
        new URL(
          `/auth?error=${encodeURIComponent(exchangeError.message)}`,
          request.url
        )
      );
    }

    console.log('✅ [Callback] Session exchanged successfully');

    // ✅ Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check for guest reading history to sync
      const guestHistoryParam = requestUrl.searchParams.get('guest_history');
      if (guestHistoryParam) {
        try {
          const guestHistory = JSON.parse(decodeURIComponent(guestHistoryParam));
          if (Array.isArray(guestHistory) && guestHistory.length > 0) {
            console.log(`🔄 [Callback] Syncing ${guestHistory.length} guest chapters for user ${user.id}`);
            await syncGuestReadingHistoryServer(user.id, guestHistory);
          }
        } catch (err) {
          console.error('❌ [Callback] Failed to parse guest_history:', err);
        }
      }
    }

    console.log('🍪 [Callback] Cookies set, redirecting to /');

    // ✅ Успешно - редирект на главную
    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    console.error('❌ [Callback] Unexpected error:', err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(errorMsg)}`, request.url)
    );
  }
}