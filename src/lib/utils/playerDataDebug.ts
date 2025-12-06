/**
 * Player Data Debug Utility
 * 
 * PURPOSE: Log and compare player data from different sources
 * to identify discrepancies between Player Dashboard and Player Profile Modal
 */

import { logger } from '@/lib/utils/logger';

export interface PlayerDataSnapshot {
  source: 'dashboard' | 'modal';
  timestamp: string;
  playerId: string;
  identity: {
    name?: string;
    jerseyNumber?: number;
    position?: string;
    height?: string | number;
    weight?: string | number;
    age?: number;
    location?: string;
  };
  seasonAverages: {
    pointsPerGame?: number;
    reboundsPerGame?: number;
    assistsPerGame?: number;
    fieldGoalPct?: number;
    threePointPct?: number;
    freeThrowPct?: number;
    minutesPerGame?: number;
  };
  careerHighs: {
    points?: number;
    rebounds?: number;
    assists?: number;
  };
}

export class PlayerDataDebug {
  private static snapshots: PlayerDataSnapshot[] = [];

  /**
   * Log player data snapshot for comparison
   */
  static logSnapshot(source: 'dashboard' | 'modal', playerId: string, data: {
    identity?: any;
    seasonAverages?: any;
    careerHighs?: any;
  }): void {
    const snapshot: PlayerDataSnapshot = {
      source,
      timestamp: new Date().toISOString(),
      playerId,
      identity: {
        name: data.identity?.name,
        jerseyNumber: data.identity?.jerseyNumber,
        position: data.identity?.position,
        height: data.identity?.height,
        weight: data.identity?.weight,
        age: data.identity?.age,
        location: data.identity?.location,
      },
      seasonAverages: {
        pointsPerGame: data.seasonAverages?.pointsPerGame,
        reboundsPerGame: data.seasonAverages?.reboundsPerGame,
        assistsPerGame: data.seasonAverages?.assistsPerGame,
        fieldGoalPct: data.seasonAverages?.fieldGoalPct,
        threePointPct: data.seasonAverages?.threePointPct,
        freeThrowPct: data.seasonAverages?.freeThrowPct,
        minutesPerGame: data.seasonAverages?.minutesPerGame,
      },
      careerHighs: {
        points: data.careerHighs?.points,
        rebounds: data.careerHighs?.rebounds,
        assists: data.careerHighs?.assists,
      },
    };

    this.snapshots.push(snapshot);

    // Log to console with clear formatting
    logger.group(`🔍 Player Data Snapshot [${source.toUpperCase()}] - ${playerId.substring(0, 8)}`);
    logger.debug('Timestamp:', snapshot.timestamp);
    logger.debug('Identity:', JSON.stringify(snapshot.identity, null, 2));
    logger.debug('Season Averages:', JSON.stringify(snapshot.seasonAverages, null, 2));
    logger.debug('Career Highs:', JSON.stringify(snapshot.careerHighs, null, 2));
    logger.groupEnd();

    // If we have both snapshots, compare them
    const dashboardSnapshot = this.snapshots.find(s => s.source === 'dashboard' && s.playerId === playerId);
    const modalSnapshot = this.snapshots.find(s => s.source === 'modal' && s.playerId === playerId);

    if (dashboardSnapshot && modalSnapshot) {
      this.compareSnapshots(dashboardSnapshot, modalSnapshot);
    }
  }

  /**
   * Compare two snapshots and log differences
   */
  private static compareSnapshots(dashboard: PlayerDataSnapshot, modal: PlayerDataSnapshot): void {
    logger.group('🔍 COMPARISON: Dashboard vs Modal');
    
    // Compare Identity
    const identityDiff: string[] = [];
    if (dashboard.identity.name !== modal.identity.name) {
      identityDiff.push(`Name: "${dashboard.identity.name}" vs "${modal.identity.name}"`);
    }
    if (dashboard.identity.jerseyNumber !== modal.identity.jerseyNumber) {
      identityDiff.push(`Jersey: ${dashboard.identity.jerseyNumber} vs ${modal.identity.jerseyNumber}`);
    }
    if (dashboard.identity.position !== modal.identity.position) {
      identityDiff.push(`Position: "${dashboard.identity.position}" vs "${modal.identity.position}"`);
    }
    if (dashboard.identity.height !== modal.identity.height) {
      identityDiff.push(`Height: "${dashboard.identity.height}" vs "${modal.identity.height}"`);
    }
    if (dashboard.identity.weight !== modal.identity.weight) {
      identityDiff.push(`Weight: "${dashboard.identity.weight}" vs "${modal.identity.weight}"`);
    }
    if (dashboard.identity.age !== modal.identity.age) {
      identityDiff.push(`Age: ${dashboard.identity.age} vs ${modal.identity.age}`);
    }
    if (dashboard.identity.location !== modal.identity.location) {
      identityDiff.push(`Location: "${dashboard.identity.location}" vs "${modal.identity.location}"`);
    }

    if (identityDiff.length > 0) {
      logger.warn('⚠️ IDENTITY DIFFERENCES:', identityDiff);
    } else {
      logger.debug('✅ Identity: MATCH');
    }

    // Compare Season Averages
    const seasonDiff: string[] = [];
    if (Math.abs((dashboard.seasonAverages.pointsPerGame || 0) - (modal.seasonAverages.pointsPerGame || 0)) > 0.01) {
      seasonDiff.push(`Points: ${dashboard.seasonAverages.pointsPerGame} vs ${modal.seasonAverages.pointsPerGame}`);
    }
    if (Math.abs((dashboard.seasonAverages.reboundsPerGame || 0) - (modal.seasonAverages.reboundsPerGame || 0)) > 0.01) {
      seasonDiff.push(`Rebounds: ${dashboard.seasonAverages.reboundsPerGame} vs ${modal.seasonAverages.reboundsPerGame}`);
    }
    if (Math.abs((dashboard.seasonAverages.assistsPerGame || 0) - (modal.seasonAverages.assistsPerGame || 0)) > 0.01) {
      seasonDiff.push(`Assists: ${dashboard.seasonAverages.assistsPerGame} vs ${modal.seasonAverages.assistsPerGame}`);
    }
    if (Math.abs((dashboard.seasonAverages.fieldGoalPct || 0) - (modal.seasonAverages.fieldGoalPct || 0)) > 0.1) {
      seasonDiff.push(`FG%: ${dashboard.seasonAverages.fieldGoalPct}% vs ${modal.seasonAverages.fieldGoalPct}%`);
    }
    if (Math.abs((dashboard.seasonAverages.threePointPct || 0) - (modal.seasonAverages.threePointPct || 0)) > 0.1) {
      seasonDiff.push(`3PT%: ${dashboard.seasonAverages.threePointPct}% vs ${modal.seasonAverages.threePointPct}%`);
    }
    if (Math.abs((dashboard.seasonAverages.freeThrowPct || 0) - (modal.seasonAverages.freeThrowPct || 0)) > 0.1) {
      seasonDiff.push(`FT%: ${dashboard.seasonAverages.freeThrowPct}% vs ${modal.seasonAverages.freeThrowPct}%`);
    }
    if (Math.abs((dashboard.seasonAverages.minutesPerGame || 0) - (modal.seasonAverages.minutesPerGame || 0)) > 0.01) {
      seasonDiff.push(`MPG: ${dashboard.seasonAverages.minutesPerGame} vs ${modal.seasonAverages.minutesPerGame}`);
    }

    if (seasonDiff.length > 0) {
      logger.warn('⚠️ SEASON AVERAGES DIFFERENCES:', seasonDiff);
    } else {
      logger.debug('✅ Season Averages: MATCH');
    }

    // Compare Career Highs
    const careerDiff: string[] = [];
    if (dashboard.careerHighs.points !== modal.careerHighs.points) {
      careerDiff.push(`Points: ${dashboard.careerHighs.points} vs ${modal.careerHighs.points}`);
    }
    if (dashboard.careerHighs.rebounds !== modal.careerHighs.rebounds) {
      careerDiff.push(`Rebounds: ${dashboard.careerHighs.rebounds} vs ${modal.careerHighs.rebounds}`);
    }
    if (dashboard.careerHighs.assists !== modal.careerHighs.assists) {
      careerDiff.push(`Assists: ${dashboard.careerHighs.assists} vs ${modal.careerHighs.assists}`);
    }

    if (careerDiff.length > 0) {
      logger.warn('⚠️ CAREER HIGHS DIFFERENCES:', careerDiff);
    } else {
      logger.debug('✅ Career Highs: MATCH');
    }

    // Summary
    const totalDiffs = identityDiff.length + seasonDiff.length + careerDiff.length;
    if (totalDiffs === 0) {
      logger.debug('✅✅✅ ALL DATA MATCHES ✅✅✅');
    } else {
      logger.error(`❌❌❌ FOUND ${totalDiffs} DIFFERENCES ❌❌❌`);
    }

    logger.groupEnd();
  }

  /**
   * Clear all snapshots
   */
  static clear(): void {
    this.snapshots = [];
  }

  /**
   * Get all snapshots for a player
   */
  static getSnapshots(playerId: string): PlayerDataSnapshot[] {
    return this.snapshots.filter(s => s.playerId === playerId);
  }
}

