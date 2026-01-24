# Supabase Setup Checklist

## Critical Settings to Check

### 1. Email Confirmation Settings

Go to: **Authentication > Settings** in your Supabase Dashboard

Check these settings:

- ✅ **Enable email confirmations**: Should be **ENABLED**
- ✅ **Confirm email**: Should be **ENABLED** 
- ✅ **Double confirm email changes**: Recommended to enable
- ✅ **Enable email provider**: Must be enabled

### 2. Site URL Configuration

Go to: **Authentication > URL Configuration**

Configure:
- **Site URL**: `http://localhost:3000` (for development)
- **Redirect URLs**: Add these:
  - `http://localhost:3000/auth/callback`
  - `https://yourdomain.com/auth/callback` (for production)

### 3. Email Templates

Go to: **Authentication > Email Templates**

Verify the "Confirm signup" template is configured with:
- Subject: Something like "Confirm your signup"
- Body contains: `{{ .ConfirmationURL }}`

### 4. Apply Database Migration

Run the SQL from `supabase/migrations/20260125_fix_user_signup.sql`:

```sql
-- This creates the users table and trigger
-- Copy and paste the entire file into SQL Editor
```

## Testing After Setup

1. **Test Signup Flow:**
   ```
   - Go to /auth
   - Click "Register"
   - Fill in email, password
   - Submit
   - Should see "Реєстрація успішна!" message
   - Check email for confirmation link
   ```

2. **Verify Database:**
   ```sql
   -- Check if user was created in public.users
   SELECT id, email, username, role, created_at 
   FROM public.users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

3. **Check Trigger:**
   ```sql
   -- Verify trigger exists
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

## Common Issues & Solutions

### Issue: "Database error saving new user"

**Solutions:**
1. Run the migration SQL
2. Check if `public.users` table exists
3. Verify trigger `on_auth_user_created` exists
4. Check if RLS policies are correct

### Issue: No confirmation email sent

**Solutions:**
1. Check SMTP settings in Supabase (default is Supabase's email service)
2. Verify email template is configured
3. Check spam folder
4. For development, check Supabase logs for email delivery

### Issue: User created but can't login

**Solutions:**
1. Check if email is confirmed:
   ```sql
   SELECT id, email, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'user@example.com';
   ```
2. If `email_confirmed_at` is NULL, user needs to confirm email
3. Can manually confirm for testing:
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email = 'user@example.com';
   ```

## Development vs Production

### Development Setup
- Disable email confirmation for faster testing (optional)
- Use localhost URLs

### Production Setup  
- **MUST** enable email confirmation
- Configure custom SMTP for better deliverability
- Use production domain URLs
- Consider adding captcha for signup

## Quick Debug Commands

```sql
-- Check recent signups
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  pu.username,
  pu.role
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Check trigger status
SELECT 
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth';

-- Test trigger manually (after creating a test user)
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- This tests if the trigger would work
  SELECT public.handle_new_user();
END $$;
```
