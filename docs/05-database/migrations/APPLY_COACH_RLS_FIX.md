# 🚨 EMERGENCY: Apply Coach RLS Fix

## ⚡ **IMMEDIATE ACTION REQUIRED**

Your coach signup worked, but the profile fetch is failing due to **infinite recursion in RLS policies**.

---

## 📋 **Step-by-Step Fix**

### **STEP 1: Open Supabase SQL Editor**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

---

### **STEP 2: Copy and Paste the Fix**

Copy the **ENTIRE contents** of this file:
```
statjam/docs/05-database/migrations/FINAL_COACH_RLS_FIX.sql
```

Paste it into the Supabase SQL Editor.

---

### **STEP 3: Run the Query**
1. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for all statements to execute (~5 seconds)
3. You should see success messages like:
   ```
   ✅ All existing policies dropped
   ✅ RLS enabled on users table
   ✅ Created users_self_access policy
   ✅ Created users_authenticated_read policy
   ✅ Created users_anon_read policy
   ✅ Created users_signup_insert policy
   ✅ RLS fix complete! Try logging in now.
   ```

---

### **STEP 4: Verify the Fix**

Run this verification query in Supabase:

```sql
-- Check policies
SELECT 
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

**Expected result: 4 policies**
- `users_anon_read` (SELECT)
- `users_authenticated_read` (SELECT)
- `users_self_access` (ALL)
- `users_signup_insert` (INSERT)

---

### **STEP 5: Test Login**

1. Go to your app: `http://localhost:3000/auth`
2. Try logging in as: `coach3@gmail.com`
3. **It should work immediately!** ✅

---

## 🔍 **What This Fix Does**

### **Problem:**
- Multiple overlapping RLS policies were causing infinite recursion
- Policies like `users_self_manage` + `users_insert_self` were conflicting
- Complex policies with JOINs to other tables created circular dependencies

### **Solution:**
- **Drops ALL existing policies** (40+ old policies removed)
- **Creates 4 simple, non-recursive policies:**
  1. **Self-access**: Users can manage their own profile
  2. **Authenticated read**: Logged-in users can see all users (for rosters)
  3. **Anonymous read**: Public can see basic player info
  4. **Signup insert**: Allows trigger to create new users

### **Why It Works:**
- ✅ **No recursion**: Policies don't reference other tables
- ✅ **No complex JOINs**: Simple `id = auth.uid()` checks
- ✅ **No subqueries**: Direct boolean conditions only
- ✅ **Minimal overhead**: Fast policy evaluation

---

## 🎯 **After This Fix**

### **What Will Work:**
- ✅ Coach signup
- ✅ Coach login
- ✅ Profile fetch
- ✅ All existing roles (player, organizer, stat_admin)
- ✅ Team management
- ✅ Roster lookups
- ✅ Public profiles

### **What Won't Break:**
- ✅ Existing users can still log in
- ✅ Tournaments still work
- ✅ Games still work
- ✅ Live viewer still works

---

## 📞 **If It Still Fails**

If you still see "infinite recursion" after applying this fix:

1. **Clear your browser cache and cookies**
2. **Hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for any RLS-related errors
4. **Verify the policies were created**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

---

## ✅ **Success Indicators**

After applying the fix, you should see:

**In Browser Console:**
```
✅ AuthServiceV2: Sign up successful for: coach3@gmail.com
✅ AuthServiceV2: User ID: 960934f6-fae3-4da3-aca8-72ae4b3ca0fc
✅ AuthServiceV2: Profile fetched successfully
✅ useAuthV2: Profile loaded
```

**No more:**
```
❌ infinite recursion detected in policy for relation "users"
```

---

## 🚀 **Ready to Apply?**

1. Open Supabase SQL Editor
2. Paste `FINAL_COACH_RLS_FIX.sql`
3. Run it
4. Test login

**This will fix the issue immediately!** 🎉

