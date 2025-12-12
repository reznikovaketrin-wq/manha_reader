'use client';

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

  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${manrope.variable} font-manrope`}>
        <div className="min-h-screen flex flex-col bg-page-bg text-text-main">
          {/* Единый контейнер для всего контента */}
          <div style={{ width: '100%', padding: '0 32px' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
              {/* Header - на всех страницах */}
              <header style={{ paddingTop: '14px', paddingBottom: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
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
              </header>

              {/* Main Content */}
              <main className="flex-1" style={{ marginTop: '12px' }}>
                {children}
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}