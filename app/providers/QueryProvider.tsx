'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider - обёртка для TanStack Query
 * 
 * Настройки:
 * - staleTime: 2 минуты — данные считаются свежими
 * - gcTime: 30 минут — данные хранятся в кеше
 * - retry: 2 попытки при ошибке
 * - refetchOnWindowFocus: true — обновление при фокусе
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Время пока данные считаются свежими (не будет refetch)
            staleTime: 2 * 60 * 1000, // 2 минуты
            
            // Время хранения неактивных данных в кеше
            gcTime: 30 * 60 * 1000, // 30 минут
            
            // Количество попыток при ошибке
            retry: 2,
            
            // Задержка между попытками (exponential backoff)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Обновлять при возврате фокуса на окно
            refetchOnWindowFocus: true,
            
            // Не обновлять при монтировании если данные свежие
            refetchOnMount: true,
            
            // Обновлять при восстановлении сети
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry mutations only once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools только в development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
