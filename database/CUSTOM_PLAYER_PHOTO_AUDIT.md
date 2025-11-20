# Custom Player Photo Display Audit

## 🔍 Issue Summary

Two critical issues identified with custom player photos:

### Issue 1: Photos Not Saved During Creation ❌
**Symptom**: When creating a new custom player with photos, photos upload to storage but URLs are NOT saved to database.

**Root Causes Identified**:

1. **Race Condition in Photo Upload Flow**
   - `customPlayerId` starts as `null` (line 39)
   - User selects photo BEFORE player creation → stored in `pendingProfileFile`
   - Player is created → `setCustomPlayerId(response.player.id)` (line 94)
   - Photo upload starts → calls `onProfilePhotoChange` callback
   - **PROBLEM**: Callback checks `if (customPlayerId && url)` (line 300), but `customPlayerId` might not be set yet if upload completes quickly
   - Result: URL not saved to database

2. **Silent Failure in Upload Error Handling**
   - If upload fails in try/catch (lines 104-120), error is logged but `photoUpdates` remains empty
   - Update at line 146 checks `if (Object.keys(photoUpdates).length > 0)` → doesn't run
   - Result: No error shown to user, no URL saved

3. **Timing Issue with Callback Updates**
   - `onProfilePhotoChange` callback (lines 297-313) only saves if `customPlayerId` exists
   - But this callback fires DURING upload, which happens AFTER player creation
   - If `customPlayerId` state hasn't updated yet, callback fails silently

### Issue 2: Photos Display on Cards But Not Profile Modal ❌
**Symptom**: Photos display correctly on player cards (tournament players tab, coach manage players) but NOT on Player Profile Modal (season averages view).

**Root Causes Identified**:

1. **Cache Staleness**
   - `PlayerDashboardService.getCustomPlayerIdentity` uses cache (lines 222-227)
   - Cache key: `custom_player_${customPlayerId}`
   - Cache TTL: `CacheTTL.USER_DATA` (15 minutes)
   - **PROBLEM**: If player was viewed BEFORE photo was uploaded, cache contains old data without photos
   - Cache is not invalidated when photos are updated
   - Result: Profile modal shows cached data without photos

2. **Cache Not Cleared on Update**
   - When photos are updated via `CoachPlayerService.updateCustomPlayer`, cache is NOT cleared
   - Profile modal continues to show stale cached data
   - Result: Photos exist in DB but modal shows old cached version

## 📊 Data Flow Analysis

### Creation Flow (Issue 1):
```
1. User selects photo → stored in pendingProfileFile
2. User submits form → player created
3. setCustomPlayerId(response.player.id) → state update (async)
4. Upload starts → uploadCustomPlayerPhoto()
5. Upload completes → onProfilePhotoChange(url) callback fires
6. Callback checks: if (customPlayerId && url) → might be false if state not updated
7. Update database → might not happen
```

### Display Flow (Issue 2):
```
1. User opens profile modal → PlayerProfileModal opens
2. Calls PlayerDashboardService.getIdentity(playerId, isCustomPlayer)
3. Checks cache → finds stale entry (without photos)
4. Returns cached data → photos missing
5. User sees profile without photos
```

## 🔧 Required Fixes

### Fix 1: Ensure Photos Saved During Creation
1. **Wait for customPlayerId state update** before starting uploads
2. **Use response.player.id directly** instead of relying on state
3. **Ensure database update happens** even if callback fails
4. **Add retry logic** for database updates

### Fix 2: Clear Cache on Photo Updates
1. **Clear cache** when photos are updated via `updateCustomPlayer`
2. **Invalidate cache** in `PlayerDashboardService` when custom player is updated
3. **Add cache invalidation** to `CoachPlayerService.updateCustomPlayer`

## 📝 Files to Modify

### Issue 1 Fixes:
- `statjam/src/components/coach/CreateCustomPlayerForm.tsx`
  - Use `response.player.id` directly instead of `customPlayerId` state
  - Ensure database update happens after upload completes
  - Add error handling and retry logic

- `statjam/src/components/shared/CustomPlayerForm.tsx`
  - Same fixes as above

### Issue 2 Fixes:
- `statjam/src/lib/services/coachPlayerService.ts`
  - Clear cache after updating custom player photos
  - Invalidate `custom_player_${id}` cache key

- `statjam/src/lib/services/playerDashboardService.ts`
  - Add method to invalidate custom player cache
  - Or clear cache in `getCustomPlayerIdentity` if data is stale

## 🧪 Testing Checklist

### Issue 1 Testing:
- [ ] Create new custom player with photo → verify photo URL saved to database
- [ ] Check browser console for upload errors
- [ ] Verify photo appears on player card immediately after creation
- [ ] Test with slow network to catch race conditions

### Issue 2 Testing:
- [ ] Edit existing custom player → add photo → verify photo displays on profile modal
- [ ] Check if cache is cleared after photo update
- [ ] Verify photo appears immediately after update (no refresh needed)
- [ ] Test with multiple players to verify cache invalidation works

## 🎯 Success Criteria

1. ✅ Photos saved to database during creation
2. ✅ Photos display on player cards after creation
3. ✅ Photos display on profile modal after creation
4. ✅ Photos display on profile modal after editing
5. ✅ No cache staleness issues
6. ✅ No race conditions

