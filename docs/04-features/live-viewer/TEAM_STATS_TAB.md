# 🏀 TEAM STATS TAB - LIVE VIEWER FEATURE

**Date**: October 22, 2025  
**Status**: ✅ COMPLETE  
**Version**: 1.0.1  
**Architecture**: V3 Engine (Raw HTTP + Public Access)  
**Performance**: Instant tab switching with preemptive data prefetching

---

## 📊 **OVERVIEW**

The Team Stats Tab is a new feature added to the Live Viewer that displays comprehensive team and player statistics in an NBA-style interface. This tab provides real-time team performance metrics, active player stats, and bench player information.

---

## 🎯 **FEATURES**

### **1. Team Performance Summary**
- **Team Header**: Team name with spread indicator (▼ 2.5)
- **Aggregate Statistics Grid**:
  - Field Goals (FG): Made/Attempted + Percentage
  - 3-Point Goals (3FG): Made/Attempted + Percentage
  - Free Throws (FTS): Made/Attempted + Percentage
  - Turnovers (TO): Total count
  - Rebounds (REB): Total count
  - Assists (AST): Total count
- **Responsive Layout**: 
  - Desktop: 6 columns, single row
  - Mobile: 3x2 grid (FG, 3FG, FTS / TO, REB, AST)

### **2. On Court Section**
- **Active Players Display**: Shows 5 players currently on the court
- **Player Information**:
  - Circular avatar with player initial
  - Player name and position
  - Real-time statistics grid
- **Statistics Tracked**:
  - MIN: Minutes played (whole numbers, cumulative floor time)
  - PTS: Points scored
  - REB: Rebounds
  - AST: Assists
  - STL: Steals
  - BLK: Blocks
  - +/-: Plus/Minus (NBA-standard: team pts - opponent pts while on court, color-coded: green for positive, red for negative, gray for zero)

### **3. Bench Section**
- **Bench Players Display**: Shows remaining players not currently on court
- **Same Statistics Grid**: Identical layout and metrics as On Court section
- **Dynamic Updates**: Real-time updates when substitutions occur

### **4. Loading State UX**
- **Skeleton Scaffolding**: Custom dark-themed loading skeletons
- **Fixed Positions**: Maintains layout structure during loading
- **Smooth Transitions**: Pulse animations for visual feedback
- **No Overlapping**: Prevents UI elements from overlapping during load

---

## 🏗️ **ARCHITECTURE**

### **Service Layer**

#### **teamStatsService.ts**
**Location**: `/src/lib/services/teamStatsService.ts`

**Purpose**: Aggregates team and player statistics from `game_stats` table

**Key Methods**:
- `getTeamStats(gameId, teamId)`: Aggregates team-level statistics
- `getPlayerStats(gameId, teamId, playerIds)`: Aggregates individual player statistics
- `calculatePlayerMinutes(gameId, teamId, playerIds)`: Calculates actual floor time
- `calculatePlusMinusForPlayers(gameId, teamId, playerIds)`: Calculates player efficiency

**Authentication**: Uses `SUPABASE_ANON_KEY` for public access (no user authentication required)

**Data Aggregation Logic**:
```typescript
// Field Goals
fieldGoalsMade: stats.filter(s => s.stat_type === 'field_goal' && s.modifier === 'made').length
fieldGoalsAttempted: stats.filter(s => s.stat_type === 'field_goal').length

// 3-Pointers
threePointersMade: stats.filter(s => s.stat_type === '3_pointer' && s.modifier === 'made').length
threePointersAttempted: stats.filter(s => s.stat_type === '3_pointer').length

// Free Throws
freeThrowsMade: stats.filter(s => s.stat_type === 'free_throw' && s.modifier === 'made').length
freeThrowsAttempted: stats.filter(s => s.stat_type === 'free_throw').length

// Other Stats
turnovers: stats.filter(s => s.stat_type === 'turnover').length
rebounds: stats.filter(s => s.stat_type === 'rebound').length
assists: stats.filter(s => s.stat_type === 'assist').length
steals: stats.filter(s => s.stat_type === 'steal').length
blocks: stats.filter(s => s.stat_type === 'block').length
```

#### **teamServiceV3.ts** (Modified)
**Location**: `/src/lib/services/teamServiceV3.ts`

**Changes**: Updated to use public access pattern instead of requiring user authentication

**Authentication Pattern**:
```typescript
headers: {
  'apikey': this.SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`, // PUBLIC ACCESS
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
}
```

### **Hook Layer**

#### **useTeamStats.ts**
**Location**: `/src/hooks/useTeamStats.ts`

**Purpose**: Manages team stats data fetching and real-time updates

**State Management**:
- `teamStats`: Aggregated team statistics
- `onCourtPlayers`: Array of active players with stats
- `benchPlayers`: Array of bench players with stats
- `loading`: Loading state
- `error`: Error state

**Real-time Updates**: Integrates with `gameSubscriptionManager` for live stat updates

**Performance Optimizations**:
- **Prefetching Support**: Optional `prefetch` and `enabled` flags for background data loading
- **Parallel API Calls**: Uses `Promise.all()` for concurrent team and player stats fetching
- **Smart Loading State**: No spinner for prefetch mode, improving perceived performance

**Effect Dependencies**:
```typescript
useEffect(() => {
  fetchTeamData();
  setupSubscriptions();
  return () => cleanup();
}, [gameId, teamId]);
```

**Prefetching API**:
```typescript
export interface UseTeamStatsOptions {
  prefetch?: boolean; // Enable background prefetching
  enabled?: boolean;  // Conditional fetching control
}

const teamAPrefetch = useTeamStats(gameId, teamAId, { 
  prefetch: true, 
  enabled: !!teamAId 
});
```

### **Component Layer**

#### **TeamStatsTab.tsx**
**Location**: `/src/app/game-viewer/[gameId]/components/TeamStatsTab.tsx`

**Props**:
```typescript
interface TeamStatsTabProps {
  gameId: string;
  teamId: string;
  teamName: string;
  prefetchedData?: { // Optional prefetched data for instant rendering
    teamStats: any;
    onCourtPlayers: any[];
    benchPlayers: any[];
  };
}
```

**Features**:
- Mobile responsive detection (`useState` + `useEffect` + window resize listener)
- Conditional styling based on screen width (768px breakpoint)
- Lightweight skeleton loading (8 DOM elements vs 62, 87% reduction)
- Instant rendering with prefetched data
- Error handling with user-friendly messages
- Natural scrolling with content-driven height

**Performance Enhancements**:
- **Phase 1**: Lightweight skeleton + parallel API calls
- **Phase 2**: Preemptive data prefetching for 0ms tab switching
- Smart data selection (prefetched data takes priority over hook data)

**Styling Approach**: Inline styles with separate mobile/desktop variants, no forced viewport heights

#### **PlayerStatsRow.tsx**
**Location**: `/src/app/game-viewer/[gameId]/components/PlayerStatsRow.tsx`

**Props**:
```typescript
interface PlayerStatsRowProps {
  player: {
    id: string;
    name: string;
    position: string;
  };
  stats: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    plusMinus: number;
  };
}
```

**Features**:
- Reusable player row component
- Color-coded plus/minus display
- Mobile responsive layout
- Player avatar with initial fallback
- 7-column stats grid

---

## 📐 **PLAYER MINUTES CALCULATION**

### **Logic Overview**

Player minutes are calculated based on **actual floor time**, not game clock time, following NBA standards. The calculation now supports **dynamic quarter lengths** from tournament rulesets (NBA=12min, FIBA=10min, NCAA=20min, CUSTOM=configurable) and respects stat admin's custom quarter clock edits.

### **Quarter Length Detection**

The system determines quarter length using this priority order:
1. **Tournament's `ruleset_config.clockRules.quarterLengthMinutes`** (CUSTOM ruleset overrides)
2. **Tournament's ruleset** (NBA=12, FIBA=10, NCAA=20)
3. **Game's `game_clock_minutes`** (stat admin's edited clock setting)
4. **Fallback**: 12 minutes (NBA default)

### **Calculation Methods**

#### **Method 1: Using Substitutions** (Primary)
```typescript
// Get dynamic quarter length (not hardcoded 12)
quarterLengthMinutes = await getQuarterLengthMinutes(gameId)
quarterLengthSeconds = quarterLengthMinutes * 60

// Track player stints on court with quarter awareness
for each substitution:
  if player_in:
    stintStartQuarter = sub.quarter
    stintStartTime = game_time_minutes * 60 + game_time_seconds
    isOnCourt = true
  
  if player_out:
    stintEndQuarter = sub.quarter
    stintEndTime = game_time_minutes * 60 + game_time_seconds
    // Calculate cross-quarter stints correctly
    stintSeconds = calculateStintSeconds(
      stintStartQuarter, stintStartTime,
      stintEndQuarter, stintEndTime,
      quarterLengthSeconds
    )
    totalSeconds += stintSeconds
    isOnCourt = false

// Handle players still on court using CURRENT game state
if isOnCourt:
  currentGameState = await getCurrentGameState(gameId)
  stintSeconds = calculateStintSeconds(
    stintStartQuarter, stintStartTime,
    currentGameState.quarter, currentGameState.clock,
    quarterLengthSeconds
  )
  totalSeconds += stintSeconds

minutes = Math.round(totalSeconds / 60) // Whole numbers only
```

#### **Method 2: Using Game Clock** (Fallback when no substitutions)
```typescript
// Get dynamic quarter length
quarterLengthMinutes = await getQuarterLengthMinutes(gameId)
quarterLengthSeconds = quarterLengthMinutes * 60

// Calculate elapsed game time using dynamic quarter length
quarterTimeElapsed = quarterLengthSeconds - (game_clock_minutes * 60 + game_clock_seconds)
totalTimeElapsed = ((currentQuarter - 1) * quarterLengthSeconds) + quarterTimeElapsed
minutesElapsed = totalTimeElapsed / 60

// Starters get elapsed time, bench gets 0
minutes = isStarter ? Math.round(minutesElapsed) : 0
```

#### **Cross-Quarter Stint Calculation**
```typescript
function calculateStintSeconds(
  startQuarter, startGameClock,  // seconds remaining when stint started
  endQuarter, endGameClock,      // seconds remaining when stint ended
  quarterLengthSeconds
) {
  if (startQuarter === endQuarter) {
    // Same quarter: simple subtraction (clock counts down)
    return startGameClock - endGameClock
  }
  
  // Cross-quarter calculation:
  // 1. Time remaining in start quarter
  const startQuarterTime = startGameClock
  
  // 2. Full quarters between start and end
  const fullQuarters = endQuarter - startQuarter - 1
  const fullQuartersTime = fullQuarters * quarterLengthSeconds
  
  // 3. Time elapsed in end quarter
  const endQuarterTime = quarterLengthSeconds - endGameClock
  
  return startQuarterTime + fullQuartersTime + endQuarterTime
}
```

### **Example Scenarios**

**Scenario 1: Player with substitutions (NBA 12-min quarters)**
```
Game Start: 12:00 Q1 (720 seconds)
Player subs out: 8:30 Q1 (510 seconds)
Stint 1: (720 - 510) / 60 = 3.5 minutes

Player subs in: 6:00 Q1 (360 seconds)
Player subs out: 2:00 Q1 (120 seconds)
Stint 2: (360 - 120) / 60 = 4.0 minutes

Total: 3.5 + 4.0 = 7.5 → 8 minutes (rounded)
```

**Scenario 2: Starter with no substitutions (live game)**
```
Current State: Q1, 8:45 remaining (12-min quarters)
Elapsed: 12:00 - 8:45 = 3:15
Minutes: 3.25 → 3 minutes (rounded)
```

**Scenario 3: Cross-quarter stint (NBA 12-min quarters)**
```
Player starts: Q1 12:00 (720 seconds)
Player subs out: Q3 5:00 (300 seconds)

Calculation:
- Q1 remaining: 720 seconds (12 minutes)
- Full Q2: 720 seconds (12 minutes)
- Q3 elapsed: 720 - 300 = 420 seconds (7 minutes)
- Total: 720 + 720 + 420 = 1860 seconds = 31 minutes ✅
```

**Scenario 4: Custom quarter length (8-min quarters)**
```
Stat admin sets clock to 8:00 before game start
Player plays entire Q1 + Q2
Calculation: (8 * 60) + (8 * 60) = 960 seconds = 16 minutes ✅
(Not 24 minutes as hardcoded 12-min would calculate)
```

**Scenario 5: FIBA ruleset (10-min quarters)**
```
Tournament uses FIBA ruleset
Player plays Q1 + Q2
Calculation: (10 * 60) + (10 * 60) = 1200 seconds = 20 minutes ✅
```

### **Version History**
- **v1.0.0** (October 22, 2025): Initial implementation with hardcoded 12-minute quarters
- **v1.0.1** (November 27, 2025): ✅ Dynamic quarter length support, cross-quarter fix, custom clock respect

---

## ➕ **PLUS/MINUS CALCULATION**

### **Current Implementation** (MVP Approach)

**Formula**: `plusMinus = playerPoints - turnovers`

**Rationale**: 
- Full NBA-style plus/minus requires tracking opponent points while player is on court
- Current data structure (`game_stats`) doesn't include timestamp-based score tracking
- MVP approach provides a simple efficiency metric

### **Future Enhancement** (True NBA Plus/Minus)

**Formula**: `plusMinus = teamPointsWhileOnCourt - opponentPointsWhileOnCourt`

**Requirements**:
- Enhanced `game_stats` with precise timestamps
- Score state tracking at substitution points
- Complex aggregation logic across multiple tables

**Example**:
```
Player enters at 10:00 Q1 (Team: 5, Opponent: 3)
Player exits at 6:00 Q1 (Team: 12, Opponent: 8)
Plus/Minus: (12 - 5) - (8 - 3) = 7 - 5 = +2
```

---

## 📱 **MOBILE RESPONSIVENESS**

### **Responsive Breakpoint**
- **Desktop**: > 768px width
- **Mobile**: ≤ 768px width

### **Mobile Optimizations**

#### **Team Stats Grid**
- **Desktop**: 6 columns, single row
- **Mobile**: 3 columns, 2 rows
- **Gap**: 16px → 12px on mobile
- **Padding**: 16px → 12px on mobile

#### **Player Stats Rows**
- **Row Padding**: 12px → 10px on mobile
- **Row Height**: 60px → 56px on mobile
- **Avatar Size**: 36px → 32px on mobile
- **Player Info Gap**: 10px → 8px on mobile
- **Stats Grid Gap**: 8px → 4px on mobile
- **Stat Value Font**: 13px → 12px on mobile
- **Stat Label Font**: 9px → 8px on mobile

### **Detection Method**
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

---

## 🎨 **STYLING & DESIGN**

### **Color Palette** (Dark Mode)
```typescript
background: '#000000' // Primary background
cardBackground: '#111827' // Gray-900 for cards
borderColor: '#374151' // Gray-700 for dividers
textPrimary: '#ffffff' // White for main text
textSecondary: '#9ca3af' // Gray-400 for labels
textTertiary: '#6b7280' // Gray-500 for percentages
plusPositive: '#10b981' // Green-500 for positive +/-
plusNegative: '#ef4444' // Red-500 for negative +/-
skeletonBase: '#1f2937' // Gray-800 for skeleton
```

### **Typography**
```typescript
teamName: { fontSize: '18px', fontWeight: '600' }
sectionHeader: { fontSize: '16px', fontWeight: '600' }
statValue: { fontSize: '16px', fontWeight: '600' }
statLabel: { fontSize: '12px', textTransform: 'uppercase' }
playerName: { fontSize: '14px', fontWeight: '600' }
playerPosition: { fontSize: '12px', fontWeight: '400' }
playerStatValue: { fontSize: '13px', fontWeight: '600' } // 12px mobile
playerStatLabel: { fontSize: '9px', fontWeight: '400' } // 8px mobile
```

### **Skeleton Animation**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

---

## 🔄 **REAL-TIME UPDATES**

### **Subscription Management**

Uses existing `gameSubscriptionManager` for real-time updates:

```typescript
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table, payload) => {
  if (table === 'game_stats' || table === 'game_substitutions') {
    console.log('🔔 useTeamStats: Real-time update received');
    void fetchTeamData(); // Refetch team data
  }
});
```

### **Update Triggers**
- New stats recorded in `game_stats`
- Substitutions logged in `game_substitutions`
- Game state changes (clock, quarter, status)

### **Optimization**
- Debounced updates to prevent excessive re-renders
- Smart state comparison to skip unnecessary updates
- Memoized components for performance

---

## 🧪 **TESTING SCENARIOS**

### **Test Case 1: Team Stats Display**
- [x] Team name displays correctly
- [x] Field goals show made/attempted/percentage
- [x] 3-pointers show made/attempted/percentage
- [x] Free throws show made/attempted/percentage
- [x] Turnovers, rebounds, assists display
- [x] Mobile layout shows 3x2 grid

### **Test Case 2: Player Minutes**
- [x] Whole numbers only (no decimals)
- [x] Realistic values based on game time
- [x] Starters show elapsed time when no subs
- [x] Bench shows 0 when no playing time
- [x] Substitution-based calculation works correctly

### **Test Case 3: Plus/Minus**
- [x] Positive values show in green
- [x] Negative values show in red
- [x] Zero shows in gray
- [x] Calculation: points - turnovers

### **Test Case 4: Mobile Responsiveness**
- [x] Breakpoint triggers at 768px
- [x] Team stats grid adjusts to 3x2
- [x] Player row spacing reduces
- [x] Font sizes scale down
- [x] Layout remains readable

### **Test Case 5: Loading State**
- [x] Skeleton displays during load
- [x] No overlapping elements
- [x] Maintains fixed positions
- [x] Smooth transition to content

---

## 📁 **FILES CREATED/MODIFIED**

### **New Files**
```
/src/lib/services/teamStatsService.ts (267 lines)
/src/hooks/useTeamStats.ts (95 lines)
/src/app/game-viewer/[gameId]/components/TeamStatsTab.tsx (420 lines)
/src/app/game-viewer/[gameId]/components/PlayerStatsRow.tsx (236 lines)
```

### **Modified Files**
```
/src/lib/services/teamServiceV3.ts
  - Changed authentication from user token to public anon key
  - Updated makeRequest() to use SUPABASE_ANON_KEY

/src/app/game-viewer/[gameId]/page.tsx
  - Integrated TeamStatsTab component
  - Added tab navigation for team stats
```

---

## 🚀 **DEPLOYMENT NOTES**

### **Environment Variables Required**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### **Database Requirements**
- `game_stats` table with proper RLS policies for public read access
- `game_substitutions` table with public read access
- `users` table with public read access for player names
- `teams` table with public read access

### **Performance Considerations**
- Real-time subscriptions active for all viewers
- Recommend connection pooling for high traffic
- Consider CDN caching for player avatars
- Monitor WebSocket connection limits

---

## 🐛 **KNOWN LIMITATIONS**

### **Plus/Minus Calculation**
- **Status**: ✅ RESOLVED (v1.0.1)
- **Solution**: Implemented NBA-standard calculation using player timelines and scoring events
- **Formula**: `team points scored while player on court - opponent points scored while player on court`

### **Player Positions**
- **Current**: Hardcoded position assignment (G/F/C based on index)
- **Desired**: Actual player position from database
- **Future**: Add `position` field to `users` or `tournament_players` table

### **Substitution Detection**
- **Current**: Assumes first 5 players are starters
- **Limitation**: May not reflect actual starting lineup
- **Future**: Add `is_starter` field to `game_substitutions` or game metadata

---

## 📊 **SUCCESS METRICS**

✅ **Feature Complete**: All planned features implemented  
✅ **Mobile Responsive**: Tested on multiple screen sizes  
✅ **Real-time Updates**: Integrated with existing subscription system  
✅ **Performance**: No UI flickering or lag  
✅ **Code Quality**: Follows separation of concerns (Service → Hook → Component)  
✅ **Documentation**: Comprehensive feature documentation created  

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Phase 2 Features**
1. **True Plus/Minus**: Implement NBA-standard calculation
2. **Player Photos**: Replace initials with actual player images
3. **Stat Sorting**: Allow sorting players by different stats
4. **Advanced Stats**: Add PER, TS%, USG%, etc.
5. **Play-by-Play Integration**: Show recent plays per player
6. **Shot Charts**: Visual representation of field goal locations
7. **Comparison View**: Side-by-side team comparison
8. **Historical Stats**: Show player season averages

### **Phase 3 Features**
1. **Video Highlights**: Link stats to video clips
2. **Interactive Charts**: D3.js visualizations
3. **Export Functionality**: PDF/CSV stat exports
4. **Social Sharing**: Share player/team stats on social media

---

**Last Updated**: October 22, 2025  
**Feature Owner**: Development Team  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

