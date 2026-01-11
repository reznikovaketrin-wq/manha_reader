import { supabase } from '@/lib/supabase-client';
import { authService } from '@/features/auth/services/AuthService';
import type { ReadingProgress, StorageAdapter, MergeResult } from '@/components/readinghistory/types/reading-history.types';

/**
 * SupabaseAdapter - адаптер для роботи з Supabase
 * Зберігає прогрес читання для авторизованих користувачів
 */
export class SupabaseAdapter implements StorageAdapter {
  private async getUserId(): Promise<string | null> {
    try {
      const session = await authService.getSession();
      return session?.user?.id || null;
    } catch {
      return null;
    }
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase.from('reading_history').upsert(
      {
        user_id: userId,
        manhwa_id: progress.manhwaId,
        chapter_id: progress.chapterId,
        page_number: progress.pageNumber,
        progress_percent: progress.progressPercent,
        timestamp: progress.updatedAt,
      },
      {
        onConflict: 'user_id,manhwa_id',
      }
    );

    if (error) {
      console.error('[SupabaseAdapter] Error saving progress:', error);
      throw error;
    }
  }

  async getProgress(manhwaId: string): Promise<ReadingProgress | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('reading_history')
      .select('manhwa_id, chapter_id, page_number, progress_percent, timestamp')
      .eq('user_id', userId)
      .eq('manhwa_id', manhwaId)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseAdapter] Error getting progress:', error);
      return null;
    }

    if (!data) return null;

    return {
      manhwaId: data.manhwa_id,
      chapterId: data.chapter_id,
      pageNumber: data.page_number,
      progressPercent: data.progress_percent,
      updatedAt: data.timestamp,
    };
  }

  async getRecentList(limit: number): Promise<ReadingProgress[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('reading_history')
      .select('manhwa_id, chapter_id, page_number, progress_percent, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[SupabaseAdapter] Error getting recent list:', error);
      return [];
    }

    return (data || []).map(row => ({
      manhwaId: row.manhwa_id,
      chapterId: row.chapter_id,
      pageNumber: row.page_number,
      progressPercent: row.progress_percent,
      updatedAt: row.timestamp,
    }));
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('reading_history')
      .select('manhwa_id, chapter_id, page_number, progress_percent, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[SupabaseAdapter] Error getting all progress:', error);
      return [];
    }

    return (data || []).map(row => ({
      manhwaId: row.manhwa_id,
      chapterId: row.chapter_id,
      pageNumber: row.page_number,
      progressPercent: row.progress_percent,
      updatedAt: row.timestamp,
    }));
  }

  async clearProgress(manhwaId: string): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', userId)
      .eq('manhwa_id', manhwaId);

    if (error) {
      console.error('[SupabaseAdapter] Error clearing progress:', error);
    }
  }

  async clearAll(): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[SupabaseAdapter] Error clearing all:', error);
    }
  }

  /**
   * Злиття локальних даних з Supabase
   * Зберігає найновіші дані з кожного джерела
   */
  async mergeProgress(localData: ReadingProgress[]): Promise<MergeResult> {
    const userId = await this.getUserId();
    if (!userId) {
      return { merged: [], localCleared: 0 };
    }

    const remoteData = await this.getAllProgress();
    const mergedMap = new Map<string, ReadingProgress>();

    // Додаємо віддалені дані
    remoteData.forEach(item => {
      mergedMap.set(item.manhwaId, item);
    });

    // Об'єднуємо з локальними - залишаємо новіше
    localData.forEach(localItem => {
      const existing = mergedMap.get(localItem.manhwaId);
      if (
        !existing ||
        new Date(localItem.updatedAt) > new Date(existing.updatedAt)
      ) {
        mergedMap.set(localItem.manhwaId, localItem);
      }
    });

    // Зберігаємо всі об'єднані дані в Supabase
    const merged = Array.from(mergedMap.values());
    
    for (const item of merged) {
      try {
        await this.saveProgress(item);
      } catch (error) {
        console.error('[SupabaseAdapter] Error during merge save:', error);
      }
    }

    return {
      merged,
      localCleared: localData.length,
    };
  }
}