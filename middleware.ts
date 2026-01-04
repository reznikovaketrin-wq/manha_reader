import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Просто пропускаем все запросы
  // Реальная защита /admin маршрутов будет на уровне компонентов через useAdminAuth
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};