'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

let adminCache: { data: AdminUser | null; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 час

export function useAdminAuth() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMountedRef.current) return;
      
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

      if (event === 'INITIAL_SESSION') {
        adminCache = null;
        checkAdmin();
      }
    });

    // ✅ Периодическая проверка каждый час
    refreshIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      console.log('⏰ [useAdminAuth] Periodic refresh (1 hour)');
      adminCache = null;
      checkAdmin();
    }, 60 * 60 * 1000); // 1 час = 3,600,000 мс

    return () => {
      isMountedRef.current = false;
      subscription?.unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      // ✅ Отменить fetch если в процессе
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [router]);

  const checkAdmin = async () => {
    if (!isMountedRef.current || checkingRef.current) return;
    checkingRef.current = true;

    try {
      console.log('🔍 [useAdminAuth] Starting...');

      // ✅ Проверить кеш (1 час)
      if (adminCache && Date.now() - adminCache.timestamp < CACHE_TTL) {
        console.log('💾 [useAdminAuth] Using cached data');
        if (isMountedRef.current) {
          setAdmin(adminCache.data);
          setLoading(false);
        }
        checkingRef.current = false;
        return;
      }

      // ✅ AbortController для отмены fetch
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // ✅ Таймаут 8 секунд
      const timeoutId = setTimeout(() => abortController.abort(), 8000);

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (!isMountedRef.current) return;

        if (authError || !authData.user) {
          console.log('❌ [useAdminAuth] No authenticated user');
          throw new Error('No authenticated user');
        }

        console.log('👤 [useAdminAuth] User:', authData.user.email);

        const { data: sessionData } = await supabase.auth.getSession();

        if (!isMountedRef.current) return;

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
          signal: abortController.signal, // ✅ Передаём signal
        });

        clearTimeout(timeoutId);

        if (!isMountedRef.current) return;

        console.log('📡 [useAdminAuth] Response:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [useAdminAuth] Success:', data.user.email);

        adminCache = {
          data: data.user as AdminUser,
          timestamp: Date.now(),
        };

        if (isMountedRef.current) {
          setAdmin(data.user as AdminUser);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        clearTimeout(timeoutId);

        if (!isMountedRef.current) return;

        // ✅ Проверить если это AbortError
        if (err instanceof Error && err.name === 'AbortError') {
          console.warn('⚠️ [useAdminAuth] Request aborted');
          return;
        }

        console.error('❌ [useAdminAuth] Error:', err instanceof Error ? err.message : String(err));

        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setLoading(false);
        adminCache = null;
        setAdmin(null);

        setTimeout(() => {
          if (isMountedRef.current) {
            router.push('/');
          }
        }, 1500);
      }
    } finally {
      checkingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  return { admin, loading, error, isAdmin: !!admin && admin.role === 'admin' };
}