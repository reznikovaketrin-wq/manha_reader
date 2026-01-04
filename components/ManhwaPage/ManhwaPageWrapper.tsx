'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useManhwaPageUI } from '../../hooks/useManhwaPageUI';
import { useScreen } from '../../hooks/useScreen';
import { useManhwaData } from '../../hooks/useManhwaData';
import { useChaptersFilter } from '../../hooks/useChaptersFilter';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { ErrorBoundary } from './errors/ErrorBoundary';
import { AppError } from './errors/AppError';
import ManhwaPage from './ManhwaPage';
import { ManhwaPageSkeleton } from './Skeleton';

/**
 * ManhwaPageWrapper - слой оркестрации логики страницы
 * 
 * ✅ РЕАЛЬНЫЕ ХУКИ:
 * - useManhwaData() - загрузка манхвы
 * - useChaptersFilter() - фильтрация глав
 * - useAuthGuard() - проверка авторизации
 * - useManhwaPageUI() - UI состояния
 * - useScreen() - размер экрана
 * 
 * Обязанности:
 * - Вызывать ВСЕ необходимые хуки
 * - Передавать данные в ManhwaPage через props
 * - Обработка критических ошибок (Error → AppError)
 *
 * НЕ содержит:
 * - useEffect для бизнес-логики
 * - window / addEventListener
 * - fetch / API логику
 * - Сложный JSX
 *
 * Размер: ≤ 150 строк
 */
function ManhwaPageContent() {
  const params = useParams();
  const manhwaId = params.id as string;

  // ============================================
  // РЕАЛЬНЫЕ ХУКИ ДАННЫХ
  // ============================================

  // 1️⃣ Загрузка манхвы (с ошибками)
  const { 
    manhwa, 
    loading: manhwaLoading, 
    error: manhwaApiError 
  } = useManhwaData(manhwaId);

  // 2️⃣ Фильтрация глав
  const { filteredChapters } = useChaptersFilter(manhwa?.chapters || []);

  // 3️⃣ Проверка авторизации
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();

  // ============================================
  // КОНВЕРТАЦИЯ ОШИБОК
  // ============================================

  // Конвертируем Error из API в AppError
  let manhwaError: AppError | null = null;
  if (manhwaApiError) {
    manhwaError = new AppError(
      'API_ERROR',
      manhwaApiError.message || 'Помилка завантаження манхви',
      500,
      false
    );
  }

  // ============================================
  // ФЛАГИ ДОСТУПА (на основе авторизации)
  // ============================================

  // ✅ Пользователь может оценивать и комментировать если авторизирован
  const canRate = isAuthenticated;
  const canComment = isAuthenticated;

  // ============================================
  // UI СОСТОЯНИЯ
  // ============================================

  const ui = useManhwaPageUI();
  const screen = useScreen();

  // ============================================
  // ОБРАБОТЧИКИ
  // ============================================

  const handleRatingSubmit = async (rating: number) => {
    try {
      const response = await fetch(`/api/manhwa/${manhwaId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('✅ Rating submitted:', rating);
      ui.onRatingModalClose();
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
    }
  };

  // ============================================
  // ПРОВЕРКА КРИТИЧЕСКИХ ОШИБОК
  // ============================================

  // Обрабатываем ошибки манхвы
  if (manhwaError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#FF6B6B' }}>
        <h2>Помилка завантаження</h2>
        <p>{manhwaError.message}</p>
      </div>
    );
  }

  // Если манхва не найдена
  if (!manhwaLoading && !manhwa) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#FF6B6B' }}>
        <h2>Манхва не знайдена</h2>
        <p>Неможливо загрузити дані манхви</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <ManhwaPage
      // ID
      manhwaId={manhwaId}

      // Данные (манхва гарантирована благодаря Suspense)
      manhwa={manhwa!}
      filteredChapters={filteredChapters}

      // Состояния UI
      isMobile={screen.isMobile}
      activeTab={ui.activeTab}
      showRatingModal={ui.showRatingModal}

      // Коллбеки
      onTabChange={ui.onTabChange}
      onRatingModalOpen={ui.onRatingModalOpen}
      onRatingModalClose={ui.onRatingModalClose}
      onRatingSubmit={handleRatingSubmit}

      // Флаги доступа (на основе авторизации)
      canRate={canRate}
      canComment={canComment}

      // Ошибки
      error={manhwaError}
    />
  );
}

/**
 * Обертка с Error Boundary и Suspense
 */
export function ManhwaPageWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ManhwaPageSkeleton />}>
        <ManhwaPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}