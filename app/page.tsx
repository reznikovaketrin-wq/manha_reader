import { fetchManhwas } from '@/lib/api';
import ContinueReading from '@/components/home/ContinueReading';
import ManhwaFilterDisplay from '@/components/ManhwaFilterDisplay';

interface ManhwaDisplay {
  id: string;
  title: string;
  shortDescription: string;
  coverImage: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  publicationType?: 'censored' | 'uncensored';
  type?: 'manhwa' | 'manga' | 'manhua';
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('🏠 [HomePage] Starting to load data...');
    }
    
    // Получить все манхвы из API
    const response = await fetchManhwas();
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🏠 [HomePage] Got response:', response?.length, 'items');
    }
    
    // Преобразуем API формат в формат компонента (API уже возвращает camelCase)
    if (Array.isArray(response)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🏠 [HomePage] Response is array, transforming...');
      }
      const transformed = response.map((m: any) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔄 [HomePage] Mapping:', m?.id, m?.title);
        }
        return {
          id: m.id,
          title: m.title,
          shortDescription: m.shortDescription,
          coverImage: m.coverImage,
          status: m.status,
          rating: m.rating,
          publicationType: m.publicationType,
          type: m.type,
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
    <>
      {/* === CONTINUE READING SECTION === */}
      <ContinueReading />

      {/* === ALL MANHWA WITH FILTER === */}
      {transformedManhwa.length > 0 ? (
        <ManhwaFilterDisplay initialData={transformedManhwa} />
      ) : (
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg">Тайтлів не знайдено</p>
          <p className="text-sm mt-2">Спробуйте пізніше</p>
        </div>
      )}
    </>
  );
}