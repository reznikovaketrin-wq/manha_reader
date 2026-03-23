/**
 * 📁 /lib/api.ts
 * 
 * 🌐 УТИЛИТЫ ДЛЯ РАБОТЫ С ПУБЛИЧНЫМ API
 * ✅ Исправлено: используется relative URL вместо hardcoded localhost
 * 
 * ✅ ОПТИМИЗАЦИЯ: ISR + revalidateTag комбо
 * - Кеш хранится 60 секунд
 * - Очищается НЕМЕДЛЕННО при обновлении в админке через revalidateTag()
 * - Гарантирует видимость обновлений за 1-60 секунд
 * 
 * 🔄 СОРТИРОВКА: по последней главе (новые главы вверх)
 */

// ✅ Используем relative URL по умолчанию — работает везде (localhost, LAN, Vercel, любой домен)
// Если в env задано http://localhost:3000 (для локальной сборки), при доступе с другого хоста
// (например 192.168.x.x на мобильном) запросы должны идти на текущий origin, иначе возникнет CORS.
let API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// В браузере используем текущий origin при локальном адресе
if (typeof window !== 'undefined') {
  if (API_BASE && API_BASE.includes('localhost')) {
    API_BASE = window.location.origin;
  }
} else {
  // На сервере undici (Node) не поддерживает относительные URL без базового origin.
  // Собираем абсолютный URL в следующем порядке:
  // 1) NEXT_PUBLIC_API_URL (если задан)
  // 2) NEXT_PUBLIC_SITE_URL (production) -> use provided public site URL
  // 3) fallback на localhost с портом из env или 3000 (разработка)
  if (!API_BASE) {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      API_BASE = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
    } else {
      const port = process.env.PORT || '3000';
      API_BASE = `http://localhost:${port}`;
    }
  }
}

export interface Manhwa {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  bgImage?: string;
  charImage?: string;
  status: 'ongoing' | 'completed' | 'hiatus' | 'paused' | 'one-shot';
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
  lastChapterDate?: string;
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
 * 
 * ✅ ОПТИМИЗАЦИЯ:
 * - Кеш с тегом 'schedule-data' для немедленной очистки
 * - ISR: переизменяется каждые 60 секунд
 * - Очищается НЕМЕДЛЕННО при обновлении в админке
 * 
 * 🔄 СОРТИРОВКА: по дате последней главы (новые первыми)
 */
export async function fetchManhwas(): Promise<Manhwa[]> {
  try {
    const apiUrl = `${API_BASE}/api/public`;
    if (process.env.NODE_ENV !== 'production') {
      console.log('📚 [API Client] Fetching all manhwas...');
      console.log('📍 [API Client] URL:', apiUrl);
      console.log('⏰ [API Client] Timestamp:', new Date().toISOString());
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ ОПТИМИЗАЦИЯ: ISR + revalidateTag комбо
      next: { 
        tags: ['schedule-data'],  // Очищается при revalidateTag() в админке
        revalidate: 60,            // Автоматически переизменяется каждые 60 секунд
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('📡 [API Client] Response status:', response.status);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Client] Response not ok:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Failed to fetch manhwas: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 🔄 СОРТИРОВКА: по дате последней главы (новые первыми)
    const sorted = data.sort((a: any, b: any) => {
      const dateA = new Date(a.lastChapterDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.lastChapterDate || b.createdAt || 0).getTime();
      
      // dateB - dateA = новые первыми (убывающий порядок)
      return dateB - dateA;
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ [API Client] Loaded ${sorted.length} manhwas at ${new Date().toISOString()}`);
      console.log('🔄 [API Client] Sorted by last chapter date (newest first)');
      console.log('📦 [API Client] First item:', sorted.length > 0 ? {
        id: sorted[0].id,
        title: sorted[0].title,
        lastChapterDate: sorted[0].lastChapterDate,
      } : 'No data');
    }
    
    return sorted;
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
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📖 [API Client] Fetching manhwa: ${id}`);
    }

    const response = await fetch(`${API_BASE}/api/public/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { 
        tags: ['schedule-data', `manhwa-${id}`],
        revalidate: 60,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Manhwa "${id}" not found`);
      }
      throw new Error(`Failed to fetch manhwa: ${response.status}`);
    }

    const data = await response.json();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Loaded manhwa: ${data.title}`);
    }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📄 [API Client] Fetching pages: ${manhwaId}/${chapterId}`);
    }

    const response = await fetch(
      `${API_BASE}/api/public/${manhwaId}/chapters/${chapterId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { 
          tags: ['schedule-data', `chapters-${manhwaId}`],
          revalidate: 60,
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
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Loaded ${data.pages.length} pages`);
    }
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