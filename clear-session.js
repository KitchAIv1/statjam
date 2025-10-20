
// Clear Invalid Session Data
console.log('🧹 Clearing invalid authentication session...');

const keysToRemove = [
  'sb-access-token',
  'sb-refresh-token', 
  'sb-user',
  'auth-redirecting',
  'auth-redirect-timestamp'
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log('🗑️ Removing:', key);
    localStorage.removeItem(key);
  }
});

console.log('✅ Session cleared successfully!');
console.log('🔄 Please refresh the page now.');

