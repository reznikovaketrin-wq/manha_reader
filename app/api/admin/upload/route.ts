/**
 * 📁 /app/api/admin/upload/route.ts
 * 
 * Эндпоинт для ЗАГРУЗКИ ИЗОБРАЖЕНИЙ на R2
 * 
 * POST /api/admin/upload
 * 
 * Body (FormData):
 *   - file: File (изображение)
 *   - manhwaId: string (ID манхвы)
 *   - type: "cover" | "bg" | "char" (тип изображения)
 * 
 * Response:
 *   { url: "https://r2.com/manhwaId/type.jpg", ... }
 */

import { getSupabaseAdmin, getSupabaseAnon, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [API] POST /admin/upload');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const manhwaId = formData.get('manhwaId') as string;
    const type = formData.get('type') as 'cover' | 'bg' | 'char';

    if (!file || !manhwaId || !type) {
      console.error('❌ Missing fields:', { file: !!file, manhwaId, type });
      return NextResponse.json(
        { error: 'Missing required fields: file, manhwaId, type' },
        { status: 400 }
      );
    }

    console.log(`📝 Uploading ${type} for ${manhwaId}`);

    // Инициализировать S3 client для R2
    const s3Client = new S3Client({
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });

    // Прочитать файл и конвертировать в Uint8Array
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    const fileName = `${type}.${file.name.split('.').pop()}`;
    const key = `${manhwaId}/${fileName}`;

    console.log(`🔑 Key: ${key}`);

    // Загрузить на R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'manhwa-reader',
        Key: key,
        Body: uint8Array,
        ContentType: file.type || 'image/jpeg',
      })
    );

    const baseUrl = process.env.NEXT_PUBLIC_R2_BASE_URL;
    const fileUrl = `${baseUrl}/${key}`;

    console.log(`✅ File uploaded: ${fileUrl}`);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      type,
      manhwaId,
    });
  } catch (error) {
    console.error('❌ [API] Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}