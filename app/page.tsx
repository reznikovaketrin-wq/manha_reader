import { fetchManhwas } from '@/lib/api';
import ManhwaCard from '@/components/manhwa/ManhwaCard';
import ContinueReading from '@/components/manhwa/ContinueReading';

interface ManhwaDisplay {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  tags?: string[];
  scheduleDay?: {
    dayBig: string;
    dayLabel: string;
    note: string;
  };
}

export default async function HomePage() {
  const transformedManhwa: ManhwaDisplay[] = [];
  
  try {
    console.log('🏠 [HomePage] Starting to load data...');
    
    // Получить все манхвы из API
    const response = await fetchManhwas();
    
    console.log('🏠 [HomePage] Got response:', response?.length, 'items');
    
    // Преобразуем API формат в формат компонента (API уже возвращает camelCase)
    if (Array.isArray(response)) {
      console.log('🏠 [HomePage] Response is array, transforming...');
      const transformed = response.map((m: any) => {
        console.log('🔄 [HomePage] Mapping:', m?.id, m?.title);
        return {
          id: m.id,
          title: m.title,
          description: m.description,
          coverImage: m.coverImage,
          status: m.status,
          rating: m.rating,
          tags: m.tags || [],
          scheduleDay: m.scheduleDay,
        } as ManhwaDisplay;
      });

      transformedManhwa.push(...transformed);
      console.log('🏠 [HomePage] Transformed:', transformedManhwa.length, 'items');
    } else {
      console.error('🏠 [HomePage] Response is not an array:', typeof response);
    }
    
    console.log(`✅ [HomePage] Loaded ${transformedManhwa.length} manhwas from API`);
  } catch (error) {
    console.error('❌ [HomePage] Failed to load manhwas:', error);
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 pb-10 overflow-visible">
      {/* Continue Reading Section */}
      <ContinueReading />

      {/* All Manhwa Section */}
      {transformedManhwa.length > 0 ? (
        <div className="flex flex-col gap-20 max-[900px]:gap-12 max-[640px]:gap-8 w-full overflow-visible">
          {transformedManhwa.map((manhwa) => (
            <ManhwaCard key={manhwa.id} manhwa={manhwa} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg">Тайтлів не знайдено</p>
          <p className="text-sm mt-2">Спробуйте пізніше</p>
        </div>
      )}
    </div>
  );
}