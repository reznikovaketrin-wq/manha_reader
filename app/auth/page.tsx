import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

// ✅ Лоадер для Suspense
function AuthFormSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-10 w-40 bg-gray-600 rounded mb-4 mx-auto"></div>
          <div className="h-12 w-80 bg-gray-600 rounded mb-4"></div>
          <div className="h-12 w-80 bg-gray-600 rounded"></div>
        </div>
        <p className="text-text-muted mt-4">Завантаження...</p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthForm />
    </Suspense>
  );
}