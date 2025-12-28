# 📊 Database Schema Audit - Live Streaming Overlay Enhancement

**Date**: December 18, 2025  
**Purpose**: Audit existing Supabase schema to determine what data is available for ScoreOverlay enhancements  
**Status**: ✅ Audit Queries Ready - Run in Supabase SQL Editor

---

## 🔍 Audit Queries

### Run these queries in Supabase SQL Editor to inspect your actual database schema.

---

## 1. TEAMS TABLE AUDIT

### Query 1.1: Teams Table Columns

```sql
-- Get all columns in teams table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teams'
ORDER BY ordinal_position;
```

### Query 1.2: Check for Branding Columns

```sql
-- Check if branding columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teams'
  AND column_name IN (
    'logo_url',
    'logo',
    'primary_color',
    'team_color',
    'secondary_color',
    'accent_color',
    'abbreviation',
    'short_name',
    'team_code'
  )
ORDER BY column_name;
```

### Query 1.3: Sample Team Data

```sql
-- View sample team data to see what's populated
SELECT 
  id,
  name,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  abbreviation,
  tournament_id,
  created_at
FROM teams
LIMIT 5;
```

**Expected Columns** (based on migrations):
- ✅ `logo_url` (TEXT) - Added in migration 001_card_generation_schema.sql
- ✅ `primary_color` (TEXT) - Added in migration 001_card_generation_schema.sql
- ✅ `secondary_color` (TEXT) - Added in migration 001_card_generation_schema.sql
- ✅ `accent_color` (TEXT) - Added in migration 001_card_generation_schema.sql
- ❓ `abbreviation` - **NOT FOUND** in migrations (needs to be added)

---

## 2. GAMES TABLE AUDIT

### Query 2.1: Games Table Columns

```sql
-- Get all columns in games table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'games'
ORDER BY ordinal_position;
```

### Query 2.2: Check for Game State Columns

```sql
-- Check for game state tracking columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'games'
  AND column_name IN (
    'team_a_fouls',
    'team_b_fouls',
    'home_fouls',
    'away_fouls',
    'team_a_timeouts_remaining',
    'team_b_timeouts_remaining',
    'home_timeouts_remaining',
    'away_timeouts_remaining',
    'current_possession_team_id',
    'possession_arrow',
    'current_possession',
    'jump_ball_arrow_team_id',
    'shot_clock_seconds',
    'shot_clock',
    'possession_changed_at'
  )
ORDER BY column_name;
```

### Query 2.3: Sample Game Data

```sql
-- View sample game data to see what's populated
SELECT 
  id,
  tournament_id,
  team_a_id,
  team_b_id,
  status,
  quarter,
  game_clock_minutes,
  game_clock_seconds,
  home_score,
  away_score,
  team_a_fouls,
  team_b_fouls,
  team_a_timeouts_remaining,
  team_b_timeouts_remaining,
  current_possession_team_id,
  jump_ball_arrow_team_id,
  shot_clock_seconds,
  created_at
FROM games
WHERE status IN ('in_progress', 'live')
LIMIT 5;
```

**Expected Columns** (based on migrations):
- ✅ `team_a_fouls` (INTEGER) - Added in migration 006_team_fouls_timeouts.sql
- ✅ `team_b_fouls` (INTEGER) - Added in migration 006_team_fouls_timeouts.sql
- ✅ `team_a_timeouts_remaining` (INTEGER) - Added in migration 006_team_fouls_timeouts.sql
- ✅ `team_b_timeouts_remaining` (INTEGER) - Added in migration 006_team_fouls_timeouts.sql
- ✅ `current_possession_team_id` (UUID) - Added in migration 011_possession_tracking.sql
- ✅ `jump_ball_arrow_team_id` (UUID) - Added in migration 011_possession_tracking.sql
- ✅ `possession_changed_at` (TIMESTAMP) - Added in migration 011_possession_tracking.sql
- ❓ `shot_clock_seconds` - **NOT FOUND** in migrations (needs to be added)

---

## 3. GAME_STATS TABLE AUDIT

### Query 3.1: Game Stats Table Columns

```sql
-- Get all columns in game_stats table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'game_stats'
ORDER BY ordinal_position;
```

### Query 3.2: Check Foul Tracking

```sql
-- Check if fouls are tracked in game_stats
SELECT 
  stat_type,
  modifier,
  COUNT(*) as count
FROM game_stats
WHERE stat_type = 'foul'
GROUP BY stat_type, modifier
ORDER BY count DESC
LIMIT 10;
```

### Query 3.3: Verify Foul Aggregation

```sql
-- Verify team fouls can be calculated from game_stats
SELECT 
  g.id as game_id,
  g.team_a_fouls as team_a_fouls_stored,
  g.team_b_fouls as team_b_fouls_stored,
  COUNT(CASE WHEN gs.team_id = g.team_a_id AND gs.stat_type = 'foul' THEN 1 END) as team_a_fouls_calculated,
  COUNT(CASE WHEN gs.team_id = g.team_b_id AND gs.stat_type = 'foul' THEN 1 END) as team_b_fouls_calculated
FROM games g
LEFT JOIN game_stats gs ON gs.game_id = g.id
WHERE g.status = 'in_progress'
GROUP BY g.id, g.team_a_fouls, g.team_b_fouls
LIMIT 5;
```

**Expected Columns** (based on documentation):
- ✅ `stat_type` (TEXT) - Includes 'foul'
- ✅ `team_id` (UUID) - Links to teams table
- ✅ `game_id` (UUID) - Links to games table
- ✅ `modifier` (TEXT) - Foul types: 'personal', 'shooting', 'technical', etc.

---

## 4. GAME_TIMEOUTS TABLE AUDIT

### Query 4.1: Game Timeouts Table Structure

```sql
-- Check if game_timeouts table exists
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'game_timeouts'
ORDER BY ordinal_position;
```

### Query 4.2: Calculate Timeouts Remaining

```sql
-- Calculate timeouts remaining from game_timeouts table
SELECT 
  g.id as game_id,
  g.team_a_id,
  g.team_b_id,
  g.team_a_timeouts_remaining as team_a_timeouts_stored,
  g.team_b_timeouts_remaining as team_b_timeouts_stored,
  COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END) as team_a_timeouts_used,
  COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END) as team_b_timeouts_used,
  (7 - COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END)) as team_a_timeouts_calculated,
  (7 - COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END)) as team_b_timeouts_calculated
FROM games g
LEFT JOIN game_timeouts gt ON gt.game_id = g.id
WHERE g.status = 'in_progress'
GROUP BY g.id, g.team_a_id, g.team_b_id, g.team_a_timeouts_remaining, g.team_b_timeouts_remaining
LIMIT 5;
```

**Expected Table** (based on migration 006):
- ✅ `game_timeouts` table exists
- ✅ Columns: `id`, `game_id`, `team_id`, `quarter`, `game_clock_minutes`, `game_clock_seconds`, `created_at`

---

## 5. STORAGE BUCKETS AUDIT

### Query 5.1: List All Storage Buckets

```sql
-- List all storage buckets
SELECT 
  name,
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY name;
```

### Query 5.2: Check for Team Logo Bucket

```sql
-- Check for team-related buckets
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name LIKE '%team%' 
   OR name LIKE '%logo%'
   OR name LIKE '%tournament%'
   OR name LIKE '%card%'
ORDER BY name;
```

**Expected Buckets** (based on migrations):
- ✅ `card-assets` - For card generation assets
- ✅ `player-images` - For player photos
- ✅ `profile-photos` - For profile photos
- ❓ `team-logos` - **NOT FOUND** in migrations (may need to be created)

---

## 6. FOREIGN KEY RELATIONSHIPS

### Query 6.1: Foreign Keys for Teams, Games, Game_Stats

```sql
-- Get all foreign key relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('teams', 'games', 'game_stats', 'game_timeouts', 'game_possessions')
ORDER BY tc.table_name, kcu.column_name;
```

### Query 6.2: Relationships Summary

```sql
-- Summary of relationships
SELECT
  tc.table_name AS "Table",
  kcu.column_name AS "Column",
  ccu.table_name AS "References Table",
  ccu.column_name AS "References Column"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('teams', 'games', 'game_stats')
ORDER BY tc.table_name;
```

---

## 7. COMPREHENSIVE SCHEMA CHECK

### Query 7.1: All Tables Related to Overlay

```sql
-- Check all relevant tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'teams',
    'games',
    'game_stats',
    'game_timeouts',
    'game_possessions',
    'tournaments'
  )
ORDER BY table_name;
```

### Query 7.2: Indexes for Performance

```sql
-- Check indexes on key columns
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'games', 'game_stats', 'game_timeouts')
ORDER BY tablename, indexname;
```

---

## 📋 Expected Schema (Based on Migrations)

### TEAMS TABLE

| Column | Type | Nullable | Default | Source | Status |
|--------|------|----------|---------|--------|--------|
| `id` | UUID | NO | gen_random_uuid() | Base schema | ✅ |
| `tournament_id` | UUID | NO | NULL | Base schema | ✅ |
| `name` | TEXT | NO | NULL | Base schema | ✅ |
| `logo_url` | TEXT | YES | NULL | Migration 001 | ✅ |
| `primary_color` | TEXT | YES | '#111827' | Migration 001 | ✅ |
| `secondary_color` | TEXT | YES | '#999999' | Migration 001 | ✅ |
| `accent_color` | TEXT | YES | '#F5D36C' | Migration 001 | ✅ |
| `coach_id` | UUID | YES | NULL | Migration 004 | ✅ |
| `visibility` | team_visibility | YES | 'private' | Migration 004 | ✅ |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Migration 001 | ✅ |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Migration 001 | ✅ |
| `abbreviation` | TEXT | NO | ❌ **MISSING** | **NEEDS ADD** | ❌ |

**Missing for Overlay**:
- ❌ `abbreviation` or `short_name` - Team abbreviation (e.g., "LAL", "BOS")

---

### GAMES TABLE

| Column | Type | Nullable | Default | Source | Status |
|--------|------|----------|---------|--------|--------|
| `id` | UUID | NO | gen_random_uuid() | Base schema | ✅ |
| `tournament_id` | UUID | NO | NULL | Base schema | ✅ |
| `team_a_id` | UUID | NO | NULL | Base schema | ✅ |
| `team_b_id` | UUID | NO | NULL | Base schema | ✅ |
| `stat_admin_id` | UUID | YES | NULL | Base schema | ✅ |
| `status` | TEXT | YES | 'scheduled' | Base schema | ✅ |
| `start_time` | TIMESTAMPTZ | NO | NULL | Base schema | ✅ |
| `end_time` | TIMESTAMPTZ | YES | NULL | Base schema | ✅ |
| `venue` | TEXT | YES | NULL | Migration add_venue | ✅ |
| `quarter` | INTEGER | YES | 1 | Base schema | ✅ |
| `game_clock_minutes` | INTEGER | YES | 12 | Base schema | ✅ |
| `game_clock_seconds` | INTEGER | YES | 0 | Base schema | ✅ |
| `is_clock_running` | BOOLEAN | YES | false | Base schema | ✅ |
| `home_score` | INTEGER | YES | 0 | Base schema | ✅ |
| `away_score` | INTEGER | YES | 0 | Base schema | ✅ |
| `team_a_fouls` | INTEGER | YES | 0 | Migration 006 | ✅ |
| `team_b_fouls` | INTEGER | YES | 0 | Migration 006 | ✅ |
| `team_a_timeouts_remaining` | INTEGER | YES | 7 | Migration 006 | ✅ |
| `team_b_timeouts_remaining` | INTEGER | YES | 7 | Migration 006 | ✅ |
| `current_possession_team_id` | UUID | YES | NULL | Migration 011 | ✅ |
| `jump_ball_arrow_team_id` | UUID | YES | NULL | Migration 011 | ✅ |
| `possession_changed_at` | TIMESTAMP | YES | NULL | Migration 011 | ✅ |
| `automation_settings` | JSONB | YES | NULL | Migration FUTURE | ✅ |
| `game_phase` | TEXT | YES | NULL | Migration 021 | ✅ |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Base schema | ✅ |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Base schema | ✅ |
| `shot_clock_seconds` | INTEGER | NO | ❌ **MISSING** | **NEEDS ADD** | ❌ |

**Missing for Overlay**:
- ❌ `shot_clock_seconds` - Shot clock value (0-24 seconds)

**Available for Overlay**:
- ✅ `team_a_fouls` / `team_b_fouls` - Team foul counts
- ✅ `team_a_timeouts_remaining` / `team_b_timeouts_remaining` - Timeouts remaining
- ✅ `current_possession_team_id` - Current possession
- ✅ `jump_ball_arrow_team_id` - Possession arrow

---

### GAME_STATS TABLE

| Column | Type | Nullable | Default | Source | Status |
|--------|------|----------|---------|--------|--------|
| `id` | UUID | NO | gen_random_uuid() | Base schema | ✅ |
| `game_id` | UUID | NO | NULL | Base schema | ✅ |
| `player_id` | UUID | YES | NULL | Base schema | ✅ |
| `custom_player_id` | UUID | YES | NULL | Base schema | ✅ |
| `team_id` | UUID | NO | NULL | Base schema | ✅ |
| `stat_type` | TEXT | NO | NULL | Base schema | ✅ |
| `stat_value` | INTEGER | YES | 1 | Base schema | ✅ |
| `modifier` | TEXT | YES | NULL | Base schema | ✅ |
| `quarter` | INTEGER | NO | NULL | Base schema | ✅ |
| `game_time_minutes` | INTEGER | NO | NULL | Base schema | ✅ |
| `game_time_seconds` | INTEGER | NO | NULL | Base schema | ✅ |
| `metadata` | JSONB | YES | NULL | Base schema | ✅ |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Base schema | ✅ |

**Foul Tracking**:
- ✅ Fouls tracked via `stat_type = 'foul'`
- ✅ Foul types via `modifier`: 'personal', 'shooting', 'technical', etc.
- ✅ Team fouls aggregated in `games.team_a_fouls` / `games.team_b_fouls` (via trigger)

---

### GAME_TIMEOUTS TABLE

| Column | Type | Nullable | Default | Source | Status |
|--------|------|----------|---------|--------|--------|
| `id` | UUID | NO | gen_random_uuid() | Migration 006 | ✅ |
| `game_id` | UUID | NO | NULL | Migration 006 | ✅ |
| `team_id` | UUID | NO | NULL | Migration 006 | ✅ |
| `quarter` | INTEGER | NO | NULL | Migration 006 | ✅ |
| `game_clock_minutes` | INTEGER | NO | NULL | Migration 006 | ✅ |
| `game_clock_seconds` | INTEGER | NO | NULL | Migration 006 | ✅ |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Migration 006 | ✅ |

**Timeout Tracking**:
- ✅ Timeouts tracked in `game_timeouts` table
- ✅ Timeouts remaining stored in `games.team_a_timeouts_remaining` / `games.team_b_timeouts_remaining`
- ✅ Can calculate remaining: `7 - COUNT(timeouts used)`

---

## 📊 Schema Summary

### ✅ What EXISTS (Available for Overlay)

#### Teams Table
- ✅ `logo_url` - Team logo URL
- ✅ `primary_color` - Team primary color
- ✅ `secondary_color` - Team secondary color
- ✅ `accent_color` - Team accent color
- ❌ `abbreviation` - **MISSING** (needs to be added)

#### Games Table
- ✅ `team_a_fouls` - Team A foul count
- ✅ `team_b_fouls` - Team B foul count
- ✅ `team_a_timeouts_remaining` - Team A timeouts remaining
- ✅ `team_b_timeouts_remaining` - Team B timeouts remaining
- ✅ `current_possession_team_id` - Current possession
- ✅ `jump_ball_arrow_team_id` - Possession arrow
- ❌ `shot_clock_seconds` - **MISSING** (needs to be added)

#### Game Stats Table
- ✅ Fouls tracked per player (`stat_type = 'foul'`)
- ✅ Team fouls aggregated via trigger

#### Game Timeouts Table
- ✅ Timeouts tracked per game
- ✅ Timeouts remaining calculated

---

### ❌ What's MISSING (Needs to be Added)

#### Teams Table
1. **`abbreviation`** (TEXT, nullable)
   - Purpose: Team abbreviation (e.g., "LAL", "BOS", "GSW")
   - Usage: Display in overlay for space efficiency
   - Priority: **MEDIUM**

#### Games Table
1. **`shot_clock_seconds`** (INTEGER, nullable)
   - Purpose: Current shot clock value (0-24 seconds)
   - Usage: Display shot clock in overlay
   - Priority: **HIGH** (already referenced in code but not in database)

---

## 🎯 Overlay Enhancement Data Availability

### Priority 1: Critical (High Priority)

| Feature | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| **Team Fouls** | `games.team_a_fouls` / `games.team_b_fouls` | ✅ **AVAILABLE** | Already in database |
| **Timeouts Remaining** | `games.team_a_timeouts_remaining` / `games.team_b_timeouts_remaining` | ✅ **AVAILABLE** | Already in database |
| **Possession Indicator** | `games.current_possession_team_id` | ✅ **AVAILABLE** | Already in database |
| **Shot Clock** | `games.shot_clock_seconds` | ❌ **MISSING** | Needs to be added |

### Priority 2: Important (Medium Priority)

| Feature | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| **Team Logos** | `teams.logo_url` | ✅ **AVAILABLE** | Already in database |
| **Team Colors** | `teams.primary_color` / `teams.secondary_color` | ✅ **AVAILABLE** | Already in database |
| **Team Abbreviation** | `teams.abbreviation` | ❌ **MISSING** | Needs to be added |

### Priority 3: Nice-to-Have (Low Priority)

| Feature | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| **Leading Scorer** | Calculate from `game_stats` | ✅ **AVAILABLE** | Can be calculated |
| **Tournament Name** | `tournaments.name` | ✅ **AVAILABLE** | Via join |
| **Venue** | `games.venue` | ✅ **AVAILABLE** | Already in database |

---

## 📝 Recommended Schema Additions

### 1. Add Team Abbreviation

```sql
-- Add abbreviation column to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10);

-- Add comment
COMMENT ON COLUMN teams.abbreviation IS 'Team abbreviation (e.g., "LAL", "BOS", "GSW") for display in overlays and compact views';

-- Optional: Add index for lookups
CREATE INDEX IF NOT EXISTS idx_teams_abbreviation ON teams(abbreviation);
```

**Priority**: MEDIUM  
**Impact**: Enables compact team display in overlay

---

### 2. Add Shot Clock to Games

```sql
-- Add shot clock column to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS shot_clock_seconds INTEGER 
  CHECK (shot_clock_seconds IS NULL OR (shot_clock_seconds >= 0 AND shot_clock_seconds <= 24));

-- Add comment
COMMENT ON COLUMN games.shot_clock_seconds IS 'Current shot clock value (0-24 seconds). NULL if shot clock not applicable or not tracked.';

-- Optional: Add index for queries
CREATE INDEX IF NOT EXISTS idx_games_shot_clock ON games(shot_clock_seconds) WHERE shot_clock_seconds IS NOT NULL;
```

**Priority**: HIGH  
**Impact**: Enables shot clock display in overlay (already referenced in code)

---

## 🔗 Data Relationships

### Foreign Key Relationships

```
tournaments (id)
    │
    ├── teams (tournament_id) → tournaments (id)
    │       │
    │       ├── games (team_a_id) → teams (id)
    │       └── games (team_b_id) → teams (id)
    │
    └── games (tournament_id) → tournaments (id)
            │
            ├── game_stats (game_id) → games (id)
            ├── game_timeouts (game_id) → games (id)
            └── game_possessions (game_id) → games (id)
```

### Join Paths for Overlay Data

**To get team branding**:
```sql
SELECT 
  g.id,
  g.team_a_id,
  g.team_b_id,
  ta.name as team_a_name,
  ta.logo_url as team_a_logo,
  ta.primary_color as team_a_color,
  ta.abbreviation as team_a_abbreviation,
  tb.name as team_b_name,
  tb.logo_url as team_b_logo,
  tb.primary_color as team_b_color,
  tb.abbreviation as team_b_abbreviation
FROM games g
JOIN teams ta ON g.team_a_id = ta.id
JOIN teams tb ON g.team_b_id = tb.id
WHERE g.id = 'game-id';
```

**To get game state**:
```sql
SELECT 
  g.id,
  g.quarter,
  g.game_clock_minutes,
  g.game_clock_seconds,
  g.shot_clock_seconds,
  g.home_score,
  g.away_score,
  g.team_a_fouls,
  g.team_b_fouls,
  g.team_a_timeouts_remaining,
  g.team_b_timeouts_remaining,
  g.current_possession_team_id,
  g.jump_ball_arrow_team_id
FROM games g
WHERE g.id = 'game-id';
```

---

## ✅ Verification Checklist

After running the audit queries, verify:

### Teams Table
- [ ] `logo_url` column exists
- [ ] `primary_color` column exists
- [ ] `secondary_color` column exists
- [ ] `accent_color` column exists
- [ ] `abbreviation` column exists (if not, needs to be added)

### Games Table
- [ ] `team_a_fouls` column exists
- [ ] `team_b_fouls` column exists
- [ ] `team_a_timeouts_remaining` column exists
- [ ] `team_b_timeouts_remaining` column exists
- [ ] `current_possession_team_id` column exists
- [ ] `jump_ball_arrow_team_id` column exists
- [ ] `shot_clock_seconds` column exists (if not, needs to be added)

### Game Stats Table
- [ ] `stat_type` column exists
- [ ] `team_id` column exists
- [ ] Fouls can be queried (`stat_type = 'foul'`)

### Game Timeouts Table
- [ ] Table exists
- [ ] `game_id` column exists
- [ ] `team_id` column exists
- [ ] Timeouts can be counted per team

### Storage Buckets
- [ ] Team logo bucket exists (or can be created)
- [ ] Public access configured (if needed)

---

## 📊 Data Availability Matrix

| Overlay Feature | Database Column | Status | Migration Source |
|----------------|-----------------|--------|------------------|
| **Team Names** | `teams.name` | ✅ Available | Base schema |
| **Team Logos** | `teams.logo_url` | ✅ Available | Migration 001 |
| **Team Colors** | `teams.primary_color` | ✅ Available | Migration 001 |
| **Team Abbreviation** | `teams.abbreviation` | ❌ Missing | **Needs Add** |
| **Scores** | `games.home_score` / `games.away_score` | ✅ Available | Base schema |
| **Game Clock** | `games.game_clock_minutes` / `games.game_clock_seconds` | ✅ Available | Base schema |
| **Quarter** | `games.quarter` | ✅ Available | Base schema |
| **Shot Clock** | `games.shot_clock_seconds` | ❌ Missing | **Needs Add** |
| **Team Fouls** | `games.team_a_fouls` / `games.team_b_fouls` | ✅ Available | Migration 006 |
| **Timeouts Remaining** | `games.team_a_timeouts_remaining` / `games.team_b_timeouts_remaining` | ✅ Available | Migration 006 |
| **Possession** | `games.current_possession_team_id` | ✅ Available | Migration 011 |
| **Possession Arrow** | `games.jump_ball_arrow_team_id` | ✅ Available | Migration 011 |

---

## 🎯 Next Steps

### Immediate (Before Overlay Enhancement)

1. **Run Audit Queries** (this document)
   - Execute all queries in Supabase SQL Editor
   - Verify actual schema matches expected
   - Note any discrepancies

2. **Add Missing Columns** (if needed)
   - Add `teams.abbreviation` (if missing)
   - Add `games.shot_clock_seconds` (if missing)

3. **Verify Data Population**
   - Check if team logos are populated
   - Check if team colors are populated
   - Check if foul/timeout data is accurate

### After Audit

4. **Update Overlay Component**
   - Add new props for fouls, timeouts, possession
   - Add team logo display
   - Add team color theming
   - Add shot clock display

5. **Update Data Fetching**
   - Modify `OrganizerLiveStream.tsx` to fetch new data
   - Update Supabase queries to include new columns
   - Update real-time subscriptions

---

## 📝 Notes

- **Migration History**: Based on migration files found in `docs/05-database/migrations/`
- **Actual Schema**: May differ from migrations if not all have been applied
- **Verification Required**: Run audit queries to confirm actual schema
- **Backend Team**: Coordinate schema additions with backend team

---

**Audit Complete**  
**Next Action**: Run queries in Supabase SQL Editor to verify actual schema  
**Report Generated**: December 18, 2025

