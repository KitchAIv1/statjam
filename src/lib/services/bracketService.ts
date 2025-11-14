/**
 * Bracket Service
 * 
 * Calculates bracket structure from games without modifying database.
 * Single responsibility: Derive bracket structure from existing games.
 */

import { Game } from '@/lib/types/game';
import { Team } from '@/lib/types/tournament';

// ============================================================================
// TYPES
// ============================================================================

export interface BracketMatch {
  gameId: string;
  game: Game | null; // Null for empty slots (future rounds)
  teamA: Team | null;
  teamB: Team | null;
  roundNumber: number;
  roundName: string;
  matchNumber: number;
  position: number; // Position in bracket (for determining next round matchup)
  winnerId: string | null;
  parentMatchA?: number; // Position of match that feeds into this (team A) - legacy, use parentRoundA/parentMatchAIdx
  parentMatchB?: number; // Position of match that feeds into this (team B) - legacy, use parentRoundB/parentMatchBIdx
  parentRoundA?: number; // Round number of parent match A
  parentMatchAIdx?: number; // Match number (1-indexed) of parent match A
  parentRoundB?: number; // Round number of parent match B
  parentMatchBIdx?: number; // Match number (1-indexed) of parent match B
}

export interface BracketRound {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
  isActive: boolean; // Current round being played
  isComplete: boolean; // All matches in round completed
}

export interface BracketStructure {
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  rounds: BracketRound[];
  totalRounds: number;
  currentRound: number;
  totalTeams: number;
  division?: string; // If bracket is for a specific division
  isChampionship: boolean; // If this is championship bracket (all divisions)
}

export interface SeedingOption {
  method: 'manual' | 'tournament_record' | 'historical_record' | 'random';
  teams: { teamId: string; seed: number }[];
}

// ============================================================================
// SERVICE
// ============================================================================

export class BracketService {
  /**
   * Calculate bracket structure from games
   */
  static calculateBracket(params: {
    games: Game[];
    teams: Team[];
    tournamentType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
    division?: string; // Optional: filter by division. If undefined and tournament has divisions, show championship (cross-division) games only
    isChampionship?: boolean; // Explicitly mark as championship bracket
  }): BracketStructure {
    const { games, teams, tournamentType, division, isChampionship } = params;

    // Determine if tournament has divisions
    const hasDivisions = teams.some(t => t.division && t.division !== '');

    // Filter games by division or championship phase
    let filteredGames: Game[];
    if (division) {
      // Specific division: show games where BOTH teams are in this division (intra-division games only)
      filteredGames = games.filter(game => {
        const teamA = teams.find(t => t.id === game.team_a_id);
        const teamB = teams.find(t => t.id === game.team_b_id);
        // Both teams must be in the same division
        return teamA?.division === division && teamB?.division === division;
      });
    } else if (hasDivisions && isChampionship) {
      // Championship bracket: only show cross-division games (teams from different divisions)
      filteredGames = games.filter(game => {
        const teamA = teams.find(t => t.id === game.team_a_id);
        const teamB = teams.find(t => t.id === game.team_b_id);
        // Championship games: teams from different divisions
        // OR at least one team has no division (unassigned teams can play in championship)
        return (teamA?.division && teamB?.division && teamA.division !== teamB.division) ||
               (teamA?.division && !teamB?.division) ||
               (!teamA?.division && teamB?.division);
      });
    } else {
      // No divisions or single bracket: show all games
      filteredGames = games;
    }

    // Filter teams by division if specified
    let filteredTeams: Team[];
    if (division) {
      filteredTeams = teams.filter(t => t.division === division);
    } else if (hasDivisions && isChampionship) {
      // Championship: include all teams (they'll be filtered by games)
      filteredTeams = teams;
    } else {
      filteredTeams = teams;
    }

    switch (tournamentType) {
      case 'single_elimination':
        return this.calculateSingleEliminationBracket(filteredGames, filteredTeams, division, isChampionship);
      case 'double_elimination':
        return this.calculateDoubleEliminationBracket(filteredGames, filteredTeams, division);
      case 'round_robin':
        return this.calculateRoundRobinBracket(filteredGames, filteredTeams, division);
      case 'swiss':
        return this.calculateSwissBracket(filteredGames, filteredTeams, division);
      default:
        return this.calculateSingleEliminationBracket(filteredGames, filteredTeams, division, isChampionship);
    }
  }

  /**
   * Calculate single elimination bracket structure
   */
  private static calculateSingleEliminationBracket(
    games: Game[],
    teams: Team[],
    division?: string,
    isChampionship?: boolean
  ): BracketStructure {
    // Sort games by start time to determine round order
    const sortedGames = [...games].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Group games into rounds based on timing and progression
    const rounds = this.groupGamesIntoRounds(sortedGames, teams);

    // Determine current round (first incomplete round)
    const currentRound = rounds.findIndex(r => !r.isComplete) + 1 || rounds.length;

    return {
      type: 'single_elimination',
      rounds,
      totalRounds: rounds.length,
      currentRound,
      totalTeams: teams.length,
      division,
      isChampionship: isChampionship ?? (!division && teams.some(t => t.division && t.division !== '')),
    };
  }

  /**
   * Group games into rounds for single elimination
   * Creates rounds with actual games + empty slots for future rounds
   */
  private static groupGamesIntoRounds(games: Game[], teams: Team[]): BracketRound[] {
    if (games.length === 0) {
      return [];
    }

    // Calculate expected rounds based on team count
    const totalTeams = teams.length;
    const expectedRounds = Math.ceil(Math.log2(totalTeams));
    const gamesPerRound = this.calculateGamesPerRound(totalTeams);
    
    // Group games by round (infer from game order and dates)
    const rounds: BracketRound[] = [];
    let gameIndex = 0;
    
    for (let roundNum = 1; roundNum <= expectedRounds; roundNum++) {
      const matchesInRound = gamesPerRound[roundNum - 1] || 0;
      const roundGames = games.slice(gameIndex, gameIndex + matchesInRound);
      
      // Only create round if it has games OR if it's a future round (to show empty slots)
      const roundName = this.getRoundName(roundNum, expectedRounds, matchesInRound);
      
      const matches: BracketMatch[] = [];
      
      // Add actual games for this round
      roundGames.forEach((game, idx) => {
        const teamA = teams.find(t => t.id === game.team_a_id) || null;
        const teamB = teams.find(t => t.id === game.team_b_id) || null;
        
        // Determine winner
        let winnerId: string | null = null;
        if (game.status === 'completed') {
          if (game.home_score > game.away_score) {
            winnerId = game.team_a_id;
          } else if (game.away_score > game.home_score) {
            winnerId = game.team_b_id;
          }
        }

        // Calculate position in bracket (for determining next round matchup)
        const position = gameIndex + idx + 1;

        matches.push({
          gameId: game.id,
          game,
          teamA,
          teamB,
          roundNumber: roundNum,
          roundName,
          matchNumber: idx + 1,
          position,
          winnerId,
        });
      });
      
      // Add empty slots for future rounds (if no games exist yet)
      // Always create empty slots for rounds that don't have games yet
      if (roundGames.length === 0 && matchesInRound > 0) {
        // Create empty match slots for this round
        for (let matchIdx = 0; matchIdx < matchesInRound; matchIdx++) {
          matches.push({
            gameId: `empty-${roundNum}-${matchIdx + 1}`,
            game: null as any, // Empty slot (no game created yet)
            teamA: null, // Will be auto-populated after rounds are linked
            teamB: null, // Will be auto-populated after rounds are linked
            roundNumber: roundNum,
            roundName,
            matchNumber: matchIdx + 1,
            position: gameIndex + matchIdx + 1,
            winnerId: null,
          });
        }
      }

      // Determine round status
      const hasGames = matches.some(m => m.game !== null);
      const isComplete = hasGames && matches.every(m => 
        m.game === null || (m.game !== null && m.game.status === 'completed')
      );
      const isActive = hasGames && !isComplete && matches.some(m => 
        m.game !== null && (m.game.status === 'in_progress' || m.game.status === 'scheduled')
      );

      // Only add round if it has matches (either games or empty slots)
      if (matches.length > 0) {
        rounds.push({
          roundNumber: roundNum,
          roundName,
          matches,
          isActive,
          isComplete,
        });
      }

      gameIndex += matchesInRound;
    }

    // Link matches to next round (determine parent matches)
    this.linkMatchesToNextRound(rounds);

    // Auto-populate empty slots with winners from previous rounds
    this.autoPopulateEmptySlots(rounds, games, teams);

    return rounds;
  }

  /**
   * Auto-populate empty slots with winners from completed parent matches
   */
  private static autoPopulateEmptySlots(
    rounds: BracketRound[],
    games: Game[],
    teams: Team[]
  ): void {
    for (let i = 1; i < rounds.length; i++) {
      const currentRound = rounds[i];
      const prevRound = rounds[i - 1];

      currentRound.matches.forEach((match, matchIdx) => {
        // Only process empty slots (no game)
        if (match.game !== null) return;

        // Get parent matches for this slot
        const matchesPerNextMatch = prevRound.matches.length / currentRound.matches.length;
        const startIdx = matchIdx * matchesPerNextMatch;
        const parentMatchA = prevRound.matches[startIdx];
        const parentMatchB = prevRound.matches[startIdx + 1];

        // Auto-populate teamA from parent match A winner
        if (parentMatchA?.winnerId) {
          const winnerGame = games.find(g => g.id === parentMatchA.gameId);
          if (winnerGame && winnerGame.status === 'completed') {
            match.teamA = teams.find(t => t.id === parentMatchA.winnerId) || null;
          }
        }

        // Auto-populate teamB from parent match B winner
        if (parentMatchB?.winnerId) {
          const winnerGame = games.find(g => g.id === parentMatchB.gameId);
          if (winnerGame && winnerGame.status === 'completed') {
            match.teamB = teams.find(t => t.id === parentMatchB.winnerId) || null;
          }
        }
      });
    }
  }

  /**
   * Calculate number of games per round
   */
  private static calculateGamesPerRound(totalTeams: number): number[] {
    const rounds: number[] = [];
    let remainingTeams = totalTeams;
    
    while (remainingTeams > 1) {
      const gamesInRound = Math.floor(remainingTeams / 2);
      rounds.push(gamesInRound);
      remainingTeams = gamesInRound;
    }
    
    return rounds;
  }

  /**
   * Get round name based on number of games in the round
   * Names based on games per round, not round position
   */
  static getRoundName(roundNumber: number, totalRounds: number, gamesInRound: number): string {
    // Final round (1 game) is always "Final"
    if (gamesInRound === 1 && roundNumber === totalRounds) {
      return 'Final';
    }
    
    // Semifinals (2 games)
    if (gamesInRound === 2) {
      return 'Semifinals';
    }
    
    // Quarterfinals (4 games)
    if (gamesInRound === 4) {
      return 'Quarterfinals';
    }
    
    // Round of 8 (8 games)
    if (gamesInRound === 8) {
      return 'Round of 8';
    }
    
    // Round of 16 (16 games)
    if (gamesInRound === 16) {
      return 'Round of 16';
    }
    
    // Round of 32 (32 games)
    if (gamesInRound === 32) {
      return 'Round of 32';
    }
    
    // For other cases (like 3 games, 5 games, etc.), use "Round N"
    return `Round ${roundNumber}`;
  }

  /**
   * Get parent matches for a specific slot in a round (for auto-progression)
   */
  private static getParentMatchesForSlot(
    roundNum: number,
    matchIdx: number,
    rounds: BracketRound[]
  ): { matchA: BracketMatch | null; matchB: BracketMatch | null } {
    if (roundNum === 1) {
      return { matchA: null, matchB: null };
    }

    const prevRound = rounds.find(r => r.roundNumber === roundNum - 1);
    if (!prevRound) {
      return { matchA: null, matchB: null };
    }

    const matchesPerNextMatch = prevRound.matches.length / (rounds.find(r => r.roundNumber === roundNum)?.matches.length || 1);
    const startIdx = matchIdx * matchesPerNextMatch;

    return {
      matchA: prevRound.matches[startIdx] || null,
      matchB: prevRound.matches[startIdx + 1] || null,
    };
  }

  /**
   * Auto-populate empty slots with winners from previous round
   */
  private static autoPopulateFromWinners(
    parentMatches: { matchA: BracketMatch | null; matchB: BracketMatch | null },
    games: Game[],
    teams: Team[]
  ): { teamA: Team | null; teamB: Team | null } {
    let teamA: Team | null = null;
    let teamB: Team | null = null;

    // Get winner from parent match A
    if (parentMatches.matchA?.winnerId) {
      const winnerGame = games.find(g => g.id === parentMatches.matchA!.gameId);
      if (winnerGame && winnerGame.status === 'completed') {
        teamA = teams.find(t => t.id === parentMatches.matchA!.winnerId) || null;
      }
    }

    // Get winner from parent match B
    if (parentMatches.matchB?.winnerId) {
      const winnerGame = games.find(g => g.id === parentMatches.matchB!.gameId);
      if (winnerGame && winnerGame.status === 'completed') {
        teamB = teams.find(t => t.id === parentMatches.matchB!.winnerId) || null;
      }
    }

    return { teamA, teamB };
  }

  /**
   * Link matches to next round (determine which matches feed into which)
   */
  private static linkMatchesToNextRound(rounds: BracketRound[]): void {
    for (let i = 0; i < rounds.length - 1; i++) {
      const currentRound = rounds[i];
      const nextRound = rounds[i + 1];
      
      // For each match in next round, determine which matches feed into it
      nextRound.matches.forEach((nextMatch, nextIdx) => {
        // In single elimination, match positions follow pattern:
        // Round 1: positions 1-4 feed into Round 2: positions 1-2
        // Match 1 of next round gets winners from matches 1-2 of current round
        const matchesPerNextMatch = currentRound.matches.length / nextRound.matches.length;
        const startIdx = nextIdx * matchesPerNextMatch;
        
        if (currentRound.matches[startIdx]) {
          const parentMatchA = currentRound.matches[startIdx];
          nextMatch.parentMatchA = parentMatchA.position; // Legacy
          nextMatch.parentRoundA = parentMatchA.roundNumber;
          nextMatch.parentMatchAIdx = parentMatchA.matchNumber;
        }
        if (currentRound.matches[startIdx + 1]) {
          const parentMatchB = currentRound.matches[startIdx + 1];
          nextMatch.parentMatchB = parentMatchB.position; // Legacy
          nextMatch.parentRoundB = parentMatchB.roundNumber;
          nextMatch.parentMatchBIdx = parentMatchB.matchNumber;
        }
      });
    }
  }

  /**
   * Calculate double elimination bracket (simplified - uses single elim for now)
   */
  private static calculateDoubleEliminationBracket(
    games: Game[],
    teams: Team[],
    division?: string
  ): BracketStructure {
    // TODO: Implement full double elimination logic
    // For now, use single elimination structure
    return this.calculateSingleEliminationBracket(games, teams, division);
  }

  /**
   * Calculate round robin bracket
   */
  private static calculateRoundRobinBracket(
    games: Game[],
    teams: Team[],
    division?: string
  ): BracketStructure {
    // Round robin doesn't have traditional rounds - all teams play each other
    // Group by date or create a single "round" with all matches
    const sortedGames = [...games].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const matches: BracketMatch[] = sortedGames.map((game, idx) => {
      const teamA = teams.find(t => t.id === game.team_a_id) || null;
      const teamB = teams.find(t => t.id === game.team_b_id) || null;
      
      let winnerId: string | null = null;
      if (game.status === 'completed') {
        if (game.home_score > game.away_score) {
          winnerId = game.team_a_id;
        } else if (game.away_score > game.home_score) {
          winnerId = game.team_b_id;
        }
      }

      return {
        gameId: game.id,
        game,
        teamA,
        teamB,
        roundNumber: 1,
        roundName: 'Round Robin',
        matchNumber: idx + 1,
        position: idx + 1,
        winnerId,
      };
    });

    const isComplete = matches.every(m => m.game !== null && m.game.status === 'completed');
    const isActive = !isComplete && matches.some(m => 
      m.game !== null && (m.game.status === 'in_progress' || m.game.status === 'scheduled')
    );

    return {
      type: 'round_robin',
      rounds: [{
        roundNumber: 1,
        roundName: 'Round Robin',
        matches,
        isActive,
        isComplete,
      }],
      totalRounds: 1,
      currentRound: 1,
      totalTeams: teams.length,
      division,
      isChampionship: !division,
    };
  }

  /**
   * Calculate Swiss bracket (simplified - uses round robin for now)
   */
  private static calculateSwissBracket(
    games: Game[],
    teams: Team[],
    division?: string
  ): BracketStructure {
    // TODO: Implement Swiss system logic
    // For now, use round robin structure
    return this.calculateRoundRobinBracket(games, teams, division);
  }

  /**
   * Calculate seeding for teams
   * Returns teams ordered by seed (1 = best, higher = worse)
   */
  static calculateSeeding(params: {
    teams: Team[];
    method: 'manual' | 'tournament_record' | 'historical_record' | 'random';
    manualSeeds?: { teamId: string; seed: number }[]; // For manual seeding
  }): { teamId: string; seed: number; basis: string }[] {
    const { teams, method, manualSeeds } = params;

    if (method === 'manual' && manualSeeds) {
      // Use manual seeds provided
      return manualSeeds.map(ms => ({
        teamId: ms.teamId,
        seed: ms.seed,
        basis: 'Manual',
      }));
    }

    if (method === 'tournament_record') {
      // Seed by tournament wins/losses
      return teams
        .map(team => ({
          teamId: team.id,
          seed: 0, // Will calculate
          wins: team.wins || 0,
          losses: team.losses || 0,
          winRate: team.wins + team.losses > 0 
            ? team.wins / (team.wins + team.losses) 
            : 0,
        }))
        .sort((a, b) => {
          // Sort by win rate, then wins
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.wins - a.wins;
        })
        .map((team, idx) => ({
          teamId: team.teamId,
          seed: idx + 1,
          basis: `Tournament Record (${team.wins}-${team.losses})`,
        }));
    }

    if (method === 'historical_record') {
      // Seed by historical performance (if available)
      // For now, use tournament record as fallback
      return this.calculateSeeding({ teams, method: 'tournament_record' });
    }

    // Random seeding
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    return shuffled.map((team, idx) => ({
      teamId: team.id,
      seed: idx + 1,
      basis: 'Random',
    }));
  }

  /**
   * Apply seeding to bracket generation
   * Places teams in bracket positions based on seeds
   */
  static applySeedingToBracket(
    teams: Team[],
    seeds: { teamId: string; seed: number }[]
  ): Team[] {
    // Sort teams by seed
    const seededTeams = teams
      .map(team => {
        const seed = seeds.find(s => s.teamId === team.id);
        return {
          team,
          seed: seed?.seed || teams.length + 1, // Unseeded teams go to end
        };
      })
      .sort((a, b) => a.seed - b.seed)
      .map(item => item.team);

    return seededTeams;
  }
}

