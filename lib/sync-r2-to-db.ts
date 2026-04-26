/**
 * 📁 /lib/sync-r2-to-db.ts
 * 
 * 🔄 СИНХРОНИЗАЦИЯ ДАННЫХ С R2 В БД
 * 
 * Что делает:
 * 1. Сканирует структуру на R2
 * 2. Находит папки манхв
 * 3. Обновляет cover_image, bg_image, char_image в БД
 * 4. Создает розділы из папок chapters
 * 5. Создает сторінки из изображений сторінок
 */

import { getSupabaseAdmin, getSupabaseAnon, getSupabaseWithToken } from '@/lib/supabase-server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const supabase = getSupabaseAdmin();

const s3Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || 'https://pub-b35d07798729484a8ec5726e07894f8e.r2.dev';
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'manhwa-reader';

/**
 * 📋 Получить все файлы с R2
 */
async function listR2Files(prefix: string = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    });

    const response = await s3Client.send(command);
    return {
      files: response.Contents || [],
      folders: response.CommonPrefixes || [],
    };
  } catch (error) {
    console.error('❌ Ошибка при чтении R2:', error);
    return { files: [], folders: [] };
  }
}

/**
 * 📂 Получить все папки манхв на R2
 */
async function getManhwaFoldersFromR2() {
  if (process.env.NODE_ENV !== 'production') {
  }

  const { folders } = await listR2Files();
  const manhwaFolders: string[] = [];

  for (const folder of folders) {
    const prefix = folder.Prefix || '';
    const manhwaId = prefix.split('/')[0];

    if (manhwaId && !manhwaId.startsWith('.')) {
      manhwaFolders.push(manhwaId);
      if (process.env.NODE_ENV !== 'production') {
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
  }
  return manhwaFolders;
}

/**
 * 🖼️ Получить ссылки на изображения манхвы
 */
async function getImageUrlsForManhwa(manhwaId: string) {
  const images = {
    cover: '',
    bg: '',
    char: '',
  };

  const { files } = await listR2Files(`${manhwaId}/`);

  for (const file of files) {
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

  return images;
}

/**
 * 📖 Получить розділы манхвы с R2
 */
async function getChaptersForManhwaFromR2(manhwaId: string) {
  const chapters: { number: string; pages: string[] }[] = [];

  const { folders } = await listR2Files(`${manhwaId}/chapters/`);

  for (const folder of folders) {
    const chapterPath = folder.Prefix || '';
    const chapterNumber = chapterPath.split('/')[2]; // chapters/{number}/

    if (chapterNumber) {
      // Получить сторінки
      const { files } = await listR2Files(chapterPath);
      const pages = files
        .map((f) => f.Key || '')
        .filter((key) => key.match(/\.(jpg|jpeg|png|webp)$/i))
        .map((key) => `${R2_BASE_URL}/${key}`)
        .sort();

      if (pages.length > 0) {
        chapters.push({
          number: chapterNumber,
          pages,
        });
      }
    }
  }

  return chapters.sort((a, b) => parseInt(a.number) - parseInt(b.number));
}

/**
 * ✅ Обновить изображения манхвы в БД
 */
async function updateManhwaImages(manhwaId: string, images: { cover: string; bg: string; char: string }) {
  try {
    const updates: any = {};
    if (images.cover) updates.cover_image = images.cover;
    if (images.bg) updates.bg_image = images.bg;
    if (images.char) updates.char_image = images.char;

    if (Object.keys(updates).length === 0) {
      if (process.env.NODE_ENV !== 'production') {
      }
      return;
    }

    const { error } = await supabase
      .from('admin_manhwa')
      .update(updates)
      .eq('id', manhwaId);

    if (error) throw error;

    if (process.env.NODE_ENV !== 'production') {
    }
  } catch (error) {
    console.error(`   ❌ Ошибка обновления ${manhwaId}:`, error);
  }
}

/**
 * 📚 Создать розділы в БД
 */
async function createChaptersInDB(manhwaId: string, chapters: { number: string; pages: string[] }[]) {
  if (process.env.NODE_ENV !== 'production') {
  }

  for (const chapter of chapters) {
    try {
      // Проверить существует ли уже
      const { data: existing } = await supabase
        .from('chapters')
        .select('id')
        .eq('manhwa_id', manhwaId)
        .eq('chapter_number', parseInt(chapter.number))
        .single();

      if (existing) {
        if (process.env.NODE_ENV !== 'production') {
        }
        continue;
      }

      // Создать розділ
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          manhwa_id: manhwaId,
          chapter_id: `${manhwaId}-${chapter.number}`,
          chapter_number: parseInt(chapter.number),
          title: `Розділ ${chapter.number}`,
          description: '',
          pages_count: chapter.pages.length,
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      if (process.env.NODE_ENV !== 'production') {
      }

      // Создать сторінки
      const pages = chapter.pages.map((url, index) => ({
        chapter_id: chapterData.id,
        page_number: index + 1,
        image_url: url,
      }));

      const { error: pagesError } = await supabase.from('chapter_pages').insert(pages);

      if (pagesError) throw pagesError;

      if (process.env.NODE_ENV !== 'production') {
      }
    } catch (error) {
      console.error(`      ❌ Ошибка создания розділа ${chapter.number}:`, error);
    }
  }
}

/**
 * 🔄 ГЛАВНАЯ ФУНКЦИЯ - Полная синхронизация
 */
export async function syncR2ToDatabase() {
  if (process.env.NODE_ENV !== 'production') {
  }

  try {
    // 1. Получить папки манхв на R2
    const manhwaFolders = await getManhwaFoldersFromR2();

    if (manhwaFolders.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
      }
      return;
    }

    // 2. Для каждой папки манхвы
    for (const manhwaId of manhwaFolders) {
      if (process.env.NODE_ENV !== 'production') {
      }

      // Проверить существует ли манхва в БД
      const { data: manhwa } = await supabase
        .from('admin_manhwa')
        .select('id')
        .eq('id', manhwaId)
        .single();

      if (!manhwa) {
        if (process.env.NODE_ENV !== 'production') {
        }
        continue;
      }

      // 3. Получить изображения
      const images = await getImageUrlsForManhwa(manhwaId);
      await updateManhwaImages(manhwaId, images);

      // 4. Получить розділы с R2
      const chapters = await getChaptersForManhwaFromR2(manhwaId);

      if (chapters.length > 0) {
        // 5. Создать розділы в БД
        await createChaptersInDB(manhwaId, chapters);
      } else {
        if (process.env.NODE_ENV !== 'production') {
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
    }
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// 📝 ИСПОЛЬЗОВАНИЕ:
/*
В консоли браузера:

import { syncR2ToDatabase } from '@/lib/sync-r2-to-db';
await syncR2ToDatabase();

Или на сервере в route:
*/

export async function syncHandler(request: any) {
  try {
    await syncR2ToDatabase();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Sync failed' }), { status: 500 });
  }
}