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
      const redirect = searchParams?.get('redirect');
      const destination = redirect || redirectTo;
      
      router.push(destination);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, searchParams]);

  // Show loading state
  // While auth status is loading, keep rendering children to avoid
  // unmounting forms (which would reset local component state).
  // Previously we returned a loading placeholder here, causing the
  // `LoginForm` to unmount when `signIn` set `isLoading` -> true.
  // Render children during loading instead.
  if (isLoading) {
    return <>{children}</>;
  }

  // Don't render children if authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
