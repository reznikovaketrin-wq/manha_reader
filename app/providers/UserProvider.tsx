'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { HistoryService } from '@/components/readinghistory/lib/services/HistoryService'; // ← ДОДАТИ
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserContextType {
  user: SupabaseUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const syncedRef = useRef(false); // ← ДОДАТИ: щоб синхронізувати тільки раз

  useEffect(() => {
    let isSubscribed = true;

    const initAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (isSubscribed) {
          const currentUser = sessionData.session?.user ?? null;
          setUser(currentUser);
          // Установка завантаження в false після початкового отримання сесії
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isSubscribed) return;
            
            const currentUser = session?.user ?? null;
            
            // Sync reading history when user signs in
            if (event === 'SIGNED_IN' && currentUser && !syncedRef.current) {
              try {
                await HistoryService.syncGuestToUser();
                syncedRef.current = true;
              } catch (error) {
                console.error('[UserProvider] Error syncing history:', error);
              }
            }

            // Reset sync flag on logout
            if (event === 'SIGNED_OUT') {
              syncedRef.current = false;
            }

            setUser(currentUser);
            setLoading(false);
          }
        );

        return () => {
          isSubscribed = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ [UserProvider] Init error:', error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    const cleanup = initAuth();

    return () => {
      isSubscribed = false;
      cleanup.then(fn => fn?.());
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}