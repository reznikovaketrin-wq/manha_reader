'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ManhwaCommentsComponent } from '@/components/manhwa-comments-component';
import buttonStyles from '@/components/ReadButton.module.css';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pagesCount: number;
  status: string;
  publishedAt: string;
}

interface Manhwa {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  bgImage: string;
  charImage: string;
  status: string;
  rating: number;
  tags: string[];
  chapters: Chapter[];
  type?: 'manhwa' | 'manga' | 'manhua';
  publicationType?: 'censored' | 'uncensored';
  scheduleDay?: {
    dayBig: string;
    dayLabel: string;
    note: string;
  };
}

type TabType = 'info' | 'chapters' | 'comments';

const styles = `
  * {
    box-sizing: border-box;
  }

  @media (max-width: 1024px) {
    .left-column {
      width: 250px !important;
    }
    .cover-image {
      width: 250px !important;
    }
    .title {
      font-size: 28px !important;
    }
    .description {
      font-size: 13px !important;
    }
  }

  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
    }
    .left-column {
      width: 200px !important;
      margin: 0 auto !important;
    }
    .cover-image {
      width: 200px !important;
    }
    .title {
      font-size: 24px !important;
    }
    .description {
      font-size: 13px !important;
    }
    .button {
      padding: 12px 18px !important;
      font-size: 14px !important;
    }
    .chapter-item {
      padding: 10px 12px !important;
      font-size: 12px !important;
    }
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export default function ManhwaPage() {
  const params = useParams();
  const id = params?.id as string;
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg'>('md');
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [commentsCount, setCommentsCount] = useState(0);

  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [totalViews, setTotalViews] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(0);
  const [totalRating, setTotalRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width < 360) {
        setScreenSize('xs');
      } else if (width < 480) {
        setScreenSize('sm');
      } else if (width < 600) {
        setScreenSize('md');
      } else {
        setScreenSize('lg');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setUserId(user.id);
          console.log('👤 User ID получен:', user.id.substring(0, 8) + '...');
        }
      } catch (err) {
        console.error('⚠️ Ошибка получения user:', err);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchManhwa = async () => {
      try {
        const response = await fetch(`/api/public/${id}`);
        if (!response.ok) throw new Error(`Помилка: ${response.status}`);
        const data = await response.json();
        console.log(`✅ Манхва завантажена:`, data);
        setManhwa(data);
        setTotalRating(data.rating || data.averageRating || data.score || 0);
        setRatingCount(data.ratingCount || data.ratingsCount || 0);
        setLoading(false);
      } catch (err) {
        console.error(`❌ Помилка:`, err);
        setManhwa(null);
        setLoading(false);
      }
    };

    fetchManhwa();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9A9A9A' }}>Завантаження...</div>
      </div>
    );
  }

  if (!manhwa) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ color: '#FF6B6B', fontSize: '18px' }}>❌ Помилка: Манхву не знайдено</div>
      </div>
    );
  }

  const statusText = manhwa.status === 'ongoing' ? 'ОНГОІНГ' : manhwa.status === 'completed' ? 'ЗАВЕРШЕНО' : 'НА ПАУЗІ';
  const getCensorshipText = (publicationType?: string) => publicationType === 'uncensored' ? 'ВІДСУТНЯ' : 'ПРИСУТНЯ';
  const getTypeText = (type?: string) => {
    const typeLabels: Record<string, string> = {
      'manhwa': 'МАНХВА',
      'manga': 'МАНГА',
      'manhua': 'МАНЬХУА',
    };
    return typeLabels[type || 'manhwa'];
  };

  const filteredChapters = (() => {
    let chapters = manhwa.chapters.filter((chapter) => {
      const query = searchQuery.toLowerCase();
      return (
        chapter.chapterNumber.toString().includes(query) ||
        chapter.title.toLowerCase().includes(query)
      );
    });

    if (sortOrder) {
      chapters = [...chapters].sort((a, b) =>
        sortOrder === 'asc' ? a.chapterNumber - b.chapterNumber : b.chapterNumber - a.chapterNumber
      );
    }

    return chapters;
  })();

  const descriptionLines = manhwa.description.split('\n');
  const isLongDescription = descriptionLines.length > 3 || manhwa.description.length > 200;
  const displayDescription = expandedDescription ? manhwa.description : descriptionLines.slice(0, 2).join('\n');

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{styles}</style>
      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: isMobile ? '0' : '40px', width: '100%', boxSizing: 'border-box' }}>
        {!isMobile && <div style={{ display: 'none' }} />}
        
        {/* Ліва панель - Обкладинка та кнопки */}
        {!isMobile && (
          <div className="left-column" style={{ width: '300px' }}>
            {/* Обкладинка */}
            <div className="cover-image" style={{ marginBottom: '18px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#2A2A2A', width: '300px', aspectRatio: '9/11', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${manhwa.coverImage})` }} />

            {/* Кнопка Читати */}
            <Link href={`/reader/${manhwa.id}/${savedProgress?.chapter_id || savedProgress?.chapterId || manhwa.chapters[0]?.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <button className={buttonStyles.readButtonGradient}>
                <svg viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {savedProgress ? 'Продовжити читання' : 'Читати'}
              </button>
            </Link>

            {/* Підказка про збережену позицію */}
            {savedProgress && (
              <p style={{ fontSize: '12px', color: '#9A9A9A', marginBottom: '12px', textAlign: 'center' }}>
                Продовжити з розділу {Math.ceil((savedProgress.page_number || savedProgress.pageNumber || 1) / 5)}
              </p>
            )}

            {/* Кнопка Додати в список */}
            <button className="button" style={{ width: '100%', padding: '14px 22px', backgroundColor: 'transparent', color: '#FFFFFF', border: '1px solid #3A3A3A', borderRadius: '12px', transition: 'all 0.2s', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#A259FF'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#3A3A3A'}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Додати в список
            </button>
          </div>
        )}

        {/* Права частина - Основний контент */}
        <div style={{ minWidth: 0 }}>
          {/* Мобильная обложка */}
          {isMobile && (
            <div style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#2A2A2A', width: '100%', maxWidth: '300px', aspectRatio: '9/11', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${manhwa.coverImage})`, margin: '0 auto 20px auto' }} />
          )}

          {/* Заголовок */}
          <h1 className="title" style={{ fontSize: isMobile ? '24px' : '38px', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px', lineHeight: '1.2' }}>
            {manhwa.title}
          </h1>

          {/* Описание - ТОЛЬКО ДЕСКТОП */}
          {!isMobile && (
            <div style={{ marginBottom: '28px' }}>
              <p className="description" style={{ color: '#CFCFCF', lineHeight: '1.45', marginBottom: '12px', fontSize: '17px', fontWeight: '400', maxWidth: '780px', display: !expandedDescription && isLongDescription ? '-webkit-box' : 'block', WebkitLineClamp: !expandedDescription && isLongDescription ? 3 : 'unset', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {displayDescription}
              </p>
              {isLongDescription && (
                <button onClick={() => setExpandedDescription(!expandedDescription)} style={{ color: '#A259FF', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}>
                  {expandedDescription ? 'Сховати' : 'Розгорнути повністю'}
                </button>
              )}
            </div>
          )}

          {/* ПОСТОЯННЫЙ БЛОК МЕТАДАННЫХ */}
          {!isMobile && (
            // ДЕСКТОПНАЯ ВЕРСИЯ - 6 элементов в строку
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: '32px', borderRadius: '12px', padding: '12px 14px', height: '56px', border: '2px solid rgba(255, 255, 255, 0.2)' }}>
              {/* Статус */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/status-icon.png" alt="Status" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#FFFFFF', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Статус</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>{statusText}</p>
                </div>
              </div>

              {/* Тип */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/type-icon.png" alt="Type" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#FFFFFF', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Тип</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>{getTypeText(manhwa.type)}</p>
                </div>
              </div>

              {/* Цензура */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/censorship-icon.png" alt="Censorship" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#FFFFFF', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Цензура</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>{getCensorshipText(manhwa.publicationType)}</p>
                </div>
              </div>

              {/* Розділи */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/chapters-icon.png" alt="Chapters" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#FFFFFF', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Розділи</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>{manhwa.chapters.length}</p>
                </div>
              </div>

              {/* Перегляди */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/views-icon.png" alt="Views" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#FFFFFF', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Перегляди</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>
                    {totalViews > 1000000 ? (totalViews / 1000000).toFixed(1) + 'M' : totalViews > 1000 ? (totalViews / 1000).toFixed(1) + 'K' : totalViews}
                  </p>
                </div>
              </div>

              {/* Оцінка */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/rating-bubble.png" alt="Rating" style={{ width: '28px', height: '28px', flexShrink: 0, borderRadius: '8px' }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#FFFFFF', opacity: 0.7, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Оцінка</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>
                    {totalRating.toFixed(1)} <span style={{ color: '#FFFFFF', opacity: 0.6, fontSize: '12px' }}>({ratingCount})</span>
                  </p>
                </div>
              </div>

              {/* Пустое место */}
              <div style={{ flex: 1 }}></div>

              {/* Кнопка */}
              <button 
                onClick={() => setShowRatingModal(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #3A3A3A',
                  borderRadius: '6px',
                  color: '#CFCFCF',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { 
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.borderColor = '#A259FF';
                  btn.style.color = '#A259FF';
                }}
                onMouseLeave={(e) => { 
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.borderColor = '#3A3A3A';
                  btn.style.color = '#CFCFCF';
                }}
              >
                Оцінити
              </button>
            </div>
          )}

          {/* МОБИЛЬНАЯ ВЕРСИЯ - 3 элемента компактно с адаптивом */}
          {isMobile && (
            <div style={{ 
              display: 'flex', 
              gap: screenSize === 'xs' ? '6px' : screenSize === 'sm' ? '10px' : screenSize === 'md' ? '14px' : '18px',
              marginBottom: '24px', 
              padding: screenSize === 'xs' ? '6px 10px' : screenSize === 'sm' ? '8px 12px' : screenSize === 'md' ? '10px 14px' : '12px 16px',
              backgroundColor: '#0A0A0A', 
              borderRadius: '12px', 
              border: '1px solid #3A3A3A', 
              alignItems: 'center', 
              justifyContent: 'space-around' 
            }}>
              {/* Статус */}
              <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'xs' ? '5px' : screenSize === 'sm' ? '6px' : screenSize === 'md' ? '7px' : '8px', flex: 1, minWidth: 0 }}>
                <img src="/icons/status-icon.png" alt="Status" style={{ 
                  width: screenSize === 'xs' ? '14px' : screenSize === 'sm' ? '16px' : screenSize === 'md' ? '18px' : '20px', 
                  height: screenSize === 'xs' ? '14px' : screenSize === 'sm' ? '16px' : screenSize === 'md' ? '18px' : '20px', 
                  flexShrink: 0 
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ 
                    fontSize: screenSize === 'xs' ? '7px' : screenSize === 'sm' ? '8px' : screenSize === 'md' ? '9px' : '10px', 
                    fontWeight: '600', 
                    color: '#FFFFFF', 
                    opacity: 0.6, 
                    textTransform: 'uppercase', 
                    margin: '0', 
                    letterSpacing: '0.05em' 
                  }}>Статус</p>
                  <p style={{ 
                    fontSize: screenSize === 'xs' ? '9px' : screenSize === 'sm' ? '10px' : screenSize === 'md' ? '11px' : '12px', 
                    fontWeight: '700', 
                    color: '#FFFFFF', 
                    margin: 0, 
                    lineHeight: '1.2', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>{statusText}</p>
                </div>
              </div>

              {/* Тип */}
              <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'xs' ? '5px' : screenSize === 'sm' ? '6px' : screenSize === 'md' ? '7px' : '8px', flex: 1, minWidth: 0 }}>
                <img src="/icons/type-icon.png" alt="Type" style={{ 
                  width: screenSize === 'xs' ? '14px' : screenSize === 'sm' ? '16px' : screenSize === 'md' ? '18px' : '20px', 
                  height: screenSize === 'xs' ? '14px' : screenSize === 'sm' ? '16px' : screenSize === 'md' ? '18px' : '20px', 
                  flexShrink: 0 
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ 
                    fontSize: screenSize === 'xs' ? '7px' : screenSize === 'sm' ? '8px' : screenSize === 'md' ? '9px' : '10px', 
                    fontWeight: '600', 
                    color: '#FFFFFF', 
                    opacity: 0.6, 
                    textTransform: 'uppercase', 
                    margin: '0', 
                    letterSpacing: '0.05em' 
                  }}>Тип</p>
                  <p style={{ 
                    fontSize: screenSize === 'xs' ? '9px' : screenSize === 'sm' ? '10px' : screenSize === 'md' ? '11px' : '12px', 
                    fontWeight: '700', 
                    color: '#FFFFFF', 
                    margin: 0, 
                    lineHeight: '1.2', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>{getTypeText(manhwa.type)}</p>
                </div>
              </div>

              {/* Цензура */}
              <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'xs' ? '5px' : screenSize === 'sm' ? '6px' : screenSize === 'md' ? '7px' : '8px', flex: 1, minWidth: 0 }}>
                <img src="/icons/censorship-icon.png" alt="Censorship" style={{ 
                  width: screenSize === 'xs' ? '14px' : screenSize === 'sm' ? '16px' : screenSize === 'md' ? '18px' : '20px', 
                  height: screenSize === 'xs' ? '14px' : screenSize === 'sm' ? '16px' : screenSize === 'md' ? '18px' : '20px', 
                  flexShrink: 0 
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ 
                    fontSize: screenSize === 'xs' ? '7px' : screenSize === 'sm' ? '8px' : screenSize === 'md' ? '9px' : '10px', 
                    fontWeight: '600', 
                    color: '#FFFFFF', 
                    opacity: 0.6, 
                    textTransform: 'uppercase', 
                    margin: '0', 
                    letterSpacing: '0.05em' 
                  }}>Цензура</p>
                  <p style={{ 
                    fontSize: screenSize === 'xs' ? '9px' : screenSize === 'sm' ? '10px' : screenSize === 'md' ? '11px' : '12px', 
                    fontWeight: '700', 
                    color: '#FFFFFF', 
                    margin: 0, 
                    lineHeight: '1.2', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>{getCensorshipText(manhwa.publicationType)}</p>
                </div>
              </div>
            </div>
          )}
        

          {/* ДЕСКТОПНАЯ ВЕРСИЯ - без табов */}
          {!isMobile && (
            <>
              {/* Два блока рядом - Розділи и Коментарі */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', minWidth: 0 }}>
                
                {/* Левый блок - Розділи */}
                <div style={{ border: '1px solid #3A3A3A', borderRadius: '12px', padding: '20px', backgroundColor: '#0A0A0A', minWidth: 0 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/icons/chapters-icon.png" alt="Chapters" style={{ width: '20px', height: '20px' }} />
                    Розділи ({filteredChapters.length})
                  </h3>

                  {/* Поле пошуку з сортировкою */}
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: 'transparent', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '0 12px' }}>
                    <input type="text" placeholder="Номер або назва розділу..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', padding: '12px 16px', color: '#CFCFCF', fontSize: '14px', outline: 'none' }} />
                    <button onClick={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')} style={{ padding: '0', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <img src="/icons/arrow-up-icon.png" alt="Sort Up" style={{ width: sortOrder === 'desc' ? '25px' : '23px', height: sortOrder === 'desc' ? '25px' : '23px', filter: sortOrder === 'desc' ? 'brightness(3)' : 'brightness(1)' }} />
                    </button>
                    <button onClick={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')} style={{ padding: '0', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <img src="/icons/arrow-down-icon.png" alt="Sort Down" style={{ width: sortOrder === 'asc' ? '25px' : '23px', height: sortOrder === 'asc' ? '25px' : '23px', filter: sortOrder === 'asc' ? 'brightness(3)' : 'brightness(1)' }} />
                    </button>
                  </div>

                  {/* Список розділів */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                    {filteredChapters.length > 0 ? (
                      filteredChapters.map((chapter) => {
                        const isRead = readChapters.has(chapter.id);
                        return (
                          <Link key={chapter.id} href={`/reader/${manhwa.id}/${chapter.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                            <div className="chapter-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                {isRead ? (
                                  <svg style={{ width: '20px', height: '20px', color: '#00C2C8', flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                ) : (
                                  <svg style={{ width: '20px', height: '20px', color: '#9A9A9A', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ color: '#CFCFCF', fontSize: '14px', fontWeight: '500' }}>
                                    Том {Math.ceil(chapter.chapterNumber / 20)} Розділ {chapter.chapterNumber}
                                  </p>
                                </div>
                              </div>
                              <p style={{ color: '#9A9A9A', fontSize: '13px', flexShrink: 0, marginLeft: '8px' }}>
                                {new Date(chapter.publishedAt).toLocaleDateString('uk-UA')}
                              </p>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px', color: '#9A9A9A' }}>Розділи не знайдені</div>
                    )}
                  </div>
                </div>

                {/* Правый блок - Коментарі */}
                <div style={{ border: '1px solid #3A3A3A', borderRadius: '12px', padding: '20px', backgroundColor: '#0A0A0A', minWidth: 0 }}>
                  <ManhwaCommentsComponent manhwaId={id} />
                </div>
              </div>
            </>
          )}

          {/* МОБИЛЬНАЯ ВЕРСИЯ - Табы */}
          {isMobile && (
            <div style={{ border: '1px solid #3A3A3A', borderRadius: '12px', backgroundColor: '#0A0A0A', overflow: 'hidden', minWidth: 0, marginBottom: '24px' }}>
              {/* Навигация табов с иконками */}
              <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #3A3A3A', backgroundColor: 'transparent' }}>
                <button
                  onClick={() => setActiveTab('info')}
                  style={{
                    flex: 1,
                    padding: screenSize === 'xs' ? '10px 8px' : screenSize === 'sm' ? '12px 10px' : screenSize === 'md' ? '14px 12px' : '16px 14px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'info' ? '3px solid #A259FF' : 'none',
                    color: activeTab === 'info' ? '#A259FF' : '#9A9A9A',
                    fontSize: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textTransform: 'none',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: screenSize === 'xs' ? '4px' : '6px',
                  }}
                >
                  <svg style={{ width: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px', height: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Інформація
                </button>
                <button
                  onClick={() => setActiveTab('chapters')}
                  style={{
                    flex: 1,
                    padding: screenSize === 'xs' ? '10px 8px' : screenSize === 'sm' ? '12px 10px' : screenSize === 'md' ? '14px 12px' : '16px 14px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'chapters' ? '3px solid #A259FF' : 'none',
                    color: activeTab === 'chapters' ? '#A259FF' : '#9A9A9A',
                    fontSize: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textTransform: 'none',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: screenSize === 'xs' ? '4px' : '6px',
                  }}
                >
                  <img src="/icons/chapters-icon.png" alt="Chapters" style={{ width: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px', height: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px' }} />
                  Розділи ({manhwa.chapters.length})
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  style={{
                    flex: 1,
                    padding: screenSize === 'xs' ? '10px 8px' : screenSize === 'sm' ? '12px 10px' : screenSize === 'md' ? '14px 12px' : '16px 14px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'comments' ? '3px solid #A259FF' : 'none',
                    color: activeTab === 'comments' ? '#A259FF' : '#9A9A9A',
                    fontSize: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textTransform: 'none',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: screenSize === 'xs' ? '4px' : '6px',
                  }}
                >
                  <svg style={{ width: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px', height: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Коментарі ({commentsCount})
                </button>
              </div>

              {/* Содержимое табов */}
              <div style={{ padding: '20px', minWidth: 0 }}>

              {/* ТАБ 1: ІНФОРМАЦІЯ */}
              {activeTab === 'info' && (
                <div>
                  {/* Статистика: Просмотры, Оценка, Кнопка */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'xs' ? '4px' : screenSize === 'sm' ? '6px' : screenSize === 'md' ? '8px' : '10px', marginBottom: '16px', padding: screenSize === 'xs' ? '4px 8px' : screenSize === 'sm' ? '5px 10px' : screenSize === 'md' ? '6px 12px' : '7px 14px', backgroundColor: '#1A1A1A', borderRadius: '6px', border: '1px solid #3A3A3A', height: 'fit-content' }}>
                    {/* Просмотры */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'xs' ? '3px' : screenSize === 'sm' ? '4px' : '5px', flex: 1, minWidth: 0 }}>
                      <svg style={{ width: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '13px', height: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '13px', color: '#9A9A9A', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <p style={{ fontSize: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '11px' : '12px', fontWeight: '600', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>
                        Перегляди: <span style={{ fontWeight: '700' }}>
                          {totalViews > 1000000 ? (totalViews / 1000000).toFixed(1) + 'M' : totalViews > 1000 ? (totalViews / 1000).toFixed(1) + 'K' : totalViews}
                        </span>
                      </p>
                    </div>

                    {/* Оценка */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'xs' ? '3px' : screenSize === 'sm' ? '4px' : '5px', flex: 1, minWidth: 0 }}>
                      <img src="/icons/rating-bubble.png" alt="Rating" style={{ width: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '13px', height: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '12px' : '13px', borderRadius: '3px', flexShrink: 0 }} />
                      <p style={{ fontSize: screenSize === 'xs' ? '10px' : screenSize === 'sm' ? '11px' : screenSize === 'md' ? '11px' : '12px', fontWeight: '600', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>
                        Оцінка: <span style={{ fontWeight: '700' }}>{totalRating.toFixed(1)}</span> <span style={{ color: '#FFFFFF', opacity: 0.6, fontSize: screenSize === 'xs' ? '9px' : '10px' }}>({ratingCount})</span>
                      </p>
                    </div>

                    {/* Кнопка Оцінити */}
                    <button 
                      onClick={() => setShowRatingModal(true)}
                      style={{
                        padding: screenSize === 'xs' ? '4px 8px' : screenSize === 'sm' ? '4px 9px' : screenSize === 'md' ? '5px 10px' : '5px 11px',
                        backgroundColor: 'transparent',
                        border: '1px solid #3A3A3A',
                        borderRadius: '4px',
                        color: '#CFCFCF',
                        fontSize: screenSize === 'xs' ? '9px' : screenSize === 'sm' ? '10px' : screenSize === 'md' ? '10px' : '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        lineHeight: '1.2',
                      }}
                      onMouseEnter={(e) => { 
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.borderColor = '#A259FF';
                        btn.style.color = '#A259FF';
                      }}
                      onMouseLeave={(e) => { 
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.borderColor = '#3A3A3A';
                        btn.style.color = '#CFCFCF';
                      }}
                    >
                      Оцінити
                    </button>
                  </div>

                  {/* Опис */}
                  <div style={{ marginBottom: '20px' }}>
                    <p className="description" style={{ color: '#CFCFCF', lineHeight: '1.45', marginBottom: '12px', fontSize: '14px', fontWeight: '400', display: !expandedDescription && isLongDescription ? '-webkit-box' : 'block', WebkitLineClamp: !expandedDescription && isLongDescription ? 3 : 'unset', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {displayDescription}
                    </p>
                    {isLongDescription && (
                      <button onClick={() => setExpandedDescription(!expandedDescription)} style={{ color: '#A259FF', background: 'none', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}>
                        {expandedDescription ? 'Сховати' : 'Розгорнути повністю'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ТАБ 2: РОЗДІЛИ */}
              {activeTab === 'chapters' && (
                <div>
                  {/* Поле пошуку з сортировкою */}
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: 'transparent', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '0 12px' }}>
                    <input type="text" placeholder="Розділ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', padding: '12px 16px', color: '#CFCFCF', fontSize: '14px', outline: 'none' }} />
                    <button onClick={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')} style={{ padding: '0', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <img src="/icons/arrow-up-icon.png" alt="Sort Up" style={{ width: sortOrder === 'desc' ? '25px' : '23px', height: sortOrder === 'desc' ? '25px' : '23px', filter: sortOrder === 'desc' ? 'brightness(3)' : 'brightness(1)' }} />
                    </button>
                    <button onClick={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')} style={{ padding: '0', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <img src="/icons/arrow-down-icon.png" alt="Sort Down" style={{ width: sortOrder === 'asc' ? '25px' : '23px', height: sortOrder === 'asc' ? '25px' : '23px', filter: sortOrder === 'asc' ? 'brightness(3)' : 'brightness(1)' }} />
                    </button>
                  </div>

                  {/* Список розділів */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                    {filteredChapters.length > 0 ? (
                      filteredChapters.map((chapter) => {
                        const isRead = readChapters.has(chapter.id);
                        return (
                          <Link key={chapter.id} href={`/reader/${manhwa.id}/${chapter.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                            <div className="chapter-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#0A0A0A', borderRadius: '8px', border: '1px solid #3A3A3A', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                {isRead ? (
                                  <svg style={{ width: '20px', height: '20px', color: '#00C2C8', flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                ) : (
                                  <svg style={{ width: '20px', height: '20px', color: '#9A9A9A', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ color: '#CFCFCF', fontSize: '13px', fontWeight: '500', margin: 0 }}>
                                    Розділ {chapter.chapterNumber}
                                  </p>
                                </div>
                              </div>
                              <p style={{ color: '#9A9A9A', fontSize: '12px', flexShrink: 0, marginLeft: '8px' }}>
                                {new Date(chapter.publishedAt).toLocaleDateString('uk-UA')}
                              </p>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px', color: '#9A9A9A' }}>Розділи не знайдені</div>
                    )}
                  </div>
                </div>
              )}

              {/* ТАБ 3: КОМЕНТАРІ */}
              {activeTab === 'comments' && (
                <div>
                  <ManhwaCommentsComponent manhwaId={id} hideHeader={true} onCommentsCountChange={setCommentsCount} />
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модал оценки */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1F1F1F',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ color: '#FFFFFF', marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>
              Оцініть манхву
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: userRating >= star ? '#F6C945' : '#3A3A3A',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: userRating >= star ? '#1F1F1F' : '#9A9A9A',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6C945'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = userRating >= star ? '#F6C945' : '#3A3A3A'}
                >
                  {star}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={async () => {
                  if (userRating === 0) {
                    alert('Виберіть оцінку!');
                    return;
                  }

                  if (!userId) {
                    alert('Будь ласка, увійдіть в аккаунт щоб оцінити манхву');
                    return;
                  }
                  try {
                    const endpoint = `/api/public/${id}/rate`;
                    
                    const response = await fetch(endpoint, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rating: userRating, userId: userId })
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      setCurrentRating(userRating);
                      setTotalRating(data.newAverageRating || data.rating || totalRating);
                      setRatingCount((data.totalRatings || data.ratingCount || ratingCount) + 1);
                      
                      setShowRatingModal(false);
                      setUserRating(0);
                    } else {
                      const errorData = await response.json().catch(() => ({}));
                      alert('Помилка: ' + (errorData.message || 'невідома помилка'));
                    }
                  } catch (err) {
                    alert('Помилка при відправленні оцінки: ' + (err as Error).message);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#A259FF',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B370FF'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#A259FF'}
              >
                Оцінити
              </button>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setUserRating(0);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  border: '1px solid #3A3A3A',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A259FF'; e.currentTarget.style.color = '#A259FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.color = '#FFFFFF'; }}
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}