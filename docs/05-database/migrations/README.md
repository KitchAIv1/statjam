# Database Migrations - StatJam

**Last Updated**: October 22, 2025  
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

**Last Updated**: October 22, 2025  
**Maintained By**: Development Team
