/**
 * Tournament page theme class mappings.
 * Single source for light/dark variants across public tournament components.
 */

export type TournamentTheme = 'light' | 'dark';

export const tournamentThemeClasses = {
  // Page & shell
  pageBg: { dark: 'bg-black', light: 'bg-gray-50' },
  pageText: { dark: 'text-white', light: 'text-gray-900' },

  // Header
  headerBg: {
    dark: 'bg-[#0A0A0A]/95 backdrop-blur-lg',
    light: 'bg-white/95 backdrop-blur-lg',
  },
  headerBorder: { dark: 'border-white/10', light: 'border-gray-200 border-[#FF3B30]/15' },

  // Search input
  inputBg: { dark: 'bg-white/5', light: 'bg-gray-100' },
  inputBorder: { dark: 'border-white/10', light: 'border-gray-200' },
  inputText: { dark: 'text-white', light: 'text-gray-900' },
  inputPlaceholder: { dark: 'placeholder:text-white/40', light: 'placeholder:text-gray-400' },
  inputIcon: { dark: 'text-white/40', light: 'text-gray-400' },

  // Secondary button (outline)
  btnOutlineBg: { dark: 'bg-transparent', light: 'bg-transparent' },
  btnOutlineHoverBg: { dark: 'hover:bg-white/10', light: 'hover:bg-white/30' },
  btnOutlineBorder: { dark: 'border-white/10 hover:border-white/30', light: 'border-gray-300 hover:border-[#FF3B30]/40' },
  btnOutlineText: { dark: 'text-white/70 hover:text-white', light: 'text-gray-600 hover:text-[#FF3B30]' },

  // Primary button (accent) - text stays white for contrast
  btnPrimary: 'bg-[#FF3B30] text-white',

  // Nav bar (desktop tabs: Overview, Schedule, etc.)
  navBg: { dark: 'bg-[#121212]', light: 'bg-white' },
  navBorder: { dark: 'border-white/10', light: 'border-b-2 border-[#FF3B30]/20' },
  navText: { dark: 'text-[#B3B3B3] hover:text-white', light: 'text-gray-600 hover:text-[#FF3B30]' },
  navTextActive: { dark: 'text-white', light: 'text-[#FF3B30]' },

  // Hero section (no gradient on light; banner image shown without overlay)
  heroBg: {
    dark: 'bg-gradient-to-b from-[#121212] to-black',
    light: 'bg-gray-50',
  },
  heroBorder: { dark: 'border-white/10', light: 'border-gray-200' },
  heroBgOverlay: { dark: 'opacity-60', light: 'opacity-100' },
  heroContentScrim: { dark: '', light: 'bg-gradient-to-b from-white/15 via-white/5 to-white/25' },
  heroAvatarBorder: { dark: 'border-white/10 bg-[#121212]', light: 'border-gray-200 bg-white' },
  heroShareBtn: { dark: 'bg-transparent border border-white/40 text-white/85 hover:border-white/60 hover:text-white', light: 'bg-transparent border-2 border-[#FF3B30] text-white hover:border-[#FF3B30]/90 hover:text-white' },
  heroFollowBtn: { dark: 'bg-transparent border border-white/30 text-white/55 opacity-60', light: 'bg-transparent border-2 border-[#FF3B30]/80 text-white/80 opacity-60' },
  heroOrganizerBadge: { dark: 'bg-transparent border border-white/30', light: 'bg-transparent border-2 border-[#FF3B30]' },
  heroOrganizerText: { dark: 'text-white/95', light: 'text-white' },
  heroOrganizerDim: { dark: 'text-white/60', light: 'text-white/80' },
  heroOrganizerFallbackText: { dark: 'text-white', light: 'text-white' },
  heroLocationIcon: { dark: 'text-white/80', light: 'text-white/85' },
  navMoreBtn: { dark: 'text-[#B3B3B3] hover:text-white', light: 'text-gray-600 hover:text-[#FF3B30]' },
  navDropdownBg: { dark: 'border-white/10 bg-[#121212]', light: 'border-gray-200 bg-white' },
  navDropdownItem: { dark: 'text-[#B3B3B3] hover:bg-white/5 hover:text-white', light: 'text-gray-600 hover:bg-[#FF3B30]/5 hover:text-[#FF3B30]' },
  heroTitle: { dark: 'text-white', light: 'text-white' },
  heroSubtext: { dark: 'text-white/90', light: 'text-white/90' },

  // Phase chips (outline style: transparent interior, colored border)
  phaseChipActive: 'bg-[#FF3B30] text-white',
  phaseChipCompleted: {
    dark: 'bg-transparent border border-white/40 text-white/90 hover:border-white/50 hover:text-white',
    light: 'bg-transparent border-2 border-[#FF3B30] text-white hover:border-[#FF3B30]/90 hover:text-white',
  },
  phaseChipInactive: {
    dark: 'bg-transparent border border-white/30 text-white/80 hover:border-white/40 hover:text-white',
    light: 'bg-transparent border-2 border-[#FF3B30]/80 text-white/90 hover:border-[#FF3B30] hover:text-white',
  },

  // Progress bar
  progressBarTrack: { dark: 'bg-white/10', light: 'bg-[#FF3B30]/15' },

  // Hero stats strip & countdown
  heroStatsText: { dark: 'text-white/90', light: 'text-white' },
  heroStatsDot: { dark: 'text-white/70', light: 'text-white/80' },
  heroCountdown: { dark: 'text-white/85', light: 'text-white/90' },

  // Main content area
  mainBg: { dark: 'bg-transparent', light: 'bg-transparent' },

  // Mobile tabs (scrollable pills)
  tabsListBg: { dark: 'bg-transparent', light: 'bg-transparent' },
  tabTriggerBg: { dark: 'bg-[#121212] border-white/10', light: 'bg-white border-[#FF3B30]/25 hover:border-[#FF3B30]/40' },
  tabTriggerText: { dark: 'text-white/70', light: 'text-gray-600 hover:text-[#FF3B30]' },
  tabTriggerActive: { dark: 'border-[#FF3B30]/80 bg-[#FF3B30]/20 text-white', light: 'border-[#FF3B30] bg-[#FF3B30]/15 text-[#FF3B30]' },

  // Cards & containers
  cardBg: { dark: 'bg-black/40', light: 'bg-white' },
  cardBgSubtle: { dark: 'bg-white/5', light: 'bg-gray-50' },
  cardBorder: { dark: 'border-white/10', light: 'border-gray-200 border-[#FF3B30]/5' },
  cardText: { dark: 'text-white', light: 'text-gray-900' },
  cardTextMuted: { dark: 'text-[#B3B3B3]', light: 'text-gray-600' },
  cardTextDim: { dark: 'text-white/40', light: 'text-gray-400' },

  // Right rail
  railBg: { dark: 'bg-black/40', light: 'bg-white' },
  railSectionBg: { dark: 'bg-[#121212]', light: 'bg-white' },
  railBorder: { dark: 'border-white/10', light: 'border-gray-200' },

  // Footer
  footerBg: { dark: 'bg-[#121212]', light: 'bg-gray-100' },
  footerBorder: { dark: 'border-white/10', light: 'border-t-2 border-[#FF3B30]/15' },
  footerLabel: { dark: 'text-white/40', light: 'text-gray-500' },
  footerTitle: { dark: 'text-white/90', light: 'text-gray-900' },
  footerText: { dark: 'text-[#B3B3B3]', light: 'text-gray-600' },
  footerLink: { dark: 'text-[#B3B3B3] hover:text-white', light: 'text-gray-600 hover:text-[#FF3B30]' },
  footerDivider: { dark: 'bg-white/20', light: 'bg-gray-300' },
  socialIcon: { dark: 'text-white/60 hover:text-[#FF3B30]', light: 'text-gray-500 hover:text-[#FF3B30]' },

  // Dividers & borders
  border: { dark: 'border-white/10', light: 'border-gray-200' },
  borderLight: { dark: 'border-white/5', light: 'border-gray-100' },
  divide: { dark: 'divide-y divide-white/10', light: 'divide-y divide-gray-200' },
  rowHover: { dark: 'hover:bg-white/5', light: 'hover:bg-gray-50' },

  // Empty states & placeholders
  emptyIcon: { dark: 'text-white/20', light: 'text-gray-300' },
  emptyTitle: { dark: 'text-white', light: 'text-gray-900' },
  emptyText: { dark: 'text-white/40', light: 'text-gray-500' },
  /** For empty-state containers over background images (e.g. Leaderboard Highlights) - transparency so background shows through */
  emptyStateOverlay: { dark: 'bg-black/40', light: 'bg-white/50' },

  // Overview carousel & filter pills
  carouselArrow: { dark: 'bg-black/60 hover:bg-black/80 text-white', light: 'bg-gray-900/70 hover:bg-gray-800 text-white' },
  filterPillBg: { dark: 'border border-white/10 bg-black/40', light: 'border border-gray-300 bg-gray-100' },
  filterPillInactive: { dark: 'text-[#B3B3B3] hover:text-white', light: 'text-gray-600 hover:text-[#FF3B30]' },

  // Schedule tab action buttons & badges
  scheduleBtnCompleted: {
    dark: 'border border-white/20 text-white/60 hover:border-white/30 hover:text-white/80',
    light: 'border border-gray-400 text-gray-600 hover:border-[#FF3B30]/50 hover:text-[#FF3B30]',
  },
  scheduleBtnDisabled: {
    dark: 'border border-white/10 text-white/30 cursor-not-allowed opacity-50',
    light: 'border border-gray-300 text-gray-400 cursor-not-allowed opacity-50',
  },
  badgeCompleted: { dark: 'bg-white/10 text-white/60', light: 'bg-gray-100 text-gray-600' },
  badgeScheduled: { dark: 'bg-[#1f2937] text-white/60', light: 'bg-gray-200 text-gray-600' },
} as const;

export type TournamentThemeKey = keyof typeof tournamentThemeClasses;

/** Returns theme-specific classes. For keys with single value (e.g. btnPrimary), returns as-is. */
export function getTournamentThemeClass(
  key: TournamentThemeKey,
  theme: TournamentTheme
): string {
  const val = tournamentThemeClasses[key];
  if (typeof val === 'string') return val;
  return val[theme];
}
