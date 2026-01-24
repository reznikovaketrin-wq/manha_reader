/**
 * API функции для работы с прогрессом чтения
 * 
 * Абстракция над Supabase и localStorage
 */

import { supabase } from '@/lib/supabase-client';
import {
  ReadingProgress,
  ReadingProgressRow,
  LocalStorageProgress,
  fromSupabaseRow,
  toSupabaseRow,
  LOCAL_STORAGE_KEY,
  READING_PROGRESS_CONFIG,
  SaveProgressInput,
} from './types';

// ============================================
// LOCALSTORAGE FUNCTIONS (для гостей)
// ============================================

/**
 * Получить все данные из localStorage
 */
export function getLocalStorageProgress(): LocalStorageProgress {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return {};
    
    const data = JSON.parse(stored) as LocalStorageProgress;
    
    // Очистка устаревших записей
    const now = Date.now();
    const ttl = READING_PROGRESS_CONFIG.LOCAL_STORAGE_TTL_DAYS * 24 * 60 * 60 * 1000;
    
    const filtered: LocalStorageProgress = {};
    for (const [manhwaId, progress] of Object.entries(data)) {
      const lastRead = new Date(progress.lastReadAt).getTime();
      if (now - lastRead < ttl) {
        filtered[manhwaId] = progress;
      }
    }
    
    // Сохраняем очищенные данные если что-то удалили
    if (Object.keys(filtered).length !== Object.keys(data).length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
    
    return filtered;
  } catch (error) {
    console.error('[ReadingProgressAPI] Error reading localStorage:', error);
    return {};
  }
}

/**
 * Получить прогресс для одной манхвы из localStorage
 */
export function getLocalProgress(manhwaId: string): ReadingProgress | null {
  const all = getLocalStorageProgress();
  return all[manhwaId] || null;
}

/**
 * Сохранить прогресс в localStorage
 */
export function saveLocalProgress(progress: ReadingProgress): void {
  if (typeof window === 'undefined') return;
  
  try {
    const all = getLocalStorageProgress();
    all[progress.manhwaId] = progress;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('[ReadingProgressAPI] Error saving to localStorage:', error);
  }
}

/**
 * Получить недавние записи из localStorage
 */
export function getLocalRecentProgress(limit: number): ReadingProgress[] {
  const all = getLocalStorageProgress();
  
  return Object.values(all)
    .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
    .slice(0, limit);
}

/**
 * Очистить localStorage
 */
export function clearLocalProgress(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('[ReadingProgressAPI] Error clearing localStorage:', error);
  }
}

// ============================================
// SUPABASE FUNCTIONS (для авторизованных)
// ============================================

/**
 * Получить прогресс для одной манхвы из Supabase
 */
export async function fetchProgress(
  userId: string, 
  manhwaId: string
): Promise<ReadingProgress | null> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[fetchProgress] Starting query:', { userId, manhwaId });
  }
  
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('manhwa_id', manhwaId)
      .maybeSingle();
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[fetchProgress] Supabase response:', {
        userId,
        manhwaId,
        hasData: !!data,
        error: error?.message,
        rawData: data
      });
    }
    
    if (error) {
      console.error('[ReadingProgressAPI] fetchProgress error:', error);
      return null;
    }
    
    if (!data) return null;
    
    const result = fromSupabaseRow(data as ReadingProgressRow);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[fetchProgress] Processed result:', result);
    }
    
    return result;
  } catch (error) {
    console.error('[ReadingProgressAPI] fetchProgress exception:', error);
    return null;
  }
}

/**
 * Получить недавние записи из Supabase
 */
export async function fetchRecentProgress(
  userId: string, 
  limit: number
): Promise<ReadingProgress[]> {
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[ReadingProgressAPI] fetchRecentProgress error:', error);
      return [];
    }
    
    return (data || []).map(row => fromSupabaseRow(row as ReadingProgressRow));
  } catch (error) {
    console.error('[ReadingProgressAPI] fetchRecentProgress exception:', error);
    return [];
  }
}

/**
 * Получить всю историю из Supabase
 */
export async function fetchAllProgress(userId: string): Promise<ReadingProgress[]> {
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false });
    
    if (error) {
      console.error('[ReadingProgressAPI] fetchAllProgress error:', error);
      return [];
    }
    
    return (data || []).map(row => fromSupabaseRow(row as ReadingProgressRow));
  } catch (error) {
    console.error('[ReadingProgressAPI] fetchAllProgress exception:', error);
    return [];
  }
}

/**
 * Сохранить прогресс в Supabase
 */
export async function saveProgress(
  userId: string, 
  input: SaveProgressInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Получаем существующий прогресс для обновления read_chapters
    const existing = await fetchProgress(userId, input.manhwaId);
    
    const now = new Date().toISOString();
    
    // Создаём или обновляем прогресс
    const progress: ReadingProgress = {
      manhwaId: input.manhwaId,
      currentChapterId: input.chapterId,
      currentChapterNumber: input.chapterNumber,
      currentPage: input.pageNumber,
      readChapterIds: existing?.readChapterIds || [],
      archivedRanges: existing?.archivedRanges || [],
      startedAt: existing?.startedAt || now,
      lastReadAt: now,
    };
    
    // Добавляем главу в прочитанные если её там нет
    if (!progress.readChapterIds.includes(input.chapterId)) {
      progress.readChapterIds = [...progress.readChapterIds, input.chapterId];
      
      // Ограничиваем размер массива
      if (progress.readChapterIds.length > READING_PROGRESS_CONFIG.MAX_READ_CHAPTERS) {
        progress.readChapterIds = progress.readChapterIds.slice(
          -READING_PROGRESS_CONFIG.MAX_READ_CHAPTERS
        );
      }
    }
    
    const row = toSupabaseRow(userId, progress);
    
    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        ...row,
        updated_at: now,
      }, { 
        onConflict: 'user_id,manhwa_id' 
      });
    
    if (error) {
      console.error('[ReadingProgressAPI] saveProgress error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('[ReadingProgressAPI] saveProgress exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Отметить главу как прочитанную
 */
export async function markChapterAsRead(
  userId: string,
  manhwaId: string,
  chapterId: string,
  chapterNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await fetchProgress(userId, manhwaId);
    const now = new Date().toISOString();
    
    let readChapterIds = existing?.readChapterIds || [];
    
    // Добавляем если нет
    if (!readChapterIds.includes(chapterId)) {
      readChapterIds = [...readChapterIds, chapterId];
      
      // Ограничиваем размер
      if (readChapterIds.length > READING_PROGRESS_CONFIG.MAX_READ_CHAPTERS) {
        readChapterIds = readChapterIds.slice(-READING_PROGRESS_CONFIG.MAX_READ_CHAPTERS);
      }
    }

    const progress: ReadingProgress = {
      manhwaId,
      currentChapterId: existing?.currentChapterId || chapterId,
      currentChapterNumber: chapterNumber,
      currentPage: existing?.currentPage || 1,
      readChapterIds,
      archivedRanges: existing?.archivedRanges || [],
      startedAt: existing?.startedAt || now,
      lastReadAt: now,
    };

    const row = toSupabaseRow(userId, progress);
    
    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        ...row,
        updated_at: now,
      }, { 
        onConflict: 'user_id,manhwa_id' 
      });
    
    if (error) {
      console.error('[ReadingProgressAPI] markChapterAsRead error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('[ReadingProgressAPI] markChapterAsRead exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// СИНХРОНИЗАЦИЯ
// ============================================

/**
 * Синхронизировать localStorage -> Supabase при логине
 */
export async function syncLocalToSupabase(userId: string): Promise<{
  synced: number;
  errors: string[];
}> {
  const localData = getLocalStorageProgress();
  const entries = Object.values(localData);
  
  if (entries.length === 0) {
    return { synced: 0, errors: [] };
  }
  
  const errors: string[] = [];
  let synced = 0;
  
  for (const progress of entries) {
    try {
      // Получаем серверные данные для merge
      const serverProgress = await fetchProgress(userId, progress.manhwaId);
      
      // Если на сервере новее — пропускаем
      if (serverProgress && 
          new Date(serverProgress.lastReadAt) > new Date(progress.lastReadAt)) {
        continue;
      }
      
      // Merge read chapters
      const mergedReadChapters = serverProgress
        ? [...new Set([...serverProgress.readChapterIds, ...progress.readChapterIds])]
        : progress.readChapterIds;
      
      const mergedProgress: ReadingProgress = {
        ...progress,
        readChapterIds: mergedReadChapters.slice(-READING_PROGRESS_CONFIG.MAX_READ_CHAPTERS),
        startedAt: serverProgress?.startedAt || progress.startedAt,
      };
      
      const row = toSupabaseRow(userId, mergedProgress);
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          ...row,
          updated_at: now,
        }, { 
          onConflict: 'user_id,manhwa_id' 
        });
      
      if (error) {
        errors.push(`${progress.manhwaId}: ${error.message}`);
      } else {
        synced++;
      }
    } catch (error: any) {
      errors.push(`${progress.manhwaId}: ${error.message}`);
    }
  }
  
  // Очищаем localStorage после успешной синхронизации
  if (synced > 0 && errors.length === 0) {
    clearLocalProgress();
  }
  
  console.log(`[ReadingProgressAPI] Synced ${synced}/${entries.length} entries`, 
    errors.length > 0 ? { errors } : '');
  
  return { synced, errors };
}
