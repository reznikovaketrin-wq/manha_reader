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

      {/* Cards List */}
      <div className="flex flex-col gap-10 w-full">
        {manhwaData.map((manhwa) => (
          <ManhwaCard key={manhwa.id} manhwa={manhwa} />
        ))}
      </div>
    </div>
  );
}