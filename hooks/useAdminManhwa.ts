'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider'; // ✅ Используем Context
import { getAccessToken } from '@/lib/auth'; // ✅ Получаем токен через lib/auth
import { AuthChangeEvent } from '@supabase/supabase-js';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

let adminCache: { data: AdminUser | null; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export function useAdminAuth() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser(); // ✅ Получаем user из Context
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Не проверяем, пока user не загружен
    if (userLoading) {
      return;
    }

    // Если user не существует, перенаправляем
    if (!user) {
      setAdmin(null);
      setLoading(false);
      router.push('/auth');
      return;
    }

    // Проверяем админ статус
    checkAdmin();
  }, [user, userLoading, router]);

  const checkAdmin = async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      // ====== CACHE ======
      if (adminCache && Date.now() - adminCache.timestamp < CACHE_TTL) {
        setAdmin(adminCache.data);
        setLoading(false);
        checkingRef.current = false;
        return;
      }

      // ====== GET ACCESS TOKEN ======
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setAdmin(null);
        setLoading(false);
        checkingRef.current = false;
        router.push('/auth');
        return;
      }

      // ====== API CHECK WITH TIMEOUT ======
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch('/api/admin/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        adminCache = {
          data: data.user,
          timestamp: Date.now(),
        };

        setAdmin(data.user);
      } catch (err) {
        clearTimeout(timeoutId);

        // ✅ Используем user из Context
        const fallbackUser: AdminUser = {
          id: user?.id || '',
          email: user?.email || '',
          username: user?.user_metadata?.username || 'User',
          role: 'user',
        };

        adminCache = {
          data: fallbackUser,
          timestamp: Date.now(),
        };

        setAdmin(fallbackUser);
      }

      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      setError('Auth error');
      setLoading(false);
    } finally {
      checkingRef.current = false;
    }
  };

  return { admin, loading, error, isAdmin: admin?.role === 'admin' };
}