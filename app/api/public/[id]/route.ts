/**
 * 📁 /app/api/public/[id]/route.ts
 * 
 * 🌐 PUBLIC API - ПОЛУЧИТЬ ОДНУ МАНХВУ С РОЗДІЛАМИ
 * 
 * GET /api/public/:id
 * 
 * Параметры:
 *   id - ID манхвы (например: "lycar-ta-vidma")
 * 
 * Возвращает:
 * {
 *   id: "lycar-ta-vidma",
 *   title: "Лицар та Відьма",
 *   description: "...",
 *   coverImage: "...",
 *   status: "ongoing",
 *   rating: 8.9,
 *   tags: ["БЕЗ ЦЕНЗУРИ"],
 *   scheduleDay: {...},
 *   chapters: [
 *     {
 *       id: "01",
 *       number: 1,
 *       title: "Розділ 1",
 *       pagesCount: 4,
 *       status: "published"
 *     },
 *     ...
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`📖 [API] GET /api/public/${id} - Получаю манхву`);

    // Получить манхву
    const { data: manhwa, error: manhwaError } = await supabase
      .from('admin_manhwa')
      .select('*')
      .eq('id', id)
      .single();

    if (manhwaError || !manhwa) {
      console.log(`⚠️ Манхва не найдена: ${id}`);
      return NextResponse.json({ error: 'Manhwa not found' }, { status: 404 });
    }

    console.log(`✅ Манхва найдена: ${manhwa.title}`);

    // Получить розділы
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .eq('manhwa_id', id)
      .order('chapter_number', { ascending: true });

    if (chaptersError) throw chaptersError;

    console.log(`📚 Получено розділов: ${chapters?.length || 0}`);

    // Структурированный ответ (camelCase)
    const scheduleDay = manhwa.schedule_day ? {
      dayBig: manhwa.schedule_day,
      dayLabel: manhwa.schedule_label || '',
      note: manhwa.schedule_note || '',
    } : null;

    const response = {
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
      createdAt: manhwa.created_at,
      chapters: (chapters || []).map((ch) => ({
        id: ch.id,
        chapterNumber: ch.chapter_number,
        title: ch.title,
        description: ch.description,
        pagesCount: ch.pages_count,
        status: ch.status,
        publishedAt: ch.published_at,
        scheduledAt: ch.scheduled_at,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch manhwa' },
      { status: 500 }
    );
  }
}