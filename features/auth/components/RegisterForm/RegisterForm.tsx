// features/auth/components/RegisterForm/RegisterForm.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { useRegister } from '../../hooks';
import styles from './RegisterForm.module.css';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const {
    formState,
    error,
    success,
    showPassword,
    showConfirmPassword,
    passwordStrength,
    usernameCheckLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useRegister();

  React.useEffect(() => {
    if (success && onSuccess) {
      onSuccess();
    }
  }, [success, onSuccess]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Реєстрація</h2>
      
      {success ? (
        <div className={styles.successBox}>
          <p>Реєстрація успішна!</p>
          <p>Перевірте свій email для підтвердження акаунту.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="reg-email" className={styles.label}>Email</label>
            <input
              id="reg-email"
              type="email"
              value={formState.values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`${styles.input} ${
                formState.touched.email && formState.errors.email ? styles.inputError : ''
              }`}
              placeholder="example@email.com"
            />
            {formState.touched.email && formState.errors.email && (
              <span className={styles.error}>{formState.errors.email}</span>
            )}
          </div>

          {/* Username (optional) */}
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Ім'я користувача (опціонально)
            </label>
            <div className={styles.usernameWrapper}>
              <input
                id="username"
                type="text"
                value={formState.values.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onBlur={() => handleBlur('username')}
                className={`${styles.input} ${
                  formState.touched.username && formState.errors.username ? styles.inputError : ''
                }`}
                placeholder="username"
              />
              {usernameCheckLoading && <span className={styles.checking}>Перевірка...</span>}
            </div>
            {formState.touched.username && formState.errors.username && (
              <span className={styles.error}>{formState.errors.username}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="reg-password" className={styles.label}>Пароль</label>
            <div className={styles.passwordWrapper}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={formState.values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`${styles.input} ${
                  formState.touched.password && formState.errors.password ? styles.inputError : ''
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.togglePassword}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formState.values.password && (
              <div className={styles.strengthBar}>
                <div
                  className={styles.strengthFill}
                  style={{
                    width: `${(passwordStrength.score + 1) * 20}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                />
                <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
              </div>
            )}
            {formState.touched.password && formState.errors.password && (
              <span className={styles.error}>{formState.errors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label htmlFor="confirm-password" className={styles.label}>Підтвердіть пароль</label>
            <div className={styles.passwordWrapper}>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formState.values.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`${styles.input} ${
                  formState.touched.confirmPassword && formState.errors.confirmPassword
                    ? styles.inputError
                    : ''
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className={styles.togglePassword}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formState.touched.confirmPassword && formState.errors.confirmPassword && (
              <span className={styles.error}>{formState.errors.confirmPassword}</span>
            )}
          </div>

          {/* Terms */}
          <label className={styles.termsLabel}>
            <input
              type="checkbox"
              checked={formState.values.agreedToTerms}
              onChange={(e) => handleChange('agreedToTerms', e.target.checked)}
              className={styles.checkbox}
            />
            <span>
              Я приймаю <Link href="/terms" className={styles.link}>умови використання</Link>
            </span>
          </label>
          {formState.touched.agreedToTerms && formState.errors.agreedToTerms && (
            <span className={styles.error}>{formState.errors.agreedToTerms}</span>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={formState.isSubmitting || !formState.isValid}
            className={`${styles.button} ${formState.isSubmitting ? styles.buttonLoading : ''}`}
          >
            {formState.isSubmitting ? 'Реєстрація...' : 'Зареєструватися'}
          </button>

          <div className={styles.switchMode}>
            <span>Вже є акаунт? </span>
            {onSwitchToLogin ? (
              <button type="button" onClick={onSwitchToLogin} className={styles.switchLink}>
                Увійти
              </button>
            ) : (
              <Link href="/auth" className={styles.switchLink}>
                Увійти
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
