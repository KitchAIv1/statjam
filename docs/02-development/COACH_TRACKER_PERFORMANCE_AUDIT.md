# Coach Tracker Performance Audit

**Date**: November 7, 2025  
**Status**: 🔴 CRITICAL PERFORMANCE ISSUES IDENTIFIED  
**Priority**: HIGH - Affects user experience for new games and resume

---

## 🚨 CRITICAL ISSUES IDENTIFIED

### 1. **DOUBLE GAME DATA FETCH** ⚠️ MAJOR BOTTLENECK
**Location**: `stat-tracker-v3/page.tsx` + `useTracker.ts`

**Problem**:
- `page.tsx` loads game data (line 199): `GameServiceV3.getGame(gameIdParam)`
- `useTracker.ts` loads game data AGAIN (line 201): `GameServiceV3.getGame(gameId)`
- **Result**: 2x HTTP requests for the same data = SLOW loading

**Impact**:
- New games: 2x slower initial load
- Resume games: 2x slower resume time
- Unnecessary network traffic
- Wasted database queries

**Evidence**:
```typescript
// stat-tracker-v3/page.tsx (line 199)
const game = await GameServiceV3.getGame(gameIdParam);

// useTracker.ts (line 201)
const game = await GameServiceV3.getGame(gameId);
```

---

### 2. **SCORE CALCULATION ON EVERY LOAD** ⚠️ SLOW
**Location**: `useTracker.ts` lines 373-405

**Problem**:
- Fetches ALL game stats: `GameServiceV3.getGameStats(gameId)`
- Loops through every stat to calculate scores
- Happens on EVERY page load (new game + resume)

**Impact**:
- Games with 100+ stats = 100+ iterations
- Blocking operation (awaits completion before rendering)
- Scales poorly with game length

**Evidence**:
```typescript
// useTracker.ts (lines 373-405)
const stats = await GameServiceV3.getGameStats(gameId);

if (stats && stats.length > 0) {
  let teamAScore = 0;
  let teamBScore = 0;
  
  for (const stat of stats) {
    let points = 0;
    if (stat.stat_type === 'field_goal' && stat.modifier === 'made') {
      points = 2;
    } else if (stat.stat_type === 'three_pointer' && stat.modifier === 'made') {
      points = 3;
    } else if (stat.stat_type === 'free_throw' && stat.modifier === 'made') {
      points = 1;
    }
    
    if (stat.team_id === teamAId) {
      teamAScore += points;
    } else if (stat.team_id === teamBId) {
      teamBScore += points;
    }
  }
  
  setScores({
    [teamAId]: teamAScore,
    [teamBId]: teamBScore
  });
}
```

---

### 3. **SEQUENTIAL PLAYER LOADING** ⚠️ SLOW
**Location**: `stat-tracker-v3/page.tsx` lines 218-261

**Problem**:
- Team A players load first (await)
- Team B players load second (await)
- Sequential = SLOW (not parallel)

**Impact**:
- Total load time = Team A time + Team B time
- Could be 50% faster with parallel loading

**Evidence**:
```typescript
// Team A loads first
let teamAPlayersData: Player[] = [];
try {
  if (coachMode && coachTeamIdParam) {
    teamAPlayersData = await CoachPlayerService.getCoachTeamPlayers(coachTeamIdParam);
  } else {
    teamAPlayersData = await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, game.id);
  }
  setTeamAPlayers(teamAPlayersData);
} catch (teamAError) { ... }

// Team B loads second (waits for Team A to finish)
let teamBPlayersData: Player[] = [];
try {
  if (!coachMode) {
    teamBPlayersData = await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, game.id);
  }
  setTeamBPlayers(teamBPlayersData);
} catch (teamBError) { ... }
```

---

### 4. **TOURNAMENT FETCH FOR EVERY GAME** ⚠️ MODERATE
**Location**: `useTracker.ts` lines 276-340

**Problem**:
- Fetches tournament data on every game load
- Includes ruleset and automation settings
- Not cached

**Impact**:
- Extra HTTP request on every load
- Could be cached or passed as prop

**Evidence**:
```typescript
// useTracker.ts (lines 282-290)
const tournamentResponse = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tournaments?id=eq.${tournamentId}&select=ruleset,ruleset_config,automation_settings`,
  {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'Content-Type': 'application/json'
    }
  }
);
```

---

### 5. **EXCESSIVE DEBUG LOGGING** ⚠️ MINOR
**Location**: Throughout `stat-tracker-v3/page.tsx` and `useTracker.ts`

**Problem**:
- 20+ console.log statements on every load
- Includes large object serialization
- Slows down rendering in dev mode

**Impact**:
- Minor performance hit
- Console clutter
- Harder to debug real issues

**Evidence**:
```typescript
console.log('🔍 DEBUG: All player IDs:', allPlayers.map(p => ({ id: p.id, name: p.name })));
console.log('🔍 DEBUG: Team A IDs:', teamAPlayersData.map(p => ({ id: p.id, name: p.name })));
console.log('🔍 DEBUG: Team B IDs:', teamBPlayersData.map(p => ({ id: p.id, name: p.name })));
```

---

## 📊 PERFORMANCE IMPACT ANALYSIS

### Current Load Time (Estimated):
```
New Game Load:
├─ Auth check: ~200ms
├─ Game data fetch #1 (page.tsx): ~300ms
├─ Game data fetch #2 (useTracker): ~300ms ❌ DUPLICATE
├─ Tournament fetch: ~200ms
├─ Team A players: ~400ms
├─ Team B players: ~400ms ❌ SEQUENTIAL
├─ Score calculation (0 stats): ~50ms
├─ Render: ~100ms
└─ TOTAL: ~1,950ms (2 seconds)

Resume Game Load (100 stats):
├─ Auth check: ~200ms
├─ Game data fetch #1 (page.tsx): ~300ms
├─ Game data fetch #2 (useTracker): ~300ms ❌ DUPLICATE
├─ Tournament fetch: ~200ms
├─ Team A players: ~400ms
├─ Team B players: ~400ms ❌ SEQUENTIAL
├─ Score calculation (100 stats): ~500ms ❌ SLOW
├─ Render: ~100ms
└─ TOTAL: ~2,400ms (2.4 seconds)
```

### Optimized Load Time (Estimated):
```
New Game Load:
├─ Auth check: ~200ms
├─ Game data fetch (single): ~300ms ✅ DEDUPLICATED
├─ Tournament fetch (parallel): ~200ms ✅ PARALLEL
├─ Team A + B players (parallel): ~400ms ✅ PARALLEL
├─ Score from DB (cached): ~50ms ✅ CACHED
├─ Render: ~100ms
└─ TOTAL: ~850ms (0.85 seconds) 🚀 56% FASTER

Resume Game Load (100 stats):
├─ Auth check: ~200ms
├─ Game data fetch (single): ~300ms ✅ DEDUPLICATED
├─ Tournament fetch (parallel): ~200ms ✅ PARALLEL
├─ Team A + B players (parallel): ~400ms ✅ PARALLEL
├─ Score from DB (cached): ~50ms ✅ CACHED
├─ Render: ~100ms
└─ TOTAL: ~850ms (0.85 seconds) 🚀 65% FASTER
```

---

## 🎯 RECOMMENDED OPTIMIZATIONS

### Priority 1: ELIMINATE DOUBLE FETCH ⚠️ CRITICAL
**Impact**: 15% faster load time

**Solution**:
1. Pass game data from `page.tsx` to `useTracker` as prop
2. Remove duplicate fetch in `useTracker`
3. Only fetch once at page level

**Implementation**:
```typescript
// page.tsx
const tracker = useTracker({
  initialGameId: gameIdParam,
  teamAId: gameData?.team_a_id || 'teamA',
  teamBId: gameData?.team_b_id || 'teamB',
  isCoachMode: coachMode,
  initialGameData: gameData // ✅ NEW: Pass game data
});

// useTracker.ts
export const useTracker = ({ 
  initialGameId, 
  teamAId, 
  teamBId, 
  isCoachMode = false,
  initialGameData // ✅ NEW: Accept game data
}: UseTrackerProps): UseTrackerReturn => {
  // Skip fetch if initialGameData provided
  if (initialGameData) {
    // Use provided data instead of fetching
  } else {
    // Fetch only if not provided (fallback)
  }
}
```

---

### Priority 2: CACHE SCORES IN DATABASE ⚠️ CRITICAL
**Impact**: 20% faster load time (especially for resume)

**Solution**:
1. Store `home_score` and `away_score` in `games` table
2. Update scores in real-time when stats are recorded
3. Load scores from `games` table instead of calculating

**Implementation**:
```typescript
// GameServiceV3.recordStat()
async recordStat(stat: StatRecord) {
  // ... record stat ...
  
  // ✅ NEW: Update game scores in same transaction
  if (stat.modifier === 'made') {
    const points = getPoints(stat.statType);
    await this.updateGameScore(stat.gameId, stat.teamId, points);
  }
}

// useTracker.ts
const game = await GameServiceV3.getGame(gameId);
setScores({
  [teamAId]: game.home_score || 0, // ✅ Direct from DB
  [teamBId]: game.away_score || 0  // ✅ Direct from DB
});
```

**Database Migration**:
```sql
-- games table already has home_score and away_score columns
-- Just need to ensure they're updated on every stat record

-- Add trigger or update GameServiceV3.recordStat()
```

---

### Priority 3: PARALLEL PLAYER LOADING ⚠️ HIGH
**Impact**: 20% faster load time

**Solution**:
1. Load Team A and Team B players in parallel
2. Use `Promise.all()` instead of sequential awaits

**Implementation**:
```typescript
// stat-tracker-v3/page.tsx
// ✅ OPTIMIZED: Load both teams in parallel
const [teamAPlayersData, teamBPlayersData] = await Promise.all([
  // Team A
  (async () => {
    try {
      if (coachMode && coachTeamIdParam) {
        const { CoachPlayerService } = await import('@/lib/services/coachPlayerService');
        const coachPlayers = await CoachPlayerService.getCoachTeamPlayers(coachTeamIdParam);
        return coachPlayers.map(cp => ({
          id: cp.id,
          name: cp.name,
          jerseyNumber: cp.jersey_number,
          email: cp.email,
          is_custom_player: cp.is_custom_player
        }));
      } else {
        return await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, game.id);
      }
    } catch (error) {
      console.error('❌ Failed to load Team A players:', error);
      return [];
    }
  })(),
  
  // Team B
  (async () => {
    try {
      if (!coachMode) {
        return await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, game.id);
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to load Team B players:', error);
      return [];
    }
  })()
]);

setTeamAPlayers(teamAPlayersData);
setTeamBPlayers(teamBPlayersData);
```

---

### Priority 4: REMOVE DEBUG LOGGING ⚠️ MEDIUM
**Impact**: 5% faster load time

**Solution**:
1. Remove or comment out debug console.log statements
2. Use a debug flag for conditional logging
3. Keep only critical error logs

**Implementation**:
```typescript
// Add debug flag
const DEBUG_TRACKER = process.env.NODE_ENV === 'development' && false;

// Conditional logging
if (DEBUG_TRACKER) {
  console.log('🔍 DEBUG: All player IDs:', allPlayers.map(p => ({ id: p.id, name: p.name })));
}
```

---

### Priority 5: PARALLEL TOURNAMENT FETCH ⚠️ LOW
**Impact**: 10% faster load time

**Solution**:
1. Fetch tournament data in parallel with game data
2. Use `Promise.all()` at page level

**Implementation**:
```typescript
// page.tsx
const [game, tournament] = await Promise.all([
  GameServiceV3.getGame(gameIdParam),
  GameServiceV3.getTournament(tournamentId) // ✅ NEW
]);

// Pass tournament data to useTracker
const tracker = useTracker({
  initialGameId: gameIdParam,
  teamAId: gameData?.team_a_id || 'teamA',
  teamBId: gameData?.team_b_id || 'teamB',
  isCoachMode: coachMode,
  initialGameData: gameData,
  initialTournamentData: tournament // ✅ NEW
});
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Quick Wins (30 min)
1. ✅ Remove debug logging
2. ✅ Parallel player loading
3. ✅ Parallel tournament fetch

**Expected Improvement**: 35% faster (2s → 1.3s)

### Phase 2: Database Optimization (2 hours)
1. ✅ Cache scores in `games` table
2. ✅ Update scores on stat record
3. ✅ Load scores from DB

**Expected Improvement**: 20% faster (1.3s → 1.0s)

### Phase 3: Architecture Refactor (4 hours)
1. ✅ Eliminate double fetch
2. ✅ Pass game data as prop
3. ✅ Optimize useTracker initialization

**Expected Improvement**: 15% faster (1.0s → 0.85s)

---

## 📈 EXPECTED RESULTS

### Before Optimization:
- New Game: ~2.0 seconds
- Resume Game: ~2.4 seconds
- User Experience: 🔴 SLOW

### After Phase 1:
- New Game: ~1.3 seconds (35% faster)
- Resume Game: ~1.6 seconds (33% faster)
- User Experience: 🟡 ACCEPTABLE

### After Phase 2:
- New Game: ~1.0 seconds (50% faster)
- Resume Game: ~1.0 seconds (58% faster)
- User Experience: 🟢 GOOD

### After Phase 3:
- New Game: ~0.85 seconds (57% faster)
- Resume Game: ~0.85 seconds (65% faster)
- User Experience: 🟢 EXCELLENT

---

## 🔍 MONITORING

### Key Metrics to Track:
1. **Time to First Render**: When tracker UI appears
2. **Time to Interactive**: When user can start tracking
3. **Score Load Time**: How long scores take to display
4. **Player Roster Load Time**: How long rosters take to display

### Logging Points:
```typescript
console.time('tracker-load');
console.time('game-data-fetch');
console.time('player-load');
console.time('score-calculation');
console.timeEnd('tracker-load');
```

---

## 📝 TESTING CHECKLIST

After implementing optimizations:

- [ ] New game loads in < 1 second
- [ ] Resume game loads in < 1 second
- [ ] Scores display immediately
- [ ] Player rosters load immediately
- [ ] No duplicate network requests
- [ ] No console errors
- [ ] All stats record correctly
- [ ] Scores update in real-time
- [ ] Resume preserves all state

---

## 🎯 SUCCESS CRITERIA

✅ **New Game Load**: < 1 second  
✅ **Resume Game Load**: < 1 second  
✅ **Score Display**: Immediate (< 100ms)  
✅ **Player Roster**: Immediate (< 200ms)  
✅ **Zero Duplicate Fetches**  
✅ **Zero Score Calculation Loops**  

---

## 📚 RELATED FILES

- `/src/app/stat-tracker-v3/page.tsx` - Main tracker page
- `/src/hooks/useTracker.ts` - Tracker state management
- `/src/lib/services/gameServiceV3.ts` - Game data service
- `/src/lib/services/teamServiceV3.ts` - Team data service
- `/src/lib/services/coachPlayerService.ts` - Coach player service

---

**Status**: Ready for implementation  
**Priority**: CRITICAL  
**Estimated Time**: 6.5 hours total  
**Expected Impact**: 57-65% faster load times

