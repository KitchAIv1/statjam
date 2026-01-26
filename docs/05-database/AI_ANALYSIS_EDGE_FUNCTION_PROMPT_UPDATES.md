# 🤖 AI Analysis Edge Function Prompt Updates

**Date**: January 2025  
**Status**: BACKEND TEAM ACTION REQUIRED  
**Related Migration**: `032_ai_analysis_enhanced_metrics.sql`

---

## 📋 Overview

The RPC function `get_ai_analysis_data()` has been enhanced with new metrics. The Edge Function prompt needs to be updated to USE these new fields for better AI analysis.

---

## 🆕 New Data Available from RPC

### 1. `shooting_comparison` (NEW Object)

```json
{
  "team_three_made": 2,
  "team_three_attempted": 14,
  "team_three_pct": 14.3,
  "opp_three_made": 8,
  "opp_three_attempted": 24,
  "opp_three_pct": 33.3,
  "three_point_differential": -18,      // (2*3) - (8*3) = -18 points
  "three_made_differential": -6,         // 2 - 8 = -6 makes
  "team_true_fg_made": 14,
  "team_true_fg_attempted": 44,
  "team_true_fg_pct": 31.8,
  "opp_true_fg_made": 23,
  "opp_true_fg_attempted": 58,
  "opp_true_fg_pct": 39.7
}
```

### 2. `efficiency_metrics` (NEW Object)

```json
{
  "team_assists": 7,
  "team_turnovers": 31,
  "team_ast_to_ratio": 0.23,             // 7:31 = terrible
  "opp_assists": 7,
  "opp_turnovers": 17,
  "opp_ast_to_ratio": 0.41,              // 7:17 = better
  "team_steals": 7,
  "opp_steals": 15,
  "steals_caused_turnovers_pct": 48.4,   // 15/31 = 48.4% of turnovers were steals
  "steals_forced_turnovers_pct": 41.2,   // 7/17 = we forced 41.2%
  "rebound_differential": 11,
  "offensive_rebound_differential": 5,
  "defensive_rebound_differential": 6
}
```

### 3. `bench_players` (NEW Array)

```json
[
  {
    "player_id": "xxx",
    "name": "Shorter",
    "jersey_number": 1,
    "points": 1,
    "rebounds": 2,
    "assists": 1,
    "turnovers": 2,
    "impact_score": 2.5
  },
  {
    "player_id": "yyy",
    "name": "Morton",
    "jersey_number": 8,
    "points": 3,
    "rebounds": 1,
    "assists": 0,
    "turnovers": 4,
    "impact_score": 2.2
  }
]
```

### 4. Enhanced `team_totals` (NEW Fields Added)

```json
{
  // EXISTING fields (unchanged)
  "rebounds": 35,
  "steals": 7,
  "blocks": 4,
  "turnovers": 31,
  "ft_made": 10,
  "ft_attempted": 19,
  "ft_percentage": 52.6,
  
  // NEW fields (now matches opponent_totals)
  "points": 40,
  "assists": 7,
  "fouls": 12,
  "offensive_rebounds": 16,
  "defensive_rebounds": 19,
  "fg_made": 12,
  "fg_attempted": 30,
  "fg_percentage": 40.0,
  "three_made": 2,
  "three_attempted": 14,
  "three_percentage": 14.3
}
```

---

## 📝 Prompt Additions for Edge Function

Add these sections to the GPT prompt to utilize the new data:

### 1. 3-Point Shooting Analysis

```
## THREE-POINT SHOOTING ANALYSIS

Use the shooting_comparison data to analyze 3-point impact:

- Team 3PT: {team_three_made}/{team_three_attempted} ({team_three_pct}%)
- Opponent 3PT: {opp_three_made}/{opp_three_attempted} ({opp_three_pct}%)
- 3PT Points Differential: {three_point_differential} points
- 3PT Makes Differential: {three_made_differential} makes

If three_point_differential is significant (>6 or <-6 points):
- This is a KEY FACTOR in the game outcome
- Include in "winningFactors" or "areasOfConcern"
- Provide specific coaching takeaway for 3PT improvement

Example insight:
"The opponent's 3-point shooting (+18 points from beyond the arc) was the single biggest factor in this loss. They shot 33.3% from three while we managed only 14.3%. This 18-point swing erased our +11 rebounding advantage."
```

### 2. Steal-Turnover Correlation

```
## STEAL-TURNOVER CORRELATION

Use efficiency_metrics to connect steals and turnovers:

- Our turnovers: {team_turnovers}
- Opponent steals: {opp_steals}
- Turnovers caused by steals: {steals_caused_turnovers_pct}%

If steals_caused_turnovers_pct > 40%:
- Turnovers are NOT just ball security issues
- Opponent's defensive pressure is the PRIMARY cause
- Recommendation: Better ball handling against pressure, ball movement

Example insight:
"Nearly half (48.4%) of our 31 turnovers were caused by opponent steals. This isn't a ball security problem - it's a pressure problem. The opponent's 15 steals show active hands and aggressive defense that disrupted our offense."
```

### 3. Assist-to-Turnover Ratio

```
## ASSIST-TO-TURNOVER RATIO

Use efficiency_metrics for offensive efficiency:

- Team A:TO ratio: {team_ast_to_ratio}
- Opponent A:TO ratio: {opp_ast_to_ratio}

Interpretation:
- A:TO < 0.5 = CRITICAL problem (more than 2 turnovers per assist)
- A:TO 0.5-1.0 = Needs improvement
- A:TO 1.0-1.5 = Average
- A:TO > 1.5 = Good ball movement

If team_ast_to_ratio is significantly worse than opponent:
- Include in "actionItems" with priority "critical"
- Provide specific practice recommendations

Example insight:
"The assist-to-turnover ratio tells the story: our 0.23 (7 assists, 31 turnovers) vs their 0.41 (7 assists, 17 turnovers). We had more than 4 turnovers for every assist - the offense was chaotic."
```

### 4. Bench Contribution

```
## BENCH CONTRIBUTION

Use bench_players array for depth analysis:

If bench_players array is NOT empty:
- Summarize total bench contribution
- Note any concerning turnover numbers from bench
- Identify if starters carried too much load

Example insight:
"Bench contribution was limited: Shorter (1 pt, 2 reb) and Morton (3 pts, 1 reb) combined for only 4 points with 6 turnovers. The starters carried the offensive load."
```

---

## 🎯 Updated Prompt Structure

Add these to the existing GPT system prompt:

```
You now have access to enhanced metrics:

1. shooting_comparison: 3-point differential and true FG% comparison
2. efficiency_metrics: A:TO ratio, steal-turnover correlation, rebound differential
3. bench_players: Players ranked 5+ by impact score

USE THESE NEW METRICS TO:
- Identify if 3PT shooting was a game-deciding factor (include in winningFactors/areasOfConcern)
- Connect opponent steals to team turnovers (don't just say "turnovers" - explain WHY)
- Use A:TO ratio to assess offensive efficiency
- Note bench contribution or lack thereof
- Provide more specific, actionable coaching takeaways

CRITICAL RULES:
- If three_point_differential > 12 or < -12: This MUST be mentioned as a key factor
- If steals_caused_turnovers_pct > 40%: Turnovers are a PRESSURE problem, not just ball security
- If team_ast_to_ratio < 0.5: This is a CRITICAL actionItem
```

---

## ✅ Implementation Checklist

1. [ ] Apply migration `032_ai_analysis_enhanced_metrics.sql` to Supabase
2. [ ] Run `DELETE_AND_REGENERATE_AI_ANALYSIS.sql` for the test game
3. [ ] Verify RPC returns new fields (shooting_comparison, efficiency_metrics, bench_players)
4. [ ] Update Edge Function prompt with new sections above
5. [ ] Regenerate AI analysis by viewing the game in the app
6. [ ] Verify analysis now includes 3PT differential, steal-turnover correlation

---

## 📊 Expected Improvements

After implementation, AI analysis should include:

| Metric | Before | After |
|--------|--------|-------|
| 3PT Differential | ❌ Not mentioned | ✅ "18-point swing from 3PT" |
| Steal-TO Correlation | ❌ "31 turnovers" | ✅ "48% of TOs were steals" |
| A:TO Ratio | ❌ Not calculated | ✅ "0.23 A:TO ratio (critical)" |
| True FG% | ❌ Only 2PT% | ✅ "31.8% true FG%" |
| Bench Analysis | ❌ Missing 2 players | ✅ "Bench: 4 pts, 6 TOs" |

---

**Last Updated**: January 2025  
**Owner**: Backend Team
