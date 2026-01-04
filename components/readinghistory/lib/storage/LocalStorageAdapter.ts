import type { ReadingProgress, StorageAdapter } from '@/components/readinghistory/types/reading-history.types';
const STORAGE_KEY = 'triw_reading_history';
const TTL_DAYS = 30;
const MAX_ITEMS = 50;

/**
 * LocalStorageAdapter - адаптер для роботи з localStorage
 * Зберігає прогрес читання для гостей
 */
export class LocalStorageAdapter implements StorageAdapter {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getAll(): Map<string, ReadingProgress> {
    if (!this.isClient()) return new Map();

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return new Map();

      const parsed = JSON.parse(data);
      const map = new Map<string, ReadingProgress>();
      const now = Date.now();
      const ttl = TTL_DAYS * 24 * 60 * 60 * 1000;

      Object.entries(parsed).forEach(([manhwaId, progress]) => {
        const prog = progress as ReadingProgress;
        const updatedTime = new Date(prog.updatedAt).getTime();

        if (now - updatedTime < ttl) {
          map.set(manhwaId, prog);
        }
      });

      return map;
    } catch (error) {
      console.error('[LocalStorageAdapter] Error reading storage:', error);
      return new Map();
    }
  }

  private saveAll(map: Map<string, ReadingProgress>): void {
    if (!this.isClient()) return;

    try {
      const obj = Object.fromEntries(map);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('[LocalStorageAdapter] Error saving storage:', error);
    }
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    const map = this.getAll();
    map.set(progress.manhwaId, progress);

    // Обмежуємо кількість записів
    if (map.size > MAX_ITEMS) {
      const sorted = Array.from(map.entries()).sort(
        (a, b) => new Date(b[1].updatedAt).getTime() - new Date(a[1].updatedAt).getTime()
      );
      const limited = new Map(sorted.slice(0, MAX_ITEMS));
      this.saveAll(limited);
    } else {
      this.saveAll(map);
    }
  }

  async getProgress(manhwaId: string): Promise<ReadingProgress | null> {
    const map = this.getAll();
    return map.get(manhwaId) || null;
  }

  async getRecentList(limit: number): Promise<ReadingProgress[]> {
    const map = this.getAll();
    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return sorted.slice(0, limit);
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    const map = this.getAll();
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async clearProgress(manhwaId: string): Promise<void> {
    const map = this.getAll();
    map.delete(manhwaId);
    this.saveAll(map);
  }

  async clearAll(): Promise<void> {
    if (!this.isClient()) return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error clearing storage:', error);
    }
  }

  /**
   * Позначити всі записи як синхронізовані (для видалення після злиття)
   */
  async markAsSynced(): Promise<void> {
    await this.clearAll();
  }
}