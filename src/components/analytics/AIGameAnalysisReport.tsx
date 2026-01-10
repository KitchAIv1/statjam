/**
 * AIGameAnalysisReport - AI-Generated Game Analysis for Coaches
 * 
 * PURPOSE: Display comprehensive AI-generated game analysis
 * in a beautiful, structured format for coaches.
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  Trophy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Shield,
  Activity
} from 'lucide-react';

interface PlayerImpact {
  name: string;
  rank: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  impactScore: number;
  strengths: string[];
  riskToManage?: string;
  coachingFocus: string[];
}

interface WinningFactor {
  factor: string;
  value: number | string;
  impactScore: number;
  courtMeaning: string[];
  coachingTakeaway: string[];
}

interface AIGameAnalysisReportProps {
  gameId: string;
  winningTeam: string;
  losingTeam: string;
  finalScore: { home: number; away: number };
  margin: number;
  gameType: string;
  overview: string;
  winningFactors: WinningFactor[];
  keyPlayers: PlayerImpact[];
  momentum: {
    quarter: number;
    teamScore: number;
    opponentScore: number;
    description: string;
  };
  opponentBreakdown: {
    fgPercentage: number;
    turnovers: number;
    fouls: number;
    keyIssues: string[];
    correctableIssues: string[];
    deeperProblems: string[];
  };
  actionItems: {
    winner: string[];
    loser: string[];
  };
  bottomLine: string;
}

export function AIGameAnalysisReport({
  winningTeam,
  losingTeam,
  finalScore,
  margin,
  gameType,
  overview,
  winningFactors,
  keyPlayers,
  momentum,
  opponentBreakdown,
  actionItems,
  bottomLine
}: AIGameAnalysisReportProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'factors', 'players'])
  );

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const SectionHeader = ({ 
    id, 
    icon: Icon, 
    title, 
    color = 'text-orange-600' 
  }: { 
    id: string; 
    icon: React.ElementType; 
    title: string; 
    color?: string;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors mb-2"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      {expandedSections.has(id) ? (
        <ChevronUp className="w-5 h-5 text-slate-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );

  return (
    <div className="space-y-4 mt-6">
      {/* AI Analysis Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">AI Coach Analysis</h2>
          <p className="text-sm text-slate-500">Powered by StatJam Intelligence</p>
        </div>
      </div>

      {/* Game Overview */}
      <SectionHeader id="overview" icon={Trophy} title="Game Overview" />
      {expandedSections.has('overview') && (
        <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-lg border border-slate-200 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-black text-orange-600">{finalScore.home}</div>
              <div className="text-sm font-medium text-slate-600">{winningTeam}</div>
            </div>
            <div className="text-slate-400 text-lg">vs</div>
            <div className="text-center">
              <div className="text-3xl font-black text-slate-400">{finalScore.away}</div>
              <div className="text-sm font-medium text-slate-600">{losingTeam}</div>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                gameType === 'Dominant' ? 'bg-emerald-100 text-emerald-700' :
                gameType === 'Controlled' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {gameType} (+{margin})
              </span>
            </div>
          </div>
          <p className="text-slate-700 leading-relaxed">{overview}</p>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm font-medium text-orange-800">
              <strong>Key Insight:</strong> This game was won through execution and discipline, not just scoring talent.
            </p>
          </div>
        </div>
      )}

      {/* Winning Factors */}
      <SectionHeader id="factors" icon={Target} title="Winning Factors" />
      {expandedSections.has('factors') && (
        <div className="space-y-3 mb-4">
          {winningFactors.map((factor, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-slate-800">{factor.factor}</h4>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">
                  {typeof factor.value === 'number' && factor.value > 0 ? '+' : ''}{factor.value}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">On the Court</p>
                  <ul className="text-slate-600 space-y-1">
                    {factor.courtMeaning.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Coaching Takeaway</p>
                  <ul className="text-slate-700 font-medium space-y-1">
                    {factor.coachingTakeaway.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Player Impact */}
      <SectionHeader id="players" icon={Users} title="Key Player Impact" />
      {expandedSections.has('players') && (
        <div className="space-y-3 mb-4">
          {/* IMPACT Formula Explanation */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-purple-800 text-sm mb-1">How IMPACT Score is Calculated</h4>
                <p className="text-xs text-purple-700 font-mono bg-white/50 px-2 py-1 rounded mb-2">
                  IMPACT = PTS + (1.2 × REB) + (1.5 × AST) + (2 × STL) + (2 × BLK) - TO - (0.5 × FOULS)
                </p>
                <ul className="text-xs text-purple-600 space-y-0.5">
                  <li>• <strong>Rebounds (1.2×)</strong> — Possessions matter, boards create opportunities</li>
                  <li>• <strong>Assists (1.5×)</strong> — Playmaking generates efficient offense</li>
                  <li>• <strong>Steals & Blocks (2×)</strong> — High-value defensive plays that change games</li>
                  <li>• <strong>Turnovers & Fouls</strong> — Penalties for giving up possessions</li>
                </ul>
              </div>
            </div>
          </div>
          
          {keyPlayers.map((player, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    #{player.rank}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800">{player.name}</h4>
                    <p className="text-xs text-slate-500">
                      {player.points} PTS, {player.rebounds} REB, {player.assists} AST, {player.steals} STL
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-purple-600">
                  Impact: {player.impactScore}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-emerald-700 font-medium text-xs uppercase mb-1">Strengths</p>
                  <ul className="text-emerald-800 space-y-1">
                    {player.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                
                {player.riskToManage && (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-amber-700 font-medium text-xs uppercase mb-1">Risk to Manage</p>
                    <p className="text-amber-800">{player.riskToManage}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-slate-500 font-medium text-xs uppercase mb-1">Coaching Focus</p>
                <ul className="text-slate-700 text-sm space-y-1">
                  {player.coachingFocus.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500">→</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Momentum & Turning Point */}
      <SectionHeader id="momentum" icon={Activity} title="Momentum & Turning Point" />
      {expandedSections.has('momentum') && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
              Q{momentum.quarter}
            </span>
            <span className="text-2xl font-black text-purple-700">
              {momentum.teamScore} - {momentum.opponentScore}
            </span>
          </div>
          <p className="text-purple-800">{momentum.description}</p>
          <div className="mt-3 p-3 bg-white/70 rounded-lg">
            <p className="text-sm text-purple-700">
              <strong>Coaching Takeaway:</strong> Conditioning and mental toughness matter late. 
              Execution under pressure separates good teams from great ones.
            </p>
          </div>
        </div>
      )}

      {/* Opponent Breakdown */}
      <SectionHeader id="opponent" icon={Shield} title={`Opponent Analysis: ${losingTeam}`} color="text-red-600" />
      {expandedSections.has('opponent') && (
        <div className="bg-red-50/50 p-5 rounded-lg border border-red-200 mb-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-red-600">{opponentBreakdown.fgPercentage}%</div>
              <div className="text-xs text-slate-500">FG%</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-red-600">{opponentBreakdown.turnovers}</div>
              <div className="text-xs text-slate-500">Turnovers</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-red-600">{opponentBreakdown.fouls}</div>
              <div className="text-xs text-slate-500">Fouls</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-amber-700 font-medium text-xs uppercase mb-2">Correctable Issues</p>
              <ul className="space-y-1 text-slate-700">
                {opponentBreakdown.correctableIssues.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-red-700 font-medium text-xs uppercase mb-2">Deeper Problems</p>
              <ul className="space-y-1 text-slate-700">
                {opponentBreakdown.deeperProblems.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Items */}
      <SectionHeader id="actions" icon={Crosshair} title="Coach Action Items" />
      {expandedSections.has('actions') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              For {winningTeam} Coaches
            </h4>
            <ul className="space-y-2 text-sm text-emerald-700">
              {actionItems.winner.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              For {losingTeam} Coaches
            </h4>
            <ul className="space-y-2 text-sm text-amber-700">
              {actionItems.loser.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bottom Line */}
      <div className="relative p-5 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="absolute -top-3 left-4 px-3 py-1 bg-orange-500 text-white text-xs font-bold uppercase tracking-widest rounded">
          Bottom Line
        </div>
        <p className="text-lg font-medium leading-relaxed mt-2">{bottomLine}</p>
      </div>
    </div>
  );
}

