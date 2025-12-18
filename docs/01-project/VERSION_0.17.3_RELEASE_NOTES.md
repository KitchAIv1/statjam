# StatJam v0.17.3 Release Notes

**Release Date**: December 15, 2025  
**Version**: 0.17.3  
**Type**: Security Update + Feature Enhancement  
**Status**: ✅ Production Ready

---

## 🎯 Overview

This release includes a critical security update for Next.js and introduces public viewing capabilities for coach games, enabling coaches to share game links without requiring viewer authentication.

---

## 🔒 Security Updates

### Next.js DoS Vulnerability Fix (CVE-2025-55184)

**Severity**: CRITICAL  
**Issue**: Denial of Service vulnerability affecting Next.js Server Components  
**Impact**: Malicious HTTP requests could cause server process hangs and CPU consumption  
**Fix**: Updated Next.js from `15.5.6` → `15.5.9`  
**Status**: ✅ Resolved (0 vulnerabilities remaining)

**Affected Versions**: >= 15.5.1-canary.0, < 15.5.8  
**Patched Version**: 15.5.9

**Technical Details**:
- Vulnerability tracked upstream as CVE-2025-55184
- Affects React packages 19.0.0-19.2.1 and Next.js 15.x/16.x using App Router
- Fixed in Next.js 15.5.8+ (upgraded to 15.5.9 for latest patches)

---

## 🌐 New Features

### Coach Games Public Viewing

**Feature**: Enable public viewing of coach games via shared links  
**Security Model**: UUID-based link sharing (128-bit cryptographic security)  
**Pattern**: Same security model as Google Docs "anyone with link can view"

#### What's New

1. **Public Game Access**
   - Coach games can now be viewed without authentication
   - Shareable links work on any device (mobile, tablet, desktop)
   - No login required for viewers

2. **Complete Data Visibility**
   - Player names display correctly (no more "Player abc123...")
   - Team stats tabs show complete player rosters
   - Custom players visible in public view
   - All game data accessible: stats, substitutions, timeouts

3. **Enhanced Service Layer**
   - Improved error handling with automatic public access fallback
   - Handles expired/invalid tokens gracefully
   - Robust fallback logic for 403/401 errors

#### Technical Implementation

**Database Changes**:
- Migration `023_coach_games_public_view.sql` applied
- 8 new RLS policies for anonymous SELECT access:
  - `games_coach_public_view`
  - `game_stats_coach_public_view`
  - `game_substitutions_coach_public_view`
  - `game_timeouts_coach_public_view`
  - `teams_coach_game_public_view`
  - `team_players_coach_public_view`
  - `custom_players_coach_public_view`
  - Verified `users_anon_read` policy

**API Changes**:
- `/api/game-viewer/[gameId]/route.ts` - Conditional auth check
  - Coach games: No auth required
  - Non-coach games: Still require authentication

**Service Layer Changes**:
- `TeamServiceV3.getTeamPlayers()` - Enhanced fallback logic
  - Automatic public access fallback on auth failure
  - Improved error detection (403/401/permission errors)
  - Custom players query falls back to public access

#### Security Considerations

✅ **Safe & Isolated**:
- All policies are SELECT-only (read-only access)
- UUID game IDs provide cryptographic security (340+ undecillion combinations)
- Coach write policies remain unchanged (only owner can modify)
- No breaking changes to existing authenticated access

✅ **Security Model**:
- UUIDs are 128-bit random numbers (impossible to guess)
- Same pattern used by Google Docs, YouTube unlisted videos, Dropbox shared links
- Link shared = can view ✅
- No link = can't find it ❌
- Has link = can only READ, never edit ✅

---

## 📋 Files Changed

### Modified Files
- `package.json` - Next.js version update (15.5.6 → 15.5.9)
- `package-lock.json` - Dependency tree update
- `src/app/api/game-viewer/[gameId]/route.ts` - Conditional auth for coach games
- `src/lib/services/teamServiceV3.ts` - Enhanced public access fallback

### New Files
- `docs/05-database/migrations/023_coach_games_public_view.sql` - RLS policies migration

### Documentation Updates
- `CHANGELOG.md` - Added v0.17.3 entry
- `README.md` - Version bump to 0.17.3
- `PROJECT_STATUS.md` - Updated achievements and version
- `docs/05-database/migrations/README.md` - Added migration 023 documentation
- `VERSION_0.17.3_RELEASE_NOTES.md` - This file

---

## 🧪 Testing & Verification

### Security Testing
- ✅ npm audit: 0 vulnerabilities
- ✅ Next.js 15.5.9 verified working
- ✅ All existing functionality preserved

### Feature Testing
- ✅ RLS policies applied successfully in production
- ✅ Public access works for coach games
- ✅ Player names display correctly
- ✅ Team stats tabs show complete rosters
- ✅ Custom players visible in public view
- ✅ Non-coach games still require authentication
- ✅ Mobile devices work without login
- ✅ Zero breaking changes

---

## 🚀 Deployment Notes

### Prerequisites
1. **Database Migration**: Run `023_coach_games_public_view.sql` in Supabase SQL Editor
2. **Code Deployment**: Deploy updated code to production
3. **Verification**: Test coach game link sharing on mobile device

### Migration Steps
```sql
-- Run in Supabase SQL Editor
-- File: docs/05-database/migrations/023_coach_games_public_view.sql
```

### Post-Deployment Verification
1. Test coach game link on mobile (without login)
2. Verify player names display correctly
3. Verify team tabs show player stats
4. Verify custom players visible
5. Verify non-coach games still require auth

---

## 📊 Impact Summary

| Area | Before | After |
|------|--------|-------|
| **Security Vulnerabilities** | 1 (CRITICAL) | 0 ✅ |
| **Coach Game Sharing** | Requires login | Public via link ✅ |
| **Mobile Access** | Blocked without auth | Full access ✅ |
| **Player Names** | Show as IDs | Display correctly ✅ |
| **Team Tabs** | Empty rosters | Complete stats ✅ |
| **Breaking Changes** | N/A | None ✅ |

---

## 🔄 Migration Path

### For Existing Coach Games
- **No action required** - All existing coach games automatically support public viewing
- Games can be shared immediately via link
- No data migration needed

### For Developers
- Review RLS policy changes in migration 023
- Update any custom queries that assume authentication
- Test public access fallback logic

---

## 📚 Related Documentation

- **Migration Guide**: `docs/05-database/migrations/023_coach_games_public_view.sql`
- **Changelog**: `docs/01-project/CHANGELOG.md` (v0.17.3 entry)
- **Security Advisory**: Next.js Security Update (Dec 11, 2025)
- **RLS Policies**: `docs/05-database/migrations/README.md`

---

## 🎉 Summary

This release delivers critical security improvements and enhances coach game sharing capabilities. The public viewing feature enables coaches to easily share game links while maintaining strong security through UUID-based access control.

**Key Benefits**:
- ✅ Zero security vulnerabilities
- ✅ Easy game link sharing for coaches
- ✅ Full mobile support without login
- ✅ Complete player stats visibility
- ✅ No breaking changes

---

**Questions or Issues?**  
Contact the development team or refer to the troubleshooting documentation.
