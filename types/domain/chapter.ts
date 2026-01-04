'use client';

/**
 * Domain Types - то что используется в UI / бизнес-логике
 * Это оптимизировано для отображения и работы в компоненте
 */

export interface Chapter {
  id: string;
  number: number;
  title?: string;
  pages: number;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}