/**
 * 📁 /app/api/admin/chapters/[chapterId]/route.ts
 * 
 * ✅ ОПТИМИЗАЦИЯ: Очищаем кеш при обновлении глав
 * ✅ Исправлено: используем getSupabaseAdmin и getSupabaseWithToken
 */

import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || '';

/** Видалити всі файли у R2 за заданим префіксом (підтримує pagination) */
async function deleteR2Prefix(prefix: string) {
  let continuationToken: string | undefined;

  do {
    const listResp = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects = listResp.Contents || [];

    if (objects.length > 0) {
      // Видаляємо порціями по 1000 (ліміт S3/R2)
      for (let i = 0; i < objects.length; i += 1000) {
        const batch = objects.slice(i, i + 1000).map((o) => ({ Key: o.Key! }));
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: R2_BUCKET,
            Delete: { Objects: batch },
          })
        );
      }
    }

    continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
  } while (continuationToken);
}

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

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.scheduled_at !== undefined) updateData.scheduled_at = body.scheduled_at;
    if (body.chapter_number !== undefined) {
      updateData.chapter_number = body.chapter_number;
      // also sync chapter_id so R2 folder name stays consistent with chapter_number
      updateData.chapter_id = String(body.chapter_number).replace('.', '-');
    }

    const { data, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', chapterId)
      .select()
      .single();

    if (error) throw error;

    // ✅ Очищаем кеш при обновлении главы
    revalidateTag('schedule-data');
    
    // Если есть manhwa_id в данных - очищаем и конкретную манхву
    if (data?.manhwa_id) {
      revalidateTag(`manhwa-${data.manhwa_id}`);
    }
    return NextResponse.json({ data, cacheRevalidated: true });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}

// DELETE - видалити главу + файли з R2
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = getSupabaseAdmin();

    // 1️⃣ Отримати дані глави (manhwa_id, chapter_number) та всі file_path сторінок ДО видалення
    const { data: chapter, error: chapterFetchError } = await supabase
      .from('chapters')
      .select('id, manhwa_id, chapter_number, chapter_id')
      .eq('id', chapterId)
      .single();

    if (chapterFetchError || !chapter) {
      throw new Error('Chapter not found');
    }

    const { data: pages } = await supabase
      .from('chapter_pages')
      .select('file_path')
      .eq('chapter_id', chapterId);

    // 2️⃣ Видалити з БД (каскадно видаляє chapter_pages)
    const { error: dbError } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);

    if (dbError) throw dbError;

    // 3️⃣ Видалити файли з R2
    try {
      // Варіант A: видаляємо конкретні file_path зі збережених у БД
      if (pages && pages.length > 0) {
        const filePaths = pages
          .map((p: { file_path: string }) => p.file_path)
          .filter(Boolean) as string[];

        for (let i = 0; i < filePaths.length; i += 1000) {
          const batch = filePaths.slice(i, i + 1000).map((key) => ({ Key: key }));
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: R2_BUCKET,
              Delete: { Objects: batch },
            })
          );
        }
      }

      // Use chapter_id (the actual R2 folder name) — it may differ from chapter_number
      // if the chapter was renamed after initial creation
      const r2FolderKey = chapter.chapter_id || String(chapter.chapter_number);
      if (chapter.manhwa_id && r2FolderKey) {
        const prefix = `${chapter.manhwa_id}/chapters/${r2FolderKey}/`;
        await deleteR2Prefix(prefix);
      }
    } catch (r2Error) {
      // Логуємо, але не блокуємо відповідь — з БД вже видалено
      console.error('⚠️ [R2] Error deleting chapter files:', r2Error);
    }

    // 4️⃣ Інвалідуємо кеш
    revalidateTag('schedule-data');
    if (chapter.manhwa_id) {
      revalidateTag(`manhwa-${chapter.manhwa_id}`);
    }
    return NextResponse.json({ success: true, cacheRevalidated: true });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}