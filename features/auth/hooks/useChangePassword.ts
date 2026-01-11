// features/auth/hooks/useChangePassword.ts

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context';
import { ChangePasswordFormData } from '../types';
import { validatePasswordSimple, validatePassword, matchPasswords, checkPasswordStrength } from '../utils';
import { authService } from '../services';

export const useChangePassword = () => {
  const { updatePassword } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = checkPasswordStrength(newPassword);

  // ===== HANDLE SUBMIT =====
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    console.log('[useChangePassword] handleSubmit start');

    setError(null);
    setSuccess(false);

    // Validate current password
    const currentPasswordValidation = validatePasswordSimple(currentPassword);
    if (!currentPasswordValidation.isValid) {
      setError(currentPasswordValidation.error!);
      return;
    }

    // Validate new password
    const newPasswordValidation = validatePassword(newPassword);
    if (!newPasswordValidation.isValid) {
      setError(newPasswordValidation.error!);
      return;
    }

    // Check passwords match
    if (!matchPasswords(newPassword, confirmPassword)) {
      setError('Паролі не співпадають');
      return;
    }

    // Check that new password is different from current
    if (currentPassword === newPassword) {
      setError('Новий пароль має відрізнятися від поточного');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[useChangePassword] validating session...');
      // First verify current password by attempting sign in
      const session = await authService.getSession();
      console.log('[useChangePassword] got session', session);
      if (!session || !session.user.email) {
        setError('Не вдалося перевірити поточний пароль');
        console.log('[useChangePassword] no session, aborting');
        setIsSubmitting(false);
        return;
      }

      const signInResult = await authService.signIn(session.user.email, currentPassword);
      console.log('[useChangePassword] signInResult', signInResult);
      if (signInResult.error) {
        setError('Невірний поточний пароль');
        console.log('[useChangePassword] sign in failed');
        setIsSubmitting(false);
        return;
      }

      // Update password
      console.log('[useChangePassword] updating password...');
      await updatePassword(newPassword);
      console.log('[useChangePassword] updatePassword resolved');
      setSuccess(true);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('[useChangePassword] error in handleSubmit', err);
      setError(err.message || 'Помилка зміни пароля');
    } finally {
      console.log('[useChangePassword] finally - clearing isSubmitting');
      setIsSubmitting(false);
    }
  }, [currentPassword, newPassword, confirmPassword, updatePassword]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, []);

  return {
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
    resetForm,
  };
};
