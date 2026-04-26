// app/auth/reset-password/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useResetPassword, useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import styles from '../auth.module.css';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signOut, user } = useAuth();
  
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    error,
    success,
    isSubmitting,
    passwordStrength,
    handleSubmit,
  } = useResetPassword();

  // Check for recovery token IMMEDIATELY on component initialization
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [hasValidToken, setHasValidToken] = useState(() => {
    // This runs ONCE on component mount, synchronously
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      
      if (hash.startsWith('#')) {
        const params = new URLSearchParams(hash.slice(1));
        const type = params.get('type');
        const accessToken = params.get('access_token');
        
        if (type === 'recovery' && accessToken) {
          sessionStorage.setItem('password_recovery_flow', 'true');
          // Clear hash immediately
          window.history.replaceState(null, '', window.location.pathname);
          return true;
        }
      }
      
      // Check sessionStorage flag
      const hasFlag = sessionStorage.getItem('password_recovery_flow') === 'true';
      return hasFlag;
    }
    return false;
  });
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      
      // Check for errors in URL
      const urlError = searchParams?.get('error') || searchParams?.get('error_description');
      if (urlError) {
        setTokenError(decodeURIComponent(urlError));
        setIsCheckingToken(false);
        return;
      }

      // If we already have a valid token (set during init), we're good
      if (hasValidToken) {
        setIsCheckingToken(false);
        return;
      }
      
      // Additional check: verify current session through Supabase API
      // Recovery sessions have specific AMR (Authentication Method Reference) claims
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Decode access token payload safely to inspect claims (AMR or similar)
          const accessToken = (session as any).access_token as string | undefined;
          const decodeJwt = (token?: string) => {
            if (!token) return null;
            try {
              const payload = token.split('.')[1];
              const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
              return JSON.parse(json);
            } catch (e) {
              return null;
            }
          };

          const payload = decodeJwt(accessToken as string | undefined);

          const amr = payload?.amr ?? payload?.amr?.map ? payload.amr : undefined;
          // Recovery sessions often include a claim indicating recovery; fallback to checking `type` claim
          const isRecovery = Array.isArray(amr) ? amr.some((it: any) => it === 'recovery' || it.method === 'recovery') : !!payload?.type && payload.type === 'recovery';

          if (isRecovery) {
            sessionStorage.setItem('password_recovery_flow', 'true');
            setHasValidToken(true);
            setIsCheckingToken(false);
            return;
          }
        }
      } catch (err) {
        console.error('❌ [Reset Password] Error checking session:', err);
      }
      
      // No valid token - check if user is logged in normally
      if (user) {
        router.push('/profile/change-password');
        return;
      }
      
      // Not logged in and no token
      setTokenError('Відсутній токен відновлення. Перейдіть по посиланню з email.');
      setIsCheckingToken(false);
    };

    // Small delay to ensure auth state is initialized
    const timer = setTimeout(validateToken, 100);
    return () => clearTimeout(timer);
  }, [searchParams, user, router, hasValidToken]);

  // Redirect after successful password reset
  useEffect(() => {
    if (success) {
      const redirectAfterSuccess = async () => {
        // Clear recovery flow flag
        sessionStorage.removeItem('password_recovery_flow');
        
        // Sign out to clear the recovery session
        await signOut();
        
        // Redirect to login page
        setTimeout(() => {
          router.push('/auth?message=password_reset_success');
        }, 2000);
      };
      
      redirectAfterSuccess();
    }
  }, [success, router, signOut]);

  if (tokenError) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Помилка</h1>
          </div>
          
          <div className={styles.error}>
            {tokenError}
          </div>

          <div className={styles.footer}>
            <Link href="/auth/forgot-password" className={styles.buttonGradient}>
              ← Запросити новий лист
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidToken) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {isCheckingToken ? 'Обробка посилання...' : 'Помилка'}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successBlock}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.successTitle}>Пароль змінено!</h3>
            <p className={styles.successText}>
              Ваш пароль успішно оновлено
            </p>
            <p className={styles.successTextSmall}>
              Перенаправлення на сторінку входу...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Новий пароль</h1>
          <p className={styles.subtitle}>
            Введіть новий пароль для вашого акаунту
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* New Password */}
          <div className={styles.field}>
            <label htmlFor="newPassword" className={styles.label}>
              Новий пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Мінімум 8 символів"
                className={styles.input}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888',
                  fontSize: '20px',
                }}
              >
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  height: '4px',
                  background: '#333',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${passwordStrength.score * 25}%`,
                    background: passwordStrength.score <= 1 ? '#ef4444' :
                               passwordStrength.score === 2 ? '#f59e0b' :
                               passwordStrength.score === 3 ? '#10b981' : '#059669',
                    transition: 'all 0.3s',
                  }} />
                </div>
                <p style={{
                  fontSize: '12px',
                  color: passwordStrength.score <= 1 ? '#ef4444' :
                         passwordStrength.score === 2 ? '#f59e0b' :
                         passwordStrength.score === 3 ? '#10b981' : '#059669',
                  marginTop: '4px',
                }}>
                  {passwordStrength.feedback}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Підтвердіть пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторіть пароль"
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888',
                  fontSize: '20px',
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newPassword || !confirmPassword}
            className={styles.buttonGradient}
          >
            {isSubmitting ? 'Збереження...' : 'Змінити пароль'}
          </button>

          <div className={styles.footer}>
            <Link href="/auth" className={styles.link}>
              ← Повернутися до входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Завантаження...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
