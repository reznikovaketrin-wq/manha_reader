# Signup Database Error Fix

## Problem
Users were experiencing a `500 Internal Server Error` when trying to sign up:
```
POST https://[supabase-url]/auth/v1/signup 500 (Internal Server Error)
[AUTH] auth_signup_error {error: 'Database error saving new user'}
```

## Root Cause
The Supabase database was missing a trigger to automatically create a user profile in the `public.users` table when a new user signs up via `auth.users`.

## Solution

### 1. Apply Database Migration
Run the SQL migration file located at `supabase/migrations/20260125_fix_user_signup.sql`

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20260125_fix_user_signup.sql`
4. Paste and run the SQL

**Option B: Using Supabase CLI**
```bash
# If you have supabase CLI installed
supabase db push
```

### 2. What the Migration Does

The migration:
- ✅ Creates the `public.users` table with proper schema
- ✅ Sets up a database trigger `on_auth_user_created`
- ✅ Automatically creates user profiles when users sign up
- ✅ Configures Row Level Security (RLS) policies
- ✅ Sets proper permissions and indexes

### 3. Code Changes

**UserMenu.tsx** - Reduced console spam:
- Changed console.log to only run in development mode
- Prevents excessive logging when component re-renders

**AuthService.ts** - Better error handling:
- Enhanced error messages for database errors
- User-friendly error messages shown to end users
- Detailed error logging for developers

## Testing

After applying the migration, test the signup flow:

1. Try creating a new account
2. Verify no "Database error" appears
3. Check that the user profile is created in `public.users`
4. Confirm user can log in successfully

## Verification Query

Run this in Supabase SQL Editor to verify the trigger exists:
```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Verify users table schema
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public';
```

## Rollback (if needed)

If you need to rollback the changes:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

## Additional Issues Fixed

### UserMenu Console Spam
**Before:**
```
UserMenu.tsx:27 👤 [UserMenu] No user, showing login buttons
UserMenu.tsx:27 👤 [UserMenu] No user, showing login buttons
UserMenu.tsx:27 👤 [UserMenu] No user, showing login buttons
...
```

**After:**
- Logs only appear in development mode
- Production builds have clean console

## Notes

- The trigger uses `SECURITY DEFINER` to ensure it has permissions to insert into `public.users`
- Default role is set to `'user'` for all new signups
- Username is extracted from `raw_user_meta_data` if provided during signup
- `ON CONFLICT DO NOTHING` prevents errors if user already exists

## Related Files
- [supabase/migrations/20260125_fix_user_signup.sql](supabase/migrations/20260125_fix_user_signup.sql)
- [components/UserMenu.tsx](components/UserMenu.tsx)
- [features/auth/services/AuthService.ts](features/auth/services/AuthService.ts)
