// Admin User Creation Script
// Run with: node scripts/create-admin.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser(email, password) {
  try {
    console.log('🔧 Creating admin user...');

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Update user profile to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        premium_status: true,
        free_renders_remaining: 999,
        premium_renders_remaining: 999
      })
      .eq('id', authData.user.id);

    if (updateError) {
      throw new Error(`Profile update failed: ${updateError.message}`);
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 User ID:', authData.user.id);
    console.log('🎯 Role: admin');

    return authData.user;

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// Usage
const adminEmail = process.argv[2] || 'admin@statjam.com';
const adminPassword = process.argv[3] || 'admin123!';

createAdminUser(adminEmail, adminPassword)
  .then(() => {
    console.log('\n🚀 You can now sign in as admin at /auth');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  });
