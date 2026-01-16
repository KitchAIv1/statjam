/**
 * AICoachAnalysis - Dynamic AI Analysis Component
 * 
 * PURPOSE: Display AI-generated game analysis from Edge Function
 * Follows .cursorrules: <400 lines, modular design
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle, Trophy, Shield, Zap, RefreshCw } from 'lucide-react';
import { AIAnalysisService, type AIAnalysisData } from '@/lib/services/aiAnalysisService';

interface AICoachAnalysisProps {
  gameId: string;
}

export function AICoachAnalysis({ gameId }: AICoachAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceRefresh) {
        await AIAnalysisService.clearCache(gameId);
      }
      
      const data = await AIAnalysisService.getAnalysis(gameId);
      if (data) {
        setAnalysis(data);
      } else {
        setError('Analysis not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [gameId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Generating AI Analysis...</h3>
        <p className="text-gray-500">This may take 10-15 seconds</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-8 text-center">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">AI Analysis Not Available</h3>
        <p className="text-gray-500 mb-4">{error || 'Analysis could not be generated.'}</p>
        <button 
          onClick={() => fetchAnalysis(true)}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 min-h-full">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8" />
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-bold text-orange-400 uppercase tracking-wide">AI Coach Analysis</span>
            </div>
            <p className="text-white/80 text-sm">Powered by StatJam Intelligence</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-orange-400">{analysis.bottomLine.grade}</div>
            <div className="text-xs text-gray-400">GAME GRADE</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {analysis.gameOverview && <GameOverviewSection data={analysis.gameOverview} />}
        {analysis.winningFactors && <WinningFactorsSection factors={analysis.winningFactors} />}
        {analysis.keyPlayers && <KeyPlayersSection players={analysis.keyPlayers} />}
        {analysis.quarterAnalysis && <QuarterAnalysisSection data={analysis.quarterAnalysis} />}
        {analysis.actionItems && <CoachActionItemsSection items={analysis.actionItems} />}
        {analysis.bottomLine && <BottomLineSection data={analysis.bottomLine} />}
      </div>
    </div>
  );
}

function GameOverviewSection({ data }: { data: AIAnalysisData['gameOverview'] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          Game Overview
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">{data.narrative}</p>
        <div className="bg-gray-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-gray-900">Key Insight</span>
          </div>
          <p className="text-gray-700 text-sm">{data.keyInsight}</p>
        </div>
      </div>
    </div>
  );
}

function WinningFactorsSection({ factors }: { factors: AIAnalysisData['winningFactors'] }) {
  const icons = [Zap, Target, TrendingUp, Shield];
  
  if (!factors || factors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-gray-700" />
          Winning Factors
        </h2>
        <div className="space-y-4">
          {factors.map((factor, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-white text-gray-700 border border-gray-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{factor.title}</h3>
                    <span className="text-sm font-semibold text-orange-600">{factor.value}</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">On the Court</p>
                    <ul className="space-y-1">
                      {factor.onCourt.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400" />
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

function KeyPlayersSection({ players }: { players: AIAnalysisData['keyPlayers'] }) {
  if (!players || players.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          Key Player Impact
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {players.map((player, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-lg">
                      #{player.jersey}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{player.name}</h3>
                        {player.badge && (
                          <span className="text-xs bg-orange-500/20 px-2 py-0.5 rounded-full">{player.badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">{player.stats}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-orange-400">{player.impact}</div>
                    <div className="text-xs text-gray-400">IMPACT</div>
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Strengths</p>
                  <ul className="space-y-1">
                    {player.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-gray-700 flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Risk to Manage</p>
                  <ul className="space-y-1">
                    {player.risks.slice(0, 2).map((r, i) => (
                      <li key={i} className="text-gray-700 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {player.focus.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Focus Areas</p>
                    <ul className="space-y-1">
                      {player.focus.slice(0, 2).map((f, i) => (
                        <li key={i} className="text-gray-700 flex items-start gap-1">
                          <Target className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuarterAnalysisSection({ data }: { data: AIAnalysisData['quarterAnalysis'] }) {
  // Defensive check for missing data
  if (!data || !data.quarters) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-700" />
          Quarter-by-Quarter Analysis
        </h2>
        
        {data.pattern && (
          <p className="text-gray-600 mb-4 text-sm italic">{data.pattern}</p>
        )}
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {data.quarters.map((q) => (
            <div 
              key={q.q} 
              className={`p-3 rounded-lg text-center ${
                q.status === 'win' 
                  ? 'bg-orange-50 border-2 border-orange-300' 
                  : q.status === 'loss' 
                    ? 'bg-gray-100 border border-gray-300' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="font-bold text-gray-700">{q.q}</div>
              <div className="text-lg font-black text-gray-900">{q.team}-{q.opp}</div>
              <div className={`text-sm font-semibold ${
                q.status === 'win' 
                  ? 'text-orange-600' 
                  : q.status === 'loss' 
                    ? 'text-gray-500' 
                    : 'text-gray-400'
              }`}>
                {q.diff}
              </div>
            </div>
          ))}
        </div>

        {(data.bestQuarter.reason || data.worstQuarter.reason) && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {data.bestQuarter.reason && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-gray-800">Best: {data.bestQuarter.q} ({data.bestQuarter.margin})</span>
                </div>
                <p className="text-sm text-gray-600">{data.bestQuarter.reason}</p>
              </div>
            )}
            {data.worstQuarter.reason && (
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-800">Struggled: {data.worstQuarter.q} ({data.worstQuarter.margin})</span>
                </div>
                <p className="text-sm text-gray-600">{data.worstQuarter.reason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CoachActionItemsSection({ items }: { items: AIAnalysisData['actionItems'] }) {
  const priorityStyles: Record<string, { bg: string; text: string; dot: string }> = {
    critical: { bg: 'bg-orange-50', text: 'text-gray-900', dot: 'bg-orange-500' },
    important: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-600' },
    monitor: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          Coach Action Items
        </h2>
        <div className="space-y-2">
          {items.map((item, idx) => {
            const styles = priorityStyles[item.priority] || priorityStyles.monitor;
            return (
              <div key={idx} className={`${styles.bg} rounded-lg p-3 flex items-center gap-3 border border-gray-200`}>
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

function BottomLineSection({ data }: { data: AIAnalysisData['bottomLine'] }) {
  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 text-white">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-orange-400" />
          Bottom Line
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">{data.summary}</p>
        
        {(data.goodNews || data.badNews) && (
          <div className="space-y-1 mb-4">
            {data.goodNews && (
              <p className="text-sm text-gray-400">
                <span className="text-orange-400 font-medium">The good news:</span> {data.goodNews.replace(/^The good news:\s*/i, '')}
              </p>
            )}
            {data.badNews && (
              <p className="text-sm text-gray-400">
                <span className="text-gray-300 font-medium">The bad news:</span> {data.badNews.replace(/^The bad news:\s*/i, '')}
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Analysis complete • Powered by StatJam AI
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-orange-400">{data.grade}</div>
            <div className="text-xs text-gray-400">GRADE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
