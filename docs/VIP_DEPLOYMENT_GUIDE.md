# VIP System Implementation - Deployment Guide

## 🚀 Overview
This guide covers deploying the VIP role system with early access and exclusive content features.

## 📋 Prerequisites
- Database access (Supabase/Postgres)
- Admin access to the application
- Backup of current database state

## 🔧 Deployment Steps

### 1. Database Migration

Run the migration script in your database:

```bash
# Connect to your database
psql -h <your-db-host> -U <user> -d <database>

# Run migration
\i features/auth/migrations/005_add_vip_role_and_content_access.sql
```

**Verification:**
```sql
-- Check if columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'manhwa' 
AND column_name IN ('vip_only', 'vip_early_days');

-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'can_user_access_vip_content';
```

### 2. Deploy Application Code

```bash
# Pull latest changes
git pull origin main

# Install dependencies (if any new)
npm install

# Build the application
npm run build

# Restart the application
npm run start
# OR (for PM2)
pm2 restart manhwa-reader
```

### 3. Verify Deployment

**Check API Endpoints:**
```bash
# Test role assignment (requires admin token)
curl -X POST http://localhost:3000/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"vip"}'

# Test users list
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Check UI:**
1. Login as admin
2. Navigate to `/admin`
3. Switch to "Користувачі" tab
4. Verify role dropdown shows: User, VIP, Admin
5. Switch to "Манхви" tab
6. Click "Нова манхва"
7. Verify VIP settings section appears

## 👥 Assigning VIP Role

### Via Admin UI (Recommended)
1. Login as admin
2. Go to `/admin`
3. Click "Користувачі" tab
4. Find user
5. Select "VIP" from dropdown
6. Changes save automatically

### Via SQL (Manual)
```sql
-- Assign VIP role
UPDATE users SET role = 'vip' WHERE email = 'user@example.com';

-- Verify
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

## 🎯 Creating VIP Content

### VIP-Only Content
1. Create/edit manhwa in admin panel
2. Check "🔒 Тільки для VIP"
3. Save - only VIP and admins can see it

### Early Access Content
1. Create/edit manhwa
2. Set "⏰ Ранній доступ для VIP" to number of days (e.g., 3)
3. Save - VIP users see content 3 days before public release

## 🧪 Testing Checklist

### Role Assignment
- [ ] Admin can change user role to VIP
- [ ] Admin can change user role to User
- [ ] Admin can change user role to Admin
- [ ] Non-admin cannot access role change endpoint
- [ ] Role changes are reflected immediately

### Content Visibility
- [ ] VIP-only manhwa hidden from regular users
- [ ] VIP-only manhwa visible to VIP users
- [ ] VIP-only manhwa visible to admins
- [ ] Early access works (VIP sees content X days early)
- [ ] Regular users see lock icon on VIP content
- [ ] VIP users see VIP badge
- [ ] VIP users see "Ранній доступ" badge when applicable

### UI Elements
- [ ] Admin panel shows user management tab
- [ ] Role dropdown works correctly
- [ ] AddManhwaModal shows VIP settings
- [ ] VIP checkboxes save correctly
- [ ] VIP badges display on content cards

## 🔄 Rollback Plan

If issues occur, rollback using:

```sql
-- Rollback migration
DROP FUNCTION IF EXISTS can_user_access_vip_content;
DROP TABLE IF EXISTS role_change_audit CASCADE;
DROP VIEW IF EXISTS admin_manhwa CASCADE;
ALTER TABLE chapters DROP COLUMN IF EXISTS vip_only, DROP COLUMN IF EXISTS vip_early_days;
ALTER TABLE manhwa DROP COLUMN IF EXISTS vip_only, DROP COLUMN IF EXISTS vip_early_days;
```

Then redeploy previous application version:
```bash
git checkout <previous-commit>
npm run build
npm run start
```

## 📊 Monitoring

**Metrics to watch:**
- Role change audit logs
- VIP content access patterns
- Error rates in `/api/admin/users/*` endpoints
- Database query performance on VIP filters

**Logs to check:**
```bash
# Application logs
tail -f logs/app.log | grep -E "Role|VIP|admin/users"

# Database logs
# Check for slow queries on manhwa table
```

## ⚠️ Important Notes

1. **Security**: All VIP checks MUST happen on server side
2. **Cache**: Clear any CDN/cache after migration
3. **Existing Content**: All existing content defaults to non-VIP (public)
4. **Users**: All existing users remain as 'user' role by default
5. **Admin Role**: At least one admin must exist before deployment

## 🆘 Troubleshooting

### "Role not found" error
- Check database migration ran successfully
- Verify `users` table has `role` column
- Check if enum type needs updating

### "Cannot access VIP content" error
- Verify user role in database
- Check browser cookies/session
- Clear application cache

### UI not showing VIP controls
- Check browser console for errors
- Verify components imported correctly
- Hard refresh (Ctrl+F5)

## 📞 Support

For issues or questions:
- Check logs: `/var/log/manhwa-reader/`
- Review migration status in database
- Contact development team

---

**Last Updated:** January 11, 2026
**Version:** 1.0.0
