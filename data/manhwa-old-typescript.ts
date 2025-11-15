import { Manhwa } from '@/types/manhwa';

// Отримати URL з environment змінної або використати placeholder
const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || 'https://your-bucket.r2.dev';

export const manhwaData: Manhwa[] = [
  {
    id: 'lycar-ta-vidma',
    title: 'Лицар та Відьма',
    alternativeTitles: ['The Knight and the Witch'],
    description: 'Зерак — зухвала відьма, народжена з самоцвіту. Її стиль не вписується в суворі традиції, тож вона вирушає в мандри, де зустрічає чоловіків, здатних змінити її долю.',
    coverImage: `${R2_BASE_URL}/lycar-ta-vidma/cover.png`,
    author: 'Невідомо',
    artist: 'Невідомо',
    genres: ['Фентезі', 'Романтика', 'Пригоди'],
    status: 'ongoing',
    rating: 8.9,
    totalViews: 125000,
    updatedAt: '2024-03-15',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Зустріч',
        pages: [
          `${R2_BASE_URL}/lycar-ta-vidma/chapter-1/page-1.jpg`,
          `${R2_BASE_URL}/lycar-ta-vidma/chapter-1/page-2.jpg`,
        ],
        publishedAt: '2024-01-01',
        views: 5000,
      },
    ],
  },
  {
    id: 'laboratoria-krisel-kohanna',
    title: 'Лабораторія крісел кохання',
    alternativeTitles: ['Laboratory of Love Chairs'],
    description: 'Особливість «Лабораторії крісел кохання» в тому, що співробітники занурюються в ілюзії, досліджуючи межі власних почуттів і бажань.',
    coverImage: `${R2_BASE_URL}/laboratoria/cover.png`,
    author: 'Невідомо',
    artist: 'Невідомо',
    genres: ['Психологія', 'Фентезі', 'Романтика'],
    status: 'completed',
    rating: 9.1,
    totalViews: 98000,
    updatedAt: '2024-03-10',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Перше крісло',
        pages: [
          `${R2_BASE_URL}/laboratoria/chapter-1/page-1.jpg`,
        ],
        publishedAt: '2024-02-01',
        views: 4000,
      },
    ],
  },
  {
    id: 'klub-dorosloi-literatury',
    title: 'Клуб дорослої літератури',
    alternativeTitles: ['Adult Literature Club'],
    description: 'Першокурсниця Хоїн вступає до книжкового клубу, де начебто достатньо просто читати вголос. Але дуже швидко вона розуміє, що обрана література — зовсім не невинна.',
    coverImage: `${R2_BASE_URL}/klub-literatury/cover.png`,
    author: 'Невідомо',
    artist: 'Невідомо',
    genres: ['Романтика', 'Драма', 'Повсякденність'],
    status: 'ongoing',
    rating: 8.7,
    totalViews: 75000,
    updatedAt: '2024-03-18',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Перша зустріч',
        pages: [
          `${R2_BASE_URL}/klub-literatury/chapter-1/page-1.jpg`,
        ],
        publishedAt: '2024-03-01',
        views: 3500,
      },
    ],
  },
  {
    id: 'yak-pryborkaty-hercoga-monstra',
    title: 'Як приборкати герцога-монстра',
    alternativeTitles: ['How to Tame a Monster Duke'],
    description: 'Чарівниця Неоніс має зняти прокляття з герцога, у жилах якого тече кров драконів. Чим довше вона залишається в маєтку, тим сильніше чудовисько бачить у ній свою пару.',
    coverImage: `${R2_BASE_URL}/hercog-monstr/cover.png`,
    author: 'Невідомо',
    artist: 'Невідомо',
    genres: ['Фентезі', 'Романтика', 'Драма'],
    status: 'completed',
    rating: 9.3,
    totalViews: 150000,
    updatedAt: '2024-02-28',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Прокляття',
        pages: [
          `${R2_BASE_URL}/hercog-monstr/chapter-1/page-1.jpg`,
        ],
        publishedAt: '2024-01-15',
        views: 6000,
      },
    ],
  },
  {
    id: 'yak-otrymaty-tu-pokoivku',
    title: 'Як отримати ту покоївку',
    alternativeTitles: ['How to Get That Maid'],
    description: 'Генрі та Ґрейс виросли разом, але їхні заручини перетворилися на формальність. Після падіння роду Ґрейс баланс руйнується, а нічні домовленості стають небезпечно відвертими.',
    coverImage: `${R2_BASE_URL}/pokoivka/cover.png`,
    author: 'Невідомо',
    artist: 'Невідомо',
    genres: ['Романтика', 'Драма', 'Історичне'],
    status: 'completed',
    rating: 8.8,
    totalViews: 92000,
    updatedAt: '2024-03-05',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Заручини',
        pages: [
          `${R2_BASE_URL}/pokoivka/chapter-1/page-1.jpg`,
        ],
        publishedAt: '2024-02-10',
        views: 4200,
      },
    ],
  },
  {
    id: 'punkny-vyshenky',
    title: 'Пуньки вишеньки',
    alternativeTitles: ['Cherry Blossoms'],
    description: 'Є Ін усе життя соромилася своїх втягнутих сосків і клялася ніколи не показувати груди. Але випадкова ніч з Джеміном, надто уважним юристом, змінює все.',
    coverImage: `${R2_BASE_URL}/vyshenky/cover.png`,
    author: 'Невідомо',
    artist: 'Невідомо',
    genres: ['Романтика', 'Повсякденність', 'Драма'],
    status: 'ongoing',
    rating: 8.5,
    totalViews: 68000,
    updatedAt: '2024-03-20',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Випадкова зустріч',
        pages: [
          `${R2_BASE_URL}/vyshenky/chapter-1/page-1.jpg`,
        ],
        publishedAt: '2024-03-05',
        views: 3800,
      },
    ],
  },
  {
    id: 'miy-drug-dytynstva',
    title: 'Мій друг дитинства, якого я вважала мертвим, став володарем демонів',
    alternativeTitles: ['My Childhood Friend Became the Demon Lord'],
    description: 'Люссі жила тихим життям поруч з Орто, поки її друг дитинства, якого всі вважали мертвим, не повернувся як король демонів — і тепер не збирається відпускати її знову.',
    coverImage: `${R2_BASE_URL}/drug-dytynstva/cover.png`,
    author: 'Невідомо',
    artist: 'Невідомо',
    genres: ['Фентезі', 'Романтика', 'Пригоди'],
    status: 'ongoing',
    rating: 9.0,
    totalViews: 110000,
    updatedAt: '2024-03-12',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Повернення',
        pages: [
          `${R2_BASE_URL}/drug-dytynstva/chapter-1/page-1.jpg`,
        ],
        publishedAt: '2024-02-20',
        views: 5500,
      },
    ],
  },
];

export function getManhwaById(id: string): Manhwa | undefined {
  return manhwaData.find(manhwa => manhwa.id === id);
}

export function getChapterByIds(manhwaId: string, chapterId: string) {
  const manhwa = getManhwaById(manhwaId);
  if (!manhwa) return undefined;
  return manhwa.chapters.find(chapter => chapter.id === chapterId);
}
