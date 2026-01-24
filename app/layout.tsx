import { Manrope } from 'next/font/google';
import Header from '@/components/Header';
import { UserProvider } from '@/app/providers/UserProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider } from '@/features/auth';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '800'],
  variable: '--font-manrope',
});

export const metadata = {
  title: 'TriW - Щоденник манхви',
  description: 'Щоденник читання манхви',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
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
          {/* ✅ React Query для кеширования и синхронизации данных */}
          <QueryProvider>
            {/* ✅ Auth providers для системы авторизации */}
            <AuthProvider>
              <UserProvider>
              {/* ✅ ЕДИНЫЙ SITE CONTAINER для Header и контента */}
              <div className="site-container">
                {/* ✅ Header компонент - включает логотип и навигацию */}
                <Header />

                {/* Main Content */}
                <main className="flex-1" style={{ marginTop: '12px' }}>
                  {children}
                </main>

                {/* Global client modals (none) */}
              </div>
            </UserProvider>
          </AuthProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}