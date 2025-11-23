import Image from 'next/image';
import Link from 'next/link';
import { Manhwa } from '@/types/manhwa';
import ResizeableTitle from '@/components/ResizeableTitle';

interface ManhwaCardProps {
  manhwa: Manhwa;
}

export default function ManhwaCard({ manhwa }: ManhwaCardProps) {
  const statusText =
    manhwa.status === 'ongoing'
      ? 'ОНГОЇНГ'
      : manhwa.status === 'completed'
      ? 'ЗАВЕРШЕНА'
      : 'HIATUS';

  const lastSlashIndex = manhwa.coverImage.lastIndexOf('/');
  const baseImageUrl =
    lastSlashIndex !== -1
      ? manhwa.coverImage.slice(0, lastSlashIndex)
      : manhwa.coverImage;

  const backgroundImageUrl = `${baseImageUrl}/bg.png`;
  const characterImageUrl = `${baseImageUrl}/char.png`;

  return (
    <Link href={`/manhwa/${manhwa.id}`} className="block w-full">
      <section
        className="
          relative flex items-stretch
          h-[440px] min-h-[440px] w-full
          overflow-visible
          rounded-3xl
          bg-[#111111]
          px-10 py-8
          transition-all duration-150 ease-linear
          hover:-translate-y-0.5 hover:bg-[#141414]
          hover:shadow-[0_18px_40px_rgba(0,0,0,0.8)]
          max-[900px]:h-auto max-[900px]:min-h-[260px]
          max-[900px]:px-6 max-[900px]:py-6
        "
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >

        {/* Статусы — сверху */}
        <div
          className="
            absolute left-10 top-[50px]
            z-30
            flex flex-wrap gap-[90px]
            text-[20px] font-medium uppercase tracking-tight-2 text-white
            max-[900px]:left-6 max-[900px]:top-[40px] max-[900px]:gap-6 max-[900px]:text-[18px]
            max-[640px]:static max-[640px]:mt-2 max-[640px]:mb-3 max-[640px]:text-[16px] max-[640px]:gap-4
          "
        >
          <span>{statusText}</span>
          <span>БЕЗ ЦЕНЗУРИ</span>
          <span>МАНХВА</span>
        </div>

        {/* Левая текстовая колонка — приклеена к низу */}
        <div
          className="
            absolute left-10 bottom-8
            z-20
            max-w-[60%]
            max-[900px]:left-6 max-[900px]:bottom-6 max-[900px]:max-w-[72%]
            max-[640px]:static max-[640px]:mt-4 max-[640px]:max-w-full
          "
        >
          {/* Используем ResizeableTitle вместо простого h2 */}
          <ResizeableTitle minFontSize={32} maxFontSize={70}>
            {manhwa.title}
          </ResizeableTitle>

          <p
            className="
              text-[17px] leading-[1.32] text-white/85
              line-clamp-3
              max-[900px]:line-clamp-2
              max-[640px]:text-[14px] max-[640px]:line-clamp-2
            "
          >
            {manhwa.description}
          </p>
        </div>

        {/* Правий арт — приклеєний до нижнього правого кута, може виходити тільки зверху */}
        <div
          className="
            pointer-events-none
            absolute bottom-0 right-0
            z-10
            h-[125%] w-[36%]
            max-[900px]:h-[120%] max-[900px]:w-[40%]
            max-[640px]:static max-[640px]:mt-6 max-[640px]:h-[260px] max-[640px]:w-full
          "
        >
          <div className="relative h-full w-full">
            <Image
              src={characterImageUrl}
              alt={`${manhwa.title} characters`}
              fill
              className="object-contain"
              style={{ objectPosition: 'right bottom' }}
              sizes="(max-width: 640px) 90vw, (max-width: 900px) 50vw, 45vw"
              priority
            />
          </div>
        </div>
      </section>
    </Link>
  );
}