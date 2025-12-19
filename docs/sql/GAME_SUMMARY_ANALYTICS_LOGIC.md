# Game Summary Analytics Logic & Guidelines

**Version**: 1.0.0  
**Date**: December 19, 2025  
**Purpose**: Documentation of the analytical framework for generating game summaries

---

## 🎯 Overview

This document outlines the **editorial brain** logic used by `get_game_summary_analytics()` to transform raw basketball statistics into structured, LLM-ready game summaries. The function produces deterministic, explainable analytical insights that identify what actually mattered in a game.

**Key Principle**: We build the **editorial brain**, not the storyteller. The LLM should never need to guess what mattered.

---

## 📊 Core Analytical Framework

### 1. Game Type Classification

**Purpose**: Categorize the game's competitive nature based on final margin.

**Logic**:
```sql
CASE 
  WHEN score_diff >= 15 THEN 'Dominant'
  WHEN score_diff >= 8 THEN 'Controlled'
  WHEN score_diff >= 4 THEN 'Competitive'
  ELSE 'Tight'
END
```

**Narrative Hints**:
- **Dominant** (≥15): "One team controlled the game throughout"
- **Controlled** (8-14): "Winner maintained steady control"
- **Competitive** (4-7): "Both teams battled closely"
- **Tight** (<4): "Game decided in the final moments"

**Rationale**: Margin size indicates game flow and competitiveness, informing narrative tone.

---

### 2. Decisive Factor Scoring System

**Purpose**: Identify the top 2-3 statistical factors that determined the outcome.

**Method**: Weighted differential scoring with impact multipliers.

#### Factor Weights

| Factor | Weight | Rationale |
|--------|--------|-----------|
| **Offensive Rebounds** | 1.5× | Second-chance points are high-value possessions |
| **Turnovers Forced** | 1.4× | Directly creates extra possessions |
| **Rebounding Margin** | 1.2× | Total board control indicates physical dominance |
| **Steals & Blocks** | 1.2× | Defensive plays that create fast breaks |
| **Free Throw Attempts** | 1.1× | Foul drawing = aggressive offense |
| **Field Goal %** | 1.0× | Base efficiency metric |

#### Calculation Formula

```sql
impact_score = raw_differential × weight_multiplier
```

**Selection**: Top 3 factors by `impact_score`, only positive differentials (winner advantages).

**Example**:
- Offensive Rebounds: +20 diff × 1.5 = **30.0 impact**
- Turnovers Forced: +13 diff × 1.4 = **18.2 impact**
- Rebounding Margin: +35 diff × 1.2 = **42.0 impact**

**Output**: Ranked list of factors explaining why the winner won.

---

### 3. Player Impact Index

**Purpose**: Rank players across both teams by overall impact, not just scoring.

**Formula**:
```
Impact Score = (PTS × 1.0)
            + (REB × 0.8)
            + (AST × 0.7)
            + (STL × 1.2)
            + (BLK × 1.1)
            - (TOV × 1.0)
```

**Weight Rationale**:
- **Points (1.0)**: Base value - scoring is primary
- **Rebounds (0.8)**: Important but less direct than scoring
- **Assists (0.7)**: Creates points but indirect
- **Steals (1.2)**: High value - creates fast break opportunities
- **Blocks (1.1)**: Defensive impact + potential fast break
- **Turnovers (-1.0)**: Direct negative - lost possession

**Selection**: Top 3 players by impact score, regardless of team.

**Why This Matters**: Identifies players who contributed beyond box score totals (e.g., defensive specialists, playmakers).

---

### 4. Momentum / Breaking Point Detection

**Purpose**: Identify the single most decisive quarter or momentum shift.

**Method**: Quarter-by-quarter scoring differential analysis.

#### Detection Logic

1. **Calculate** points scored per team per quarter
2. **Compute** point differential per quarter (winner vs opponent)
3. **Select** quarter with largest positive differential
4. **Classify** by differential size:
   - ≥10 points: "Dominant quarter performance"
   - 5-9 points: "Strong quarter showing"
   - <5 points: "Key scoring stretch"

**Output Format**:
```json
{
  "type": "quarter_dominance",
  "quarter": 2,
  "team": "WINSLOW",
  "score_in_quarter": 20,
  "opponent_score_in_quarter": 0,
  "differential": 20,
  "description": "Dominant quarter performance in Q2 (20-0)"
}
```

**Rationale**: Single decisive moment provides narrative focus and explains game flow.

---

### 5. Opponent Performance Note

**Purpose**: Generate one notable observation about the losing team's performance.

**Priority Logic** (first match wins):

1. **High Turnovers** (≥15): 
   - Note: "High turnover count (X) proved costly"
   - Why: Turnovers are directly controllable mistakes

2. **Poor Shooting** (<35% FG):
   - Note: "Struggled from the field (X% FG)"
   - Why: Shooting efficiency is fundamental

3. **Rebounding Deficit** (≥10 margin):
   - Note: "Outrebounded by X"
   - Why: Physical dominance indicator

4. **Default**:
   - Note: "Competitive effort despite the loss"
   - Why: Acknowledge effort when no major weakness

**Rationale**: Provides balanced narrative - explains why they lost without being dismissive.

---

## 🔍 Data Source Priority

### Score Calculation

**Current**: Uses `games.home_score` and `games.away_score` columns.

**Known Issue**: Coach mode games may not update these columns accurately.

**Future Enhancement**: For `is_coach_game = true`, calculate scores from `game_stats`:
```sql
-- Calculate from game_stats for coach games
SELECT 
  team_id,
  SUM(CASE WHEN modifier = 'made' THEN stat_value ELSE 0 END) AS calculated_score
FROM game_stats
WHERE game_id = p_game_id AND is_opponent_stat = FALSE
GROUP BY team_id
```

### Stat Aggregation

**Source**: `game_stats` table (source of truth)

**Filters**:
- `is_opponent_stat = FALSE` (exclude opponent stats in coach mode)
- `modifier = 'made'` for scoring stats
- Both `player_id` and `custom_player_id` supported

---

## 📋 Output Structure

### Required Fields

1. **final_score**: Home/away scores and team names
2. **winner**: Team ID, name, side, margin
3. **game_type**: Classification, margin, narrative hint
4. **top_factors**: Max 3 decisive factors (array)
5. **key_players**: Max 3 impact players (array)
6. **momentum**: 1 momentum event (object or empty)
7. **opponent_note**: 1 performance note (object)

### Constraints

- **Deterministic**: Same `game_id` → identical output
- **Limited**: Never exceed max counts (3 factors, 3 players, 1 momentum)
- **Explainable**: Every analytical choice has documented rationale
- **LLM-Ready**: Structured JSON, no narrative logic in SQL

---

## 🎯 Design Principles

### 1. Deterministic Output

**Rule**: Same game, same output, every time.

**Implementation**:
- Fixed `ORDER BY` clauses
- `ROW_NUMBER()` for ranking (no ties)
- No `RANDOM()` or time-based logic in calculations

### 2. Explainable Analytics

**Rule**: Every score, weight, and threshold has documented reasoning.

**Examples**:
- Why offensive rebounds weighted 1.5×? → Second-chance points are high-value
- Why steals weighted 1.2×? → Creates fast break opportunities
- Why ≥15 margin = "Dominant"? → Industry standard for blowouts

### 3. Editorial Brain, Not Storyteller

**Rule**: SQL identifies **what mattered**, LLM writes **how it mattered**.

**Separation**:
- SQL: "Offensive Rebounds: +20, impact_score: 30.0"
- LLM: "WINSLOW dominated the glass, securing 20 offensive rebounds that led to crucial second-chance points."

### 4. Balanced Narrative

**Rule**: Acknowledge both winner's strengths and loser's context.

**Implementation**:
- Winner factors: What they did well
- Opponent note: Why they lost (not dismissive)
- Momentum: When the game shifted

---

## 🔧 Technical Implementation

### Function Signature

```sql
CREATE OR REPLACE FUNCTION get_game_summary_analytics(p_game_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
```

**Key Attributes**:
- `STABLE`: Function doesn't modify database (read-only)
- Returns `JSONB`: Structured, queryable output
- Single parameter: `game_id` (deterministic input)

### CTE Structure

The function uses 8 CTEs in sequence:

1. **game_base**: Core game data and winner detection
2. **game_type**: Classification logic
3. **team_stats_raw**: Aggregate all team stats
4. **team_diffs**: Calculate winner vs opponent differentials
5. **factor_scores** → **ranked_factors** → **top_factors**: Factor analysis
6. **player_stats_raw** → **player_impact** → **ranked_players** → **top_players**: Player analysis
7. **quarter_scoring** → **quarter_diffs** → **best_quarter** → **momentum**: Momentum detection
8. **opponent_note**: Losing team observation

**Final Step**: Combine all CTEs into single JSONB object.

---

## 📊 Example Output Interpretation

### Sample Output

```json
{
  "game_type": {
    "classification": "Dominant",
    "margin": 29
  },
  "top_factors": [
    {"factor": "Rebounding Margin", "value": 35, "impact_score": 42.0},
    {"factor": "Field Goal %", "value": 37, "impact_score": 37.0},
    {"factor": "Offensive Rebounds", "value": 20, "impact_score": 30.0}
  ],
  "momentum": {
    "quarter": 2,
    "differential": 20,
    "description": "Dominant quarter performance in Q2 (20-0)"
  }
}
```

### Interpretation Guide

**For LLM Writer**:
1. **Game Type**: "Dominant" → Use confident, decisive language
2. **Top Factors**: Rebounding was key → Emphasize physical dominance
3. **Momentum**: Q2 was decisive → Highlight second quarter as turning point

**For Analytics Review**:
- Impact scores show rebounding (42.0) was most important
- Q2 differential (20-0) indicates game was effectively over by halftime
- All 3 factors are positive → Winner dominated across multiple areas

---

## 🚀 Future Enhancements

### Potential Additions

1. **Lead Changes Detection**: Track when lead changed hands
2. **Largest Run Detection**: Identify biggest scoring streak
3. **Clutch Performance**: 4th quarter performance analysis
4. **Efficiency Metrics**: True shooting %, effective FG%
5. **Pace Analysis**: Possessions per game, pace factor

### Known Limitations

1. **Coach Mode Scores**: Currently relies on `games.home_score/away_score` which may be inaccurate
2. **Opponent Stats**: Coach mode may lack opponent stat data (shows 0% FG)
3. **Tie Games**: Currently returns `winner_side: 'tie'` but factors/players still calculated

---

## 📚 Related Documentation

- **SQL Function**: `docs/sql/game_summary_analytics.sql`
- **Debug Queries**: `docs/sql/game_summary_analytics_query.sql`
- **Database Schema**: `docs/05-database/migrations/`

---

## ✅ Success Criteria

The analytics function is correct if:

1. ✅ Same `game_id` → identical output every run
2. ✅ Result is directly consumable by LLM (structured JSON)
3. ✅ No narrative logic exists in SQL (only analytical calculations)
4. ✅ Each analytical choice is explainable (documented in this file)
5. ✅ Output never exceeds limits (max 3 factors, 3 players, 1 momentum)

---

**Last Updated**: December 19, 2025  
**Maintained By**: Development Team
