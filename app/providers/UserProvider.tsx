'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { syncLocalToSupabase } from '@/lib/reading-progress';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserContextType {
  user: SupabaseUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const syncedRef = useRef(false);

  useEffect(() => {
    let isSubscribed = true;

    const initAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (isSubscribed) {
          const currentUser = sessionData.session?.user ?? null;
          setUser(currentUser);
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isSubscribed) return;
            
            const currentUser = session?.user ?? null;
            
            // Sync reading progress when user signs in (new system)
            if (event === 'SIGNED_IN' && currentUser && !syncedRef.current) {
              try {
                const result = await syncLocalToSupabase(currentUser.id);
                syncedRef.current = true;
                if (process.env.NODE_ENV !== 'production') {
                  console.log('[UserProvider] Progress synced:', result);
                }
              } catch (error) {
                console.error('[UserProvider] Error syncing progress:', error);
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