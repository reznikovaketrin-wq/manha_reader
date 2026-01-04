/**
 * 📁 /app/api/admin/chapters/[chapterId]/route.ts
 * 
 * ✅ ОПТИМИЗАЦИЯ: Очищаем кеш при обновлении глав
 * ✅ Исправлено: используем getSupabaseAdmin и getSupabaseWithToken
 */

import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

async function verifyAdmin(token: string) {
  // ✅ Используем getSupabaseWithToken вместо createClient
  const supabaseUser = getSupabaseWithToken(token);

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) throw new Error('Unauthorized');

  const supabaseAdmin = getSupabaseAdmin();

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (userError || userData?.role !== 'admin') throw new Error('Not an admin');
  return { user: authData.user };
}

// GET - получить главу со всеми страницами
export async function GET(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;
    console.log('📖 [API] GET chapter:', chapterId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = getSupabaseAdmin();

    // Получить главу
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (chapterError) throw chapterError;

    // Получить все страницы главы
    const { data: pages, error: pagesError } = await supabase
      .from('chapter_pages')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('page_number', { ascending: true });

    if (pagesError) throw pagesError;

    console.log('✅ [API] Got chapter with pages:', pages?.length || 0);
    return NextResponse.json({ data: { ...chapter, pages: pages || [] } });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - обновить информацию главы
export async function PUT(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;
    console.log('✏️ [API] PUT chapter:', chapterId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('chapters')
      .update({
        title: body.title,
        description: body.description,
        status: body.status,
        scheduled_at: body.scheduled_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId)
      .select()
      .single();

    if (error) throw error;

    // ✅ Очищаем кеш при обновлении главы
    console.log(`🔄 [Cache] Revalidating schedule cache`);
    revalidateTag('schedule-data');
    
    // Если есть manhwa_id в данных - очищаем и конкретную манхву
    if (data?.manhwa_id) {
      revalidateTag(`manhwa-${data.manhwa_id}`);
    }

    console.log('✅ [API] Chapter updated');
    return NextResponse.json({ data, cacheRevalidated: true });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}

// DELETE - удалить главу
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;
    console.log('🗑️ [API] DELETE chapter:', chapterId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = getSupabaseAdmin();

    // Удалить (каскадное удаление страниц)
    const { error } = await supabase.from('chapters').delete().eq('id', chapterId);

    if (error) throw error;

    // ✅ Очищаем кеш при удалении
    console.log(`🔄 [Cache] Revalidating cache after chapter deletion`);
    revalidateTag('schedule-data');

    console.log('✅ [API] Chapter deleted');
    return NextResponse.json({ success: true, cacheRevalidated: true });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}