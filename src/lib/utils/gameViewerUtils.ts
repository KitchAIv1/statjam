/**
 * Game Viewer Utility Functions
 * 
 * Pure functions for formatting and calculating display values
 * in the game viewer. No side effects or state dependencies.
 */

/**
 * Format game time for display (MM:SS)
 */
export const formatGameTime = (minutes: number, seconds: number): string => {
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format quarter display (Q1, Q2, OT1, etc.)
 */
export const formatQuarter = (quarter: number): string => {
  if (quarter <= 4) {
    return `Q${quarter}`;
  } else {
    return `OT${quarter - 4}`;
  }
};

/**
 * Format date for display
 */
export const formatGameDate = (dateString: string): string => {
  if (!dateString) {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get game status display text
 */
export const getGameStatusText = (
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime',
  quarter: number,
  startTime: string
): string => {
  if (status === 'completed') {
    return 'Final';
  } else if (status === 'in_progress' || status === 'overtime') {
    return formatQuarter(quarter);
  } else if (status === 'scheduled') {
    return formatGameDate(startTime);
  }
  return status.toUpperCase();
};

/**
 * Get status indicator color based on game state
 */
export const getStatusColor = (isLive: boolean, status: string): string => {
  if (isLive) return '#ff0000';
  if (status === 'completed') return '#00ff88';
  return '#b3b3b3';
};

/**
 * Get relative time display (e.g., "15s ago", "2m ago")
 */
export const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const playTime = new Date(timestamp);
  const diffMs = now.getTime() - playTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    return playTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  }
};

/**
 * Get team name from play data with fallbacks
 */
export const getTeamName = (
  teamName?: string,
  teamId?: string,
  fallback: string = 'Unknown Team'
): string => {
  if (teamName) return teamName;
  if (teamId) return `Team ${teamId.substring(0, 8)}`;
  return fallback;
};

/**
 * Get player name with fallbacks
 */
export const getPlayerName = (
  playerName?: string,
  playerId?: string,
  userEmail?: string,
  fallback: string = 'Unknown Player'
): string => {
  if (playerName) return playerName;
  if (userEmail) return userEmail.split('@')[0];
  if (playerId) return `Player ${playerId.substring(0, 8)}`;
  return fallback;
};

/**
 * Format field goal statistics (made/attempts)
 */
export const formatFieldGoalStats = (made: number, attempts: number): string => {
  return `${made}/${attempts}`;
};

/**
 * Calculate field goal percentage
 */
export const calculateFieldGoalPercentage = (made: number, attempts: number): number => {
  if (attempts === 0) return 0;
  return Math.round((made / attempts) * 100);
};

/**
 * Get enhanced play description with stats
 */
export const getEnhancedPlayDescription = (
  originalDescription: string,
  statType?: string,
  modifier?: string,
  playerStats?: {
    fieldGoalMade: number;
    fieldGoalAttempts: number;
    threePointerMade: number;
    threePointerAttempts: number;
    freeThrowMade: number;
    freeThrowAttempts: number;
  }
): string => {
  if (!playerStats || !statType) {
    return originalDescription;
  }

  const action = modifier === 'made' ? 'made' : 'missed';
  
  switch (statType) {
    case 'field_goal':
      const fgStats = formatFieldGoalStats(playerStats.fieldGoalMade, playerStats.fieldGoalAttempts);
      return `${action} field goal (${fgStats} FG)`;
      
    case 'three_pointer':
      const threeStats = formatFieldGoalStats(playerStats.threePointerMade, playerStats.threePointerAttempts);
      return `${action} 3-pointer (${threeStats} 3PT)`;
      
    case 'free_throw':
      const ftStats = formatFieldGoalStats(playerStats.freeThrowMade, playerStats.freeThrowAttempts);
      return `${action} free throw (${ftStats} FT)`;
      
    default:
      return originalDescription;
  }
};

/**
 * Get scoring information for a play
 */
export const getScoringInfo = (
  statType?: string,
  modifier?: string
): { points: number; description: string } | null => {
  if (statType === 'three_pointer' && modifier === 'made') {
    return { points: 3, description: '+3 points' };
  } else if (statType === 'field_goal' && modifier === 'made') {
    return { points: 2, description: '+2 points' };
  } else if (statType === 'free_throw' && modifier === 'made') {
    return { points: 1, description: '+1 point' };
  }
  return null;
};

/**
 * Get play icon based on stat type
 */
export const getPlayIcon = (statType?: string): string => {
  switch (statType) {
    case 'three_pointer':
      return '🎯';
    case 'field_goal':
      return '🏀';
    case 'free_throw':
      return '🎯';
    case 'assist':
      return '🤝';
    case 'rebound':
      return '📥';
    case 'steal':
      return '🔥';
    case 'block':
      return '🛡️';
    case 'turnover':
      return '😤';
    case 'foul':
      return '⚠️';
    case 'substitution':
      return '🔄';
    default:
      return '🏀';
  }
};

/**
 * Sort plays by timestamp (newest first)
 */
export const sortPlaysByTimestamp = <T extends { timestamp: string; createdAt: string }>(plays: T[]): T[] => {
  return [...plays].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.timestamp).getTime();
    const timeB = new Date(b.createdAt || b.timestamp).getTime();
    return timeB - timeA; // Newest first
  });
};
