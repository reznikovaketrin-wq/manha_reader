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
  console.log('🔥 [getManhwaData] FUNCTION CALLED AT:', new Date().toISOString());
  
  try {
    console.log('📚 [getManhwaData] Starting to fetch data...');
    const response = await fetchManhwas();

    console.log('📚 [getManhwaData] Got response, length:', response?.length);
    console.log('📚 [getManhwaData] First item scheduleDay:', response?.[0]?.scheduleDay);

    if (!response || !Array.isArray(response)) {
      console.error('❌ [getManhwaData] Response is not an array:', typeof response);
      return [];
    }

    // Проверяем какие манхвы имеют расписание
    console.log('📋 [getManhwaData] Checking all items:');
    response.forEach((m: any, idx: number) => {
      console.log(`  [${idx}] ${m.id}:`, {
        schedule_label: m.scheduleDay?.dayLabel,
        schedule_note: m.scheduleDay?.note,
        has_scheduleDay: !!m.scheduleDay,
      });
    });

    // Преобразуем формат API в формат приложения
    const transformed = response
      .filter((m: any) => {
        const hasSchedule = m.scheduleDay && m.scheduleDay.dayLabel;
        if (hasSchedule) {
          console.log(`✅ [getManhwaData] PASSING FILTER: ${m.id} has schedule: ${m.scheduleDay.dayLabel}`);
        }
        return hasSchedule;
      })
      .map((m: any) => {
        console.log('🔄 [getManhwaData] Transforming:', m.id, '→', m.title);
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

    console.log(`✅ [getManhwaData] RESULT: ${transformed.length} out of ${response.length} manhwas have schedule`);
    console.log('📦 Filtered data:', JSON.stringify(transformed, null, 2));
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
    console.log(`🔍 Getting manhwa: ${id}`);

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
      })),
    };

    console.log(`✅ Loaded manhwa: ${transformed.title}`);
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
    console.log(`📖 Getting chapter pages: ${manhwaId}/${chapterId}`);

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

    console.log(`✅ Loaded ${transformed.pages.length} pages`);
    return transformed;
  } catch (error) {
    console.error(`❌ Error getting chapter pages:`, error);
    return undefined;
  }
}

// (debug exposure removed)