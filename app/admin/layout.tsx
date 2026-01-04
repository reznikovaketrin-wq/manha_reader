// app/admin/layout.tsx
// ✅ Server Component with server-side admin guard

import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/admin';
import React from 'react';

// ✅ ИСПРАВЛЕНИЕ: Не генерировать статически, так как используется cookies
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Админ-панель | Manhwa Reader',
  description: 'Админ-панель',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ✅ SERVER-SIDE VERIFICATION
  console.log('📍 [AdminLayout] Verifying admin access...');

  const result = await verifyAdminAccess();

  console.log('📋 [AdminLayout] Verification result:', {
    isNull: result === null,
    hasError: result && 'error' in result,
    hasAdmin: result && 'admin' in result,
  });

  // 🔴 Користувач не авторизований → redirect на логін
  if (result === null) {
    console.log('🔴 [AdminLayout] Not authenticated - redirecting to /auth');
    redirect('/auth');
  }

  // 🔴 Є помилка (не адмін) → redirect на головну
  if ('error' in result) {
    console.log('🔴 [AdminLayout] Error:', result.error, '- redirecting to /');
    redirect('/');
  }

  // ✅ Користувач адмін → рендер адмінки
  const admin = result.admin;
  console.log('✅ [AdminLayout] Admin verified:', admin.email);

  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}