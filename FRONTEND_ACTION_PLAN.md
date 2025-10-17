# 🎯 Frontend Action Plan: Immediate Fixes

**Date**: October 17, 2025  
**Status**: READY TO IMPLEMENT  
**Dependencies**: Some fixes require backend coordination (marked with 🔴)

---

## 📋 FIXES WE CAN DO NOW (Frontend Only)

### ✅ 1. Implement Player Locking (Frontend Validation)

**Location**: `src/lib/services/tournamentService.ts`  
**Function**: `TeamService.addPlayerToTeam()`  
**Line**: ~680

**Current Code**:
```typescript
static async addPlayerToTeam(teamId: string, playerId: string, position?: string, jerseyNumber?: number): Promise<void> {
  try {
    console.log('🔍 TeamService: Adding player to team:', { teamId, playerId });
    
    // Use upsert to handle duplicates gracefully at database level
    const { error } = await supabase
      .from('team_players')
      .upsert({
        team_id: teamId,
        player_id: playerId
      }, {
        onConflict: 'team_id,player_id'
      });
    // ...
  }
}
```

**New Code** (Add validation):
```typescript
static async addPlayerToTeam(teamId: string, playerId: string, position?: string, jerseyNumber?: number): Promise<void> {
  try {
    console.log('🔍 TeamService: Adding player to team:', { teamId, playerId });
    
    // STEP 1: Get tournament ID for this team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('tournament_id')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) {
      throw new Error(`Failed to get team information: ${teamError?.message}`);
    }
    
    // STEP 2: Check if player is already assigned to another team in this tournament
    const { data: existingAssignments, error: checkError } = await supabase
      .from('team_players')
      .select(`
        team_id,
        teams!inner(tournament_id, name)
      `)
      .eq('player_id', playerId);
    
    if (checkError) {
      console.error('❌ Error checking existing player assignments:', checkError);
      // Don't block the assignment if check fails (fail open)
    } else if (existingAssignments && existingAssignments.length > 0) {
      // Filter for assignments in the same tournament
      const sameT ournamentAssignments = existingAssignments.filter(
        (assignment: any) => assignment.teams?.tournament_id === team.tournament_id
      );
      
      if (sameT ournamentAssignments.length > 0) {
        const existingTeamName = sameTournamentAssignments[0].teams?.name || 'another team';
        throw new Error(
          `Player is already assigned to ${existingTeamName} in this tournament. ` +
          `Please remove them from that team first.`
        );
      }
    }
    
    // STEP 3: Proceed with assignment if validation passed
    const { error } = await supabase
      .from('team_players')
      .upsert({
        team_id: teamId,
        player_id: playerId
      }, {
        onConflict: 'team_id,player_id'
      });

    if (error) {
      console.error('❌ Supabase error adding player to team:', error);
      throw new Error(`Failed to add player to team: ${error.message}`);
    }

    console.log('✅ Player successfully added to team in database');
  } catch (error) {
    console.error('Error adding player to team:', error);
    throw error instanceof Error ? error : new Error('Failed to add player to team');
  }
}
```

**Testing**:
1. Assign player to Team A ✅
2. Attempt to assign same player to Team B ❌
3. Verify error message displays in UI
4. Remove player from Team A
5. Assign player to Team B ✅

---

### ✅ 2. Consolidate Data Flow (Remove V1 Confusion)

**Problem**: Two systems running simultaneously (V1 and V2)  
**Solution**: Add feature flag to cleanly separate them

**Location**: `src/hooks/useGameViewerData.ts`  
**Current**: Line 81-125

**Add Feature Flag**:
```typescript
// At top of file
const ENABLE_V1_FALLBACK = false; // Set to false once real-time is fixed

export const useGameViewerData = (gameId: string): UseGameViewerDataReturn => {
  // ...existing code...
  
  // V1 Stream (only if fallback enabled)
  const gameDataV1 = ENABLE_V1_FALLBACK ? useGameStream(gameId, true) : null;
  
  // V2 Feed (primary)
  const { plays: v2Plays = [], homeScore = 0, awayScore = 0 } = usePlayFeed(gameId, teamMap);
  
  // Use V2 scores if available, otherwise fall back to V1
  const displayScores = {
    home: homeScore || gameDataV1?.game?.homeScore || 0,
    away: awayScore || gameDataV1?.game?.awayScore || 0
  };
  
  // ...rest of implementation...
}
```

**Benefits**:
- Clear separation between V1 and V2
- Easy to disable V1 once real-time works
- Single source of truth for scores

---

### ✅ 3. Add Score Validation & Logging

**Problem**: Hard to debug score desync issues  
**Solution**: Add comprehensive logging and validation

**Location**: `src/hooks/usePlayFeed.tsx`  
**Function**: `fetchAll()`

**Add Score Validation**:
```typescript
const fetchAll = useCallback(async () => {
  if (isFetching) {
    console.log('🔄 V2 Feed: fetchAll() called but already fetching, skipping');
    return;
  }
  console.log('🔄 V2 Feed: fetchAll() starting for gameId:', gameId);
  setIsFetching(true);
  
  try {
    setError(null);
    const [stats, subs] = await Promise.all([
      StatsService.getByGameId(gameId),
      SubstitutionsService.getByGameId(gameId),
    ]);

    const statsTx = transformStatsToPlay(stats, teamMap);
    const subsTx = transformSubsToPlay(subs, teamMap);

    // NEW: Fetch game scores for comparison
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('home_score, away_score, team_a_id, team_b_id')
      .eq('id', gameId)
      .single();
    
    if (!gameError && game) {
      // Validate scores match
      const calculatedHome = statsTx.finalHome;
      const calculatedAway = statsTx.finalAway;
      const dbHome = game.home_score || 0;
      const dbAway = game.away_score || 0;
      
      console.log('🔍 V2 Feed: Score Validation:', {
        calculated: `${calculatedHome}-${calculatedAway}`,
        database: `${dbHome}-${dbAway}`,
        match: calculatedHome === dbHome && calculatedAway === dbAway
      });
      
      if (calculatedHome !== dbHome || calculatedAway !== dbAway) {
        console.warn('⚠️ SCORE DESYNC DETECTED:', {
          gameId,
          calculatedScores: { home: calculatedHome, away: calculatedAway },
          databaseScores: { home: dbHome, away: dbAway },
          difference: {
            home: calculatedHome - dbHome,
            away: calculatedAway - dbAway
          }
        });
      }
    }

    // Sort and merge plays...
    const merged = [...statsTx.plays, ...subsTx].sort((a, b) => {
      const ca = new Date(a.createdAt).getTime();
      const cb = new Date(b.createdAt).getTime();
      if (cb !== ca) return cb - ca;
      if (a.quarter !== b.quarter) return b.quarter - a.quarter;
      const ta = (a.gameTimeMinutes || 0) * 60 + (a.gameTimeSeconds || 0);
      const tb = (b.gameTimeMinutes || 0) * 60 + (b.gameTimeSeconds || 0);
      return tb - ta;
    });

    setPlays(merged);
    setHomeScore(statsTx.finalHome);
    setAwayScore(statsTx.finalAway);

    console.log('🔍 V2 Feed: Updated', merged.length, 'plays, final scores:', `${statsTx.finalHome}-${statsTx.finalAway}`);
  } catch (e) {
    console.error('❌ V2 Feed: Error fetching data:', e);
    setError('Failed to load play feed');
  } finally {
    setLoading(false);
    setIsFetching(false);
  }
}, [gameId, teamMap.teamAId, teamMap.teamBId]);
```

**Benefits**:
- Detect score desync immediately
- Detailed logging for debugging
- Helps identify if backend trigger is working

---

### ✅ 4. Improve Error Handling for Stat Recording

**Problem**: Stat recording failures are not clearly communicated to user  
**Solution**: Add better error feedback

**Location**: `src/lib/services/gameService.ts`  
**Function**: `recordStat()`

**Add User-Friendly Error Messages**:
```typescript
static async recordStat(statData: {
  gameId: string;
  playerId: string;
  teamId: string;
  statType: string;
  statValue: number;
  modifier?: string;
  quarter: number;
  gameTimeMinutes: number;
  gameTimeSeconds: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 GameService: Recording stat for player:', statData.playerId);
    
    // Quick session check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('❌ No active session');
      return { 
        success: false, 
        error: 'You must be logged in to record stats'
      };
    }
    
    // Validate data
    if (!statData.gameId || !statData.playerId || !statData.teamId) {
      console.error('❌ Missing required IDs:', statData);
      return { 
        success: false, 
        error: 'Invalid stat data: missing required fields'
      };
    }
    
    // Prepare insert data
    const insertData = {
      game_id: statData.gameId,
      player_id: statData.playerId,
      team_id: statData.teamId,
      stat_type: statData.statType,
      stat_value: statData.statValue,
      modifier: statData.modifier,
      quarter: statData.quarter,
      game_time_minutes: statData.gameTimeMinutes,
      game_time_seconds: statData.gameTimeSeconds
    };
    
    console.log('📊 GameService: Inserting stat:', statData.statType);
    
    // Insert stat record
    const { data, error } = await supabase
      .from('game_stats')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error recording stat:', error);
      
      // Provide specific error messages based on error code
      let userMessage = 'Failed to record stat';
      
      if (error.code === '23503') {
        // Foreign key violation
        userMessage = 'Invalid game, player, or team ID';
      } else if (error.code === '42501') {
        // Permission denied
        userMessage = 'You do not have permission to record stats for this game';
      } else if (error.message.includes('duplicate')) {
        userMessage = 'This stat has already been recorded';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Database timeout - please try again';
      }
      
      return { 
        success: false, 
        error: `${userMessage}: ${error.message}`
      };
    }

    console.log('✅ Stat recorded successfully:', data);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Unexpected error in recordStat:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

**Update Caller (stat-tracker/page.tsx)**:
```typescript
const recordStat = async (stat: any, modifier: string = '') => {
  // ...existing code...
  
  // Record stat in database
  const result = await GameService.recordStat(statData);
  
  if (!result.success) {
    console.error('❌ Failed to record stat:', result.error);
    alert(`Error: ${result.error}`);
    return;
  }
  
  console.log('✅ Stat recorded successfully');
  // ...rest of success handling...
};
```

---

### ✅ 5. Add Real-Time Status Indicator

**Problem**: Users don't know if real-time is working or polling fallback is active  
**Solution**: Add visual indicator

**Location**: `src/hooks/useGameViewerData.ts`

**Add Status Tracking**:
```typescript
export const useGameViewerData = (gameId: string): UseGameViewerDataReturn => {
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'polling' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // ...existing code...
  
  // Add status tracking to polling effect
  useEffect(() => {
    if (!gameId) return;
    
    const shouldPoll = gameData?.game && isLive;
    if (!shouldPoll) {
      setRealtimeStatus('disconnected');
      return;
    }

    console.log('🔄 GameViewerData: Starting smart polling fallback');
    setRealtimeStatus('polling'); // Indicate we're in fallback mode
    
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setLastUpdate(new Date());
        // ...polling logic...
      }
    }, 2000);

    return () => {
      console.log('🔄 GameViewerData: Stopping smart polling');
      clearInterval(pollInterval);
    };
  }, [gameId, isLive, enableViewerV2, gameData?.game]);
  
  return {
    // ...existing return values...
    realtimeStatus,
    lastUpdate
  };
};
```

**Add UI Indicator** (`src/components/GameViewerHeader.tsx` or similar):
```typescript
function RealtimeStatusBadge({ status, lastUpdate }: { status: string; lastUpdate: Date | null }) {
  if (status === 'disconnected') return null;
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm">
      {status === 'connected' ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span>Polling (Real-time unavailable)</span>
        </>
      )}
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
```

---

## 🔴 FIXES REQUIRING BACKEND (Cannot Do Frontend Only)

### 1. Enable Real-Time Subscriptions
- **Requires**: Backend SQL commands
- **See**: `BACKEND_COORDINATION_REQUIRED.md`

### 2. Auto-Update Game Scores (Database Trigger)
- **Requires**: Backend SQL trigger
- **See**: `BACKEND_COORDINATION_REQUIRED.md`

### 3. Database-Level Player Locking
- **Requires**: Backend SQL trigger
- **See**: `BACKEND_COORDINATION_REQUIRED.md`
- **Note**: Frontend validation (Fix #1 above) provides temporary solution

---

## 📋 IMPLEMENTATION CHECKLIST

### Immediate (Can Do Now)
- [ ] Implement player locking frontend validation
- [ ] Add score validation logging
- [ ] Improve error handling for stat recording
- [ ] Add real-time status indicator
- [ ] Add feature flag for V1/V2 consolidation

### After Backend Fixes
- [ ] Remove polling fallback (once real-time confirmed working)
- [ ] Disable V1 data flow (set `ENABLE_V1_FALLBACK = false`)
- [ ] Remove score validation logging (once trigger confirmed working)
- [ ] Update real-time status indicator to show "connected"

### Testing
- [ ] Test player locking with multiple teams
- [ ] Test stat recording error scenarios
- [ ] Test score desync detection
- [ ] Test real-time status indicator updates
- [ ] Test V2-only mode (V1 disabled)

---

## 🎯 SUCCESS METRICS

**Before Fixes**:
- Real-time: ❌ Not working (polling fallback active)
- Player locking: ❌ Not enforced
- Score sync: ⚠️ Potential desync
- Error feedback: ⚠️ Generic messages

**After Frontend Fixes**:
- Real-time: ⚠️ Still polling, but with status indicator
- Player locking: ✅ Frontend validation working
- Score sync: ✅ Desync detection active
- Error feedback: ✅ User-friendly messages

**After Backend Fixes**:
- Real-time: ✅ Working (no polling needed)
- Player locking: ✅ Database-enforced
- Score sync: ✅ Auto-updated via trigger
- Error feedback: ✅ User-friendly messages

---

**END OF FRONTEND ACTION PLAN - Ready to implement!**

