import { supabase, saveReadingProgress as saveToSupabase } from './supabase';

interface ReadingHistory {
  manhwaId: string;
  chapterId: string;
  pageNumber: number;
  timestamp: string;
}

const READING_HISTORY_KEY = 'reading-history';

// ===== LOCALSTORAGE FUNCTIONS =====

function getAllHistory(): ReadingHistory[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(READING_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(history: ReadingHistory[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// ===== PUBLIC FUNCTIONS =====

export async function saveReadingProgress(
  manhwaId: string,
  chapterId: string,
  pageNumber: number
): Promise<void> {
  try {
    // Спробувати отримати поточного користувача
    const { data } = await supabase.auth.getUser();

    if (data?.user?.id) {
      // Користувач авторизований - зберегти в Supabase
      await saveToSupabase(data.user.id, manhwaId, chapterId, pageNumber);
    } else {
      // Користувач не авторизований - зберегти в localStorage
      const history = getAllHistory();
      const existingIndex = history.findIndex(
        h => h.manhwaId === manhwaId && h.chapterId === chapterId
      );

      const newEntry: ReadingHistory = {
        manhwaId,
        chapterId,
        pageNumber,
        timestamp: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        history[existingIndex] = newEntry;
      } else {
        history.unshift(newEntry);
      }

      saveToLocalStorage(history);
    }
  } catch (error) {
    console.error('Error saving reading progress:', error);
    // Fallback до localStorage при ошибке
    const history = getAllHistory();
    const existingIndex = history.findIndex(
      h => h.manhwaId === manhwaId && h.chapterId === chapterId
    );

    const newEntry: ReadingHistory = {
      manhwaId,
      chapterId,
      pageNumber,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      history[existingIndex] = newEntry;
    } else {
      history.unshift(newEntry);
    }

    saveToLocalStorage(history);
  }
}

export function getRecentHistory(limit: number = 10): ReadingHistory[] {
  try {
    const history = getAllHistory();
    return history.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent history:', error);
    return [];
  }
}

export function getHistoryForManhwa(manhwaId: string): ReadingHistory[] {
  try {
    const history = getAllHistory();
    return history.filter(h => h.manhwaId === manhwaId);
  } catch (error) {
    console.error('Error getting history for manhwa:', error);
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(READING_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

export function removeFromHistory(manhwaId: string, chapterId: string): void {
  try {
    const history = getAllHistory();
    const filtered = history.filter(
      h => !(h.manhwaId === manhwaId && h.chapterId === chapterId)
    );
    saveToLocalStorage(filtered);
  } catch (error) {
    console.error('Error removing from history:', error);
  }
}