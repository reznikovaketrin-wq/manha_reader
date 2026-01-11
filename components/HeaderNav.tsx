'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider'; // ✅ Context auth
import UserMenu from '@/components/UserMenu';

export default function HeaderNav() {
  const pathname = usePathname();
  const { loading } = useUser(); // ✅ User з Context
  
  const isLibrary = pathname === '/';
  const isSchedule = pathname === '/schedule';

  return (
    <nav className="flex items-center gap-2 md:gap-8 w-full pl-0 pr-2 md:px-0">
      {/* Ссылки - сжимаются на мобилке */}
      <div className="flex items-center gap-2 md:gap-8 flex-1 min-w-0">
        <Link
          href="/" // ✅ ВАРИАНТ 2
          className={`font-extrabold text-[15px] md:text-base lg:text-2xl xl:text-[34px] uppercase tracking-tight transition-all duration-200 whitespace-nowrap flex-shrink-0 md:-translate-y-[5px] ${
            isLibrary
              ? 'text-white'
              : 'text-text-muted hover:text-white'
          }`}
        >
          БІБЛІОТЕКА
        </Link>
        <Link
          href="/schedule" // ✅ ВАРИАНТ 2
          className={`font-extrabold text-[15px] md:text-base lg:text-2xl xl:text-[34px] uppercase tracking-tight transition-all duration-200 whitespace-nowrap flex-shrink-0 md:-translate-y-[5px] ${
            isSchedule
              ? 'text-white'
              : 'text-text-muted hover:text-white'
          }`}
        >
          РОЗКЛАД
        </Link>
      </div>
      
      {/* UserMenu - не сжимается, прижат вправо */}
      <div className="ml-auto flex items-center flex-shrink-0">
        {!loading && <UserMenu />}
      </div>
    </nav>
  );
}