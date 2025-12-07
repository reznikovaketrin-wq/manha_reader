'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ReactNode } from 'react';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { admin, loading, error, isAdmin } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-text-muted">Проверка доступа админа...</p>
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    console.error('🚫 [AdminGuard] Access denied:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ запрещен</h1>
          <p className="text-text-muted mb-4">{error || 'Вы не являетесь администратором'}</p>
          <a href="/" className="text-blue-500 hover:underline">
            Вернуться на главную
          </a>
        </div>
      </div>
    );
  }

  console.log('✅ [AdminGuard] Access granted for:', admin?.email);
  return <>{children}</>;
}