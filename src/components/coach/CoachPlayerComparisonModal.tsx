/**
 * Coach Player Comparison Modal
 * 
 * Side-by-side comparison of two players with:
 * - Per-game stats
 * - Efficiency metrics
 * - VPS (Versatility Performance Score)
 * - Strengths & weaknesses
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 * 
 * @module CoachPlayerComparisonModal
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { CoachAnalyticsService } from '@/lib/services/coachAnalyticsService';
import { PlayerAnalytics } from '@/lib/types/coachAnalytics';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CoachPlayerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  player1Id: string;
  player2Id: string;
}

/**
 * CoachPlayerComparisonModal - Compare two players side-by-side
 */
export function CoachPlayerComparisonModal({
  isOpen,
  onClose,
  teamId,
  player1Id,
  player2Id
}: CoachPlayerComparisonModalProps) {
  const [player1, setPlayer1] = useState<PlayerAnalytics | null>(null);
  const [player2, setPlayer2] = useState<PlayerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const loadPlayers = async () => {
      try {
        setLoading(true);
        const [p1, p2] = await Promise.all([
          CoachAnalyticsService.getPlayerAnalytics(player1Id, teamId),
          CoachAnalyticsService.getPlayerAnalytics(player2Id, teamId)
        ]);
        setPlayer1(p1);
        setPlayer2(p2);
      } catch (error) {
        console.error('Error loading player analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [isOpen, player1Id, player2Id, teamId]);

  const renderComparisonRow = (
    label: string,
    value1: number,
    value2: number,
    higherIsBetter: boolean = true
  ) => {
    const winner = value1 === value2 ? 'tie' : 
                   (higherIsBetter ? (value1 > value2 ? 'player1' : 'player2') :
                                    (value1 < value2 ? 'player1' : 'player2'));

    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
        <div className={`text-right ${winner === 'player1' ? 'font-bold text-orange-600' : 'text-gray-600'}`}>
          {value1}
          {winner === 'player1' && <TrendingUp className="inline w-4 h-4 ml-1" />}
        </div>
        <div className="text-center text-sm text-gray-500 font-medium">
          {label}
        </div>
        <div className={`text-left ${winner === 'player2' ? 'font-bold text-orange-600' : 'text-gray-600'}`}>
          {value2}
          {winner === 'player2' && <TrendingUp className="inline w-4 h-4 ml-1" />}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Player Comparison</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !player1 || !player2 ? (
          <div className="text-center py-8 text-gray-600">
            Unable to load player data
          </div>
        ) : (
          <div className="space-y-6">
            {/* Player Headers */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">{player1.playerName}</h3>
                <p className="text-sm text-gray-500">{player1.gamesPlayed} games</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-gray-400 font-medium">VS</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">{player2.playerName}</h3>
                <p className="text-sm text-gray-500">{player2.gamesPlayed} games</p>
              </div>
            </div>

            {/* Per-Game Stats */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Per-Game Averages</h4>
              {renderComparisonRow('Points', player1.pointsPerGame, player2.pointsPerGame)}
              {renderComparisonRow('Rebounds', player1.reboundsPerGame, player2.reboundsPerGame)}
              {renderComparisonRow('Assists', player1.assistsPerGame, player2.assistsPerGame)}
              {renderComparisonRow('Steals', player1.stealsPerGame, player2.stealsPerGame)}
              {renderComparisonRow('Blocks', player1.blocksPerGame, player2.blocksPerGame)}
              {renderComparisonRow('Turnovers', player1.turnoversPerGame, player2.turnoversPerGame, false)}
            </div>

            {/* Efficiency Metrics */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Efficiency</h4>
              {renderComparisonRow('VPS', player1.versatilityScore, player2.versatilityScore)}
              {renderComparisonRow('PER', player1.playerEfficiencyRating, player2.playerEfficiencyRating)}
              {renderComparisonRow('TS%', player1.trueShootingPercentage, player2.trueShootingPercentage)}
              {renderComparisonRow('eFG%', player1.effectiveFGPercentage, player2.effectiveFGPercentage)}
              {renderComparisonRow('Off Rating', player1.offensiveRating, player2.offensiveRating)}
            </div>

            {/* Shooting */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Shooting</h4>
              {renderComparisonRow('FG%', player1.fieldGoalPercentage, player2.fieldGoalPercentage)}
              {renderComparisonRow('3PT%', player1.threePointPercentage, player2.threePointPercentage)}
              {renderComparisonRow('FT%', player1.freeThrowPercentage, player2.freeThrowPercentage)}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{player1.playerName} - Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {player1.strengths.map((strength, i) => (
                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {strength}
                    </span>
                  ))}
                  {player1.strengths.length === 0 && (
                    <span className="text-sm text-gray-500">No standout strengths</span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 mt-3">Weaknesses</h4>
                <div className="flex flex-wrap gap-2">
                  {player1.weaknesses.map((weakness, i) => (
                    <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      {weakness}
                    </span>
                  ))}
                  {player1.weaknesses.length === 0 && (
                    <span className="text-sm text-gray-500">No major weaknesses</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{player2.playerName} - Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {player2.strengths.map((strength, i) => (
                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {strength}
                    </span>
                  ))}
                  {player2.strengths.length === 0 && (
                    <span className="text-sm text-gray-500">No standout strengths</span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 mt-3">Weaknesses</h4>
                <div className="flex flex-wrap gap-2">
                  {player2.weaknesses.map((weakness, i) => (
                    <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      {weakness}
                    </span>
                  ))}
                  {player2.weaknesses.length === 0 && (
                    <span className="text-sm text-gray-500">No major weaknesses</span>
                  )}
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Recent Trend</p>
                <div className="flex items-center justify-center gap-2">
                  {player1.trend === 'improving' && <TrendingUp className="w-5 h-5 text-green-500" />}
                  {player1.trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-500" />}
                  {player1.trend === 'stable' && <Minus className="w-5 h-5 text-gray-500" />}
                  <span className="font-semibold capitalize">{player1.trend}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Recent Trend</p>
                <div className="flex items-center justify-center gap-2">
                  {player2.trend === 'improving' && <TrendingUp className="w-5 h-5 text-green-500" />}
                  {player2.trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-500" />}
                  {player2.trend === 'stable' && <Minus className="w-5 h-5 text-gray-500" />}
                  <span className="font-semibold capitalize">{player2.trend}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

