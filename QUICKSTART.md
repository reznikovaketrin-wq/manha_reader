# 🚀 Швидкий старт

Почніть користуватися проектом за 5 хвилин!

## Крок 1: Встановлення (2 хв)

```bash
# Розпакувати проект
tar -xzf manhwa-reader.tar.gz
cd manhwa-reader

# Встановити залежності
npm install
```

## Крок 2: Налаштування (1 хв)

Створіть файл `.env.local`:

```bash
cp .env.example .env.local
```

Відкрийте `.env.local` та додайте ваш R2 URL:

```env
NEXT_PUBLIC_R2_BASE_URL=https://pub-1234567890abcdef.r2.dev
```

*Поки що залиште placeholder URL - проект працюватиме і так*

**Детальна інструкція:** [ENV-SETUP.md](ENV-SETUP.md)

## Крок 3: Запуск (30 сек)

```bash
npm run dev
```

Відкрийте http://localhost:3000 🎉

## Крок 4: Що далі?

### Варіант А: Тестування з placeholder даними
Проект уже містить 7 тестових манхв з placeholder URL. Ви можете:
- Переглянути дизайн ✅
- Протестувати навігацію ✅
- Перевірити читалку ✅
- Спробувати історію читання ✅

### Варіант Б: Додати реальні зображення
1. **Налаштувати Cloudflare R2** → [R2-SETUP.md](R2-SETUP.md)
2. **Підготувати зображення** → [LOCAL-FILES-STRUCTURE.md](LOCAL-FILES-STRUCTURE.md)
3. **Завантажити в R2** → вручну або через CLI
4. **Оновити .env.local** з реальним R2 URL
5. **Оновити data/manhwa.ts** зі шляхами до зображень

### Варіант В: Розгорнути в production
- **Vercel** (рекомендовано) → [DEPLOYMENT.md](DEPLOYMENT.md#vercel-рекомендовано)
- **Netlify** → [DEPLOYMENT.md](DEPLOYMENT.md#netlify)
- **Власний сервер** → [DEPLOYMENT.md](DEPLOYMENT.md#власний-сервер-vps)

## Структура проекту

```
manhwa-reader/
├── app/                    # Next.js сторінки
│   ├── page.tsx           # Головна
│   ├── manhwa/[id]/       # Сторінка манхви
│   └── manhwa/[id]/[chapterId]/  # Читалка
├── components/            # React компоненти
├── data/                  # Дані манхви
├── lib/                   # Утиліти
└── types/                 # TypeScript типи
```

## Основні команди

```bash
# Розробка
npm run dev          # Запустити dev-сервер (localhost:3000)

# Production
npm run build        # Побудувати для production
npm start            # Запустити production сервер

# Утиліти
npm run lint         # Перевірити код
node scripts/generate-data.js  # Генерувати data/manhwa.ts
```

## Корисні файли

| Файл | Опис |
|------|------|
| [README.md](README.md) | Загальна документація |
| [R2-SETUP.md](R2-SETUP.md) | Налаштування Cloudflare R2 |
| [LOCAL-FILES-STRUCTURE.md](LOCAL-FILES-STRUCTURE.md) | Структура зображень |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Розгортання проекту |
| [FEATURES.md](FEATURES.md) | Список всіх можливостей |
| [STYLING.md](STYLING.md) | Гайд зі стилістики |

## Налаштування даних

### Додати нову манхву

Відкрийте `data/manhwa.ts` та додайте:

```typescript
{
  id: 'my-manhwa',
  title: 'Моя Манхва',
  alternativeTitles: ['My Manhwa'],
  description: 'Опис манхви...',
  coverImage: `${R2_BASE_URL}/my-manhwa/cover.png`,
  author: 'Автор',
  artist: 'Художник',
  genres: ['Фентезі', 'Пригоди'],
  status: 'ongoing',
  rating: 8.5,
  totalViews: 0,
  updatedAt: '2024-03-20',
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'Початок',
      pages: [
        `${R2_BASE_URL}/my-manhwa/chapters/chapter-1/page-001.jpg`,
        `${R2_BASE_URL}/my-manhwa/chapters/chapter-1/page-002.jpg`,
      ],
      publishedAt: '2024-03-20',
      views: 0,
    },
  ],
}
```

### Або використайте скрипт

```bash
# 1. Створіть папку local-images/ зі структурою
# 2. Запустіть
node scripts/generate-data.js

# 3. Скопіюйте вивід в data/manhwa.ts
```

## Troubleshooting

### Проблема: npm install не працює
```bash
# Спробуйте очистити кеш
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Проблема: Порт 3000 зайнятий
```bash
# Використайте інший порт
PORT=3001 npm run dev
```

### Проблема: Зображення не завантажуються
1. Перевірте .env.local
2. Перевірте URL в data/manhwa.ts
3. Перевірте next.config.js remotePatterns

## Наступні кроки

1. ✅ Протестуйте проект локально
2. 📦 Налаштуйте Cloudflare R2
3. 🖼️ Завантажте зображення
4. 🚀 Розгорніть на Vercel
5. 🎉 Насолоджуйтесь!

---

**Потрібна допомога?** Читайте детальну документацію в [README.md](README.md)
