'use client';

import { useState } from 'react';

interface ReaderSettingsProps {
  brightness: number;
  containerWidth: number;
  readingMode: 'VERTICAL' | 'HORIZONTAL';
  theme: 'dark' | 'light' | 'auto';
  autoScrollSpeed: number;
  fullscreenMode: boolean;
  continuousReading: boolean;
  showPageNumbers: boolean;
  onBrightnessChange: (value: number) => void;
  onContainerWidthChange: (value: number) => void;
  onReadingModeChange: (mode: 'VERTICAL' | 'HORIZONTAL') => void;
  onThemeChange: (theme: 'dark' | 'light' | 'auto') => void;
  onAutoScrollSpeedChange: (value: number) => void;
  onFullscreenToggle: () => void;
  onContinuousReadingToggle: () => void;
  onShowPageNumbersToggle: () => void;
  onReset: () => void;
}

export default function ReaderSettings({
  brightness,
  containerWidth,
  readingMode,
  theme,
  autoScrollSpeed,
  fullscreenMode,
  continuousReading,
  showPageNumbers,
  onBrightnessChange,
  onContainerWidthChange,
  onReadingModeChange,
  onThemeChange,
  onAutoScrollSpeedChange,
  onFullscreenToggle,
  onContinuousReadingToggle,
  onShowPageNumbersToggle,
  onReset,
}: ReaderSettingsProps) {
  const [expanded, setExpanded] = useState(false);

  const getSpeedLabel = (value: number) => {
    const labels = ['Очень медленно', 'Медленно', 'Нормально', 'Быстро', 'Очень быстро'];
    return labels[Math.floor((value - 1) / 2)] || 'Нормально';
  };

  return (
    <div className={`fixed right-0 top-0 bottom-0 w-80 bg-card-bg border-l border-text-muted/20 z-40 transform transition-transform duration-300 ${
      expanded ? 'translate-x-0' : 'translate-x-full'
    } overflow-y-auto`}>
      {/* Header */}
      <div className="sticky top-0 bg-card-bg border-b border-text-muted/20 p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-main">Настройки</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-2 hover:bg-card-hover rounded-lg transition-colors text-text-muted hover:text-text-main"
            title="Сбросить"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="p-2 hover:bg-card-hover rounded-lg transition-colors text-text-muted hover:text-text-main"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Режим чтения */}
        <div>
          <h4 className="text-sm font-medium text-text-main mb-3">Режим чтения</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg cursor-pointer hover:bg-bg-primary/80 transition-colors">
              <input
                type="radio"
                checked={readingMode === 'VERTICAL'}
                onChange={() => onReadingModeChange('VERTICAL')}
                className="w-4 h-4"
              />
              <span className="text-text-main text-sm">Вертикальный скролл</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg cursor-pointer hover:bg-bg-primary/80 transition-colors">
              <input
                type="radio"
                checked={readingMode === 'HORIZONTAL'}
                onChange={() => onReadingModeChange('HORIZONTAL')}
                className="w-4 h-4"
              />
              <span className="text-text-main text-sm">Горизонтальное листание</span>
            </label>
          </div>
        </div>

        {/* Тема */}
        <div>
          <h4 className="text-sm font-medium text-text-main mb-3">Тема</h4>
          <div className="space-y-2">
            {['dark', 'light', 'auto'].map((t) => (
              <label key={t} className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg cursor-pointer hover:bg-bg-primary/80 transition-colors">
                <input
                  type="radio"
                  checked={theme === t}
                  onChange={() => onThemeChange(t as any)}
                  className="w-4 h-4"
                />
                <span className="text-text-main text-sm">
                  {t === 'dark' ? 'Тёмная' : t === 'light' ? 'Светлая' : 'Системная'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Яркость */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-text-main">Яркость изображений</h4>
            <span className="text-sm text-text-muted">{brightness}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            value={brightness}
            onChange={(e) => onBrightnessChange(Number(e.target.value))}
            className="w-full h-2 bg-card-hover rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Размер контейнера */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-text-main">Ширина контейнера</h4>
            <span className="text-sm text-text-muted">{containerWidth}px</span>
          </div>
          <input
            type="range"
            min="600"
            max="1400"
            step="10"
            value={containerWidth}
            onChange={(e) => onContainerWidthChange(Number(e.target.value))}
            className="w-full h-2 bg-card-hover rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Автопрокрутка */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-text-main">Скорость автопрокрутки</h4>
            <span className="text-sm text-text-muted">{getSpeedLabel(autoScrollSpeed)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={autoScrollSpeed}
            onChange={(e) => onAutoScrollSpeedChange(Number(e.target.value))}
            className="w-full h-2 bg-card-hover rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Переключатели */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg cursor-pointer hover:bg-bg-primary/80 transition-colors">
            <input
              type="checkbox"
              checked={continuousReading}
              onChange={onContinuousReadingToggle}
              className="w-4 h-4"
            />
            <span className="text-text-main text-sm">Все главы подряд</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg cursor-pointer hover:bg-bg-primary/80 transition-colors">
            <input
              type="checkbox"
              checked={fullscreenMode}
              onChange={onFullscreenToggle}
              className="w-4 h-4"
            />
            <span className="text-text-main text-sm">Полноэкранный режим</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg cursor-pointer hover:bg-bg-primary/80 transition-colors">
            <input
              type="checkbox"
              checked={showPageNumbers}
              onChange={onShowPageNumbersToggle}
              className="w-4 h-4"
            />
            <span className="text-text-main text-sm">Показывать номера страниц</span>
          </label>
        </div>
      </div>

      {/* Toggle button (when collapsed) */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-l-lg transition-colors z-41"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      )}
    </div>
  );
}