const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xhunnsczqjwfrwgjetff.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodW5uc2N6cWp3ZnJ3Z2pldGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDk4MTQsImV4cCI6MjA2OTgyNTgxNH0.5-1h0PHnsw_CkBNMRrfjpgkisD30uz-XdnPZxJ3aRZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestPlayer() {
  try {
    console.log('Creating test player...');
    
    const { data, error } = await supabase
      .from('players')
      .insert({
        name: 'LeBron James',
        email: 'lebron@test.com',
        position: 'SF',
        jersey_number: 23,
        is_premium: true,
        country: 'US'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating player:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return;
    }

    console.log('✅ Test player created successfully!');
    console.log('Player ID:', data.id);
    console.log('Player Name:', data.name);
    console.log('Position:', data.position);
    console.log('Jersey Number:', data.jersey_number);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function createTestTeam() {
  try {
    console.log('Creating test team...');
    
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: 'Los Angeles Lakers',
        logo: 'https://example.com/lakers-logo.png',
        coach: 'Darvin Ham',
        tournament_id: 'test-tournament-id' // You'll need to replace this with a real tournament ID
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return;
    }

    console.log('✅ Test team created successfully!');
    console.log('Team ID:', data.id);
    console.log('Team Name:', data.name);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function createTestGame() {
  try {
    console.log('Creating test game...');
    
    const { data, error } = await supabase
      .from('games')
      .insert({
        tournament_id: 'test-tournament-id', // You'll need to replace this
        team_a_id: 'test-team-a-id', // You'll need to replace this
        team_b_id: 'test-team-b-id', // You'll need to replace this
        stat_admin_id: 'test-stat-admin-id', // You'll need to replace this
        status: 'scheduled',
        quarter: 1,
        game_clock_minutes: 12,
        game_clock_seconds: 0,
        is_clock_running: false,
        home_score: 0,
        away_score: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
      return;
    }

    console.log('✅ Test game created successfully!');
    console.log('Game ID:', data.id);
    console.log('Status:', data.status);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
createTestPlayer()
  .then(() => createTestTeam())
  .then(() => createTestGame())
  .then(() => {
    console.log('🎉 All test data created!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 