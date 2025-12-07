/**
 * 📁 /lib/api.ts
 * 
 * 🌐 УТИЛИТЫ ДЛЯ РАБОТЫ С ПУБЛИЧНЫМ API
 * 
 * Содержит функции для получения данных манхв из БД вместо JSON
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Manhwa {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  bgImage?: string;
  charImage?: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  tags: string[];
  type?: 'manhwa' | 'manga' | 'manhua';
  publicationType?: 'censored' | 'uncensored';
  scheduleDay?: {
    dayBig: string;
    dayLabel: string;
    note: string;
  } | null;
  chaptersCount: number;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  description?: string;
  pagesCount: number;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: string;
  scheduledAt?: string;
}

export interface ChapterWithPages extends Chapter {
  pages: {
    number: number;
    imageUrl: string;
  }[];
}

/**
 * 📚 Получить все манхвы
 */
export async function fetchManhwas(): Promise<Manhwa[]> {
  try {
    const apiUrl = `${API_BASE}/api/public`;
    console.log('📚 [API Client] Fetching all manhwas...');
    console.log('📍 [API Client] URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 [API Client] Response status:', response.status);
    console.log('📡 [API Client] Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Client] Response not ok:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Failed to fetch manhwas: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ [API Client] Loaded ${data.length} manhwas`);
    console.log('📦 [API Client] Data sample:', data.length > 0 ? data[0] : 'No data');
    return data;
  } catch (error) {
    console.error('❌ [API Client] Error fetching manhwas:', error);
    throw error;
  }
}

/**
 * 📖 Получить одну манхву с розділами
 */
export async function fetchManhwaById(id: string): Promise<Manhwa & { chapters: Chapter[] }> {
  try {
    console.log(`📖 [API Client] Fetching manhwa: ${id}`);

    const response = await fetch(`${API_BASE}/api/public/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Manhwa "${id}" not found`);
      }
      throw new Error(`Failed to fetch manhwa: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Loaded manhwa: ${data.title}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching manhwa ${id}:`, error);
    throw error;
  }
}

/**
 * 📄 Получить сторінки розділа
 */
export async function fetchChapterPages(
  manhwaId: string,
  chapterId: string
): Promise<ChapterWithPages> {
  try {
    console.log(`📄 [API Client] Fetching pages: ${manhwaId}/${chapterId}`);

    const response = await fetch(
      `${API_BASE}/api/public/${manhwaId}/chapters/${chapterId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Chapter "${chapterId}" not found`);
      }
      throw new Error(`Failed to fetch chapter pages: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Loaded ${data.pages.length} pages`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching chapter pages:`, error);
    throw error;
  }
}

/**
 * 🔍 Получить все манхвы и найти одну по ID
 */
export async function getManhwaById(id: string): Promise<Manhwa | undefined> {
  try {
    const manhwas = await fetchManhwas();
    return manhwas.find((m) => m.id === id);
  } catch (error) {
    console.error(`❌ Error getting manhwa:`, error);
    return undefined;
  }
}

/**
 * 🏠 Получить онгоинг манхвы
 */
export async function getOngoingManhwas(): Promise<Manhwa[]> {
  try {
    const manhwas = await fetchManhwas();
    return manhwas.filter((m) => m.status === 'ongoing');
  } catch (error) {
    console.error('❌ Error getting ongoing manhwas:', error);
    return [];
  }
}

/**
 * ⭐ Получить топ манхв по рейтингу
 */
export async function getTopManhwas(limit: number = 5): Promise<Manhwa[]> {
  try {
    const manhwas = await fetchManhwas();
    return manhwas.sort((a, b) => b.rating - a.rating).slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting top manhwas:', error);
    return [];
  }
}

/**
 * 🔎 Поиск манхв по названию или описанию
 */
export async function searchManhwas(query: string): Promise<Manhwa[]> {
  try {
    const manhwas = await fetchManhwas();
    const lowerQuery = query.toLowerCase();

    return manhwas.filter((m) => {
      const titleMatch = m.title.toLowerCase().includes(lowerQuery);
      const descriptionMatch = m.description?.toLowerCase().includes(lowerQuery);
      const tagsMatch = m.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));

      return titleMatch || descriptionMatch || tagsMatch;
    });
  } catch (error) {
    console.error('❌ Error searching manhwas:', error);
    return [];
  }
}