// features/auth/hooks/useLogin.ts

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context';
import { LoginFormData, FormState } from '../types';
import { validateEmail, validatePasswordSimple } from '../utils';

const initialFormData: LoginFormData = {
  email: '',
  password: '',
  rememberMe: false,
};

export const useLogin = () => {
  const { signIn } = useAuth();
  
  const [formState, setFormState] = useState<FormState<LoginFormData>>({
    values: initialFormData,
    errors: {} as Record<keyof LoginFormData, string>,
    touched: {} as Record<keyof LoginFormData, boolean>,
    isSubmitting: false,
    isValid: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ===== VALIDATE FIELD =====
  const validateField = useCallback((name: keyof LoginFormData, value: any): string => {
    switch (name) {
      case 'email':
        const emailResult = validateEmail(value);
        return emailResult.isValid ? '' : emailResult.error!;
      
      case 'password':
        const passwordResult = validatePasswordSimple(value);
        return passwordResult.isValid ? '' : passwordResult.error!;
      
      default:
        return '';
    }
  }, []);

  // ===== HANDLE CHANGE =====
  const handleChange = useCallback((name: keyof LoginFormData, value: any) => {
    setFormState(prev => {
      const newValues = { ...prev.values, [name]: value };
      const error = validateField(name, value);
      const newErrors = { ...prev.errors, [name]: error };
      
      // Check if form is valid
      const isValid = !newErrors.email && !newErrors.password && 
                      newValues.email !== '' && newValues.password !== '';
      
      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isValid,
      };
    });

    // Clear global error when user types
    if (error) {
      setError(null);
    }
  }, [validateField, error]);

  // ===== HANDLE BLUR =====
  const handleBlur = useCallback((name: keyof LoginFormData) => {
    setFormState(prev => ({
      ...prev,
      touched: { ...prev.touched, [name]: true },
    }));
  }, []);

  // ===== HANDLE SUBMIT =====
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setError(null);
    setSuccess(false);

    // Validate all fields
    const emailError = validateField('email', formState.values.email);
    const passwordError = validateField('password', formState.values.password);

    if (emailError || passwordError) {
      setFormState(prev => ({
        ...prev,
        errors: {
          email: emailError,
          password: passwordError,
          rememberMe: '',
        },
        touched: {
          email: true,
          password: true,
          rememberMe: true,
        },
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await signIn(
        formState.values.email,
        formState.values.password,
        formState.values.rememberMe
      );

      setSuccess(true);
      
      // Reset form
      setFormState({
        values: initialFormData,
        errors: {} as Record<keyof LoginFormData, string>,
        touched: {} as Record<keyof LoginFormData, boolean>,
        isSubmitting: false,
        isValid: false,
      });
    } catch (err: any) {
      setError(err.message || 'Помилка входу');
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.values, validateField, signIn]);

  // ===== TOGGLE PASSWORD VISIBILITY =====
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    setFormState({
      values: initialFormData,
      errors: {} as Record<keyof LoginFormData, string>,
      touched: {} as Record<keyof LoginFormData, boolean>,
      isSubmitting: false,
      isValid: false,
    });
    setError(null);
    setSuccess(false);
    setShowPassword(false);
  }, []);

  return {
    formState,
    error,
    success,
    showPassword,
    handleChange,
    handleBlur,
    handleSubmit,
    togglePasswordVisibility,
    resetForm,
  };
};
