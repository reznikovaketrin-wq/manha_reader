import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'TriW · Бібліотека',
  description: 'Платформа для читання манхви з зручною читалкою та темною темою',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${manrope.variable} font-manrope`}>
        <div className="min-h-screen flex flex-col bg-page-bg text-text-main">
          {/* Header */}
          <header className="mb-[26px]">
            <div className="max-w-[1160px] mx-auto px-4">
              <div className="flex items-end gap-[20px] py-[14px]">
                <Link href="/" className="group">
                  <div className="relative h-[76px] w-[251px] overflow-hidden bg-[#111111] rounded cursor-pointer transition-opacity group-hover:opacity-80">
                    <Image
                      src="/images/logo_triw_white.svg"
                      alt="TriW logo"
                      fill
                      sizes="251px"
                      className="object-contain"
                      priority
                    />
                  </div>
                </Link>
                <HeaderNav />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}