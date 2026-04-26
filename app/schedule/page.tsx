// app/schedule/page.tsx
import { getManhwaData } from '@/data/manhwa';
import ScheduleClient from './schedule-client';

export const metadata = {
  title: 'Розклад публікацій',
  description: 'Розклад виходу нових розділів манхви',
};

// ✅ ОПТИМИЗАЦИЯ: ISR с переваливацией каждые 60 секунд
// Кеш будет автоматически обновляться каждые 60 секунд
// Это гарантирует видимость обновлений в течение минуты
export const revalidate = 60; // Кеш на 60 секунд

export default async function SchedulePage() {
  
  try {
    // Получить данные на сервере
    const scheduleData = await getManhwaData();

    return (
      <>
        <div className="py-16">
          <h1 className="text-4xl font-bold mb-12">
            Розклад публікацій
          </h1>
          <ScheduleClient initialData={scheduleData || []} />
        </div>
      </>
    );
  } catch (error) {
    console.error('❌ [SchedulePage] Error:', error);
    return (
      <>
        <div className="py-16">
          <h1 className="text-4xl font-bold mb-12">
            Розклад публікацій
          </h1>
          <div className="text-center py-16 text-[#b9b9b9]">
            <p className="text-[18px]">Помилка при завантаженні розкладу</p>
            <p className="text-[14px] mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      </>
    );
  }
}