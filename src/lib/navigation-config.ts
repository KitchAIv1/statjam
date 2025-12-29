import { User, Trophy, BarChart3, Users, PlayCircle, Calendar, Settings, Home, Video, Palette } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
  disabled?: boolean;
}

export interface NavigationConfig {
  primary: NavigationItem[];
  secondary?: NavigationItem[];
}

export const navigationConfig: Record<string, NavigationConfig> = {
  admin: {
    primary: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: Home,
        description: 'Admin dashboard'
      },
      {
        label: 'Templates',
        href: '/dashboard', // Admin templates temporarily disabled
        icon: Palette,
        description: 'Manage card templates'
      },
      {
        label: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        description: 'View system analytics'
      }
    ],
    secondary: [
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'System settings'
      }
    ]
  },
  
  guest: {
    primary: [
      {
        label: 'Tournaments',
        href: '/tournaments',
        icon: Trophy,
        description: 'Browse tournaments'
      },
      {
        label: 'Features',
        href: '/features',
        icon: BarChart3,
        description: 'Explore our features'
      },
      {
        label: 'Sequences',
        href: '#sequences',
        icon: PlayCircle,
        description: 'Smart automation sequences'
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
        label: 'Overview',
        href: '/dashboard?section=overview',
        icon: Home,
        description: 'Dashboard overview'
      },
      {
        label: 'Tournaments',
        href: '/dashboard?section=tournaments',
        icon: Trophy,
        description: 'Manage tournaments'
      },
      // Teams nav disabled - team management is now integrated into Tournament Manager
      // {
      //   label: 'Teams',
      //   href: '/dashboard?section=teams',
      //   icon: Users,
      //   description: 'Manage teams',
      //   disabled: true
      // },
      {
        label: 'Games',
        href: '/dashboard?section=games',
        icon: Calendar,
        description: 'Schedule games'
      },
      {
        label: 'Live Stream',
        href: '/dashboard?section=live-stream',
        icon: Video,
        description: 'Live streaming'
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
        label: 'NBA Cards',
        href: '#disabled-nba-cards',
        icon: Palette,
        description: 'Generate NBA trading cards',
        disabled: true
      },
      {
        label: 'My Stats',
        href: '#disabled-my-stats',
        icon: BarChart3,
        description: 'View your statistics',
        disabled: true
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
        label: 'My Assigned Games',
        href: '/dashboard/stat-admin?section=games',
        icon: PlayCircle,
        description: 'View your assigned games and launch tracker'
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
  
  coach: {
    primary: [
      {
        label: 'Dashboard',
        href: '/dashboard/coach',
        icon: Home,
        description: 'Coach mission control'
      },
      {
        label: 'Tournaments',
        href: '/dashboard/coach/tournaments',
        icon: Trophy,
        description: 'Tournament connections'
      }
    ],
    secondary: [
      {
        label: 'Settings',
        href: '/dashboard/coach/settings',
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