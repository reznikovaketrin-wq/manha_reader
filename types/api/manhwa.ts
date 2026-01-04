// types/api/manhwa.ts
/**
 * API Types - структура данных, которая приходит с сервера / базы данных
 * Весь API-слой, который потом маппится в domain
 */

import type { ChapterAPI } from './chapter';

export interface ManhwaAPI {
  // Обязательные поля
  id: string;
  title: string;
  chapters: ChapterAPI[];

  // Опциональные поля с default значениями
  description?: string;
  status?: 'ongoing' | 'completed' | 'hiatus' | 'paused';
  type?: 'manhwa' | 'manga' | 'manhua' | 'novel';
  publication_type?: 'censored' | 'uncensored';
  cover_image?: string;
  bg_image?: string;

  // Статистика
  rating?: number;
  rating_count?: number;
  total_views?: number;

  // Дополнительно
  author?: string;
  artist?: string;
  genres?: string[];

  // Резервное поле для неизвестных полей
  [key: string]: any;
}