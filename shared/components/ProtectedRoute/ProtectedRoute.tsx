// shared/components/ProtectedRoute/ProtectedRoute.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireEmailVerified?: boolean;
}

/**
 * Component для защиты маршрутов, требующих авторизации
 * 
 * @example
 * ```tsx
 * export default function ProfilePage() {
 *   return (
 *     <ProtectedRoute>
 *       <div>Защищенный контент</div>
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/auth',
  requireEmailVerified = false,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        // Save current path for redirect after login
        const redirectPath = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
        router.push(`${redirectTo}${redirectPath}`);
        return;
      }

      // Check email verification if required
      if (requireEmailVerified && !user?.email_confirmed_at) {
        router.push('/verify-email');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, requireEmailVerified, pathname]);

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

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if email verification is required but not completed
  if (requireEmailVerified && !user?.email_confirmed_at) {
    return null;
  }

  return <>{children}</>;
};
