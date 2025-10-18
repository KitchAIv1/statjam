// 🧪 Authentication Performance Test Script
// Run this in browser console to monitor API calls

console.log('🚀 Starting Authentication Performance Test...');

// Track all API calls
let apiCalls = [];
let authCalls = [];

// Override fetch to monitor API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const timestamp = new Date().toISOString();
  
  // Log all API calls
  apiCalls.push({ url, timestamp, type: 'API' });
  
  // Track authentication calls specifically
  if (url.includes('/auth/') || url.includes('user') || url.includes('profile')) {
    authCalls.push({ url, timestamp, type: 'AUTH' });
    console.log(`🔐 AUTH API CALL #${authCalls.length}:`, url);
  }
  
  return originalFetch.apply(this, args);
};

// Test results summary
window.getAuthTestResults = function() {
  console.log('\n📊 AUTHENTICATION TEST RESULTS:');
  console.log('=====================================');
  console.log(`Total API Calls: ${apiCalls.length}`);
  console.log(`Authentication Calls: ${authCalls.length}`);
  console.log('\n🔐 Authentication Call Details:');
  authCalls.forEach((call, index) => {
    console.log(`${index + 1}. ${call.timestamp} - ${call.url}`);
  });
  
  // Expected results
  console.log('\n🎯 EXPECTED RESULTS (After Migration):');
  console.log('- Dashboard loads: 0 auth calls');
  console.log('- Navigation: 0 auth calls');
  console.log('- Stat tracker: 0 auth calls');
  console.log('- App initialization: 1 auth call only');
  
  return {
    totalApiCalls: apiCalls.length,
    authCalls: authCalls.length,
    authCallDetails: authCalls
  };
};

// Reset counters
window.resetAuthTest = function() {
  apiCalls = [];
  authCalls = [];
  console.log('🔄 Test counters reset');
};

console.log('✅ Test setup complete!');
console.log('📋 Available commands:');
console.log('- getAuthTestResults() - View test results');
console.log('- resetAuthTest() - Reset counters');
console.log('\n🧪 Now navigate through the app and run getAuthTestResults() to see the results!');
