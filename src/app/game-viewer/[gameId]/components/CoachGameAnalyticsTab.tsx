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

      {/* AI Game Analysis Report - Winslow vs Vorhees (75-59) */}
      {gameId === '7c04dbb2-47c5-4b74-bdb4-640b8b09e207' && (
        <AIGameAnalysisReport
          gameId={gameId}
          winningTeam="Winslow"
          losingTeam="Vorhees"
          finalScore={{ home: 75, away: 59 }}
          margin={16}
          gameType="Dominant"
          overview="Winslow controlled this game through sheer physicality. Despite committing 25 turnovers—a number that would doom most teams—Winslow's dominance on the glass (54-28 rebounding margin) created so many second-chance opportunities that the turnovers became manageable. The game was decided in Q2 when Winslow outscored Vorhees 20-11 to take control, and they never looked back, closing with a 19-12 fourth quarter to seal the victory."
          winningFactors={[
            {
              factor: 'Rebounding Margin',
              value: '+26',
              impactScore: 31.2,
              courtMeaning: [
                '54 total rebounds vs 28 for Vorhees',
                '22 offensive boards created extra possessions',
                'Limited Vorhees to one-shot possessions'
              ],
              coachingTakeaway: [
                'Rebounding won this game despite turnover issues',
                'Physical presence on the glass is Winslow\'s identity',
                'Continue emphasizing boxing out and pursuit'
              ]
            },
            {
              factor: 'Free Throw Attempts',
              value: '+19',
              impactScore: 20.9,
              courtMeaning: [
                '26 FT attempts vs only 7 for Vorhees',
                'Aggressive driving drew fouls (Vorhees had 20 fouls)',
                'Put Vorhees in foul trouble early'
              ],
              coachingTakeaway: [
                'Attack the paint mentality paid off',
                'Must improve FT% (57.7%) to maximize this advantage',
                'Aggressive offense creates free points'
              ]
            },
            {
              factor: 'Offensive Rebounds',
              value: '+10',
              impactScore: 15.0,
              courtMeaning: [
                '22 offensive boards extended possessions',
                'Second-chance points offset turnover damage',
                'Physical advantage underneath'
              ],
              coachingTakeaway: [
                'Offensive rebounding masked poor ball security',
                'This won\'t work against every opponent',
                'Reduce turnovers AND keep crashing the glass'
              ]
            }
          ]}
          keyPlayers={[
            {
              name: 'Ward Jr',
              rank: 1,
              points: 28,
              rebounds: 5,
              assists: 1,
              steals: 1,
              blocks: 0,
              turnovers: 8,
              impactScore: 25.9,
              strengths: [
                'Dominant scoring performance (28 points)',
                'Drew fouls and got to the line',
                'Took over when Winslow needed buckets'
              ],
              riskToManage: '8 turnovers is very high',
              coachingFocus: [
                'Continue aggressive scoring mentality',
                'Work on decision-making under pressure',
                'Reduce careless turnovers without losing aggression'
              ]
            },
            {
              name: 'Murrell',
              rank: 2,
              points: 9,
              rebounds: 16,
              assists: 1,
              steals: 1,
              blocks: 0,
              turnovers: 2,
              impactScore: 21.7,
              strengths: [
                'Elite rebounding effort (16 boards!)',
                'Controlled the paint defensively',
                'Efficient with low turnover count'
              ],
              coachingFocus: [
                'Continue as the anchor on the glass',
                'Look for more scoring opportunities inside',
                'His effort sets the tone for the team'
              ]
            },
            {
              name: 'DeGrais',
              rank: 3,
              points: 12,
              rebounds: 7,
              assists: 2,
              steals: 6,
              blocks: 2,
              turnovers: 7,
              impactScore: 21.4,
              strengths: [
                'Defensive playmaker (6 steals, 2 blocks)',
                'Created turnovers and disrupted offense',
                'Versatile two-way contributor'
              ],
              riskToManage: '7 turnovers offensively',
              coachingFocus: [
                'Keep the defensive intensity',
                'Simplify offensive decisions',
                'His defense creates offense for teammates'
              ]
            }
          ]}
          momentum={{
            quarter: 2,
            teamScore: 20,
            opponentScore: 11,
            description: 'After a tight first quarter (13-14), Winslow exploded in Q2 with a 20-11 run. Vorhees started picking up fouls trying to stop paint attacks, and Winslow\'s offensive rebounding extended possessions. By halftime, Winslow led and never trailed again.'
          }}
          opponentBreakdown={{
            fgPercentage: 34.2,
            turnovers: 18,
            fouls: 20,
            keyIssues: [
              '34.2% shooting from the field',
              'Outrebounded by 26',
              '20 fouls committed',
              'Over-reliant on 3-pointers (32 attempts, 31.3%)'
            ],
            correctableIssues: [
              'Shot selection and patience',
              'Boxing out fundamentals',
              'Foul discipline'
            ],
            deeperProblems: [
              'Physical disadvantage on the glass',
              'Lack of paint presence',
              'No answer for Winslow\'s aggression'
            ]
          }}
          actionItems={{
            winner: [
              'Maintain rebounding intensity—it\'s your identity',
              'Address turnover issue (25 is too many)',
              'Improve free throw shooting (57.7% leaves points)',
              'Keep attacking the paint and drawing fouls'
            ],
            loser: [
              'Develop paint scoring presence',
              'Improve rebounding fundamentals',
              'Better foul discipline',
              'More balanced shot selection (less 3-point reliant)'
            ]
          }}
          bottomLine="Winslow won this game on the glass. 54 rebounds—including 22 offensive boards—created enough second-chance opportunities to overcome 25 turnovers. When you dominate the boards by 26 and draw 26 free throws, you can survive mistakes. But this game is also a warning: turnovers will cost you against better teams. Clean up the ball handling, keep crashing the boards, and this team can beat anyone."
        />
      )}

      {/* AI Game Analysis Report - Winslow vs Medford (47-43) COMEBACK */}
      {gameId === '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98' && (
        <AIGameAnalysisReport
          gameId={gameId}
          winningTeam="Winslow Township 7th Grade"
          losingTeam="Medford"
          finalScore={{ home: 47, away: 43 }}
          margin={4}
          gameType="Comeback"
          overview="Winslow pulled off a gutsy comeback after a disastrous first quarter. Down 2-12 after Q1, Winslow's defense tightened and their rebounding took over. The turning point came in the 4th quarter when Winslow outscored Medford 15-6 to complete the comeback. This was a character win—Winslow found a way when their shots weren't falling (21.7% from three). Murrell's 18 rebounds and the team's 14 offensive boards created second chances that kept them alive."
          winningFactors={[
            {
              factor: '4th Quarter Dominance',
              value: '15-6',
              impactScore: 35.0,
              courtMeaning: [
                'Outscored Medford 15-6 in the final quarter',
                'Closed the game on a run when it mattered most',
                'Defensive intensity peaked at the right time'
              ],
              coachingTakeaway: [
                'This team has closer mentality',
                'Conditioning paid off in crunch time',
                'Trust the defense to create offense'
              ]
            },
            {
              factor: 'Rebounding Margin',
              value: '+6',
              impactScore: 28.0,
              courtMeaning: [
                '37 total rebounds vs 31 for Medford',
                '14 offensive boards created second-chance points',
                'Controlled the glass despite poor shooting'
              ],
              coachingTakeaway: [
                'Offensive rebounding saved this game',
                'Murrell (18 rebounds) was the difference maker',
                'Keep crashing—it covers shooting slumps'
              ]
            },
            {
              factor: 'Turnovers Forced',
              value: '+4',
              impactScore: 22.0,
              courtMeaning: [
                'Medford committed 19 turnovers vs Winslow 15',
                'Pressure defense disrupted Medford rhythm',
                'DeGrais (5 steals) led the disruption'
              ],
              coachingTakeaway: [
                'Defensive pressure creates comeback opportunities',
                'Active hands and ball pressure work',
                'Still need to reduce own turnovers (15 is high)'
              ]
            }
          ]}
          keyPlayers={[
            {
              name: 'Murrell',
              rank: 1,
              points: 4,
              rebounds: 18,
              assists: 0,
              steals: 0,
              blocks: 2,
              turnovers: 4,
              impactScore: 23.6,
              strengths: [
                'ELITE rebounding (18 boards!)',
                'Dominated the glass on both ends',
                '2 blocks on defensive end'
              ],
              coachingFocus: [
                'Keep being the anchor on the boards',
                'Look for putbacks on offensive rebounds',
                'This effort sets the tone for the team'
              ]
            },
            {
              name: 'DeGrais',
              rank: 2,
              points: 8,
              rebounds: 3,
              assists: 2,
              steals: 5,
              blocks: 0,
              turnovers: 2,
              impactScore: 21.6,
              strengths: [
                'Defensive playmaker (5 steals!)',
                'Created turnovers and disrupted passing lanes',
                'Efficient with only 2 turnovers'
              ],
              coachingFocus: [
                'Keep the defensive pressure up',
                'Look to push pace after steals',
                'Model for teammates on ball pressure'
              ]
            },
            {
              name: 'Ward Jr',
              rank: 3,
              points: 16,
              rebounds: 2,
              assists: 2,
              steals: 1,
              blocks: 1,
              turnovers: 3,
              impactScore: 20.9,
              strengths: [
                'Leading scorer with 16 points',
                'Stepped up when team needed buckets',
                'All-around game with blocks and steals'
              ],
              coachingFocus: [
                'Continue being the go-to scorer',
                'Look for Murrell on offensive boards',
                'Reduce turnovers in crunch time'
              ]
            }
          ]}
          momentum={{
            quarter: 4,
            teamScore: 15,
            opponentScore: 6,
            description: 'After trailing most of the game following a 2-12 first quarter, Winslow finally took control in the 4th. The defense clamped down, holding Medford to just 6 points while the offense found its rhythm. Ward Jr and Thorton combined for key buckets, and Murrell cleaned up on the boards. This was a complete team effort to close out a must-win quarter.'
          }}
          opponentBreakdown={{
            fgPercentage: 35.5,
            turnovers: 19,
            fouls: 17,
            keyIssues: [
              '19 turnovers killed offensive possessions',
              'Only 6 points in 4th quarter collapse',
              '17 fouls put Winslow in bonus'
            ],
            correctableIssues: [
              'Ball security and passing decisions',
              'Foul discipline in late-game situations',
              'Closing intensity and execution'
            ],
            deeperProblems: [
              'Struggled to score against Winslow defense late',
              'Rebounding disadvantage limited second chances',
              'No answer for Winslow 4th quarter run'
            ]
          }}
          actionItems={{
            winner: [
              'Start faster—can\'t rely on comebacks every game',
              'Improve 3PT shooting (21.7% won\'t cut it)',
              'Improve FT shooting (44.4% leaves points)',
              'Maintain rebounding intensity—it saved this game'
            ],
            loser: [
              'Protect the ball—19 turnovers is too many',
              'Finish games—6 points in Q4 is unacceptable',
              'Better foul discipline late in games',
              'Develop plan for opponents\' dominant rebounders'
            ]
          }}
          bottomLine="This was a character win for Winslow. Down 10 after the first quarter with shots not falling, they relied on what they could control: effort, rebounding, and defense. Murrell's 18 rebounds and DeGrais' 5 steals kept them in it, and Ward Jr's 16 points sealed it. The 4th quarter 15-6 run shows this team can close. But the poor shooting (21.7% from three, 44.4% from the line) and slow start are concerns. This team wins ugly—now they need to learn to win clean."
        />
      )}

      {/* AI Game Analysis Report - Winslow vs Pemberton Home (64-42) DOMINANT */}
      {gameId === '46f5866b-426f-4a3f-a37d-ce41d5a2631d' && (
        <AIGameAnalysisReport
          gameId={gameId}
          winningTeam="Winslow Township 7th Grade"
          losingTeam="Pemberton"
          finalScore={{ home: 64, away: 42 }}
          margin={22}
          gameType="Dominant"
          overview="Winslow Township delivered a complete performance against Pemberton, winning by 22 points in a game that showcased their defensive prowess and balanced scoring. The team forced an incredible 28 turnovers while committing only 14, creating a +14 turnover margin that defined the game. After a slight third-quarter lapse where they were outscored 19-13, Winslow responded with a dominant 19-7 fourth quarter to put the game away."
          winningFactors={[
            {
              factor: 'Turnover Margin',
              value: '+14',
              impactScore: 38.0,
              courtMeaning: [
                'Forced 28 turnovers from Pemberton',
                '18 steals created easy transition opportunities',
                'Suffocating defensive pressure all game'
              ],
              coachingTakeaway: [
                'Defensive intensity is a team identity',
                'Continue emphasizing active hands and ball pressure',
                'Convert turnovers to points more consistently'
              ]
            },
            {
              factor: 'Rebounding Margin',
              value: '+9',
              impactScore: 28.0,
              courtMeaning: [
                '41 total rebounds vs 32 for Pemberton',
                'Dominated the glass on both ends',
                'Multiple players with double-digit boards'
              ],
              coachingTakeaway: [
                'Rebounding is a consistent strength',
                'Haines and Murrell anchor the interior',
                'Second-chance points are a key advantage'
              ]
            },
            {
              factor: '4th Quarter Dominance',
              value: '+12',
              impactScore: 25.0,
              courtMeaning: [
                'Outscored Pemberton 19-7 in final quarter',
                'Responded to Q3 adversity with intensity',
                'Closed the game with authority'
              ],
              coachingTakeaway: [
                'Team shows ability to finish strong',
                'Mental toughness after Q3 lapse is encouraging',
                'Build on closing mentality'
              ]
            }
          ]}
          keyPlayers={[
            {
              name: 'DeGrais',
              rank: 1,
              points: 18,
              rebounds: 8,
              assists: 2,
              steals: 7,
              blocks: 1,
              turnovers: 4,
              fouls: 2,
              impactScore: 32.5,
              strengths: [
                'Team-high 18 points with efficiency',
                'Defensive menace with 7 steals',
                'Contributed 8 rebounds for versatility'
              ],
              riskToManage: '4 turnovers need attention',
              coachingFocus: [
                'Continue aggressive defensive play',
                'Reduce turnovers with better decisions',
                'All-around threat when engaged'
              ]
            },
            {
              name: 'Ward Jr',
              rank: 2,
              points: 16,
              rebounds: 0,
              assists: 6,
              steals: 3,
              blocks: 0,
              turnovers: 3,
              fouls: 1,
              impactScore: 28.0,
              strengths: [
                'Efficient 16 points as secondary scorer',
                'Team-high 6 assists running offense',
                '3 steals contributing to defensive effort'
              ],
              riskToManage: 'Need to crash boards more',
              coachingFocus: [
                'Continue playmaking excellence',
                'Add rebounding to complete game',
                'Floor general role suits him well'
              ]
            },
            {
              name: 'Murrell',
              rank: 3,
              points: 10,
              rebounds: 14,
              assists: 1,
              steals: 1,
              blocks: 1,
              turnovers: 2,
              fouls: 4,
              impactScore: 26.0,
              strengths: [
                'Dominant 14 rebounds (double-double!)',
                'Anchored the paint defensively',
                'Consistent force on the glass'
              ],
              riskToManage: 'Foul trouble (4 fouls)',
              coachingFocus: [
                'Continue being the rebounding anchor',
                'Stay out of foul trouble',
                'Expand offensive game around the basket'
              ]
            },
            {
              name: 'Haines',
              rank: 4,
              points: 9,
              rebounds: 10,
              assists: 1,
              steals: 3,
              blocks: 1,
              turnovers: 0,
              fouls: 3,
              impactScore: 24.5,
              strengths: [
                'Double-double with 9 pts, 10 reb!',
                'Zero turnovers—exceptional ball security',
                'Contributed 3 steals and a block'
              ],
              riskToManage: 'Continue developing offensive game',
              coachingFocus: [
                'Reliable presence in the paint',
                'Model for turnover-free play',
                'Build on scoring confidence'
              ]
            },
            {
              name: 'Scott',
              rank: 5,
              points: 4,
              rebounds: 3,
              assists: 1,
              steals: 3,
              blocks: 2,
              turnovers: 2,
              fouls: 0,
              impactScore: 18.0,
              strengths: [
                'Team-high 2 blocks protecting the rim',
                '3 steals showing quick hands',
                'No fouls—disciplined defender'
              ],
              riskToManage: 'Need more offensive involvement',
              coachingFocus: [
                'Defensive specialist role is valuable',
                'Look for more scoring opportunities',
                'Continue shot-blocking presence'
              ]
            }
          ]}
          momentum={{
            quarter: 4,
            teamScore: 19,
            opponentScore: 7,
            description: 'After being outscored 19-13 in the third quarter, Winslow responded emphatically in the fourth. The defense locked down completely, holding Pemberton to just 7 points while the offense found its rhythm. This closing run demonstrated the team\'s ability to respond to adversity and finish games strong. The balanced attack and suffocating defense put the game out of reach.'
          }}
          opponentBreakdown={{
            fgPercentage: 32.0,
            turnovers: 28,
            fouls: 15,
            keyIssues: [
              '28 turnovers led to easy Winslow points',
              'Only 5 assists shows lack of ball movement',
              'Outrebounded 41-32 limited second chances'
            ],
            correctableIssues: [
              'Ball security and passing decisions',
              'Offensive execution and patience',
              'Transition defense after turnovers'
            ],
            deeperProblems: [
              'Could not handle Winslow defensive pressure',
              'Lack of playmaking and shot creation',
              'Overwhelmed on the boards'
            ]
          }}
          actionItems={{
            winner: [
              'Maintain defensive intensity—28 forced turnovers is elite',
              'Address Q3 lapse—can\'t allow 19-point quarters',
              'Continue developing balanced scoring attack',
              'Keep crashing the boards—rebounding wins games'
            ],
            loser: [
              'Improve ball security—28 turnovers is unacceptable',
              'Develop better offensive structure and spacing',
              'Work on handling defensive pressure',
              'Need more rebounding effort and positioning'
            ]
          }}
          bottomLine="This was Winslow at their best—suffocating defense, dominant rebounding, and balanced scoring. The 28 forced turnovers and +9 rebounding margin were the story of the game. DeGrais led with 18 points and 7 steals, while Murrell and Haines combined for 24 rebounds. The only concern was the third-quarter lapse where they were outscored 19-13, but the 19-7 fourth quarter response shows this team knows how to finish. When the defense plays like this, Winslow is a tough out for anyone."
        />
      )}
    </div>
  );
}
