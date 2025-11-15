# 📁 Структура локальних файлів перед завантаженням в R2

## Підготовка файлів на вашому комп'ютері

Створіть таку структуру папок на вашому комп'ютері:

```
manhwa-images/
├── lycar-ta-vidma/
│   ├── cover.png
│   ├── bg.png                  # Опціонально: фон для картки
│   ├── char.png                # Опціонально: персонаж для картки
│   └── chapters/
│       ├── chapter-1/
│       │   ├── page-001.jpg
│       │   ├── page-002.jpg
│       │   ├── page-003.jpg
│       │   ├── page-004.jpg
│       │   └── ...
│       ├── chapter-2/
│       │   ├── page-001.jpg
│       │   ├── page-002.jpg
│       │   └── ...
│       └── ...
│
├── laboratoria-krisel-kohanna/
│   ├── cover.png
│   └── chapters/
│       └── chapter-1/
│           ├── page-001.jpg
│           └── page-002.jpg
│
└── ... (інші манхви)
```

## Правила найменування

### ID манхви (назва папки)
- Використовуйте ті ж ID, що в `data/manhwa.ts`
- Приклади:
  - ✅ `lycar-ta-vidma`
  - ✅ `klub-dorosloi-literatury`
  - ❌ `Лицар та Відьма` (не кирилиця)
  - ❌ `lycar ta vidma` (без пробілів)

### Обкладинки
- **cover.png** - основна обкладинка (обов'язково)
- **bg.png** - фон для великої картки на головній (опціонально)
- **char.png** - зображення персонажа (опціонально)

### Розділи
- Папки розділів: `chapter-1`, `chapter-2`, `chapter-3`, ...
- Використовуйте ті ж ID, що в `data/manhwa.ts`

### Сторінки
- Формат: `page-XXX.jpg` (де XXX - номер сторінки)
- Приклади:
  - ✅ `page-001.jpg`, `page-002.jpg`, `page-003.jpg`
  - ✅ `page-1.jpg`, `page-2.jpg` (теж працює)
  - ❌ `1.jpg`, `2.jpg` (краще додати префікс)

## Приклад повної структури для одної манхви

```
lycar-ta-vidma/
├── cover.png                      # 600x900px, PNG
├── bg.png                         # 1160x440px, PNG (фон картки)
├── char.png                       # PNG з прозорим фоном (персонаж)
└── chapters/
    ├── chapter-1/
    │   ├── page-001.jpg          # 800-1200px ширина
    │   ├── page-002.jpg
    │   ├── page-003.jpg
    │   ├── page-004.jpg
    │   ├── page-005.jpg
    │   ├── page-006.jpg
    │   ├── page-007.jpg
    │   ├── page-008.jpg
    │   ├── page-009.jpg
    │   └── page-010.jpg
    ├── chapter-2/
    │   ├── page-001.jpg
    │   ├── page-002.jpg
    │   ├── page-003.jpg
    │   ├── page-004.jpg
    │   ├── page-005.jpg
    │   └── page-006.jpg
    └── chapter-3/
        ├── page-001.jpg
        ├── page-002.jpg
        ├── page-003.jpg
        └── page-004.jpg
```

## Чеклист перед завантаженням

### ✅ Обкладинки
- [ ] Розмір 600x900px або подібне співвідношення 2:3
- [ ] Формат PNG або WebP
- [ ] Якість 85-90%
- [ ] Розмір файлу < 500KB

### ✅ Сторінки манхви
- [ ] Вертикальна орієнтація
- [ ] Ширина 800-1200px
- [ ] Формат JPG або WebP
- [ ] Якість 80-85%
- [ ] Розмір файлу < 1MB кожна

### ✅ Структура
- [ ] Папки названі правильно (як ID в data/manhwa.ts)
- [ ] Сторінки пронумеровані по порядку
- [ ] Всі файли на місці

## Оптимізація зображень

### Використання ImageMagick (CLI)

```bash
# Зменшити розмір обкладинки
convert cover.png -resize 600x900 -quality 90 cover.png

# Оптимізувати сторінки манхви
for file in chapters/chapter-1/*.jpg; do
  convert "$file" -resize 1000x -quality 85 "$file"
done
```

### Використання онлайн-сервісів

- **TinyPNG** - https://tinypng.com/ (для PNG)
- **Squoosh** - https://squoosh.app/ (universal)
- **ImageOptim** - https://imageoptim.com/ (Mac)

## Швидке завантаження всіх файлів

### Варіант 1: Wrangler CLI (рекомендовано)

```bash
# З корня вашої папки manhwa-images/
cd manhwa-images

# Завантажити всю манхву
wrangler r2 object put manhwa-storage/lycar-ta-vidma --file=./lycar-ta-vidma --recursive
```

### Варіант 2: Rclone (для багатьох файлів)

```bash
# Налаштувати rclone для R2
rclone config

# Синхронізувати папку
rclone sync ./manhwa-images/ r2:manhwa-storage/
```

### Варіант 3: Веб-інтерфейс

1. Заходите в Cloudflare Dashboard → R2 → ваш bucket
2. Drag & drop папки прямо в браузер
3. Файли завантажаться автоматично

## Після завантаження

1. Перевірте, що всі файли доступні:
   ```
   https://YOUR_R2_URL/lycar-ta-vidma/cover.png
   https://YOUR_R2_URL/lycar-ta-vidma/chapters/chapter-1/page-001.jpg
   ```

2. Оновіть `data/manhwa.ts` з правильними шляхами

3. Запустіть `npm run dev` та перевірте сайт

---

**Готово!** Тепер ваші зображення готові до завантаження в R2 🎉
