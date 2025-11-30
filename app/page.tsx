'use client';

import { useState, useEffect } from 'react';
import { manhwaData } from '@/data/manhwa';
import ManhwaCard from '@/components/manhwa/ManhwaCard';
import ContinueReading from '@/components/manhwa/ContinueReading';
import ManhwaFilter from '@/components/ManhwaFilter';

export default function HomePage() {
  const [filteredManhwa, setFilteredManhwa] = useState(manhwaData);

  // Инициализируем фильтрованные данные при загрузке
  useEffect(() => {
    setFilteredManhwa(manhwaData);
  }, []);

  return (
    <div className="max-w-[1160px] mx-auto px-4 pb-10 overflow-visible">
      {/* Continue Reading Section */}
      <ContinueReading />

      {/* Filter and Title */}
      <ManhwaFilter onFilterChange={setFilteredManhwa} />

      {/* Show count of filtered results */}
      {filteredManhwa.length !== manhwaData.length && (
        <p className="text-text-muted text-sm mb-4">
          Показано {filteredManhwa.length} з {manhwaData.length} тайтлів
        </p>
      )}

      {/* All Manhwa Section */}
      {filteredManhwa.length > 0 ? (
        <div className="flex flex-col gap-20 max-[900px]:gap-12 max-[640px]:gap-8 w-full overflow-visible">
          {filteredManhwa.map((manhwa) => (
            <ManhwaCard key={manhwa.id} manhwa={manhwa} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg">За заданими фільтрами тайтлів не знайдено</p>
          <p className="text-sm mt-2">Спробуйте змінити параметри пошуку</p>
        </div>
      )}
    </div>
  );
}