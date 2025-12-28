# Phase 2 Implementation Prompt for Cursor

**Date**: December 18, 2025  
**Status**: ✅ Ready for Implementation  
**Prerequisites**: ✅ Verified - EnhancedScoreOverlay component exists

---

## 🎯 Implementation Request

I need you to implement Phase 2 data fetching enhancements for `OrganizerLiveStream` component.

---

## ✅ Prerequisites (VERIFIED)

- ✅ **EnhancedScoreOverlay component exists** at `src/components/live-streaming/EnhancedScoreOverlay.tsx`
- ✅ **Database schema verified** - all required columns exist
- ✅ **This is ENHANCEMENT ONLY** - must not break existing functionality

---

## 📋 Implementation Steps

### **Step 1: Update Query** (Lines 168-185)

**File**: `src/components/OrganizerLiveStream.tsx`

**Action**: Extend existing query with enhanced joins

**Current Query:**
```typescript
const { data, error } = await supabase
  .from('games')
  .select(`
    id,
    quarter,
    home_score,
    away_score,
    status,
    team_a_id,
    team_b_id,
    game_clock_minutes,
    game_clock_seconds,
    team_a:teams!team_a_id(name),
    team_b:teams!team_b_id(name)
  `)
  .in('status', ['live', 'in_progress', 'LIVE', 'IN_PROGRESS'])
  .order('created_at', { ascending: false })
  .limit(20);
```

**Enhanced Query (Add these fields):**
```typescript
const { data, error } = await supabase
  .from('games')
  .select(`
    id,
    quarter,
    home_score,
    away_score,
    status,
    team_a_id,
    team_b_id,
    game_clock_minutes,
    game_clock_seconds,
    team_a_fouls,
    team_b_fouls,
    team_a_timeouts_remaining,
    team_b_timeouts_remaining,
    current_possession_team_id,
    jump_ball_arrow_team_id,
    venue,
    team_a:teams!team_a_id(
      id,
      name,
      logo_url,
      primary_color,
      secondary_color,
      accent_color
    ),
    team_b:teams!team_b_id(
      id,
      name,
      logo_url,
      primary_color,
      secondary_color,
      accent_color
    )
  `)
  .in('status', ['live', 'in_progress', 'LIVE', 'IN_PROGRESS'])
  .order('created_at', { ascending: false })
  .limit(20);
```

**Key Points:**
- ✅ Keep ALL existing fields
- ✅ Add game state fields from `games` table
- ✅ Add team branding fields via joins
- ✅ Add `venue` field

---

### **Step 2: Update Interface** (Lines 11-24)

**File**: `src/components/OrganizerLiveStream.tsx`

**Action**: Add optional enhanced fields to existing `LiveGame` interface

**Current Interface:**
```typescript
interface LiveGame {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name: string;
  team_b_name: string;
  home_score: number;
  away_score: number;
  quarter: number;
  status: string;
  game_clock_minutes: number;
  game_clock_seconds: number;
  shot_clock_seconds?: number;
}
```

**Enhanced Interface (Add optional fields):**
```typescript
interface LiveGame {
  // Existing required fields
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name: string;
  team_b_name: string;
  home_score: number;
  away_score: number;
  quarter: number;
  status: string;
  game_clock_minutes: number;
  game_clock_seconds: number;
  shot_clock_seconds?: number;
  
  // NEW: Enhanced fields (all optional)
  team_a_logo?: string;
  team_b_logo?: string;
  team_a_primary_color?: string;
  team_b_primary_color?: string;
  team_a_secondary_color?: string;
  team_b_secondary_color?: string;
  team_a_accent_color?: string;
  team_b_accent_color?: string;
  team_a_fouls?: number;
  team_b_fouls?: number;
  team_a_timeouts?: number;
  team_b_timeouts?: number;
  current_possession_team_id?: string;
  jump_ball_arrow_team_id?: string;
  venue?: string;
}
```

**Key Points:**
- ✅ Keep ALL existing fields unchanged
- ✅ Add new fields as optional (`?`)
- ✅ Use descriptive names matching database columns

---

### **Step 3: Update Data Transformation** (Lines 192-205)

**File**: `src/components/OrganizerLiveStream.tsx`

**Action**: Map enhanced query results to interface

**Current Mapping:**
```typescript
const formattedGames: LiveGame[] = (data || []).map((game: any) => ({
  id: game.id,
  team_a_id: game.team_a_id,
  team_b_id: game.team_b_id,
  team_a_name: game.team_a?.name || 'Team A',
  team_b_name: game.team_b?.name || 'Team B',
  home_score: game.home_score || 0,
  away_score: game.away_score || 0,
  quarter: game.quarter || 1,
  status: game.status,
  game_clock_minutes: game.game_clock_minutes || 10,
  game_clock_seconds: game.game_clock_seconds || 0,
  shot_clock_seconds: undefined,
}));
```

**Enhanced Mapping (Add new fields):**
```typescript
const formattedGames: LiveGame[] = (data || []).map((game: any) => ({
  // Existing fields
  id: game.id,
  team_a_id: game.team_a_id,
  team_b_id: game.team_b_id,
  team_a_name: game.team_a?.name || 'Team A',
  team_b_name: game.team_b?.name || 'Team B',
  home_score: game.home_score || 0,
  away_score: game.away_score || 0,
  quarter: game.quarter || 1,
  status: game.status,
  game_clock_minutes: game.game_clock_minutes || 10,
  game_clock_seconds: game.game_clock_seconds || 0,
  shot_clock_seconds: undefined,
  
  // Enhanced fields
  team_a_logo: game.team_a?.logo_url,
  team_b_logo: game.team_b?.logo_url,
  team_a_primary_color: game.team_a?.primary_color,
  team_b_primary_color: game.team_b?.primary_color,
  team_a_secondary_color: game.team_a?.secondary_color,
  team_b_secondary_color: game.team_b?.secondary_color,
  team_a_accent_color: game.team_a?.accent_color,
  team_b_accent_color: game.team_b?.accent_color,
  team_a_fouls: game.team_a_fouls,
  team_b_fouls: game.team_b_fouls,
  team_a_timeouts: game.team_a_timeouts_remaining,
  team_b_timeouts: game.team_b_timeouts_remaining,
  current_possession_team_id: game.current_possession_team_id,
  jump_ball_arrow_team_id: game.jump_ball_arrow_team_id,
  venue: game.venue,
}));
```

**Key Points:**
- ✅ Keep ALL existing mappings unchanged
- ✅ Extract team branding from `team_a` and `team_b` objects
- ✅ Map game state fields directly from `game` object
- ✅ Use optional chaining (`?.`) for nested properties

---

### **Step 4: Update Realtime Subscription** (Lines 234-262)

**File**: `src/components/OrganizerLiveStream.tsx`

**Action**: Extract additional fields from `payload.new` (they're already there!)

**Current Handler:**
```typescript
setSelectedGame(prev => {
  if (!prev) return null;
  return {
    ...prev,
    home_score: payload.new.home_score || 0,
    away_score: payload.new.away_score || 0,
    quarter: payload.new.quarter || prev.quarter,
    game_clock_minutes: payload.new.game_clock_minutes ?? prev.game_clock_minutes,
    game_clock_seconds: payload.new.game_clock_seconds ?? prev.game_clock_seconds,
  };
});
```

**Enhanced Handler (Extract more fields):**
```typescript
setSelectedGame(prev => {
  if (!prev) return null;
  return {
    ...prev,
    // Existing fields
    home_score: payload.new.home_score || 0,
    away_score: payload.new.away_score || 0,
    quarter: payload.new.quarter || prev.quarter,
    game_clock_minutes: payload.new.game_clock_minutes ?? prev.game_clock_minutes,
    game_clock_seconds: payload.new.game_clock_seconds ?? prev.game_clock_seconds,
    // NEW: Extract these from payload.new (they're already in the payload!)
    team_a_fouls: payload.new.team_a_fouls,
    team_b_fouls: payload.new.team_b_fouls,
    team_a_timeouts: payload.new.team_a_timeouts_remaining,
    team_b_timeouts: payload.new.team_b_timeouts_remaining,
    current_possession_team_id: payload.new.current_possession_team_id,
    jump_ball_arrow_team_id: payload.new.jump_ball_arrow_team_id,
    venue: payload.new.venue,
  };
});
```

**Key Points:**
- ✅ Keep ALL existing field updates unchanged
- ✅ **IMPORTANT**: All `games` columns are already in `payload.new` - just extract them!
- ✅ No need to modify subscription setup (lines 235-262)
- ✅ Team logos/colors won't update in realtime (they're in `teams` table, not `games`)

---

### **Step 5: Replace Overlay Component** (Lines 397-408)

**File**: `src/components/OrganizerLiveStream.tsx`

**Action**: Replace old `ScoreOverlay` with `EnhancedScoreOverlay`

**Step 5a: Add Import** (Top of file, line ~9)

**Add this import:**
```typescript
import { EnhancedScoreOverlay } from '@/components/live-streaming/EnhancedScoreOverlay';
```

**Step 5b: Replace Component** (Lines 397-408)

**Current Rendering:**
```typescript
{selectedGame && (
  <ScoreOverlay
    teamAName={selectedGame.team_a_name}
    teamBName={selectedGame.team_b_name}
    homeScore={selectedGame.home_score}
    awayScore={selectedGame.away_score}
    quarter={selectedGame.quarter}
    gameClockMinutes={selectedGame.game_clock_minutes}
    gameClockSeconds={selectedGame.game_clock_seconds}
    shotClockSeconds={selectedGame.shot_clock_seconds}
  />
)}
```

**Enhanced Rendering:**
```typescript
{selectedGame && (
  <EnhancedScoreOverlay
    // Existing props
    teamAName={selectedGame.team_a_name}
    teamBName={selectedGame.team_b_name}
    homeScore={selectedGame.home_score}
    awayScore={selectedGame.away_score}
    quarter={selectedGame.quarter}
    gameClockMinutes={selectedGame.game_clock_minutes}
    gameClockSeconds={selectedGame.game_clock_seconds}
    shotClockSeconds={selectedGame.shot_clock_seconds}
    
    // Enhanced props (with fallbacks)
    teamALogo={selectedGame.team_a_logo}
    teamBLogo={selectedGame.team_b_logo}
    teamAPrimaryColor={selectedGame.team_a_primary_color}
    teamBPrimaryColor={selectedGame.team_b_primary_color}
    teamASecondaryColor={selectedGame.team_a_secondary_color}
    teamBSecondaryColor={selectedGame.team_b_secondary_color}
    teamAFouls={selectedGame.team_a_fouls ?? 0}
    teamBFouls={selectedGame.team_b_fouls ?? 0}
    teamATimeouts={selectedGame.team_a_timeouts ?? 5}
    teamBTimeouts={selectedGame.team_b_timeouts ?? 5}
    currentPossessionTeamId={selectedGame.current_possession_team_id}
    jumpBallArrowTeamId={selectedGame.jump_ball_arrow_team_id}
    teamAId={selectedGame.team_a_id}
    teamBId={selectedGame.team_b_id}
    venue={selectedGame.venue}
  />
)}
```

**Key Points:**
- ✅ Keep ALL existing props
- ✅ Add enhanced props with nullish coalescing (`??`) for defaults
- ✅ Use `team_a_id` and `team_b_id` for possession comparison
- ✅ Remove old `ScoreOverlay` import if no longer used

---

## 🚨 Critical Rules

### **1. NO BREAKING CHANGES**
- ✅ All existing functionality must work exactly as before
- ✅ Game selection must work
- ✅ WebRTC streaming must work
- ✅ Realtime score updates must work

### **2. All New Fields Are OPTIONAL**
- ✅ Use optional chaining (`?.`) for nested properties
- ✅ Use nullish coalescing (`??`) for defaults
- ✅ Don't break if enhanced data is missing

### **3. Type Safety**
- ✅ TypeScript should catch any type mismatches
- ✅ All new fields are optional in interface
- ✅ Use proper type annotations

### **4. Testing Checklist**
After implementation, verify:
- [ ] Game selection dropdown still works
- [ ] WebRTC video streaming still works
- [ ] Realtime score updates still work
- [ ] Enhanced overlay displays correctly
- [ ] Fouls/timeouts update in realtime
- [ ] Possession indicator updates
- [ ] No console errors
- [ ] No TypeScript errors

---

## 📝 Implementation Order

1. **Step 1**: Update query (show me the updated query code first)
2. **Step 2**: Update interface
3. **Step 3**: Update data transformation
4. **Step 4**: Update realtime subscription
5. **Step 5**: Replace overlay component

**Start with Step 1 and show me the updated query code before proceeding.**

---

## 📚 Reference Documents

- **Detailed Analysis**: `PHASE2_DATA_FETCHING_ANALYSIS.md`
- **Revised Implementation Guide**: `PHASE2_REVISED_IMPLEMENTATION.md`
- **Enhanced Overlay Component**: `src/components/live-streaming/EnhancedScoreOverlay.tsx`

---

## ✅ Verification

Before starting, verify:
- [x] EnhancedScoreOverlay component exists at `src/components/live-streaming/EnhancedScoreOverlay.tsx`
- [x] All database columns exist (verified in audit)
- [x] Current OrganizerLiveStream functionality is working

**Ready to implement!** 🚀

