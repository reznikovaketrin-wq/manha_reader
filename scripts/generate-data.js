#!/usr/bin/env node

/**
 * Скрипт для генерації структури data/manhwa.ts на основі папок
 * 
 * Використання:
 * 1. Помістіть цей файл в корінь проекту як generate-data.js
 * 2. Створіть папку 'local-images' зі структурою як в LOCAL-FILES-STRUCTURE.md
 * 3. Запустіть: node generate-data.js
 * 4. Скопіюйте згенерований код в data/manhwa.ts
 */

const fs = require('fs');
const path = require('path');

const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || 'https://your-bucket.r2.dev';
const LOCAL_IMAGES_DIR = './local-images';

// Мапа для статусів
const STATUS_MAP = {
  'ongoing': 'ongoing',
  'завершено': 'completed',
  'hiatus': 'hiatus',
};

function generateManhwaData() {
  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    console.error(`❌ Папка ${LOCAL_IMAGES_DIR} не знайдена!`);
    console.log('Створіть папку local-images зі структурою як в LOCAL-FILES-STRUCTURE.md');
    return;
  }

  const manhwaDirs = fs.readdirSync(LOCAL_IMAGES_DIR)
    .filter(dir => fs.statSync(path.join(LOCAL_IMAGES_DIR, dir)).isDirectory());

  console.log(`📚 Знайдено ${manhwaDirs.length} манхви\n`);

  const manhwaArray = [];

  manhwaDirs.forEach(manhwaId => {
    const manhwaPath = path.join(LOCAL_IMAGES_DIR, manhwaId);
    const chaptersPath = path.join(manhwaPath, 'chapters');

    // Перевірити наявність обкладинки
    const hasCover = fs.existsSync(path.join(manhwaPath, 'cover.png')) || 
                     fs.existsSync(path.join(manhwaPath, 'cover.jpg'));

    if (!hasCover) {
      console.warn(`⚠️  ${manhwaId}: обкладинка не знайдена`);
    }

    // Отримати розділи
    const chapters = [];
    if (fs.existsSync(chaptersPath)) {
      const chapterDirs = fs.readdirSync(chaptersPath)
        .filter(dir => fs.statSync(path.join(chaptersPath, dir)).isDirectory())
        .sort();

      chapterDirs.forEach((chapterDir, index) => {
        const chapterPath = path.join(chaptersPath, chapterDir);
        const pages = fs.readdirSync(chapterPath)
          .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
          .sort()
          .map(file => `\${R2_BASE_URL}/${manhwaId}/chapters/${chapterDir}/${file}`);

        if (pages.length > 0) {
          chapters.push({
            id: chapterDir,
            number: index + 1,
            title: `Розділ ${index + 1}`,
            pages: pages,
            publishedAt: new Date().toISOString().split('T')[0],
            views: 0,
          });
        }
      });
    }

    console.log(`✅ ${manhwaId}: ${chapters.length} розділів, ${chapters.reduce((sum, ch) => sum + ch.pages.length, 0)} сторінок`);

    // Створити об'єкт манхви
    manhwaArray.push({
      id: manhwaId,
      title: manhwaId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      alternativeTitles: [],
      description: 'Додайте опис манхви тут',
      coverImage: `\${R2_BASE_URL}/${manhwaId}/cover.png`,
      status: 'ongoing',
      rating: 8.0,
      totalViews: 0,
      updatedAt: new Date().toISOString().split('T')[0],
      chapters: chapters,
    });
  });

  // Генерувати TypeScript код
  console.log('\n📝 Генерування коду...\n');
  console.log('='.repeat(80));
  console.log('// Скопіюйте цей код в data/manhwa.ts');
  console.log('='.repeat(80));
  console.log();
  
  console.log(`import { Manhwa } from '@/types/manhwa';

const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || '${R2_BASE_URL}';

export const manhwaData: Manhwa[] = ${JSON.stringify(manhwaArray, null, 2)
    .replace(/"(\${R2_BASE_URL}[^"]+)"/g, '`$1`')
    .replace(/: "([^"]+)"/g, ': \'$1\'')};

export function getManhwaById(id: string): Manhwa | undefined {
  return manhwaData.find(manhwa => manhwa.id === id);
}

export function getChapterByIds(manhwaId: string, chapterId: string) {
  const manhwa = getManhwaById(manhwaId);
  if (!manhwa) return undefined;
  return manhwa.chapters.find(chapter => chapter.id === chapterId);
}
`);

  console.log('='.repeat(80));
  console.log('\n✨ Готово! Не забудьте оновити назви, описи та жанри вручну.');
}

// Запустити
generateManhwaData();
