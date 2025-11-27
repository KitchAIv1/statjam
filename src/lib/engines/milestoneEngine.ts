/**
 * MilestoneEngine - Detects player milestone achievements
 * 
 * PURPOSE: Pure function that analyzes player stats and returns milestone(s) achieved
 * 
 * MILESTONES:
 * - Points: 10, 20, 30, 40, 50
 * - Assists: 5, 10, 15, 20
 * - Rebounds: 10, 15, 20
 * - Steals: 3, 5, 7
 * - Blocks: 3, 5, 7
 * - Double-Double: 10+ in 2 categories (PTS, REB, AST, STL, BLK)
 * - Triple-Double: 10+ in 3 categories
 * 
 * @module MilestoneEngine
 */

export interface PlayerStatsForMilestone {
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
}

export interface Milestone {
  type: MilestoneType;
  label: string;
  value?: number;
  icon: string;
  color: 'blue' | 'purple' | 'orange' | 'gold' | 'teal' | 'red';
  priority: number; // Higher = more important (for sorting)
}

export type MilestoneType = 
  | 'PTS_10' | 'PTS_20' | 'PTS_30' | 'PTS_40' | 'PTS_50'
  | 'AST_5' | 'AST_10' | 'AST_15' | 'AST_20'
  | 'REB_10' | 'REB_15' | 'REB_20'
  | 'STL_3' | 'STL_5' | 'STL_7'
  | 'BLK_3' | 'BLK_5' | 'BLK_7'
  | 'DOUBLE_DOUBLE' | 'TRIPLE_DOUBLE';

// Milestone definitions with thresholds
const MILESTONE_CONFIG: Record<MilestoneType, { label: string; icon: string; color: Milestone['color']; priority: number }> = {
  // Points milestones
  PTS_10: { label: '10 PTS', icon: '🔵', color: 'blue', priority: 10 },
  PTS_20: { label: '20 PTS', icon: '💜', color: 'purple', priority: 20 },
  PTS_30: { label: '30 PTS', icon: '🔥', color: 'orange', priority: 30 },
  PTS_40: { label: '40 PTS', icon: '🔥', color: 'orange', priority: 40 },
  PTS_50: { label: '50 PTS', icon: '👑', color: 'gold', priority: 50 },
  
  // Assists milestones
  AST_5: { label: '5 AST', icon: '🎯', color: 'purple', priority: 8 },
  AST_10: { label: '10 AST', icon: '🎯', color: 'purple', priority: 18 },
  AST_15: { label: '15 AST', icon: '🎯', color: 'orange', priority: 28 },
  AST_20: { label: '20 AST', icon: '🎯', color: 'gold', priority: 38 },
  
  // Rebounds milestones
  REB_10: { label: '10 REB', icon: '💪', color: 'blue', priority: 15 },
  REB_15: { label: '15 REB', icon: '💪', color: 'purple', priority: 25 },
  REB_20: { label: '20 REB', icon: '💪', color: 'orange', priority: 35 },
  
  // Steals milestones
  STL_3: { label: '3 STL', icon: '🛡️', color: 'teal', priority: 12 },
  STL_5: { label: '5 STL', icon: '🛡️', color: 'teal', priority: 22 },
  STL_7: { label: '7 STL', icon: '🛡️', color: 'orange', priority: 32 },
  
  // Blocks milestones
  BLK_3: { label: '3 BLK', icon: '🚫', color: 'red', priority: 12 },
  BLK_5: { label: '5 BLK', icon: '🚫', color: 'red', priority: 22 },
  BLK_7: { label: '7 BLK', icon: '🚫', color: 'orange', priority: 32 },
  
  // Combo milestones
  DOUBLE_DOUBLE: { label: 'DOUBLE-DOUBLE', icon: '⭐', color: 'gold', priority: 60 },
  TRIPLE_DOUBLE: { label: 'TRIPLE-DOUBLE', icon: '👑', color: 'gold', priority: 100 },
};

/**
 * Check which single-stat milestones are achieved
 * Returns only the HIGHEST milestone for each category
 */
function checkSingleStatMilestones(stats: PlayerStatsForMilestone): MilestoneType[] {
  const milestones: MilestoneType[] = [];
  
  const pts = stats.points || 0;
  const ast = stats.assists || 0;
  const reb = stats.rebounds || 0;
  const stl = stats.steals || 0;
  const blk = stats.blocks || 0;
  
  // Points - only return highest achieved
  if (pts >= 50) milestones.push('PTS_50');
  else if (pts >= 40) milestones.push('PTS_40');
  else if (pts >= 30) milestones.push('PTS_30');
  else if (pts >= 20) milestones.push('PTS_20');
  else if (pts >= 10) milestones.push('PTS_10');
  
  // Assists - only return highest achieved
  if (ast >= 20) milestones.push('AST_20');
  else if (ast >= 15) milestones.push('AST_15');
  else if (ast >= 10) milestones.push('AST_10');
  else if (ast >= 5) milestones.push('AST_5');
  
  // Rebounds - only return highest achieved
  if (reb >= 20) milestones.push('REB_20');
  else if (reb >= 15) milestones.push('REB_15');
  else if (reb >= 10) milestones.push('REB_10');
  
  // Steals - only return highest achieved
  if (stl >= 7) milestones.push('STL_7');
  else if (stl >= 5) milestones.push('STL_5');
  else if (stl >= 3) milestones.push('STL_3');
  
  // Blocks - only return highest achieved
  if (blk >= 7) milestones.push('BLK_7');
  else if (blk >= 5) milestones.push('BLK_5');
  else if (blk >= 3) milestones.push('BLK_3');
  
  return milestones;
}

/**
 * Check for double-double or triple-double
 * Categories: PTS, REB, AST, STL, BLK (10+ in each)
 */
function checkComboMilestones(stats: PlayerStatsForMilestone): MilestoneType | null {
  const pts = stats.points || 0;
  const reb = stats.rebounds || 0;
  const ast = stats.assists || 0;
  const stl = stats.steals || 0;
  const blk = stats.blocks || 0;
  
  // Count how many categories have 10+
  let categoriesAt10Plus = 0;
  if (pts >= 10) categoriesAt10Plus++;
  if (reb >= 10) categoriesAt10Plus++;
  if (ast >= 10) categoriesAt10Plus++;
  if (stl >= 10) categoriesAt10Plus++;
  if (blk >= 10) categoriesAt10Plus++;
  
  if (categoriesAt10Plus >= 3) return 'TRIPLE_DOUBLE';
  if (categoriesAt10Plus >= 2) return 'DOUBLE_DOUBLE';
  
  return null;
}

/**
 * Detect if a NEW milestone was just achieved on this play
 * Compares previous stats to current stats to determine if threshold was crossed
 * 
 * @param prevStats - Stats BEFORE this play
 * @param currentStats - Stats AFTER this play (including this play)
 * @param statType - The type of stat that was just recorded
 * @returns Array of newly achieved milestones (sorted by priority, max 2)
 */
export function detectNewMilestones(
  prevStats: PlayerStatsForMilestone | undefined,
  currentStats: PlayerStatsForMilestone | undefined,
  statType?: string
): Milestone[] {
  if (!currentStats) return [];
  
  const prev = prevStats || { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 };
  const curr = currentStats;
  
  const newMilestones: Milestone[] = [];
  
  // Check if combo milestone was just achieved
  const prevCombo = checkComboMilestones(prev);
  const currCombo = checkComboMilestones(curr);
  
  // Triple-double takes priority
  if (currCombo === 'TRIPLE_DOUBLE' && prevCombo !== 'TRIPLE_DOUBLE') {
    const config = MILESTONE_CONFIG.TRIPLE_DOUBLE;
    newMilestones.push({
      type: 'TRIPLE_DOUBLE',
      label: config.label,
      icon: config.icon,
      color: config.color,
      priority: config.priority
    });
  } else if (currCombo === 'DOUBLE_DOUBLE' && prevCombo !== 'DOUBLE_DOUBLE') {
    const config = MILESTONE_CONFIG.DOUBLE_DOUBLE;
    newMilestones.push({
      type: 'DOUBLE_DOUBLE',
      label: config.label,
      icon: config.icon,
      color: config.color,
      priority: config.priority
    });
  }
  
  // Check single-stat milestones that were just crossed
  const thresholds: Array<{ stat: keyof PlayerStatsForMilestone; milestones: Array<{ threshold: number; type: MilestoneType }> }> = [
    { stat: 'points', milestones: [
      { threshold: 50, type: 'PTS_50' },
      { threshold: 40, type: 'PTS_40' },
      { threshold: 30, type: 'PTS_30' },
      { threshold: 20, type: 'PTS_20' },
      { threshold: 10, type: 'PTS_10' },
    ]},
    { stat: 'assists', milestones: [
      { threshold: 20, type: 'AST_20' },
      { threshold: 15, type: 'AST_15' },
      { threshold: 10, type: 'AST_10' },
      { threshold: 5, type: 'AST_5' },
    ]},
    { stat: 'rebounds', milestones: [
      { threshold: 20, type: 'REB_20' },
      { threshold: 15, type: 'REB_15' },
      { threshold: 10, type: 'REB_10' },
    ]},
    { stat: 'steals', milestones: [
      { threshold: 7, type: 'STL_7' },
      { threshold: 5, type: 'STL_5' },
      { threshold: 3, type: 'STL_3' },
    ]},
    { stat: 'blocks', milestones: [
      { threshold: 7, type: 'BLK_7' },
      { threshold: 5, type: 'BLK_5' },
      { threshold: 3, type: 'BLK_3' },
    ]},
  ];
  
  for (const { stat, milestones } of thresholds) {
    const prevVal = prev[stat] || 0;
    const currVal = curr[stat] || 0;
    
    // Check each threshold (highest first)
    for (const { threshold, type } of milestones) {
      // Milestone just crossed if: prev < threshold AND curr >= threshold
      if (prevVal < threshold && currVal >= threshold) {
        const config = MILESTONE_CONFIG[type];
        newMilestones.push({
          type,
          label: config.label,
          value: currVal,
          icon: config.icon,
          color: config.color,
          priority: config.priority
        });
        break; // Only report highest milestone per category
      }
    }
  }
  
  // Sort by priority (highest first) and limit to 2
  return newMilestones
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);
}

/**
 * Get current active milestones for a player (for display purposes)
 * Shows the highest milestone achieved in each category
 */
export function getCurrentMilestones(stats: PlayerStatsForMilestone | undefined): Milestone[] {
  if (!stats) return [];
  
  const milestones: Milestone[] = [];
  
  // Check combo first (highest priority)
  const combo = checkComboMilestones(stats);
  if (combo) {
    const config = MILESTONE_CONFIG[combo];
    milestones.push({
      type: combo,
      label: config.label,
      icon: config.icon,
      color: config.color,
      priority: config.priority
    });
  }
  
  // Add single-stat milestones
  const singleMilestones = checkSingleStatMilestones(stats);
  for (const type of singleMilestones) {
    const config = MILESTONE_CONFIG[type];
    milestones.push({
      type,
      label: config.label,
      icon: config.icon,
      color: config.color,
      priority: config.priority
    });
  }
  
  return milestones.sort((a, b) => b.priority - a.priority);
}

export const MilestoneEngine = {
  detectNewMilestones,
  getCurrentMilestones,
};

