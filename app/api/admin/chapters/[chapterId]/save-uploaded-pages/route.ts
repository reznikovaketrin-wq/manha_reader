import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NEXT_PUBLIC_R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || '';

async function verifyAdmin(token: string) {
  const supabaseUser = getSupabaseWithToken(token);
  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) {
    console.error('❌ Auth error:', authError);
    throw new Error('Unauthorized');
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  console.log('🔐 Verify result:', { userId: authData.user.id, userError, userData });

  if (userError || userData?.role !== 'admin') {
    console.error('❌ Not admin:', { userError, role: userData?.role });
    throw new Error('Not an admin');
  }
  return { user: authData.user };
}

// POST - сохранить метаданные загруженных страниц в БД
export async function POST(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();
    const { uploadedPages, isFirstBatch } = body;

    if (!uploadedPages || !Array.isArray(uploadedPages) || uploadedPages.length === 0) {
      return NextResponse.json({ error: 'No uploaded pages provided' }, { status: 400 });
    }

    console.log(`💾 Saving ${uploadedPages.length} page(s) metadata...`);

    const supabase = getSupabaseAdmin();

    // Если это первая партия, удаляем старые страницы
    if (isFirstBatch) {
      console.log('🗑️ Clearing old pages...');
      await supabase.from('chapter_pages').delete().eq('chapter_id', chapterId);
    }

    // Сохранить метаданные в БД
    const pagesToInsert = uploadedPages.map((page: any) => ({
      chapter_id: chapterId,
      page_number: page.pageNumber,
      image_url: `${NEXT_PUBLIC_R2_BASE_URL}/${page.filePath}`,
      file_path: page.filePath,
    }));

    const { error: insertError } = await supabase.from('chapter_pages').insert(pagesToInsert);
    if (insertError) throw insertError;

    // Обновить количество страниц
    const { count } = await supabase
      .from('chapter_pages')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    const totalPages = count || uploadedPages.length;

    await supabase
      .from('chapters')
      .update({ pages_count: totalPages })
      .eq('id', chapterId);

    console.log(`✅ Saved ${uploadedPages.length} page(s). Total: ${totalPages}`);

    return NextResponse.json({
      success: true,
      savedCount: uploadedPages.length,
      totalPages,
    });
  } catch (error) {
    console.error('❌ Error saving page metadata:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Full error:', errorMsg);
    return NextResponse.json(
      { error: `Failed to save page metadata: ${errorMsg}` },
      { status: 500 }
    );
  }
}
