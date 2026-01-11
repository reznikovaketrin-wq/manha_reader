-- Migration: Add role duration columns to users table
-- Date: 2026-01-11
-- Description: Adds columns for role expiration and duration type to the users table.
-- PRE-RELEASE 1: Комментирую миграцию, чтобы она не выполнилась автоматически.
-- Оригинальный скрипт сохранён ниже и закомментирован.

/*
DO $$
BEGIN
    -- Check if the columns already exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role_expiration'
    ) THEN
        -- Add role_expiration column
        ALTER TABLE public.users ADD COLUMN role_expiration TIMESTAMP;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role_duration_type'
    ) THEN
        -- Add role_duration_type column
        ALTER TABLE public.users ADD COLUMN role_duration_type VARCHAR(20);
    END IF;
END $$;
*/

-- Закомментировано: 2026-01-11 — пометка: PRE-RELEASE 1