// features/auth/services/AuthService.ts

'use client';

import { supabase } from '@/lib/supabase-client';
import { User, Session, AuthError } from '../types';
import { createAuthError, logAuthEvent, AuthEvents } from '../utils';

class AuthService {
  private getSiteOrigin(): string {
    // Determine site origin used in email links and redirects.
    // Priority:
    // 1) NEXT_PUBLIC_SITE_URL (explicit public site URL, e.g. https://example.com)
    // 2) NEXT_PUBLIC_API_URL (use its origin when provided)
    // 3) NEXT_PUBLIC_SITE_URL (production -> use provided public site URL)
    // 4) browser `window.location.origin` when available
    // 5) fallback to localhost with `PORT` or 3000
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl && siteUrl.length > 0) return siteUrl.replace(/\/+$/, '');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.length > 0) {
      // If running in browser and env points to localhost, prefer current origin
      if (typeof window !== 'undefined' && apiUrl.includes('localhost')) {
        return window.location.origin;
      }
      try {
        return new URL(apiUrl).origin;
      } catch (e) {
        // If apiUrl is not a full URL, return as-is
        return apiUrl.replace(/\/+$/, '');
      }
    }

    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');

    if (typeof window !== 'undefined' && window.location && window.location.origin) return window.location.origin;

    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  // ===== SIGN IN =====
  async signIn(email: string, password: string, rememberMe: boolean = false): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logAuthEvent(AuthEvents.SIGN_IN_ERROR, { error: error.message });
        return {
          user: null,
          session: null,
          error: createAuthError(error.message, error.status)
        };
      }

      // Set session persistence
      if (rememberMe) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      logAuthEvent(AuthEvents.SIGN_IN_SUCCESS, { userId: data.user.id });

      return {
        user: data.user as User,
        session: data.session as Session,
        error: null
      };
    } catch (error: any) {
      logAuthEvent(AuthEvents.SIGN_IN_ERROR, { error: error.message });
      return {
        user: null,
        session: null,
        error: createAuthError(error.message)
      };
    }
  }

  // ===== SIGN UP =====
  async signUp(email: string, password: string, metadata?: { username?: string }): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
    try {
      const base = this.getSiteOrigin();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${base}/auth/callback`
        }
      });

      if (error) {
        // Enhanced error logging for database issues
        if (error.message.includes('Database error')) {
          console.error('❌ [AUTH] Database error during signup:', {
            error: error.message,
            status: error.status,
            email,
            hint: 'Check if users table exists and trigger is configured properly'
          });
        }
        logAuthEvent(AuthEvents.SIGN_UP_ERROR, { error: error.message });
        return {
          user: null,
          session: null,
          error: createAuthError(
            error.message.includes('Database error') 
              ? 'Unable to create account. Please contact support.' 
              : error.message,
            error.status
          )
        };
      }

      logAuthEvent(AuthEvents.SIGN_UP_SUCCESS, { userId: data.user?.id });

      return {
        user: data.user as User,
        session: data.session as Session,
        error: null
      };
    } catch (error: any) {
      console.error('❌ [AUTH] Unexpected error during signup:', error);
      logAuthEvent(AuthEvents.SIGN_UP_ERROR, { error: error.message });
      return {
        user: null,
        session: null,
        error: createAuthError('An unexpected error occurred. Please try again.')
      };
    }
  }

  // ===== SIGN OUT =====
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: createAuthError(error.message, error.status) };
      }

      logAuthEvent(AuthEvents.SIGN_OUT);

      return { error: null };
    } catch (error: any) {
      return { error: createAuthError(error.message) };
    }
  }

  // ===== RESET PASSWORD FOR EMAIL =====
  async resetPasswordForEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const base = this.getSiteOrigin();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${base}/auth/reset-password`
      });

      if (error) {
        logAuthEvent(AuthEvents.PASSWORD_RESET_ERROR, { error: error.message });
        return { error: createAuthError(error.message, error.status) };
      }

      logAuthEvent(AuthEvents.PASSWORD_RESET_REQUEST, { email });

      return { error: null };
    } catch (error: any) {
      logAuthEvent(AuthEvents.PASSWORD_RESET_ERROR, { error: error.message });
      return { error: createAuthError(error.message) };
    }
  }

  // ===== SET SESSION FROM TOKENS =====
  async setSessionFromTokens(accessToken: string, refreshToken: string): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        return {
          session: null,
          error: createAuthError(error.message, error.status)
        };
      }

      return {
        session: data.session as Session,
        error: null
      };
    } catch (error: any) {
      return {
        session: null,
        error: createAuthError(error.message)
      };
    }
  }

  // ===== UPDATE PASSWORD =====
  async updatePassword(newPassword: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          user: null,
          error: createAuthError(error.message, error.status)
        };
      }

      logAuthEvent(AuthEvents.PASSWORD_CHANGE_SUCCESS, { userId: data.user.id });

      return {
        user: data.user as User,
        error: null
      };
    } catch (error: any) {
      return {
        user: null,
        error: createAuthError(error.message)
      };
    }
  }

  // ===== GET SESSION =====
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        return null;
      }

      return data.session as Session;
    } catch (error) {
      return null;
    }
  }

  // ===== REFRESH SESSION =====
  async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return {
          session: null,
          error: createAuthError(error.message, error.status)
        };
      }

      return {
        session: data.session as Session,
        error: null
      };
    } catch (error: any) {
      return {
        session: null,
        error: createAuthError(error.message)
      };
    }
  }

  // ===== ON AUTH STATE CHANGE =====
  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session as Session | null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }

  // ===== RESEND CONFIRMATION EMAIL =====
  async resendConfirmationEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const base = this.getSiteOrigin();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${base}/auth/callback`
        }
      });

      if (error) {
        return { error: createAuthError(error.message, error.status) };
      }

      logAuthEvent(AuthEvents.RESEND_EMAIL_CLICKED, { email });

      return { error: null };
    } catch (error: any) {
      return { error: createAuthError(error.message) };
    }
  }

  // ===== CHECK USERNAME AVAILABILITY =====
  async checkUsernameAvailable(username: string): Promise<{ available: boolean; error: AuthError | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found (username available)
        return { available: false, error: createAuthError(error.message) };
      }

      return { available: !data, error: null };
    } catch (error: any) {
      return { available: false, error: createAuthError(error.message) };
    }
  }

  // ===== UPDATE USERNAME =====
  async updateUsername(username: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      // Check availability first
      const { available, error: availError } = await this.checkUsernameAvailable(username);
      
      if (availError) {
        return { user: null, error: availError };
      }

      if (!available) {
        return { 
          user: null, 
          error: createAuthError('Це ім\'я користувача вже зайняте', 400) 
        };
      }

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        return { 
          user: null, 
          error: createAuthError('Користувач не автентифікований', 401) 
        };
      }

      // Update user metadata
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: { username }
      });

      if (authError) {
        return { user: null, error: createAuthError(authError.message, authError.status) };
      }

      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', currentUser.id);

      if (profileError) {
        return { user: null, error: createAuthError(profileError.message) };
      }

      logAuthEvent(AuthEvents.PROFILE_UPDATE, { userId: currentUser.id, field: 'username' });

      return { user: authData.user as User, error: null };
    } catch (error: any) {
      return { user: null, error: createAuthError(error.message) };
    }
  }

  // ===== UPDATE AVATAR =====
  async updateAvatar(file: File): Promise<{ avatarUrl: string | null; error: AuthError | null }> {
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        return { 
          avatarUrl: null, 
          error: createAuthError('Користувач не автентифікований', 401) 
        };
      }

      // Generate unique filename and place inside a user-specific folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${currentUser.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { avatarUrl: null, error: createAuthError(uploadError.message) };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (authError) {
        return { avatarUrl: null, error: createAuthError(authError.message) };
      }

      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (profileError) {
        return { avatarUrl: null, error: createAuthError(profileError.message) };
      }

      logAuthEvent(AuthEvents.PROFILE_UPDATE, { userId: currentUser.id, field: 'avatar' });

      return { avatarUrl: publicUrl, error: null };
    } catch (error: any) {
      return { avatarUrl: null, error: createAuthError(error.message) };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
