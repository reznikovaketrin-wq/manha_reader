'use client';

import { memo, useState, useEffect } from 'react';
import styles from './RatingModal.module.css';

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
  currentRating?: number;
}

/**
 * RatingModal - ПОЛНОСТЬЮ ФУНКЦИОНАЛЬНЫЙ
 * ✅ Правильное позиционирование
 * ✅ Правильная логика
 * ✅ Все работает
 */
export const RatingModal = memo(function RatingModal({
  open,
  onClose,
  onSubmit,
  currentRating = 0,
}: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================
  // СИНХРОНИЗИРУЕМ состояние с пропсами
  // ============================================
  useEffect(() => {
    if (open) {
      // Когда открываем модалку - устанавливаем текущую оценку
      setSelectedRating(currentRating);
    }
  }, [open, currentRating]);

  if (!open) return null;

  // ============================================
  // ОБРАБОТЧИК ОТПРАВКИ
  // ============================================
  const handleSubmit = async () => {
    if (selectedRating === 0) {
      alert('Виберіть оцінку!');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('📤 Отправляю оценку:', selectedRating);
      
      // Вызываем callback из родителя
      await onSubmit(selectedRating);
      
      console.log('✅ Оценка отправлена успешно');
      
      // Закрываем модалку
      onClose();
      
      // Сбрасываем состояние
      setSelectedRating(0);
    } catch (error) {
      console.error('❌ Ошибка при отправке оценки:', error);
      alert('Помилка при збереженні оцінки. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // ОБРАБОТЧИК ЗАКРЫТИЯ
  // ============================================
  const handleClose = () => {
    if (!isSubmitting) {
      console.log('🚪 Закрываю модалку');
      setSelectedRating(0);
      onClose();
    }
  };

  // ============================================
  // КЛИК НА BACKDROP (но НЕ на модальное окно)
  // ============================================
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Если клик на backdrop (а не на modal) - закрываем
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      {/* ============================================
          BACKDROP - полностью закрывает экран
          ============================================ */}
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999, // ✅ ОЧЕНЬ ВЫСОКИЙ z-index
        }}
      >
        {/* ============================================
            MODAL - центрирован
            ============================================ */}
        <div
          className={styles.modal}
          style={{
            position: 'relative', // ✅ НЕ используем absolute внутри backdrop
            zIndex: 10000, // ✅ Выше чем backdrop
          }}
        >
          {/* HEADER */}
          <div className={styles.header}>
            <h2 className={styles.title}>Оцініть цю манхву</h2>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              disabled={isSubmitting}
              title="Закрити"
            >
              ✕
            </button>
          </div>

          {/* RATING STARS - 10 звезд */}
          <div className={styles.ratingContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                className={`${styles.star} ${
                  star <= selectedRating ? styles.starActive : ''
                }`}
                onClick={() => {
                  console.log('⭐ Выбрана звезда:', star);
                  setSelectedRating(star);
                }}
                disabled={isSubmitting}
                title={`${star} зірок`}
              >
                {star}
              </button>
            ))}
          </div>

          {/* CURRENT RATING DISPLAY */}
          {selectedRating > 0 && (
            <div className={styles.selectedRating}>
              Ваша оцінка: <span>{selectedRating}/10</span>
            </div>
          )}

          {/* FOOTER BUTTONS */}
          <div className={styles.footer}>
            <button
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Скасувати
            </button>
            <button
              className={`${styles.submitButton} ${
                selectedRating === 0 ? styles.submitButtonDisabled : ''
              }`}
              onClick={handleSubmit}
              disabled={selectedRating === 0 || isSubmitting}
              title={
                selectedRating === 0
                  ? 'Виберіть оцінку спочатку'
                  : 'Зберегти оцінку'
              }
            >
              {isSubmitting ? 'Збереження...' : 'Зберегти оцінку'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

RatingModal.displayName = 'RatingModal';

export default RatingModal;