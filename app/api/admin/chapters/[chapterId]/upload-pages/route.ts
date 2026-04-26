import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// 📦 Конфигурация Route Segment для больших файлов
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 минут

// В Next.js App Router конфигурация bodyParser НЕ работает
// Вместо этого используем route segment config для увеличения лимита
// Лимит настраивается в vercel.json или через переменные окружения

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const NEXT_PUBLIC_R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || '';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

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

// POST - загрузить страницы главы на R2
export async function POST(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const formData = await request.formData();
    const files = formData.getAll('pages') as File[];
    const manhwaId = formData.get('manhwaId') as string;
    const chapterNumber = formData.get('chapterNumber') as string;
    const pageNumberStr = formData.get('pageNumber') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Получить главу
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) throw new Error('Chapter not found');

    // Если это первый файл (pageNumber = 1) или не указан номер страницы, удаляем старые страницы
    const isFirstBatch = !pageNumberStr || parseInt(pageNumberStr) === 1;
    if (isFirstBatch) {
      await supabase.from('chapter_pages').delete().eq('chapter_id', chapterId);
    }

    const uploadedPages: any[] = [];

    // Загрузить каждый файл на R2
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pageNumber = pageNumberStr ? parseInt(pageNumberStr) + i : i + 1;
      const ext = file.type.split('/')[1] || 'jpg';
      const fileName = `page_${pageNumber}.${ext}`;
      const filePath = `${manhwaId}/chapters/${chapterNumber}/${fileName}`;

      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Загрузить на R2
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filePath,
          Body: uint8Array,
          ContentType: file.type,
        })
      );

      const imageUrl = `${NEXT_PUBLIC_R2_BASE_URL}/${filePath}`;

      // Сохранить в БД
      const { error: pageError } = await supabase.from('chapter_pages').insert({
        chapter_id: chapterId,
        page_number: pageNumber,
        image_url: imageUrl,
        file_path: filePath,
      });

      if (pageError) throw pageError;

      uploadedPages.push({ pageNumber, imageUrl });
    }

    // Обновить количество страниц в главе (считаем все страницы в БД)
    const { count } = await supabase
      .from('chapter_pages')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    const totalPages = count || files.length;
    
    await supabase
      .from('chapters')
      .update({ pages_count: totalPages })
      .eq('id', chapterId);
    return NextResponse.json({
      success: true,
      pages: uploadedPages,
      uploadedCount: files.length,
      totalPages,
    });
  } catch (error) {
    console.error('❌ [API] Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}