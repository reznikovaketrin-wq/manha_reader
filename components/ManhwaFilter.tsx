'use client';

import { useState, useEffect } from 'react';

interface Manhwa {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  tags?: string[];
  scheduleDay?: any;
}

interface ManhwaFilterClientProps {
  initialData: Manhwa[];
}

export default function ManhwaFilterClient({ initialData }: ManhwaFilterClientProps) {
  const [filteredManhwa, setFilteredManhwa] = useState<Manhwa[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Получить все уникальные теги
  const allTags = Array.from(
    new Set(initialData.flatMap(m => m.tags || []))
  );

  // Фильтрация в реальном времени
  useEffect(() => {
    let filtered = initialData;

    // По названию/описанию
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      );
    }

    // По статусу
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.status === selectedStatus);
    }

    // По тегам
    if (selectedTag !== 'all') {
      filtered = filtered.filter(m =>
        m.tags?.includes(selectedTag)
      );
    }

    setFilteredManhwa(filtered);
  }, [searchQuery, selectedStatus, selectedTag, initialData]);

  return (
    <div className="mb-8 space-y-4">
      {/* Title */}
      <h2 className="text-2xl font-bold text-text-main">📚 Всі манхви</h2>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Пошук по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 bg-bg-alt border border-text-muted/30 rounded-lg text-text-main placeholder-text-muted/50 focus:outline-none focus:border-blue-500 transition-colors"
        />

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-bg-alt border border-text-muted/30 rounded-lg text-text-main focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">Всі статуси</option>
          <option value="ongoing">В розкладі</option>
          <option value="completed">Завершено</option>
          <option value="hiatus">На паузі</option>
        </select>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 bg-bg-alt border border-text-muted/30 rounded-lg text-text-main focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">Всі теги</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results count */}
      {filteredManhwa.length !== initialData.length && (
        <p className="text-text-muted text-sm">
          Показано {filteredManhwa.length} з {initialData.length} тайтлів
        </p>
      )}
    </div>
  );
}