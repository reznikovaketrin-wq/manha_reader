/**
 * 🗑️ /app/api/admin/manhwa/[id]/route.ts
 * 
 * ✅ Включает удаление файлов из R2 при удалении манґи
 * ✅ Исправлено - использует getSupabaseAdmin, getSupabaseWithToken
 */

import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// R2 конфиг
const R2_BUCKET = process.env.R2_BUCKET_NAME || '';
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

/** Видалити всі файли у R2 за заданим префіксом (підтримує pagination) */
async function deleteR2Prefix(prefix: string) {
  let continuationToken: string | undefined;
  let totalDeleted = 0;

  do {
    const listResp = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects = listResp.Contents || [];

    for (let i = 0; i < objects.length; i += 1000) {
      const batch = objects.slice(i, i + 1000).map((o) => ({ Key: o.Key! }));
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: { Objects: batch },
        })
      );
      totalDeleted += batch.length;
      console.log(`📦 [R2] Deleted batch: ${batch.length} files (prefix: ${prefix})`);
    }

    continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
  } while (continuationToken);

  return totalDeleted;
}

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

// DELETE - видалити манхву І всі її файли з R2
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

    // 1️⃣ Отримати всі file_path сторінок усіх глав ДО видалення з БД
    const { data: chapterPages } = await supabase
      .from('chapter_pages')
      .select('file_path, chapters!inner(manhwa_id)')
      .eq('chapters.manhwa_id', id);

    // 2️⃣ Видалити манхву з БД (cascade видаляє chapters та chapter_pages)
    console.log(`📋 [API] Deleting manhwa from database: ${id}`);
    const { error: dbError } = await supabase
      .from('admin_manhwa')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
    console.log('✅ [API] Deleted from database');

    // 3️⃣ Видалити всі файли з R2
    try {
      // A) Видаляємо конкретні file_path сторінок (з БД)
      if (chapterPages && chapterPages.length > 0) {
        const filePaths = chapterPages
          .map((p: any) => p.file_path)
          .filter(Boolean) as string[];

        for (let i = 0; i < filePaths.length; i += 1000) {
          const batch = filePaths.slice(i, i + 1000).map((key) => ({ Key: key }));
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: R2_BUCKET,
              Delete: { Objects: batch },
            })
          );
          console.log(`📦 [R2] Deleted ${batch.length} page files`);
        }
      }

      // B) Sweep всієї папки {id}/ — прибирає cover/bg/char + будь-які залишки
      const prefix = `${id}/`;
      console.log(`📦 [R2] Sweeping prefix: ${prefix}`);
      const totalDeleted = await deleteR2Prefix(prefix);
      console.log(`✅ [R2] Swept ${totalDeleted} remaining files for: ${id}`);
    } catch (r2Error) {
      // Логуємо, але не блокуємо — з БД вже видалено
      console.error('⚠️ [R2] Error deleting files:', r2Error);
    }

    // 4️⃣ Очищаємо кеш
    console.log(`🔄 [Cache] Invalidating paths after deletion of ${id}`);
    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/api/public');

    console.log('✅ [API] Fully deleted: ' + id);
    return NextResponse.json({
      success: true,
      message: 'Manhwa and all associated files deleted successfully',
      cacheRevalidated: true,
    });
  } catch (error) {
    console.error('❌ [API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}