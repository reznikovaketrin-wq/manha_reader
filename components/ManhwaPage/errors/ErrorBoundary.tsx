// components/ManhwaPage/errors/ErrorBoundary.tsx
'use client';

import React, { ReactNode } from 'react';
import { getErrorFallback, AppError } from '@/components/ManhwaPage/errors/AppError';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - ловит ошибки, возникшие при рендере
 * 
 * ✅ Правильно обрабатывает ошибки с классификацией
 * ✅ Показывает специфичный UI для разных типов ошибок
 * ✅ Логирует ошибки для отладки
 * 
 * ⚠️ ВАЖНО: ErrorBoundary НЕ ловит:
 * - Ошибки в обработчиках событий (используй try/catch)
 * - Ошибки в асинхронном коде (используй try/catch или .catch())
 * - Ошибки выбрасываемые на уровне сервера (используй server-side обработку)
 * - Ошибки при SSR (они должны быть обработаны на сервере)
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error caught by ErrorBoundary:', {
      error,
      componentStack: errorInfo.componentStack,
    });

    // Вызываем callback если передан
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Если передан кастомный fallback, используем его
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Получаем специфичный UI для ошибки
      const errorInfo = getErrorFallback(this.state.error);

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
            flexDirection: 'column',
            gap: '20px',
            padding: '20px',
          }}
        >
          {/* Иконка ошибки */}
          <div style={{ fontSize: '64px' }}>
            {errorInfo.title.split(' ')[0]}
          </div>

          {/* Заголовок ошибки */}
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '28px',
              fontWeight: '700',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {errorInfo.title}
          </h1>

          {/* Сообщение ошибки */}
          <p
            style={{
              color: '#9A9A9A',
              fontSize: '16px',
              textAlign: 'center',
              maxWidth: '500px',
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            {errorInfo.message}
          </p>

          {/* Debug информация (только в development) */}
          {process.env.NODE_ENV === 'development' && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#1A1A1A',
                borderRadius: '8px',
                border: '1px solid #3A3A3A',
                fontSize: '12px',
                color: '#FF6B6B',
                maxWidth: '600px',
                overflow: 'auto',
                maxHeight: '150px',
              }}
            >
              <strong>Debug Info:</strong>
              <pre
                style={{
                  margin: '8px 0 0 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error.message}
              </pre>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            {/* Retry button (если ошибка retryable) */}
            {errorInfo.retryable && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#A259FF',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
              >
                {errorInfo.action}
              </button>
            )}

            {/* Navigation link */}
            {errorInfo.actionLink && (
              <a
                href={errorInfo.actionLink}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3A3A3A',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#4A4A4A';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#3A3A3A';
                }}
              >
                {errorInfo.action}
              </a>
            )}
          </div>

          {/* Additional info */}
          <p
            style={{
              color: '#5A5A5A',
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '20px',
            }}
          >
            Якщо проблема зберігається, будь ласка,
            <br />
            <a
              href="mailto:support@example.com"
              style={{ color: '#A259FF', textDecoration: 'none' }}
            >
              зв\'яжіться з технічною підтримкою
            </a>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}