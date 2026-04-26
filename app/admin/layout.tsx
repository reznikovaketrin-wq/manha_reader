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

  const result = await verifyAdminAccess();

  // 🔴 Користувач не авторизований → redirect на логін
  if (result === null) {
    redirect('/auth');
  }

  // 🔴 Є помилка (не адмін) → redirect на головну
  if ('error' in result) {
    redirect('/');
  }

  // ✅ Користувач адмін → рендер адмінки
  const admin = result.admin;

  return (
    <>
      {children}
    </>
  );
}