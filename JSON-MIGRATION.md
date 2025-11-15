# 🔄 Міграція на JSON підхід

## Чому мігрувати?

**Замість цього:**
```typescript
chapters: [{
  pages: [
    `${R2_BASE_URL}/manhwa/ch1/page-001.jpg`,
    `${R2_BASE_URL}/manhwa/ch1/page-002.jpg`,
    `${R2_BASE_URL}/manhwa/ch1/page-003.jpg`,
    // ... 50 разів вручну 😰
  ]
}]
```

**Пишете це:**
```json
{
  "chapters": [{
    "pagesCount": 50
  }]
}
```

**Все!** Код сам згенерує 50 URLs 🎉

---

## Міграція (2 способи)

### Спосіб 1: Простий (рекомендую)

Просто перейменувати файли:

```bash
# 1. Backup старого файлу
mv data/manhwa.ts data/manhwa-backup.ts

# 2. Перейменувати JSON версію
mv data/manhwa-from-json.ts data/manhwa.ts

# 3. Готово! Імпорти залишаються без змін
```

### Спосіб 2: Змінити imports

Замінити в 4 файлах:

**Файли для зміни:**
- `app/page.tsx`
- `app/manhwa/[id]/page.tsx`
- `components/manhwa/ContinueReading.tsx`
- `components/manhwa/ManhwaCard.tsx`

**Замінити рядок:**
```typescript
// Було:
import { manhwaData, getManhwaById } from '@/data/manhwa';

// Стало:
import { manhwaData, getManhwaById } from '@/data/manhwa-from-json';
```

---

## Після міграції

### Додати нову манхву:

Відкрийте `data/manhwa.json` та додайте:

```json
{
  "manhwa": [
    {
      "id": "solo-leveling",
      "title": "Solo Leveling",
      "alternativeTitles": ["나 혼자만 레벨업"],
      "description": "Опис вашої манхви тут...",
      "coverImage": "/solo-leveling/cover.png",
      "author": "Chugong",
      "artist": "Dubu",
      "genres": ["Екшн", "Фентезі"],
      "status": "ongoing",
      "rating": 9.5,
      "updatedAt": "2024-03-20",
      "chapters": [
        {
          "id": "chapter-1",
          "number": 1,
          "title": "Розділ 1",
          "pagesCount": 50,
          "publishedAt": "2024-01-01"
        }
      ]
    }
  ]
}
```

### Додати новий розділ:

```json
{
  "chapters": [
    {
      "id": "chapter-2",
      "number": 2,
      "title": "Розділ 2",
      "pagesCount": 48,
      "publishedAt": "2024-01-08"
    }
  ]
}
```

---

## Важливі правила

### 1. Структура файлів в R2 повинна відповідати:

```
your-bucket/
├── solo-leveling/
│   ├── cover.png
│   └── chapters/
│       ├── chapter-1/
│       │   ├── page-001.jpg
│       │   ├── page-002.jpg
│       │   └── ... до page-050.jpg
│       └── chapter-2/
│           └── page-001.jpg до page-048.jpg
```

### 2. Найменування сторінок:

Код генерує шляхи в форматі:
- `page-001.jpg`
- `page-002.jpg`
- ...
- `page-050.jpg`

**Ваші файли в R2 повинні мати такі ж імена!**

### 3. Status може бути тільки:
- `"ongoing"` - продовжується
- `"completed"` - завершено
- `"hiatus"` - на паузі

---

## Приклад повного manhwa.json

```json
{
  "manhwa": [
    {
      "id": "lycar-ta-vidma",
      "title": "Лицар та Відьма",
      "alternativeTitles": ["The Knight and the Witch"],
      "description": "Зерак — зухвала відьма, народжена з самоцвіту...",
      "coverImage": "/lycar-ta-vidma/cover.png",
      "author": "Невідомо",
      "artist": "Невідомо",
      "genres": ["Фентезі", "Романтика", "Пригоди"],
      "status": "ongoing",
      "rating": 8.9,
      "updatedAt": "2024-03-15",
      "chapters": [
        {
          "id": "chapter-1",
          "number": 1,
          "title": "Зустріч",
          "pagesCount": 10,
          "publishedAt": "2024-01-01"
        },
        {
          "id": "chapter-2",
          "number": 2,
          "title": "Подорож",
          "pagesCount": 12,
          "publishedAt": "2024-01-08"
        }
      ]
    },
    {
      "id": "another-manhwa",
      "title": "Інша Манхва",
      "alternativeTitles": [],
      "description": "Опис...",
      "coverImage": "/another-manhwa/cover.png",
      "author": "Автор",
      "artist": "Художник",
      "genres": ["Драма"],
      "status": "completed",
      "rating": 8.0,
      "updatedAt": "2024-03-20",
      "chapters": [
        {
          "id": "chapter-1",
          "number": 1,
          "title": "Початок",
          "pagesCount": 20,
          "publishedAt": "2024-02-01"
        }
      ]
    }
  ]
}
```

---

## Перевірка після міграції

```bash
# 1. Перезапустити dev-сервер
npm run dev

# 2. Відкрити http://localhost:3000
# Повинні відображатися всі манхви з manhwa.json

# 3. Перевірити консоль на помилки
# Натисніть F12 → Console
```

### Якщо помилки TypeScript:

```bash
# Очистити кеш Next.js
rm -rf .next
npm run dev
```

---

## Переваги JSON підходу

✅ **Просто:** Редагуєте JSON замість TypeScript  
✅ **Швидко:** Вказуєте `pagesCount` замість всіх URLs  
✅ **Безпечно:** TypeScript перевіряє типи  
✅ **Гнучко:** Легко експортувати/імпортувати дані  
✅ **Зручно:** Можна редагувати в будь-якому редакторі

---

**Готово!** Тепер ви можете додавати манхву просто редагуючи JSON 🎉
