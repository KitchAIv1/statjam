# 🚨 CRITICAL: Database Trigger Role Mapping is BROKEN

## Issue Confirmed
The database trigger that creates user profiles on signup is **ignoring the role metadata** and always creating `role: 'player'` regardless of what the user selected.

## Evidence
```
User selects: "Organizer" 
Trigger creates: role: 'player'  ❌ WRONG
Expected: role: 'organizer'      ✅ CORRECT
```

## Current Broken Trigger Logic
The trigger is likely using:
```sql
-- ❌ BROKEN: Always defaults to 'player'
COALESCE(NEW.raw_user_meta_data->>'userType', 'player')
```

## Required Fix for Backend Team

### **IMMEDIATE ACTION NEEDED:**

Replace the current trigger with this corrected version:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, country, premium_status, name)
  VALUES (
    NEW.id,
    NEW.email,
    -- ✅ FIXED: Proper role mapping with CASE statement
    CASE 
      WHEN NEW.raw_user_meta_data->>'userType' = 'organizer' THEN 'organizer'
      WHEN NEW.raw_user_meta_data->>'userType' = 'stat_admin' THEN 'stat_admin'
      ELSE 'player'
    END,
    COALESCE(NEW.raw_user_meta_data->>'country', 'US'),
    FALSE,
    TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'lastName', '')
    ))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **Debug the Current Trigger:**

Check what's currently deployed:
```sql
-- 1. Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check function definition
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- 3. Test metadata extraction
SELECT 
  id, 
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'userType' as extracted_user_type
FROM auth.users 
WHERE email = 'kjkl@lkj.com';
```

## Frontend Workaround Implemented

I've added an **automatic role correction** that will:

1. **Detect role mismatch** when user signs up
2. **Automatically update** the profile with correct role
3. **Log the correction** for monitoring
4. **Continue normally** with correct role

### **Expected Logs After Fix:**
```
⚠️ useAuthV2: Role mismatch! Requested: organizer, Got: player
🔧 useAuthV2: Attempting to fix role mismatch...
✅ useAuthV2: Role corrected successfully!
```

## Impact

### **Before Fix:**
- ❌ All organizer signups get player profiles
- ❌ All stat_admin signups get player profiles  
- ❌ Users can't access their intended features
- ❌ Organizers can't create tournaments

### **After Fix:**
- ✅ Organizer signups get organizer profiles
- ✅ Stat_admin signups get stat_admin profiles
- ✅ Player signups continue working
- ✅ Automatic correction for any remaining issues

## Testing Required

After backend fixes the trigger:

1. **Test organizer signup** - should create `role: 'organizer'`
2. **Test stat_admin signup** - should create `role: 'stat_admin'`
3. **Test player signup** - should create `role: 'player'`
4. **Verify metadata extraction** - check `raw_user_meta_data` contains `userType`

## Temporary Manual Fix

For existing broken profiles:
```sql
-- Fix existing organizer who got player role
UPDATE public.users 
SET role = 'organizer' 
WHERE email = 'kjkl@lkj.com';

-- Check all recent signups that might be affected
SELECT id, email, role, created_at 
FROM public.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
AND role = 'player'
ORDER BY created_at DESC;
```

---

**PRIORITY: CRITICAL**  
**STATUS: Backend trigger needs immediate fix**  
**WORKAROUND: Frontend auto-correction implemented**
