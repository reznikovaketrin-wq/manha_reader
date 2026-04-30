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

    const now = new Date().toISOString();

    // Fetch all chapters that are currently accessible:
    //   - status='published' (released immediately or VIP-only)
    //   - status='scheduled' AND scheduled_at <= NOW (VIP early access has started)
    // We use these to compute the true effective lastChapterDate per manhwa,
    // so sorting reacts the moment a chapter becomes accessible — not when it was created.
    const { data: accessibleChapters } = await supabase
      .from('chapters')
      .select('manhwa_id, published_at, scheduled_at, status')
      .or(`status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${now})`);

    // Build maps: chaptersCount and lastChapterDate per manhwa
    const chaptersCountMap = new Map<string, number>();
    const lastChapterDateMap = new Map<string, string>();

    (accessibleChapters || []).forEach((ch: any) => {
      // Count published chapters only
      if (ch.status === 'published') {
        chaptersCountMap.set(ch.manhwa_id, (chaptersCountMap.get(ch.manhwa_id) || 0) + 1);
      }

      // Effective access date: published_at for published, scheduled_at for scheduled-but-accessible
      const accessDate = ch.published_at || ch.scheduled_at;
      if (!accessDate) return;

      const current = lastChapterDateMap.get(ch.manhwa_id);
      // Normalize: ensure UTC by appending Z if missing (Supabase omits it)
      const normalizedDate = accessDate.endsWith('Z') || accessDate.includes('+') ? accessDate : accessDate + 'Z';
      if (!current || new Date(normalizedDate) > new Date(current)) {
        lastChapterDateMap.set(ch.manhwa_id, normalizedDate);
      }
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

      // lastChapterDate: taken from accessible chapters map (already UTC-normalized).
      // This is null until at least one chapter becomes accessible (published or scheduled_at <= now).
      const effectiveLastChapterDate = lastChapterDateMap.get(manhwa.id) ?? null;

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