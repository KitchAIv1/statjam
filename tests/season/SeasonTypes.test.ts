/**
 * Season Types Tests
 * Type validation and structure tests
 */

import { describe, it, expect } from 'vitest';
import type { 
  Season, 
  SeasonGame, 
  SeasonCreateRequest, 
  SeasonFormState,
  SeasonType,
  SeasonStatus 
} from '@/lib/types/season';

describe('Season Types', () => {
  describe('SeasonType', () => {
    it('should allow valid season types', () => {
      const validTypes: SeasonType[] = ['regular', 'playoffs', 'preseason', 'summer', 'tournament'];
      
      validTypes.forEach(type => {
        const request: Partial<SeasonCreateRequest> = {
          season_type: type,
        };
        expect(request.season_type).toBe(type);
      });
    });
  });

  describe('SeasonStatus', () => {
    it('should allow valid statuses', () => {
      const validStatuses: SeasonStatus[] = ['draft', 'active', 'completed'];
      
      validStatuses.forEach(status => {
        const season: Partial<Season> = {
          status,
        };
        expect(season.status).toBe(status);
      });
    });
  });

  describe('Season', () => {
    it('should have all required fields', () => {
      const season: Season = {
        id: 'season-123',
        coach_id: 'coach-456',
        team_id: 'team-789',
        name: 'Winter 2024',
        season_type: 'regular',
        status: 'active',
        is_public: false,
        total_games: 10,
        wins: 7,
        losses: 3,
        points_for: 700,
        points_against: 650,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(season.id).toBeDefined();
      expect(season.coach_id).toBeDefined();
      expect(season.team_id).toBeDefined();
      expect(season.name).toBeDefined();
      expect(season.status).toBeDefined();
    });

    it('should allow optional fields', () => {
      const season: Season = {
        id: 'season-123',
        coach_id: 'coach-456',
        team_id: 'team-789',
        name: 'Winter 2024',
        description: 'Our best season yet',
        logo: 'https://example.com/logo.png',
        league_name: 'Youth Basketball League',
        season_type: 'regular',
        season_year: '2024-25',
        conference: 'East',
        home_venue: 'Main Gym',
        primary_color: '#FF6B00',
        secondary_color: '#1A1A1A',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        status: 'active',
        is_public: true,
        total_games: 0,
        wins: 0,
        losses: 0,
        points_for: 0,
        points_against: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(season.description).toBe('Our best season yet');
      expect(season.league_name).toBe('Youth Basketball League');
      expect(season.primary_color).toBe('#FF6B00');
    });
  });

  describe('SeasonGame', () => {
    it('should link season to game', () => {
      const seasonGame: SeasonGame = {
        id: 'sg-123',
        season_id: 'season-456',
        game_id: 'game-789',
        is_home_game: true,
        added_at: '2024-01-01T00:00:00Z',
      };

      expect(seasonGame.season_id).toBeDefined();
      expect(seasonGame.game_id).toBeDefined();
      expect(seasonGame.is_home_game).toBe(true);
    });

    it('should allow optional game_notes', () => {
      const seasonGame: SeasonGame = {
        id: 'sg-123',
        season_id: 'season-456',
        game_id: 'game-789',
        is_home_game: false,
        game_notes: 'Tournament semifinal',
        added_at: '2024-01-01T00:00:00Z',
      };

      expect(seasonGame.game_notes).toBe('Tournament semifinal');
    });
  });

  describe('SeasonCreateRequest', () => {
    it('should have minimum required fields', () => {
      const request: SeasonCreateRequest = {
        name: 'Winter 2024',
        team_id: 'team-123',
        season_type: 'regular',
        is_public: false,
        game_ids: [],
      };

      expect(request.name).toBeDefined();
      expect(request.team_id).toBeDefined();
      expect(request.game_ids).toBeDefined();
    });

    it('should accept game_ids array', () => {
      const request: SeasonCreateRequest = {
        name: 'Winter 2024',
        team_id: 'team-123',
        season_type: 'regular',
        is_public: false,
        game_ids: ['game-1', 'game-2', 'game-3'],
      };

      expect(request.game_ids).toHaveLength(3);
    });
  });

  describe('SeasonFormState', () => {
    it('should track form state correctly', () => {
      const state: SeasonFormState = {
        data: {
          name: 'Winter 2024',
          team_id: 'team-123',
          season_type: 'regular',
          is_public: false,
          game_ids: [],
        },
        errors: {},
        loading: false,
        currentStep: 1,
      };

      expect(state.currentStep).toBe(1);
      expect(state.loading).toBe(false);
      expect(state.errors).toEqual({});
    });

    it('should allow partial data', () => {
      const state: SeasonFormState = {
        data: {
          name: 'Partial Season',
        },
        errors: { name: 'Name too short' },
        loading: true,
        currentStep: 2,
      };

      expect(state.data.name).toBe('Partial Season');
      expect(state.errors.name).toBe('Name too short');
    });
  });
});

