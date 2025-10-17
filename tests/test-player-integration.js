const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xhunnsczqjwfrwgjetff.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodW5uc2N6cWp3ZnJ3Z2pldGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDk4MTQsImV4cCI6MjA2OTgyNTgxNH0.5-1h0PHnsw_CkBNMRrfjpgkisD30uz-XdnPZxJ3aRZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPlayerIntegration() {
  try {
    console.log('🔍 Testing player integration...');
    
    // Test 1: Check if we can connect to the database
    console.log('\n1️⃣ Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return;
    }
    console.log('✅ Database connection successful!');

    // Test 2: Try to get the specific player
    console.log('\n2️⃣ Testing player lookup...');
    const playerId = '6ea14c21-585a-4477-8b12-909860134abe';
    
    // Try different table names
    const possibleTables = ['players', 'player', 'users', 'user_profiles'];
    
    for (const tableName of possibleTables) {
      console.log(`   Trying table: ${tableName}`);
      const { data: player, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`   ✅ Found player in ${tableName}:`, player);
        break;
      }
    }

    // Test 3: List available tables (if possible)
    console.log('\n3️⃣ Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('   Could not list tables (normal for anon access)');
    } else {
      console.log('   Available tables:', tables.map(t => t.table_name));
    }

    console.log('\n🎉 Integration test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPlayerIntegration(); 