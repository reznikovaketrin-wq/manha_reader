// features/auth/hooks/useUpdateUsername.ts

'use client';

import { useState } from 'react';
import { authService } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/lib/supabase-client';

export function useUpdateUsername() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { refreshUser } = useAuth();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setError('');
    setSuccess(false);

    // Validation
    if (!username.trim()) {
      setError('Введіть нове ім\'я користувача');
      return;
    }

    if (username.length < 3) {
      setError('Ім\'я користувача має містити мінімум 3 символи');
      return;
    }

    if (username.length > 20) {
      setError('Ім\'я користувача має містити максимум 20 символів');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Ім\'я користувача може містити тільки букви, цифри та підкреслення');
      return;
    }

    setIsSubmitting(true);

    try {
      const { user, error } = await authService.updateUsername(username);

      if (error) {
        setError(error.message);
        return;
      }

      if (user) {
        setSuccess(true);
        setUsername('');
        
        // Refresh user data in context
        if (refreshUser) {
          await refreshUser();
        }

        // Sync display_name in all user's comments (fire-and-forget)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            fetch('/api/profile/sync-username', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ username }),
            });
          }
        } catch (_) { /* non-critical */ }
      }
    } catch (err: any) {
      setError(err.message || 'Помилка при зміні імені користувача');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    username,
    setUsername,
    error,
    success,
    isSubmitting,
    handleSubmit,
  };
}
