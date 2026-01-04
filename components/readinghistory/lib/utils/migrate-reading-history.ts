/**
 * Міграція історії читання зі старого формату в новий
 * 
 * Старий формат: масив записів в localStorage['reading-history']
 * Новий формат: об'єкт {manhwaId: ReadingProgress} в localStorage['triw_reading_history']
 */

interface OldReadingHistory {
  manhwaId: string;
  chapterId: string;
  pageNumber: number;
  timestamp: string;
}

interface NewReadingProgress {
  manhwaId: string;
  chapterId: string;
  pageNumber: number;
  progressPercent: number;
  updatedAt: string;
}

const OLD_KEY = 'reading-history';
const NEW_KEY = 'triw_reading_history';

export function migrateReadingHistory(): {
  migrated: number;
  skipped: number;
  error: string | null;
} {
  if (typeof window === 'undefined') {
    return { migrated: 0, skipped: 0, error: 'Not in browser' };
  }

  try {
    // Перевіряємо чи вже є нові дані
    const existingNew = localStorage.getItem(NEW_KEY);
    if (existingNew) {
      console.log('[Migration] New format already exists, skipping migration');
      return { migrated: 0, skipped: 0, error: null };
    }

    // Читаємо старі дані
    const oldData = localStorage.getItem(OLD_KEY);
    if (!oldData) {
      console.log('[Migration] No old data found');
      return { migrated: 0, skipped: 0, error: null };
    }

    const oldHistory: OldReadingHistory[] = JSON.parse(oldData);
    const newHistory: Record<string, NewReadingProgress> = {};
    let migrated = 0;
    let skipped = 0;

    // Конвертуємо в новий формат
    // Залишаємо тільки останній запис для кожної манхви
    oldHistory.forEach((item) => {
      const existing = newHistory[item.manhwaId];
      
      if (
        !existing ||
        new Date(item.timestamp) > new Date(existing.updatedAt)
      ) {
        newHistory[item.manhwaId] = {
          manhwaId: item.manhwaId,
          chapterId: item.chapterId,
          pageNumber: item.pageNumber,
          progressPercent: 0,
          updatedAt: item.timestamp,
        };
        migrated++;
      } else {
        skipped++;
      }
    });

    // Зберігаємо в новому форматі
    localStorage.setItem(NEW_KEY, JSON.stringify(newHistory));

    console.log('[Migration] ✅ Migration completed:', {
      migrated,
      skipped,
      total: oldHistory.length,
    });

    return { migrated, skipped, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Migration] Error during migration:', error);
    return { migrated: 0, skipped: 0, error: errorMsg };
  }
}

/**
 * Перевірити чи потрібна міграція
 */
export function needsMigration(): boolean {
  if (typeof window === 'undefined') return false;

  const hasOld = !!localStorage.getItem(OLD_KEY);
  const hasNew = !!localStorage.getItem(NEW_KEY);

  return hasOld && !hasNew;
}

/**
 * Видалити старі дані після успішної міграції
 */
export function cleanupOldData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(OLD_KEY);
    console.log('[Migration] Old data cleaned up');
  } catch (error) {
    console.error('[Migration] Error cleaning up old data:', error);
  }
}