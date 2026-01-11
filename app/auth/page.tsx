'use client';

import { Suspense, useState } from 'react';
import { LoginForm, RegisterForm } from '@/features/auth';
import { GuestRoute } from '@/shared/components';

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

function AuthPageContent() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <GuestRoute>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </GuestRoute>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthPageContent />
    </Suspense>
  );
}