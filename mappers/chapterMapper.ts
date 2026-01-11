// mappers/chapterMapper.ts
/**
 * ✅ БЕЗ 'use client' - это чистая функция преобразования
 * Может использоваться как на клиенте, так и на сервере
 */

import type { ChapterAPI } from '@/types/api/chapter';
import type { Chapter } from '@/types/domain/chapter';

/**
 * Маппит одну главу из API в Domain формат
 */
export function mapChapterAPIToDomain(api: ChapterAPI): Chapter {
  return {
    id: api.id,
    number: api.chapterNumber,
    title: api.title || `Розділ ${api.chapterNumber}`,
    pages: api.pagesCount,
    status: api.status,
    createdAt: api.publishedAt,
    vipOnly: api.vipOnly,
    vipEarlyDays: api.vipEarlyDays,
    publicAvailableAt: api.publicAvailableAt,
  };
}

/**
 * Маппит массив глав, с защитой от undefined/null
 */
export function mapChaptersAPIToDomain(chapters: ChapterAPI[] | undefined | null): Chapter[] {
  if (!chapters || !Array.isArray(chapters)) {
    return [];
  }
  
  return chapters.map(mapChapterAPIToDomain);
}