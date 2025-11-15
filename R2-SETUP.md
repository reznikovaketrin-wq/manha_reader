# 📦 Cloudflare R2 - Повна інструкція

## Крок 1: Створення Cloudflare R2 Bucket

### 1.1 Реєстрація в Cloudflare
1. Перейдіть на https://dash.cloudflare.com/
2. Зареєструйтеся або увійдіть в акаунт
3. В лівому меню виберіть **R2 Object Storage**

### 1.2 Створення Bucket
1. Натисніть **Create bucket**
2. Введіть назву bucket (наприклад: `manhwa-storage`)
3. Виберіть локацію (рекомендовано: **Automatic**)
4. Натисніть **Create bucket**

## Крок 2: Налаштування публічного доступу

### 2.1 Підключення Custom Domain
1. Відкрийте ваш bucket
2. Перейдіть на вкладку **Settings**
3. Знайдіть секцію **Public Access**
4. Натисніть **Connect Domain**
5. Введіть домен (наприклад: `cdn.yourdomain.com`)
6. Або використайте автоматичний R2.dev домен

### 2.2 Отримання публічного URL
Після налаштування ви отримаєте URL типу:
```
https://pub-xxxxxxxxxxxxxxxx.r2.dev
```
або
```
https://cdn.yourdomain.com
```

**Збережіть цей URL** - він буде вашим `R2_BASE_URL`

## Крок 3: Структура папок в R2

Створіть таку структуру папок у вашому bucket:

```
manhwa-storage/
├── lycar-ta-vidma/
│   ├── cover.png                    # Обкладинка манхви
│   ├── bg.png                       # Фон для картки (опціонально)
│   ├── char.png                     # Персонаж для картки (опціонально)
│   └── chapters/
│       ├── chapter-1/
│       │   ├── page-001.jpg
│       │   ├── page-002.jpg
│       │   └── page-003.jpg
│       └── chapter-2/
│           ├── page-001.jpg
│           └── page-002.jpg
├── laboratoria-krisel-kohanna/
│   ├── cover.png
│   └── chapters/
│       └── chapter-1/
│           └── page-001.jpg
└── ... (інші манхви)
```

## Крок 4: Завантаження файлів

### Варіант 1: Через веб-інтерфейс Cloudflare

1. Відкрийте ваш bucket в Cloudflare Dashboard
2. Натисніть **Upload**
3. Перетягніть файли або виберіть через діалог
4. Файли автоматично завантажаться

### Варіант 2: Через Wrangler CLI (рекомендовано для великої кількості файлів)

```bash
# Встановити Wrangler
npm install -g wrangler

# Авторизуватися
wrangler login

# Завантажити папку
wrangler r2 object put manhwa-storage/lycar-ta-vidma/cover.png --file=./local/cover.png

# Або завантажити всю папку
wrangler r2 object put manhwa-storage/lycar-ta-vidma/ --file=./local/lycar-ta-vidma/ --recursive
```

### Варіант 3: Через AWS S3 CLI (R2 сумісний з S3)

```bash
# Налаштувати AWS CLI з R2 credentials
aws configure --profile r2

# Завантажити файл
aws s3 cp cover.png s3://manhwa-storage/lycar-ta-vidma/cover.png --profile r2 --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

## Крок 5: Оновлення проекту

### 5.1 Створіти .env.local файл

Створіть файл `.env.local` в корені проекту:

```env
# Cloudflare R2 Base URL
NEXT_PUBLIC_R2_BASE_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev

# Або якщо використовуєте custom domain:
# NEXT_PUBLIC_R2_BASE_URL=https://cdn.yourdomain.com
```

### 5.2 Оновити data/manhwa.ts

Відкрийте файл `data/manhwa.ts` та змініть:

```typescript
// Старий код:
const R2_BASE_URL = 'https://your-bucket.r2.dev';

// Новий код:
const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || 'https://your-bucket.r2.dev';
```

### 5.3 Оновити шляхи до зображень

Замініть шляхи в `data/manhwa.ts`:

```typescript
{
  id: 'lycar-ta-vidma',
  title: 'Лицар та Відьма',
  // Обкладинка
  coverImage: `${R2_BASE_URL}/lycar-ta-vidma/cover.png`,
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'Зустріч',
      pages: [
        `${R2_BASE_URL}/lycar-ta-vidma/chapters/chapter-1/page-001.jpg`,
        `${R2_BASE_URL}/lycar-ta-vidma/chapters/chapter-1/page-002.jpg`,
        `${R2_BASE_URL}/lycar-ta-vidma/chapters/chapter-1/page-003.jpg`,
      ],
      publishedAt: '2024-01-01',
      views: 0,
    },
  ],
}
```

## Крок 6: Оптимізація зображень

### Рекомендовані формати та розміри:

#### Обкладинки (covers)
- Формат: PNG або WebP
- Розмір: 600x900px (2:3 співвідношення)
- Якість: 85-90%

#### Сторінки манхви (pages)
- Формат: JPG або WebP
- Ширина: 800-1200px
- Якість: 80-85%
- Вертикальна орієнтація

#### Фон для карток (backgrounds)
- Формат: PNG або JPG
- Розмір: 1160x440px або більше
- Якість: 70-80%

## Крок 7: Тестування

### 7.1 Перевірити доступність файлів

Відкрийте в браузері:
```
https://YOUR_R2_URL/lycar-ta-vidma/cover.png
```

Якщо зображення завантажується - все працює! ✅

### 7.2 Запустити проект

```bash
npm run dev
```

Перевірте, чи відображаються зображення на сторінках.

## Крок 8: CORS налаштування (якщо потрібно)

Якщо виникають проблеми з CORS:

1. Відкрийте Cloudflare Dashboard → R2 → ваш bucket
2. Перейдіть на **Settings** → **CORS Policy**
3. Додайте правило:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Додаткові поради

### 💡 Оптимізація вартості
- R2 безкоштовно до 10 GB зберігання
- Безкоштовний egress (вихідний трафік)
- Платите тільки за операції читання/запису

### 🔒 Безпека
- Для production використовуйте custom domain
- Налаштуйте Cache-Control headers
- Використовуйте Cloudflare CDN для кешування

### 📊 Моніторинг
- Переглядайте статистику в R2 Dashboard
- Відстежуйте використання storage
- Аналізуйте requests/month

## Альтернативи R2

Якщо R2 не підходить, можна використати:
- AWS S3
- Google Cloud Storage
- Backblaze B2
- DigitalOcean Spaces

Структура проекту підтримує будь-який CDN - просто змініть `R2_BASE_URL`.

---

**Готово!** Тепер ваша манхва використовує Cloudflare R2 для зберігання зображень 🚀
