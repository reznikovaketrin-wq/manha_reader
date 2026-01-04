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
    console.log('👤 [UserProvider] Initializing auth...');

    let isSubscribed = true;

    const initAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (isSubscribed) {
          const currentUser = sessionData.session?.user ?? null;
          if (currentUser) {
            console.log('✅ [UserProvider] Initial session found:', currentUser.email);
          } else {
            console.log('✅ [UserProvider] Initial session: null');
          }
          setUser(currentUser);
          // Установка завантаження в false після початкового отримання сесії
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => { // ← async
            if (!isSubscribed) return;

            console.log('🔔 [UserProvider] Auth state changed, event:', event);
            
            const currentUser = session?.user ?? null;
            
            // ✅ ДОДАТИ: Синхронізація історії при логіні
            if (event === 'SIGNED_IN' && currentUser && !syncedRef.current) {
              console.log('📚 [UserProvider] User signed in, syncing reading history...');
              
              try {
                await HistoryService.syncGuestToUser();
                syncedRef.current = true;
                console.log('✅ [UserProvider] Reading history synced successfully');
              } catch (error) {
                console.error('❌ [UserProvider] Error syncing history:', error);
              }
            }

            // ✅ ДОДАТИ: Скинути прапорець при логауті
            if (event === 'SIGNED_OUT') {
              syncedRef.current = false;
            }
            
            if (currentUser) {
              console.log('✅ [UserProvider] User logged in:', currentUser.email);
            } else {
              console.log('✅ [UserProvider] User logged out');
            }
            
            setUser(currentUser);
            setLoading(false);
          }
        );

        return () => {
          console.log('🧹 [UserProvider] Unmounting, unsubscribing...');
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