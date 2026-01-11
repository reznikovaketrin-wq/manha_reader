import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { HistoryService } from '@/components/readinghistory/lib/services/HistoryService';

/**
 * useHistorySync - автоматична синхронізація історії при авторизації
 * 
 * Викликає syncGuestToUser() коли користувач авторизується
 * Використовується в layout або root компоненті
 */
export function useHistorySync() {
  const syncedRef = useRef(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && !syncedRef.current) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[useHistorySync] User signed in, syncing history...');
          }

          try {
            await HistoryService.syncGuestToUser();
            syncedRef.current = true;
            if (process.env.NODE_ENV !== 'production') {
              console.log('[useHistorySync] ✅ History synced successfully');
            }
          } catch (error) {
            console.error('[useHistorySync] Error syncing history:', error);
          }
        }

        if (event === 'SIGNED_OUT') {
          syncedRef.current = false;
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
}