// features/auth/context/AuthContext.tsx

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthState } from '../types';
import { authService, dataMigrationService } from '../services';

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // ===== CHECK AUTH ON MOUNT =====
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const session = await authService.getSession();
      
      if (session) {
        setState({
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return false;
      }
    } catch (error) {
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      return false;
    }
  }, []);

  // ===== SIGN IN =====
  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.signIn(email, password, rememberMe);

    if (result.error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error,
      }));
      throw new Error(result.error.message);
    }

    if (result.user && result.session) {
      // Migrate guest data
      if (dataMigrationService.hasGuestData()) {
        await dataMigrationService.migrateAllData(result.user.id);
      }

      setState({
        user: result.user,
        session: result.session,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    }
  }, []);

  // ===== SIGN UP =====
  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.signUp(email, password, { username });

    if (result.error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error,
      }));
      throw new Error(result.error.message);
    }

    if (result.user && result.session) {
      // Migrate guest data
      if (dataMigrationService.hasGuestData()) {
        await dataMigrationService.migrateAllData(result.user.id);
      }

      setState({
        user: result.user,
        session: result.session,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } else {
      // Email confirmation required
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  // ===== SIGN OUT =====
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    const result = await authService.signOut();

    if (result.error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error,
      }));
      throw new Error(result.error.message);
    }

    setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  // ===== RESET PASSWORD =====
  const resetPassword = useCallback(async (email: string) => {
    const result = await authService.resetPasswordForEmail(email);

    if (result.error) {
      throw new Error(result.error.message);
    }
  }, []);

  // ===== UPDATE PASSWORD =====
  const updatePassword = useCallback(async (newPassword: string) => {
    const result = await authService.updatePassword(newPassword);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.user) {
      setState(prev => ({
        ...prev,
        user: result.user,
      }));
    }
  }, []);

  // ===== REFRESH SESSION =====
  const refreshSession = useCallback(async () => {
    const result = await authService.refreshSession();

    if (result.session) {
      setState(prev => ({
        ...prev,
        session: result.session,
        user: result.session!.user,
        isAuthenticated: true,
      }));
    }
  }, []);

  // ===== REFRESH USER DATA =====
  const refreshUser = useCallback(async () => {
    const session = await authService.getSession();
    
    if (session) {
      setState(prev => ({
        ...prev,
        user: session.user,
        session,
      }));
    }
  }, []);

  // ===== INIT & AUTH STATE LISTENER =====
  useEffect(() => {
    checkAuth();

    const unsubscribe = authService.onAuthStateChange((event, session) => {
      if (session) {
        setState({
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [checkAuth]);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    checkAuth,
    refreshSession,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== HOOK =====
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};
