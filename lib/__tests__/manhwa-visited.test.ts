import { hasNewChapters } from '../manhwa-visited';

describe('hasNewChapters', () => {
  beforeEach(() => {
    localStorage.clear();
    // Suppress console.log in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns false when no serverDate provided', () => {
    const chapters = [
      { publishedAt: new Date().toISOString(), status: 'published' },
    ];

    expect(hasNewChapters('1', chapters, undefined)).toBe(false);
    expect(hasNewChapters('1', chapters, null)).toBe(false);
  });

  test('returns true when chapter publishedAt is after serverDate (last_read_at)', () => {
    const serverDate = '2020-01-01T00:00:00.000Z';
    const chapters = [
      { publishedAt: '2021-01-01T00:00:00.000Z', status: 'published' },
    ];

    expect(hasNewChapters('m1', chapters, serverDate)).toBe(true);
  });

  test('returns false when all chapters are older than serverDate', () => {
    const serverDate = '2022-01-01T00:00:00.000Z';
    const chapters = [
      { publishedAt: '2021-01-01T00:00:00.000Z', status: 'published' },
      { publishedAt: '2021-06-01T00:00:00.000Z', status: 'published' },
    ];

    expect(hasNewChapters('m2', chapters, serverDate)).toBe(false);
  });

  test('ignores chapters without publishedAt or not published', () => {
    const serverDate = '2020-01-01T00:00:00.000Z';
    const chapters = [
      { publishedAt: null, status: 'published' },
      { publishedAt: '2021-01-01T00:00:00.000Z', status: 'draft' },
    ];

    expect(hasNewChapters('m3', chapters, serverDate)).toBe(false);
  });

  test('ignores localStorage — only serverDate matters', () => {
    // Даже если localStorage свежее — не влияет на результат
    localStorage.setItem('manhwa_last_viewed', JSON.stringify({
      'm4': '2023-01-01T00:00:00.000Z'
    }));

    const serverDate = '2020-01-01T00:00:00.000Z'; // читал давно
    const chapters = [
      { publishedAt: '2021-01-01T00:00:00.000Z', status: 'published' }, // новее last_read
    ];

    // Раньше: baseline = MAX(localStorage 2023, server 2020) = 2023 → false
    // Теперь: baseline = server 2020 → 2021 > 2020 → true ✅ (непрочитанная глава!)
    expect(hasNewChapters('m4', chapters, serverDate)).toBe(true);
  });

  test('badge disappears only after reading new chapter (serverDate updated)', () => {
    const serverDate = '2021-06-01T00:00:00.000Z'; // прочитал новую главу
    const chapters = [
      { publishedAt: '2021-01-01T00:00:00.000Z', status: 'published' },
      { publishedAt: '2021-03-01T00:00:00.000Z', status: 'published' },
    ];

    // Все главы старше чем last_read → плашка исчезает
    expect(hasNewChapters('m5', chapters, serverDate)).toBe(false);
  });

  test('handles timezone mismatch: publishedAt without Z vs serverDate with +00:00', () => {
    // Supabase: last_read_at приходит с "+00:00", published_at без таймзоны
    const serverDate = '2026-03-19T21:08:03.669+00:00';
    const chapters = [
      { publishedAt: '2026-03-19T21:05:03.091', status: 'published' },  // older
      { publishedAt: '2026-03-19T21:05:49.195', status: 'published' },  // older
      { publishedAt: '2026-03-19T21:09:20.905', status: 'published' },  // NEWER!
    ];

    // Без фикса: "21:09:20.905" парсился как local time → UTC-2 = 19:09 < 21:08 → false
    // С фиксом: обе даты нормализованы как UTC → 21:09 > 21:08 → true ✅
    expect(hasNewChapters('tz-bug', chapters, serverDate)).toBe(true);
  });
});
