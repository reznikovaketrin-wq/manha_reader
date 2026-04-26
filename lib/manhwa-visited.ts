/**
 * lib/manhwa-visited.ts
 *
 * Зберігає час останнього перегляду сторінки манхви.
 * Використовується для розрахунку "чи є нові глави з останнього відвідування".
 *
 * Схема localStorage:
 *   key:   'manhwa_last_viewed'
 *   value: JSON Record<manhwaId, ISO-string>
 */

const LS_KEY = 'manhwa_last_viewed';

function getAll(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Повернути дату останнього перегляду сторінки манхви (або null якщо не переглядали) */
export function getLastVisited(manhwaId: string): Date | null {
  const all = getAll();
  return all[manhwaId] ? new Date(all[manhwaId]) : null;
}

/** Зберегти поточний час як "останній перегляд" для манхви */
export function markManhwaVisited(manhwaId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAll();
    all[manhwaId] = new Date().toISOString();
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

/**
 * Перевірити чи є нові розділи з часу останнього відвідування.
 *
 * Базова дата = MAX(localStorage, serverDate) — беремо найновіший момент.
 * Так сервер (Supabase last_read_at) завжди враховується, а не є лише запасним:
 *   - Читав на іншому пристрої → Supabase дата новіша → вона і є baseline
 *   - Заходив на сторінку без читання → localStorage новіший → він і є baseline
 *
 * @param manhwaId   - ID манхви
 * @param chapters   - масив розділів з полем publishedAt
 * @param serverDate - дата з Supabase (last_read_at з reading_history / reading_progress)
 */
/**
 * Нормалізувати дату: якщо рядок не містить таймзону — вважаємо UTC.
 * Supabase timestamp without time zone повертає "2026-03-19T21:09:20.905"
 * без 'Z', і JS парсить це як локальний час → зсув на годинний пояс.
 */
function parseUTC(dateStr: string): Date {
  // Якщо вже є 'Z' або зміщення (+03:00 / -05:00 / +00:00) — парсимо як є
  if (/Z$/i.test(dateStr) || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  // Інакше — додаємо 'Z' щоб трактувати як UTC
  return new Date(dateStr + 'Z');
}

/**
 * Перевірити чи є нові розділи з часу останнього ПРОЧИТАННЯ.
 *
 * Використовує ТІЛЬКИ серверну дату (Supabase last_read_at) як baseline.
 * 
 * Чому не localStorage:
 *   localStorage зберігає "коли відкривав сторінку манхви", а не "коли читав".
 *   Якщо юзер зайшов на сторінку → побачив нову главу → пішов до бібліотеки,
 *   localStorage вже оновився і плашка зникає, хоча глава не прочитана.
 *   
 *   Supabase last_read_at = "остання прочитана глава" → це надійний baseline.
 *   Плашка зникне тільки коли юзер ПРОЧИТАЄ нову главу.
 *
 * @param manhwaId   - ID манхви
 * @param chapters   - масив розділів з полем publishedAt
 * @param serverDate - дата з Supabase (last_read_at з reading_progress)
 */
export function hasNewChapters(
  manhwaId: string,
  chapters: Array<{ publishedAt?: string | null; status?: string }>,
  serverDate?: string | null
): boolean {
  const baseline = serverDate ? parseUTC(serverDate) : null;

  // Немає базової дати — не показуємо плашку (уникаємо помилкових спрацьовувань)
  if (!baseline) {
    return false;
  }

  // Знайти глави новіші за baseline
  const newChapters = chapters.filter((ch) => {
    if (!ch.publishedAt) return false;
    if (ch.status && ch.status !== 'published') return false;
    return parseUTC(ch.publishedAt) > baseline;
  });

  return newChapters.length > 0;
}
