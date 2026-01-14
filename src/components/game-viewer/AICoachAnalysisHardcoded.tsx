/**
 * AICoachAnalysisHardcoded - Hardcoded AI Analysis for Burlington City Game
 * 
 * PURPOSE: Display AI-generated game analysis for demo/testing
 * Game: Winslow Township 7th Grade Travel vs Burlington City (65-50)
 * GameId: 06977421-52b9-4543-bab8-6480084c5e45
 * 
 * Follows .cursorrules: Modular components, single responsibility
 */

'use client';

import React from 'react';
import { Brain, Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle, Trophy, Shield, Zap } from 'lucide-react';

interface AICoachAnalysisProps {
  gameId: string;
}

// Only show for this specific game
const SUPPORTED_GAME_ID = '06977421-52b9-4543-bab8-6480084c5e45';

export function AICoachAnalysisHardcoded({ gameId }: AICoachAnalysisProps) {
  if (gameId !== SUPPORTED_GAME_ID) {
    return (
      <div className="p-8 text-center">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">AI Analysis Coming Soon</h3>
        <p className="text-gray-500">AI Coach Analysis is not yet available for this game.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <Sparkles className="w-5 h-5 text-orange-200" />
          <span className="text-sm font-bold text-orange-200 uppercase tracking-wide">AI Coach Analysis</span>
        </div>
        <p className="text-white/80 text-sm">Powered by StatJam Intelligence • 325 stats analyzed</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Game Overview */}
        <GameOverviewSection />
        
        {/* Winning Factors */}
        <WinningFactorsSection />
        
        {/* Key Players */}
        <KeyPlayersSection />
        
        {/* Quarter Analysis */}
        <QuarterAnalysisSection />
        
        {/* Coach Action Items */}
        <CoachActionItemsSection />
        
        {/* Bottom Line */}
        <BottomLineSection />
      </div>
    </div>
  );
}

function GameOverviewSection() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          Game Overview
        </h2>
        
        {/* Score Display */}
        <div className="flex items-center justify-center gap-6 mb-4 py-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-black text-orange-600">65</div>
            <div className="text-sm font-semibold text-gray-700">Winslow Township</div>
          </div>
          <div className="text-gray-400 font-medium">vs</div>
          <div className="text-center">
            <div className="text-4xl font-black text-gray-400">50</div>
            <div className="text-sm font-semibold text-gray-500">Burlington City</div>
          </div>
        </div>
        
        <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
          Dominant (+15)
        </div>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          Winslow Township delivered a tale of two halves, bookending their performance with dominant quarters while surviving a middle-game surge from Burlington City. Ward Jr's 28-point explosion—including 6-for-9 from three—powered the offense, but it was Murrell's double-double (12 points, 14 rebounds) that anchored the win. The team opened with a 17-4 first quarter blitz, lost momentum during a brutal Q2/Q3 stretch (-12 combined), then responded with a 21-7 fourth quarter to slam the door.
        </p>
        
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-orange-700">Key Insight</span>
          </div>
          <p className="text-gray-700 text-sm">
            This game was won in the first and last 8 minutes. Championship teams don't let the middle quarters slip like this.
          </p>
        </div>
      </div>
    </div>
  );
}

function WinningFactorsSection() {
  const factors = [
    {
      icon: Zap,
      title: 'First Quarter Explosion',
      value: '+13 Margin (17-4)',
      color: 'orange',
      onCourt: [
        'Set the tone with 17 first-quarter points',
        'Ward Jr opened with 9 points including early threes',
        'Burlington City held to just 4 points—defensive lockdown'
      ],
      takeaways: [
        'Team responds well to early energy and aggression',
        'First quarter intensity should be the standard every game',
        'Keep starters engaged from tip-off'
      ]
    },
    {
      icon: Target,
      title: 'Fourth Quarter Closer',
      value: '21-7 (+14)',
      color: 'green',
      onCourt: [
        'Outscored Burlington City 21-7 when it mattered most',
        'Ward Jr closed with 10 fourth-quarter points',
        '6-for-8 from the free throw line sealed the win'
      ],
      takeaways: [
        'Team has clutch DNA—they show up when games are on the line',
        'Continue late-game execution drills',
        'Trust Ward Jr as the closer'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Rebounding Dominance',
      value: '32 Total Rebounds',
      color: 'blue',
      onCourt: [
        'Murrell grabbed 14 boards—double-double monster',
        'Thorton (7), DeGrais (6) provided secondary support',
        'Second-chance points kept possessions alive'
      ],
      takeaways: [
        'Rebounding is a core identity—protect this strength',
        'Murrell is the glass-cleaning anchor',
        'Continue box out fundamentals'
      ]
    },
    {
      icon: Shield,
      title: 'Defensive Disruption',
      value: '14 Steals, 3 Blocks',
      color: 'purple',
      onCourt: [
        'Haines (4 STL, 2 BLK) was a defensive menace',
        'Ward Jr (3 STL), DeGrais (3 STL), Scott (3 STL) contributed',
        'Active hands created chaos for Burlington City'
      ],
      takeaways: [
        'Pressure defense is working—keep attacking passing lanes',
        'Haines is the defensive anchor',
        'Build defensive identity around ball pressure'
      ]
    }
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Winning Factors
        </h2>
        
        <div className="space-y-4">
          {factors.map((factor, idx) => {
            const Icon = factor.icon;
            const colors = colorClasses[factor.color];
            return (
              <div key={idx} className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-white ${colors.text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{factor.title}</h3>
                    <span className={`text-sm font-semibold ${colors.text}`}>{factor.value}</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">On the Court</p>
                    <ul className="space-y-1">
                      {factor.onCourt.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Coaching Takeaway</p>
                    <ul className="space-y-1">
                      {factor.takeaways.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700">→ {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KeyPlayersSection() {
  const players = [
    {
      rank: 1,
      name: 'Murrell',
      jersey: 3,
      stats: '12 PTS, 14 REB, 1 AST, 1 STL, 1 BLK',
      impact: 32.3,
      strengths: [
        'Team-high 14 rebounds—absolute glass cleaner',
        '86% from two-point range (6-for-7)—efficient finisher',
        'Zero turnovers in heavy usage',
        'Double-double performance anchored the win'
      ],
      risks: ['0-for-2 from the free throw line', '4 personal fouls put him in foul trouble'],
      focus: ['Player of the Game candidate', 'Continue feeding Murrell in the paint', 'Work on free throw consistency'],
      badge: '🏆 Player of the Game'
    },
    {
      rank: 2,
      name: 'Ward Jr',
      jersey: 4,
      stats: '28 PTS, 0 REB, 2 AST, 3 STL, 0 BLK',
      impact: 31.0,
      strengths: [
        'Team-high 28 points—go-to scorer delivered',
        '67% from three (6-for-9)—unconscious from deep',
        '9 first-quarter points set the tone',
        '10 fourth-quarter points closed the game'
      ],
      risks: ['5 turnovers need immediate attention', '0 rebounds—not engaged on the glass'],
      focus: ['Primary scoring option—feed him when hot', 'Must reduce turnovers (5 is unacceptable)', 'Crash the boards after shots'],
      badge: null
    },
    {
      rank: 3,
      name: 'Haines',
      jersey: 7,
      stats: '6 PTS, 4 REB, 0 AST, 4 STL, 2 BLK',
      impact: 21.8,
      strengths: [
        '4 steals, 2 blocks—defensive anchor',
        'Zero turnovers in 4 quarters of play',
        '100% from free throw line (2-for-2)',
        'All 4 fourth-quarter points came when needed'
      ],
      risks: ['Limited offensive impact (6 points)', 'Only 3 shot attempts'],
      focus: ['Hustle Player of the Game candidate', 'Defensive identity—this is his role', 'Look for more scoring opportunities'],
      badge: '💪 Hustle Player'
    },
    {
      rank: 4,
      name: 'DeGrais',
      jersey: 24,
      stats: '8 PTS, 6 REB, 5 AST, 3 STL, 0 BLK',
      impact: 19.2,
      strengths: [
        'Team-high 5 assists—primary playmaker',
        '6 rebounds from the guard position',
        '3 steals contributing to defensive pressure'
      ],
      risks: ['8 turnovers is unacceptable', '0-for-2 from free throw line', '3 personal fouls'],
      focus: ['Playmaking is valuable—continue running offense through him', 'Must cut turnovers in half (8 → 4 or less)', 'Better decision-making under pressure'],
      badge: null
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          Key Player Impact
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {players.map((player) => (
            <div key={player.rank} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Player Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-lg">
                      #{player.jersey}
                    </div>
                    <div>
                      <h3 className="font-bold">{player.name}</h3>
                      <p className="text-xs text-gray-300">{player.stats}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-orange-400">{player.impact}</div>
                    <div className="text-xs text-gray-400">IMPACT</div>
                  </div>
                </div>
                {player.badge && (
                  <div className="mt-2 inline-block px-2 py-1 bg-orange-500/20 rounded text-xs font-semibold text-orange-300">
                    {player.badge}
                  </div>
                )}
              </div>
              
              {/* Player Details */}
              <div className="p-3 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase mb-1">Strengths</p>
                  <ul className="space-y-1">
                    {player.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-gray-700 flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Risk to Manage</p>
                  <ul className="space-y-1">
                    {player.risks.slice(0, 2).map((r, i) => (
                      <li key={i} className="text-gray-700 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuarterAnalysisSection() {
  const quarters = [
    { q: 'Q1', team: 17, opp: 4, diff: '+13', status: 'win' },
    { q: 'Q2', team: 17, opp: 22, diff: '-5', status: 'loss' },
    { q: 'Q3', team: 10, opp: 17, diff: '-7', status: 'loss' },
    { q: 'Q4', team: 21, opp: 7, diff: '+14', status: 'win' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Quarter-by-Quarter Analysis
        </h2>
        
        {/* Quarter Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quarters.map((q) => (
            <div 
              key={q.q} 
              className={`p-3 rounded-lg text-center ${
                q.status === 'win' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="font-bold text-gray-700">{q.q}</div>
              <div className="text-lg font-black text-gray-900">{q.team}-{q.opp}</div>
              <div className={`text-sm font-semibold ${q.status === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                {q.diff}
              </div>
            </div>
          ))}
        </div>
        
        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-700">Middle Quarter Collapse</span>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Burlington City outscored Winslow by 12 points during Q2 and Q3 combined. The team let off the gas after a dominant start and nearly let the opponent back into the game.
          </p>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-gray-700">Root Causes:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Turnover epidemic (bulk of 19 turnovers came in middle quarters)</li>
              <li>Defensive intensity dropped</li>
              <li>Shot selection became careless</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachActionItemsSection() {
  const items = [
    { priority: 'critical', action: 'Reduce turnovers (19 is far too high)', owner: 'Entire Team' },
    { priority: 'critical', action: "Address DeGrais's 8 turnovers", owner: 'DeGrais' },
    { priority: 'important', action: 'Free throw improvement (55% unacceptable)', owner: 'Ward Jr, DeGrais, Thorton' },
    { priority: 'important', action: 'Maintain intensity through Q2/Q3', owner: 'Entire Team' },
    { priority: 'monitor', action: 'Murrell foul management', owner: 'Murrell' }
  ];

  const priorityStyles: Record<string, { bg: string; text: string; dot: string }> = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    important: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    monitor: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          Coach Action Items
        </h2>
        
        <div className="space-y-2">
          {items.map((item, idx) => {
            const styles = priorityStyles[item.priority];
            return (
              <div key={idx} className={`${styles.bg} rounded-lg p-3 flex items-center gap-3`}>
                <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
                <div className="flex-1">
                  <p className={`font-medium ${styles.text}`}>{item.action}</p>
                  <p className="text-xs text-gray-500">Owner: {item.owner}</p>
                </div>
                <span className={`text-xs font-semibold uppercase ${styles.text}`}>
                  {item.priority}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BottomLineSection() {
  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 text-white">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-orange-400" />
          Bottom Line
        </h2>
        
        <p className="text-gray-300 leading-relaxed mb-4">
          This was a <span className="text-white font-semibold">win of two halves</span> for Winslow Township. They absolutely dominated Q1 (+13) and Q4 (+14), but the middle 16 minutes (-12) exposed a lack of sustained intensity. Ward Jr's 28-point, 6-for-9 three-point performance was spectacular, but his 5 turnovers show there's work to be done. Murrell's 14-rebound, 12-point double-double was the quiet engine that kept the team afloat. The 19 team turnovers are a red flag—against better competition, that's a loss waiting to happen.
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div>
            <p className="text-sm text-gray-400">The good news: When this team is locked in, they're dominant.</p>
            <p className="text-sm text-gray-400">The bad news: They weren't locked in for 16 of the 32 minutes.</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-orange-400">B+</div>
            <div className="text-xs text-gray-400">GRADE</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AICoachAnalysisHardcoded;
