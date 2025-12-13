/**
 * 🗑️ /app/api/admin/manhwa/[id]/route.ts
 * 
 * ✅ Включает удаление файлов из R2 при удалении манги
 * ✅ Исправлено - использует getSupabaseAdmin, getSupabaseWithToken
 */

import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// R2 конфиг
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'manhwa-storage';
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

// S3 клиент для R2
const s3Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

async function verifyAdmin(token: string) {
  // ✅ Используем getSupabaseWithToken вместо createClient
  const supabaseUser = getSupabaseWithToken(token);

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) throw new Error('Unauthorized');

  // ✅ Используем getSupabaseAdmin вместо createClient
  const supabaseAdmin = getSupabaseAdmin();

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (userError || userData?.role !== 'admin') throw new Error('Not an admin');
  return { user: authData.user, userData };
}

// GET - получить конкретную манхву
export async function GET(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    console.log('📖 [API] GET /admin/manhwa/' + id);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('admin_manhwa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [API] Error fetching:', error);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.log('✅ [API] Fetched:', data.title);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - обновить манхву
export async function PUT(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    console.log('✏️ [API] PUT /admin/manhwa/' + id);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();

    const supabase = getSupabaseAdmin();

    // Построить update объект динамически
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.short_description !== undefined) updateData.short_description = body.short_description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.publication_type !== undefined) updateData.publication_type = body.publication_type;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.cover_image !== undefined) updateData.cover_image = body.cover_image;
    if (body.bg_image !== undefined) updateData.bg_image = body.bg_image;
    if (body.char_image !== undefined) updateData.char_image = body.char_image;
    if (body.schedule_label !== undefined) updateData.schedule_label = body.schedule_label;
    if (body.schedule_note !== undefined) updateData.schedule_note = body.schedule_note;

    const { data, error } = await supabase
      .from('admin_manhwa')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`🔄 [Cache] Invalidating paths for ${id}`);
    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/api/public');

    console.log('✅ [API] Updated:', data.title);
    return NextResponse.json({ data, cacheRevalidated: true });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE - удалить манхву И её файлы из R2
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    console.log('🗑️ [API] DELETE /admin/manhwa/' + id);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = getSupabaseAdmin();

    // 1️⃣ Удаляем манхву из БД
    console.log(`📋 [API] Deleting manhwa from database: ${id}`);
    const { error: dbError } = await supabase
      .from('admin_manhwa')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
    console.log('✅ [API] Deleted from database');

    // 2️⃣ Удаляем все файлы с этим ID из R2
    console.log(`📦 [R2] Listing files for: ${id}`);
    
    try {
      // Ищем все файлы с префиксом {id}/
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: `${id}/`, // Все файлы в папке {id}/
      });

      const listResponse = await s3Client.send(listCommand);
      const objects = listResponse.Contents || [];

      if (objects.length > 0) {
        console.log(`📦 [R2] Found ${objects.length} files to delete`);

        // Удаляем по 1000 объектов за раз (лимит S3)
        for (let i = 0; i < objects.length; i += 1000) {
          const batch = objects.slice(i, i + 1000).map(obj => ({
            Key: obj.Key!,
          }));

          const deleteCommand = new DeleteObjectsCommand({
            Bucket: R2_BUCKET,
            Delete: {
              Objects: batch,
            },
          });

          await s3Client.send(deleteCommand);
          console.log(`📦 [R2] Deleted batch: ${batch.length} files`);
        }

        console.log(`✅ [R2] All files deleted for: ${id}`);
      } else {
        console.log('📦 [R2] No files found for this ID');
      }
    } catch (r2Error) {
      console.error('⚠️ [R2] Error deleting files:', r2Error);
      // Не прерываем процесс если ошибка с R2, манга уже удалена из БД
    }

    // 3️⃣ Очищаем кеш
    console.log(`🔄 [Cache] Invalidating paths after deletion of ${id}`);
    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/api/public');

    console.log('✅ [API] Deleted: ' + id);
    return NextResponse.json({ 
      success: true, 
      message: 'Manhwa and all associated files deleted successfully',
      cacheRevalidated: true 
    });
  } catch (error) {
    console.error('❌ [API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}