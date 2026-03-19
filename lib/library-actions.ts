/**
 * 📁 lib/library-actions.ts
 * Server Actions для роботи з бібліотекою користувача
 */

'use server';

import { getSupabaseServerClient } from './supabase-server';
import { revalidateTag } from 'next/cache';
import type {
  ManhwaLibraryStatus,
  UserManhwaListItem,
  UserManhwaListItemExtended,
  ManhwaListResponse,
} from './library-types';

/**
 * Додати або оновити манхву в бібліотеці користувача
 */
export async function upsertManhwaToLibrary(
  manhwaId: string,
  status: ManhwaLibraryStatus
): Promise<ManhwaListResponse> {
  try {
    const supabase = await getSupabaseServerClient();

    // Отримати поточного користувача
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Не авторизовано' };
    }

    // Перевірити, чи існує запис
    const { data: existing, error: selectError } = await supabase
      .from('user_manhwa_list')
      .select('*')
      .eq('user_id', user.id)
      .eq('manhwa_id', manhwaId)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[upsertManhwaToLibrary] Select error:', selectError);
      return { success: false, error: 'Помилка перевірки запису' };
    }

    let result: UserManhwaListItem | null = null;

    if (existing) {
      // Оновити існуючий запис
      const { data, error: updateError } = await supabase
        .from('user_manhwa_list')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[upsertManhwaToLibrary] Update error:', updateError);
        return { success: false, error: 'Помилка оновлення статусу' };
      }

      result = data;
    } else {
      // Створити новий запис
      const { data, error: insertError } = await supabase
        .from('user_manhwa_list')
        .insert({
          user_id: user.id,
          manhwa_id: manhwaId,
          status,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[upsertManhwaToLibrary] Insert error:', insertError);
        return { success: false, error: 'Помилка додавання до бібліотеки' };
      }

      result = data;
    }

    // Інвалідувати кеш
    revalidateTag(`library-${user.id}`);
    revalidateTag(`library-status-${user.id}-${status}`);

    if (!result) {
      return { success: false, error: 'Не вдалося зберегти дані' };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('[upsertManhwaToLibrary] Unexpected error:', error);
    return { success: false, error: 'Непередбачена помилка' };
  }
}

/**
 * Видалити манхву з бібліотеки користувача
 */
export async function removeManhwaFromLibrary(manhwaId: string): Promise<ManhwaListResponse> {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Не авторизовано' };
    }

    const { error: deleteError } = await supabase
      .from('user_manhwa_list')
      .delete()
      .eq('user_id', user.id)
      .eq('manhwa_id', manhwaId);

    if (deleteError) {
      console.error('[removeManhwaFromLibrary] Delete error:', deleteError);
      return { success: false, error: 'Помилка видалення з бібліотеки' };
    }

    // Інвалідувати кеш
    revalidateTag(`library-${user.id}`);

    return { success: true };
  } catch (error) {
    console.error('[removeManhwaFromLibrary] Unexpected error:', error);
    return { success: false, error: 'Непередбачена помилка' };
  }
}

/**
 * Отримати статус манхви для користувача
 */
export async function getManhwaStatus(manhwaId: string): Promise<ManhwaLibraryStatus | null> {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_manhwa_list')
      .select('status')
      .eq('user_id', user.id)
      .eq('manhwa_id', manhwaId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.status as ManhwaLibraryStatus;
  } catch (error) {
    console.error('[getManhwaStatus] Error:', error);
    return null;
  }
}

/**
 * Отримати бібліотеку користувача з інтеграцією історії читання
 */
export async function getUserLibrary(
  status?: ManhwaLibraryStatus
): Promise<{ success: boolean; data?: UserManhwaListItemExtended[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Не авторизовано' };
    }

    // Базовий запит
    let query = supabase
      .from('user_manhwa_list')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    // Фільтр по статусу (якщо вказано)
    if (status) {
      query = query.eq('status', status);
    }

    const { data: libraryItems, error: libraryError } = await query;

    if (libraryError) {
      console.error('[getUserLibrary] Library error:', libraryError);
      return { success: false, error: 'Помилка завантаження бібліотеки' };
    }

    if (!libraryItems || libraryItems.length === 0) {
      return { success: true, data: [] };
    }

    // Отримати прогрес читання для кожної манхви.
    // Використовуємо reading_progress (upsert-таблиця, один рядок на user+manhwa)
    // замість reading_history (лог подій) — швидше, точніше, не потребує групування.
    const manhwaIds = libraryItems.map((item) => item.manhwa_id);

    const { data: progressData, error: progressError } = await supabase
      .from('reading_progress')
      .select('manhwa_id, chapter_id, last_read_at')
      .eq('user_id', user.id)
      .in('manhwa_id', manhwaIds);

    if (progressError) {
      console.error('[getUserLibrary] Progress error:', progressError);
      // Не критична помилка, продовжуємо без прогресу
    }

    // Один рядок на manhwa — просто перетворюємо в Map
    const progressMap = new Map<string, { chapter_id: string; last_read_at: string }>();
    if (progressData) {
      progressData.forEach((record) => {
        progressMap.set(record.manhwa_id, {
          chapter_id: record.chapter_id,
          last_read_at: record.last_read_at,
        });
      });
    }

    // Об'єднати дані
    const extendedItems: UserManhwaListItemExtended[] = libraryItems.map((item) => {
      const progress = progressMap.get(item.manhwa_id);
      return {
        ...item,
        last_read_chapter: progress?.chapter_id,
        last_read_at: progress?.last_read_at,
      };
    });

    return { success: true, data: extendedItems };
  } catch (error) {
    console.error('[getUserLibrary] Unexpected error:', error);
    return { success: false, error: 'Непередбачена помилка' };
  }
}

/**
 * Отримати статистику бібліотеки (кількість по кожному статусу)
 */
export async function getLibraryStats(): Promise<Record<ManhwaLibraryStatus, number> | null> {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_manhwa_list')
      .select('status')
      .eq('user_id', user.id);

    if (error || !data) {
      return null;
    }

    // Підрахувати по статусам
    const stats: Record<string, number> = {
      reading: 0,
      planned: 0,
      completed: 0,
      rereading: 0,
      postponed: 0,
      dropped: 0,
    };

    data.forEach((item) => {
      stats[item.status] = (stats[item.status] || 0) + 1;
    });

    return stats as Record<ManhwaLibraryStatus, number>;
  } catch (error) {
    console.error('[getLibraryStats] Error:', error);
    return null;
  }
}
