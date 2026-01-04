'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithGithub, checkUsernameAvailable } from '@/lib/auth';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';

type AuthMode = 'signin' | 'signup';

export default function AuthForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // ===== READ ERROR FROM URL =====
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      console.log('❌ [AuthForm] Error from URL:', urlError);
      setError(decodeURIComponent(urlError));
      router.replace('/auth');
    }
  }, [searchParams, router]);

  // ===== CHECK USERNAME =====
  const handleCheckUsername = async (value: string) => {
    setUsername(value);
    if (value.length >= 3) {
      console.log('🔍 [AuthForm] Checking username:', value);
      const result = await checkUsernameAvailable(value);
      console.log('✅ [AuthForm] Username check result:', result.available);
      setUsernameAvailable(result.available);
    }
  };

  // ===== SIGN UP =====
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !username || !passwordConfirm) {
      setError('Заповніть всі поля');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Паролі не співпадають');
      return;
    }

    if (password.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    if (!usernameAvailable) {
      setError("Це ім'я користувача вже зайняте");
      return;
    }

    startTransition(async () => {
      try {
        console.log('📝 [AuthForm] Submitting signup...');
        
        // ✅ ШАГ 1: Server Action регистрирует и устанавливает cookies
        const result = await signUpWithEmail(email, password, username);
        console.log('📝 [AuthForm] Signup result:', result);

        if (result.error) {
          setError(result.error);
        } else if (result.success) {
          console.log('✅ [AuthForm] Signup successful');
          console.log('🔔 [AuthForm] Refreshing browser session...');
          
          // ✅ ШАГ 2: ⚡ КЛЮЧЕВОЕ - используем refreshSession()
          // Это НЕ просто читает состояние, это ОБНОВЛЯЕТ localStorage!
          // После этого onAuthStateChange СРАЗУ срабатывает
          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error('❌ [AuthForm] Refresh error:', error);
            } else {
              console.log('✅ [AuthForm] Session refreshed:', data.session?.user?.email);
            }
          } catch (err) {
            console.error('❌ [AuthForm] Refresh failed:', err);
          }
          
          // ✅ ШАГ 3: Переходим на главную
          router.replace('/');
        }
        } catch (err: any) {
        console.error('❌ [AuthForm] Signup error:', err);
        
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
          throw err;
        }

        setError(err instanceof Error ? err.message : 'Помилка при реєстрації');
      }
    });
  };

  // ===== SIGN IN =====
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Заповніть електронну пошту та пароль');
      return;
    }

    startTransition(async () => {
      try {
        console.log('🔐 [AuthForm] Submitting signin...');
        
        // ✅ ШАГ 1: Server Action логинит и устанавливает cookies
        const result = await signInWithEmail(email, password);
        console.log('🔐 [AuthForm] Signin result:', result);

        if (result.error) {
          setError(result.error);
        } else if (result.success) {
          console.log('✅ [AuthForm] Sign in successful');
          console.log('🔔 [AuthForm] Refreshing browser session...');
          
          // ✅ ШАГ 2: ⚡ КЛЮЧЕВОЕ - используем refreshSession()
          // Это НЕ просто читает состояние, это ОБНОВЛЯЕТ localStorage!
          // После этого onAuthStateChange СРАЗУ срабатывает
          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error('❌ [AuthForm] Refresh error:', error);
            } else {
              console.log('✅ [AuthForm] Session refreshed:', data.session?.user?.email);
            }
          } catch (err) {
            console.error('❌ [AuthForm] Refresh failed:', err);
          }
          
          // ✅ ШАГ 3: Переходим на главную
          router.replace('/');
        }
        } catch (err: any) {
        console.error('❌ [AuthForm] Signin error:', err);
        
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
          throw err;
        }

        setError(err instanceof Error ? err.message : 'Помилка при вході');
      }
    });
  };

  // ===== OAUTH HANDLERS =====
  const handleGoogleSignIn = async () => {
    setError(null);
    startTransition(async () => {
      try {
        console.log('🌐 [AuthForm] Starting Google OAuth...');
        const result = await signInWithGoogle();
        console.log('🌐 [AuthForm] Google result:', result);
        
        // ⛔ После signInWithGoogle управление уходит на callback
        // Мы не получим управление обратно
      } catch (err: any) {
        console.error('❌ [AuthForm] Google error:', err);
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        setError('Помилка входу через Google');
      }
    });
  };

  const handleGithubSignIn = async () => {
    setError(null);
    startTransition(async () => {
      try {
        console.log('🌐 [AuthForm] Starting GitHub OAuth...');
        const result = await signInWithGithub();
        console.log('🌐 [AuthForm] GitHub result:', result);
        
        // ⛔ После signInWithGithub управление уходит на callback
      } catch (err: any) {
        console.error('❌ [AuthForm] GitHub error:', err);
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        setError('Помилка входу через GitHub');
      }
    });
  };

  const loading = isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-2">
            {mode === 'signin' ? 'Вхід' : 'Реєстрація'}
          </h1>
          <p className="text-text-muted">
            {mode === 'signin'
              ? 'Увійдіть до свого облікового запису'
              : 'Створіть новий обліковий запис'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
          className="space-y-4 mb-6"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Електронна пошта
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ваша@пошта.com"
              disabled={loading}
              autoComplete="email"
              className="w-full px-4 py-3 bg-card-bg border border-text-muted/20 rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Username (только для регистрации) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Ім'я користувача
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleCheckUsername(e.target.value)}
                  placeholder="ваше_імя"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-card-bg border border-text-muted/20 rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                />
                {username.length >= 3 && (
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm ${
                    usernameAvailable ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {usernameAvailable ? '✓ Доступне' : '✗ Зайняте'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-card-bg border border-text-muted/20 rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                title={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transform transition-transform duration-150 ease-in-out hover:scale-110 ${showPassword ? 'rotate-12 scale-105 text-white' : 'rotate-0'}`}
              >
                {showPassword ? (
                  <svg className={`transform transition-transform duration-200 ${showPassword ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-8 1.02-2.59 2.85-4.73 5.17-6.11"/><path d="M1 1l22 22"/></svg>
                ) : (
                  <svg className={`transform transition-transform duration-200 ${showPassword ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Password Confirm (только для регистрации) */}
          {mode === 'signup' && (
            <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Підтвердіть пароль
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-card-bg border border-text-muted/20 rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 pr-10"
                  />
                  <button
                    type="button"
                      onClick={() => setShowPasswordConfirm((s) => !s)}
                      aria-label={showPasswordConfirm ? 'Сховати пароль' : 'Показати пароль'}
                      title={showPasswordConfirm ? 'Сховати пароль' : 'Показати пароль'}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transform transition-transform duration-150 ease-in-out hover:scale-110 ${showPasswordConfirm ? 'rotate-12 scale-105 text-white' : 'rotate-0'}`}
                    >
                      {showPasswordConfirm ? (
                      <svg className={`transform transition-transform duration-200 ${showPasswordConfirm ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-8 1.02-2.59 2.85-4.73 5.17-6.11"/><path d="M1 1l22 22"/></svg>
                    ) : (
                      <svg className={`transform transition-transform duration-200 ${showPasswordConfirm ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
            </div>
          )}

          {/* Submit Button */}
          {/* Submit Button с градиентом */}
          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !usernameAvailable)}
            className="w-full py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (!loading && (mode !== 'signup' || usernameAvailable)) {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 27, 109, 0.5), 0 0 15px rgba(162, 89, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Завантажується...' : mode === 'signin' ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-text-muted/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-primary text-text-muted">або</span>
          </div>
        </div>

        

        {/* Toggle Mode */}
        <div className="text-center text-text-muted text-sm">
          {mode === 'signin' ? (
            <>
              Немає облікового запису?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Зареєструватися
              </button>
            </>
          ) : (
            <>
              Вже маєте обліковий запис?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Увійти
              </button>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-text-muted hover:text-text-main text-sm transition-colors">
            ← Назад на головну
          </Link>
        </div>
      </div>
    </div>
  );
}