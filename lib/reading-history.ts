import { ReadingHistory } from '@/types/manhwa';

const STORAGE_KEY = 'manhwa-reading-history';

// Отримати всю історію
export function getReadingHistory(): ReadingHistory[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Зберегти прогрес читання
export function saveReadingProgress(
  manhwaId: string,
  chapterId: string,
  pageNumber: number
): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getReadingHistory();
    const existingIndex = history.findIndex(h => h.manhwaId === manhwaId);

    const newEntry: ReadingHistory = {
      manhwaId,
      chapterId,
      pageNumber,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Оновити існуючий запис
      history[existingIndex] = newEntry;
    } else {
      // Додати новий запис
      history.unshift(newEntry);
    }

    // Зберігати максимум 50 записів
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save reading progress:', error);
  }
}

// Отримати прогрес для конкретної манхви
export function getReadingProgressForManhwa(manhwaId: string): ReadingHistory | null {
  const history = getReadingHistory();
  return history.find(h => h.manhwaId === manhwaId) || null;
}

// Видалити запис з історії
export function removeFromHistory(manhwaId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getReadingHistory();
    const filtered = history.filter(h => h.manhwaId !== manhwaId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from history:', error);
  }
}

// Очистити всю історію
export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Отримати останні N записів
export function getRecentHistory(limit: number = 10): ReadingHistory[] {
  const history = getReadingHistory();
  return history.slice(0, limit);
}
