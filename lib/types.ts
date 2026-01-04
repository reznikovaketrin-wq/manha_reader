// lib/types.ts
// ✅ Типы для сериализованного user

export type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
};