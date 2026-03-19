/**
 * 📁 components/AddToListButton/AddToListButton.tsx
 * Кнопка "Додати в список" з випадаючим меню статусів
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/app/providers/UserProvider';
import { upsertManhwaToLibrary, removeManhwaFromLibrary, getManhwaStatus } from '@/lib/library-actions';
import {
  ManhwaLibraryStatus,
  MANHWA_STATUS_LABELS,
} from '@/lib/library-types';
import styles from './AddToListButton.module.css';

interface AddToListButtonProps {
  manhwaId: string;
  currentStatus?: ManhwaLibraryStatus | null;
  onStatusChange?: (newStatus: ManhwaLibraryStatus | null) => void;
}

export function AddToListButton({
  manhwaId,
  currentStatus,
  onStatusChange,
}: AddToListButtonProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ManhwaLibraryStatus | null>(
    currentStatus ?? null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Завантажуємо реальний статус з БД при монтуванні
  useEffect(() => {
    if (!user) return;
    // якщо статус вже передано з пропсів — не перезавантажуємо
    if (currentStatus !== undefined) return;
    getManhwaStatus(manhwaId).then((status) => {
      setSelectedStatus(status);
    });
  }, [manhwaId, user, currentStatus]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрити меню при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStatusSelect = async (status: ManhwaLibraryStatus) => {
    if (!user) {
      // Перенаправити на авторизацію
      window.location.href = '/auth';
      return;
    }

    setIsLoading(true);
    setIsOpen(false);

    // Оптимістичне оновлення UI
    const previousStatus = selectedStatus;
    setSelectedStatus(status);

    try {
      const result = await upsertManhwaToLibrary(manhwaId, status);

      if (!result.success) {
        // Відкатити зміни при помилці
        setSelectedStatus(previousStatus);
        setToastMessage('Помилка: ' + (result.error || 'Невідома помилка'));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage(`Додано до "${MANHWA_STATUS_LABELS[status]}"`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        onStatusChange?.(status);
      }
    } catch (error) {
      // Відкатити зміни при помилці
      setSelectedStatus(previousStatus);
      setToastMessage('Помилка підключення');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;

    setIsLoading(true);
    setIsOpen(false);

    const previousStatus = selectedStatus;
    setSelectedStatus(null);

    try {
      const result = await removeManhwaFromLibrary(manhwaId);

      if (!result.success) {
        setSelectedStatus(previousStatus);
        setToastMessage('Помилка: ' + (result.error || 'Невідома помилка'));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
      setToastMessage('Видалено з обраних');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        onStatusChange?.(null);
      }
    } catch (error) {
      setSelectedStatus(previousStatus);
      setToastMessage('Помилка підключення');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const allStatuses: ManhwaLibraryStatus[] = [
    'reading',
    'planned',
    'completed',
    'rereading',
    'postponed',
    'dropped',
  ];

  return (
    <div className={styles.container} ref={menuRef}>
      {/* Кнопка */}
      <button
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {selectedStatus ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          )}
        </svg>
        {selectedStatus ? MANHWA_STATUS_LABELS[selectedStatus] : 'Додати в обране'}
      </button>

      {/* Випадаюче меню */}
      {isOpen && (
        <div className={styles.menu}>
          {allStatuses.map((status) => (
            <button
              key={status}
              className={`${styles.menuItem} ${
                selectedStatus === status ? styles.menuItemActive : ''
              }`}
              onClick={() => handleStatusSelect(status)}
            >
              <span className={styles.menuItemLabel}>{MANHWA_STATUS_LABELS[status]}</span>
              {selectedStatus === status && (
                <svg className={styles.checkIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}

          {/* Кнопка видалення (якщо вже додано) */}
          {selectedStatus && (
            <>
              <div className={styles.divider} />
              <button className={styles.menuItemRemove} onClick={handleRemove}>
                <svg className={styles.removeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Видалити з обраних
              </button>
            </>
          )}
        </div>
      )}

      {/* Toast повідомлення */}
      {showToast && <div className={styles.toast}>{toastMessage}</div>}
    </div>
  );
}
