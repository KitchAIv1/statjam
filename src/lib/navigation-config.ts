import { User, Trophy, BarChart3, Users, PlayCircle, Calendar, Settings, Home } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

export interface NavigationConfig {
  primary: NavigationItem[];
  secondary?: NavigationItem[];
}

export const navigationConfig: Record<string, NavigationConfig> = {
  guest: {
    primary: [
      {
        label: 'Features',
        href: '#features',
        icon: BarChart3,
        description: 'Explore our features'
      },
      {
        label: 'Pricing',
        href: '#pricing',
        icon: Trophy,
        description: 'View pricing plans'
      },
      {
        label: 'About',
        href: '#about',
        icon: Users,
        description: 'Learn about StatJam'
      }
    ]
  },
  
  organizer: {
    primary: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'Tournament overview'
      },
      {
        label: 'Create Tournament',
        href: '/dashboard/create-tournament',
        icon: Trophy,
        description: 'Start new tournament'
      },
      {
        label: 'Tournaments',
        href: '/dashboard/tournaments',
        icon: Calendar,
        description: 'Manage tournaments'
      }
    ],
    secondary: [
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'Account settings'
      }
    ]
  },
  
  player: {
    primary: [
      {
        label: 'Dashboard',
        href: '/dashboard/player',
        icon: Home,
        description: 'Player overview'
      },
      {
        label: 'My Stats',
        href: '/dashboard/player/stats',
        icon: BarChart3,
        description: 'View your statistics'
      },
      {
        label: 'Tournaments',
        href: '/dashboard/player/tournaments',
        icon: Trophy,
        description: 'Your tournaments'
      }
    ],
    secondary: [
      {
        label: 'Settings',
        href: '/dashboard/player/settings',
        icon: Settings,
        description: 'Account settings'
      }
    ]
  },
  
  stat_admin: {
    primary: [
      {
        label: 'Dashboard',
        href: '/dashboard/stat-admin',
        icon: Home,
        description: 'Stat admin overview'
      },
      {
        label: 'Live Games',
        href: '/stat-tracker',
        icon: PlayCircle,
        description: 'Track live games'
      },
      {
        label: 'Game History',
        href: '/dashboard/stat-admin/games',
        icon: Calendar,
        description: 'View game history'
      }
    ],
    secondary: [
      {
        label: 'Settings',
        href: '/dashboard/stat-admin/settings',
        icon: Settings,
        description: 'Account settings'
      }
    ]
  },
  
  fan: {
    primary: [
      {
        label: 'Tournaments',
        href: '/tournaments',
        icon: Trophy,
        description: 'Browse tournaments'
      },
      {
        label: 'Live Games',
        href: '/live-games',
        icon: PlayCircle,
        description: 'Watch live games'
      },
      {
        label: 'Players',
        href: '/players',
        icon: Users,
        description: 'Browse players'
      }
    ],
    secondary: [
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Account settings'
      }
    ]
  }
};

export function getNavigationForRole(userRole: string | null): NavigationConfig {
  if (!userRole) {
    return navigationConfig.guest;
  }
  
  return navigationConfig[userRole] || navigationConfig.guest;
}