/**
 * 📁 /app/api/public/[id]/chapters/[chapterId]/route.ts
 * 
 * 🌐 PUBLIC API - ПОЛУЧИТЬ СТОРІНКИ РОЗДІЛА
 * ✅ Исправлено: клиент создается внутри функции
 * 
 * GET /api/public/:id/chapters/:chapterId
 * 
 * Параметры:
 *   id - ID манхвы
 *   chapterId - ID розділа
 * 
 * Возвращает:
 * {
 *   id: "01",
 *   number: 1,
 *   title: "Розділ 1",
 *   pagesCount: 4,
 *   status: "published",
 *   pages: [
 *     {
 *       number: 1,
 *       imageUrl: "https://r2.dev/...",
 *       width: 1080,
 *       height: 1440
 *     },
 *     ...
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnon } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id, chapterId } = params;
    console.log(`📖 [API] GET /api/public/${id}/chapters/${chapterId}`);

    // ✅ Создаём клиент ВНУТРИ функции
    const supabase = getSupabaseAnon();

    // Получить розділ
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('manhwa_id', id)
      .single();

    if (chapterError || !chapter) {
      console.log(`⚠️ Розділ не найдена: ${chapterId}`);
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    console.log(`✅ Розділ найдена: ${chapter.title}`);

    // Получить сторінки
    const { data: pages, error: pagesError } = await supabase
      .from('chapter_pages')
      .select('*')
      .eq('chapter_id', chapter.id)
      .order('page_number', { ascending: true });

    if (pagesError) throw pagesError;

    console.log(`📄 Получено сторінок: ${pages?.length || 0}`);

    // Структурированный ответ (camelCase)
    const response = {
      id: chapter.id,
      chapterNumber: chapter.chapter_number,
      title: chapter.title,
      description: chapter.description,
      pagesCount: chapter.pages_count,
      status: chapter.status,
      publishedAt: chapter.published_at,
      scheduledAt: chapter.scheduled_at,
      pages: (pages || []).map((page) => ({
        number: page.page_number,
        imageUrl: page.image_url,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chapter pages' },
      { status: 500 }
    );
  }
}