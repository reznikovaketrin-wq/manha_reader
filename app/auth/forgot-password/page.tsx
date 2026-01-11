// app/auth/forgot-password/page.tsx
'use client';

import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const {
    email,
    setEmail,
    error,
    success,
    isSubmitting,
    canResend,
    countdown,
    handleSubmit,
  } = useForgotPassword();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Відновлення пароля</h1>
          <p className={styles.subtitle}>
            Введіть email, на який зареєстрований ваш акаунт
          </p>
        </div>

        {success ? (
          <div className={styles.successBlock}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.successTitle}>Лист відправлено!</h3>
            <p className={styles.successText}>
              Перевірте вашу пошту <strong>{email}</strong>
            </p>
            <p className={styles.successTextSmall}>
              Якщо лист не прийшов протягом 5 хвилин, перевірте папку "Спам"
            </p>

            {canResend ? (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className={styles.buttonGradient}
              >
                Відправити ще раз
              </button>
            ) : (
              <p className={styles.countdown}>
                Повторна відправка через {countdown} сек
              </p>
            )}

            <Link href="/auth" className={styles.buttonGradient}>
              Повернутися до входу
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={styles.input}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className={styles.buttonGradient}
            >
              {isSubmitting ? 'Відправка...' : 'Відправити лист'}
            </button>

            <div className={styles.footer}>
              <Link href="/auth" className={styles.link}>
                ← Повернутися до входу
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
