require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check what env vars we have
console.log('ENV vars available:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function debugJob() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DEBUGGING CLIP GENERATION JOBS');
  console.log('='.repeat(60));

  // Get all jobs
  const { data: jobs, error } = await supabase
    .from('clip_generation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`\n📊 Found ${jobs.length} recent jobs:\n`);

  for (const job of jobs) {
    console.log(`Job ID: ${job.id}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Game ID: ${job.game_id}`);
    console.log(`  Total Clips: ${job.total_clips}`);
    console.log(`  Completed: ${job.completed_clips}`);
    console.log(`  Failed: ${job.failed_clips}`);
    console.log(`  Created: ${job.created_at}`);
    console.log(`  Started: ${job.started_at || 'Not started'}`);
    console.log(`  Error: ${job.error_message || 'None'}`);
    console.log('');
  }

  // Check generated clips for the processing job
  const processingJob = jobs.find(j => j.status === 'processing');
  if (processingJob) {
    console.log('='.repeat(60));
    console.log('🎬 CHECKING CLIPS FOR PROCESSING JOB');
    console.log('='.repeat(60));

    const { data: clips, error: clipsError } = await supabase
      .from('generated_clips')
      .select('id, status, error_message, stat_type')
      .eq('job_id', processingJob.id);

    if (clipsError) {
      console.log('❌ Clips Error:', clipsError.message);
    } else {
      const pending = clips.filter(c => c.status === 'pending').length;
      const processing = clips.filter(c => c.status === 'processing').length;
      const ready = clips.filter(c => c.status === 'ready').length;
      const failed = clips.filter(c => c.status === 'failed').length;

      console.log(`\n📊 Clip Status Breakdown:`);
      console.log(`  Pending: ${pending}`);
      console.log(`  Processing: ${processing}`);
      console.log(`  Ready: ${ready}`);
      console.log(`  Failed: ${failed}`);

      if (failed > 0) {
        console.log('\n❌ Failed clip errors (first 5):');
        clips.filter(c => c.status === 'failed').slice(0, 5).forEach(c => {
          console.log(`  - ${c.stat_type}: ${c.error_message || 'No error message'}`);
        });
      }
    }
  }
}

debugJob().then(() => process.exit(0));
