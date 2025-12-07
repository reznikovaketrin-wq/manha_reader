import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
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
  const supabaseUser = createClient(URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) throw new Error('Unauthorized');

  const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);

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
    console.log('📤 [API] Upload pages for chapter:', chapterId);

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

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    console.log(`📤 Uploading ${files.length} pages to R2...`);

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    // Получить главу
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) throw new Error('Chapter not found');

    // Удалить старые страницы
    await supabase.from('chapter_pages').delete().eq('chapter_id', chapterId);

    const uploadedPages: any[] = [];

    // Загрузить каждый файл на R2
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pageNumber = i + 1;
      const ext = file.type.split('/')[1] || 'jpg';
      const fileName = `page_${pageNumber}.${ext}`;
      const filePath = `${manhwaId}/chapters/${chapterNumber}/${fileName}`;

      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      console.log(`📤 Uploading: ${filePath}`);

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
      console.log(`✅ Page ${pageNumber} uploaded`);
    }

    // Обновить количество страниц в главе
    await supabase
      .from('chapters')
      .update({ pages_count: files.length })
      .eq('id', chapterId);

    console.log(`✅ All pages uploaded: ${files.length}`);
    return NextResponse.json({
      success: true,
      pages: uploadedPages,
      totalPages: files.length,
    });
  } catch (error) {
    console.error('❌ [API] Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}