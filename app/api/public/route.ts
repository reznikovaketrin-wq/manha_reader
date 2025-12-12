/**
 * 📁 /app/api/public/route.ts
 * 
 * 🌐 PUBLIC API - ПОЛУЧИТЬ ВСЕ МАНХВЫ
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
import { createClient } from '@supabase/supabase-js';
export const revalidate = 60;       // кэшируем данные на 60 секунд
export const dynamic = "force-static"; // заставляем Next.js кэшировать API

// Инициализация Supabase с проверкой ключей
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [API] Missing Supabase credentials');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ Missing');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌ Missing');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function GET(request: NextRequest) {
  console.log('🚀🚀🚀 [API] GET /api/public CALLED! 🚀🚀🚀');
  try {
    console.log('📚 [API] GET /api/public - Получаю все манхвы');
    console.log('🔧 Supabase URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
    console.log('🔧 Supabase Key:', supabaseKey ? '✅ Configured' : '❌ Missing');

    // Получить все манхвы
    const { data: manhwas, error: manhwaError } = await supabase
      .from('admin_manhwa')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📊 Query result:', { 
      count: Array.isArray(manhwas) ? manhwas.length : 0, 
      error: manhwaError ? manhwaError.message : null,
      hasData: !!manhwas,
      dataType: typeof manhwas,
      isArray: Array.isArray(manhwas)
    });

    if (manhwaError) {
      console.error('❌ Database error:', {
        message: manhwaError.message,
        code: manhwaError.code,
        details: manhwaError.details,
      });
      throw manhwaError;
    }

    if (!Array.isArray(manhwas) || manhwas.length === 0) {
      console.log('⚠️ No manhwas found in database');
      console.log('📋 Query details: table=admin_manhwa, select=*');
      return NextResponse.json([]);
    }

    console.log(`📦 Processing ${manhwas.length} manhwas...`);

    // Трансформируем данные из БД в API формат (camelCase)
    const enrichedManhwas = (manhwas || []).map((manhwa: any) => {
      console.log(`🔄 Processing: ${manhwa.id} - ${manhwa.title}`);
      
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
        lastChapterDate: manhwa.last_chapter_date,
        chaptersCount: 0,
      };
      
      console.log(`  scheduleDay for ${manhwa.id}:`, {
        schedule_label: manhwa.schedule_label,
        schedule_note: manhwa.schedule_note,
        resulting_scheduleDay: scheduleDay
      });
      
      return result;
    });

    console.log(`✅ Получено ${enrichedManhwas.length} манхв`);
    console.log('📦 Sample data:', enrichedManhwas.length > 0 ? enrichedManhwas[0] : null);

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