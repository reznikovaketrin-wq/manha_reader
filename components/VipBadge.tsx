'use client';

interface VipBadgeProps {
  vipOnly?: boolean;
  vipEarlyDays?: number;
  userRole?: 'user' | 'vip' | 'admin';
  publishedAt?: string;
  className?: string;
}

export function VipBadge({ 
  vipOnly = false, 
  vipEarlyDays = 0, 
  userRole = 'user',
  publishedAt,
  className = '' 
}: VipBadgeProps) {
  // Не показываем бейдж если нет VIP-ограничений
  if (!vipOnly && vipEarlyDays === 0) {
    return null;
  }

  // Проверка раннего доступа
  const isEarlyAccess = () => {
    if (!publishedAt || vipEarlyDays === 0) return false;
    
    const publishDate = new Date(publishedAt);
    const earlyAccessDate = new Date(publishDate.getTime() - vipEarlyDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    return now >= earlyAccessDate && now < publishDate;
  };

  // Админы и VIP видят особые бейджи
  const showEarlyAccessBadge = isEarlyAccess() && userRole === 'vip';
  const showVipOnlyBadge = vipOnly;
  const showLockedBadge = vipOnly && userRole === 'user';

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Бейдж "VIP Only" для обычных пользователей */}
      {showLockedBadge && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold">
          🔒 VIP Only
        </span>
      )}

      {/* Бейдж "VIP" для VIP и админов */}
      {showVipOnlyBadge && !showLockedBadge && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-semibold">
          ⭐ VIP
        </span>
      )}

      {/* Бейдж раннего доступа для VIP */}
      {showEarlyAccessBadge && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold animate-pulse">
          ⏰ Ранній доступ
        </span>
      )}
    </div>
  );
}

interface VipBlockProps {
  vipOnly: boolean;
  userRole?: 'user' | 'vip' | 'admin';
  children: React.ReactNode;
}

export function VipContentBlock({ vipOnly, userRole = 'user', children }: VipBlockProps) {
  // Админы и VIP видят контент
  if (!vipOnly || userRole === 'vip' || userRole === 'admin') {
    return <>{children}</>;
  }

  // Обычные пользователи видят заглушку
  return (
    <div className="relative">
      {/* Размытый контент */}
      <div className="filter blur-sm pointer-events-none select-none opacity-40">
        {children}
      </div>
      
      {/* Overlay с информацией */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold text-text-main mb-2">VIP Контент</h3>
          <p className="text-text-muted mb-4">
            Цей контент доступний тільки для VIP користувачів
          </p>
          <button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors shadow-lg">
            ⭐ Стати VIP
          </button>
        </div>
      </div>
    </div>
  );
}
