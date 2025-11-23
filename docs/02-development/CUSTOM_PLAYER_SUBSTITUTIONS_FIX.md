# Custom Player Substitutions Fix - November 2025

**Date**: November 23, 2025  
**Status**: ✅ COMPLETED  
**Priority**: HIGH  
**Type**: Bug Fix + Feature Enhancement

---

## 🎯 Overview

Fixed critical issues preventing custom players from being substituted in games, and resolved display issues where custom player names showed as "UNKNOWN" or ID numbers instead of actual names.

---

## 🐛 Issues Fixed

### Issue 1: Custom Players Could Not Be Substituted
**Symptom**: Substitutions failed with 403 errors when trying to substitute custom players  
**Root Cause**: `game_substitutions` table only had foreign key constraints to `users.id`, not `custom_players.id`  
**Impact**: Coaches and stat_admins could not substitute custom players in games

### Issue 2: Custom Player Names Showing as "UNKNOWN" in Edit Stats
**Symptom**: Edit game stats modal showed "Unknown Player → Unknown Player" for custom player substitutions  
**Root Cause**: `StatEditModal.getPlayerName()` only checked `stat.player_id`, not `stat.custom_player_id`  
**Impact**: Could not identify which custom players were substituted

### Issue 3: Custom Player Names Showing as ID Numbers in Game Viewer
**Symptom**: Game viewer showed "Player 2adcc3f0 → Player b65e4621" instead of actual names  
**Root Cause**: 
- `useGameViewerV2` wasn't querying `custom_players` table for substitution custom player IDs
- `subsToPlay.ts` transformer hardcoded names as `Player ${id.substring(0, 8)}`  
**Impact**: Unreadable substitution display in play-by-play feed

### Issue 4: Custom Player Photos Not Displaying in Tracker
**Symptom**: Custom player photos didn't show in stat tracker roster  
**Root Cause**: `TeamServiceV3.getTeamPlayers()` didn't include `profile_photo_url` in SELECT query  
**Impact**: Custom players appeared without photos in tracker

### Issue 5: Jersey Numbers Showing as '?' Instead of '0'
**Symptom**: Jersey numbers 0, 00, 000 displayed as '?'  
**Root Cause**: Used `jerseyNumber || '?'` which treats `0` as falsy  
**Impact**: Incorrect jersey number display throughout application

---

## ✅ Solutions Implemented

### 1. Database Migration 008: Custom Player Substitutions Support

**File**: `docs/05-database/migrations/008_game_substitutions_custom_players.sql`

**Changes**:
- Added `custom_player_in_id` and `custom_player_out_id` columns (UUID, nullable, FK to `custom_players`)
- Made `player_in_id` and `player_out_id` nullable
- Added CHECK constraints to ensure either regular OR custom player ID is set (not both, not neither)
- Added indexes for performance
- Updated RLS policies to allow:
  - Coaches to substitute their custom players
  - Coaches to substitute in games where they own the team
  - Stat_admins to substitute custom players (even when `stat_admin_id` is null)

**Safety**: 100% safe, follows proven pattern from Migration 007

### 2. Backend Service Updates

**Files Updated**:
- `gameService.ts` - `recordSubstitution()` now accepts `isCustomPlayerIn` and `isCustomPlayerOut` flags
- `teamServiceV3.ts` - `getTeamPlayers()` now includes `profile_photo_url` for custom players
- `teamServiceV3.ts` - `getTeamPlayersWithSubstitutions()` queries both regular and custom player IDs
- `teamStatsService.ts` - Minutes and plus/minus calculations handle custom player substitutions
- `statEditService.ts` - `getSubstitutionEvents()` maps custom player IDs correctly
- `substitutionsService.ts` - Interface updated to include custom player ID fields

**Pattern Used**:
```typescript
// Consistent pattern throughout:
const playerInId = sub.player_in_id || sub.custom_player_in_id;
const playerOutId = sub.player_out_id || sub.custom_player_out_id;
```

### 3. Frontend Hook Updates

**Files Updated**:
- `useTracker.ts` - `substitute()` detects custom players and passes flags to backend
- `useGameViewerV2.ts` - Separates regular and custom player IDs, queries both tables
- `stat-tracker-v3/page.tsx` - `handleSubConfirm()` detects custom players before substitution

**Key Fix in useGameViewerV2**:
```typescript
// Before: Only queried custom_players for stats, not substitutions
const allCustomPlayerIds = [...new Set([...statsCustomPlayerIds, ...subCustomPlayerIds])];

// Now queries custom_players table for ALL custom player IDs (stats + substitutions)
```

### 4. UI Component Fixes

**Files Updated**:
- `StatEditModal.tsx` - `getPlayerName()` now checks both `player_id` and `custom_player_id`
- `subsToPlay.ts` - Uses enriched `player_in_name` and `player_out_name` when available
- `SubstitutionModalV4.tsx` - Made scrollable with proper flex layout

**Jersey Number Fix**:
- Changed `jerseyNumber || '?'` to `jerseyNumber ?? '?'` in 16+ files
- Correctly handles `0` as a valid jersey number

---

## 📊 Files Changed

### Database
- `docs/05-database/migrations/008_game_substitutions_custom_players.sql` (NEW)
- `docs/05-database/migrations/008_DIAGNOSTIC_RLS_CHECK.sql` (NEW)
- `docs/05-database/migrations/008_MIGRATION_SAFETY_REPORT.md` (NEW)

### Backend Services
- `src/lib/services/gameService.ts`
- `src/lib/services/teamServiceV3.ts`
- `src/lib/services/teamStatsService.ts`
- `src/lib/services/statEditService.ts`
- `src/lib/services/substitutionsService.ts`

### Frontend Hooks & Components
- `src/hooks/useTracker.ts`
- `src/hooks/useGameViewerV2.ts`
- `src/app/stat-tracker-v3/page.tsx`
- `src/components/tracker-v3/modals/StatEditModal.tsx`
- `src/components/tracker-v3/SubstitutionModalV4.tsx`
- `src/lib/transformers/subsToPlay.ts`

### Type Definitions
- `src/lib/types/game.ts` - Added `custom_player_in_id` and `custom_player_out_id` to `GameSubstitution`

### Jersey Number Fix (16+ files)
- Multiple components and services updated to use `??` instead of `||`

---

## 🧪 Testing Checklist

### Custom Player Substitutions
- [x] Coach can substitute custom player in coach mode game
- [x] Coach can substitute custom player in tournament game (where coach owns team)
- [x] Stat_admin can substitute custom player in assigned game
- [x] Stat_admin can substitute custom player in unassigned game (stat_admin_id = null)
- [x] Substitution displays correctly in play-by-play feed
- [x] Substitution displays correctly in edit game stats modal
- [x] Custom player photos display in tracker roster

### Jersey Numbers
- [x] Jersey number 0 displays as "0" (not "?")
- [x] Jersey number 00 displays as "00" (not "?")
- [x] Jersey number 000 displays as "000" (not "?")
- [x] Null/undefined jersey numbers display as "?"

### UI Improvements
- [x] Substitution modal scrolls properly with long player lists
- [x] Header and footer stay fixed while content scrolls
- [x] Modal works correctly on mobile devices

---

## 📚 Related Documentation

- `docs/05-database/migrations/008_game_substitutions_custom_players.sql` - Migration script
- `docs/05-database/migrations/008_MIGRATION_SAFETY_REPORT.md` - Safety analysis
- `docs/05-database/migrations/007_game_stats_custom_players.sql` - Similar pattern for game_stats
- `docs/02-development/CUSTOM_PLAYER_PHOTO_UPLOAD_IMPLEMENTATION.md` - Custom player photo support

---

## 🎯 Summary

All custom player substitution issues have been resolved. The implementation follows the proven pattern established in Migration 007 for `game_stats` custom player support, ensuring consistency and safety. Custom players can now be fully substituted in games, with correct name and photo display throughout the application.

**Key Achievement**: Custom players now have feature parity with regular players for substitutions, stats, and display.

