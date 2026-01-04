    'use client';

import { memo } from 'react';
import styles from './MobileTabs.module.css';

type TabType = 'info' | 'chapters' | 'comments';

interface MobileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  chaptersCount?: number;
}

/**
 * MobileTabs - мобильная навигация по табам
 * 
 * Отвечает только за UI переключения табов
 * Не содержит логики отображения контента
 */
export const MobileTabs = memo(function MobileTabs({
  activeTab,
  onTabChange,
  chaptersCount = 0,
}: MobileTabsProps) {
  const tabs: Array<{ id: TabType; label: string; icon: string; badge?: number }> = [
    { id: 'info', label: 'Інформація', icon: '📋' },
    { id: 'chapters', label: 'Розділи', icon: '📖', badge: chaptersCount },
    { id: 'comments', label: 'Коментарі', icon: '💬' },
  ];

  return (
    <div className={styles.tabsContainer}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${
            activeTab === tab.id ? styles.tabActive : ''
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className={styles.badge}>{tab.badge}</span>
          )}
        </button>
      ))}

      {/* Indic indicator */}
      <div className={styles.indicator} />
    </div>
  );
});

interface MobileTabContentProps {
  activeTab: TabType;
  children: {
    info: React.ReactNode;
    chapters: React.ReactNode;
    comments: React.ReactNode;
  };
}

/**
 * MobileTabContent - вспомогательный компонент для отображения контента таба
 */
export const MobileTabContent = memo(function MobileTabContent({
  activeTab,
  children,
}: MobileTabContentProps) {
  return (
    <div className={styles.contentWrapper}>
      {/* Info Tab */}
      <div
        className={`${styles.tabContent} ${
          activeTab === 'info' ? styles.tabContentActive : ''
        }`}
      >
        {children.info}
      </div>

      {/* Chapters Tab */}
      <div
        className={`${styles.tabContent} ${
          activeTab === 'chapters' ? styles.tabContentActive : ''
        }`}
      >
        {children.chapters}
      </div>

      {/* Comments Tab */}
      <div
        className={`${styles.tabContent} ${
          activeTab === 'comments' ? styles.tabContentActive : ''
        }`}
      >
        {children.comments}
      </div>
    </div>
  );
});