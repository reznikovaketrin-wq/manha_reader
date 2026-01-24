// features/auth/hooks/useRegister.ts

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context';
import { RegisterFormData, FormState } from '../types';
import { 
  validateEmail, 
  validatePassword, 
  validateUsername, 
  matchPasswords,
  checkPasswordStrength
} from '../utils';
import { authService } from '../services';

const initialFormData: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  username: '',
};

export const useRegister = () => {
  const { signUp } = useAuth();
  
  const [formState, setFormState] = useState<FormState<RegisterFormData>>({
    values: initialFormData,
    errors: {} as Record<keyof RegisterFormData, string>,
    touched: {} as Record<keyof RegisterFormData, boolean>,
    isSubmitting: false,
    isValid: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 FIX: Check sessionStorage for persisted success state
  const [success, setSuccess] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('registration_success') === 'true';
      console.log('🔄 [useRegister] Initializing success from sessionStorage:', saved);
      return saved;
    }
    return false;
  });
  
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);

  // 🔍 DEBUG: Track success state changes (don't remove from sessionStorage here!)
  useEffect(() => {
    console.log('🎯 [useRegister] Success state changed to:', success);
    // Note: We save to sessionStorage immediately in handleSubmit, not here
    // Only remove on explicit reset via resetForm()
  }, [success]);

  // ===== PASSWORD STRENGTH =====
  const passwordStrength = checkPasswordStrength(formState.values.password);

  // ===== CHECK USERNAME AVAILABILITY =====
  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) return;

    // DISABLED: Username availability check - causing 406 errors
    // Will validate on server side during registration instead
    return;

    /* 
    setUsernameCheckLoading(true);
    
    try {
      const result = await authService.checkUsernameAvailable(username);
      
      if (result.error) {
        return;
      }

      if (!result.available) {
        setFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, username: 'Ім\'я користувача вже зайнято' },
        }));
      }
    } finally {
      setUsernameCheckLoading(false);
    }
    */
  }, []);

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formState.values.username && formState.values.username.length >= 3) {
        checkUsername(formState.values.username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formState.values.username, checkUsername]);

  // ===== VALIDATE FIELD =====
  const validateField = useCallback((name: keyof RegisterFormData, value: any): string => {
    switch (name) {
      case 'email':
        const emailResult = validateEmail(value);
        return emailResult.isValid ? '' : emailResult.error!;
      
      case 'password':
        const passwordResult = validatePassword(value);
        return passwordResult.isValid ? '' : passwordResult.error!;
      
      case 'confirmPassword':
        if (!value) return 'Підтвердіть пароль';
        return matchPasswords(formState.values.password, value) ? '' : 'Паролі не співпадають';
      
      case 'username':
        if (!value) return ''; // Username is optional
        const usernameResult = validateUsername(value);
        return usernameResult.isValid ? '' : usernameResult.error!;
      
      
      
      default:
        return '';
    }
  }, [formState.values.password]);

  // ===== HANDLE CHANGE =====
  const handleChange = useCallback((name: keyof RegisterFormData, value: any) => {
    setFormState(prev => {
      const newValues = { ...prev.values, [name]: value };
      const error = validateField(name, value);
      const newErrors = { ...prev.errors, [name]: error };
      
      // Also revalidate confirmPassword when password changes
      if (name === 'password' && prev.values.confirmPassword) {
        const confirmError = matchPasswords(value, prev.values.confirmPassword) 
          ? '' 
          : 'Паролі не співпадають';
        newErrors.confirmPassword = confirmError;
      }
      
      // Check if form is valid
      const isValid = !newErrors.email && 
              !newErrors.password && 
              !newErrors.confirmPassword && 
              newValues.email !== '' && 
              newValues.password !== '' &&
              newValues.confirmPassword !== '';
      
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
  const handleBlur = useCallback((name: keyof RegisterFormData) => {
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
    const errors: Record<keyof RegisterFormData, string> = {
      email: validateField('email', formState.values.email),
      password: validateField('password', formState.values.password),
      confirmPassword: validateField('confirmPassword', formState.values.confirmPassword),
      username: validateField('username', formState.values.username),
    };

    const hasErrors = Object.values(errors).some(err => err !== '');

    if (hasErrors) {
      setFormState(prev => ({
        ...prev,
        errors,
        touched: {
          email: true,
          password: true,
          confirmPassword: true,
          username: true,
        },
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      console.log('🔄 [useRegister] Starting signup...');
      await signUp(
        formState.values.email,
        formState.values.password,
        formState.values.username || undefined
      );

      console.log('✅ [useRegister] Signup successful, setting success=true');
      
      // 🔥 FIX: Save to sessionStorage IMMEDIATELY before state update
      // This ensures the value is persisted before any potential remount
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('registration_success', 'true');
        console.log('💾 [useRegister] Saved success to sessionStorage');
      }
      
      setSuccess(true);
      console.log('✅ [useRegister] Success state updated');
      
      // ⚠️ ВАЖНО: НЕ сбрасываем форму сразу, иначе компонент перерисуется
      // Форма все равно скрыта за {success ? ... : <form>}
      // Сброс произойдет когда пользователь вернется к логину
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    } catch (err: any) {
      console.error('❌ [useRegister] Signup failed:', err);
      setError(err.message || 'Помилка реєстрації');
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.values, validateField, signUp]);

  // ===== TOGGLE PASSWORD VISIBILITY =====
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    setFormState({
      values: initialFormData,
      errors: {} as Record<keyof RegisterFormData, string>,
      touched: {} as Record<keyof RegisterFormData, boolean>,
      isSubmitting: false,
      isValid: false,
    });
    setError(null);
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    // Clear persisted success state
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('registration_success');
    }
  }, []);

  return {
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
    resetForm,
  };
};
