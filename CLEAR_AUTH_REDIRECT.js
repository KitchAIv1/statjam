// EMERGENCY AUTH REDIRECT CLEAR
// Run this in browser console if stuck in redirect loop

console.log('🚨 EMERGENCY: Clearing auth redirect flags...');

// Clear redirect flags
sessionStorage.removeItem('auth-redirecting');
sessionStorage.removeItem('auth-redirect-timestamp');

// Force redirect to dashboard
console.log('🚀 EMERGENCY: Force redirecting to dashboard...');
window.location.href = '/dashboard';

// Alternative: Clear all auth and restart
// sessionStorage.clear();
// localStorage.removeItem('sb-access-token');
// localStorage.removeItem('sb-refresh-token');
// localStorage.removeItem('sb-user');
// window.location.href = '/auth';
