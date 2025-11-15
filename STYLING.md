# 🎨 Керівництво зі стилістики

Цей документ описує, як стилістика з HTML-прикладу реалізована в Next.js проекті.

## Шрифт Manrope

```tsx
// app/layout.tsx
import { Manrope } from 'next/font/google';

const manrope = Manrope({ 
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '800'],
  variable: '--font-manrope',
});
```

## Кольори

```css
/* tailwind.config.js */
colors: {
  'page-bg': '#111111',      /* Фон сторінки */
  'card-bg': '#111111',       /* Фон картки */
  'card-hover': '#141414',    /* Фон картки при hover */
  'text-main': '#ffffff',     /* Основний текст */
  'text-muted': '#d6d6d6',    /* Приглушений текст */
}
```

## Картки манхви

### HTML приклад:
```css
.title-card {
  height: 440px;
  background: #111111;
  background-position: center right;
  background-size: cover;
}

.title-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.8);
  background-color: #141414;
}
```

### Next.js реалізація:
```tsx
<section className="
  h-[440px] 
  bg-card-bg 
  hover:-translate-y-0.5 
  hover:shadow-[0_18px_40px_rgba(0,0,0,0.8)]
  hover:bg-card-hover
">
```

## Персонаж поверх фону

### HTML:
```css
.title-card__art {
  position: absolute;
  top: -40px;
  right: 0;
  width: 50%;
  height: 120%;
  background-size: contain;
  background-position: top right;
  pointer-events: none;
  z-index: 1;
}
```

### Next.js:
```tsx
<div className="
  absolute 
  top-[-39px] 
  right-0 
  w-[50%] 
  h-[109%]
  bg-contain 
  bg-top-right
  pointer-events-none 
  z-[1]
"/>
```

## Типографіка

### Статуси:
```tsx
<div className="
  text-[20px]           /* 20px розмір */
  font-medium           /* font-weight: 500 */
  uppercase             /* text-transform: uppercase */
  tracking-tight-2      /* letter-spacing: -0.02em */
  gap-[90px]            /* відстань між статусами */
">
```

### Заголовки:
```tsx
<h2 className="
  text-[70px]           /* 70px розмір */
  font-extrabold        /* font-weight: 800 */
  uppercase
  tracking-tight-2      /* letter-spacing: -0.02em */
  leading-none          /* line-height: 1 */
  whitespace-nowrap     /* не переносить */
  overflow-visible      /* показувати все */
">
```

## Адаптивність

### Брейкпоінти:
- `md:` - до 900px (планшет)
- `sm:` - до 640px (мобільний)

### Приклад:
```tsx
<h2 className="
  text-[70px]          /* Desktop */
  md:text-[44px]       /* Tablet */
  sm:text-[32px]       /* Mobile */
">
```

## Header

### HTML:
```css
.header {
  display: flex;
  gap: 18px;
  padding: 14px 18px;
}

.logo-img {
  height: 100px;
}

.logo-sub {
  font-size: 30px;
  font-weight: 800;
  margin-top: 38px;
}
```

### Next.js:
```tsx
<header className="flex items-center gap-[18px] px-[18px] py-[14px]">
  <div className="h-[100px] w-[100px]">...</div>
  <div className="text-[30px] font-extrabold mt-[38px]">
    Бібліотека
  </div>
</header>
```

## Ключові відмінності від звичайного Tailwind

1. **Точні розміри**: використовуємо `text-[70px]` замість `text-7xl`
2. **Точні відступи**: використовуємо `gap-[90px]` замість стандартних значень
3. **Кастомні кольори**: `bg-page-bg`, `text-text-main` замість `bg-gray-900`
4. **Letter-spacing**: додано `tracking-tight-2` (-0.02em)

## Як додати нову картку

1. Додайте дані в `data/manhwa.ts`
2. Компонент `ManhwaCard` автоматично застосує правильну стилістику
3. Переконайтеся, що у вас є:
   - `coverImage` - фонове зображення
   - `title` - заголовок (буде uppercase)
   - `description` - опис
   - `status` - статус (ongoing/completed/hiatus)
