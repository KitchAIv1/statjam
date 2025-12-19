# PLANNED FIXES - PENDING IMPLEMENTATION

> **Status**: DOCUMENTED - To be implemented later  
> **Created**: December 15, 2025  
> **Priority**: P0 (Critical)

---

## FIX #1: JWT Token Refresh for Write Operations

### Problem Summary

During long tracking sessions (1+ hours), Supabase JWT tokens expire, causing:
- Stat saves to fail with 401 "JWT expired" errors
- WebSocket connections to drop
- Data loss for users tracking games

### Root Cause

Write operations (`recordStat`, `recordTimeout`, `updateGameStatus`, etc.) do **NOT** have token refresh logic, while read operations (`makeRequest`) do.

### Error Logs (Example)

```
🔌 WS CLOSED [games-id=eq.38d7f2a4...]
🔌 WS CLOSED [game_stats-game_id=eq.38d7f2a4...]
❌ StatEditService: Failed to create stat: {"code":"PGRST301","message":"JWT expired"}
```

### Files Affected

| File | Method | Issue |
|------|--------|-------|
| `src/lib/services/gameServiceV3.ts` | `recordStat()` | No token refresh on 401 |
| `src/lib/services/gameServiceV3.ts` | `recordTimeout()` | No token refresh on 401 |
| `src/lib/services/gameServiceV3.ts` | `updateGameStatus()` | No token refresh on 401 |
| `src/lib/services/gameServiceV3.ts` | `updateAutomationSettings()` | No token refresh on 401 |
| `src/lib/services/gameServiceV3.ts` | `updateInitialClock()` | No token refresh on 401 |
| `src/lib/services/gameServiceV3.ts` | `updateCurrentPossession()` | No token refresh on 401 |
| `src/lib/services/statEditService.ts` | `createStat()` | No token refresh on 401 |
| `src/lib/services/statEditService.ts` | `updateStat()` | No token refresh on 401 |
| `src/lib/services/statEditService.ts` | `deleteStat()` | No token refresh on 401 |
| `src/lib/services/statWriteQueueService.ts` | `isTransientError()` | 401 not treated as retryable |

### Planned Fixes

#### Fix 1A: Add Token Refresh to Write Methods (P0)

Add the same token refresh pattern from `makeRequest()` to all write methods:

```typescript
// Example pattern to add to recordStat and other write methods:
if ((response.status === 401 || response.status === 403) && retryCount === 0) {
  console.log('🔐 GameServiceV3: Authentication error detected, attempting token refresh...');
  
  const { authServiceV2 } = await import('@/lib/services/authServiceV2');
  const session = authServiceV2.getSession();
  
  if (session.refreshToken) {
    const { data, error } = await authServiceV2.refreshToken(session.refreshToken);
    
    if (data && !error) {
      console.log('✅ GameServiceV3: Token refreshed, retrying request...');
      return this.recordStat(statData, retryCount + 1); // Retry with new token
    }
  }
}
```

#### Fix 1B: Update statWriteQueueService (P1)

Add 401 to transient errors with token refresh attempt:

```typescript
private isTransientError(error: any): boolean {
  const statusMatch = error.message?.match(/HTTP (\d+)/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1]);
    // Add 401 as retryable (with token refresh)
    return status === 401 || status === 500 || status === 502 || status === 503 || status === 504;
  }
  return false;
}
```

#### Fix 1C: Add Visibility Change Detection (P2)

Trigger immediate token refresh when browser tab becomes active:

```typescript
// In useAuthV2.ts or a dedicated hook
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      // Check if token is expired or expiring soon
      const session = authServiceV2.getSession();
      if (session.accessToken && isTokenExpired(session.accessToken, 5)) {
        await refreshSession();
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

#### Fix 1D: Reduce Timer Interval (P3)

Change 45-minute interval to 30-minute for extra safety:

```typescript
// In useAuthV2.ts, line 135
}, 30 * 60 * 1000); // 30 minutes instead of 45
```

### Impact

- **Stat Admin**: Affected (same code path)
- **Coach Mode**: Affected (same code path)
- **Both modes use identical token handling**

---

## FIX #2: Coach Game Minutes Calculation

### Problem Summary

In coach mode team tabs, players who started a game and were never substituted out (but also didn't record any statistics) showed 0 minutes played. This was already implemented but documenting for reference.

### Root Cause

The `calculatePlayerMinutes()` function in `TeamStatsService` did not use array position (`index < 5`) as a fallback for identifying starters when they had no substitution records and no stats.

### Fix Applied (Completed ✅)

Modified `src/lib/services/teamStatsService.ts` at lines 536-547:

```typescript
playerIds.forEach((playerId, index) => {
  if (!playersInSubs.has(playerId)) {
    // Never appeared in substitutions - check if they have stats OR are in first 5 (starter position)
    // This aligns with plus/minus calculation (line 703) which uses index < 5 for starters
    if (playersWithStats.has(playerId) || index < 5) {
      // Has stats OR is in first 5 positions = starter (played full game)
      inferredStarters.add(playerId);
    }
    // Only true DNP = no subs + no stats + NOT in first 5 positions
  }
});
```

### Status

**COMPLETED** - This fix has been implemented and committed.

---

## Implementation Notes

### Order of Implementation

1. **FIX #1A** (P0) - Critical: Token refresh for write operations
2. **FIX #1B** (P1) - Important: Queue service retry logic
3. **FIX #1C** (P2) - Nice-to-have: Visibility change detection
4. **FIX #1D** (P3) - Minor: Reduce timer interval

### Testing Required

- [ ] Long-duration tracking session (1+ hour)
- [ ] Background tab behavior
- [ ] Token refresh under network latency
- [ ] WebSocket reconnection after token refresh

### Related Files

- `src/lib/services/authServiceV2.ts` - Token refresh logic
- `src/hooks/useAuthV2.ts` - Timer and session management
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/utils/tokenRefresh.ts` - Existing utility (not currently used by services)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-15 | AI Assistant | Initial documentation created |

