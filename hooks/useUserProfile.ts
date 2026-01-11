// hooks/useUserProfile.ts
// ✅ Загружает полный профиль пользователя с role из database

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/app/providers/UserProvider';
import { supabase } from '@/lib/supabase-client';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: 'user' | 'vip' | 'admin';
}

export function useUserProfile() {
  const { user, loading: authLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        // Загружаем профиль из таблицы users — используем maybeSingle чтобы
        // избежать 406 ошибки, если строки нет
        const { data, error } = await supabase
          .from('users')
          .select('id, email, username, role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ [useUserProfile] Error loading profile:', error);
          setProfile({
            id: user.id,
            email: user.email || '',
            role: 'user',
          });
        } else if (!data) {
          // No profile row found — fall back to minimal data from auth
          setProfile({
            id: user.id,
            email: user.email || '',
            role: 'user',
          });
        } else {
          setProfile({
            id: data.id,
            email: data.email,
            username: data.username,
            role: data.role || 'user',
          });
        }
      } catch (err) {
        console.error('❌ [useUserProfile] Exception:', err);
        setProfile({
          id: user.id,
          email: user.email || '',
          role: 'user',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading]);

  return { 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isVip: profile?.role === 'vip'
  };
}