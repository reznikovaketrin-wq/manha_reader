'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithGithub, checkUsernameAvailable } from '@/lib/auth';
import Link from 'next/link';

type AuthMode = 'signin' | 'signup';

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // ===== CHECK USERNAME =====
  const handleCheckUsername = async (value: string) => {
    setUsername(value);
    if (value.length >= 3) {
      const result = await checkUsernameAvailable(value);
      setUsernameAvailable(result.available);
    }
  };

  // ===== SIGN UP =====
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!email || !password || !username || !passwordConfirm) {
      setError('Заповніть всі поля');
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError('Паролі не совпадают');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      setLoading(false);
      return;
    }

    if (!usernameAvailable) {
      setError('Это имя пользователя уже занято');
      setLoading(false);
      return;
    }

    const result = await signUpWithEmail(email, password, username);

    if (result.success) {
      setError(null);
      router.push('/');
    } else {
      setError(
        result.error instanceof Error
          ? result.error.message
          : 'Ошибка при регистрации'
      );
    }

    setLoading(false);
  };

  // ===== SIGN IN =====
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Заповніть email и пароль');
      setLoading(false);
      return;
    }

    const result = await signInWithEmail(email, password);

    if (result.success) {
      setError(null);
      router.push('/');
    } else {
      setError(
        result.error instanceof Error
          ? result.error.message
          : 'Ошибка при входе'
      );
    }

    setLoading(false);
  };

  // ===== OAUTH HANDLERS =====
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError('Ошибка при входе через Google');
    }
    setLoading(false);
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading(true);
    const result = await signInWithGithub();
    if (!result.success) {
      setError('Ошибка при входе через GitHub');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-2">
            {mode === 'signin' ? 'Вход' : 'Реєстрація'}
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="вашу@почту.com"
              disabled={loading}
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-3 bg-card-bg border border-text-muted/20 rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Password Confirm (только для регистрации) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Підтвердіть пароль
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-3 bg-card-bg border border-text-muted/20 rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !usernameAvailable)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
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

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-card-bg hover:bg-card-hover border border-text-muted/20 rounded-lg text-text-main font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <button
            onClick={handleGithubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-card-bg hover:bg-card-hover border border-text-muted/20 rounded-lg text-text-main font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
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