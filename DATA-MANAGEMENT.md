# 🔄 Як управляти даними манхви

## Питання: Треба редагувати код кожного разу?

**Коротка відповідь:** Зараз - так. Але є 3 кращі рішення! ⬇️

---

## 📊 Порівняння підходів

| Підхід | Складність | Гнучкість | Коли використовувати |
|--------|-----------|----------|---------------------|
| **Вручну в .ts** | 😰 Складно | ⭐ Низька | Тестування, 1-5 манхв |
| **Скрипт generate** | 😊 Легко | ⭐⭐ Середня | 5-50 манхв |
| **JSON файл** | 😌 Дуже легко | ⭐⭐⭐ Висока | 50+ манхв |
| **База даних** | 🤓 Професійно | ⭐⭐⭐⭐ Найвища | Production |

---

## Варіант 1: Вручну (поточний) ❌

### Як зараз:

```typescript
// data/manhwa.ts
coverImage: `${R2_BASE_URL}/new-manhwa/cover.png`,
chapters: [{
  pages: [
    `${R2_BASE_URL}/new-manhwa/chapters/chapter-1/page-001.jpg`,
    `${R2_BASE_URL}/new-manhwa/chapters/chapter-1/page-002.jpg`,
    `${R2_BASE_URL}/new-manhwa/chapters/chapter-1/page-003.jpg`,
    // ... кожна сторінка вручну 😰
  ]
}]
```

### Мінуси:
- ❌ Треба писати кожен URL вручну
- ❌ Легко зробити помилку в шляху
- ❌ Довго для багатьох сторінок
- ❌ Треба rebuild при кожній зміні

---

## Варіант 2: Скрипт generate-data.js ✅ (РЕКОМЕНДУЮ)

### Як працює:

```bash
# 1. Створити папку з зображеннями локально
local-images/
├── new-manhwa/
│   ├── cover.png
│   └── chapters/
│       └── chapter-1/
│           ├── page-001.jpg
│           ├── page-002.jpg
│           └── page-003.jpg

# 2. Запустити скрипт
node scripts/generate-data.js

# 3. Скрипт автоматично:
# - Знайде всі манхви в local-images/
# - Порахує розділи
# - Порахує сторінки
# - Згенерує правильні шляхи

# 4. Вивід готового коду → скопіювати в data/manhwa.ts
```

### Приклад виводу:

```typescript
export const manhwaData: Manhwa[] = [
  {
    id: 'new-manhwa',
    title: 'New Manhwa',
    coverImage: `${R2_BASE_URL}/new-manhwa/cover.png`,
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Розділ 1',
        pages: [
          `${R2_BASE_URL}/new-manhwa/chapters/chapter-1/page-001.jpg`,
          `${R2_BASE_URL}/new-manhwa/chapters/chapter-1/page-002.jpg`,
          `${R2_BASE_URL}/new-manhwa/chapters/chapter-1/page-003.jpg`,
        ],
        // ... автоматично згенеровано!
      }
    ]
  }
];
```

### Плюси:
- ✅ Автоматична генерація всіх шляхів
- ✅ Не треба писати вручну
- ✅ Мінімум помилок
- ✅ Швидко для 5-50 манхв

### Мінуси:
- ⚠️ Все одно треба копіювати код в manhwa.ts
- ⚠️ Треба rebuild після змін

---

## Варіант 3: JSON файл ✅✅ (НАЙКРАЩЕ)

### Структура:

```json
{
  "manhwa": [
    {
      "id": "new-manhwa",
      "title": "Нова Манхва",
      "coverImage": "/new-manhwa/cover.png",
      "chapters": [
        {
          "id": "chapter-1",
          "number": 1,
          "title": "Розділ 1",
          "pagesCount": 10
        }
      ]
    }
  ]
}
```

### Код автоматично генерує шляхи:

```typescript
// data/manhwa-from-json.ts
function generatePageUrls(manhwaId: string, chapterId: string, pagesCount: number) {
  const pages = [];
  for (let i = 1; i <= pagesCount; i++) {
    const pageNum = String(i).padStart(3, '0');
    pages.push(`${R2_BASE_URL}/${manhwaId}/chapters/${chapterId}/page-${pageNum}.jpg`);
  }
  return pages;
}
```

### Як додати нову манхву:

1. Відкрити `data/manhwa.json`
2. Додати об'єкт:
```json
{
  "id": "my-new-manhwa",
  "title": "Моя Нова Манхва",
  "coverImage": "/my-new-manhwa/cover.png",
  "chapters": [
    {
      "id": "chapter-1",
      "number": 1,
      "title": "Початок",
      "pagesCount": 15
    }
  ]
}
```
3. Зберегти
4. Перезапустити dev-сервер

**Все!** Шляхи генеруються автоматично.

### Плюси:
- ✅✅ Просто редагувати (JSON простіше за TypeScript)
- ✅✅ Автоматична генерація всіх URL
- ✅✅ Вказуєте тільки `pagesCount`, а не всі сторінки
- ✅✅ Легко експортувати/імпортувати
- ✅✅ Можна навіть редагувати онлайн

### Як перейти на JSON:

```bash
# 1. Замінити import в потрібних файлах
# Було:
# import { manhwaData } from '@/data/manhwa'

# Стало:
# import { manhwaData } from '@/data/manhwa-from-json'

# 2. Редагувати data/manhwa.json замість manhwa.ts
```

---

## Варіант 4: База даних 🚀 (Production)

Для великих проектів використовуйте БД:

### PostgreSQL + Prisma:

```prisma
model Manhwa {
  id          String    @id
  title       String
  coverImage  String
  chapters    Chapter[]
}

model Chapter {
  id          String   @id
  number      Int
  pagesCount  Int
  manhwaId    String
  manhwa      Manhwa   @relation(fields: [manhwaId])
}
```

### API endpoints:

```typescript
// app/api/manhwa/route.ts
export async function GET() {
  const manhwa = await prisma.manhwa.findMany({
    include: { chapters: true }
  });
  return Response.json(manhwa);
}
```

### Плюси:
- ✅✅✅ Динамічні дані
- ✅✅✅ Можна додавати через admin панель
- ✅✅✅ Масштабується до мільйонів записів
- ✅✅✅ Пошук, фільтри, сортування

### Мінуси:
- ⚠️ Потрібна БД (PostgreSQL, MongoDB)
- ⚠️ Більше коду
- ⚠️ Hosting повинен підтримувати БД

---

## 🎯 Що вибрати?

### Для вашого проекту зараз:

**Рекомендую Варіант 3 (JSON)** ✅

Чому:
1. Легко додавати нові манхви (просто JSON)
2. Автоматична генерація шляхів
3. Вказуєте `pagesCount: 10` замість 10 URLs
4. Не треба rebuild при додаванні даних

### Швидка міграція на JSON:

**Крок 1:** Замінити imports в 4 файлах:

```bash
# app/page.tsx
# app/manhwa/[id]/page.tsx  
# components/manhwa/ContinueReading.tsx
# components/manhwa/ManhwaCard.tsx
```

**Крок 2:** Замінити рядок:

```typescript
// Було:
import { manhwaData, getManhwaById } from '@/data/manhwa';

// Стало:
import { manhwaData, getManhwaById } from '@/data/manhwa-from-json';
```

**Крок 3:** Перезапустити dev-сервер:

```bash
# Зупинити (Ctrl+C)
# Запустити знову
npm run dev
```

**Готово!** Тепер редагуєте тільки `data/manhwa.json` 🎉

### Альтернативний спосіб (без зміни imports):

Просто перейменувати файли:

```bash
# Зберегти старий manhwa.ts як backup
mv data/manhwa.ts data/manhwa-old.ts

# Перейменувати JSON версію
mv data/manhwa-from-json.ts data/manhwa.ts

# Готово! Нічого не міняти в imports
```

---

## 📝 Приклад додавання манхви (JSON підхід)

### data/manhwa.json:

```json
{
  "manhwa": [
    {
      "id": "solo-leveling",
      "title": "Solo Leveling",
      "alternativeTitles": ["나 혼자만 레벨업"],
      "description": "Опис манхви...",
      "coverImage": "/solo-leveling/cover.png",
      "author": "Chugong",
      "artist": "Dubu",
      "genres": ["Екшн", "Фентезі"],
      "status": "completed",
      "rating": 9.5,
      "updatedAt": "2024-03-20",
      "chapters": [
        {
          "id": "chapter-1",
          "number": 1,
          "title": "Я один качаю левел",
          "pagesCount": 50,
          "publishedAt": "2024-01-01"
        },
        {
          "id": "chapter-2",
          "number": 2,
          "title": "Друга глава",
          "pagesCount": 48,
          "publishedAt": "2024-01-08"
        }
      ]
    }
  ]
}
```

**Код автоматично згенерує 98 URLs (50 + 48 сторінок)!**

---

## 🛠️ Готові файли в проекті:

- `data/manhwa.json` - приклад JSON структури ✅
- `data/manhwa-from-json.ts` - функції для роботи з JSON ✅
- `types/manhwa-json.ts` - TypeScript типи ✅

**Залишилось тільки замінити imports!** 🎉

---

## Підсумок

| Що хочете | Рішення |
|-----------|---------|
| Швидко протестувати | Залиште як є (manhwa.ts) |
| 5-50 манхв | Скрипт `generate-data.js` |
| 50+ манхв | JSON файл (manhwa.json) |
| Production проект | База даних (PostgreSQL) |

**Мій вибір для вас:** JSON файл 🏆
