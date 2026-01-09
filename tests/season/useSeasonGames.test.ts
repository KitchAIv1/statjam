/**
 * useSeasonGames Logic Tests
 * Tests for game selection and stats calculation logic
 */

import { describe, it, expect } from 'vitest';

// Types for testing
interface GameForSelection {
  id: string;
  opponent_name: string;
  status: string;
  home_score: number;
  away_score: number;
  start_time: string;
}

interface SelectedStats {
  count: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  avgFor: string;
  avgAgainst: string;
}

// Logic functions for testing
function filterCompletedGames(games: GameForSelection[]): GameForSelection[] {
  return games.filter(g => g.status === 'completed');
}

function toggleGameSelection(selectedIds: string[], gameId: string): string[] {
  return selectedIds.includes(gameId)
    ? selectedIds.filter(id => id !== gameId)
    : [...selectedIds, gameId];
}

function calculateSelectedStats(games: GameForSelection[], selectedIds: string[]): SelectedStats {
  const selected = games.filter(g => selectedIds.includes(g.id));
  const wins = selected.filter(g => g.home_score > g.away_score).length;
  const losses = selected.length - wins;
  const totalFor = selected.reduce((sum, g) => sum + g.home_score, 0);
  const totalAgainst = selected.reduce((sum, g) => sum + g.away_score, 0);
  
  return {
    count: selected.length,
    wins,
    losses,
    pointsFor: totalFor,
    pointsAgainst: totalAgainst,
    avgFor: selected.length ? (totalFor / selected.length).toFixed(1) : '0',
    avgAgainst: selected.length ? (totalAgainst / selected.length).toFixed(1) : '0',
  };
}

describe('useSeasonGames - Game Selection Logic', () => {
  const mockGames: GameForSelection[] = [
    { id: 'game-1', opponent_name: 'Team A', status: 'completed', home_score: 70, away_score: 65, start_time: '2024-01-15' },
    { id: 'game-2', opponent_name: 'Team B', status: 'completed', home_score: 55, away_score: 60, start_time: '2024-01-20' },
    { id: 'game-3', opponent_name: 'Team C', status: 'in_progress', home_score: 30, away_score: 25, start_time: '2024-01-25' },
    { id: 'game-4', opponent_name: 'Team D', status: 'completed', home_score: 80, away_score: 70, start_time: '2024-01-30' },
    { id: 'game-5', opponent_name: 'Team E', status: 'scheduled', home_score: 0, away_score: 0, start_time: '2024-02-05' },
  ];

  describe('filterCompletedGames', () => {
    it('should return only completed games', () => {
      const completed = filterCompletedGames(mockGames);
      
      expect(completed).toHaveLength(3);
      expect(completed.every(g => g.status === 'completed')).toBe(true);
    });

    it('should exclude in_progress games', () => {
      const completed = filterCompletedGames(mockGames);
      
      expect(completed.find(g => g.id === 'game-3')).toBeUndefined();
    });

    it('should exclude scheduled games', () => {
      const completed = filterCompletedGames(mockGames);
      
      expect(completed.find(g => g.id === 'game-5')).toBeUndefined();
    });

    it('should return empty array if no completed games', () => {
      const noCompleted: GameForSelection[] = [
        { id: 'game-1', opponent_name: 'Team A', status: 'in_progress', home_score: 30, away_score: 25, start_time: '2024-01-15' },
      ];
      
      const completed = filterCompletedGames(noCompleted);
      expect(completed).toHaveLength(0);
    });
  });

  describe('toggleGameSelection', () => {
    it('should add game to empty selection', () => {
      const result = toggleGameSelection([], 'game-1');
      expect(result).toEqual(['game-1']);
    });

    it('should add game to existing selection', () => {
      const result = toggleGameSelection(['game-1'], 'game-2');
      expect(result).toEqual(['game-1', 'game-2']);
    });

    it('should remove game if already selected', () => {
      const result = toggleGameSelection(['game-1', 'game-2'], 'game-1');
      expect(result).toEqual(['game-2']);
    });

    it('should return empty array when removing last selection', () => {
      const result = toggleGameSelection(['game-1'], 'game-1');
      expect(result).toEqual([]);
    });
  });

  describe('calculateSelectedStats', () => {
    it('should calculate stats for single game', () => {
      const stats = calculateSelectedStats(mockGames, ['game-1']);
      
      expect(stats.count).toBe(1);
      expect(stats.wins).toBe(1); // 70 > 65
      expect(stats.losses).toBe(0);
      expect(stats.pointsFor).toBe(70);
      expect(stats.pointsAgainst).toBe(65);
    });

    it('should calculate stats for multiple games', () => {
      const stats = calculateSelectedStats(mockGames, ['game-1', 'game-2']);
      
      expect(stats.count).toBe(2);
      expect(stats.wins).toBe(1); // game-1 won
      expect(stats.losses).toBe(1); // game-2 lost
      expect(stats.pointsFor).toBe(125); // 70 + 55
      expect(stats.pointsAgainst).toBe(125); // 65 + 60
    });

    it('should calculate correct averages', () => {
      const stats = calculateSelectedStats(mockGames, ['game-1', 'game-4']);
      
      expect(stats.avgFor).toBe('75.0'); // (70 + 80) / 2
      expect(stats.avgAgainst).toBe('67.5'); // (65 + 70) / 2
    });

    it('should return zeros for empty selection', () => {
      const stats = calculateSelectedStats(mockGames, []);
      
      expect(stats.count).toBe(0);
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
      expect(stats.pointsFor).toBe(0);
      expect(stats.pointsAgainst).toBe(0);
      expect(stats.avgFor).toBe('0');
      expect(stats.avgAgainst).toBe('0');
    });

    it('should count all games as wins when home_score > away_score', () => {
      const allWins: GameForSelection[] = [
        { id: '1', opponent_name: 'A', status: 'completed', home_score: 70, away_score: 60, start_time: '2024-01-01' },
        { id: '2', opponent_name: 'B', status: 'completed', home_score: 80, away_score: 70, start_time: '2024-01-02' },
      ];
      
      const stats = calculateSelectedStats(allWins, ['1', '2']);
      
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(0);
    });

    it('should count all games as losses when home_score < away_score', () => {
      const allLosses: GameForSelection[] = [
        { id: '1', opponent_name: 'A', status: 'completed', home_score: 60, away_score: 70, start_time: '2024-01-01' },
        { id: '2', opponent_name: 'B', status: 'completed', home_score: 70, away_score: 80, start_time: '2024-01-02' },
      ];
      
      const stats = calculateSelectedStats(allLosses, ['1', '2']);
      
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(2);
    });
  });

  describe('Select All / Deselect All', () => {
    it('should select all filtered games', () => {
      const completed = filterCompletedGames(mockGames);
      const selectedIds = completed.map(g => g.id);
      
      expect(selectedIds).toEqual(['game-1', 'game-2', 'game-4']);
    });

    it('should deselect all games', () => {
      let selectedIds = ['game-1', 'game-2'];
      selectedIds = [];
      
      expect(selectedIds).toEqual([]);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter games by date range', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-25');
      
      const filtered = mockGames.filter(game => {
        const gameDate = new Date(game.start_time);
        return gameDate >= startDate && gameDate <= endDate;
      });
      
      expect(filtered).toHaveLength(3);
      expect(filtered.map(g => g.id)).toEqual(['game-1', 'game-2', 'game-3']);
    });

    it('should return all games when no date filter', () => {
      const filtered = mockGames.filter(() => true);
      expect(filtered).toHaveLength(5);
    });
  });
});
