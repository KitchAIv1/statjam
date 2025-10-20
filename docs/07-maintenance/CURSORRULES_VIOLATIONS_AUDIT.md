# 🚨 .cursorrules Violations Audit Report

**Date**: October 20, 2025  
**Total Violations**: 1,957 (1 error, 1,956 warnings)  
**Scope**: Entire `src/` directory

---

## 📊 Executive Summary

### Critical Violations by Category

| Violation Type | Count | Severity | Priority |
|---------------|-------|----------|----------|
| **File > 500 lines** | 6 files | 🔴 CRITICAL | P0 |
| **Function > 40 lines** | 127+ functions | 🔴 CRITICAL | P0 |
| **Complexity > 10** | 45+ functions | 🟡 HIGH | P1 |
| **React Hook Rules** | 1 error | 🔴 CRITICAL | P0 |
| **JSX Depth > 6** | 200+ instances | 🟡 MEDIUM | P2 |
| **Identifier 'data'** | 300+ uses | 🟡 MEDIUM | P2 |
| **Short identifiers (< 2 chars)** | 100+ instances | 🟢 LOW | P3 |
| **'any' types** | 80+ instances | 🟡 MEDIUM | P2 |

---

## 🔴 P0 - CRITICAL VIOLATIONS (.cursorrules HARD BLOCKS)

### 1. Files Exceeding 500 Lines

| File | Lines | Overage | Action Required |
|------|-------|---------|-----------------|
| `src/app/admin/templates/[id]/page.tsx` | 505 | +5 | ⚠️ Split template editor |
| `src/app/dashboard/create-tournament/page.tsx` | 885 | **+385** | 🚨 URGENT: Split into components |
| `src/app/dashboard/stat-admin/page.tsx` | 592 | +92 | ⚠️ Extract game lists |
| `src/app/dashboard/tournaments/[id]/page.tsx` | 615 | +115 | ⚠️ Split tournament details |
| `src/lib/services/templateService.ts` | 526 | +26 | ⚠️ Split service methods |
| `src/lib/services/tournamentService.ts` | 930 | **+430** | 🚨 URGENT: Modularize service |

**Immediate Action**: 
- `create-tournament/page.tsx` (885 lines) - MUST be split into at least 2 components
- `tournamentService.ts` (930 lines) - MUST be split into separate service modules

---

### 2. Functions Exceeding 40 Lines (Top Offenders)

#### Pages (Components)
| File | Function | Lines | Priority |
|------|----------|-------|----------|
| `create-tournament/page.tsx` | `CreateTournamentPageContent` | 877 | 🚨 P0 |
| `create-tournament/page.tsx` | `handleSubmit` | 307 | 🚨 P0 |
| `stat-admin/page.tsx` | `StatAdminDashboard` | 579 | 🚨 P0 |
| `stat-tracker/page.tsx` | `StatTracker` | 1427 | 🚨 P0 |
| `stat-tracker-v3/page.tsx` | `StatTrackerV3Content` | 640 | 🚨 P0 |
| `admin/templates/[id]/page.tsx` | `TemplateEditorPage` | 239 | 🚨 P0 |
| `admin/templates/new/page.tsx` | `NewTemplatePage` | 246 | 🚨 P0 |

#### Services
| File | Function | Lines | Priority |
|------|----------|-------|----------|
| `tournamentService.ts` | `getTeamsByTournament` | 98 | 🚨 P0 |
| `tournamentService.ts` | `getAllPlayers` | 96 | 🚨 P0 |
| `tournamentService.ts` | `validateTournamentData` | 69 | 🚨 P0 |
| `tournamentService.ts` | `getTeamPlayers` | 67 | 🚨 P0 |
| `tournamentService.ts` | `getStatAdmins` | 53 | 🚨 P0 |
| `teamServiceV3.ts` | `getTeamPlayersWithSubstitutions` | 65 | 🚨 P0 |
| `supabase.ts` | `createEnterpriseSupabaseClient` | 79 | 🚨 P0 |

---

### 3. React Hook Rules Error (CRITICAL)

**File**: `src/app/admin/templates/[id]/page.tsx`  
**Line**: 69  
**Error**: React Hook "useEffect" is called conditionally

```typescript
// ❌ WRONG - Hook called after early return
if (!isClient) return null;
useEffect(() => { // This violates hook rules!
```

**Fix Required**: Move all hooks before any conditional returns.

---

## 🟡 P1 - HIGH PRIORITY VIOLATIONS

### 1. Complexity > 10 (Cognitive Complexity)

| File | Function | Complexity | Max |
|------|----------|------------|-----|
| `create-tournament/page.tsx` | `handleSubmit` | 41 | 10 |
| `transformStatsToPlay.ts` | `transformStatsToPlay` | 26 | 10 |
| `stat-admin/page.tsx` | `StatAdminDashboard` | 25 | 10 |
| `profileValidation.ts` | `validatePlayerProfile` | 19 | 10 |
| `tournamentService.ts` | `validateTournamentData` | 32 | 10 |
| `tournamentService.ts` | `updateTournament` | 17 | 10 |
| `tournamentService.ts` | `getTeamPlayers` | 16 | 10 |
| `dashboard/page.tsx` | `OrganizerDashboard` | 14 | 10 |

**Impact**: These functions are difficult to understand, test, and maintain.

---

### 2. Unused Imports/Variables

| File | Unused Items | Impact |
|------|--------------|--------|
| `admin/templates/[id]/page.tsx` | `Settings` | Low |
| `admin/templates/page.tsx` | `Trash2`, `Settings`, `TrendingUp` | Low |
| `create-tournament/page.tsx` | `Users`, `MapPin`, `DollarSign` | Low |
| `stat-admin/page.tsx` | `TeamService`, `Badge`, `Database`, `BarChart3`, `Settings`, `Activity`, `Play` | Medium |

---

## 🟡 P2 - MEDIUM PRIORITY VIOLATIONS

### 1. Restricted Identifier 'data' (300+ instances)

**Why It's Restricted**: The name 'data' is too vague and violates intention-revealing naming.

**Top Offenders**:
- `tournamentService.ts`: 80+ instances
- `templateService.ts`: 50+ instances  
- `create-tournament/page.tsx`: 30+ instances

**Recommended Fix**: Use descriptive names like:
- `data` → `tournamentData`, `teamData`, `playerData`
- `data` → `responseData`, `fetchedData`, `validatedData`

---

### 2. TypeScript 'any' Type (80+ instances)

**Files with Most 'any' Usage**:
| File | Count | Risk Level |
|------|-------|------------|
| `teamServiceV3.ts` | 15+ | High |
| `supabaseService.ts` | 10+ | High |
| `templateService.ts` | 8+ | Medium |

**Fix**: Replace `any` with proper TypeScript interfaces.

---

### 3. JSX Nesting Depth > 6 (200+ instances)

**Most Affected Files**:
- `admin/templates/[id]/page.tsx`: 20+ violations (depth 7-9)
- `admin/templates/new/page.tsx`: 25+ violations (depth 7-11)
- `stat-admin/page.tsx`: 40+ violations (depth 7-11)
- `player/cards/page.tsx`: 15+ violations (depth 7-8)

**Fix**: Extract nested JSX into separate components.

---

## 🟢 P3 - LOW PRIORITY VIOLATIONS

### 1. Short Identifier Names (< 2 characters)

Common patterns:
- `t` (tournament/team/template) - 30+ instances
- `p` (player) - 20+ instances
- `g` (game) - 10+ instances
- `s` (stat) - 10+ instances
- `w`, `h` (width/height) - 5+ instances

**Fix**: Use descriptive names (e.g., `t` → `tournament`, `p` → `player`)

---

### 2. Image Optimization Warnings

**Files Using `<img>` Instead of `next/image`**:
- `admin/templates/[id]/page.tsx` (2 instances)
- `admin/templates/new/page.tsx` (1 instance)
- `player/cards/page.tsx` (1 instance)

**Impact**: Slower LCP, higher bandwidth usage.

---

## 📋 Refactoring Priority List

### URGENT (Within 1 Week)

1. **Fix React Hook Rules Error**
   - File: `admin/templates/[id]/page.tsx` line 69
   - Severity: CRITICAL - Can cause runtime errors

2. **Split `create-tournament/page.tsx` (885 lines)**
   - Extract form sections into components
   - Move validation logic to hooks
   - Target: 5-6 components under 200 lines each

3. **Split `tournamentService.ts` (930 lines)**
   - Create `TournamentCRUDService.ts` (create, read, update, delete)
   - Create `TournamentTeamService.ts` (team management)
   - Create `TournamentPlayerService.ts` (player management)
   - Create `TournamentAdminService.ts` (stat admin management)

4. **Refactor `stat-tracker/page.tsx` (1427 lines)**
   - Extract modal components (already in progress)
   - Split into mobile/desktop layouts like v3
   - Extract stat recording logic to hooks

---

### HIGH PRIORITY (Within 2 Weeks)

5. **Reduce Function Complexity**
   - `handleSubmit` in `create-tournament` (complexity 41)
   - `validateTournamentData` (complexity 32)
   - `transformStatsToPlay` (complexity 26)

6. **Replace 'data' Identifier** (300+ instances)
   - Use find-replace with context-aware naming
   - Focus on services first (tournamentService, templateService)

7. **Extract Nested JSX**
   - `admin/templates/*` pages
   - `stat-admin/page.tsx`
   - `player/cards/page.tsx`

---

### MEDIUM PRIORITY (Within 1 Month)

8. **Replace 'any' Types**
   - Create proper interfaces for teamServiceV3
   - Define types for supabaseService
   - Add types to templateService

9. **Fix Short Identifiers**
   - Replace single-letter variables in map/filter callbacks
   - Use descriptive names in services

10. **Image Optimization**
    - Replace `<img>` with `next/image`
    - Configure image domains in next.config

---

## 🎯 Success Metrics

**Target State (Within 3 Months)**:
- ✅ 0 files over 500 lines
- ✅ 0 functions over 40 lines (or < 10 total)
- ✅ 0 complexity > 10 violations
- ✅ 0 React Hook errors
- ✅ < 50 JSX depth violations (down from 200+)
- ✅ 0 'data' identifier uses (replaced with descriptive names)
- ✅ < 10 'any' types (down from 80+)

---

## 🚀 Implementation Strategy

### Phase 1: Critical Fixes (Week 1)
- Fix React Hook error
- Split create-tournament page
- Split tournamentService

### Phase 2: Function Refactoring (Weeks 2-3)
- Extract large functions to smaller ones
- Reduce complexity in top offenders
- Create custom hooks for business logic

### Phase 3: Code Quality (Weeks 4-6)
- Replace 'data' identifier
- Add proper TypeScript types
- Extract nested JSX

### Phase 4: Polish (Weeks 7-12)
- Fix short identifiers
- Optimize images
- Final cleanup

---

## 📌 Notes

1. **Substitution Modal Work**: Currently in progress on `refactor/auth-page-v2-decomposition` branch. Put on hold pending this audit.

2. **Auth Refactoring Success**: AuthPageV2 was successfully refactored from 997 lines to 81 lines (92% reduction). This serves as a model for other large components.

3. **Legacy Code**: Many violations exist in older code (stat-tracker, create-tournament). These predate the .cursorrules implementation.

4. **New Code Quality**: Recent code (AuthV2 refactor, Tier 2 features) shows good compliance with modularity rules.

---

## ✅ Recommended Next Steps

1. **Immediate**: Fix React Hook error in templates page
2. **This Week**: Create refactoring plan for create-tournament page
3. **This Week**: Design service splitting strategy for tournamentService
4. **Next Week**: Begin Phase 1 implementation
5. **Ongoing**: Enforce .cursorrules for all new code (already active)

---

**Report Generated**: ESLint scan of entire `src/` directory  
**Command**: `npx eslint src --ext .ts,.tsx`  
**Configuration**: `.cursorrules` + `eslint.config.mjs`

