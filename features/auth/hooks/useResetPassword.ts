// features/auth/hooks/useResetPassword.ts

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context';
import { ResetPasswordFormData } from '../types';
import { validatePassword, matchPasswords, checkPasswordStrength } from '../utils';

export const useResetPassword = () => {
  const { updatePassword } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    setError(null);
    setSuccess(false);

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error!);
      return;
    }

    // Check passwords match
    if (!matchPasswords(newPassword, confirmPassword)) {
      setError('Паролі не співпадають');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(newPassword);
      setSuccess(true);
      
      // Reset form
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Помилка зміни пароля');
    } finally {
      setIsSubmitting(false);
    }
  }, [newPassword, confirmPassword, updatePassword]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, []);

  return {
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
    resetForm,
  };
};
