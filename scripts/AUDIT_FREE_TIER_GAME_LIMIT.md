# Free Tier Game Limit Change Analysis
## Changing from 6 to 10 games for Coach Profiles

**Date**: January 2025  
**Change**: FREE_COACH_LIMITS.games: 6 → 10

---

## 📋 Complexity Analysis

### **Complexity Level: LOW** ⭐

This is a **simple configuration change** with minimal risk. The limit is:
1. Defined in a single source of truth (`pricing.ts`)
2. Used dynamically throughout the codebase
3. Not hardcoded in business logic

---

## 🔍 Code Audit Results

### **Primary Configuration** ✅

**File**: `src/config/pricing.ts`

**Location**: Line 54
```typescript
const FREE_COACH_LIMITS: TierLimits = {
  seasons: 1,
  teams: 1,
  games: 6,  // ← CHANGE THIS TO 10
  // ... other limits
};
```

**Location**: Line 180 (feature description)
```typescript
features: [
  '1 team',
  'Up to 6 tracked games',  // ← CHANGE THIS TO 10
  'Manual tracking',
  // ...
],
```

**Status**: ✅ **SAFE** - Single source of truth

---

### **Business Logic** ✅

**File**: `src/lib/services/subscriptionService.ts`

**Function**: `checkCoachGameLimit()`
- Uses `limits.games` dynamically from `getUserLimits()`
- No hardcoded "6" value
- Compares `currentCount < maxAllowed`
- ✅ **SAFE** - Uses dynamic limit value

**Function**: `getCoachGameCount()`
- Counts actual games from database
- No limit check (just counting)
- ✅ **SAFE** - No hardcoded limit

---

### **Component Logic** ✅

**File**: `src/components/coach/CoachQuickTrackSection.tsx`

**Location**: Line 48
```typescript
const gameLimit = limits.games === 'unlimited' ? Infinity : limits.games;
```
- Uses `limits.games` dynamically from hook
- ✅ **SAFE** - No hardcoded value

**Location**: Line 65
```typescript
if (subscriptionTier === 'free' && freshCount >= gameLimit) {
```
- Uses `gameLimit` variable (dynamic)
- ✅ **SAFE** - Compares against dynamic limit

---

**File**: `src/components/coach/CoachTeamCard.tsx`

**Location**: Line 286
```typescript
const gameLimit = limits.games === 'unlimited' ? Infinity : limits.games;
```
- Uses `limits.games` dynamically
- ✅ **SAFE** - No hardcoded value

**Location**: Line 290
```typescript
if (subscriptionTier === 'free' && freshCount >= gameLimit) {
```
- Uses `gameLimit` variable (dynamic)
- ✅ **SAFE** - Compares against dynamic limit

---

**File**: `src/components/coach/CoachQuickTrackModal.tsx`

**Location**: Line 143
```typescript
const usageCheck = await SubscriptionService.checkCoachGameLimit(userId);
```
- Calls service function (uses dynamic limit)
- ✅ **SAFE** - No hardcoded value

---

### **Documentation & Help Content** ⚠️

**File**: `src/config/onboarding/coachOnboarding.ts`

**Location**: Line 24
```typescript
description: "Click 'Start New Game' for manual tracking. Free: 6 games max. Premium: unlimited + video tracking.",
```
- ⚠️ **NEEDS UPDATE** - Hardcoded "6 games max"

**Location**: Line 46
```typescript
answer: "Free accounts get 1 team with up to 6 manually tracked games. Perfect for getting started with basic stat tracking and analytics."
```
- ⚠️ **NEEDS UPDATE** - Hardcoded "up to 6"

**Location**: Line 58
```typescript
answer: "No. Video tracking is exclusive to premium subscribers. Free accounts can manually track up to 6 games with 1 team."
```
- ⚠️ **NEEDS UPDATE** - Hardcoded "up to 6 games"

**Status**: ⚠️ **LOW RISK** - User-facing text only, doesn't affect logic

---

### **Documentation Files** ⚠️

**File**: `docs/06-monetization/SUBSCRIPTION_GATEKEEPING_AUDIT.md`

**Location**: Line 71
```markdown
**Free Tier:** 6 games max (own tracked games)
```
- ⚠️ **NEEDS UPDATE** - Documentation only

**Status**: ⚠️ **NO RISK** - Documentation only, doesn't affect functionality

---

## ✅ Safety Assessment

### **Critical Code** ✅ SAFE

All business logic uses the limit dynamically:
- `subscriptionService.ts` - Uses `limits.games` from config
- `CoachQuickTrackSection.tsx` - Uses `limits.games` from hook
- `CoachTeamCard.tsx` - Uses `limits.games` from hook
- `CoachQuickTrackModal.tsx` - Uses service function (dynamic)

**Risk**: ✅ **ZERO** - No hardcoded values in business logic

---

### **User-Facing Content** ⚠️ NEEDS UPDATE

Text that mentions "6 games":
- Onboarding help text (3 places)
- Pricing features list (1 place)
- Documentation (1 place)

**Risk**: ⚠️ **LOW** - User experience only, doesn't break functionality
**Impact**: Users will see outdated limit in help text until updated

---

## 🔧 Required Changes

### **1. Configuration Change** ✅ REQUIRED

**File**: `src/config/pricing.ts`

**Change 1**: Line 54
```typescript
// BEFORE
games: 6,

// AFTER
games: 10,
```

**Change 2**: Line 180
```typescript
// BEFORE
'Up to 6 tracked games',

// AFTER
'Up to 10 tracked games',
```

---

### **2. Help Content Updates** ⚠️ RECOMMENDED

**File**: `src/config/onboarding/coachOnboarding.ts`

**Change 1**: Line 24
```typescript
// BEFORE
description: "Click 'Start New Game' for manual tracking. Free: 6 games max. Premium: unlimited + video tracking.",

// AFTER
description: "Click 'Start New Game' for manual tracking. Free: 10 games max. Premium: unlimited + video tracking.",
```

**Change 2**: Line 46
```typescript
// BEFORE
answer: "Free accounts get 1 team with up to 6 manually tracked games. Perfect for getting started with basic stat tracking and analytics."

// AFTER
answer: "Free accounts get 1 team with up to 10 manually tracked games. Perfect for getting started with basic stat tracking and analytics."
```

**Change 3**: Line 58
```typescript
// BEFORE
answer: "No. Video tracking is exclusive to premium subscribers. Free accounts can manually track up to 6 games with 1 team."

// AFTER
answer: "No. Video tracking is exclusive to premium subscribers. Free accounts can manually track up to 10 games with 1 team."
```

---

### **3. Documentation Update** ⚠️ OPTIONAL

**File**: `docs/06-monetization/SUBSCRIPTION_GATEKEEPING_AUDIT.md`

**Change**: Line 71
```markdown
# BEFORE
**Free Tier:** 6 games max (own tracked games)

# AFTER
**Free Tier:** 10 games max (own tracked games)
```

---

## 🎯 Testing Checklist

### **Functional Testing** ✅

- [ ] Free tier coach can create 10 games (currently limited at 6)
- [ ] Free tier coach cannot create 11th game (should show upgrade modal)
- [ ] Upgrade modal shows correct limit (10 games)
- [ ] Pro tier coach still has unlimited games
- [ ] Existing free tier coaches with 6-9 games can continue working
- [ ] Game count displays correctly in UI

### **User Experience** ⚠️

- [ ] Help text updated (if changed)
- [ ] Pricing page shows "Up to 10 tracked games"
- [ ] Onboarding flow mentions correct limit (if updated)

---

## 📊 Risk Summary

| Category | Risk Level | Impact | Notes |
|----------|------------|--------|-------|
| **Business Logic** | ✅ **ZERO** | None | All code uses dynamic limit |
| **Configuration** | ✅ **LOW** | None | Single source of truth |
| **User Content** | ⚠️ **LOW** | Minor | Outdated text until updated |
| **Documentation** | ✅ **NONE** | None | Docs only, doesn't affect code |

---

## 🚀 Implementation Plan

### **Phase 1: Critical Changes** (Required)

1. **Update `src/config/pricing.ts`**
   - Change `FREE_COACH_LIMITS.games: 6 → 10`
   - Change feature text: "Up to 6 tracked games" → "Up to 10 tracked games"

### **Phase 2: Content Updates** (Recommended)

2. **Update `src/config/onboarding/coachOnboarding.ts`**
   - Update 3 help text strings mentioning "6 games"

### **Phase 3: Documentation** (Optional)

3. **Update `docs/06-monetization/SUBSCRIPTION_GATEKEEPING_AUDIT.md`**
   - Update documentation to reflect new limit

---

## ✅ Conclusion

**Overall Risk**: ✅ **LOW**

This is a **safe configuration change** with minimal risk:
- ✅ All business logic uses dynamic limits (no hardcoded values)
- ✅ Single source of truth in `pricing.ts`
- ⚠️ User-facing text needs updates (doesn't affect functionality)
- ✅ No database changes required
- ✅ No API changes required

**Recommendation**: ✅ **SAFE TO PROCEED**

The change can be made confidently. The only consideration is updating user-facing text to maintain consistency.

---

**Last Updated**: January 2025

