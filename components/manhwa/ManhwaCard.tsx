import Link from 'next/link';
import { Manhwa } from '@/types/manhwa';

interface ManhwaCardProps {
  manhwa: Manhwa;
}

export default function ManhwaCard({ manhwa }: ManhwaCardProps) {
  // Определение статусов на украинском
  const statusText = 
    manhwa.status === 'ongoing' ? 'ONGOING' : 
    manhwa.status === 'completed' ? 'ЗАВЕРШЕНО' : 
    'HIATUS';

  return (
    <Link href={`/manhwa/${manhwa.id}`}>
      <section
        className="
          relative w-full 
          h-[440px] min-h-[440px]
          md:h-[260px] md:min-h-[260px]
          sm:h-auto sm:min-h-[260px]
          bg-card-bg bg-center bg-right bg-cover bg-no-repeat 
          overflow-visible 
          flex items-center
          sm:items-end
          px-10 py-8
          md:px-5 md:py-6
          sm:px-4 sm:py-5
          cursor-pointer 
          transition-all duration-150 ease-out 
          hover:-translate-y-0.5 
          hover:shadow-[0_18px_40px_rgba(0,0,0,0.8)] 
          hover:bg-card-hover
        "
        style={{
          backgroundImage: `url(${manhwa.coverImage})`,
        }}
      >
        {/* Character Art - отдельный слой поверх фона */}
        <div
          className="absolute top-[-39px] right-0 w-[50%] h-[109%] bg-no-repeat bg-contain bg-top-right pointer-events-none z-[1]"
          style={{
            backgroundImage: `url(${manhwa.coverImage})`,
          }}
        />

        {/* Текстовый контент */}
        <div className="max-w-[52%] md:max-w-[70%] sm:max-w-full relative z-[2]">
          {/* Статусы */}
          <div className="flex flex-wrap gap-[90px] md:gap-6 sm:gap-[18px] mb-4 text-[20px] md:text-[18px] sm:text-base font-medium uppercase tracking-tight-2">
            <span className="text-white">{statusText}</span>
            <span className="text-white">БЕЗ ЦЕНЗУРИ</span>
            <span className="text-white">MANHWA</span>
          </div>

          {/* Заголовок */}
          <h2 className="
            my-6 md:my-[18px] sm:my-3
            text-[70px] md:text-[44px] sm:text-[32px]
            font-extrabold uppercase tracking-tight-2 leading-none 
            whitespace-nowrap overflow-visible
          ">
            {manhwa.title}
          </h2>

          {/* Описание */}
          <p className="text-text-muted text-base sm:text-[13px] leading-relaxed">
            {manhwa.description.slice(0, 120)}...
          </p>
        </div>
      </section>
    </Link>
  );
}
