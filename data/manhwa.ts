/**
 * 📁 /data/manhwa.ts
 * 
 * 🔄 Функции для работы с данными манхв из API
 * 
 * Используется в браузере и на сервере
 */

import { fetchManhwas, fetchManhwaById as fetchById, fetchChapterPages } from '@/lib/api';

/**
 * Получить все манхвы из API (только с расписанием)
 */
export async function getManhwaData() {
  
  try {
    const response = await fetchManhwas();

    if (!response || !Array.isArray(response)) {
      console.error('❌ [getManhwaData] Response is not an array:', typeof response);
      return [];
    }

    // Проверяем какие манхвы имеют расписание
    response.forEach((m: any, idx: number) => {
    });

    // Преобразуем формат API в формат приложения
    const transformed = response
      .filter((m: any) => {
        const hasSchedule = m.scheduleDay && m.scheduleDay.dayLabel;
        if (hasSchedule) {
        }
        return hasSchedule;
      })
      .map((m: any) => {
        return {
          id: m.id,
          title: m.title,
          description: m.description,
          coverImage: m.coverImage,
          status: m.status,
          rating: m.rating,
          tags: m.tags || [],
          scheduleDay: m.scheduleDay,
        };
      });
    return transformed;
  } catch (error) {
    console.error('❌ [getManhwaData] Error:', error);
    return [];
  }
}

/**
 * Получить манхву по ID
 */
export async function getManhwaById(id: string) {
  try {

    const response = await fetchById(id);

    // Преобразуем формат API
    const transformed = {
      id: response.id,
      title: response.title,
      description: response.description,
      coverImage: response.coverImage,
      bgImage: response.bgImage,
      charImage: response.charImage,
      status: response.status,
      rating: response.rating,
      tags: response.tags || [],
      scheduleDay: response.scheduleDay,
      chapters: (response.chapters || []).map((ch: any) => ({
        id: ch.id,
        number: ch.chapterNumber,
        title: ch.title,
        pagesCount: ch.pagesCount,
        status: ch.status,
        publishedAt: ch.publishedAt || null,
      })),
    };
    return transformed;
  } catch (error) {
    console.error(`❌ Error getting manhwa ${id}:`, error);
    return undefined;
  }
}

/**
 * Получить сторінки розділа
 */
export async function getChapterPages(manhwaId: string, chapterId: string) {
  try {

    const response = await fetchChapterPages(manhwaId, chapterId);

    const transformed = {
      id: response.id,
      number: response.chapterNumber,
      title: response.title,
      pages: (response.pages || []).map((p: any) => ({
        number: p.number,
        url: p.imageUrl,
      })),
      pagesCount: response.pagesCount,
    };
    return transformed;
  } catch (error) {
    console.error(`❌ Error getting chapter pages:`, error);
    return undefined;
  }
}

// (debug exposure removed)