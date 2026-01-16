# 🧠 AI Coach Analysis - Feature Documentation

**Date**: January 14, 2025  
**Status**: ✅ Production Ready (Hardcoded)  
**Version**: 1.0.0

---

## 📋 Overview

AI Coach Analysis provides comprehensive game breakdowns with AI-powered insights, player impact analysis, and actionable coaching recommendations. The feature is currently implemented with hardcoded analysis for a specific game, with plans to integrate dynamic AI generation in the future.

### Key Features

- **Game Overview**: Score breakdown, dominant margin analysis, key insights
- **Winning Factors**: Identification of critical game moments and strategies
- **Key Player Impact**: Individual player analysis with impact scores
- **Quarter-by-Quarter Analysis**: Period-by-period breakdown with momentum shifts
- **Coach Action Items**: Prioritized recommendations for improvement
- **Bottom Line**: Executive summary with game grade

---

## 🎯 User Workflow

### Coach/Stat Admin - Viewing AI Analysis

1. **Access Game Viewer**
   - Navigate to completed game
   - Game must be in "completed" status

2. **Open Analytics Tab**
   - Click "Analytics" tab in Command Center
   - Requires Advanced Analytics access (admin/stat_admin exempt)

3. **View AI Analysis**
   - Scroll down past Advanced Stats section
   - AI Coach Analysis appears below
   - Review all sections:
     - Game Overview
     - Winning Factors
     - Key Player Impact
     - Quarter Analysis
     - Coach Action Items
     - Bottom Line

---

## 🏗️ Architecture

### Component Structure

```
src/
├── components/
│   └── game-viewer/
│       └── AICoachAnalysisHardcoded.tsx     # Main analysis component
│
├── app/
│   └── dashboard/
│       └── coach/
│           └── game/
│               └── [gameId]/
│                   └── components/
│                       └── CommandCenterTabPanel.tsx  # Tab integration
│
└── lib/
    └── types/
        └── aiAnalysis.ts                    # Type definitions
```

### Component Hierarchy

```
CommandCenterTabPanel
  └── TabsContent (value="analytics")
      └── CoachGameAnalyticsTab
          └── AICoachAnalysisHardcoded (below Advanced Stats)
```

### Data Flow

```
1. User opens Analytics tab
   CommandCenterTabPanel → TabsContent (analytics)
   
2. Advanced Stats rendered
   CoachGameAnalyticsTab → Advanced Stats sections
   
3. AI Analysis rendered below
   AICoachAnalysisHardcoded → All analysis sections
   
4. Component checks game ID
   if (gameId !== SUPPORTED_GAME_ID) → "Coming Soon" message
   else → Full analysis display
```

---

## 🔧 Implementation Details

### Component Integration

**File**: `src/app/dashboard/coach/game/[gameId]/components/CommandCenterTabPanel.tsx`

```typescript
{hasAdvancedAnalytics ? (
  <div className="space-y-0">
    <CoachGameAnalyticsTab
      gameId={gameId}
      teamId={game.teamAId}
      teamName={game.teamAName}
      isDark={false}
      prefetchedData={analyticsPrefetch && !analyticsPrefetch.loading && !analyticsPrefetch.error 
        ? analyticsPrefetch.analytics 
        : undefined}
    />
    {/* AI Coach Analysis - Below Advanced Stats */}
    <AICoachAnalysisHardcoded gameId={gameId} />
  </div>
) : (
  // Locked state for free users
)}
```

### Component Structure

**File**: `src/components/game-viewer/AICoachAnalysisHardcoded.tsx`

```typescript
export function AICoachAnalysisHardcoded({ gameId }: AICoachAnalysisProps) {
  // Only render for specific game ID
  if (gameId !== '06977421-52b9-4543-bab8-6480084c5e45') {
    return (
      <div className="p-6 text-center text-muted-foreground">
        AI Analysis not available for this game.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
        {/* ... header content ... */}
      </div>

      <div className="p-6 space-y-6">
        <GameOverviewSection />
        <WinningFactorsSection />
        <KeyPlayersSection />
        <QuarterAnalysisSection />
        <CoachActionItemsSection />
        <BottomLineSection />
      </div>
    </div>
  );
}
```

### Access Control

**File**: `src/app/dashboard/coach/game/[gameId]/components/CommandCenterTabPanel.tsx`

```typescript
// Stat Admins and Admins are exempt from premium gates
const isExempt = user?.role === 'stat_admin' || user?.role === 'admin';
const hasAdvancedAnalytics = isExempt || (limits?.hasAdvancedAnalytics ?? false);
```

---

## 📊 Analysis Sections

### 1. Game Overview

**Content**:
- Final score display
- Dominant margin badge
- Game narrative summary
- Key insight highlight

**Visual Elements**:
- Large score display (65-50)
- Team name labels
- Green badge for dominant win
- Orange insight box

### 2. Winning Factors

**Content**:
- 4 key factors that led to victory
- On-court actions
- Coaching takeaways

**Factors**:
- First Quarter Explosion (+13 margin)
- Fourth Quarter Closer (21-7)
- Rebounding Dominance (32 rebounds)
- Defensive Disruption (14 steals, 3 blocks)

**Visual Elements**:
- Color-coded factor cards (orange, green, blue, purple)
- Icon indicators (Zap, Target, TrendingUp, Shield)
- Two-column layout (On Court / Coaching Takeaway)

### 3. Key Player Impact

**Content**:
- Top 4 players by impact score
- Player stats summary
- Strengths list
- Risk factors
- Focus areas

**Players**:
- Murrell (32.3 impact) - 12 PTS, 14 REB
- Ward Jr (31.0 impact) - 28 PTS, 6-for-9 from three
- Haines (21.8 impact) - 4 STL, 2 BLK
- DeGrais (19.2 impact) - 5 AST, 3 STL

**Visual Elements**:
- Player cards with jersey numbers
- Impact score display
- Badge indicators (Player of the Game, Hustle Player)
- Color-coded strengths/risks

### 4. Quarter-by-Quarter Analysis

**Content**:
- Score breakdown by quarter
- Quarter margin (win/loss)
- Middle quarter collapse warning
- Root cause analysis

**Quarters**:
- Q1: 17-4 (+13) - Win
- Q2: 17-22 (-5) - Loss
- Q3: 10-17 (-7) - Loss
- Q4: 21-7 (+14) - Win

**Visual Elements**:
- 4-column quarter grid
- Color-coded win/loss (green/red)
- Warning box for middle quarter collapse
- Bullet list of root causes

### 5. Coach Action Items

**Content**:
- Prioritized action items
- Owner assignment
- Priority levels (critical, important, monitor)

**Items**:
- Reduce turnovers (19 is far too high) - Critical
- Address DeGrais's 8 turnovers - Critical
- Free throw improvement (55% unacceptable) - Important
- Maintain intensity through Q2/Q3 - Important
- Murrell foul management - Monitor

**Visual Elements**:
- Color-coded priority (red, amber, green)
- Priority dot indicators
- Owner labels

### 6. Bottom Line

**Content**:
- Executive summary
- Game grade (B+)
- Key takeaways

**Visual Elements**:
- Dark gradient background
- Large grade display
- Two-column summary layout

---

## 🔐 Access Control

### Visibility Requirements

1. **Game Status**: Must be "completed"
2. **Tab Access**: Analytics tab must be accessible
3. **Premium Gate**: Requires Advanced Analytics (admin/stat_admin exempt)
4. **Game ID**: Currently only for game `06977421-52b9-4543-bab8-6480084c5e45`

### Role Exemptions

- **Admin**: Full access (exempt from premium gate)
- **Stat Admin**: Full access (exempt from premium gate)
- **Coach**: Requires Advanced Analytics subscription
- **Organizer**: Requires Advanced Analytics subscription

---

## 🐛 Troubleshooting

### AI Analysis Not Showing

**Issue**: Analysis doesn't appear in Analytics tab  
**Solution**:
- Verify game status is "completed"
- Check `hasAdvancedAnalytics` is true
- Verify game ID matches supported game
- Check component is rendered below Advanced Stats

### "Coming Soon" Message

**Issue**: Shows "AI Analysis not available for this game"  
**Solution**:
- Currently only supports game `06977421-52b9-4543-bab8-6480084c5e45`
- Future enhancement will support all games via API

### Access Denied

**Issue**: Analytics tab shows locked state  
**Solution**:
- Verify user role (admin/stat_admin exempt)
- Check subscription has Advanced Analytics
- Verify `isCompleted` is true

---

## 📈 Performance Considerations

### Component Rendering

- **Static Content**: No API calls (hardcoded data)
- **No Performance Impact**: Pure UI component
- **Efficient**: All sections rendered at once

### Future API Integration

- **Planned**: Replace hardcoded data with API call
- **Endpoint**: `/api/games/[gameId]/ai-analysis`
- **Caching**: Analysis cached per game
- **Generation**: Background job generates analysis after game completion

---

## 🚀 Future Enhancements

### Planned Features

1. **Dynamic AI Generation**
   - Generate analysis for all completed games
   - Use game stats to generate insights
   - Store in `ai_analysis` table

2. **AI Analysis Service**
   - `AIAnalysisService.generateAnalysis(gameId)`
   - Background job after game completion
   - Caching and regeneration

3. **Customizable Insights**
   - Coach preferences for analysis depth
   - Focus areas (offense, defense, specific players)
   - Export analysis to PDF

4. **Historical Comparison**
   - Compare analysis across games
   - Trend identification
   - Season-long insights

---

## 📊 Database Schema (Future)

### `ai_analysis` Table (Planned)

```sql
CREATE TABLE ai_analysis (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  analysis_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES users(id),
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_ai_analysis_game_id ON ai_analysis(game_id);
```

### Analysis Data Structure

```typescript
interface AIAnalysisData {
  gameOverview: {
    score: { home: number; away: number };
    margin: number;
    narrative: string;
    keyInsight: string;
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
    strengths: string[];
    risks: string[];
    focus: string[];
  }>;
  quarters: Array<{
    quarter: string;
    teamScore: number;
    oppScore: number;
    diff: string;
    status: 'win' | 'loss';
  }>;
  actionItems: Array<{
    priority: 'critical' | 'important' | 'monitor';
    action: string;
    owner: string;
  }>;
  bottomLine: {
    summary: string;
    grade: string;
  };
}
```

---

## 📚 Related Documentation

- [Game Viewer](../game-viewer/README.md) - Complete game viewer guide
- [Analytics Tab](../coach-dashboard/COACH_DASHBOARD_V0_17.md) - Analytics features
- [Command Center Tab Panel](../../02-development/components/COMMAND_CENTER_TAB_PANEL.md) - Tab structure

---

**Last Updated**: January 14, 2025  
**Maintained By**: Development Team
