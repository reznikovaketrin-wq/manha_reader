import { manhwaData } from '@/data/manhwa';
import ManhwaCard from '@/components/manhwa/ManhwaCard';
import ContinueReading from '@/components/manhwa/ContinueReading';

export default function HomePage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 pb-10 overflow-visible">
      {/* Continue Reading Section */}
      <ContinueReading />

      {/* All Manhwa Section */}
      <h2 className="text-2xl font-extrabold uppercase tracking-tight-2 mb-6">
        Всі тайтли
      </h2>

      {/* 
        Cards List with overflow-visible so character images can extend beyond card bounds
        Desktop: картинка в правом нижнем углу, выходит за границы
        Mobile: картинка выходит за верхний край карточки
      */}
      <div className="flex flex-col gap-20 max-[900px]:gap-12 max-[640px]:gap-8 w-full overflow-visible">
        {manhwaData.map((manhwa) => (
          <ManhwaCard key={manhwa.id} manhwa={manhwa} />
        ))}
      </div>
    </div>
  );
}