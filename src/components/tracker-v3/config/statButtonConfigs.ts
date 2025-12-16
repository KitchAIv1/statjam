/**
 * Shared Stat Button Configurations
 * 
 * Single source of truth for stat button definitions used across:
 * - DesktopStatGridV3 (Button mode - Desktop)
 * - MobileStatGridV3 (Button mode - Mobile)
 * - CompactStatButtons (Shot Tracker mode)
 * 
 * Follows .cursorrules: <50 lines, pure config
 */

// Made shots (2PT, 3PT, FT, Offensive Rebound)
export const MADE_STATS = [
  { id: '2pt-made', label: '2PT', statType: 'field_goal', modifier: 'made' },
  { id: '3pt-made', label: '3PT', statType: 'three_pointer', modifier: 'made' },
  { id: 'ft-made', label: 'FT', statType: 'free_throw', modifier: 'made' },
  { id: 'reb-offensive', label: 'REB', statType: 'rebound', modifier: 'offensive' }
] as const;

// Missed shots (2PT, 3PT, FT, Defensive Rebound)
export const MISSED_STATS = [
  { id: '2pt-missed', label: '2PT', statType: 'field_goal', modifier: 'missed' },
  { id: '3pt-missed', label: '3PT', statType: 'three_pointer', modifier: 'missed' },
  { id: 'ft-missed', label: 'FT', statType: 'free_throw', modifier: 'missed' },
  { id: 'reb-defensive', label: 'REB', statType: 'rebound', modifier: 'defensive' }
] as const;

// Single-action stats (no made/missed variants)
// ✅ PHASE 5 FIX: AST/STL/BLK require NULL modifier per database constraint
// ✅ TOV: undefined modifier triggers TurnoverTypeModal for user selection
export const SINGLE_STATS = [
  { id: 'ast', label: 'AST', statType: 'assist', modifier: undefined },
  { id: 'stl', label: 'STL', statType: 'steal', modifier: undefined },
  { id: 'blk', label: 'BLK', statType: 'block', modifier: undefined },
  { id: 'tov', label: 'TOV', statType: 'turnover', modifier: undefined }
] as const;

// Free Throw + Rebound stats for Shot Tracker compact view
export const FT_REB_STATS = [
  { id: 'ft-made', label: 'FT', sub: '✓', statType: 'free_throw', modifier: 'made', color: 'green' },
  { id: 'ft-missed', label: 'FT', sub: '✗', statType: 'free_throw', modifier: 'missed', color: 'red' },
  { id: 'reb-off', label: 'REB', sub: 'Off', statType: 'rebound', modifier: 'offensive', color: 'green' },
  { id: 'reb-def', label: 'REB', sub: 'Def', statType: 'rebound', modifier: 'defensive', color: 'blue' }
] as const;

// Other stats for Shot Tracker (excludes 2PT/3PT which are handled by court)
// Uses SINGLE_STATS values but adds color for compact UI
export const OTHER_STATS = [
  { id: 'ast', label: 'AST', statType: 'assist', modifier: undefined, color: 'blue' },
  { id: 'stl', label: 'STL', statType: 'steal', modifier: undefined, color: 'purple' },
  { id: 'blk', label: 'BLK', statType: 'block', modifier: undefined, color: 'indigo' },
  { id: 'tov', label: 'TOV', statType: 'turnover', modifier: undefined, color: 'yellow' }
] as const;
