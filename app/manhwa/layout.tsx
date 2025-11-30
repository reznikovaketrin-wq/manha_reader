import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import HeaderNav from '@/components/HeaderNav';

export const metadata: Metadata = {
  title: 'TriW · Манхва',
  description: 'Просмотр манхвы',
};

export default function ManhwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-text-main">
      {/* Full-width Header */}
      <header className="w-full border-b border-text-muted/10 mb-[26px]">
        <div className="px-6 py-[14px]">
          <div className="flex items-end gap-[20px]">
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

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}