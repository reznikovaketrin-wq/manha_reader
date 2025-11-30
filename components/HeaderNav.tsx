'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '@/components/UserMenu';

export default function HeaderNav() {
  const pathname = usePathname();

  const isLibrary = pathname === '/';
  const isSchedule = pathname === '/schedule';

  return (
    <nav className="flex items-center gap-2 md:gap-8 w-full px-2 md:px-0">
      {/* Ссылки - сжимаются на мобилке */}
      <div className="flex items-center gap-2 md:gap-8 flex-1 min-w-0">
        <Link
          href="/"
          className={`font-extrabold text-xs md:text-sm lg:text-[34px] uppercase tracking-tight transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
            isLibrary
              ? 'text-white'
              : 'text-text-muted hover:text-white'
          }`}
        >
          Бібліотека
        </Link>
        <Link
          href="/schedule"
          className={`font-extrabold text-xs md:text-sm lg:text-[34px] uppercase tracking-tight transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
            isSchedule
              ? 'text-white'
              : 'text-text-muted hover:text-white'
          }`}
        >
          Розклад
        </Link>
      </div>

      {/* UserMenu - не сжимается, прижат вправо */}
      <div className="ml-auto flex items-center flex-shrink-0">
        <UserMenu />
      </div>
    </nav>
  );
}