    'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HeaderNav() {
  const pathname = usePathname();

  const isLibrary = pathname === '/';
  const isSchedule = pathname === '/schedule';

  return (
    <nav className="flex items-end gap-8">
      <Link
        href="/"
        className={`font-extrabold text-[34px] uppercase tracking-tight-2 transition-all duration-200 ${
          isLibrary
            ? 'text-white'
            : 'text-text-muted hover:text-white'
        }`}
      >
        Бібліотека
      </Link>
      <Link
        href="/schedule"
        className={`font-extrabold text-[34px] uppercase tracking-tight-2 transition-all duration-200 ${
          isSchedule
            ? 'text-white'
            : 'text-text-muted hover:text-white'
        }`}
      >
        Розклад
      </Link>
    </nav>
  );
}