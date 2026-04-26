/**
 * 📁 /app/api/public/route.ts
 * 
 * 🌐 PUBLIC API - ПОЛУЧИТЬ ВСЕ МАНХВЫ
 * ✅ Исправлено: клиент создается внутри функции
 * 
 * GET /api/public
 * 
 * Возвращает:
 * [
 *   {
 *     id: "lycar-ta-vidma",
 *     title: "Лицар та Відьма",
 *     description: "...",
 *     coverImage: "https://r2.dev/...",
 *     status: "ongoing",
 *     rating: 8.9,
 *     tags: ["БЕЗ ЦЕНЗУРИ", "МАНХВА"],
 *     scheduleDay: {...},
 *     chapters: 3
 *   },
 *   ...
 * ]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnon } from '@/lib/supabase-server';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    // ✅ Создаём клиент ВНУТРИ функции
    const supabase = getSupabaseAnon();

    // Получить все манхвы
    const { data: manhwas, error: manhwaError } = await supabase
      .from('admin_manhwa')
      .select('*')
      .order('created_at', { ascending: false });

    if (manhwaError) {
      console.error('❌ Database error:', {
        message: manhwaError.message,
        code: manhwaError.code,
        details: manhwaError.details,
      });
      throw manhwaError;
    }

    if (!Array.isArray(manhwas) || manhwas.length === 0) {
      return NextResponse.json([]);
    }

    // Получаем количество опубликованных глав для каждой манхвы
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('manhwa_id')
      .eq('status', 'published');

    const chaptersCountMap = new Map<string, number>();
    (chaptersData || []).forEach((ch: any) => {
      chaptersCountMap.set(ch.manhwa_id, (chaptersCountMap.get(ch.manhwa_id) || 0) + 1);
    });

    // Трансформируем данные из БД в API формат (camelCase)
    const enrichedManhwas = (manhwas || []).map((manhwa: any) => {
      
      // Собираем scheduleDay объект из отдельных столбцов
      let scheduleDay = null;
      if (manhwa.schedule_label) {
        // Преобразовать украинское название дня в сокращение
        const dayMap: Record<string, string> = {
          'Понеділок': 'ПН',
          'Вівторок': 'ВТ',
          'Середа': 'СР',
          'Четвер': 'ЧТ',
          "П'ятниця": 'ПТ',
          'Субота': 'СБ',
          'Неділя': 'НД',
        };
        
        scheduleDay = {
          dayBig: dayMap[manhwa.schedule_label] || '',
          dayLabel: manhwa.schedule_label,
          note: manhwa.schedule_note || '',
        };
      }

      // lastChapterDate: cap at NOW so scheduled (future) chapters
      // don't push the manhwa above already-published ones.
      // A chapter scheduled for tomorrow should only affect sort order from tomorrow onwards.
      const rawDate = manhwa.last_chapter_date;
      const effectiveLastChapterDate = rawDate
        ? new Date(rawDate).getTime() > Date.now()
          ? new Date().toISOString()   // future → treat as "just now"
          : rawDate
        : null;

      const result = {
        id: manhwa.id,
        title: manhwa.title,
        description: manhwa.description,
        shortDescription: manhwa.short_description,
        coverImage: manhwa.cover_image,
        bgImage: manhwa.bg_image,
        charImage: manhwa.char_image,
        status: manhwa.status,
        rating: manhwa.rating,
        tags: Array.isArray(manhwa.tags) ? manhwa.tags : [],
        type: manhwa.type,
        publicationType: manhwa.publication_type,
        scheduleDay: scheduleDay,
        lastChapterDate: effectiveLastChapterDate,
        chaptersCount: chaptersCountMap.get(manhwa.id) || 0,
      };
      
      return result;
    });

    return NextResponse.json(enrichedManhwas);
  } catch (error) {
    console.error('❌ [API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch manhwas';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}