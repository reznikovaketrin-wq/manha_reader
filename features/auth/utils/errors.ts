// features/auth/utils/errors.ts

import { AuthError } from '../types';

// ===== ERROR MESSAGES MAPPING =====
export const authErrorMessages: Record<string, string> = {
  // Sign in errors
  'Invalid login credentials': 'Невірний email або пароль',
  'Email not confirmed': 'Будь ласка, підтвердіть свій email',
  'User not found': 'Користувача не знайдено',
  'Invalid email or password': 'Невірний email або пароль',
  
  // Sign up errors
  'User already registered': 'Ця email адреса вже використовується',
  'Password should be at least 6 characters': 'Пароль має містити мінімум 6 символів',
  'Signup requires a valid password': 'Вкажіть коректний пароль',
  'Invalid email': 'Некоректна email адреса',
  'Email address is already registered': 'Ця email адреса вже використовується',
  
  // Rate limiting
  'Email rate limit exceeded': 'Забагато запитів. Спробуйте пізніше',
  'SMS rate limit exceeded': 'Забагато запитів. Спробуйте пізніше',
  'Too many requests': 'Забагато спроб входу. Спробуйте пізніше',
  
  // Token errors
  'Invalid token': 'Недійсне посилання для відновлення',
  'Token has expired': 'Посилання застаріло. Запросіть нове',
  'Token expired': 'Посилання застаріло. Запросіть нове',
  
  // Password errors
  'New password should be different': 'Новий пароль має відрізнятися від поточного',
  'Password is too weak': 'Пароль занадто простий',
  
  // Network errors
  'Failed to fetch': 'Помилка з\'єднання. Перевірте інтернет',
  'NetworkError': 'Помилка з\'єднання. Перевірте інтернет',
  'Network request failed': 'Помилка з\'єднання. Перевірте інтернет',
  
  // Session errors
  'Session expired': 'Сесія застаріла. Увійдіть знову',
  'Refresh token expired': 'Сесія застаріла. Увійдіть знову',
};

// ===== GET ERROR MESSAGE =====
export const getAuthErrorMessage = (error: any): string => {
  // If it's already a string
  if (typeof error === 'string') {
    return authErrorMessages[error] || error;
  }
  
  // If it's an AuthError object
  if (error?.message) {
    return authErrorMessages[error.message] || error.message;
  }
  
  // Default message
  return 'Сталася помилка. Спробуйте ще раз';
};

// ===== CREATE AUTH ERROR =====
export const createAuthError = (message: string, status: number = 500, code?: string): AuthError => {
  return {
    message: getAuthErrorMessage(message),
    status,
    code
  };
};

// ===== ANALYTICS EVENTS =====
export enum AuthEvents {
  // Successful actions
  SIGN_UP_SUCCESS = 'auth_signup_success',
  SIGN_IN_SUCCESS = 'auth_signin_success',
  SIGN_OUT = 'auth_signout',
  PROFILE_UPDATE = 'auth_profile_update',
  PASSWORD_RESET_REQUEST = 'auth_password_reset_request',
  PASSWORD_RESET_SUCCESS = 'auth_password_reset_success',
  PASSWORD_CHANGE_SUCCESS = 'auth_password_change_success',
  EMAIL_VERIFIED = 'auth_email_verified',
  
  // Errors
  SIGN_UP_ERROR = 'auth_signup_error',
  SIGN_IN_ERROR = 'auth_signin_error',
  PASSWORD_RESET_ERROR = 'auth_password_reset_error',
  
  // Behavior
  FORGOT_PASSWORD_CLICKED = 'auth_forgot_password_clicked',
  RESEND_EMAIL_CLICKED = 'auth_resend_email_clicked',
  TOGGLE_PASSWORD_VISIBILITY = 'auth_toggle_password_visibility',
}

// ===== LOG AUTH EVENT =====
export const logAuthEvent = (
  event: AuthEvents,
  metadata?: Record<string, any>
) => {
  console.log(`[AUTH] ${event}`, metadata);
  // TODO: Integrate with analytics (Google Analytics, Mixpanel, etc.)
};
