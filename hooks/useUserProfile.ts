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
  role: 'user' | 'admin';
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

    console.log('📋 [useUserProfile] Loading profile for:', user.email);

    const loadProfile = async () => {
      try {
        // ✅ Загружаем полный профиль из таблицы users (БЕЗ user_metadata - её нет!)
        const { data, error } = await supabase
          .from('users')
          .select('id, email, username, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ [useUserProfile] Error loading profile:', error);
          // Fallback: используем auth user data
          setProfile({
            id: user.id,
            email: user.email || '',
            role: 'user',
          });
        } else {
          console.log('✅ [useUserProfile] Profile loaded:', data?.role);
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

  return { profile, loading, isAdmin: profile?.role === 'admin' };
}