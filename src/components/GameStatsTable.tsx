"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Calendar, TrendingUp, Lock, Crown } from "lucide-react";
import { PlayerGameStatsService, GameStatsSummary } from "@/lib/services/playerGameStatsService";

interface GameStatsTableProps {
  userId: string;
  /** When false, detailed stats are hidden and user sees upgrade prompt */
  showDetailedStats?: boolean;
  /** Callback when user clicks upgrade */
  onUpgrade?: () => void;
}

export function GameStatsTable({ userId, showDetailedStats = true, onUpgrade }: GameStatsTableProps) {
  const [gameStats, setGameStats] = useState<GameStatsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const stats = await PlayerGameStatsService.getPlayerGameStats(userId);
      setGameStats(stats);
      setLoading(false);
    };

    fetchGameStats();
  }, [userId]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Game Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading game stats...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameStats.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Game Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No game stats available yet. Stats will appear after you play your first game.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Game Log
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {gameStats.length} {gameStats.length === 1 ? 'Game' : 'Games'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Date</th>
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Matchup</th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Result</th>
                {showDetailedStats ? (
                  <>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">MIN</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">PTS</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">REB</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">AST</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">STL</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">BLK</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">FG%</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">3P%</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">FT%</th>
                  </>
                ) : (
                  <th className="text-center py-3 px-2 font-semibold text-muted-foreground" colSpan={9}>
                    <span className="flex items-center justify-center gap-2 text-orange-600">
                      <Lock className="w-4 h-4" />
                      Detailed Stats
                    </span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {gameStats.map((game, index) => (
                <tr 
                  key={game.gameId} 
                  className={`border-b border-border/30 hover:bg-accent/50 transition-colors ${
                    index === 0 ? 'bg-accent/20' : ''
                  }`}
                >
                  <td className="py-3 px-2 text-card-foreground">
                    {new Date(game.gameDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="py-3 px-2 text-card-foreground">
                    <span className="font-medium">
                      {game.isHome ? 'vs' : '@'} {game.opponent}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                      game.result === 'W' 
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                        : game.result === 'L'
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                        : game.result === 'LIVE'
                        ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 animate-pulse'
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {game.result === 'LIVE' ? '🔴 LIVE' : `${game.result} ${game.finalScore}`}
                    </span>
                  </td>
                  {showDetailedStats ? (
                    <>
                      <td className="py-3 px-2 text-center text-card-foreground">{game.minutesPlayed}</td>
                      <td className="py-3 px-2 text-center font-bold text-card-foreground">{game.points}</td>
                      <td className="py-3 px-2 text-center text-card-foreground">{game.rebounds}</td>
                      <td className="py-3 px-2 text-center text-card-foreground">{game.assists}</td>
                      <td className="py-3 px-2 text-center text-card-foreground">{game.steals}</td>
                      <td className="py-3 px-2 text-center text-card-foreground">{game.blocks}</td>
                      <td className="py-3 px-2 text-center text-card-foreground">
                        <span className="text-xs">
                          {game.fieldGoalPercentage > 0 ? `${game.fieldGoalPercentage}%` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-card-foreground">
                        <span className="text-xs">
                          {game.threePointPercentage > 0 ? `${game.threePointPercentage}%` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-card-foreground">
                        <span className="text-xs">
                          {game.freeThrowPercentage > 0 ? `${game.freeThrowPercentage}%` : '-'}
                        </span>
                      </td>
                    </>
                  ) : (
                    <td className="py-3 px-2 text-center" colSpan={9}>
                      <span className="text-muted-foreground/60 text-xs">🔒 Upgrade to view</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden space-y-4">
          {gameStats.map((game, index) => (
            <div 
              key={game.gameId}
              className={`p-4 rounded-lg border border-border/50 ${
                index === 0 ? 'bg-accent/20' : 'bg-card/50'
              }`}
            >
              {/* Game Header - Always visible */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(game.gameDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="font-semibold text-card-foreground">
                    {game.isHome ? 'vs' : '@'} {game.opponent}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    game.result === 'W' 
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                      : game.result === 'L'
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                      : game.result === 'LIVE'
                      ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 animate-pulse'
                      : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                  }`}>
                    {game.result === 'LIVE' ? '🔴 LIVE' : game.result}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {game.result === 'LIVE' ? 'In Progress' : game.finalScore}
                  </div>
                </div>
              </div>

              {showDetailedStats ? (
                <>
                  {/* Single Row Stats - Compact Grid (NBA Mobile Style) */}
                  <div className="grid grid-cols-6 gap-1.5 text-center">
                    <div className="px-1">
                      <div className="text-base font-bold text-primary">{game.minutesPlayed}</div>
                      <div className="text-[10px] text-muted-foreground">MIN</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-primary">{game.points}</div>
                      <div className="text-[10px] text-muted-foreground">PTS</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">{game.rebounds}</div>
                      <div className="text-[10px] text-muted-foreground">REB</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">{game.assists}</div>
                      <div className="text-[10px] text-muted-foreground">AST</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">{game.steals}</div>
                      <div className="text-[10px] text-muted-foreground">STL</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">{game.blocks}</div>
                      <div className="text-[10px] text-muted-foreground">BLK</div>
                    </div>
                  </div>
                  
                  {/* Second Row - Shooting & Other Stats */}
                  <div className="grid grid-cols-6 gap-1.5 text-center mt-2">
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">
                        {game.fieldGoalPercentage > 0 ? `${game.fieldGoalPercentage}%` : '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">FG%</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">
                        {game.threePointPercentage > 0 ? `${game.threePointPercentage}%` : '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">3P%</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">
                        {game.freeThrowPercentage > 0 ? `${game.freeThrowPercentage}%` : '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">FT%</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">{game.turnovers}</div>
                      <div className="text-[10px] text-muted-foreground">TO</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">{game.fouls}</div>
                      <div className="text-[10px] text-muted-foreground">PF</div>
                    </div>
                    <div className="px-1">
                      <div className="text-base font-bold text-card-foreground">
                        {game.plusMinus > 0 ? `+${game.plusMinus}` : game.plusMinus}
                      </div>
                      <div className="text-[10px] text-muted-foreground">+/-</div>
                    </div>
                  </div>
                </>
              ) : (
                /* Locked stats placeholder for mobile */
                <div className="text-center py-2 text-muted-foreground/70 text-sm">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Stats locked • Upgrade to view
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Stats Summary */}
        {gameStats.length > 1 && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>
                Season Record: {gameStats.filter(g => g.result === 'W').length}-{gameStats.filter(g => g.result === 'L').length}
                {gameStats.filter(g => g.result === 'LIVE').length > 0 && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    ({gameStats.filter(g => g.result === 'LIVE').length} LIVE)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Upgrade CTA when stats are locked */}
        {!showDetailedStats && onUpgrade && (
          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to see detailed stats for all {gameStats.length} games
            </p>
            <Button 
              onClick={onUpgrade}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Unlock Game Stats
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

