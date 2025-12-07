import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || '';

/**
 * API для автопубликации запланированных глав
 * Должна вызваться каждый час (через Vercel Crons или внешний сервис)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('⏰ [Cron] Publishing scheduled chapters...');

    // Проверка секрета (безопасность)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn('🚫 [Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    // Получить все запланированные главы, время которых наступило
    const { data: scheduledChapters, error: fetchError } = await supabase
      .from('chapters')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (fetchError) throw fetchError;

    console.log(`📖 Found ${scheduledChapters?.length || 0} chapters to publish`);

    if (!scheduledChapters || scheduledChapters.length === 0) {
      console.log('✅ [Cron] No chapters to publish');
      return NextResponse.json({ message: 'No chapters to publish', count: 0 });
    }

    // Опубликовать каждую главу
    const publishedChapters: any[] = [];

    for (const chapter of scheduledChapters) {
      console.log(`📤 Publishing chapter ${chapter.chapter_id} (ID: ${chapter.id})`);

      const { data: updatedChapter, error: updateError } = await supabase
        .from('chapters')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapter.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Failed to publish chapter ${chapter.id}:`, updateError);
        continue;
      }

      publishedChapters.push(updatedChapter);
      console.log(`✅ Chapter published: ${chapter.manhwa_id}/${chapter.chapter_id}`);
    }

    console.log(`🎉 [Cron] Successfully published ${publishedChapters.length} chapters`);

    return NextResponse.json({
      success: true,
      message: `Published ${publishedChapters.length} chapters`,
      chapters: publishedChapters,
      count: publishedChapters.length,
    });
  } catch (error) {
    console.error('❌ [Cron] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET для ручной проверки (опционально)
 * Для тестирования: curl "http://localhost:3000/api/admin/publish-scheduled"
 */
export async function GET(request: NextRequest) {
  // В production - требовать CRON_SECRET
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('⏰ [Cron] GET request - checking scheduled chapters...');

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    // Просто показать что нужно опубликовать (без изменений)
    const { data: scheduledChapters, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;

    return NextResponse.json({
      message: 'Scheduled chapters found',
      count: scheduledChapters?.length || 0,
      chapters: scheduledChapters || [],
      nextCheck: new Date(Date.now() + 3600000).toISOString(), // +1 час
    });
  } catch (error) {
    console.error('❌ [Cron] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}