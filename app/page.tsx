import { manhwaData } from '@/data/manhwa';
import ManhwaCard from '@/components/manhwa/ManhwaCard';
import ContinueReading from '@/components/manhwa/ContinueReading';

export default function HomePage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 pb-10">
      {/* Continue Reading Section */}
      <ContinueReading />

      {/* All Manhwa Section */}
      <h2 className="text-2xl font-extrabold uppercase tracking-tight-2 mb-6">
        Всі тайтли
      </h2>

      {/* 
        Cards List with gap that accounts for character image overflow
        Desktop: 40px overflow + 40px gap = 80px total (gap-20 = 80px in Tailwind)
        Tablet (900px): 16px overflow + 32px gap = 48px total (gap-12 = 48px in Tailwind)
        Mobile (640px): 0px overflow (static positioned) + 32px gap = 32px total (gap-8 = 32px in Tailwind)
      */}
      <div className="flex flex-col gap-20 max-[900px]:gap-12 max-[640px]:gap-8 w-full">
        {manhwaData.map((manhwa) => (
          <ManhwaCard key={manhwa.id} manhwa={manhwa} />
        ))}
      </div>
    </div>
  );
}