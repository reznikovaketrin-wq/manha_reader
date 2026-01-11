'use client';

import { useState } from 'react';

type TabType = 'info' | 'chapters' | 'comments';

/**
 * useManhwaPageUI - управление UI состояниями страницы
 * 
 * Отвечает за:
 * - Активный таб (info/chapters/comments)
 * - Видимость модального окна рейтинга
 * 
 * НЕ отвечает за:
 * - Загрузку данных
 * - Сетевые запросы
 * - Размер экрана
 */
export function useManhwaPageUI() {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOverride, setRatingOverride] = useState<number | null>(null);

  return {
    // Состояния
    activeTab,
    showRatingModal,
    ratingOverride,

    // Методы для управления состояниями
    onTabChange: (tab: TabType) => setActiveTab(tab),
    onRatingModalOpen: () => setShowRatingModal(true),
    onRatingModalClose: () => setShowRatingModal(false),
    setRatingOverride,
  };
}