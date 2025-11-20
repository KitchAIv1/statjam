# Custom Player Photo Fix Summary

## 🔍 Problem Identified

**Root Cause**: Photos are being uploaded to storage successfully, but the photo URLs are **NOT being saved to the database** after upload.

### Evidence:
- ✅ Storage has 3 photo files uploaded
- ✅ Database columns exist (`profile_photo_url`, `pose_photo_url`)
- ✅ Only 1 out of 20+ custom players has a photo URL saved (Zachariah Fakhri)
- ❌ All other players have `NULL` photo URLs in database

## 🔧 Fixes Applied

### 1. **Improved Error Logging** ✅
- **File**: `statjam/src/components/coach/CreateCustomPlayerForm.tsx`
- **Changes**: 
  - Replaced silent `.catch(console.error)` with proper try/catch blocks
  - Added detailed error logging with context
  - Added success logging to confirm when updates work

### 2. **Improved Error Logging (Organizer Form)** ✅
- **File**: `statjam/src/components/shared/CustomPlayerForm.tsx`
- **Changes**:
  - Enhanced error logging with error details
  - Added SELECT after UPDATE to verify data was saved
  - Better error context logging

### 3. **Fixed Tournament Service Query** ✅
- **File**: `statjam/src/lib/services/tournamentService.ts`
- **Changes**:
  - Added `profile_photo_url` and `pose_photo_url` to custom_players query
  - Added `profilePhotoUrl` mapping in custom player transformation

## 📋 Next Steps - Diagnostic Queries

### Step 1: Test Manual Update (Verify RLS)
Run this in Supabase SQL Editor to test if RLS allows updates:

```sql
-- Replace with actual player ID from your test
UPDATE custom_players
SET profile_photo_url = 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/custom-players/8bbb5f60-70af-46f6-b609-f00b62cea586/profile.jpg'
WHERE id = '8bbb5f60-70af-46f6-b609-f00b62cea586'
AND coach_id = '87bdbce5-fb1a-441e-adcf-4d6fe5c4365e'
RETURNING id, name, profile_photo_url;
```

**Expected**: Should return 1 row with updated `profile_photo_url`
**If fails**: RLS policy issue - run `FIX_CUSTOM_PLAYER_UPDATE_RLS.sql`

### Step 2: Check Browser Console
After uploading a photo, check browser console for:
- ✅ Success messages: `"✅ Photo URLs saved successfully"`
- ❌ Error messages: `"❌ Failed to save profile photo URL to database"`

### Step 3: Verify Storage Files Exist
Check if photos are actually in storage for the player:

```sql
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'player-images'
AND name LIKE 'custom-players/8bbb5f60-70af-46f6-b609-f00b62cea586/%'
ORDER BY name;
```

## 🐛 Most Likely Issues

### Issue 1: RLS Policy Missing WITH CHECK Clause
**Symptom**: Update fails silently, no error in console
**Fix**: Run `FIX_CUSTOM_PLAYER_UPDATE_RLS.sql`

### Issue 2: Update Happens But SELECT Doesn't Return Data
**Symptom**: Update succeeds but `updateResponse.player` is missing photo URLs
**Fix**: Already fixed - added `.select()` to verify data

### Issue 3: Race Condition
**Symptom**: Photo uploads but update happens before upload completes
**Fix**: Already handled - update happens after upload completes

## 🧪 Testing Instructions

1. **Clear browser cache** and refresh
2. **Create a new custom player** with a photo
3. **Check browser console** for error messages
4. **Run verification query** to check if URL was saved:
   ```sql
   SELECT id, name, profile_photo_url, pose_photo_url
   FROM custom_players
   WHERE id = 'NEW_PLAYER_ID';
   ```
5. **Check tournament players tab** - photo should appear

## 📝 Files Modified

1. `statjam/src/lib/services/tournamentService.ts` - Fixed query and mapping
2. `statjam/src/components/coach/CreateCustomPlayerForm.tsx` - Improved error handling
3. `statjam/src/components/shared/CustomPlayerForm.tsx` - Improved error handling

## 📝 SQL Files Created

1. `statjam/database/VERIFY_CUSTOM_PLAYER_PHOTOS.sql` - Comprehensive verification
2. `statjam/database/DIAGNOSE_PHOTO_UPDATE_ISSUE.sql` - RLS diagnostic
3. `statjam/database/FIX_CUSTOM_PLAYER_UPDATE_RLS.sql` - RLS policy fix
4. `statjam/database/migrations/018_add_custom_player_photos.sql` - Migration (if needed)

## ✅ Expected Outcome

After fixes:
- Photos upload to storage ✅
- Photo URLs save to database ✅
- Photos display on player cards ✅
- Console shows clear success/error messages ✅

