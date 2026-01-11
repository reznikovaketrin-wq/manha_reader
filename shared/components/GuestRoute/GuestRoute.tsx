// shared/components/GuestRoute/GuestRoute.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component для маршрутов, доступных только неавторизованным пользователям
 * Перенаправляет авторизованных пользователей на главную или указанную страницу
 * 
 * @example
 * ```tsx
 * export default function LoginPage() {
 *   return (
 *     <GuestRoute>
 *       <LoginForm />
 *     </GuestRoute>
 *   );
 * }
 * ```
 */
export const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  redirectTo = '/',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check if there's a redirect parameter
      const redirect = searchParams.get('redirect');
      const destination = redirect || redirectTo;
      
      router.push(destination);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, searchParams]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Завантаження...</p>
        </div>
      </div>
    );
  }

  // Don't render children if authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
