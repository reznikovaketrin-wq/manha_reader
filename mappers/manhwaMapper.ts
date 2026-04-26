// mappers/manhwaMapper.ts
/**
 * ✅ БЕЗ 'use client' - это чистая функция преобразования
 * Маппит API-объект в Domain-объект
 */

import type { ManhwaAPI } from '@/types/api/manhwa';
import type { Manhwa } from '@/types/domain/Manhwa';
import { mapChaptersAPIToDomain } from './chapterMapper';

/**
 * Маппит Manhwa из API в Domain формат
 * 
 * ✅ Не мутирует API-объект
 * ✅ Создаёт новый Domain объект с явными полями
 * ✅ Добавляет default значения для всех optional полей
 * ✅ Полный маппинг (не только главы)
 */
export function mapManhwaAPIToDomain(api: ManhwaAPI): Manhwa {
  if (process.env.NODE_ENV !== 'production') {
  }
  
  return {
    // Основные поля (обязательные)
    id: api.id,
    title: api.title || 'Unknown Manhwa',
    description: api.description || '',
    
    // Изображения
    coverImage: api.coverImage || '',
    bgImage: api.bgImage,
    
    // Метаданные
    status: (api.status || 'ongoing') as Manhwa['status'],
    type: (api.type || 'manhwa') as Manhwa['type'],
    publicationType: (api.publicationType || 'official') as Manhwa['publicationType'],
    
    // Главы - маппим через специализированный mapper
    chapters: mapChaptersAPIToDomain(api.chapters),
    
    // Статистика - ✅ ИСПРАВЛЕНО: используем camelCase
    rating: api.rating ?? 0,
    ratingCount: api.ratingCount ?? 0,
    totalViews: api.totalViews ?? 0,
  };
}

/**
 * Маппит массив манхв (редко используется, но для полноты)
 */
export function mapManhwasAPIToDomain(manhwas: ManhwaAPI[] | undefined): Manhwa[] {
  if (!manhwas || !Array.isArray(manhwas)) {
    return [];
  }
  
  return manhwas.map(mapManhwaAPIToDomain);
}