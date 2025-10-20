/**
 * Clear Invalid Session Script
 * Run this to clear stale authentication tokens causing 403 errors
 */

console.log('🧹 Clearing invalid authentication session...');

// Clear all auth-related localStorage items
if (typeof localStorage !== 'undefined') {
  const keysToRemove = [
    'sb-access-token',
    'sb-refresh-token', 
    'sb-user',
    'auth-redirecting',
    'auth-redirect-timestamp'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️ Removing: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Session cleared successfully!');
  console.log('🔄 Reloading page...');
  
  // Reload the page to start fresh
  window.location.reload();
} else {
  console.log('❌ localStorage not available');
}

// Instructions for manual clearing
console.log(`
📋 Manual Instructions (if script doesn't work):
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear localStorage items:
   - sb-access-token
   - sb-refresh-token
   - sb-user
4. Refresh the page
`);
