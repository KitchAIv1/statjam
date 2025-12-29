require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetJob() {
  console.log('='.repeat(60));
  console.log('🔄 RESETTING JOB FOR RETRY');
  console.log('='.repeat(60));

  // Get the processing job
  const { data: jobs, error: jobError } = await supabase
    .from('clip_generation_jobs')
    .select('*')
    .eq('status', 'processing')
    .limit(1);

  if (jobError || !jobs || jobs.length === 0) {
    console.log('❌ No processing job found');
    return;
  }

  const job = jobs[0];
  console.log(`\n📋 Found job: ${job.id}`);
  console.log(`  Game ID: ${job.game_id}`);
  console.log(`  Status: ${job.status}`);
  console.log(`  Total Clips: ${job.total_clips}`);
  console.log(`  Failed: ${job.failed_clips}`);

  // Reset all clips to pending
  console.log('\n🔄 Resetting clips to pending...');
  const { error: clipsError, count } = await supabase
    .from('generated_clips')
    .update({
      status: 'pending',
      error_message: null,
      generation_attempts: 0,
    })
    .eq('job_id', job.id);

  if (clipsError) {
    console.log(`❌ Error resetting clips: ${clipsError.message}`);
    return;
  }
  console.log(`  ✅ Reset clips`);

  // Reset job to approved
  console.log('\n🔄 Resetting job to approved...');
  const { error: updateError } = await supabase
    .from('clip_generation_jobs')
    .update({
      status: 'approved',
      error_message: null,
      failed_clips: 0,
      completed_clips: 0,
      started_at: null,
    })
    .eq('id', job.id);

  if (updateError) {
    console.log(`❌ Error resetting job: ${updateError.message}`);
    return;
  }

  console.log(`  ✅ Job reset to 'approved'`);
  console.log('\n🚀 Job will be picked up on next poll (within 30 seconds)');
}

resetJob().then(() => process.exit(0));
