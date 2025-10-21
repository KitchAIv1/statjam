/**
 * PersonalGamesService - Raw HTTP Service for Personal Player Stat Tracking
 * 
 * APPROACH: Direct HTTP requests to Supabase REST API (following GameServiceV3 pattern)
 * - Uses same raw HTTP approach as other V3 services (reliable, fast)
 * - No Supabase client dependency
 * - Direct authentication with access tokens
 * - Player-only access with RLS enforcement
 * 
 * PURPOSE: Handles CRUD operations for personal games (pickup games, practices, scrimmages)
 * - Completely isolated from tournament/official game stats
 * - Player ownership verification
 * - Rate limiting and validation
 */

export interface PersonalGame {
  id: string;
  player_id: string;
  game_date: string; // ISO date string
  location?: string;
  opponent?: string;
  
  // Basic stats
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  
  // Shooting stats
  fg_made: number;
  fg_attempted: number;
  three_pt_made: number;
  three_pt_attempted: number;
  ft_made: number;
  ft_attempted: number;
  
  // Metadata
  is_public: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalGameInput {
  game_date: string;
  location?: string;
  opponent?: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fg_made: number;
  fg_attempted: number;
  three_pt_made: number;
  three_pt_attempted: number;
  ft_made: number;
  ft_attempted: number;
  is_public?: boolean;
  notes?: string;
}

export interface PersonalGameStats {
  // Calculated percentages
  fg_percentage: number;
  three_pt_percentage: number;
  ft_percentage: number;
  efg_percentage: number;
  
  // Game summary
  total_shots: number;
  made_shots: number;
  stat_line: string; // e.g., "24 PTS • 8 REB • 5 AST"
}

export interface PersonalGamesListResponse {
  games: (PersonalGame & { stats: PersonalGameStats })[];
  total: number;
  has_more: boolean;
}

export class PersonalGamesService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * Get access token from authServiceV2 localStorage
   */
  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Convert HTTP status codes to user-friendly error messages
   */
  private static getUserFriendlyError(status: number, errorText: string): string {
    switch (status) {
      case 401:
        return 'Session expired. Please sign in again.';
      case 403:
        return 'You can only access your own personal games.';
      case 404:
        return 'Personal game not found. It may have been deleted.';
      case 409:
        return 'This action conflicts with recent changes. Please refresh and try again.';
      case 422:
        return 'Invalid game data. Please check your stats and try again.';
      case 429:
        return 'Too many games created today. Please try again tomorrow.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again in a moment.';
      case 504:
        return 'Request timed out. Please check your connection and try again.';
      default:
        if (errorText.includes('fetch') || errorText.includes('network')) {
          return 'No internet connection. Please check your network.';
        }
        return `An error occurred (${status}). Please try again.`;
    }
  }

  /**
   * Make authenticated HTTP request to Supabase REST API with automatic token refresh
   */
  private static async makeRequest<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any,
    params: Record<string, string> = {},
    retryCount: number = 0
  ): Promise<T> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token found - user not authenticated');
    }

    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.SUPABASE_URL}/rest/v1/${endpoint}${queryString ? `?${queryString}` : ''}`;

    console.log(`🎮 PersonalGamesService: ${method} request to ${endpoint}`, { url, params });

    const requestOptions: RequestInit = {
      method,
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
      }
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);

    // Handle authentication errors with automatic token refresh
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ PersonalGamesService: HTTP ${response.status}:`, errorText);
      
      // Check if it's an authentication error and we haven't retried yet
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
        console.log('🔐 PersonalGamesService: Authentication error detected, attempting token refresh...');
        
        try {
          // Import authServiceV2 dynamically to avoid circular dependencies
          const { authServiceV2 } = await import('@/lib/services/authServiceV2');
          const session = authServiceV2.getSession();
          
          if (session.refreshToken) {
            const { data, error } = await authServiceV2.refreshToken(session.refreshToken);
            
            if (data && !error) {
              console.log('✅ PersonalGamesService: Token refreshed, retrying request...');
              // Retry the request with the new token
              return this.makeRequest(method, endpoint, body, params, retryCount + 1);
            } else {
              console.error('❌ PersonalGamesService: Token refresh failed:', error);
            }
          } else {
            console.error('❌ PersonalGamesService: No refresh token available');
          }
        } catch (refreshError) {
          console.error('❌ PersonalGamesService: Error during token refresh:', refreshError);
        }
      }
      
      // Throw user-friendly error message based on status code
      const userMessage = this.getUserFriendlyError(response.status, errorText);
      throw new Error(userMessage);
    }

    // Handle empty responses for DELETE requests
    if (method === 'DELETE' || response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    console.log(`✅ PersonalGamesService: ${method} ${endpoint} successful`);
    return data;
  }

  /**
   * Calculate shooting percentages and game stats
   */
  static calculateGameStats(game: PersonalGame): PersonalGameStats {
    const fg_percentage = game.fg_attempted > 0 ? 
      Math.round((game.fg_made / game.fg_attempted) * 1000) / 10 : 0;
    
    const three_pt_percentage = game.three_pt_attempted > 0 ? 
      Math.round((game.three_pt_made / game.three_pt_attempted) * 1000) / 10 : 0;
    
    const ft_percentage = game.ft_attempted > 0 ? 
      Math.round((game.ft_made / game.ft_attempted) * 1000) / 10 : 0;
    
    // Effective Field Goal Percentage: (FGM + 0.5 * 3PM) / FGA
    const efg_percentage = game.fg_attempted > 0 ? 
      Math.round(((game.fg_made + (0.5 * game.three_pt_made)) / game.fg_attempted) * 1000) / 10 : 0;
    
    const total_shots = game.fg_attempted + game.ft_attempted;
    const made_shots = game.fg_made + game.ft_made;
    
    // Create stat line string
    const statParts = [];
    if (game.points > 0) statParts.push(`${game.points} PTS`);
    if (game.rebounds > 0) statParts.push(`${game.rebounds} REB`);
    if (game.assists > 0) statParts.push(`${game.assists} AST`);
    if (game.steals > 0) statParts.push(`${game.steals} STL`);
    if (game.blocks > 0) statParts.push(`${game.blocks} BLK`);
    
    const stat_line = statParts.length > 0 ? statParts.join(' • ') : '0 PTS';

    return {
      fg_percentage,
      three_pt_percentage,
      ft_percentage,
      efg_percentage,
      total_shots,
      made_shots,
      stat_line
    };
  }

  /**
   * Validate personal game input data
   */
  static validateGameInput(input: PersonalGameInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Date validation
    const gameDate = new Date(input.game_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (isNaN(gameDate.getTime())) {
      errors.push('Invalid game date format');
    } else if (gameDate > today) {
      errors.push('Game date cannot be in the future');
    }

    // Shooting ratio validation
    if (input.fg_made > input.fg_attempted) {
      errors.push('Field goals made cannot exceed attempts');
    }
    if (input.three_pt_made > input.three_pt_attempted) {
      errors.push('3-pointers made cannot exceed attempts');
    }
    if (input.ft_made > input.ft_attempted) {
      errors.push('Free throws made cannot exceed attempts');
    }

    // Range validation
    if (input.points < 0 || input.points > 200) {
      errors.push('Points must be between 0 and 200');
    }
    if (input.rebounds < 0 || input.rebounds > 50) {
      errors.push('Rebounds must be between 0 and 50');
    }
    if (input.assists < 0 || input.assists > 50) {
      errors.push('Assists must be between 0 and 50');
    }
    if (input.fouls < 0 || input.fouls > 6) {
      errors.push('Fouls must be between 0 and 6');
    }

    // Shooting attempts validation
    if (input.fg_attempted < 0 || input.fg_attempted > 100) {
      errors.push('Field goal attempts must be between 0 and 100');
    }
    if (input.three_pt_attempted < 0 || input.three_pt_attempted > 50) {
      errors.push('3-point attempts must be between 0 and 50');
    }
    if (input.ft_attempted < 0 || input.ft_attempted > 50) {
      errors.push('Free throw attempts must be between 0 and 50');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new personal game
   */
  static async createPersonalGame(playerId: string, gameData: PersonalGameInput): Promise<PersonalGame> {
    // Validate input
    const validation = this.validateGameInput(gameData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check rate limit (10 games per day)
    try {
      const todayGames = await this.getPersonalGames(playerId, { 
        limit: 1, 
        date_filter: new Date().toISOString().split('T')[0] 
      });
      
      // Note: This is a simple check. The database function provides more robust rate limiting
      if (todayGames.total >= 10) {
        throw new Error('Daily limit of 10 personal games reached. Please try again tomorrow.');
      }
    } catch (error) {
      // If we can't check the limit, proceed anyway (database will enforce)
      console.warn('Could not check rate limit:', error);
    }

    const gamePayload = {
      ...gameData,
      player_id: playerId,
      is_public: gameData.is_public || false
    };

    const response = await this.makeRequest<PersonalGame[]>(
      'POST',
      'personal_games',
      gamePayload
    );

    return response[0];
  }

  /**
   * Get personal games for a player with pagination
   */
  static async getPersonalGames(
    playerId: string, 
    options: {
      limit?: number;
      offset?: number;
      date_filter?: string; // YYYY-MM-DD format
    } = {}
  ): Promise<PersonalGamesListResponse> {
    const { limit = 20, offset = 0, date_filter } = options;
    
    const params: Record<string, string> = {
      'player_id': `eq.${playerId}`,
      'order': 'created_at.desc',
      'limit': limit.toString(),
      'offset': offset.toString()
    };

    if (date_filter) {
      params['game_date'] = `eq.${date_filter}`;
    }

    const games = await this.makeRequest<PersonalGame[]>('GET', 'personal_games', undefined, params);
    
    // Calculate stats for each game
    const gamesWithStats = games.map(game => ({
      ...game,
      stats: this.calculateGameStats(game)
    }));

    // Get total count (simplified - in production, use a separate count query)
    const total = games.length < limit ? offset + games.length : offset + games.length + 1;
    const has_more = games.length === limit;

    return {
      games: gamesWithStats,
      total,
      has_more
    };
  }

  /**
   * Get a single personal game by ID
   */
  static async getPersonalGame(gameId: string): Promise<PersonalGame & { stats: PersonalGameStats }> {
    const params = {
      'id': `eq.${gameId}`
    };

    const response = await this.makeRequest<PersonalGame[]>('GET', 'personal_games', undefined, params);
    
    if (!response || response.length === 0) {
      throw new Error('Personal game not found');
    }

    const game = response[0];
    return {
      ...game,
      stats: this.calculateGameStats(game)
    };
  }

  /**
   * Update a personal game
   */
  static async updatePersonalGame(gameId: string, updates: Partial<PersonalGameInput>): Promise<PersonalGame> {
    // If updating stats, validate the input
    if (Object.keys(updates).some(key => ['points', 'rebounds', 'assists', 'fg_made', 'fg_attempted'].includes(key))) {
      // Get current game to merge with updates for validation
      const currentGame = await this.getPersonalGame(gameId);
      const updatedData = { ...currentGame, ...updates } as PersonalGameInput;
      
      const validation = this.validateGameInput(updatedData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const params = {
      'id': `eq.${gameId}`
    };

    const response = await this.makeRequest<PersonalGame[]>(
      'PATCH',
      'personal_games',
      updates,
      params
    );

    return response[0];
  }

  /**
   * Delete a personal game
   */
  static async deletePersonalGame(gameId: string): Promise<void> {
    const params = {
      'id': `eq.${gameId}`
    };

    await this.makeRequest<void>('DELETE', 'personal_games', undefined, params);
  }

  /**
   * Get player's personal game statistics summary
   */
  static async getPlayerStats(playerId: string): Promise<any> {
    const params = {
      'player_id': `eq.${playerId}`
    };

    const response = await this.makeRequest<any[]>('GET', 'player_personal_stats', undefined, params);
    
    return response.length > 0 ? response[0] : null;
  }
}
