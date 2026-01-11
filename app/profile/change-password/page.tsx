// app/profile/change-password/page.tsx
'use client';

import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import Link from 'next/link';
import styles from '../../auth/auth.module.css';

function ChangePasswordContent() {
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    error,
    success,
    isSubmitting,
    passwordStrength,
    handleSubmit,
  } = useChangePassword();

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

            <Link href="/profile" className={styles.buttonGradient}>
              Повернутися до профілю
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Змінити пароль</h1>
          <p className={styles.subtitle}>
            Введіть поточний пароль та новий пароль
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Current Password */}
          <div className={styles.field}>
            <label htmlFor="currentPassword" className={styles.label}>
              Поточний пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Введіть поточний пароль"
                className={styles.input}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

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
              Підтвердіть новий пароль
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
            disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
            className={styles.buttonGradient}
          >
            {isSubmitting ? 'Збереження...' : 'Змінити пароль'}
          </button>

          <div className={styles.footer}>
            <Link href="/profile" className={styles.link}>
              ← Повернутися до профілю
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <ChangePasswordContent />
    </ProtectedRoute>
  );
}
