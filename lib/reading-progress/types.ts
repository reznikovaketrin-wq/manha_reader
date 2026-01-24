/**
 * Типы для модуля reading-progress
 * 
 * Единый источник правды для всех типов связанных с прогрессом чтения
 */

// ============================================
// ОСНОВНЫЕ ТИПЫ
// ============================================

/**
 * Диапазон прочитанных глав
 * s - start (начало), e - end (конец)
 */
export interface ArchivedRange {
  s: number;
  e: number;
}

/**
 * Прогресс чтения манхвы
 * Используется для хранения в БД и localStorage
 */
export interface ReadingProgress {
  /** ID манхвы */
  manhwaId: string;
  
  /** ID текущей главы */
  currentChapterId: string;
  
  /** Номер текущей главы (для отображения) */
  currentChapterNumber: number;
  
  /** Номер текущей страницы */
  currentPage: number;
  
  /** Массив ID прочитанных глав */
  readChapterIds: string[];
  
  /** Архивированные диапазоны прочитанных глав (оптимизация для больших списков) */
  archivedRanges: ArchivedRange[];
  
  /** Время начала чтения */
  startedAt: string;
  
  /** Время последнего чтения */
  lastReadAt: string;
}

/**
 * Данные для сохранения прогресса (input)
 */
export interface SaveProgressInput {
  manhwaId: string;
  chapterId: string;
  chapterNumber: number;
  pageNumber: number;
}

/**
 * Элемент списка "Продовжити читання"
 */
export interface ContinueReadingItem {
  manhwaId: string;
  chapterId: string;
  chapterNumber: number;
  pageNumber: number;
  lastReadAt: string;
  
  // Данные манхвы (загружаются отдельно)
  manhwaTitle?: string;
  coverImage?: string;
}

// ============================================
// ТИПЫ ДЛЯ SUPABASE
// ============================================

/**
 * Формат записи в таблице reading_progress (Supabase)
 */
export interface ReadingProgressRow {
  user_id: string;
  manhwa_id: string;
  chapter_id: string;
  page_number: number;
  read_chapters: string[];
  archived_ranges: ArchivedRange[];
  read_count?: number;
  last_read_at: string;
  updated_at: string;
}

/**
 * Конвертация из Supabase формата в app формат
 */
export function fromSupabaseRow(row: ReadingProgressRow): ReadingProgress {
  // ИСПРАВЛЕНО: Нормализуем все chapter IDs к строкам И убираем дубликаты
  const normalizedChapters = (row.read_chapters || []).map(id => String(id));
  const uniqueReadChapters = [...new Set(normalizedChapters)];
  
  console.log('[fromSupabaseRow] normalizing chapter IDs', {
    raw: row.read_chapters,
    normalized: normalizedChapters,
    unique: uniqueReadChapters,
  });
  
  return {
    manhwaId: row.manhwa_id,
    currentChapterId: String(row.chapter_id), // ИСПРАВЛЕНО: также нормализуем
    currentChapterNumber: 0, // Будет вычислено отдельно при необходимости
    currentPage: row.page_number,
    readChapterIds: uniqueReadChapters,
    archivedRanges: row.archived_ranges || [],
    startedAt: row.last_read_at, // Используем last_read_at как fallback
    lastReadAt: row.last_read_at,
  };
}

/**
 * Конвертация из app формата в Supabase формат
 */
export function toSupabaseRow(
  userId: string, 
  progress: ReadingProgress
): Omit<ReadingProgressRow, 'updated_at'> {
  return {
    user_id: userId,
    manhwa_id: progress.manhwaId,
    chapter_id: progress.currentChapterId,
    page_number: progress.currentPage,
    read_chapters: progress.readChapterIds,
    archived_ranges: progress.archivedRanges,
    read_count: progress.readChapterIds.length,
    last_read_at: progress.lastReadAt,
  };
}

// ============================================
// ТИПЫ ДЛЯ LOCALSTORAGE
// ============================================

/**
 * Формат хранения в localStorage
 */
export interface LocalStorageProgress {
  [manhwaId: string]: ReadingProgress;
}

export const LOCAL_STORAGE_KEY = 'triw_reading_progress_v2';

// ============================================
// QUERY KEYS
// ============================================

/**
 * Ключи для React Query
 * Централизованное определение для консистентности
 */
export const readingProgressKeys = {
  all: ['readingProgress'] as const,
  
  // Прогресс конкретной манхвы
  progress: (manhwaId: string, userId?: string) => 
    [...readingProgressKeys.all, 'progress', manhwaId, userId ?? 'guest'] as const,
  
  // Список "Продовжити читання"
  continueReading: (userId?: string) => 
    [...readingProgressKeys.all, 'continue', userId ?? 'guest'] as const,
  
  // Полная история чтения
  history: (userId?: string) => 
    [...readingProgressKeys.all, 'history', userId ?? 'guest'] as const,
  
  // Проверка прочитана ли глава
  isRead: (manhwaId: string, chapterId: string) =>
    [...readingProgressKeys.all, 'isRead', manhwaId, chapterId] as const,
};

// ============================================
// КОНСТАНТЫ
// ============================================

export const READING_PROGRESS_CONFIG = {
  /** Максимальное количество ID глав в массиве read_chapters */
  MAX_READ_CHAPTERS: 500,
  
  /** Лимит для "Продовжити читання" */
  CONTINUE_READING_LIMIT: 8,
  
  /** Debounce для сохранения прогресса (мс) */
  SAVE_DEBOUNCE_MS: 2000,
  
  /** Время жизни данных в localStorage (дни) */
  LOCAL_STORAGE_TTL_DAYS: 30,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Проверяет находится ли номер главы в одном из диапазонов
 */
export function isInRanges(chapterNumber: number, ranges: ArchivedRange[]): boolean {
  return ranges.some(r => chapterNumber >= r.s && chapterNumber <= r.e);
}

/**
 * Проверяет прочитана ли глава (комбинирует read_chapters и archived_ranges)
 * Принимает как массив, так и Set для удобства использования
 */
export function isChapterRead(
  chapterId: string | number,
  chapterNumber: number,
  readChapterIds: string[] | Set<string>,
  archivedRanges: ArchivedRange[]
): boolean {
  // Normalize chapterId to string because DB stores chapter IDs as strings
  const idStr = String(chapterId);

  // Handle both Array and Set
  const isInReadChapters = readChapterIds instanceof Set
    ? readChapterIds.has(idStr)
    : readChapterIds.includes(idStr);

  // First check recent read_chapters
  if (isInReadChapters) {
    return true;
  }

  // Then check archived ranges
  return isInRanges(chapterNumber, archivedRanges);
}

/**
 * Создать Set из массива прочитанных глав для быстрого поиска
 * ИСПРАВЛЕНО: Нормализуем все ID к строкам для консистентности
 */
export function createReadChaptersSet(readChapterIds: (string | number)[]): Set<string> {
  return new Set(readChapterIds.map(id => String(id)));
}

/**
 * Очистить дубликаты из массива прочитанных глав
 */
export function cleanReadChapterIds(readChapterIds: string[]): string[] {
  return [...new Set(readChapterIds)];
}
