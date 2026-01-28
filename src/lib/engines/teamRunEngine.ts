/**
 * TeamRunEngine - Detects team scoring runs from game stats
 * 
 * PURPOSE: Calculate consecutive unanswered points from existing game_stats
 * No new DB schema needed - reuses game_stats source of truth
 * 
 * NBA Standards:
 * - 8-0 run: Noteworthy
 * - 10-0 run: Significant  
 * - 12-0+ run: Major run
 * 
 * @module TeamRunEngine
 */

export interface ScoringPlay {
  teamId: string;
  points: number;
  timestamp: string; // created_at from game_stats
}

export interface TeamRun {
  teamId: string;
  teamName: string;
  points: number;        // Total run points (e.g., 10)
  opponentPoints: number; // Always 0 for a run
  isActive: boolean;     // Run is still going
  priority: number;      // Higher = more important
}

export interface TeamRunResult {
  hasRun: boolean;
  run: TeamRun | null;
  label: string | null;  // e.g., "EAGLES 10-0 RUN"
}

// Minimum points for a run to be displayed
const MIN_RUN_THRESHOLD = 8;

/**
 * Extract scoring plays from game_stats
 * Only counts made shots with point values
 */
export function extractScoringPlays(
  stats: Array<{
    id: string;
    team_id: string;
    stat_type: string;
    stat_value: number;
    modifier?: string;
    is_opponent_stat?: boolean;
    created_at: string;
  }>,
  teamAId: string,
  teamBId: string
): ScoringPlay[] {
  return stats
    .filter(stat => 
      stat.modifier === 'made' && 
      stat.stat_value > 0 &&
      ['field_goal', 'three_pointer', 'free_throw'].includes(stat.stat_type)
    )
    .map(stat => ({
      teamId: stat.is_opponent_stat 
        ? (stat.team_id === teamAId ? teamBId : teamAId)
        : stat.team_id,
      points: stat.stat_value,
      timestamp: stat.created_at,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Detect the current scoring run (if any)
 * Looks at the most recent consecutive scores by one team
 */
export function detectTeamRun(
  scoringPlays: ScoringPlay[],
  teamNames: { [teamId: string]: string }
): TeamRunResult {
  if (scoringPlays.length < 3) {
    return { hasRun: false, run: null, label: null };
  }

  // Start from most recent and work backwards
  const recentPlays = [...scoringPlays].reverse();
  const runTeamId = recentPlays[0].teamId;
  
  let runPoints = 0;
  let consecutiveCount = 0;

  // Count consecutive points by same team (from most recent)
  for (const play of recentPlays) {
    if (play.teamId === runTeamId) {
      runPoints += play.points;
      consecutiveCount++;
    } else {
      // Run broken - opponent scored
      break;
    }
  }

  // Check if run meets threshold
  if (runPoints >= MIN_RUN_THRESHOLD && consecutiveCount >= 3) {
    const teamName = teamNames[runTeamId] || 'TEAM';
    
    // Priority increases with run size
    const priority = runPoints >= 12 ? 90 : runPoints >= 10 ? 80 : 70;
    
    const run: TeamRun = {
      teamId: runTeamId,
      teamName,
      points: runPoints,
      opponentPoints: 0,
      isActive: true,
      priority,
    };

    return {
      hasRun: true,
      run,
      label: `🔥 ${teamName.toUpperCase()} ${runPoints}-0 RUN`,
    };
  }

  return { hasRun: false, run: null, label: null };
}

/**
 * Check if a new score breaks an existing run
 */
export function isRunBroken(
  currentRun: TeamRun | null,
  newScoringTeamId: string
): boolean {
  if (!currentRun) return false;
  return newScoringTeamId !== currentRun.teamId;
}

/**
 * Get display text for run notification
 */
export function getRunDisplayText(run: TeamRun): string {
  return `${run.teamName.toUpperCase()} ${run.points}-0 RUN`;
}
