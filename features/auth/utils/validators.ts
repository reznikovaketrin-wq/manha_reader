// features/auth/utils/validators.ts

import { ValidationResult, PasswordValidationResult, PasswordStrength } from '../types';

// ===== EMAIL VALIDATION =====
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email обов\'язковий' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Введіть коректну email адресу' };
  }
  
  return { isValid: true };
};

// ===== USERNAME VALIDATION =====
export const validateUsername = (username: string): ValidationResult => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  
  if (!username) {
    return { isValid: false, error: 'Ім\'я користувача обов\'язкове' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Ім\'я користувача має містити мінімум 3 символи' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Ім\'я користувача має містити максимум 20 символів' };
  }
  
  if (!usernameRegex.test(username)) {
    return { 
      isValid: false, 
      error: 'Ім\'я користувача може містити тільки літери, цифри та підкреслення' 
    };
  }
  
  return { isValid: true };
};

// ===== PASSWORD STRENGTH =====
export const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  if (!password) {
    return { score: 0, label: 'Дуже слабкий', color: '#ef4444', feedback: 'Дуже слабкий' };
  }
  
  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Has lowercase
  if (/[a-z]/.test(password)) score++;
  
  // Has uppercase
  if (/[A-Z]/.test(password)) score++;
  
  // Has number
  if (/\d/.test(password)) score++;
  
  // Has special char
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  // Normalize to 0-4
  const normalizedScore = Math.min(Math.floor(score / 1.5), 4) as 0 | 1 | 2 | 3 | 4;
  
  const labels = {
    0: 'Дуже слабкий',
    1: 'Слабкий',
    2: 'Середній',
    3: 'Сильний',
    4: 'Дуже сильний'
  };
  
  const colors = {
    0: '#ef4444',
    1: '#f97316',
    2: '#eab308',
    3: '#84cc16',
    4: '#22c55e'
  };
  
  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    color: colors[normalizedScore]
    ,feedback: labels[normalizedScore]
  };
};

// ===== PASSWORD VALIDATION =====
export const validatePassword = (password: string): PasswordValidationResult => {
  const suggestions: string[] = [];
  
  if (!password) {
    return {
      isValid: false,
      error: 'Пароль обов\'язковий',
      strength: checkPasswordStrength(password),
      suggestions: ['Введіть пароль']
    };
  }
  
  if (password.length < 8) {
    suggestions.push('Пароль занадто короткий (мінімум 8 символів)');
  }
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Додайте велику літеру');
  }
  
  if (!/\d/.test(password)) {
    suggestions.push('Додайте цифру');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    suggestions.push('Додайте спеціальний символ (!@#$%^&*)');
  }
  
  const strength = checkPasswordStrength(password);
  
  if (suggestions.length > 0) {
    return {
      isValid: false,
      error: suggestions[0],
      strength,
      suggestions
    };
  }
  
  return {
    isValid: true,
    strength,
    suggestions: []
  };
};

// ===== PASSWORD MATCH =====
export const matchPasswords = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// ===== SIMPLE PASSWORD VALIDATION (for login) =====
export const validatePasswordSimple = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Пароль обов\'язковий' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Пароль має містити мінімум 6 символів' };
  }
  
  return { isValid: true };
};

// ===== TERMS VALIDATION =====
export const validateTerms = (agreed: boolean): ValidationResult => {
  if (!agreed) {
    return { isValid: false, error: 'Прийміть умови використання' };
  }
  
  return { isValid: true };
};
