/**
 * Role Configuration
 * Static data for user role options during signup
 * Separated from UI per .cursorrules
 */

export type UserRole = 'player' | 'organizer' | 'stat_admin' | 'coach';

export interface RoleOption {
  value: UserRole;
  label: string;
  icon: string;
  tagline: string;
  clarification?: string;
}

/**
 * Role options displayed during signup
 * Ordered by most common selection
 */
export const ROLE_OPTIONS: RoleOption[] = [
  { 
    value: 'player', 
    label: 'Player', 
    icon: '🏀',
    tagline: 'View your stats, highlights & awards'
  },
  { 
    value: 'organizer', 
    label: 'Organizer', 
    icon: '🏆',
    tagline: 'Run tournaments, live stream & video'
  },
  { 
    value: 'stat_admin', 
    label: 'Stat Keeper', 
    icon: '📊',
    tagline: 'Track games for tournament organizers',
    clarification: 'For stat pros, not players'
  },
  { 
    value: 'coach', 
    label: 'Coach', 
    icon: '👨‍🏫',
    tagline: 'Track your team, video & analytics'
  }
];

/**
 * Inline confirmation message for stat_admin selection
 */
export const STAT_KEEPER_CONFIRMATION = {
  message: 'Stat Keepers track games for organizers.',
  switchPrompt: 'Looking for your own stats?',
  switchLabel: 'Choose Player instead'
};
