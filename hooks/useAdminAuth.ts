'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

let adminCache: { data: AdminUser | null; timestamp: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 минуты

export function useAdminAuth() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkingRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [useAdminAuth] Auth state changed:', event);

      if (event === 'SIGNED_OUT') {
        setAdmin(null);
        adminCache = null;
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        router.push('/auth');
        return;
      }

      // Только на INITIAL_SESSION - избегаем race condition
      if (event === 'INITIAL_SESSION') {
        adminCache = null;
        checkAdmin();
      }
    });

    // Периодическая проверка каждые 3 минуты
    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ [useAdminAuth] Periodic refresh (3 min)');
      adminCache = null;
      checkAdmin();
    }, 3 * 60 * 1000);

    return () => {
      subscription?.unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [router]);

  const checkAdmin = async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      console.log('🔍 [useAdminAuth] Starting...');

      // Проверить кеш
      if (adminCache && Date.now() - adminCache.timestamp < CACHE_TTL) {
        console.log('💾 [useAdminAuth] Using cached data');
        setAdmin(adminCache.data);
        setLoading(false);
        checkingRef.current = false;
        return;
      }

      // Таймаут 4 секунды
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 4000)
      );

      const checkPromise = (async () => {
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
          console.log('❌ [useAdminAuth] No authenticated user');
          throw new Error('No authenticated user');
        }

        console.log('👤 [useAdminAuth] User:', authData.user.email);

        // Просто получить текущую сессию БЕЗ обновления
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData?.session) {
          console.log('❌ [useAdminAuth] No session');
          throw new Error('No session');
        }

        const accessToken = sessionData.session.access_token;
        if (!accessToken) {
          console.log('❌ [useAdminAuth] No access token');
          throw new Error('No access token');
        }

        console.log('🔑 [useAdminAuth] Token found');
        console.log('📡 [useAdminAuth] Calling API...');

        const response = await fetch('/api/admin/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log('📡 [useAdminAuth] Response:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [useAdminAuth] Success:', data.user.email);
        return data.user;
      })();

      const user = await Promise.race([checkPromise, timeoutPromise]);

      adminCache = {
        data: user as AdminUser,
        timestamp: Date.now(),
      };

      setAdmin(user as AdminUser);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('❌ [useAdminAuth] Error:', err instanceof Error ? err.message : String(err));

      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setLoading(false);

      // Не редирект на timeout
      if (message !== 'Timeout') {
        adminCache = null;
        setAdmin(null);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } finally {
      checkingRef.current = false;
    }
  };

  return { admin, loading, error, isAdmin: !!admin && admin.role === 'admin' };
}