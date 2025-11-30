'use client';

import { useState, useMemo } from 'react';
import { manhwaData } from '@/data/manhwa';

interface FilterProps {
  onFilterChange: (filtered: typeof manhwaData) => void;
}

export default function ManhwaFilter({ onFilterChange }: FilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Получить все уникальные теги из данных
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    manhwaData.forEach(m => {
      m.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  const statuses = [
    { id: 'ongoing', label: 'ОНГОЇНГ', count: manhwaData.filter(m => m.status === 'ongoing').length },
    { id: 'completed', label: 'ЗАВЕРШЕНА', count: manhwaData.filter(m => m.status === 'completed').length },
  ];

  // Применить фильтры
  const handleFilter = (newStatuses: string[], newTags: string[]) => {
    setSelectedStatuses(newStatuses);
    setSelectedTags(newTags);

    const filtered = manhwaData.filter(m => {
      // Фильтр по статусам
      if (newStatuses.length > 0 && !newStatuses.includes(m.status)) {
        return false;
      }

      // Фильтр по тегам
      if (newTags.length > 0) {
        const hasTags = newTags.some(tag => m.tags?.includes(tag));
        if (!hasTags) return false;
      }

      return true;
    });

    onFilterChange(filtered);
  };

  const toggleStatus = (statusId: string) => {
    const newStatuses = selectedStatuses.includes(statusId)
      ? selectedStatuses.filter(s => s !== statusId)
      : [...selectedStatuses, statusId];
    handleFilter(newStatuses, selectedTags);
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    handleFilter(selectedStatuses, newTags);
  };

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedTags([]);
    onFilterChange(manhwaData);
  };

  const hasActiveFilters = selectedStatuses.length > 0 || selectedTags.length > 0;

  return (
    <>
      {/* Filter Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight-2">
          Всі тайтли
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            hasActiveFilters
              ? 'bg-white text-black hover:bg-text-muted'
              : 'bg-card-bg text-white hover:bg-card-hover'
          }`}
          title="Фільтри"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Filter Modal */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed right-0 top-0 bottom-0 w-[320px] bg-[#1a1a1d] z-50 shadow-2xl overflow-y-auto max-[720px]:w-full">
            {/* Header */}
            <div className="sticky top-0 bg-[#1a1a1d] border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase text-white">Фільтри</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-text-muted transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Statuses Section */}
              <div>
                <h4 className="text-sm font-semibold uppercase text-text-muted mb-3 tracking-wider">
                  Статус
                </h4>
                <div className="space-y-2">
                  {statuses.map(status => (
                    <label
                      key={status.id}
                      className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.id)}
                        onChange={() => toggleStatus(status.id)}
                        className="w-4 h-4 rounded bg-card-bg border border-white/20 cursor-pointer accent-white"
                      />
                      <span className="text-white text-sm font-medium">
                        {status.label}
                        <span className="text-text-muted ml-2">({status.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags Section */}
              {allTags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold uppercase text-text-muted mb-3 tracking-wider">
                    Теги
                  </h4>
                  <div className="space-y-2">
                    {allTags.map(tag => {
                      const count = manhwaData.filter(m => m.tags?.includes(tag)).length;
                      return (
                        <label
                          key={tag}
                          className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => toggleTag(tag)}
                            className="w-4 h-4 rounded bg-card-bg border border-white/20 cursor-pointer accent-white"
                          />
                          <span className="text-white text-sm font-medium">
                            {tag}
                            <span className="text-text-muted ml-2">({count})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="w-full py-2 px-3 bg-card-bg hover:bg-card-hover text-white text-sm font-medium rounded transition-colors uppercase tracking-wider"
                >
                  Скинути фільтри
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}