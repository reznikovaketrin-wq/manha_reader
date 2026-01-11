// features/auth/index.ts

// Context & Hooks
export { AuthProvider, useAuth } from './context';
export { 
  useLogin, 
  useRegister, 
  useForgotPassword, 
  useResetPassword, 
  useChangePassword,
  useUpdateUsername,
  useUpdateAvatar,
} from './hooks';

// Components
export { LoginForm, RegisterForm, AuthModal } from './components';

// Services
export { authService, dataMigrationService } from './services';

// Types
export type {
  User,
  Session,
  AuthError,
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  ChangePasswordFormData,
  AuthState,
  FormState,
  ValidationResult,
  PasswordStrength,
  PasswordValidationResult,
  MigrationResult,
} from './types';

// Utils
export {
  validateEmail,
  validatePassword,
  validatePasswordSimple,
  validateUsername,
  validateTerms,
  matchPasswords,
  checkPasswordStrength,
  getAuthErrorMessage,
  logAuthEvent,
  AuthEvents,
} from './utils';
