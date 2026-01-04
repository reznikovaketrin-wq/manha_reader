'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/app/providers/UserProvider';

interface UseAuthGuardReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  requireAuth: (callback: () => void) => void;
}

/**
 * useAuthGuard - управляет проверкой авторизации
 * Предотвращает выполнение действий без авторизации
 */
export function useAuthGuard(): UseAuthGuardReturn {
  const { user, loading } = useUser();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Даём время на инициализацию auth context
    setIsReady(true);
  }, []);

  const requireAuth = (callback: () => void) => {
    if (!user) {
      console.warn('⚠️ Требуется авторизация');
      // Можно показать modal для логина
      return;
    }
    callback();
  };

  return {
    isAuthenticated: !!user,
    isLoading: loading || !isReady,
    user,
    requireAuth,
  };
}