'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScheduleItem {
  id: string;
  title: string;
  coverImage?: string;
  dayBig: string;
  dayLabel: string;
  scheduleNote: string;
}

// Порядок дней недели для сортировки
const DAY_ORDER = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

interface ScheduleClientProps {
  initialData: any[];
}

export default function ScheduleClient({ initialData }: ScheduleClientProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔥 [ScheduleClient] Component mounted with initialData:', {
      type: typeof initialData,
      isArray: Array.isArray(initialData),
      length: Array.isArray(initialData) ? initialData.length : 'not array',
      firstItem: initialData?.[0],
    });

    if (!initialData || !Array.isArray(initialData) || initialData.length === 0) {
      console.log('⚠️ [ScheduleClient] No data or empty array');
      setScheduleItems([]);
      setLoading(false);
      return;
    }

    // Фильтруем только манхвы у которых есть scheduleDay
    console.log('📋 [ScheduleClient] Filtering items with scheduleDay...');
    const items = initialData
      .filter((m: any) => {
        const has = m.scheduleDay && m.scheduleDay.dayLabel;
        console.log(`  ${has ? '✅' : '❌'} ${m.id}:`, {
          scheduleDay: m.scheduleDay,
          dayLabel: m.scheduleDay?.dayLabel,
        });
        return has;
      })
      .map((m: any) => ({
        id: m.id,
        title: m.title,
        coverImage: m.coverImage,
        dayBig: m.scheduleDay.dayBig,
        dayLabel: m.scheduleDay.dayLabel,
        scheduleNote: m.scheduleDay.note || '',
      }))
      .sort((a: any, b: any) => {
        // Сортируем по дню недели
        const dayA = DAY_ORDER.indexOf(a.dayBig);
        const dayB = DAY_ORDER.indexOf(b.dayBig);
        return dayA - dayB;
      });

    console.log(`✅ [ScheduleClient] Filtered ${items.length} items out of ${initialData.length}`);
    console.log('📦 [ScheduleClient] Items:', items);
    setScheduleItems(items);
    setLoading(false);
  }, [initialData]);

  if (loading) {
    return (
      <div className="pb-10">
        <div className="text-center py-16 text-[#b9b9b9]">
          <p className="text-[18px]">Загрузка розкладу...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {scheduleItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-7 max-[960px]:grid-cols-1">
          {scheduleItems.map((item) => (
            <ScheduleCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#b9b9b9]">
          <p className="text-[18px]">Розклад поки що порожній</p>
          <p className="text-[14px] mt-2">Додайте розклад до манхв в адмінці</p>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ item }: { item: ScheduleItem }) {
  const [imageError, setImageError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Определяем размер экрана при загрузке
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 720);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Link href={`/manhwa/${item.id}`}>
      <section
        className="
          relative overflow-visible
          bg-gradient-to-br from-[#1c1c20] from-0% via-[#0b0b0d] via-55% to-[#050506] to-100%
          rounded-xl
          min-h-[380px] p-6
          cursor-pointer
          transition-all duration-[180ms] ease-in
          hover:translate-y-[-4px] hover:shadow-[0_26px_60px_rgba(0,0,0,0.9)]
          hover:bg-gradient-to-br hover:from-[#232329] hover:from-0% hover:via-[#08080a] hover:via-55% hover:to-[#050506] hover:to-100%
          min-[720px]:min-h-[380px] min-[720px]:p-6
          max-[720px]:min-h-[238px] max-[720px]:pb-1 max-[720px]:px-3.5 max-[720px]:pt-3.5
        "
      >
        {/* Огромные буквы дня на фоне - всегда видны одним цветом */}
        <div
          style={{
            position: 'absolute',
            left: isMobile ? '4px' : '14px',
            top: isMobile ? '14px' : '24px',
            fontSize: isMobile ? 'clamp(100px, 31vw, 185px)' : 'clamp(100px, 35vw, 185px)',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.00em',
            color: 'rgba(255, 255, 255, 0.09)',
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: '1',
          }}
        >
          {item.dayBig}
        </div>

        {/* Тонкая полоска внизу */}
        <div className="absolute left-4 bottom-4 w-[70px] h-0.5 bg-white/30 max-[720px]:left-3.5 max-[720px]:bottom-1 max-[720px]:w-[51px]"></div>

        {/* Основной контент - grid с двумя колонками */}
        <div
          className="
            relative z-10 h-full
            grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]
            gap-[18px]
            items-start
            max-[720px]:gap-[6px]
          "
        >
          {/* Левая колонка - текстовая информация */}
          <div className="flex flex-col gap-2.5 mt-20 max-[720px]:mt-11 max-[720px]:gap-1.5 max-[720px]:flex-1 max-[720px]:justify-start">
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#b9b9b9] max-[720px]:text-[11px]">
              {item.dayLabel}
            </div>
            <div className="text-[32px] font-extrabold uppercase tracking-tight-2 leading-[1.05] max-[720px]:text-[21px]">
              {item.title}
            </div>
            <div className="text-[13px] text-[#b9b9b9] max-w-[340px] max-[720px]:text-[10px] max-[720px]:max-w-full">
              {item.scheduleNote}
            </div>
          </div>

          {/* Правая колонка - обложка */}
          <div className="flex items-center justify-end">
            <div
              className="
                w-full max-w-[260px]
                rounded-[10px] overflow-hidden
                border border-white/15
                shadow-[0_16px_40px_rgba(0,0,0,0.85)]
                bg-black
                max-[720px]:max-w-[170px]
              "
              style={{ aspectRatio: '3 / 4' }}
            >
              {!imageError && item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  style={{
                    filter: 'contrast(1.02) saturate(1.02)',
                  }}
                  onError={() => {
                    console.error(`Ошибка загрузки изображения: ${item.coverImage}`);
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <span className="text-center text-gray-400 text-sm px-4">{item.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Link>
  );
}