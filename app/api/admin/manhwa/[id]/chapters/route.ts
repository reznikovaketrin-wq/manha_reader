import { getSupabaseAdmin, getSupabaseAnon, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';


async function verifyAdmin(token: string) {
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
  return { user: authData.user, userData };
}

// GET - получить список глав манхвы
export async function GET(request: NextRequest, { params }: any) {
  try {
    const manhwaId = params.id;
    console.log('📖 [API] GET chapters for:', manhwaId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('manhwa_id', manhwaId)
      .order('chapter_number', { ascending: true });

    if (error) throw error;

    console.log('✅ [API] Got chapters:', data.length);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// POST - создать новую главу
export async function POST(request: NextRequest, { params }: any) {
  try {
    const manhwaId = params.id;
    console.log('➕ [API] POST chapter for:', manhwaId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    let nextChapterNumber: number;

    // Если номер главы указан в теле запроса, использовать его
    if (body.chapter_number !== undefined && body.chapter_number !== null) {
      nextChapterNumber = Number(body.chapter_number);
      console.log(`📝 [API] Custom chapter number: ${nextChapterNumber}`);
      
      // Проверить, не существует ли уже глава с таким номером
      const { data: existingChapter, error: checkError } = await supabase
        .from('chapters')
        .select('id')
        .eq('manhwa_id', manhwaId)
        .eq('chapter_number', nextChapterNumber);
      
      if (existingChapter && existingChapter.length > 0) {
        throw new Error(`Chapter ${nextChapterNumber} already exists for this manhwa`);
      }
    } else {
      // Автоматическое увеличение: найти максимальный номер и добавить 1
      const { data: maxData } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('manhwa_id', manhwaId)
        .order('chapter_number', { ascending: false })
        .limit(1);

      // Если нет глав, начинаем с 0; иначе берем max + 1
      if (maxData && maxData.length > 0) {
        nextChapterNumber = maxData[0].chapter_number + 1;
        console.log(`📊 [API] Found max chapter ${maxData[0].chapter_number}, next will be ${nextChapterNumber}`);
      } else {
        nextChapterNumber = 0;
        console.log(`📊 [API] No chapters found, starting with 0`);
      }
    }

    // Создать ID главы из номера (без padStart для поддержки дробных чисел)
    const chapterId = String(nextChapterNumber).replace('.', '-');

    console.log(`🎯 [API] Creating chapter: ID=${chapterId}, Number=${nextChapterNumber}, Manhwa=${manhwaId}`);

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        chapter_id: chapterId,
        chapter_number: nextChapterNumber,
        manhwa_id: manhwaId,
        title: body.title || `Розділ ${nextChapterNumber}`,        description: body.description || '',
        status: 'draft',
        pages_count: 0,
        vip_only: body.vip_only || false,
        vip_early_days: body.vip_early_days || 0,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [API] Chapter created:', chapterId);

    // 🆕 ОБНОВЛЯЕМ last_chapter_date в манхве
    console.log('🔄 [API] Updating last_chapter_date for:', manhwaId);
    const now = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('admin_manhwa')
      .update({ last_chapter_date: now })
      .eq('id', manhwaId);

    if (updateError) {
      console.error('⚠️ [API] Warning: Could not update last_chapter_date:', updateError);
      // Не прерываем процесс, глава уже создана
    } else {
      console.log('✅ [API] Updated last_chapter_date for:', manhwaId);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ [API] Error creating chapter:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Full error stack:', error);
    return NextResponse.json(
      { error: `Create failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}