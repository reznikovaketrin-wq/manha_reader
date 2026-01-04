// app/auth/callback/route.ts
// ✅ OAuth callback - with SERVICE_ROLE_KEY for security

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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