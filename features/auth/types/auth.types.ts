// features/auth/types/auth.types.ts

import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

// ===== USER TYPES =====
export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface AuthError {
  message: string;
  status: number;
  code?: string;
}

// ===== FORM DATA TYPES =====
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  agreedToTerms: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ===== STATE TYPES =====
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ===== VALIDATION TYPES =====
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  feedback?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  strength: PasswordStrength;
  suggestions: string[];
}

// ===== SESSION CONFIG =====
export interface SessionConfig {
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  autoRefresh: boolean;
  persistSession: boolean;
}

// ===== MIGRATION TYPES =====
export interface MigrationResult {
  success: boolean;
  migratedItems: {
    history: number;
    bookmarks: number;
    progress: number;
  };
  errors?: string[];
}

// ===== TOAST NOTIFICATION =====
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// ===== LOADING STATES =====
export interface LoadingStates {
  isAuthChecking: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isResettingPassword: boolean;
  isUpdatingPassword: boolean;
}
