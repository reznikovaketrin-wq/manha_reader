// features/auth/hooks/useUpdateAvatar.ts

'use client';

import { useState } from 'react';
import { authService } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';

export function useUpdateAvatar() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { refreshUser } = useAuth();

  const uploadAvatar = async (file: File) => {
    setError('');
    setSuccess(false);

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Файл занадто великий. Максимальний розмір: 5MB');
      return { success: false };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Непідтримуваний формат файлу. Використовуйте: JPG, PNG, WEBP або GIF');
      return { success: false };
    }

    setIsUploading(true);

    try {
      const { avatarUrl, error } = await authService.updateAvatar(file);

      if (error) {
        setError(error.message);
        return { success: false };
      }

      if (avatarUrl) {
        setSuccess(true);
        
        // Refresh user data in context
        if (refreshUser) {
          await refreshUser();
        }

        return { success: true, url: avatarUrl };
      }

      return { success: false };
    } catch (err: any) {
      setError(err.message || 'Помилка при завантаженні аватара');
      return { success: false };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    error,
    success,
    uploadAvatar,
  };
}
