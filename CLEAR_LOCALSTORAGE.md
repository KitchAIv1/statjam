# 🧹 CLEAR LOCALSTORAGE - FIX AUTH ISSUES

**Problem**: Old/invalid tokens in localStorage causing auth errors

---

## 🚨 **IMMEDIATE FIX**

### **Option 1: DevTools (Manual)**
1. Open browser DevTools (`F12` or `Cmd+Option+I`)
2. Go to **Application** tab
3. Expand **Local Storage** → `http://localhost:3000`
4. Delete these keys:
   - `sb-access-token`
   - `sb-refresh-token`
   - `sb-user`
5. Refresh the page (`Cmd+R` or `F5`)
6. Sign in again

---

### **Option 2: Console (Automatic)**
1. Open browser console (`F12` → Console tab)
2. Paste this code:
```javascript
// Clear all Supabase auth tokens
localStorage.removeItem('sb-access-token');
localStorage.removeItem('sb-refresh-token');
localStorage.removeItem('sb-user');
console.log('✅ Cleared all auth tokens');
location.reload();
```
3. Press Enter
4. Page will auto-refresh
5. Sign in again

---

### **Option 3: Clear All localStorage**
1. Open browser console
2. Paste this code:
```javascript
localStorage.clear();
console.log('✅ Cleared all localStorage');
location.reload();
```
3. Press Enter

---

## 🔍 **WHY THIS HAPPENS**

### **Root Cause:**
- Development hot reloads can corrupt tokens
- Old sign-in sessions from broken Supabase client
- Tokens expire but aren't auto-refreshed
- Database schema changes invalidate old tokens

### **Symptoms:**
- "Failed to get user from token" error
- Infinite loading on auth page
- Can't sign in despite correct credentials
- Console errors about 401 Unauthorized

---

## ✅ **PREVENTION (Already Implemented)**

The V2 auth system now **auto-clears invalid tokens**:

```typescript
// In useAuthV2.ts
if (error || !profile) {
  console.warn('⚠️ Could not load profile, clearing invalid session');
  await authServiceV2.signOut(); // ✅ Auto-clears localStorage
  setState({ user: null, loading: false, error: null });
}
```

**Result**: No more manual localStorage clearing needed!

---

## 🧪 **TESTING**

### **Test Invalid Token Handling:**
1. Sign in successfully
2. Open DevTools → Application → Local Storage
3. Modify `sb-access-token` (change a few characters)
4. Refresh the page
5. Should see: "⚠️ Could not load profile, clearing invalid session"
6. Should redirect to auth page
7. Sign in again should work perfectly

---

## 📝 **RELATED ERRORS**

### **Error 1: "Failed to get user from token"**
**Cause**: Token is invalid or expired  
**Fix**: Clear localStorage and sign in again

### **Error 2: "Profile not found"**
**Cause**: User doesn't exist in `users` table  
**Fix**: Check database, ensure RLS policies allow access

### **Error 3: 401 Unauthorized**
**Cause**: Token authentication failed  
**Fix**: Clear tokens and re-authenticate

---

## 🎯 **QUICK REFERENCE**

```javascript
// Clear auth tokens
localStorage.removeItem('sb-access-token');
localStorage.removeItem('sb-refresh-token');
localStorage.removeItem('sb-user');

// Check current tokens
console.log('Access Token:', localStorage.getItem('sb-access-token'));
console.log('Refresh Token:', localStorage.getItem('sb-refresh-token'));
console.log('User:', localStorage.getItem('sb-user'));

// Clear everything
localStorage.clear();
```

---

## ✅ **STATUS**

**Auto-clear**: ✅ Implemented in V2  
**Manual clear**: ✅ Instructions above  
**Prevention**: ✅ Error handling added  
**Testing**: ✅ Validated

