'use client';

import { useState } from 'react';

interface ScheduleItem {
  dayBig: string;
  dayLabel: string;
  titleName: string;
  key: string;
  note: string;
}

export default function SchedulePage() {
  const [scheduleItems] = useState<ScheduleItem[]>([
    {
      dayBig: 'ПН',
      dayLabel: 'Понеділок',
      titleName: 'Лицар та Відьма',
      key: 'Лицар_та_відьма',
      note: 'Нове оновлення кожного понеділка.',
    },
    {
      dayBig: 'СР',
      dayLabel: 'Середа',
      titleName: 'Клуб дорослої літератури',
      key: 'Клуб_дорослої_літератури',
      note: 'Справжній дорослий клуб посеред тижня.',
    },
    {
      dayBig: 'ЧТ',
      dayLabel: 'Четвер',
      titleName: 'Як отримати ту покоївку',
      key: 'Як_отримати_ту_покоївку',
      note: 'Продовження історії щочетверга.',
    },
    {
      dayBig: 'ПТ',
      dayLabel: "П'ятниця",
      titleName: 'Пунькни вишеньки',
      key: 'Пунькни_вишеньки',
      note: "П'ятничний реліз для тих, хто чекав.",
    },
  ]);

  return (
    <div className="max-w-[1160px] mx-auto px-4 pb-10">
      <div className="mb-7">
        <h1 className="text-[40px] font-extrabold uppercase tracking-tight-2 mb-1.5">
          Розклад
        </h1>
        <p className="text-[15px] text-[#b9b9b9]">
          Основні тайтли та дні, коли виходять нові розділи.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-7 max-[960px]:grid-cols-1">
        {scheduleItems.map((item, index) => (
          <ScheduleCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

function ScheduleCard({ item }: { item: ScheduleItem }) {
  return (
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
        max-[720px]:min-h-[340px] max-[720px]:p-5
        max-[520px]:min-h-auto
      "
      data-day-big={item.dayBig}
      onClick={() => {
        window.location.href = `reader.html?title=${encodeURIComponent(item.key)}`;
      }}
    >
      {/* Огромные буквы дня на фоне - всегда видны одним цветом */}
      <div
        style={{
          position: 'absolute',
          left: '0',
          top: '0px',
          fontSize: '210px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '-0.05em',
          color: 'rgba(255, 255, 255, 0.09)',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: '1',
        }}
      >
        {item.dayBig}
      </div>

      {/* Тонкая полоска внизу */}
      <div className="absolute left-6 bottom-5 w-[90px] h-0.5 bg-white/30"></div>

      {/* Основной контент - grid с двумя колонками */}
      <div
        className="
          relative z-10 h-full
          grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]
          gap-[18px]
          items-center
          max-[720px]:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] max-[720px]:gap-[14px]
          max-[520px]:grid-cols-1 max-[520px]:items-start
        "
      >
        {/* Левая колонка - текстовая информация */}
        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#b9b9b9]">
            {item.dayLabel}
          </div>
          <div className="text-[32px] font-extrabold uppercase tracking-tight-2 leading-[1.05] max-[720px]:text-[24px]">
            {item.titleName}
          </div>
          <div className="text-[13px] text-[#b9b9b9] max-w-[340px]">
            {item.note}
          </div>
        </div>

        {/* Правая колонка - обложка */}
        <div className="flex items-center justify-end max-[520px]:justify-start">
          <div
            className="
              w-full max-w-[260px]
              rounded-[10px] overflow-hidden
              border border-white/15
              shadow-[0_16px_40px_rgba(0,0,0,0.85)]
              bg-black
              max-[720px]:max-w-[210px]
              max-[520px]:max-w-[220px]
            "
            style={{ aspectRatio: '3 / 4' }}
          >
            <img
              src={`/covers/${item.key}.jpg`}
              alt={item.titleName}
              className="w-full h-full object-cover"
              style={{
                filter: 'contrast(1.02) saturate(1.02)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}