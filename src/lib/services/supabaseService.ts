/**
 * Enterprise Supabase Service Layer
 * 
 * This service provides a clean abstraction over Supabase operations,
 * using raw HTTP requests due to Supabase JS client library incompatibility
 * in this environment.
 * 
 * Features:
 * - Enterprise-grade error handling
 * - Automatic retries
 * - Type safety
 * - Consistent API
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface QueryOptions {
  timeout?: number;
  retries?: number;
}

class SupabaseService {
  private config: SupabaseConfig;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.config = { url, anonKey };
  }

  private getHeaders() {
    return {
      'apikey': this.config.anonKey,
      'Authorization': `Bearer ${this.config.anonKey}`,
      'Content-Type': 'application/json'
    };
  }

  private async executeQuery<T>(
    endpoint: string, 
    options: QueryOptions = {}
  ): Promise<T> {
    const { timeout = 10000, retries = 2 } = options;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(
          `${this.config.url}/rest/v1/${endpoint}`,
          {
            method: 'GET',
            headers: this.getHeaders(),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error: any) {
        if (attempt === retries) {
          throw new Error(`Supabase query failed after ${retries + 1} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    throw new Error('Query failed');
  }

  /**
   * Get live games with related data
   */
  async getLiveGames(): Promise<any[]> {
    const games = await this.executeQuery<any[]>(
      'games?select=*&or=(status.eq.live,status.eq.LIVE,status.eq.in_progress,status.eq.IN_PROGRESS,status.eq.overtime,status.eq.OVERTIME,is_clock_running.eq.true)&order=updated_at.desc&limit=24'
    );

    if (!games.length) return [];

    // Get related data
    const teamIds = [...new Set(games.flatMap(g => [g.team_a_id, g.team_b_id]))].filter(Boolean);
    const tournamentIds = [...new Set(games.map(g => g.tournament_id))].filter(Boolean);

    const [teams, tournaments] = await Promise.all([
      teamIds.length > 0 ? this.executeQuery<any[]>(`teams?select=id,name&id=in.(${teamIds.join(',')})`) : [],
      tournamentIds.length > 0 ? this.executeQuery<any[]>(`tournaments?select=id,name,organizer_id,organizer_name&id=in.(${tournamentIds.join(',')})`) : []
    ]);

    // Create lookup maps
    const teamsMap = new Map(teams.map(t => [t.id, t.name]));
    const tournamentsMap = new Map(tournaments.map(t => [t.id, { name: t.name, organizer_id: t.organizer_id, organizer_name: t.organizer_name }]));

    // Enrich games with related data
    return games.map(game => ({
      ...game,
      team_a_name: teamsMap.get(game.team_a_id),
      team_b_name: teamsMap.get(game.team_b_id),
      tournament_name: tournamentsMap.get(game.tournament_id)?.name,
      organizerId: tournamentsMap.get(game.tournament_id)?.organizer_id,
      organizerName: tournamentsMap.get(game.tournament_id)?.organizer_name,
    }));
  }

  /**
   * Get a specific game with related data
   */
  async getGame(gameId: string): Promise<any | null> {
    const games = await this.executeQuery<any[]>(`games?select=*&id=eq.${gameId}`);
    return games[0] || null;
  }

  /**
   * Authentication operations using raw HTTP
   */
  async signIn(email: string, password: string): Promise<any> {
    const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': this.config.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Authentication failed');
    }

    return response.json();
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
