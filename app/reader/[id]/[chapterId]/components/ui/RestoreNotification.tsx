import { useEffect, useState } from 'react';

interface RestoreNotificationProps {
  visible: boolean;
  targetPage: number;
  onRetry: () => void;
  onDismiss: () => void;
}

/**
 * RestoreNotification - показывает уведомление при неудаче восстановления страницы
 */
export function RestoreNotification({ 
  visible, 
  targetPage, 
  onRetry, 
  onDismiss 
}: RestoreNotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      // Delay hide for fade-out animation
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div 
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 min-w-[320px]">
        <div className="flex-1">
          <p className="text-sm text-white font-medium">
            Не удалось восстановить страницу {targetPage}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Попробуйте ещё раз или продолжите чтение с начала главы
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            Повторить
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
