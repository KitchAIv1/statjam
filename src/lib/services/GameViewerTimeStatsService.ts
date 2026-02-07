/**
 * GameViewerTimeStatsService
 * Pure computation functions for time-based stats (minutes played, plus/minus).
 * NO database calls - operates on pre-fetched data only.
 * MATCHES LOGIC FROM: teamStatsService.ts (original)
 */

import { GameViewerV3APIResponse } from '@/providers/GameViewerV3Provider';

/** 
 * Calculate stint duration in seconds (handles cross-quarter stints)
 * startGameClock & endGameClock = seconds REMAINING on clock (e.g., 480 for 8:00)
 */
function calculateStintSeconds(
  startQuarter: number,
  startGameClock: number,
  endQuarter: number,
  endGameClock: number,
  quarterLengthSeconds: number
): number {
  if (startQuarter === endQuarter) {
    // Same quarter: simple subtraction (clock counts down)
    return Math.max(0, startGameClock - endGameClock);
  }
  
  // Cross-quarter calculation:
  // 1. Time remaining in start quarter (from stint start to end of quarter)
  const startQuarterTime = startGameClock;
  // 2. Full quarters between start and end
  const fullQuarters = Math.max(0, endQuarter - startQuarter - 1);
  const fullQuartersTime = fullQuarters * quarterLengthSeconds;
  // 3. Time elapsed in end quarter (from start of quarter to current clock)
  const endQuarterTime = quarterLengthSeconds - endGameClock;
  
  return startQuarterTime + fullQuartersTime + endQuarterTime;
}

/**
 * Convert game time to elapsed seconds (for sorting/comparison)
 */
function convertGameTimeToElapsed(
  quarter: number,
  minutes: number,
  seconds: number,
  quarterLengthSeconds: number
): number {
  const previousQuartersSeconds = (quarter - 1) * quarterLengthSeconds;
  const currentQuarterElapsed = quarterLengthSeconds - (minutes * 60 + seconds);
  return previousQuartersSeconds + currentQuarterElapsed;
}

/** 
 * Compute player minutes using EXACT logic from original TeamStatsService 
 */
export function computePlayerMinutes(
  gameData: GameViewerV3APIResponse,
  teamId: string,
  playerIds: string[]
): Map<string, number> {
  const playerMinutes = new Map<string, number>();
  const { game, substitutions, stats } = gameData;
  
  // Quarter length (default 8 min for youth/rec)
  const quarterLengthMinutes = (game as Record<string, unknown>).quarter_length_minutes as number || 8;
  const quarterLengthSeconds = quarterLengthMinutes * 60;
  
  // Current game state
  const currentGameState = {
    quarter: game.quarter || 1,
    clockMinutes: game.game_clock_minutes ?? quarterLengthMinutes,
    clockSeconds: game.game_clock_seconds ?? 0
  };
  
  // Players who have ANY stat (for DNP detection) - exclude opponent stats
  const playersWithStats = new Set<string>();
  stats.filter(s => s.team_id === teamId && s.is_opponent_stat !== true).forEach(s => {
    const pid = s.custom_player_id || s.player_id;
    if (pid) playersWithStats.add(pid);
  });
  
  // Initialize all players with 0
  playerIds.forEach(pid => playerMinutes.set(pid, 0));
  
  // Filter substitutions for this team, sort by created_at (original does this)
  const teamSubs = substitutions
    .filter(s => s.team_id === teamId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // No substitutions case
  if (teamSubs.length === 0) {
    const { quarter, clockMinutes, clockSeconds } = currentGameState;
    const quarterTimeElapsed = quarterLengthSeconds - (clockMinutes * 60 + clockSeconds);
    const totalTimeElapsed = ((quarter - 1) * quarterLengthSeconds) + quarterTimeElapsed;
    const minutesElapsed = totalTimeElapsed / 60;
    
    playerIds.forEach(pid => {
      playerMinutes.set(pid, playersWithStats.has(pid) ? Math.max(1, Math.round(minutesElapsed)) : 0);
    });
    return playerMinutes;
  }
  
  // Infer starters from substitution data (EXACT match to original)
  const inferredStarters = new Set<string>();
  const playerFirstAction = new Map<string, 'IN' | 'OUT'>();
  const playersInSubs = new Set<string>();
  
  for (const sub of teamSubs) {
    const playerInId = sub.player_in_id || sub.custom_player_in_id;
    const playerOutId = sub.player_out_id || sub.custom_player_out_id;
    
    if (playerInId) playersInSubs.add(playerInId);
    if (playerOutId) playersInSubs.add(playerOutId);
    
    // First action is OUT = starter
    if (playerOutId && !playerFirstAction.has(playerOutId)) {
      playerFirstAction.set(playerOutId, 'OUT');
      inferredStarters.add(playerOutId);
    }
    // First action is IN = bench player
    if (playerInId && !playerFirstAction.has(playerInId)) {
      playerFirstAction.set(playerInId, 'IN');
    }
  }
  
  // Players with stats but no subs = starters who played full game
  playerIds.forEach(pid => {
    if (!playersInSubs.has(pid) && playersWithStats.has(pid)) {
      inferredStarters.add(pid);
    }
  });
  
  // Calculate floor time for each player
  for (const playerId of playerIds) {
    let totalSeconds = 0;
    let isOnCourt = false;
    let stintStartQuarter = 1;
    let stintStartGameClock = quarterLengthSeconds; // Seconds remaining when stint started
    
    // Starters begin on court at game start
    if (inferredStarters.has(playerId)) {
      isOnCourt = true;
      stintStartQuarter = 1;
      stintStartGameClock = quarterLengthSeconds;
    }
    
    // Process substitutions chronologically
    for (const sub of teamSubs) {
      const subQuarter = sub.quarter || 1;
      // Game clock in seconds remaining (e.g., 6:30 = 390)
      const subGameClock = ((sub.game_time_minutes ?? quarterLengthMinutes) * 60) + (sub.game_time_seconds ?? 0);
      
      const playerInId = sub.player_in_id || sub.custom_player_in_id;
      const playerOutId = sub.player_out_id || sub.custom_player_out_id;
      
      if (playerInId === playerId && !isOnCourt) {
        // Player coming in
        stintStartQuarter = subQuarter;
        stintStartGameClock = subGameClock;
        isOnCourt = true;
      } else if (playerOutId === playerId && isOnCourt) {
        // Player going out - calculate stint
        const stintSeconds = calculateStintSeconds(
          stintStartQuarter, stintStartGameClock,
          subQuarter, subGameClock,
          quarterLengthSeconds
        );
        totalSeconds += stintSeconds;
        isOnCourt = false;
      }
    }
    
    // Handle player still on court (close stint with current game state)
    if (isOnCourt) {
      const currentClock = currentGameState.clockMinutes * 60 + currentGameState.clockSeconds;
      const stintSeconds = calculateStintSeconds(
        stintStartQuarter, stintStartGameClock,
        currentGameState.quarter, currentClock,
        quarterLengthSeconds
      );
      totalSeconds += stintSeconds;
    }
    
    // Players who played show at least 1 minute, DNP = 0
    const totalMinutes = totalSeconds > 0 ? Math.max(1, Math.round(totalSeconds / 60)) : 0;
    playerMinutes.set(playerId, totalMinutes);
  }
  
  return playerMinutes;
}

/** 
 * Compute player plus/minus using EXACT logic from original TeamStatsService
 * +/- = team points while on court − opponent points while on court
 */
export function computePlayerPlusMinus(
  gameData: GameViewerV3APIResponse,
  teamId: string,
  playerIds: string[]
): Map<string, number> {
  const playerPlusMinus = new Map<string, number>();
  const { game, substitutions, stats } = gameData;
  
  // Initialize all players with 0
  playerIds.forEach(pid => playerPlusMinus.set(pid, 0));
  
  // Check if coach game (special is_opponent_stat handling)
  const isCoachGame = (game as Record<string, unknown>).is_coach_game === true;
  
  // Quarter length
  const quarterLengthMinutes = (game as Record<string, unknown>).quarter_length_minutes as number || 8;
  const quarterLengthSeconds = quarterLengthMinutes * 60;
  
  // Current game state (for capping ongoing games)
  const currentGameState = {
    quarter: game.quarter || 1,
    clockMinutes: game.game_clock_minutes ?? quarterLengthMinutes,
    clockSeconds: game.game_clock_seconds ?? 0
  };
  const currentGameTimeSeconds = convertGameTimeToElapsed(
    currentGameState.quarter,
    currentGameState.clockMinutes,
    currentGameState.clockSeconds,
    quarterLengthSeconds
  );
  
  // Opponent team ID
  const opponentTeamId = game.team_a_id === teamId ? game.team_b_id : game.team_a_id;
  
  // Filter scoring stats (made shots only)
  const scoringStats = stats.filter(s => 
    s.modifier === 'made' && 
    ['field_goal', 'two_pointer', 'three_pointer', '3_pointer', 'free_throw'].includes(s.stat_type)
  );
  
  // ✅ FIX: Sort substitutions by GAME TIME (not created_at) - matches original
  const teamSubs = substitutions
    .filter(s => s.team_id === teamId)
    .sort((a, b) => {
      const aTime = convertGameTimeToElapsed(
        a.quarter, a.game_time_minutes ?? quarterLengthMinutes, a.game_time_seconds ?? 0, quarterLengthSeconds
      );
      const bTime = convertGameTimeToElapsed(
        b.quarter, b.game_time_minutes ?? quarterLengthMinutes, b.game_time_seconds ?? 0, quarterLengthSeconds
      );
      return aTime - bTime;
    });
  
  // Players who have ANY stat (for DNP detection) - exclude opponent stats
  const playersWithStats = new Set<string>();
  stats.filter(s => s.team_id === teamId && s.is_opponent_stat !== true).forEach(s => {
    const pid = s.custom_player_id || s.player_id;
    if (pid) playersWithStats.add(pid);
  });
  
  // Detect starters from substitution data (EXACT match to original)
  const starterIds = new Set<string>();
  const playerFirstAction = new Map<string, 'in' | 'out'>();
  
  teamSubs.forEach(sub => {
    const playerInId = sub.player_in_id || sub.custom_player_in_id;
    const playerOutId = sub.player_out_id || sub.custom_player_out_id;
    
    // First action is OUT = starter
    if (playerOutId && playerIds.includes(playerOutId) && !playerFirstAction.has(playerOutId)) {
      playerFirstAction.set(playerOutId, 'out');
      starterIds.add(playerOutId);
    }
    // First action is IN = bench player
    if (playerInId && playerIds.includes(playerInId) && !playerFirstAction.has(playerInId)) {
      playerFirstAction.set(playerInId, 'in');
    }
  });
  
  // Players with NO subs who have ANY stat = starters who played full game
  playerIds.forEach(playerId => {
    if (!playerFirstAction.has(playerId) && playersWithStats.has(playerId)) {
      starterIds.add(playerId);
    }
  });
  
  // Build timeline based on starters
  const playerTimeline = new Map<string, Array<{ start: number; end: number | null }>>();
  const currentlyOnCourt = new Set<string>();
  
  playerIds.forEach(playerId => {
    if (starterIds.has(playerId)) {
      playerTimeline.set(playerId, [{ start: 0, end: null }]);
      currentlyOnCourt.add(playerId);
    } else {
      playerTimeline.set(playerId, []);
    }
  });
  
  // Process substitutions with state validation (prevents duplicates)
  teamSubs.forEach(sub => {
    const subTime = convertGameTimeToElapsed(
      sub.quarter,
      sub.game_time_minutes ?? quarterLengthMinutes,
      sub.game_time_seconds ?? 0,
      quarterLengthSeconds
    );
    
    const playerInId = sub.player_in_id || sub.custom_player_in_id;
    const playerOutId = sub.player_out_id || sub.custom_player_out_id;
    
    // Player going out - only if actually on court
    if (playerOutId && playerIds.includes(playerOutId) && currentlyOnCourt.has(playerOutId)) {
      const timeline = playerTimeline.get(playerOutId)!;
      const lastStint = timeline[timeline.length - 1];
      if (lastStint && lastStint.end === null) {
        lastStint.end = subTime;
      }
      currentlyOnCourt.delete(playerOutId);
    }
    
    // Player coming in - only if not already on court
    if (playerInId && playerIds.includes(playerInId) && !currentlyOnCourt.has(playerInId)) {
      const timeline = playerTimeline.get(playerInId)!;
      timeline.push({ start: subTime, end: null });
      currentlyOnCourt.add(playerInId);
    }
  });
  
  // Calculate plus/minus for each player
  for (const playerId of playerIds) {
    const timeline = playerTimeline.get(playerId) || [];
    let teamPoints = 0;
    let opponentPoints = 0;
    
    // For each scoring event, check if player was on court
    scoringStats.forEach(stat => {
      const statTime = convertGameTimeToElapsed(
        stat.quarter ?? 1,
        stat.game_time_minutes ?? quarterLengthMinutes,
        stat.game_time_seconds ?? 0,
        quarterLengthSeconds
      );
      
      // Cap to current game time (don't count future events for ongoing games)
      if (statTime > currentGameTimeSeconds) return;
      
      // Determine point value
      let points = 0;
      if (stat.stat_type === '3_pointer' || stat.stat_type === 'three_pointer') {
        points = 3;
      } else if (stat.stat_type === 'free_throw') {
        points = 1;
      } else {
        points = 2; // field_goal, two_pointer
      }
      
      // Check if player was on court during this scoring event
      // Cap stint.end to current game time for "still on court" players
      const wasOnCourt = timeline.some(stint => {
        const stintEnd = stint.end === null ? currentGameTimeSeconds : stint.end;
        return statTime >= stint.start && statTime <= stintEnd;
      });
      
      if (wasOnCourt) {
        // ✅ Coach Mode: is_opponent_stat means opponent scored (count against team)
        if (isCoachGame && stat.is_opponent_stat === true) {
          opponentPoints += points;
        } else if (stat.team_id === teamId) {
          teamPoints += points;
        } else if (stat.team_id === opponentTeamId) {
          opponentPoints += points;
        }
      }
    });
    
    playerPlusMinus.set(playerId, teamPoints - opponentPoints);
  }
  
  return playerPlusMinus;
}
