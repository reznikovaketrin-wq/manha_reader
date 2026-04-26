// hooks/useManhwaData.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Manhwa } from '@/types/domain/Manhwa';
import type { ManhwaAPI } from '@/types/api/manhwa';
import { mapManhwaAPIToDomain } from '@/mappers/manhwaMapper';

interface UseManhwaDataReturn {
  manhwa: Manhwa | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useManhwaData - загружает манхву и конвертирует в domain формат
 * 
 * ✅ Совместимость с React StrictMode (БЕЗ abort() ошибок!)
 * ✅ Mounted флаг предотвращает setState после unmount
 * ✅ НЕ вызываем abort() - просто игнорируем результат
 * ✅ Полный маппинг всех полей Manhwa
 * ✅ Типизация для JSON-response
 */
export function useManhwaData(id: string): UseManhwaDataReturn {
  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Отслеживаем, монтирован ли компонент
  const isMountedRef = useRef(true);

  const fetchManhwa = useCallback(async () => {
    // Валидация ID
    if (!id || typeof id !== 'string') {
      if (isMountedRef.current) {
        setLoading(false);
        setManhwa(null);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      if (process.env.NODE_ENV !== 'production') {
      }

      const response = await fetch(`/api/public/${id}`);

      // Проверяем статус ответа
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ✅ Типизируем JSON response
      const apiData: ManhwaAPI = await response.json();

      if (process.env.NODE_ENV !== 'production') {
      }

      // ✅ Используем ПОЛНЫЙ mapper для конвертации
      const domainManhwa = mapManhwaAPIToDomain(apiData);

      // ✅ Проверяем монтирование ПЕРЕД setState
      if (isMountedRef.current) {
        if (process.env.NODE_ENV !== 'production') {
        }
        setManhwa(domainManhwa);
        setError(null);
      } else {
        if (process.env.NODE_ENV !== 'production') {
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`❌ Помилка при завантаженні:`, error);
      
      // ✅ Проверяем монтирование ПЕРЕД setState
      if (isMountedRef.current) {
        setError(error);
        setManhwa(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    // Помечаем, что компонент МОНТИРОВАН
    isMountedRef.current = true;

    // Запускаем fetch
    fetchManhwa();

    // Cleanup функция
    return () => {
      // Помечаем, что компонент РАЗМОНТИРОВАН
      isMountedRef.current = false;
      // ✅ НЕ вызываем abort() - это вызывает ошибки в StrictMode!
      // Вместо этого мы просто пропускаем setState выше благодаря флагу
    };
  }, [id]);

  return {
    manhwa,
    loading,
    error,
    refetch: fetchManhwa,
  };
}