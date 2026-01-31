/**
 * Canvas Overlay - Public Exports
 * 
 * Clean exports for Canvas overlay rendering system
 */

export { CanvasOverlayRenderer } from './renderer';
export { type GameOverlayData, type PlayerStatsOverlayData, type OverlayVariant } from './utils';
export { LogoCache, hexToRgba, getTailwindColor, measureText } from './utils';
export { PlayerStatsDrawer } from './playerStatsDrawer';
export { NBAOverlayDrawer } from './nbaDrawing';

// Info Bar Manager exports
export {
  type InfoBarItem,
  type InfoBarItemType,
  type InfoBarToggles,
  type InfoBarState,
  type FoulData,
  DEFAULT_TOGGLES,
  createTournamentNameItem,
  createHalftimeItem,
  createOvertimeItem,
  createTimeoutItem,
  createTeamRunItem,
  createMilestoneItem,
  createFoulItem,
  getActiveInfoBarItem,
  isHalftime,
  isOvertime,
  getOvertimePeriod,
} from './infoBarManager';