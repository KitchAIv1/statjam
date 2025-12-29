require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkClips() {
  const { data: clips, error } = await supabase
    .from('generated_clips')
    .select('id, status, error_message, stat_type')
    .eq('job_id', 'c0b9fc28-74d1-4fa4-800c-7b2c9d0c1379')
    .eq('status', 'failed')
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('🔍 Recent failed clips error messages:\n');
  clips.forEach((c, i) => {
    console.log(`${i+1}. ${c.stat_type}:`);
    console.log(`   ${c.error_message || 'No error'}\n`);
  });
}

checkClips().then(() => process.exit(0));
