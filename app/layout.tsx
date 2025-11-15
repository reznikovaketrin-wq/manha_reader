import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import Image from 'next/image'

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
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex items-center gap-[18px] px-[18px] py-[14px] mb-[26px]">
            <div className="flex items-center gap-[18px]">
              <div className="relative h-[100px] w-[100px] overflow-hidden rounded-lg bg-[#111111]">
                <Image
                  src="/images/logo_triw_white.svg"
                  alt="TriW logo"
                  fill
                  sizes="100px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="font-extrabold text-[30px] uppercase tracking-tight-2 text-white mt-[38px]">
                Бібліотека
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
