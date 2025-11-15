# 🔧 Налаштування .env.local

## Крок 1: Створити файл

```bash
# Скопіюйте .env.example в .env.local
cp .env.example .env.local
```

## Крок 2: Додати ваш R2 URL

Відкрийте `.env.local` та додайте URL вашого R2 bucket:

```env
NEXT_PUBLIC_R2_BASE_URL=https://pub-1234567890abcdef.r2.dev
```

### Де взяти R2 URL?

1. **Після створення bucket в Cloudflare:**
   - Відкрийте ваш bucket
   - Settings → Public Access
   - Скопіюйте R2.dev URL

2. **Або якщо налаштували custom domain:**
   ```env
   NEXT_PUBLIC_R2_BASE_URL=https://cdn.yourdomain.com
   ```

## Крок 3: Перевірити

Перезапустіть dev-сервер:

```bash
npm run dev
```

URL з `.env.local` автоматично використовується в `data/manhwa.ts` 🎉

## Важливо! ⚠️

- `.env.local` НЕ повинен бути в Git (вже в .gitignore)
- Для production додайте змінну в Vercel/Netlify Environment Variables
- Префікс `NEXT_PUBLIC_` обов'язковий для доступу в браузері

## Troubleshooting

### Зображення не завантажуються?

1. Перевірте `.env.local`:
   ```bash
   cat .env.local
   ```

2. Перевірте консоль браузера (F12) на помилки

3. Перевірте, що R2 URL публічний та доступний

### Змінна не підхоплюється?

```bash
# Очистити Next.js кеш
rm -rf .next
npm run dev
```

---

**Готово!** Тепер ваші зображення завантажуються з Cloudflare R2 ✅
