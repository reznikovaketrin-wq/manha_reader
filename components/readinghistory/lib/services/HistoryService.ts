import { supabase } from '@/lib/supabase-client';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';
import { SupabaseAdapter } from '../storage/SupabaseAdapter';
import type {
  ReadingProgress,
  ReadingProgressInput,
  HistoryOptions,
  StorageAdapter,
} from '@/components/readinghistory/types/reading-history.types';

const DEBUG = false;

/**
 * HistoryService - основний сервіс для роботи з історією читання
 * 
 * Принципи:
 * - Одна манхва → одне актуальне состояние
 * - Автоматичний вибір джерела (localStorage для гостей, Supabase для авторизованих)
 * - Синхронізація при переході гість → авторизований
 * - Без дублювання та рассинхрону
 */
class HistoryServiceClass {
  private localAdapter: LocalStorageAdapter;
  private supabaseAdapter: SupabaseAdapter;

  constructor() {
    this.localAdapter = new LocalStorageAdapter();
    this.supabaseAdapter = new SupabaseAdapter();
  }

  /**
   * Визначити чи користувач авторизований
   */
  private async isAuthenticated(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getUser();
      return !error && !!data?.user?.id;
    } catch {
      return false;
    }
  }

  /**
   * Отримати активний адаптер залежно від авторизації
   */
  private async getAdapter(): Promise<StorageAdapter> {
    const isAuth = await this.isAuthenticated();
    return isAuth ? this.supabaseAdapter : this.localAdapter;
  }

  /**
   * Зберегти прогрес читання
   * Автоматично визначає джерело (localStorage або Supabase)
   */
  async saveProgress(input: ReadingProgressInput): Promise<void> {
    if (DEBUG) {
      console.log('[HistoryService] saveProgress:', input);
    }

    const progress: ReadingProgress = {
      ...input,
      progressPercent: 0, // Буде перераховано пізніше якщо потрібно
      updatedAt: new Date().toISOString(),
    };

    try {
      const adapter = await this.getAdapter();
      await adapter.saveProgress(progress);

      if (DEBUG) {
        console.log('[HistoryService] ✅ Progress saved');
      }
    } catch (error) {
      console.error('[HistoryService] Error saving progress:', error);
      
      // Fallback на localStorage при помилці Supabase
      if (await this.isAuthenticated()) {
        await this.localAdapter.saveProgress(progress);
      }
    }
  }

  /**
   * Отримати прогрес для конкретної манхви
   */
  async getProgress(manhwaId: string): Promise<ReadingProgress | null> {
    try {
      const adapter = await this.getAdapter();
      return await adapter.getProgress(manhwaId);
    } catch (error) {
      console.error('[HistoryService] Error getting progress:', error);
      return null;
    }
  }

  /**
   * Отримати список останніх манхв
   * Без дублікатів - тільки остання для кожної манхви
   */
  async getRecentList(limit: number = 5): Promise<ReadingProgress[]> {
    try {
      const adapter = await this.getAdapter();
      const list = await adapter.getRecentList(limit * 2); // Беремо більше для дедуплікації

      // Дедуплікація: залишаємо тільки останній запис для кожної манхви
      const uniqueMap = new Map<string, ReadingProgress>();

      list.forEach(item => {
        const existing = uniqueMap.get(item.manhwaId);
        if (
          !existing ||
          new Date(item.updatedAt) > new Date(existing.updatedAt)
        ) {
          uniqueMap.set(item.manhwaId, item);
        }
      });

      // Сортуємо за датою та обмежуємо
      return Array.from(uniqueMap.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('[HistoryService] Error getting recent list:', error);
      return [];
    }
  }

  /**
   * Отримати повну історію
   * Підтримує пошук, сортування, фільтрацію
   */
  async getFullHistory(options?: HistoryOptions): Promise<ReadingProgress[]> {
    try {
      const adapter = await this.getAdapter();
      let history = await adapter.getAllProgress();

      // Дедуплікація
      const uniqueMap = new Map<string, ReadingProgress>();
      history.forEach(item => {
        const existing = uniqueMap.get(item.manhwaId);
        if (
          !existing ||
          new Date(item.updatedAt) > new Date(existing.updatedAt)
        ) {
          uniqueMap.set(item.manhwaId, item);
        }
      });

      history = Array.from(uniqueMap.values());

      // TODO: Додати пошук, фільтрацію коли буде метадата
      
      // Сортування
      if (options?.sort === 'progress') {
        history.sort((a, b) => b.progressPercent - a.progressPercent);
      } else {
        // За замовчуванням за датою
        history.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }

      // Ліміт
      if (options?.limit) {
        history = history.slice(0, options.limit);
      }

      return history;
    } catch (error) {
      console.error('[HistoryService] Error getting full history:', error);
      return [];
    }
  }

  /**
   * Синхронізація даних гостя при авторизації
   * Об'єднує localStorage та Supabase, зберігає найновіші дані
   */
  async syncGuestToUser(): Promise<void> {
    if (DEBUG) {
      console.log('[HistoryService] Starting guest to user sync');
    }

    try {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        console.warn('[HistoryService] Cannot sync - user not authenticated');
        return;
      }

      // Отримуємо локальні дані
      const localData = await this.localAdapter.getAllProgress();
      
      if (localData.length === 0) {
        if (DEBUG) {
          console.log('[HistoryService] No local data to sync');
        }
        return;
      }

      // Об'єднуємо з Supabase
      const result = await this.supabaseAdapter.mergeProgress(localData);

      if (DEBUG) {
        console.log('[HistoryService] Sync completed:', {
          merged: result.merged.length,
          localCleared: result.localCleared,
        });
      }

      // Очищуємо локальні дані після успішної синхронізації
      await this.localAdapter.clearAll();
    } catch (error) {
      console.error('[HistoryService] Error during sync:', error);
    }
  }

  /**
   * Очистити історію для конкретної манхви
   */
  async clearProgress(manhwaId: string): Promise<void> {
    try {
      const adapter = await this.getAdapter();
      await adapter.clearProgress(manhwaId);
    } catch (error) {
      console.error('[HistoryService] Error clearing progress:', error);
    }
  }

  /**
   * Очистити всю історію
   */
  async clearAll(): Promise<void> {
    try {
      const adapter = await this.getAdapter();
      await adapter.clearAll();
    } catch (error) {
      console.error('[HistoryService] Error clearing all:', error);
    }
  }

  /**
   * Розрахувати прогрес у відсотках
   * TODO: Реалізувати коли буде метадата про кількість глав/сторінок
   */
  calculateProgress(
    chapterId: string,
    pageNumber: number,
    totalChapters: number,
    totalPages: number
  ): number {
    // Placeholder - потрібна додаткова інформація про структуру манхви
    return 0;
  }
}

// Singleton instance
export const HistoryService = new HistoryServiceClass();