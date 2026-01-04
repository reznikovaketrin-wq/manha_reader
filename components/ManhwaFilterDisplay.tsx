'use client';

import { useState, useEffect } from 'react';
import ManhwaCard from '@/components/manhwa/ManhwaCard';
import styles from './ManhwaFilterDisplay.module.css';
import { X } from 'lucide-react';

interface Manhwa {
  id: string;
  title: string;
  shortDescription: string;
  coverImage: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  publicationType?: 'censored' | 'uncensored';
  type?: 'manhwa' | 'manga' | 'manhua';
  tags?: string[];
  scheduleDay?: any;
}

interface ManhwaFilterDisplayProps {
  initialData: Manhwa[];
}

type StatusType = 'ongoing' | 'completed' | 'hiatus';
type TypeValue = 'manhwa' | 'manga' | 'manhua';
type PublicationType = 'censored' | 'uncensored';

const statusLabels: Record<StatusType, string> = {
  'ongoing': 'В розкладі',
  'completed': 'Завершено',
  'hiatus': 'На паузі',
};

const typeLabels: Record<TypeValue, string> = {
  'manhwa': 'Манхва',
  'manga': 'Манга',
  'manhua': 'Манхуа',
};

const publicationLabels: Record<PublicationType, string> = {
  'uncensored': 'Без цензури',
  'censored': 'Цензуровано',
};

export default function ManhwaFilterDisplay({ initialData }: ManhwaFilterDisplayProps) {
  const [filteredManhwa, setFilteredManhwa] = useState<Manhwa[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<StatusType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TypeValue[]>([]);
  const [selectedPublications, setSelectedPublications] = useState<PublicationType[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Получить все уникальные значения
  const allStatuses = Array.from(
    new Set(initialData.map(m => m.status).filter(Boolean))
  ).sort() as StatusType[];

  const allTypes = Array.from(
    new Set(initialData.map(m => m.type).filter(Boolean))
  ).sort() as TypeValue[];

  const allPublications = Array.from(
    new Set(initialData.map(m => m.publicationType).filter(Boolean))
  ).sort() as PublicationType[];

  // Фильтрация в реальном времени
  useEffect(() => {
    let filtered = initialData;

    // По названию/описанию
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        (m.title?.toLowerCase().includes(query) || false) ||
        (m.shortDescription?.toLowerCase().includes(query) || false)
      );
    }

    // По статусам (любой из выбранных)
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(m => selectedStatuses.includes(m.status));
    }

    // По типам (любой из выбранных)
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(m => m.type && selectedTypes.includes(m.type));
    }

    // По публикации (любой из выбранных)
    if (selectedPublications.length > 0) {
      filtered = filtered.filter(m => m.publicationType && selectedPublications.includes(m.publicationType));
    }

    setFilteredManhwa(filtered);
  }, [searchQuery, selectedStatuses, selectedTypes, selectedPublications, initialData]);

  // Закрыть модал при клике на фон
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowFilterModal(false);
    }
  };

  const handleStatusChange = (status: StatusType) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleTypeChange = (type: TypeValue) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handlePublicationChange = (publication: PublicationType) => {
    setSelectedPublications(prev =>
      prev.includes(publication)
        ? prev.filter(p => p !== publication)
        : [...prev, publication]
    );
  };

  return (
    <div className="w-full">
      {/* === ПОИСК === */}
      <div className={styles.searchContainer}>
        <div className={styles.poda}>
          {/* Основной контейнер input */}
          <div className={styles.main}>
            {/* Иконка поиска */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              height="24"
              fill="none"
              className={styles.searchIcon}
            >
              <circle stroke="#d6d6e6" r="8" cy="11" cx="11"></circle>
              <line stroke="#d6d6e6" y2="16.65" y1="22" x2="16.65" x1="22"></line>
            </svg>

            {/* Input */}
            <input
              type="text"
              className={styles.input}
              placeholder="Пошук..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />

            {/* Filter Button */}
            <button
              className={styles.filterIcon}
              onClick={() => setShowFilterModal(true)}
              title="Фільтри"
            >
              <svg
                preserveAspectRatio="none"
                height="27"
                width="27"
                viewBox="4.8 4.56 14.832 15.408"
                fill="none"
              >
                <path
                  d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z"
                  stroke="#d6d6e6"
                  strokeWidth="1"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Счётчик результатов */}
      {filteredManhwa.length !== initialData.length && (
        <div className="w-full px-4">
          <div className="w-full mx-auto">
            <p className={styles.resultsCount}>
              Показано {filteredManhwa.length} з {initialData.length} тайтлів
            </p>
          </div>
        </div>
      )}

      {/* === МОДАЛЬНОЕ ОКНО ФИЛЬТРОВ === */}
      {showFilterModal && (
        <div className={styles.filterModal} onClick={handleModalBackdropClick}>
          <div className={styles.filterModalContent}>
            {/* Заголовок */}
            <div className={styles.filterModalHeader}>
              <span>Фільтри</span>
              <button
                className={styles.filterModalCloseBtn}
                onClick={() => setShowFilterModal(false)}
                aria-label="Закрити"
              >
                <X size={24} />
              </button>
            </div>

            {/* Тело модала */}
            <div className={styles.filterModalBody}>
              {/* Статус */}
              {allStatuses.length > 0 && (
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Статус</label>
                  <div className={styles.filterOptions}>
                    {allStatuses.map(status => (
                      <label key={status} className={styles.filterCheckboxWrapper}>
                        <input
                          type="checkbox"
                          className={styles.filterCheckbox}
                          checked={selectedStatuses.includes(status)}
                          onChange={() => handleStatusChange(status)}
                        />
                        <span className={styles.filterCheckboxLabel}>
                          {statusLabels[status]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Тип */}
              {allTypes.length > 0 && (
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Тип</label>
                  <div className={styles.filterOptions}>
                    {allTypes.map(type => (
                      <label key={type} className={styles.filterCheckboxWrapper}>
                        <input
                          type="checkbox"
                          className={styles.filterCheckbox}
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeChange(type)}
                        />
                        <span className={styles.filterCheckboxLabel}>
                          {typeLabels[type]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Публікація */}
              {allPublications.length > 0 && (
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Публікація</label>
                  <div className={styles.filterOptions}>
                    {allPublications.map(publication => (
                      <label key={publication} className={styles.filterCheckboxWrapper}>
                        <input
                          type="checkbox"
                          className={styles.filterCheckbox}
                          checked={selectedPublications.includes(publication)}
                          onChange={() => handlePublicationChange(publication)}
                        />
                        <span className={styles.filterCheckboxLabel}>
                          {publicationLabels[publication]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === ОТОБРАЖЕНИЕ МАНХВ === */}
      <div className="w-full mx-auto mt-16">
        {filteredManhwa.length > 0 ? (
          <div className="flex flex-col gap-20 max-[900px]:gap-12 max-[640px]:gap-8 w-full overflow-visible">
            {filteredManhwa.map((manhwa) => (
              <ManhwaCard key={manhwa.id} manhwa={manhwa} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateTitle}>Тайтлів не знайдено</p>
            <p className={styles.emptyStateSubtitle}>Спробуйте змінити параметри пошуку</p>
          </div>
        )}
      </div>
    </div>
  );
}