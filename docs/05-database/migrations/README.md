# Database Migrations - StatJam

**Last Updated**: December 24, 2025  
**Status**: Production Ready  
**Database**: PostgreSQL (Supabase)

---

## 📋 Migration Overview

This directory contains all database migrations for the StatJam application. Migrations are applied sequentially and are designed to be idempotent and reversible where possible.

### Migration Naming Convention

- `001_*` - Core schema migrations
- `002_*` - Authentication and user management
- `003_*` - Tournament and team management
- `004_*` - Coach team card system
- `005_*` - Custom players and team management fixes

---

## 🗂️ Migration Files

### Core Schema Migrations

#### `001_card_generation_schema.sql`
**Purpose**: Initial database schema setup
**Status**: ✅ Applied
**Features**:
- Core tables: `users`, `tournaments`, `teams`, `games`
- Basic RLS policies
- Authentication triggers

#### `002_add_admin_role.sql`
**Purpose**: Add stat admin role
**Status**: ✅ Applied
**Features**:
- Stat admin role constraint
- Admin-specific RLS policies
- Admin dashboard permissions

#### `003_personal_games_table.sql`
**Purpose**: Personal stat tracking
**Status**: ✅ Applied
**Features**:
- `personal_games` table
- Personal stat tracking RLS policies
- Player-specific game data

#### `003_player_cards_table.sql`
**Purpose**: Player card generation
**Status**: ✅ Applied
**Features**:
- `player_cards` table
- Card generation RLS policies
- Player card management

---

### Coach Team Card Migrations

#### `004_coach_team_card_schema.sql`
**Purpose**: Complete coach team card system
**Status**: ✅ Applied
**Features**:
- Coach role constraint (`users_role_check`)
- Teams table extensions (`coach_id`, `visibility`)
- Games table extensions (`is_coach_game`, `opponent_name`)
- Team import tokens table
- Comprehensive RLS policies for coach access
- Auth trigger updates for coach role assignment

**Key Components**:
```sql
-- Coach role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('player', 'organizer', 'stat_admin', 'coach'));

-- Teams table extensions
ALTER TABLE teams ADD COLUMN coach_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE teams ADD COLUMN visibility team_visibility DEFAULT 'private';

-- Games table extensions  
ALTER TABLE games ADD COLUMN is_coach_game BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN opponent_name VARCHAR(255);

-- Team import tokens
CREATE TABLE team_import_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `005_custom_players_schema.sql`
**Purpose**: Custom players for coach teams
**Status**: ✅ Applied
**Features**:
- `custom_players` table for team-specific players
- `team_players` table extension with `custom_player_id`
- Mixed roster support (StatJam users + custom players)
- Comprehensive RLS policies for custom players

**Key Components**:
```sql
-- Custom players table
CREATE TABLE custom_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  jersey_number INTEGER CHECK (jersey_number > 0 AND jersey_number <= 99),
  position VARCHAR(50) CHECK (position IN ('PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G-F', 'F-C')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team players extension
ALTER TABLE team_players ADD COLUMN custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

-- Constraint for either/or player assignment
ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;
ALTER TABLE team_players ADD CONSTRAINT team_players_player_required 
  CHECK ((player_id IS NOT NULL AND custom_player_id IS NULL) OR 
         (player_id IS NULL AND custom_player_id IS NOT NULL));
```

#### `005_fix_team_players_column.sql`
**Purpose**: Fix team_players table column issues
**Status**: ✅ Applied
**Features**:
- Ensures `custom_player_id` column exists
- Recreates `team_players_player_required` constraint
- Adds proper indexing for performance

**Key Components**:
```sql
-- Ensure custom_player_id column exists
ALTER TABLE team_players ADD COLUMN IF NOT EXISTS custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

-- Recreate constraint
ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;
ALTER TABLE team_players ADD CONSTRAINT team_players_player_required 
  CHECK ((player_id IS NOT NULL AND custom_player_id IS NULL) OR 
         (player_id IS NULL AND custom_player_id IS NOT NULL));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_team_players_custom_player_id ON team_players(custom_player_id);
```

#### `005_make_tournament_id_nullable.sql`
**Purpose**: Allow null tournament_id for coach teams
**Status**: ✅ Applied
**Features**:
- Makes `tournament_id` nullable in teams table
- Updates constraints to allow coach teams without tournaments
- Maintains data integrity for tournament teams

#### `007_game_stats_custom_players.sql`
**Purpose**: Add custom player support to game_stats table
**Status**: ✅ Applied
**Features**:
- Added `custom_player_id` column to `game_stats`
- Made `player_id` nullable to support either regular or custom players
- Added CHECK constraints to ensure one player ID type is set
- Updated RLS policies for custom player stats
- Follows same pattern as `team_players` custom player support

#### `008_game_substitutions_custom_players.sql`
**Purpose**: Add custom player support to game_substitutions table
**Status**: ✅ Applied (November 2025)
**Features**:
- Added `custom_player_in_id` and `custom_player_out_id` columns
- Made `player_in_id` and `player_out_id` nullable
- Added CHECK constraints to ensure either regular OR custom player IDs are set
- Updated RLS policies to allow coaches and stat_admins to substitute custom players
- Added indexes for performance on custom player ID columns
- Follows same proven pattern as Migration 007

**Key Components**:
```sql
-- Add custom player ID columns
ALTER TABLE game_substitutions 
ADD COLUMN IF NOT EXISTS custom_player_in_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

ALTER TABLE game_substitutions 
ADD COLUMN IF NOT EXISTS custom_player_out_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

-- Make regular player ID columns nullable
ALTER TABLE game_substitutions 
ALTER COLUMN player_in_id DROP NOT NULL;

ALTER TABLE game_substitutions 
ALTER COLUMN player_out_id DROP NOT NULL;

-- Add CHECK constraints (either regular OR custom, not both, not neither)
ALTER TABLE game_substitutions 
ADD CONSTRAINT game_substitutions_player_in_required 
CHECK (
  (player_in_id IS NOT NULL AND custom_player_in_id IS NULL) OR 
  (player_in_id IS NULL AND custom_player_in_id IS NOT NULL)
);
```

---

### Coach Games Public Viewing Migration

#### `023_coach_games_public_view.sql`
**Purpose**: Enable public viewing of coach games via shared links
**Status**: ✅ Applied (December 15, 2025)
**Features**:
- Public SELECT access for coach games (UUID-based security)
- Anonymous access to coach game data (stats, substitutions, timeouts, rosters)
- Custom player names visible in public view
- Team stats and player rosters accessible without authentication

**Key Components**:
```sql
-- Games: Public viewing of coach games
CREATE POLICY "games_coach_public_view" ON games
  FOR SELECT TO anon, authenticated
  USING (is_coach_game = TRUE);

-- Game Stats: Public viewing for coach games
CREATE POLICY "game_stats_coach_public_view" ON game_stats
  FOR SELECT TO anon, authenticated
  USING (game_id IN (SELECT id FROM games WHERE is_coach_game = TRUE));

-- Team Players: Public viewing for coach game rosters
CREATE POLICY "team_players_coach_public_view" ON team_players
  FOR SELECT TO anon, authenticated
  USING (team_id IN (
    SELECT team_a_id FROM games WHERE is_coach_game = TRUE
    UNION
    SELECT team_b_id FROM games WHERE is_coach_game = TRUE
  ));

-- Custom Players: Public viewing for coach game custom players
CREATE POLICY "custom_players_coach_public_view" ON custom_players
  FOR SELECT TO anon, authenticated
  USING (team_id IN (
    SELECT team_a_id FROM games WHERE is_coach_game = TRUE
    UNION
    SELECT team_b_id FROM games WHERE is_coach_game = TRUE
  ));
```

**Security Model**:
- UUID-based link sharing (128-bit cryptographic security)
- SELECT-only policies (read-only access)
- Coach write policies remain unchanged (only owner can modify)
- Same security pattern as Google Docs "anyone with link can view"

**Impact**:
- Coaches can share game links via email, social media, messaging apps
- Viewers can access games on any device without login
- Player names and stats display correctly for unauthenticated users
- Team tabs show complete rosters in public view

**Files Modified**:
- `src/app/api/game-viewer/[gameId]/route.ts` - Conditional auth for coach games
- `src/lib/services/teamServiceV3.ts` - Enhanced public access fallback

---

### Video Assignment Workflow Migration

#### `027_video_assignment_workflow.sql`
**Purpose**: Enable admin-to-stat-admin video assignment workflow
**Status**: ✅ Applied (December 24, 2025)
**Features**:
- Assignment status tracking (pending, assigned, in_progress, completed, cancelled)
- Stat admin assignment with 24-hour turnaround tracking
- Timestamps for assignment lifecycle (assigned_at, due_at, completed_at)
- Comprehensive RLS policies for admins, stat admins, and coaches
- Performance indexes for efficient queue queries

**Key Components**:
```sql
-- Assignment status column with CHECK constraint
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'pending' 
CHECK (assignment_status IN (
  'pending',      -- Uploaded, waiting for admin to assign
  'assigned',     -- Assigned to a stat admin, not yet started
  'in_progress',  -- Stat admin has started tracking
  'completed',    -- Tracking finished, stats delivered
  'cancelled'     -- Video tracking cancelled
));

-- Assigned stat admin reference
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS assigned_stat_admin_id UUID REFERENCES users(id);

-- Assignment lifecycle timestamps
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_game_videos_assignment_status 
ON game_videos(assignment_status) 
WHERE assignment_status IN ('pending', 'assigned', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_game_videos_assigned_stat_admin 
ON game_videos(assigned_stat_admin_id) 
WHERE assigned_stat_admin_id IS NOT NULL;
```

**RLS Policies**:
```sql
-- Admins can view all videos in queue
CREATE POLICY "Admins can view all videos in queue" ON game_videos
  FOR SELECT TO authenticated
  USING (
    auth.role() = 'admin' AND assignment_status IN ('pending', 'assigned', 'in_progress')
  );

-- Stat Admins can view their assigned videos
CREATE POLICY "Stat Admins can view their assigned videos" ON game_videos
  FOR SELECT TO authenticated
  USING (
    auth.role() = 'stat_admin' AND auth.uid() = assigned_stat_admin_id
  );

-- Coaches can view their uploaded videos and assignment status
CREATE POLICY "Coaches can view their uploaded videos and assignment status" ON game_videos
  FOR SELECT TO authenticated
  USING (
    auth.role() = 'coach' AND auth.uid() = uploaded_by
  );

-- Admins can update assignment status and assigned admin
CREATE POLICY "Admins can update video assignments" ON game_videos
  FOR UPDATE TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Stat Admins can update their assigned video's status
CREATE POLICY "Stat Admins can update their assigned video status" ON game_videos
  FOR UPDATE TO authenticated
  USING (auth.role() = 'stat_admin' AND auth.uid() = assigned_stat_admin_id)
  WITH CHECK (auth.role() = 'stat_admin' AND auth.uid() = assigned_stat_admin_id);
```

**Workflow**:
1. **Coach Experience**: Uploads video, sees "Processing" then "Uploaded" with 24-hour countdown for delivery
2. **Admin Dashboard**: "Video Tracking Queue" lists all uploaded videos pending assignment
3. **Admin Assignment**: Admin assigns video to a stat admin, sets 24-hour due date
4. **Stat Admin Dashboard**: "Assigned Videos" shows videos assigned to that stat admin
5. **Tracking**: Stat admin opens Video Tracking Studio, marks as complete when done

**Impact**:
- Coaches can upload videos and track assignment status
- Admins can efficiently manage video tracking queue
- Stat admins can see their assigned videos and update status
- 24-hour turnaround tracking ensures timely delivery
- Complete audit trail with timestamps

**Files Created**:
- `src/lib/services/videoAssignmentService.ts` - Video assignment service
- `src/app/dashboard/admin/video-queue/page.tsx` - Admin video queue page
- `src/components/stat-admin/AssignedVideosSection.tsx` - Stat admin assigned videos component
- `src/components/video/CoachVideoStatusCard.tsx` - Coach video status card

**Files Modified**:
- `src/app/dashboard/stat-admin/page.tsx` - Added AssignedVideosSection
- `src/app/admin/dashboard/page.tsx` - Added Video Tracking Queue link
- `src/app/dashboard/coach/video-select/page.tsx` - Status card integration
- `src/app/dashboard/coach/video/[gameId]/page.tsx` - Status display

**Note**: This migration uses `DROP POLICY IF EXISTS` + `CREATE POLICY` pattern instead of `CREATE POLICY IF NOT EXISTS` because PostgreSQL doesn't support the latter syntax.

---

## 🔒 RLS Policies

### Coach Access Policies

**Custom Players**:
```sql
-- Coach can manage their own custom players
CREATE POLICY custom_players_coach_access ON custom_players
  FOR ALL USING (coach_id = auth.uid());

-- Public teams' custom players are readable
CREATE POLICY custom_players_public_read ON custom_players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teams t WHERE t.id = custom_players.team_id AND t.visibility = 'public')
  );

-- Stat admin access for game management
CREATE POLICY custom_players_stat_admin_access ON custom_players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM games g WHERE g.stat_admin_id = auth.uid() 
            AND (g.team_a_id = custom_players.team_id OR g.team_b_id = custom_players.team_id))
  );
```

**Teams**:
```sql
-- Coach can manage their own teams
CREATE POLICY teams_coach_access ON teams
  FOR ALL USING (coach_id = auth.uid());

-- Public teams are readable by all
CREATE POLICY teams_public_read ON teams
  FOR SELECT USING (visibility = 'public');
```

**Games**:
```sql
-- Coach can manage their own games
CREATE POLICY games_coach_access ON games
  FOR ALL USING (
    is_coach_game = true AND 
    EXISTS (SELECT 1 FROM teams t WHERE t.id = games.team_a_id AND t.coach_id = auth.uid())
  );
```

### Team Players Policies

**Mixed Roster Support**:
```sql
-- Authenticated users can insert team players for coach teams
CREATE POLICY team_players_coach_insert ON team_players
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams t WHERE t.id = team_players.team_id AND t.coach_id = auth.uid())
  );

-- Coach can manage their team rosters
CREATE POLICY team_players_coach_access ON team_players
  FOR ALL USING (
    EXISTS (SELECT 1 FROM teams t WHERE t.id = team_players.team_id AND t.coach_id = auth.uid())
  );
```

---

## 🚀 Migration Application

### Manual Application

**Step 1: Check Current Status**
```sql
-- Check applied migrations
SELECT * FROM schema_migrations ORDER BY version;

-- Check table existence
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('custom_players', 'team_import_tokens');

-- Check column existence
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'team_players' AND column_name = 'custom_player_id';
```

**Step 2: Apply Migrations**
```bash
# Apply migrations in order
psql -f 004_coach_team_card_schema.sql
psql -f 005_custom_players_schema.sql
psql -f 005_fix_team_players_column.sql
psql -f 005_make_tournament_id_nullable.sql
```

**Step 3: Verify Application**
```sql
-- Verify tables exist
\dt custom_players
\dt team_import_tokens

-- Verify columns exist
\d team_players

-- Verify constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'team_players'::regclass;

-- Verify RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('custom_players', 'teams', 'games', 'team_players');
```

### Automated Application

**Using Supabase CLI**:
```bash
# Apply all migrations
supabase db reset

# Apply specific migration
supabase db push --file 004_coach_team_card_schema.sql
```

**Using Application Code**:
```typescript
// Migration checker utility
import { MigrationChecker } from '@/lib/utils/migrationChecker';

// Check migration status
const hasCustomPlayers = await MigrationChecker.hasCustomPlayersMigration();
if (!hasCustomPlayers) {
  console.warn('Custom players migration not applied');
}
```

---

## 🔍 Migration Validation

### Schema Validation

**Required Tables**:
- [ ] `custom_players` table exists
- [ ] `team_import_tokens` table exists
- [ ] `team_players.custom_player_id` column exists
- [ ] `teams.coach_id` column exists
- [ ] `teams.visibility` column exists
- [ ] `games.is_coach_game` column exists
- [ ] `games.opponent_name` column exists

**Required Constraints**:
- [ ] `users_role_check` includes 'coach'
- [ ] `team_players_player_required` constraint exists
- [ ] `custom_players` foreign key constraints
- [ ] `team_import_tokens` foreign key constraints

**Required RLS Policies**:
- [ ] `custom_players_coach_access` policy
- [ ] `custom_players_public_read` policy
- [ ] `custom_players_stat_admin_access` policy
- [ ] `teams_coach_access` policy
- [ ] `teams_public_read` policy
- [ ] `games_coach_access` policy
- [ ] `team_players_coach_access` policy

### Data Validation

**Test Data Creation**:
```sql
-- Create test coach user
INSERT INTO users (id, email, role, name) 
VALUES ('test-coach-id', 'coach@test.com', 'coach', 'Test Coach');

-- Create test team
INSERT INTO teams (id, name, coach_id, visibility) 
VALUES ('test-team-id', 'Test Team', 'test-coach-id', 'private');

-- Create test custom player
INSERT INTO custom_players (id, team_id, coach_id, name, jersey_number) 
VALUES ('test-player-id', 'test-team-id', 'test-coach-id', 'Test Player', 1);

-- Link custom player to team
INSERT INTO team_players (id, team_id, custom_player_id) 
VALUES ('test-link-id', 'test-team-id', 'test-player-id');
```

**Test Data Cleanup**:
```sql
-- Clean up test data
DELETE FROM team_players WHERE team_id = 'test-team-id';
DELETE FROM custom_players WHERE team_id = 'test-team-id';
DELETE FROM teams WHERE id = 'test-team-id';
DELETE FROM users WHERE id = 'test-coach-id';
```

---

## 🛠️ Troubleshooting

### Common Issues

**Migration Already Applied**:
```sql
-- Check if migration was already applied
SELECT * FROM schema_migrations WHERE version = '004_coach_team_card_schema';

-- If exists, skip migration
-- If not exists, apply migration
```

**Constraint Conflicts**:
```sql
-- Drop conflicting constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;

-- Recreate constraints
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('player', 'organizer', 'stat_admin', 'coach'));
ALTER TABLE team_players ADD CONSTRAINT team_players_player_required 
  CHECK ((player_id IS NOT NULL AND custom_player_id IS NULL) OR 
         (player_id IS NULL AND custom_player_id IS NOT NULL));
```

**RLS Policy Conflicts**:
```sql
-- Drop conflicting policies
DROP POLICY IF EXISTS custom_players_coach_access ON custom_players;
DROP POLICY IF EXISTS teams_coach_access ON teams;

-- Recreate policies
CREATE POLICY custom_players_coach_access ON custom_players
  FOR ALL USING (coach_id = auth.uid());
CREATE POLICY teams_coach_access ON teams
  FOR ALL USING (coach_id = auth.uid());
```

### Error Resolution

**Column Already Exists**:
```sql
-- Use IF NOT EXISTS for safe column addition
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES users(id);
```

**Table Already Exists**:
```sql
-- Use IF NOT EXISTS for safe table creation
CREATE TABLE IF NOT EXISTS custom_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... other columns
);
```

**Policy Already Exists**:
```sql
-- Drop existing policy before recreating
DROP POLICY IF EXISTS custom_players_coach_access ON custom_players;
CREATE POLICY custom_players_coach_access ON custom_players
  FOR ALL USING (coach_id = auth.uid());
```

---

## 📊 Performance Considerations

### Indexing Strategy

**Custom Players Table**:
```sql
-- Primary key index (automatic)
CREATE INDEX idx_custom_players_team_id ON custom_players(team_id);
CREATE INDEX idx_custom_players_coach_id ON custom_players(coach_id);
CREATE INDEX idx_custom_players_jersey ON custom_players(team_id, jersey_number);
```

**Team Players Table**:
```sql
-- Existing indexes
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);

-- New custom player index
CREATE INDEX idx_team_players_custom_player_id ON team_players(custom_player_id);
```

**Team Import Tokens**:
```sql
-- Token lookup index
CREATE INDEX idx_team_import_tokens_token ON team_import_tokens(token);
CREATE INDEX idx_team_import_tokens_team_id ON team_import_tokens(team_id);
CREATE INDEX idx_team_import_tokens_expires ON team_import_tokens(expires_at);
```

### Query Optimization

**Mixed Roster Queries**:
```sql
-- Optimized query for team players (both types)
SELECT 
  tp.id,
  tp.player_id,
  tp.custom_player_id,
  u.name as player_name,
  u.email as player_email,
  cp.name as custom_name,
  cp.jersey_number as custom_jersey
FROM team_players tp
LEFT JOIN users u ON tp.player_id = u.id
LEFT JOIN custom_players cp ON tp.custom_player_id = cp.id
WHERE tp.team_id = $1;
```

**Player Count Queries**:
```sql
-- Optimized player count query
SELECT COUNT(*) as player_count
FROM team_players tp
WHERE tp.team_id = $1;
```

---

## 🔮 Future Migrations

### Planned Migrations

**006_player_statistics_aggregation.sql**:
- Player performance metrics
- Team statistics aggregation
- Game history and trends

**007_team_analytics_schema.sql**:
- Team performance analytics
- Player contribution analysis
- Export and reporting features

**008_advanced_coach_features.sql**:
- Team templates and presets
- Player notes and comments
- Advanced Quick Track options

### Migration Strategy

**Backward Compatibility**:
- All migrations maintain backward compatibility
- No breaking changes to existing functionality
- Graceful degradation for missing features

**Rollback Strategy**:
- Each migration includes rollback instructions
- Data preservation during rollbacks
- Safe migration application and removal

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Test migrations on staging environment
- [ ] Verify application compatibility
- [ ] Check for conflicting constraints

### During Migration
- [ ] Apply migrations in correct order
- [ ] Monitor for errors and conflicts
- [ ] Verify each migration step
- [ ] Test data integrity

### Post-Migration
- [ ] Verify all tables and columns exist
- [ ] Test RLS policies
- [ ] Validate constraints
- [ ] Test application functionality
- [ ] Monitor performance

---

**Last Updated**: December 15, 2025  
**Maintained By**: Development Team
