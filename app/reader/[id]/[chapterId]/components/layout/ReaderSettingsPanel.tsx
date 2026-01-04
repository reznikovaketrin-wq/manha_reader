'use client';

import { memo } from 'react';
import type { WidthMode } from '../../hooks/useReaderUI';

interface ReaderSettingsPanelProps {
  visible: boolean;
  brightness: number;
  widthMode: WidthMode;
  isFullscreen: boolean;
  autoScrollSpeed: number;
  autoScrollActive: boolean;
  onBrightnessChange: (value: number) => void;
  onReset: () => void;
  onWidthModeChange: (mode: WidthMode) => void;
  onToggleFullscreen: () => void;
  onAutoScrollSpeedChange: (speed: number) => void;
  onToggleAutoScroll: () => void;
}

const WIDTH_MODE_OPTIONS: { value: WidthMode; label: string; icon: string }[] = [
  { value: 'fit', label: 'На всю ширину', icon: '⬜' },
  { value: 'fixed', label: 'Комфортна (720px)', icon: '📖' },
  { value: 'original', label: 'Оригінал', icon: '🖼️' },
];

/**
 * ReaderSettingsPanel - Settings with width mode & fullscreen
 */
export const ReaderSettingsPanel = memo(function ReaderSettingsPanel({
  visible,
  brightness,
  widthMode,
  isFullscreen,
  autoScrollSpeed,
  autoScrollActive,
  onBrightnessChange,
  onReset,
  onWidthModeChange,
  onToggleFullscreen,
  onAutoScrollSpeedChange,
  onToggleAutoScroll,
}: ReaderSettingsPanelProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed right-0 top-12 md:top-14 bottom-16 md:bottom-14 z-40 
                 bg-gray-900/95 backdrop-blur-sm border-l border-gray-800 
                 overflow-y-auto w-72 md:w-80 max-w-[85vw]"
    >
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Налаштування
        </h3>

        {/* === Brightness === */}
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Яскравість
            </span>
            <span className="text-xs text-gray-400 tabular-nums bg-gray-800 px-2 py-0.5 rounded">
              {brightness}%
            </span>
          </label>

          <input
            type="range"
            min={10}
            max={200}
            value={brightness}
            onChange={(e) => onBrightnessChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:bg-blue-500
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:border-2
                       [&::-webkit-slider-thumb]:border-white"
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>Темно</span>
            <button 
              onClick={onReset}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Скинути
            </button>
            <span>Яскраво</span>
          </div>
        </div>

        {/* === Divider === */}
        <hr className="border-gray-700" />

        {/* === Auto Scroll === */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Автопрокрутка
            </label>
            
            {/* Toggle switch */}
            <button
              onClick={onToggleAutoScroll}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${autoScrollActive ? 'bg-blue-600' : 'bg-gray-700'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full 
                  transition-transform shadow-sm
                  ${autoScrollActive ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Speed slider - only show when auto scroll is available */}
          <div className={autoScrollActive ? 'opacity-100' : 'opacity-50'}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Швидкість</span>
              <span className="text-xs text-gray-400 tabular-nums bg-gray-800 px-2 py-0.5 rounded">
                {autoScrollSpeed}%
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={100}
              value={autoScrollSpeed}
              onChange={(e) => onAutoScrollSpeedChange(Number(e.target.value))}
              disabled={!autoScrollActive}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                         disabled:cursor-not-allowed
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:bg-blue-500
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-white
                         disabled:[&::-webkit-slider-thumb]:bg-gray-500"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>🐢 Повільно</span>
              <span>Швидко 🐇</span>
            </div>
          </div>
        </div>

        {/* === Divider === */}
        <hr className="border-gray-700" />

        {/* === Width Mode === */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Ширина сторінки
          </label>

          <div className="space-y-2">
            {WIDTH_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onWidthModeChange(option.value)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
                  transition-all text-left text-sm
                  ${widthMode === option.value 
                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400' 
                    : 'bg-gray-800 border border-transparent hover:bg-gray-700 text-gray-300'
                  }
                `}
              >
                <span className="text-base">{option.icon}</span>
                <span>{option.label}</span>
                {widthMode === option.value && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* === Divider === */}
        <hr className="border-gray-700" />

        {/* === Fullscreen === */}
        <div>
          <button
            onClick={onToggleFullscreen}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
              transition-all text-left text-sm
              ${isFullscreen 
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400' 
                : 'bg-gray-800 border border-transparent hover:bg-gray-700 text-gray-300'
              }
            `}
          >
            {isFullscreen ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 9L4 4m0 0v4m0-4h4m6 0l5-5m0 0v4m0-4h-4m-6 16l-5 5m0 0v-4m0 4h4m6 0l5 5m0 0v-4m0 4h-4" />
                </svg>
                <span>Вийти з повноекранного</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>Повноекранний режим</span>
              </>
            )}
          </button>
        </div>

        {/* === Divider === */}
        <hr className="border-gray-700" />

        {/* === Hotkeys === */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium mb-2">Гарячі клавіші</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Esc</kbd>
              <span>Інтерфейс</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">F</kbd>
              <span>Fullscreen</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">←→</kbd>
              <span>Навігація</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Space</kbd>
              <span>Далі</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ReaderSettingsPanel.displayName = 'ReaderSettingsPanel';