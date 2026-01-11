// features/auth/hooks/useForgotPassword.ts

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context';
import { ForgotPasswordFormData } from '../types';
import { validateEmail } from '../utils';

export const useForgotPassword = () => {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // ===== HANDLE SUBMIT =====
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setError(null);
    setSuccess(false);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error!);
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      
      // Start countdown
      setCanResend(false);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Помилка відправки листа');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, resetPassword]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    setEmail('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  }, []);

  return {
    email,
    setEmail,
    error,
    success,
    isSubmitting,
    canResend,
    countdown,
    handleSubmit,
    resetForm,
  };
};
