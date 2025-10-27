#!/usr/bin/env node

/**
 * Apply team_players table structure and RLS policy fixes
 * This script applies the 006_fix_team_players_rls.sql migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting team_players table structure and RLS policy fix...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../docs/05-database/migrations/006_fix_team_players_rls.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Loaded migration file: 006_fix_team_players_rls.sql');

    // Split the SQL into individual statements (rough split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT \'VERIFICATION'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('VERIFICATION') || statement.includes('SUCCESS:')) {
        continue; // Skip verification queries
      }

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Some errors are expected (like "already exists" errors)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('IF NOT EXISTS')) {
            console.log(`⚠️  Expected error (continuing): ${error.message}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error(`   Statement: ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }

    // Verify the fix by checking table structure
    console.log('\n🔍 Verifying team_players table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'team_players')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Could not verify table structure:', columnsError.message);
    } else {
      console.log('📊 team_players table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Test basic query
    console.log('\n🧪 Testing basic team_players query...');
    const { data: testData, error: testError } = await supabase
      .from('team_players')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Basic query test failed:', testError.message);
    } else {
      console.log('✅ Basic query test passed');
    }

    console.log('\n🎉 Migration application completed!');
    console.log('💡 The team_players table should now have:');
    console.log('   - Proper id column');
    console.log('   - RLS policies for coach access');
    console.log('   - Support for custom_player_id column');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
