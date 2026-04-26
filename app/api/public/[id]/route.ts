/**
 * 📁 /app/api/public/[id]/route.ts
 * 
 * 🌐 PUBLIC API - ПОЛУЧИТЬ ОДНУ МАНХВУ С РОЗДІЛАМИ
 * ✅ Возвращает точную структуру JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnon } from '@/lib/supabase-server';

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAnon();
    const id = params.id;

    // Получить манхву
    const { data: manhwa, error: manhwaError } = await supabase
      .from('admin_manhwa')
      .select('*')
      .eq('id', id)
      .single();

    if (manhwaError || !manhwa) {
      return NextResponse.json(
        { error: 'Manhwa not found' },
        { status: 404 }
      );
    }

    // Получить розділы
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .eq('manhwa_id', id)
      .order('chapter_number', { ascending: true });

    if (chaptersError) {
      console.error('❌ Ошибка получения глав:', chaptersError);
      throw chaptersError;
    }

    // Получить количество оценок
    const { data: ratings, error: ratingsError } = await supabase
      .from('manhwa_ratings')
      .select('rating')
      .eq('manhwa_id', id);

    const ratingCount = ratings?.length || 0;

    // Получить количество просмотров из таблицы `views` (если есть)
    const { data: viewsData, error: viewsError } = await supabase
      .from('views')
      .select('view_count')
      .eq('manhwa_id', id)
      .single();

    if (viewsError && viewsError.code !== 'PGRST116') {
    }

    const totalViews = viewsData?.view_count || 0;


    // ✅ Строим точную структуру JSON
    const scheduleDay = manhwa.schedule_day 
      ? {
          dayBig: manhwa.schedule_day,
          dayLabel: manhwa.schedule_label || '',
          note: manhwa.schedule_note || '',
        }
      : null;

    const response = {
      id: manhwa.id,
      title: manhwa.title,
      description: manhwa.description,
      totalViews,
      shortDescription: manhwa.short_description || null,
      coverImage: manhwa.cover_image,
      bgImage: manhwa.bg_image,
      charImage: manhwa.char_image,
      status: manhwa.status,
      rating: manhwa.rating,
      ratingCount: ratingCount,
      tags: Array.isArray(manhwa.tags) ? manhwa.tags : [],
      type: manhwa.type || 'manhwa',
      publicationType: manhwa.publication_type,
      scheduleDay: scheduleDay,
      createdAt: manhwa.created_at,
      chapters: (chapters || []).map((ch: any) => ({
        id: ch.id,
        chapterNumber: ch.chapter_number,
        title: ch.title,
        description: ch.description || '',
        pagesCount: ch.pages_count,
        status: ch.status,
        publishedAt: ch.published_at,
        scheduledAt: ch.scheduled_at,
        vipOnly: ch.vip_only || false,
        vipEarlyDays: ch.vip_early_days || 0,
        publicAvailableAt: ch.public_available_at || null,
      })),
    };
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        // Короткий кеш для швидкого оновлення контенту
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch manhwa',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}