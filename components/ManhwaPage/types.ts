'use client';

/**
 * ManhwaPage Types - переиспользуем реальные domain типы
 * 
 * ❌ НЕ создаем дубликаты типов
 * ✅ Импортируем из /types/domain/
 */

import type { Manhwa, ManhwaDetail } from '@/types/domain/Manhwa';
import type { Chapter } from '@/types/domain/chapter';
import { AppError } from './errors/AppError';

// ============================================
// ПЕРЕИСПОЛЬЗУЕМ реальные типы
// ============================================

export type { Manhwa, ManhwaDetail, Chapter };

// ============================================
// UI ТИПЫ (только специфичные для ManhwaPage)
// ============================================

export type MobileTab = 'info' | 'chapters' | 'comments';

// ============================================
// PROPS ИНТЕРФЕЙСЫ
// ============================================

/**
 * Props для ManhwaPage компонента
 * ВСЕ данные передаются через props (чистый UI компонент)
 */
export interface ManhwaPageProps {
  // Данные
  manhwaId: string;
  manhwa: Manhwa;  // ✅ Реальный тип из domain
  filteredChapters: Chapter[];  // ✅ Реальный тип из domain

  // Состояния UI
  isMobile: boolean;
  activeTab: MobileTab;
  showRatingModal: boolean;

  // Коллбеки
  onTabChange: (tab: MobileTab) => void;
  onRatingModalOpen: () => void;
  onRatingModalClose: () => void;
  onRatingSubmit: (rating: number) => Promise<void>;

  // Флаги доступа
  canRate?: boolean;
  canComment?: boolean;

  // Optional optimistic override for displayed average rating
  clientRatingOverride?: number | null;

  // Состояния загрузки
  loading?: boolean;
  error?: AppError | null;
}

/**
 * Props для View компонентов (DesktopView / MobileView)
 * Подмножество ManhwaPageProps
 */
export interface ViewProps {
  manhwaId: string;
  manhwa: Manhwa;  // ✅ Реальный тип
  filteredChapters: Chapter[];  // ✅ Реальный тип
  canRate?: boolean;
  canComment?: boolean;
  onRatingModalOpen: () => void;
  // Поля для прогресса чтения
  firstChapterId?: string;
  firstChapterPage?: number | null;
  readChapters?: Set<string>;
  archivedRanges?: Array<{ s: number; e: number }>;
  hasProgress?: boolean;
}

/**
 * Props для MobileView (добавляются tab-related props)
 */
export interface MobileViewProps extends ViewProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}