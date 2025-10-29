# Timeout UI Fix - Preserving Zero Values

## 🐛 **Issue**

**Problem**: When all timeouts were used (count reaches 0), the UI would incorrectly display them as available again (showing 7 timeouts).

**Symptom**: 
- User uses all timeouts (count = 0)
- UI displays 7 filled timeout dots (appears to refill)
- Error handling correctly shows "No timeouts remaining"
- Visual display contradicts actual state

---

## 🔍 **Root Cause**

**Bug Location**: `useTracker.ts` lines 259-260 and `page.tsx` lines 876-877

**Issue**: Using logical OR (`||`) operator instead of nullish coalescing (`??`)

**Problem Code**:
```typescript
// ❌ BUG: || treats 0 as falsy, defaulting to 7
teamATimeouts: game.team_a_timeouts_remaining || 7
```

**Why It Fails**:
- JavaScript's `||` operator treats `0` as falsy
- When `team_a_timeouts_remaining = 0`, expression evaluates to `7`
- UI displays 7 timeouts even though database has 0

---

## ✅ **Fix Applied**

**Solution**: Replace `||` with `??` (nullish coalescing)

**Fixed Code**:
```typescript
// ✅ FIX: ?? only defaults if value is null/undefined, preserves 0
teamATimeouts: game.team_a_timeouts_remaining ?? 7
```

**Files Changed**:
1. `src/hooks/useTracker.ts` (lines 261-262)
   - Changed initialization from database
   - Updated console logging

2. `src/app/stat-tracker-v3/page.tsx` (lines 876-877)
   - Changed props passed to `TopScoreboardV3`
   - Now correctly preserves 0 values

---

## 📊 **Behavior Comparison**

| Timeout Count | `|| 7` Result | `?? 7` Result |
|---------------|--------------|--------------|
| `undefined`   | `7` ✅       | `7` ✅       |
| `null`        | `7` ✅       | `7` ✅       |
| `0`           | `7` ❌ **BUG** | `0` ✅ **FIXED** |
| `1`           | `1` ✅       | `1` ✅       |
| `7`           | `7` ✅       | `7` ✅       |

---

## 🧪 **Testing Checklist**

- [x] Timeouts decrement correctly when used
- [x] When count reaches 0, UI shows 0 dots (not 7)
- [x] Error handling correctly blocks timeout requests at 0
- [x] Timeout count persists correctly on page refresh
- [x] Database value of 0 is preserved in UI

---

## 📝 **Related Issues**

**Similar Pattern Checked**:
- Team fouls use `|| 0` (correct, since fouls can't be undefined)
- No other timeout-related code uses `||` operator

---

## ✅ **Verification**

**Before Fix**:
```
Database: team_a_timeouts_remaining = 0
UI Display: 7 filled dots ❌
Error Handling: "No timeouts remaining" ✅
```

**After Fix**:
```
Database: team_a_timeouts_remaining = 0
UI Display: 0 filled dots ✅
Error Handling: "No timeouts remaining" ✅
```

---

**Status**: ✅ **FIXED**

**Date**: 2025-01-XX
**Priority**: Medium (UI inconsistency, functional logic was correct)

