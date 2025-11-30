'use client';

import { usePathname } from 'next/navigation';
import { Manrope } from 'next/font/google';
import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import HeaderNav from '@/components/HeaderNav';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '800'],
  variable: '--font-manrope',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isManhwaPage = pathname.startsWith('/manhwa');

  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${manrope.variable} font-manrope`}>
        <div className="min-h-screen flex flex-col bg-page-bg text-text-main">
          {/* Header - только для НЕ-manhwa страниц */}
          {!isManhwaPage && (
            <header className="mb-[26px] max-[720px]:mb-4">
              <div className="max-w-[1160px] mx-auto px-4">
                <div className="flex items-end gap-[20px] py-[14px] max-[720px]:gap-3 max-[720px]:py-3">
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
                  <HeaderNav />
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}