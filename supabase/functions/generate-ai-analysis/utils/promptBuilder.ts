/**
 * Prompt Builder - Build AI prompts for game analysis
 * 
 * PURPOSE: Construct system and user prompts for GPT
 * Follows .cursorrules: <200 lines, single responsibility
 */

export function buildSystemPrompt(): string {
  return `You are a professional basketball analyst writing for youth coaches and parents who may not be basketball experts.

YOUR WRITING STYLE:
- Use storytelling: "tale of two halves", "bookended performance", "slam the door"
- Be specific with numbers: "67% from three (6-for-9)" not just "67%"
- Reference when things happened: "9 first-quarter points set the tone"
- Call out problems directly: "5 turnovers is unacceptable", "8 turnovers needs immediate attention"
- AVOID corporate language: Never say "scoring prowess", "defensive tenacity", "played key roles", "contributing to the victory"
- USE coaching language: "controlled the glass", "workmanlike victory", "not pretty scoring", "locked in"

CRITICAL ANALYSIS REQUIREMENTS:

0. LOSS SCENARIO HANDLING (IMPORTANT):
   If the team LOST, your analysis must:
   - Frame as "tough night", "learning opportunity", NOT defeatist
   - Identify the EXACT pivot point: "game slipped away in Q3 when opponent outscored us 14-5"
   - Include "silver lining" section: what players did well DESPITE the loss
   - Give actionable coaching: "crash the glass harder", "come out of halftime ready"
   - Include revenge narrative: "this team has the talent to beat [opponent] next time"
   - End with motivational closer: "Losses teach more than wins. Use this one."
   - Show specific deficits: rebound differential (-14), shooting % (33% FG)

1. QUARTER MOMENTUM ANALYSIS:
   - Identify dominant quarters (e.g., "17-4 first quarter blitz")
   - Spot middle-quarter collapses (combine Q2+Q3 margins if negative)
   - Note momentum shifts and why they happened
   - Find patterns: "won Q1 and Q4, struggled in Q2/Q3"

2. WINNING FACTORS (Must identify exactly 4):
   - Look at: dominant quarters, rebounding, defense (steals/blocks), shooting efficiency
   - Each factor needs specific player contributions
   - Include exact statistics with context

3. PLAYER ANALYSIS:
   - Use quarter_points to show WHEN players scored (e.g., "10 fourth-quarter points closed the game")
   - BADGE RULES (CRITICAL):
     * Assign "🏆 Player of the Game" to exactly ONE player (highest impact scorer)
     * Assign "💪 Hustle Player" to exactly ONE DIFFERENT player (most steals + blocks)
     * A player CANNOT have both badges - pick the more fitting one
     * If same player leads both, give them Player of Game, give Hustle to second-best defensive player
   - Be specific with risks: exact turnover counts, foul trouble concerns
   - Give actionable focus items with targets (e.g., "cut turnovers in half (8 → 4)")

4. ACTION ITEMS:
   - Critical: immediate fixes with specific numbers
   - Important: tactical adjustments
   - Monitor: things to watch
   - Always include owner (specific player name or "Entire Team")

5. GRADING (A+ to F):
   - A+/A: Dominant win, minimal issues
   - B+/B: Solid win with some concerns
   - C+/C: Close game or significant issues despite win
   - D/F: Loss or major problems

You must return valid JSON matching the exact structure provided. Be analytical, specific, and actionable.`;
}

export function getJSONSchema(): string {
  return `{
  "gameOverview": {
    "narrative": "2-4 sentence game story. FOR WINS: use specific moments/patterns. FOR LOSSES: identify pivot point with exact score ('slipped away in Q3 when outscored 14-5'), include shooting % and rebound differential, frame as 'learning opportunity'. Include specific stats like '33% FG, 21% from three, dominated on boards 22-36'.",
    "keyInsight": "One critical insight about the game (for losses: what specifically went wrong and why)",
    "marginCategory": "Dominant" | "Controlled" | "Competitive" | "Tight"
  },
  "winningFactors": [
    {
      "title": "Factor name (e.g., 'First Quarter Explosion')",
      "value": "Statistic with context (e.g., '+13 Margin (17-4)')",
      "onCourt": ["3 specific facts with player names and numbers"],
      "takeaways": ["3 coaching insights"]
    }
  ],
  "keyPlayers": [
    {
      "name": "Player name",
      "jersey": 0,
      "stats": "Full stat line (PTS, REB, AST, STL, BLK, TOV)",
      "impact": 0.0,
      "badge": "🏆 Player of the Game" | "💪 Hustle Player" | null,
      "strengths": ["3-4 specific strengths with numbers"],
      "risks": ["1-2 specific risks with exact numbers"],
      "focus": ["2-3 actionable focus items with targets"]
    }
  ],
  "quarterAnalysis": {
    "pattern": "Pattern description (e.g., 'Strong start and finish, middle-quarter collapse')",
    "bestQuarter": { "q": "Q1", "margin": "+13", "reason": "Why this quarter was best" },
    "worstQuarter": { "q": "Q3", "margin": "-7", "reason": "What went wrong" },
    "quarters": [
      { "q": "Q1", "team": 17, "opp": 4, "diff": "+13", "status": "win" | "loss" | "tie" }
    ]
  },
  "actionItems": [
    {
      "priority": "critical" | "important" | "monitor",
      "action": "Specific action with numbers (e.g., 'Reduce turnovers from 19 to under 12')",
      "owner": "Player name or 'Entire Team'"
    }
  ],
  "bottomLine": {
    "summary": "3-4 sentence COACHING ANALYSIS. FOR WINS: conversational tone, 3+ stats, 2+ players with stats, quarter reference, contrast (concern BUT positive). FOR LOSSES: Start with 'Tough loss, but there's a clear path forward.' Include: (1) What lost the game with numbers ('lost on the glass -14 rebounds, 19 turnovers'). (2) Pivot point with score ('Q3 collapse 5-14 was the dagger'). (3) SILVER LINING with player positives ('But here's the silver lining: Thorton showed efficiency 50% FG, 0 TO'). (4) Actionable coaching ('Fix turnovers, crash the glass harder'). (5) Revenge narrative ('this team has the talent to beat [opponent] next time'). (6) Motivational closer ('Losses teach more than wins. Use this one.').",
    "goodNews": "Specific positive with number. For losses: what players did well (e.g., 'Thorton was efficient: 50% FG with zero turnovers')",
    "badNews": "Specific concern with number. For losses: the key deficit (e.g., 'Outrebounded 22-36, giving up 14 second-chance points')",
    "grade": "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F"
  }
}`;
}

export function buildUserPrompt(gameData: any): string {
  const teamName = gameData.game.team_a.name;
  const oppName = gameData.game.team_b.name;
  const homeScore = gameData.game.home_score;
  const awayScore = gameData.game.away_score;
  const margin = gameData.game.margin;
  const isWin = homeScore > awayScore;

  const scenarioType = isWin ? 'WIN' : 'LOSS';
  
  let prompt = `Analyze this basketball game and generate comprehensive analysis.

⚠️ SCENARIO: ${scenarioType} - Apply ${scenarioType}-specific framing from instructions above.

GAME RESULT:
- ${teamName} ${isWin ? 'defeated' : 'lost to'} ${oppName}
- Final Score: ${homeScore}-${awayScore} (${isWin ? 'Won by' : 'Lost by'} ${margin} points)
${!isWin ? '- THIS IS A LOSS: Use loss-specific framing (learning opportunity, silver lining, revenge narrative, motivational closer)' : ''}

QUARTER-BY-QUARTER BREAKDOWN:
`;

  // Calculate combined margins for pattern analysis
  let q2q3Combined = 0;
  let q1q4Combined = 0;
  
  gameData.quarters.forEach((q: any) => {
    const quarterNum = q.quarter;
    const margin = q.margin;
    const status = margin > 0 ? 'WON' : margin < 0 ? 'LOST' : 'TIED';
    
    prompt += `Q${quarterNum}: ${teamName} ${q.team_points} - ${oppName} ${q.opp_points} (${status} by ${Math.abs(margin)})\n`;
    
    if (quarterNum === 2 || quarterNum === 3) q2q3Combined += margin;
    if (quarterNum === 1 || quarterNum === 4) q1q4Combined += margin;
  });

  prompt += `
PATTERN ANALYSIS:
- Q1 + Q4 combined margin: ${q1q4Combined > 0 ? '+' : ''}${q1q4Combined}
- Q2 + Q3 combined margin: ${q2q3Combined > 0 ? '+' : ''}${q2q3Combined}
${q2q3Combined < -5 ? '⚠️ MIDDLE QUARTER COLLAPSE DETECTED - Analyze why' : ''}
${q1q4Combined > 10 ? '✓ STRONG START/FINISH - Team shows up in crucial moments' : ''}

TEAM TOTALS:
- Rebounds: ${gameData.team_totals.rebounds}
- Steals: ${gameData.team_totals.steals}
- Blocks: ${gameData.team_totals.blocks}
- Turnovers: ${gameData.team_totals.turnovers}${gameData.team_totals.turnovers > 15 ? ' ⚠️ HIGH' : ''}
- Free Throws: ${gameData.team_totals.ft_made}/${gameData.team_totals.ft_attempted} (${gameData.team_totals.ft_percentage}%)

TOP 4 PLAYERS (by impact score):
`;

  gameData.players.forEach((p: any, idx: number) => {
    const quarterPts = p.quarter_points || {};
    const hasDoubleDouble = (p.points >= 10 && p.rebounds >= 10) || 
                           (p.points >= 10 && p.assists >= 10) || 
                           (p.rebounds >= 10 && p.assists >= 10);
    
    prompt += `
${idx + 1}. ${p.name} (#${p.jersey_number}) - Impact: ${p.impact_score}
   Stats: ${p.points} PTS, ${p.rebounds} REB, ${p.assists} AST, ${p.steals} STL, ${p.blocks} BLK, ${p.turnovers} TOV, ${p.fouls} FOULS
   Shooting: ${p.shooting.fg_percentage}% FG (${p.shooting.fg_made}/${p.shooting.fg_attempted}), ${p.shooting.three_percentage}% 3PT (${p.shooting.three_made}/${p.shooting.three_attempted}), ${p.shooting.ft_percentage}% FT (${p.shooting.ft_made}/${p.shooting.ft_attempted})
   Quarter Points: Q1=${quarterPts['1'] || 0}, Q2=${quarterPts['2'] || 0}, Q3=${quarterPts['3'] || 0}, Q4=${quarterPts['4'] || 0}
   ${hasDoubleDouble ? '🏆 DOUBLE-DOUBLE - Strong Player of the Game candidate' : ''}
   ${p.steals + p.blocks >= 5 ? '💪 DEFENSIVE IMPACT - Hustle Player candidate' : ''}
   ${p.turnovers >= 5 ? '⚠️ HIGH TURNOVERS - Needs attention' : ''}
`;
  });

  prompt += `
ANALYSIS REQUIREMENTS:
1. Identify exactly 4 winning factors from: quarter dominance, rebounding, defense, shooting
2. Use quarter_points to describe WHEN key players scored
3. Assign badges: 🏆 Player of the Game (highest impact or double-double), 💪 Hustle Player (best defensive stats)
4. Be specific with numbers in all sections
5. Generate 3-4 action items with specific targets

Return JSON in the exact format provided.`;

  return prompt;
}
