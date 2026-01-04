'use client';

/**
 * ErrorTaxonomy - классификация ошибок для специфичного handling
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Помилка мережі') {
    super('NETWORK_ERROR', message, 0, true);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Потрібна авторизація') {
    super('AUTH_ERROR', message, 401, false);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Ресурс') {
    super('NOT_FOUND', `${resource} не знайдено`, 404, false);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(public fields: Record<string, string>) {
    super('VALIDATION_ERROR', 'Помилка валідації', 400, false);
    this.name = 'ValidationError';
  }
}

/**
 * Переводить HTTP ошибки в AppError
 */
export function mapHttpError(status: number, message: string): AppError {
  switch (status) {
    case 401:
      return new AuthError();
    case 404:
      return new NotFoundError();
    case 0:
      return new NetworkError();
    default:
      return new AppError('UNKNOWN_ERROR', message, status, false);
  }
}

/**
 * Error Boundary для специфичного handling
 */
export function getErrorFallback(error: Error) {
  if (error instanceof AuthError) {
    return {
      title: '🔐 Потрібна авторизація',
      message: 'Будь ласка, залогіньтеся щоб продовжити',
      action: 'Логін',
      actionLink: '/login',
    };
  }

  if (error instanceof NotFoundError) {
    return {
      title: '❌ Не знайдено',
      message: 'На жаль, це не існує',
      action: 'Назад до каталогу',
      actionLink: '/catalog',
    };
  }

  if (error instanceof NetworkError) {
    return {
      title: '🌐 Помилка мережі',
      message: 'Перевір своє з\'єднання і спробуй ще раз',
      action: 'Спробувати знову',
      actionLink: null,
      retryable: true,
    };
  }

  return {
    title: '😞 Щось пішло не так',
    message: error.message || 'Невідома помилка',
    action: 'На головну',
    actionLink: '/',
  };
}