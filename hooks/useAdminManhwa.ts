'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkingRef = useRef(false);

  useEffect(() => {
    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent) => {
      console.log('Auth event:', event);

      // Если юзер вышел — сбрасываем
      if (event === 'SIGNED_OUT') {
        adminCache = null;
        setAdmin(null);
        router.push('/');
        return;
      }

      // Перепроверить при любом другом событии
      adminCache = null;
      checkAdmin();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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

      console.log('🔍 Checking session...');

      // ====== ОБНОВЛЕНИЕ ТОКЕНА ПЕРЕД РАБОТОЙ ======
      await supabase.auth.refreshSession();

      // ====== GET USER ======
      const { data: authData, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !authData?.user) {
        setAdmin(null);
        setLoading(false);
        checkingRef.current = false;
        router.push('/auth');
        return;
      }

      const user = authData.user;

      // ====== GET SESSION ======
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        setAdmin(null);
        setLoading(false);
        checkingRef.current = false;
        router.push('/auth');
        return;
      }

      const accessToken = sessionData.session.access_token;

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

        console.warn('API request failed or timed out → fallback user');

        const fallbackUser: AdminUser = {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || 'User',
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
      setError('Auth error');
      setLoading(false);
    } finally {
      checkingRef.current = false;
    }
  };

  return { admin, loading, error, isAdmin: admin?.role === 'admin' };
}
