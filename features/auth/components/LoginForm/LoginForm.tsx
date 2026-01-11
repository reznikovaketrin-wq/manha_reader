// features/auth/components/LoginForm/LoginForm.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { useLogin } from '../../hooks';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  redirectAfterLogin?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const {
    formState,
    error,
    showPassword,
    handleChange,
    handleBlur,
    handleSubmit,
    togglePasswordVisibility,
  } = useLogin();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Вхід</h2>
      
      <form onSubmit={handleFormSubmit} className={styles.form}>
        {/* Email */}
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formState.values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`${styles.input} ${
              formState.touched.email && formState.errors.email ? styles.inputError : ''
            }`}
            placeholder="example@email.com"
            autoComplete="email"
          />
          {formState.touched.email && formState.errors.email && (
            <span className={styles.error}>{formState.errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Пароль
          </label>
          <div className={styles.passwordWrapper}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formState.values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`${styles.input} ${
                formState.touched.password && formState.errors.password ? styles.inputError : ''
              }`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={styles.togglePassword}
              aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formState.touched.password && formState.errors.password && (
            <span className={styles.error}>{formState.errors.password}</span>
          )}
        </div>

        {/* Remember Me */}
        <div className={styles.rememberRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formState.values.rememberMe}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              className={styles.checkbox}
            />
            <span>Запам'ятати мене</span>
          </label>
          
          <Link href="/auth/forgot-password" className={styles.forgotLink}>
            Забули пароль?
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formState.isSubmitting || !formState.isValid}
          className={`${styles.button} ${formState.isSubmitting ? styles.buttonLoading : ''}`}
        >
          {formState.isSubmitting ? 'Вхід...' : 'Увійти'}
        </button>

        {/* Switch to Register */}
        <div className={styles.switchMode}>
          <span>Немає акаунту? </span>
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className={styles.switchLink}
            >
              Зареєструватися
            </button>
          ) : (
            <Link href="/auth/register" className={styles.switchLink}>
              Зареєструватися
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};
