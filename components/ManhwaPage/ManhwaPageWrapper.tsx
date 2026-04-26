 'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider';
import { useParams } from 'next/navigation';
import { useManhwaPageUI } from '../../hooks/useManhwaPageUI';
import { useScreen } from '../../hooks/useScreen';
import { useManhwaData } from '../../hooks/useManhwaData';
import { useChaptersFilter } from '../../hooks/useChaptersFilter';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { ErrorBoundary } from './errors/ErrorBoundary';
import { AppError } from './errors/AppError';
import { markManhwaVisited } from '@/lib/manhwa-visited';
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
  const manhwaId = params?.id as string;

  // ============================================
  // РЕАЛЬНЫЕ ХУКИ ДАННЫХ
  // ============================================

  // 1️⃣ Загрузка манхвы (с ошибками)
  const { 
    manhwa, 
    loading: manhwaLoading, 
    error: manhwaApiError,
    refetch: refetchManhwa,
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

  // ✅ Получаем текущего user один раз в компоненте (чтобы не использовать хук внутри обработчика)
  const { user } = useUser();

  // ============================================
  // UI СОСТОЯНИЯ
  // ============================================

  const ui = useManhwaPageUI();
  const screen = useScreen();

  // ============================================
  // ОБРАБОТЧИКИ
  // ============================================

  const router = useRouter();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleRatingModalOpen = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      ui.onRatingModalOpen();
    }
  }; 

  // Зберегти час перегляду сторінки манхви (для плашки "Оновлено")
  useEffect(() => {
    if (manhwaId) markManhwaVisited(manhwaId);
  }, [manhwaId]);

  const handleRatingSubmit = async (rating: number) => {
    try {
      // Prefer public rate endpoint which expects { rating, userId }
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/public/${manhwaId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, userId: user.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      ui.onRatingModalClose();

      // Try to read API response and apply optimistic rating override
      const json = await response.json().catch(() => null);
      const optimistic = json?.newAverageRating ?? json?.new_average_rating ?? json?.admin_manhwa?.rating ?? json?.rating ?? null;
      if (optimistic != null && (ui as any).setRatingOverride) {
        (ui as any).setRatingOverride(optimistic);
      }

      // Refetch the manhwa data using the local hook to get authoritative value.
      try {
        if (refetchManhwa) {
          await refetchManhwa();
        } else {
          // Fallback to router.refresh if refetch isn't available
          router.refresh();
        }
      } catch (err) {
      }

      // Clear optimistic override after refetch completes (or after fallback)
      if ((ui as any).setRatingOverride) {
        try { (ui as any).setRatingOverride(null); } catch (_) {}
      }
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
    <>
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
      onRatingModalOpen={handleRatingModalOpen}
      onRatingModalClose={ui.onRatingModalClose}
      onRatingSubmit={handleRatingSubmit}

      // Флаги доступа (на основе авторизации)
      canRate={canRate}
      canComment={canComment}

      // Optimistic client override for rating
      clientRatingOverride={ui.ratingOverride}

      // Ошибки
      error={manhwaError}
    />

    {/* Модалка авторизации при попытке оценить без логина */}
    {showAuthModal && (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px',
        }}
        onClick={() => setShowAuthModal(false)}
      >
        <div
          style={{
            background: '#0a0a0a', border: '1px solid #3a3a3a',
            borderRadius: '12px', padding: '28px', maxWidth: '360px', width: '100%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
            ⭐ Залиште оцінку
          </h2>
          <p style={{ color: '#9a9a9a', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Щоб оцінити мангу, необхідно увійти в акаунт.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setShowAuthModal(false); router.push('/auth'); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #FF1B6D, #A259FF)',
                color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
              }}
            >
              Увійти
            </button>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: '1px solid #3a3a3a', background: 'transparent',
                color: '#9a9a9a', fontSize: '14px', cursor: 'pointer',
              }}
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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