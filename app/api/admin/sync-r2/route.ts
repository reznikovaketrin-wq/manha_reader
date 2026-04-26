/**
 * 📁 /app/api/admin/sync-r2/route.ts
 * 
 * 🔄 ENDPOINT ДЛЯ СИНХРОНИЗАЦИИ R2 → БД
 * ✅ Исправлено: используем getSupabaseAdmin и getSupabaseWithToken
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

async function verifyAdmin(token: string) {
  try {
    // ✅ Используем getSupabaseWithToken вместо createClient
    const supabaseUser = getSupabaseWithToken(token);

    const { data: authData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authData.user) throw new Error('Unauthorized');

    // ✅ Используем getSupabaseAdmin вместо createClient
    const supabase = getSupabaseAdmin();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (userError || userData?.role !== 'admin') throw new Error('Not an admin');
    return authData.user;
  } catch (error) {
    console.error('❌ [Sync] Admin verification failed:', error);
    throw error;
  }
}

async function listR2Files(prefix: string = '') {
  try {

    // Проверить переменные окружения
    if (!process.env.R2_ACCESS_KEY_ID) throw new Error('Missing R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('Missing R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_ACCOUNT_ID) throw new Error('Missing R2_ACCOUNT_ID');
    if (!process.env.R2_BUCKET_NAME) throw new Error('Missing R2_BUCKET_NAME');

    const s3Client = new S3Client({
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
      Delimiter: '/',
    });

    const response = await s3Client.send(command);

    return {
      files: response.Contents || [],
      folders: response.CommonPrefixes || [],
    };
  } catch (error) {
    console.error('❌ [Sync] R2 read error:', error);
    throw new Error(`R2 read failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    // ✅ Используем getSupabaseAdmin() вместо getSupabaseClient(true)
    const supabase = getSupabaseAdmin();

    const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL;
    const R2_BUCKET = process.env.R2_BUCKET_NAME;

    if (!R2_BASE_URL) throw new Error('Missing NEXT_PUBLIC_R2_BASE_URL');
    if (!R2_BUCKET) throw new Error('Missing R2_BUCKET_NAME');

    const results = {
      manhwasProcessed: 0,
      chaptersCreated: 0,
      pagesCreated: 0,
      imagesUpdated: 0,
      errors: [] as string[],
    };

    // 1. Получить папки манхв
    let folders;
    try {
      const data = await listR2Files();
      folders = data.folders;
    } catch (error) {
      console.error('❌ Failed to list folders:', error);
      throw error;
    }

    for (const folder of folders) {
      const prefix = folder.Prefix || '';
      const manhwaId = prefix.split('/')[0];

      if (!manhwaId || manhwaId.startsWith('.')) {
        continue;
      }

      try {
        // Проверить манхва в БД
        const { data: manhwa, error: manhwaError } = await supabase
          .from('admin_manhwa')
          .select('id')
          .eq('id', manhwaId)
          .single();

        if (manhwaError || !manhwa) {
          results.errors.push(`${manhwaId}: Manhwa not found in DB`);
          continue;
        }

        results.manhwasProcessed++;

        // Получить изображения
        const { files: manhwaFiles } = await listR2Files(`${manhwaId}/`);
        const images: any = {};

        for (const file of manhwaFiles) {
          const key = file.Key || '';
          const fileName = key.split('/').pop() || '';

          if (fileName.startsWith('cover.')) {
            images.cover = `${R2_BASE_URL}/${key}`;
          } else if (fileName.startsWith('bg.')) {
            images.bg = `${R2_BASE_URL}/${key}`;
          } else if (fileName.startsWith('char.')) {
            images.char = `${R2_BASE_URL}/${key}`;
          }
        }

        // Обновить изображения
        if (Object.keys(images).length > 0) {
          const updates: any = {};
          if (images.cover) updates.cover_image = images.cover;
          if (images.bg) updates.bg_image = images.bg;
          if (images.char) updates.char_image = images.char;

          const { error: updateError } = await supabase
            .from('admin_manhwa')
            .update(updates)
            .eq('id', manhwaId);

          if (updateError) throw updateError;

          results.imagesUpdated++;
        }

        // Получить розділы
        const { folders: chapterFolders } = await listR2Files(`${manhwaId}/chapters/`);

        for (const chapterFolder of chapterFolders) {
          const chapterPath = chapterFolder.Prefix || '';
          const chapterNumber = chapterPath.split('/')[2];

          if (!chapterNumber) continue;

          // Проверить существует ли
          const { data: existing, error: existError } = await supabase
            .from('chapters')
            .select('id')
            .eq('manhwa_id', manhwaId)
            .eq('chapter_number', parseInt(chapterNumber))
            .single();

          if (existing) {
            continue;
          }

          // Получить сторінки
          const { files: pageFiles } = await listR2Files(chapterPath);
          const pages = pageFiles
            .map((f) => f.Key || '')
            .filter((key) => key.match(/\.(jpg|jpeg|png|webp)$/i))
            .map((key) => `${R2_BASE_URL}/${key}`)
            .sort();

          if (pages.length === 0) continue;

          // Создать розділ
          const { data: chapterData, error: chapterError } = await supabase
            .from('chapters')
            .insert({
              manhwa_id: manhwaId,
              chapter_id: `${manhwaId}-${chapterNumber}`,
              chapter_number: parseInt(chapterNumber),
              title: `Розділ ${chapterNumber}`,
              description: '',
              pages_count: pages.length,
              status: 'published',
              published_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (chapterError) throw chapterError;

          results.chaptersCreated++;

          // Создать сторінки
          const pageRecords = pages.map((url, index) => {
            // Извлекаем file_path из URL
            // URL формата: https://pub-xxx.r2.dev/manhwa-id/chapters/01/01.jpg
            // file_path: manhwa-id/chapters/01/01.jpg
            const urlPath = new URL(url).pathname.replace(/^\//, '');
            
            return {
              chapter_id: chapterData.id,
              page_number: index + 1,
              image_url: url,
              file_path: urlPath,
            };
          });

          const { error: pagesError } = await supabase.from('chapter_pages').insert(pageRecords);

          if (pagesError) throw pagesError;

          results.pagesCreated += pages.length;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`   ❌ Error processing ${manhwaId}:`, errorMsg);
        results.errors.push(`${manhwaId}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.manhwasProcessed} manhwas, created ${results.chaptersCreated} chapters, ${results.pagesCreated} pages, updated ${results.imagesUpdated} images`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ [Sync] Critical error:', errorMessage);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}