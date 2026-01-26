// components/Header.tsx
// ✅ Server Component - no auth logic (auth handled in client HeaderNav via UserProvider)

import Image from 'next/image';
import Link from 'next/link';
import HeaderNav from './HeaderNav';

export default function Header() {
  // No server-side auth - HeaderNav uses UserProvider for client-side auth

  return (
    <header style={{ paddingTop: '14px', paddingBottom: '14px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
        {/* Логотип */}
        <Link href="/" className="group flex-shrink-0">
          <div className="relative h-[76px] w-[251px] overflow-hidden bg-[#111111] rounded cursor-pointer transition-opacity group-hover:opacity-80 max-[720px]:h-[42px] max-[720px]:w-[138px]">
            <Image
              src="/images/logo_triw_white.svg"
              alt="TriW logo"
              fill
              sizes="(max-width: 720px) 138px, 251px"
              className="object-contain"
              priority
            />
          </div>
        </Link>
        
        {/* Навигация */}
        <HeaderNav />
      </div>
    </header>
  );
}