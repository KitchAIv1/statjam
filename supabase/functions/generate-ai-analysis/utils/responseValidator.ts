/**
 * Response Validator - Validate GPT JSON responses
 * 
 * PURPOSE: Ensure AI response matches required structure
 * Follows .cursorrules: <150 lines, single responsibility
 */

export interface AIAnalysisResponse {
  gameOverview: {
    narrative: string;
    keyInsight: string;
    marginCategory: string;
  };
  winningFactors: Array<{
    title: string;
    value: string;
    onCourt: string[];
    takeaways: string[];
  }>;
  keyPlayers: Array<{
    name: string;
    jersey: number;
    stats: string;
    impact: number;
    badge: string | null;
    strengths: string[];
    risks: string[];
    focus: string[];
  }>;
  quarterAnalysis: {
    pattern: string;
    bestQuarter: { q: string; margin: string; reason: string };
    worstQuarter: { q: string; margin: string; reason: string };
    quarters: Array<{
      q: string;
      team: number;
      opp: number;
      diff: string;
      status: string;
    }>;
  };
  actionItems: Array<{
    priority: string;
    action: string;
    owner: string;
  }>;
  bottomLine: {
    summary: string;
    grade: string;
  };
}

export function validateResponse(response: any): {
  valid: boolean;
  sanitized?: AIAnalysisResponse;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    return { valid: false, errors: ['Response is not a valid object'] };
  }

  // Validate required sections
  if (!response.gameOverview) errors.push('Missing gameOverview');
  if (!response.winningFactors) errors.push('Missing winningFactors');
  if (!response.keyPlayers) errors.push('Missing keyPlayers');
  if (!response.quarterAnalysis && !response.quarters) errors.push('Missing quarterAnalysis');
  if (!response.actionItems) errors.push('Missing actionItems');
  if (!response.bottomLine) errors.push('Missing bottomLine');

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Sanitize and validate structure
  const sanitized: AIAnalysisResponse = {
    gameOverview: {
      narrative: response.gameOverview?.narrative || '',
      keyInsight: response.gameOverview?.keyInsight || '',
      marginCategory: response.gameOverview?.marginCategory || 'Competitive',
    },
    winningFactors: Array.isArray(response.winningFactors)
      ? response.winningFactors.slice(0, 4).map((f: any) => ({
          title: f.title || '',
          value: f.value || '',
          onCourt: Array.isArray(f.onCourt) ? f.onCourt.slice(0, 3) : [],
          takeaways: Array.isArray(f.takeaways) ? f.takeaways.slice(0, 3) : [],
        }))
      : [],
    keyPlayers: Array.isArray(response.keyPlayers)
      ? response.keyPlayers.slice(0, 4).map((p: any) => ({
          name: p.name || '',
          jersey: Number(p.jersey) || 0,
          stats: p.stats || '',
          impact: Number(p.impact) || 0,
          badge: p.badge || null,
          strengths: Array.isArray(p.strengths) ? p.strengths.slice(0, 4) : [],
          risks: Array.isArray(p.risks) ? p.risks.slice(0, 2) : [],
          focus: Array.isArray(p.focus) ? p.focus.slice(0, 3) : [],
        }))
      : [],
    quarterAnalysis: sanitizeQuarterAnalysis(response),
    actionItems: Array.isArray(response.actionItems)
      ? response.actionItems.slice(0, 5).map((a: any) => ({
          priority: a.priority || 'monitor',
          action: a.action || '',
          owner: a.owner || 'Entire Team',
        }))
      : [],
    bottomLine: {
      summary: response.bottomLine?.summary || '',
      goodNews: response.bottomLine?.goodNews || '',
      badNews: response.bottomLine?.badNews || '',
      grade: response.bottomLine?.grade || 'B',
    },
  };

  return { valid: true, sanitized };
}

function sanitizeQuarterAnalysis(response: any): AIAnalysisResponse['quarterAnalysis'] {
  // Handle both new quarterAnalysis format and old quarters format
  if (response.quarterAnalysis) {
    return {
      pattern: response.quarterAnalysis.pattern || '',
      bestQuarter: {
        q: response.quarterAnalysis.bestQuarter?.q || 'Q1',
        margin: response.quarterAnalysis.bestQuarter?.margin || '+0',
        reason: response.quarterAnalysis.bestQuarter?.reason || '',
      },
      worstQuarter: {
        q: response.quarterAnalysis.worstQuarter?.q || 'Q3',
        margin: response.quarterAnalysis.worstQuarter?.margin || '-0',
        reason: response.quarterAnalysis.worstQuarter?.reason || '',
      },
      quarters: Array.isArray(response.quarterAnalysis.quarters)
        ? response.quarterAnalysis.quarters.slice(0, 4).map((q: any) => ({
            q: q.q || '',
            team: Number(q.team) || 0,
            opp: Number(q.opp) || 0,
            diff: q.diff || '',
            status: q.status || 'tie',
          }))
        : [],
    };
  }

  // Fallback for old format
  const quarters = Array.isArray(response.quarters)
    ? response.quarters.slice(0, 4).map((q: any) => ({
        q: q.q || '',
        team: Number(q.team) || 0,
        opp: Number(q.opp) || 0,
        diff: q.diff || '',
        status: q.status || 'tie',
      }))
    : [];

  return {
    pattern: '',
    bestQuarter: { q: 'Q1', margin: '+0', reason: '' },
    worstQuarter: { q: 'Q3', margin: '-0', reason: '' },
    quarters,
  };
}
