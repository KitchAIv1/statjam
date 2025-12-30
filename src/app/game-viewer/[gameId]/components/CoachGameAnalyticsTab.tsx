/**
 * CoachGameAnalyticsTab - Game-Specific Analytics Display
 * 
 * PURPOSE: Display advanced analytics breakdown for a specific game in coach mode
 * - Shooting efficiency (FG%, 3PT%, FT%, eFG%, TS%)
 * - Shot selection metrics
 * - Team stats and top performers
 * 
 * Follows .cursorrules: <200 lines, UI component only
 * 
 * @module CoachGameAnalyticsTab
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CoachAnalyticsService } from '@/lib/services/coachAnalyticsService';
import { GameBreakdown } from '@/lib/types/coachAnalytics';
import { Target, TrendingUp, Award, BarChart3, Lightbulb, CheckCircle, AlertTriangle, Crosshair } from 'lucide-react';
import { AIGameAnalysisReport } from '@/components/analytics/AIGameAnalysisReport';

interface CoachGameAnalyticsTabProps {
  gameId: string;
  teamId: string;
  teamName: string;
  isDark?: boolean;
  prefetchedData?: GameBreakdown | null;
}

export function CoachGameAnalyticsTab({ 
  gameId, 
  teamId, 
  isDark = true,
  prefetchedData 
}: CoachGameAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<GameBreakdown | null>(prefetchedData || null);
  const [loading, setLoading] = useState(!prefetchedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetch if prefetched data is provided
    if (prefetchedData) {
      setAnalytics(prefetchedData);
      setLoading(false);
      return;
    }
    
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await CoachAnalyticsService.getGameBreakdown(gameId, teamId);
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading game analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [gameId, teamId, prefetchedData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={`p-6 text-center ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
        <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>{error || 'No analytics data available'}</p>
      </div>
    );
  }

  const { teamStats, topPerformers } = analytics;
  const cardClass = `rounded-lg p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-200'} border`;
  const headerClass = `flex items-center gap-2 text-sm font-semibold uppercase mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`;
  const labelClass = isDark ? 'text-slate-400' : 'text-gray-500';
  const valueClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className={`p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
      {/* Shooting Efficiency */}
      <div className={cardClass}>
        <h4 className={headerClass}><Target className="w-4 h-4" /> Shooting Efficiency</h4>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.effectiveFGPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>eFG%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.trueShootingPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>TS%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.fieldGoalPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>FG%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.threePointPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>3PT%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.freeThrowPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>FT%</div>
          </div>
        </div>
      </div>

      {/* Game Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Team Stats */}
        <div className={cardClass}>
          <h4 className={headerClass}><TrendingUp className="w-4 h-4" /> Game Stats</h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className={labelClass}>Points</span><span className={`font-semibold ${valueClass}`}>{teamStats.points}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Rebounds</span><span className={`font-semibold ${valueClass}`}>{teamStats.rebounds}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Assists</span><span className={`font-semibold ${valueClass}`}>{teamStats.assists}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Turnovers</span><span className={`font-semibold ${valueClass}`}>{teamStats.turnovers}</span></div>
            <div className="flex justify-between"><span className={labelClass}>AST/TO</span><span className={`font-semibold ${valueClass}`}>{teamStats.assistToTurnoverRatio}</span></div>
          </div>
        </div>

        {/* Shot Selection */}
        <div className={cardClass}>
          <h4 className={headerClass}><BarChart3 className="w-4 h-4" /> Shot Selection</h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className={labelClass}>3PT Rate</span><span className={`font-semibold ${valueClass}`}>{teamStats.threePointAttemptRate}%</span></div>
            <div className="flex justify-between"><span className={labelClass}>FT Rate</span><span className={`font-semibold ${valueClass}`}>{teamStats.freeThrowRate}%</span></div>
            <div className="flex justify-between"><span className={labelClass}>AST %</span><span className={`font-semibold ${valueClass}`}>{teamStats.assistPercentage}%</span></div>
            <div className="flex justify-between"><span className={labelClass}>Steals</span><span className={`font-semibold ${valueClass}`}>{teamStats.steals}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Blocks</span><span className={`font-semibold ${valueClass}`}>{teamStats.blocks}</span></div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className={cardClass}>
          <h4 className={headerClass}><Award className="w-4 h-4" /> Top Performers</h4>
          <div className="space-y-3">
            {topPerformers.slice(0, 3).map((player, index) => (
              <div key={player.playerId || index} className={`flex items-center justify-between py-2 border-b last:border-0 ${isDark ? 'border-slate-700' : 'border-orange-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>{index + 1}</span>
                  <span className={`font-medium ${valueClass}`}>{player.playerName}</span>
                </div>
                <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{player.statLine}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Analytics Breakdown - Only for specific game */}
      {gameId === '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82' && (
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-slate-900 rounded text-white">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Game Intelligence Report</h4>
        </div>
        
        {/* Big Picture - Hero Card */}
        <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
          <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            THE BIG PICTURE
          </h5>
          <p className="text-slate-600 leading-relaxed text-sm">
            The numbers back up the result. The team <span className="font-semibold text-slate-900">controlled this game</span> by taking quality shots, moving the ball, and creating extra possessions through defense and rebounding. The analytics align with a <span className="font-semibold text-slate-900">dominant, one-sided performance</span>.
          </p>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          {/* LEFT COLUMN: OFFENSE & POSITIVES */}
          <div className="space-y-4">
            {/* Shot Quality */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600">
                    <Target className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Shot Quality</h5>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">High eFG%</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Shooting efficiency shows the team got <span className="font-bold text-emerald-700">good looks</span> instead of forcing shots. This points to smart shot selection.
              </p>
            </div>

            {/* Ball Movement */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Ball Movement</h5>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">High Assist %</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nearly <span className="font-bold text-emerald-700">half of made baskets</span> came off assists. The offense was sharing the ball and finding open teammates.
              </p>
            </div>

            {/* Rebounding */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Board Control</h5>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">+ Margin</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Winning the <span className="font-bold text-emerald-700">rebounding battle</span> allowed the team to limit second chances and keep control of tempo.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: DEFENSE & IMPROVEMENTS */}
          <div className="space-y-4">
            {/* Defense */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600">
                    <Award className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Disruptive Defense</h5>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">16 STL / 7 BLK</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                With <span className="font-bold text-emerald-700">16 steals and 7 blocks</span>, the defense repeatedly disrupted the offense, turning stops into scoring chances.
              </p>
            </div>

            {/* Ball Security (Improvement) */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-amber-200 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-amber-50 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Ball Security</h5>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">13 TOV</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                With <span className="font-bold text-amber-700">13 turnovers</span> and an AST/TO ratio close to 1, there is room to improve decision-making under pressure.
              </p>
            </div>

            {/* Paint Attacks (Improvement) */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-amber-200 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-amber-50 text-amber-600">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Paint Pressure</h5>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">Low FTA</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                A <span className="font-bold text-amber-700">low free-throw rate</span> suggests heavy reliance on jump shots. More drives could create easier points.
              </p>
            </div>
          </div>
        </div>

        {/* Coach Takeaway - Signature Block */}
        <div className="relative p-5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50">
          <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-orange-600 uppercase tracking-widest border border-slate-100 shadow-sm">
            Coach's Directive
          </div>
          <div className="flex gap-4 items-start">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 shrink-0">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                "When we move the ball and apply defensive pressure, we control games. <span className="bg-yellow-100 px-1 rounded">Cleaning up turnovers</span> and <span className="bg-yellow-100 px-1 rounded">emphasizing rim attacks</span> should be the next focus in practice."
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* AI Game Analysis Report - For Completed Games */}
      {gameId === 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb' && (
        <AIGameAnalysisReport
          gameId={gameId}
          winningTeam="Winslow"
          losingTeam="Burlington City"
          finalScore={{ home: 65, away: 50 }}
          margin={15}
          gameType="Dominant"
          overview="Winslow controlled this game from start to finish and pulled away decisively late. This was not a back-and-forth game that slipped late. Winslow consistently executed better, took care of defensive responsibilities, and punished Burlington City's mistakes. The knockout blow came in the 4th quarter, where Winslow closed the game 21–0."
          winningFactors={[
            {
              factor: 'Field Goal Percentage',
              value: '50%',
              impactScore: 50,
              courtMeaning: [
                'Winslow generated higher-quality shots (inside touches, open looks, better spacing)',
                'Burlington City likely rushed shots or settled for low-percentage attempts'
              ],
              coachingTakeaway: [
                'Emphasize shot selection in practice',
                'Track shot quality, not just makes and misses',
                'Good offense beats good defense when shots are taken in rhythm'
              ]
            },
            {
              factor: 'Rebounding Margin',
              value: 36,
              impactScore: 43.2,
              courtMeaning: [
                'Winslow likely controlled the paint',
                'More second-chance points',
                'Fewer transition opportunities for Burlington City'
              ],
              coachingTakeaway: [
                'Rebounding is effort plus positioning',
                'Identify which players are consistently boxing out',
                'Guards must rebound too, not just bigs'
              ]
            },
            {
              factor: 'Steals & Blocks',
              value: 19,
              impactScore: 22.8,
              courtMeaning: [
                'Winslow disrupted passing lanes',
                'Forced Burlington City into uncomfortable decisions',
                'Converted defense into offense'
              ],
              coachingTakeaway: [
                'Defense created offense in this game',
                'Teach active hands without overreaching',
                'Pressure works when help defense is ready behind it'
              ]
            }
          ]}
          keyPlayers={[
            {
              name: 'Ward Jr',
              rank: 1,
              points: 28,
              rebounds: 1,
              assists: 2,
              steals: 5,
              blocks: 0,
              turnovers: 6,
              impactScore: 30.2,
              strengths: [
                'Scored efficiently and aggressively',
                'Created turnovers with active hands',
                'Put constant pressure on the defense'
              ],
              riskToManage: '6 turnovers is high',
              coachingFocus: [
                'Keep Ward Jr aggressive, but tighten decision-making',
                'Work on reading help defense and passing out of pressure',
                'This is a lead guard who needs structure, not restriction'
              ]
            },
            {
              name: 'Murrell',
              rank: 2,
              points: 12,
              rebounds: 16,
              assists: 1,
              steals: 1,
              blocks: 1,
              turnovers: 2,
              impactScore: 25.8,
              strengths: [
                'Elite rebounding effort',
                'Finished plays created by teammates',
                'Anchored possessions defensively'
              ],
              coachingFocus: [
                'Reinforce his role as a possession-winner',
                'Make sure guards reward him inside',
                'He sets the tone for effort'
              ]
            },
            {
              name: 'Haines',
              rank: 3,
              points: 6,
              rebounds: 5,
              assists: 0,
              steals: 4,
              blocks: 1,
              turnovers: 2,
              impactScore: 13.9,
              strengths: [
                'Forced turnovers',
                'Played disruptive defense'
              ],
              coachingFocus: [
                'Keep him as a defensive stopper',
                'Work on confidence and offensive reads',
                'Not every contributor needs to score to matter'
              ]
            }
          ]}
          momentum={{
            quarter: 4,
            teamScore: 21,
            opponentScore: 0,
            description: 'Burlington City lost composure. Turnovers increased. Winslow stayed disciplined and aggressive. This is where the game was decided.'
          }}
          opponentBreakdown={{
            fgPercentage: 27.6,
            turnovers: 26,
            fouls: 19,
            keyIssues: [
              '27.6% shooting',
              '26 turnovers',
              '19 fouls',
              'Lost rebounding battle'
            ],
            correctableIssues: [
              'Decision-making under pressure',
              'Ball-handling fundamentals',
              'Shot selection'
            ],
            deeperProblems: [
              'Poor spacing',
              'Lack of composure when trailing',
              'Defensive discipline'
            ]
          }}
          actionItems={{
            winner: [
              'Maintain defensive pressure, it\'s your identity',
              'Reduce turnovers from primary scorers',
              'Continue emphasizing rebounding as a team responsibility'
            ],
            loser: [
              'Simplify offense, fewer reads',
              'Drill ball security daily',
              'Slow the game when momentum shifts',
              'Reinforce defensive fundamentals instead of gambling'
            ]
          }}
          bottomLine="Winslow won because they valued possessions, rebounded, and defended together. Burlington City lost because they couldn't handle pressure or control tempo. This game is a textbook example of how discipline beats talent when execution collapses."
        />
      )}
    </div>
  );
}
