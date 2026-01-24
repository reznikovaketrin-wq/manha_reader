# Reading Progress System - New Architecture

После рефакторинга система прогресса чтения полностью переработана и теперь использует современные паттерны React Query.

## 🏗️ Архитектура

### Новый модуль `lib/reading-progress/`

```
lib/reading-progress/
├── types.ts          # Единые типы и хелперы
├── api.ts           # API функции (Supabase + localStorage)  
├── queries.ts       # React Query хуки для получения данных
├── mutations.ts     # React Query мутации с optimistic updates
└── index.ts         # Централизованный экспорт
```

### Основные улучшения

✅ **Кеширование данных** - TanStack Query с настройками:
- staleTime: 2 минуты (данные актуальны)
- gcTime: 30 минут (время жизни в памяти)
- retry: 2 попытки при ошибке

✅ **Дедупликация запросов** - одинаковые запросы автоматически объединяются

✅ **Optimistic Updates** - UI обновляется мгновенно, с автоматическим rollback при ошибке

✅ **Единое хранилище** - один ключ localStorage `triw_reading_progress_v2`

✅ **Автоматический выбор источника данных**:
- Авторизованные пользователи → Supabase
- Гости → localStorage

## 📖 Как использовать

### 1. Получение прогресса чтения

```tsx
import { useReadingProgress } from '@/lib/reading-progress';

function ManhwaPage({ manhwaId }) {
  const { data: progress, isLoading } = useReadingProgress(manhwaId);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Последняя глава: {progress?.currentChapterNumber}</p>
      <p>Страница: {progress?.currentPage}</p>
    </div>
  );
}
```

### 2. Список "Продолжить чтение"

```tsx
import { useContinueReading } from '@/lib/reading-progress';

function ContinueReading() {
  const { data: items = [], isLoading } = useContinueReading({ limit: 8 });
  
  return (
    <div>
      {items.map(item => (
        <div key={item.manhwaId}>
          {item.manhwaId} - Chapter {item.currentChapterNumber}
        </div>
      ))}
    </div>
  );
}
```

### 3. Сохранение прогресса

```tsx
import { useSaveProgress } from '@/lib/reading-progress';

function ReaderPage() {
  const { mutate: saveProgress } = useSaveProgress({
    onSuccess: () => console.log('Progress saved!'),
    onError: (error) => console.error('Failed to save:', error)
  });

  const handlePageChange = (page) => {
    saveProgress({
      manhwaId: 'manhwa-123',
      chapterId: 'chapter-456', 
      chapterNumber: 42,
      pageNumber: page
    });
  };
}
```

### 4. Проверка прочитанных глав

```tsx
import { isChapterRead, createReadChaptersSet } from '@/lib/reading-progress';

function ChaptersList({ progress, chapters }) {
  const readChaptersSet = createReadChaptersSet(progress.readChapterIds);
  
  return (
    <div>
      {chapters.map(chapter => (
        <div key={chapter.id} className={
          isChapterRead(chapter.id, chapter.number, readChaptersSet, progress.archivedRanges) 
            ? 'read' : 'unread'
        }>
          Chapter {chapter.number}
        </div>
      ))}
    </div>
  );
}
```

## 🔄 Миграция данных

При входе в систему автоматически вызывается `syncLocalToSupabase()` в `UserProvider`, которая:

1. Получает данные из localStorage гостя
2. Синхронизирует их с аккаунтом пользователя в Supabase
3. Очищает локальные данные после успешной синхронизации

## 📊 Типы данных

### ReadingProgress
```typescript
interface ReadingProgress {
  manhwaId: string;
  currentChapterId: string;
  currentChapterNumber: number;
  currentPage: number;
  readChapterIds: string[];           // Недавно прочитанные главы
  archivedRanges: ArchivedRange[];    // Архивированные диапазоны для оптимизации
  startedAt: string;
  lastReadAt: string;
}
```

### ArchivedRange (оптимизация для больших списков)
```typescript
interface ArchivedRange {
  s: number; // start chapter number
  e: number; // end chapter number  
}
```

## 🗑️ Что было удалено

- ❌ `components/readinghistory/lib/services/HistoryService.ts` - заменен на React Query
- ❌ `components/readinghistory/lib/storage/` - адаптеры больше не нужны
- ❌ `components/readinghistory/lib/hooks/useHistorySync.ts` - логика в UserProvider
- ❌ Дублирующие функции из `supabase-client.ts`:
  - `getLastReadChapter()`
  - `getReadingProgress()`  
  - `saveReadingProgress()`

## ⚡ Производительность

### Раньше:
- Каждый компонент делал собственные запросы к базе
- Дублирование данных в localStorage (несколько ключей)
- Нет кеширования - повторные запросы при каждом рендере
- Race conditions при быстрых обновлениях

### Теперь:
- Единый кеш для всех компонентов
- Автоматическая дедупликация запросов  
- Optimistic updates для мгновенного отклика UI
- Debouncing для уменьшения нагрузки на сервер
- Автоматический retry при сетевых ошибках

## 🔧 Конфигурация

Настройки в `lib/reading-progress/types.ts`:

```typescript
export const READING_PROGRESS_CONFIG = {
  MAX_READ_CHAPTERS: 500,        // Лимит недавних глав в памяти
  CONTINUE_READING_LIMIT: 8,     // Элементов в "Продолжить чтение"
  SAVE_DEBOUNCE_MS: 2000,       // Задержка перед сохранением
  LOCAL_STORAGE_TTL_DAYS: 30,   // Время жизни данных гостя
};
```

## 🎯 Выводы

Новая архитектура обеспечивает:
- **Лучший UX** - мгновенные обновления, меньше загрузок
- **Надежность** - автоматический rollback, retry механизмы  
- **Производительность** - кеширование, дедупликация
- **Простоту** - меньше boilerplate кода в компонентах
- **Типобезопасность** - единые типы для всего проекта