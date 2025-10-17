const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xhunnsczqjwfrwgjetff.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodW5uc2N6cWp3ZnJ3Z2pldGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDk4MTQsImV4cCI6MjA2OTgyNTgxNH0.5-1h0PHnsw_CkBNMRrfjpgkisD30uz-XdnPZxJ3aRZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection by trying to select from a table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error);
      console.error('Error details:', error.message, error.details, error.hint);
    } else {
      console.log('✅ Connection successful!');
      console.log('Data:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testConnection(); 