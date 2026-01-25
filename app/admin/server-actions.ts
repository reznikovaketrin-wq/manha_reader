/**
 * 📁 /app/admin/server-actions.ts
 * 
 * ✅ Server Actions для инвалидации кеша
 * 
 * Клиентская админка вызывает эти функции → они вызывают revalidateTag на сервере
 */

'use server';

import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Инвалидировать кеш после изменения манхвы
 */
export async function invalidateManhwaCache(manhwaId: string) {
  console.log(`🔄 [Server Action] Invalidating cache for ${manhwaId}`);
  
  try {
    // Инвалидировать теги
    revalidateTag('schedule-data');
    revalidateTag(`manhwa-${manhwaId}`);
    revalidateTag('chapters-' + manhwaId);
    
    // Инвалидировать пути
    revalidatePath(`/api/public/${manhwaId}`);
    revalidatePath(`/manhwa/${manhwaId}`);
    revalidatePath('/');
    
    console.log(`✅ [Server Action] Cache invalidated for ${manhwaId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Server Action] Error invalidating cache:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Инвалидировать кеш расписания
 */
export async function invalidateScheduleCache() {
  console.log('🔄 [Server Action] Invalidating schedule cache');
  
  try {
    revalidateTag('schedule-data');
    console.log('✅ [Server Action] Schedule cache invalidated');
    return { success: true };
  } catch (error) {
    console.error('❌ [Server Action] Error invalidating schedule cache:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}