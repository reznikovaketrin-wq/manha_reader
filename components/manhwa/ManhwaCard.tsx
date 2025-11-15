import Image from 'next/image';
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
 const lastSlashIndex = manhwa.coverImage.lastIndexOf('/');
  const baseImageUrl = lastSlashIndex !== -1
    ? manhwa.coverImage.slice(0, lastSlashIndex)
    : manhwa.coverImage;
  const backgroundImageUrl = `${baseImageUrl}/bg.png`;
  const characterImageUrl = `${baseImageUrl}/char.png`;
  return (
    <Link
      href={`/manhwa/${manhwa.id}`}
      className="block w-full"
    >
      <section
        className="relative w-full overflow-hidden rounded-3xl border border-white/5 bg-black shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
      >
        {/* Background image */}
        <div
           className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/25" />

        {/* Large decorative title */}
        <div className="pointer-events-none absolute inset-0 hidden md:flex items-center px-10">
          <div className="text-white/10 text-[180px] xl:text-[200px] font-extrabold uppercase leading-none tracking-tight-2 truncate">
            {manhwa.title}
          </div>
        </div>
        {/* Текстовый контент */}
        <div className="relative z-10 flex min-h-[380px] md:min-h-[320px] flex-col justify-between gap-6 px-10 py-10 md:px-7 md:py-8 sm:px-5 sm:py-6">
          {/* Статусы */}
         <div className="flex flex-wrap gap-10 md:gap-6 sm:gap-4 text-lg md:text-base sm:text-sm font-semibold uppercase tracking-tight-2 text-white/90">
            <span>{statusText}</span>
            <span>БЕЗ ЦЕНЗУРИ</span>
            <span>MANHWA</span>
          </div>

           {/* Заголовок и описание */}
            <div className="max-w-[640px] md:max-w-[520px] sm:max-w-full space-y-4 md:space-y-3">
              <h2 className="text-[64px] md:text-[46px] sm:text-[34px] font-extrabold uppercase leading-none tracking-tight-2 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]">
                {manhwa.title}
              </h2>
              <p className="text-[17px] sm:text-[14px] leading-relaxed text-white/80 md:max-w-[90%]">
                {manhwa.description.slice(0, 140)}...
              </p>
            </div>

            {/* Призыв к действию */}
            <div className="inline-flex w-fit items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-tight-2 text-white backdrop-blur transition-colors duration-150 hover:bg-white/18">
              Читать сейчас
              <span aria-hidden className="text-lg">→</span>
            </div>
          </div>

          {/* Character artwork */}
          <div className="relative w-full md:w-[42%] sm:w-full min-h-[220px] md:min-h-[320px] lg:min-h-[360px] pointer-events-none flex items-end justify-center md:justify-end">
            <Image
              src={characterImageUrl}
              alt={`${manhwa.title} characters`}
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 46vw, 38vw"
              className="object-contain object-bottom md:object-right-bottom drop-shadow-[0_16px_30px_rgba(0,0,0,0.6)]"
              priority
            />
          </div>
          
      </section>
    </Link>
  );
}
