# Profile Columns Verification Guide

## 🔍 STEP 1: VERIFY EXISTING COLUMNS

Before running any migration, let's check what already exists in your `users` table.

### Run This Query in Supabase SQL Editor:

```sql
-- Check ALL columns in users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;
```

---

## 📋 EXPECTED RESULTS

### Columns We Need for Profile Card:
1. ✅ `name` - Should already exist (from auth)
2. ✅ `email` - Should already exist (from auth)
3. ✅ `role` - Should already exist (from auth)
4. ❓ `profile_photo_url` - **CHECK IF EXISTS**
5. ❓ `bio` - **CHECK IF EXISTS**
6. ❓ `location` - **CHECK IF EXISTS**
7. ❓ `social_links` - **CHECK IF EXISTS**

---

## 🎯 WHAT TO DO NEXT

### Scenario A: ALL Profile Columns Exist ✅
**If you see all 7 columns above:**
- ✅ No migration needed!
- ✅ Profile card should work immediately
- ✅ The 400 error might be something else

**Next Steps:**
1. Check the actual error message in browser console
2. Verify RLS policies allow reading these columns
3. Test with a simple query:
```sql
SELECT id, email, name, role, profile_photo_url, bio, location, social_links
FROM users
WHERE role = 'organizer'
LIMIT 1;
```

---

### Scenario B: SOME Profile Columns Missing ⚠️
**If you see only `name`, `email`, `role` but NOT the others:**

**Run this modified migration (only adds missing columns):**

```sql
-- Only add columns that don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_photo 
ON users(profile_photo_url) 
WHERE profile_photo_url IS NOT NULL;
```

**The `IF NOT EXISTS` ensures it won't break if some columns already exist!**

---

### Scenario C: Different Column Names 🔄
**If you see similar columns with different names:**
- `profile_image` instead of `profile_photo_url`
- `description` instead of `bio`
- `user_location` instead of `location`

**We need to update the code to match YOUR column names.**

---

## 🔍 STEP 2: CHECK RLS POLICIES

Even if columns exist, RLS might be blocking access.

```sql
-- Check if users can read their own profile
SELECT 
    policyname,
    cmd as command,
    qual as using_clause
FROM pg_policies
WHERE tablename = 'users'
AND cmd = 'SELECT'
ORDER BY policyname;
```

**Expected:** Should see a policy allowing users to read their own row:
```sql
USING (auth.uid() = id)
```

---

## 🐛 DEBUGGING THE 400 ERROR

The 400 error you're seeing:
```
xhunnsczqjwfrwgjetff.supabase.co/rest/v1/users?select=id,email,name,role,profile_photo_url,bio,location,social_links,created_at&id=eq.d243f854-b9ef-4de2-a122-58c42440a754&role=eq.organizer
```

**Possible causes:**
1. ❌ Column doesn't exist → Run migration
2. ❌ RLS blocks access → Fix RLS policy
3. ❌ Wrong column name → Update code
4. ❌ Wrong data type → Fix migration

---

## 📊 QUICK DIAGNOSTIC QUERY

Run this to see EXACTLY what's wrong:

```sql
-- Test the exact query that's failing
SELECT 
    id,
    email,
    name,
    role,
    created_at
    -- Try adding these one by one to see which fails:
    -- , profile_photo_url
    -- , bio
    -- , location
    -- , social_links
FROM users
WHERE id = 'd243f854-b9ef-4de2-a122-58c42440a754'
AND role = 'organizer';
```

**Add columns one by one until you get an error. That tells you which column is missing!**

---

## ✅ VERIFICATION CHECKLIST

After running migration (if needed):

- [ ] All 7 columns exist in `users` table
- [ ] Can query profile columns without error
- [ ] RLS allows reading own profile
- [ ] Profile card appears on dashboard
- [ ] No 400 errors in console

---

## 🆘 NEED HELP?

**Copy and paste the results of this query:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('name', 'email', 'role', 'profile_photo_url', 'bio', 'location', 'social_links')
ORDER BY column_name;
```

**This will show exactly what exists vs. what's missing!**

