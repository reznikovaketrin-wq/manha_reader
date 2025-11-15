# 🚀 Розгортання проекту

Інструкції по розгортанню manhwa-reader на різних платформах.

## Vercel (рекомендовано)

### Чому Vercel?
- ✅ Створений командою Next.js
- ✅ Безкоштовний для особистих проектів
- ✅ Автоматичні деплої з GitHub
- ✅ Глобальний CDN
- ✅ Налаштування за 2 хвилини

### Крок 1: Підготовка

1. Переконайтеся, що проект на GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/manhwa-reader.git
git push -u origin main
```

2. Створіть файл `.env.local` (НЕ пушити в Git!):
```env
NEXT_PUBLIC_R2_BASE_URL=https://your-r2-url.r2.dev
```

### Крок 2: Розгортання на Vercel

1. Перейдіть на https://vercel.com
2. Натисніть **Add New** → **Project**
3. Імпортуйте ваш GitHub репозиторій
4. Налаштування:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (корінь)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Додайте Environment Variables:
   - Key: `NEXT_PUBLIC_R2_BASE_URL`
   - Value: `https://your-r2-url.r2.dev`

6. Натисніть **Deploy**

### Крок 3: Перевірка

Після деплою (2-3 хвилини) ваш сайт буде доступний за URL:
```
https://your-project.vercel.app
```

### Автоматичні оновлення

Кожен push в GitHub автоматично деплоїться на Vercel! 🎉

---

## Netlify

### Крок 1: Підготовка

1. Створіть `netlify.toml` в корені проекту:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. Встановіть плагін:
```bash
npm install -D @netlify/plugin-nextjs
```

### Крок 2: Розгортання

1. Перейдіть на https://netlify.com
2. Натисніть **Add new site** → **Import from Git**
3. Виберіть ваш GitHub репозиторій
4. Налаштування:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

5. Додайте Environment Variables:
   - Key: `NEXT_PUBLIC_R2_BASE_URL`
   - Value: `https://your-r2-url.r2.dev`

6. Натисніть **Deploy**

---

## Власний сервер (VPS)

### Використовуючи PM2

1. **Встановити Node.js на сервері:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Встановити PM2:**
```bash
sudo npm install -g pm2
```

3. **Завантажити проект:**
```bash
git clone https://github.com/USERNAME/manhwa-reader.git
cd manhwa-reader
npm install
```

4. **Створити .env.local:**
```bash
echo "NEXT_PUBLIC_R2_BASE_URL=https://your-r2-url.r2.dev" > .env.local
```

5. **Побудувати проект:**
```bash
npm run build
```

6. **Запустити з PM2:**
```bash
pm2 start npm --name "manhwa-reader" -- start
pm2 save
pm2 startup
```

7. **Налаштувати Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Docker

### Dockerfile

Створіть `Dockerfile` в корені:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  manhwa-reader:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_R2_BASE_URL=https://your-r2-url.r2.dev
    restart: unless-stopped
```

### Запуск

```bash
docker-compose up -d
```

---

## Оптимізація для production

### 1. Налаштування next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Оптимізація
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
```

### 2. Cloudflare налаштування

У Cloudflare Dashboard для вашого домену:
- Увімкніть **Auto Minify** (JS, CSS, HTML)
- Увімкніть **Brotli**
- Налаштуйте **Cache Rules**
- Увімкніть **Rocket Loader**

### 3. R2 Cache-Control

Встановіть headers для R2 файлів:
```
Cache-Control: public, max-age=31536000, immutable
```

---

## Моніторинг та аналітика

### Google Analytics

1. Створіть GA4 property
2. Додайте в `app/layout.tsx`:

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## Troubleshooting

### Проблема: Зображення не завантажуються

**Рішення:**
1. Перевірте CORS в R2
2. Перевірте `next.config.js` remotePatterns
3. Перевірте URL в .env.local

### Проблема: Build fails on Vercel

**Рішення:**
1. Перевірте Node.js версію (18+)
2. Очистіть кеш: Settings → Clear Cache → Redeploy
3. Перевірте Environment Variables

### Проблема: localStorage не працює

**Рішення:**
1. localStorage працює тільки на клієнті
2. Використовуйте 'use client' в компонентах
3. Перевірте SSR/CSR

---

**Готово!** Ваш сайт тепер в production 🚀
