# Система авторизации TriW

Новая модульная система авторизации для приложения TriW, построенная с использованием Supabase Auth.

## 📁 Структура

```
features/auth/
├── components/          # React компоненты
│   ├── LoginForm/      # Форма входа
│   ├── RegisterForm/   # Форма регистрации
│   └── AuthModal/      # Модальное окно авторизации
├── hooks/              # Custom React hooks
│   ├── useLogin.ts
│   ├── useRegister.ts
│   ├── useForgotPassword.ts
│   ├── useResetPassword.ts
│   └── useChangePassword.ts
├── services/           # Бизнес-логика
│   ├── AuthService.ts  # Взаимодействие с Supabase Auth
│   └── DataMigrationService.ts  # Миграция данных гостя
├── context/            # React Context
│   └── AuthContext.tsx # Глобальное состояние авторизации
├── types/              # TypeScript типы
│   └── auth.types.ts
├── utils/              # Утилиты
│   ├── validators.ts   # Валидация форм
│   └── errors.ts       # Обработка ошибок
└── index.ts            # Barrel export
```

## 🚀 Быстрый старт

### 1. Использование форм

```tsx
import { LoginForm, RegisterForm } from '@/features/auth';

function MyPage() {
  return (
    <div>
      <LoginForm onSuccess={() => console.log('Успешный вход!')} />
    </div>
  );
}
```

### 2. Использование модального окна

```tsx
import { AuthModal } from '@/features/auth';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Войти</button>
      <AuthModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        initialMode="login"
      />
    </>
  );
}
```

### 3. Использование хука useAuth

```tsx
'use client';

import { useAuth } from '@/features/auth';

function ProfilePage() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Вы не авторизованы</div>;
  }

  return (
    <div>
      <p>Email: {user?.email}</p>
      <button onClick={signOut}>Выйти</button>
    </div>
  );
}
```

## 📚 Основные компоненты

### LoginForm

Форма входа с валидацией email и пароля.

**Props:**
- `onSuccess?: () => void` - Callback после успешного входа
- `onSwitchToRegister?: () => void` - Callback для переключения на регистрацию

**Функции:**
- Валидация email и пароля
- Показ/скрытие пароля
- Опция "Запомнить меня"
- Ссылка на восстановление пароля

### RegisterForm

Форма регистрации с расширенной валидацией.

**Props:**
- `onSuccess?: () => void` - Callback после успешной регистрации
- `onSwitchToLogin?: () => void` - Callback для переключения на вход

**Функции:**
- Валидация email, пароля, username
- Индикатор силы пароля
- Проверка уникальности username
- Согласие с условиями использования
- Email подтверждение

### AuthModal

Универсальное модальное окно для входа и регистрации.

**Props:**
- `isOpen: boolean` - Состояние открытия модала
- `onClose: () => void` - Callback для закрытия
- `initialMode?: 'login' | 'register'` - Начальный режим
- `redirectAfterAuth?: string` - URL для редиректа после авторизации

## 🔧 Hooks

### useAuth

Главный хук для работы с авторизацией.

```tsx
const {
  user,              // Текущий пользователь
  session,           // Текущая сессия
  isLoading,         // Загрузка
  isAuthenticated,   // Авторизован ли пользователь
  signIn,            // Функция входа
  signUp,            // Функция регистрации
  signOut,           // Функция выхода
  resetPassword,     // Восстановление пароля
  updatePassword,    // Обновление пароля
} = useAuth();
```

### useLogin

Хук для формы входа с валидацией и обработкой состояния.

```tsx
const {
  formState,              // Состояние формы (values, errors, touched)
  error,                  // Глобальная ошибка
  showPassword,           // Показывать ли пароль
  handleChange,           // Обработчик изменения поля
  handleBlur,             // Обработчик blur
  handleSubmit,           // Обработчик отправки формы
  togglePasswordVisibility, // Переключение видимости пароля
} = useLogin();
```

### useRegister

Хук для формы регистрации с расширенной валидацией.

```tsx
const {
  formState,
  error,
  success,
  showPassword,
  showConfirmPassword,
  passwordStrength,        // Индикатор силы пароля
  usernameCheckLoading,    // Проверка username
  handleChange,
  handleBlur,
  handleSubmit,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
} = useRegister();
```

## 🔐 Сервисы

### AuthService

Singleton сервис для взаимодействия с Supabase Auth.

```tsx
import { authService } from '@/features/auth';

// Вход
await authService.signIn(email, password, rememberMe);

// Регистрация
await authService.signUp(email, password, { username });

// Выход
await authService.signOut();

// Восстановление пароля
await authService.resetPasswordForEmail(email);

// Обновление пароля
await authService.updatePassword(newPassword);
```

### DataMigrationService

Сервис для миграции данных из localStorage в базу данных при авторизации.

```tsx
import { dataMigrationService } from '@/features/auth';

// Миграция всех данных
const result = await dataMigrationService.migrateAllData(userId);

// Проверка наличия гостевых данных
const hasData = dataMigrationService.hasGuestData();

// Очистка гостевых данных
dataMigrationService.clearGuestData();
```

## ✅ Валидация

### Email

- Обязательное поле
- Корректный формат email

### Password (для входа)

- Обязательное поле
- Минимум 6 символов

### Password (для регистрации/смены)

- Обязательное поле
- Минимум 8 символов
- Минимум 1 заглавная буква
- Минимум 1 цифра
- Минимум 1 спецсимвол
- Индикатор силы пароля (0-4)

### Username

- Опциональное
- 3-20 символов
- Только буквы, цифры, подчеркивания
- Проверка уникальности

## 🎨 Стилизация

Все компоненты используют CSS Modules и следуют единому дизайну:

- Розово-фиолетовые градиенты (`#ec4899` → `#8b5cf6`)
- Темная тема
- Плавные анимации (transition: 0.3s)
- Responsive дизайн (mobile-first)

## 🔄 Миграция данных

При входе или регистрации автоматически мигрируются данные из localStorage:

1. **История чтения** - `manhwa_reading_history`
2. **Закладки** - `manhwa_bookmarks`
3. **Прогресс чтения** - `manhwa_reading_progress`

После успешной миграции гостевые данные очищаются.

## 🚫 Обработка ошибок

Все ошибки Supabase автоматически переводятся на украинский язык:

```tsx
import { getAuthErrorMessage } from '@/features/auth';

try {
  await authService.signIn(email, password);
} catch (error) {
  const message = getAuthErrorMessage(error);
  // "Невірний email або пароль"
}
```

## 📊 Analytics

Все важные события логируются:

```tsx
import { logAuthEvent, AuthEvents } from '@/features/auth';

logAuthEvent(AuthEvents.SIGN_IN_SUCCESS, { userId: user.id });
```

События:
- `SIGN_UP_SUCCESS` / `SIGN_UP_ERROR`
- `SIGN_IN_SUCCESS` / `SIGN_IN_ERROR`
- `SIGN_OUT`
- `PASSWORD_RESET_REQUEST` / `PASSWORD_RESET_SUCCESS`
- `PASSWORD_CHANGE_SUCCESS`
- `EMAIL_VERIFIED`

## 🔒 Безопасность

- CSRF защита через Supabase токены
- Rate limiting (настраивается в Supabase Dashboard)
- Email верификация
- Хэширование паролей на стороне Supabase
- Session management с auto-refresh

## 📱 Accessibility

- Все формы имеют proper labels
- Keyboard navigation (Tab, Enter, Esc)
- ARIA-labels для иконок
- Screen reader friendly
- Focus management

## 🎯 Best Practices

1. **Всегда используйте useAuth** для доступа к состоянию авторизации
2. **Оборачивайте защищенные страницы** в проверку `isAuthenticated`
3. **Используйте AuthModal** для inline авторизации
4. **Не забывайте про миграцию** данных при входе/регистрации
5. **Логируйте события** для аналитики

## 🐛 Troubleshooting

### "useAuth must be used within AuthProvider"

Убедитесь, что ваш компонент обернут в `AuthProvider`:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/features/auth';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### Email не отправляется

Проверьте настройки Email в Supabase Dashboard:
- Authentication → Email Templates
- Settings → Email provider

### Сессия не сохраняется

Проверьте настройки cookies и localStorage. Убедитесь, что `persistSession: true` в конфигурации Supabase.

## 📝 TODO

- [ ] ForgotPasswordForm компонент
- [ ] ResetPasswordForm компонент  
- [ ] ChangePasswordForm компонент
- [ ] Unit тесты
- [ ] E2E тесты
- [ ] Storybook документация

## 📄 License

MIT
