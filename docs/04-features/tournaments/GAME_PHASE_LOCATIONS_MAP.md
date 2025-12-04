# Game Phase Display Locations Map

**Date:** December 4, 2024  
**Purpose:** Visual map of all locations where game phases should be displayed

---

## 🗺️ Location Inventory

### **Tier 1: Critical (Must Have Phase Display)**

#### 1. **Game Viewer Page** 🔴 **HIGHEST PRIORITY**
**Route:** `/game-viewer/[gameId]`  
**Component:** `GameHeader.tsx`  
**Current:** ❌ No phase display  
**Priority:** 🔴 **CRITICAL**

**Proposed:**
- **FINALS:** Large gold banner at top, championship font, trophy icon, shimmer effect
- **PLAYOFFS:** Orange banner, medium size
- **REGULAR:** Hidden or minimal

**Impact:** Most visible location - users spend most time here

---

#### 2. **Organizer Schedule Page** 🔴 **HIGH PRIORITY**
**Route:** `/dashboard/tournaments/[id]/schedule`  
**Component:** `GameCard` (inline in schedule page)  
**Current:** ✅ Phase badge exists (small, next to status)  
**Priority:** 🔴 **HIGH**

**Proposed:**
- **FINALS:** Large gold badge at top of card, gold border, trophy icon
- **PLAYOFFS:** Orange badge at top, orange border
- **REGULAR:** Small badge or hidden

**Impact:** Organizers see this when managing games

---

#### 3. **Public Tournament Schedule Tab** 🔴 **HIGH PRIORITY**
**Route:** Tournament public page → Schedule tab  
**Component:** `ScheduleTab.tsx`  
**Current:** ✅ Phase badge exists (small)  
**Priority:** 🔴 **HIGH**

**Proposed:**
- **FINALS:** Prominent gold badge above team names
- **PLAYOFFS:** Orange badge above team names
- **REGULAR:** Minimal or hidden
- Add phase filter: "Show Finals Only"

**Impact:** Public viewers see tournament schedule

---

#### 4. **Tournament Overview - Recent Matchups** 🔴 **HIGH PRIORITY**
**Route:** Tournament public page → Overview tab  
**Component:** `TeamMatchupCard.tsx`  
**Current:** ❌ No phase display  
**Priority:** 🔴 **HIGH**

**Proposed:**
- **FINALS:** Gold banner at top of card, gold border, large "FINALS" text
- **PLAYOFFS:** Orange banner, orange border
- **REGULAR:** No banner

**Impact:** First thing users see on tournament page

---

### **Tier 2: Important (Should Have Phase Display)**

#### 5. **OrganizerGameScheduler** 🟠 **MEDIUM PRIORITY**
**Route:** Organizer dashboard → Games section  
**Component:** `OrganizerGameScheduler.tsx`  
**Current:** ✅ Phase badge exists (small, next to tournament name)  
**Priority:** 🟠 **MEDIUM**

**Proposed:**
- **FINALS:** Larger gold badge, more prominent
- **PLAYOFFS:** Orange badge
- **REGULAR:** Minimal

**Impact:** Organizers see all games across tournaments

---

#### 6. **Tournament Right Rail - Upcoming Games** 🟠 **MEDIUM PRIORITY**
**Route:** Tournament public page → Right sidebar  
**Component:** `TournamentRightRail.tsx`  
**Current:** ❌ No phase display  
**Priority:** 🟠 **MEDIUM**

**Proposed:**
- **FINALS:** Gold badge with trophy icon
- **PLAYOFFS:** Orange badge
- **REGULAR:** No badge

**Impact:** Sidebar visibility for upcoming games

---

#### 7. **Live Games Tab** 🟠 **MEDIUM PRIORITY**
**Route:** Tournament public page → Live Games tab  
**Component:** `LiveGamesTab.tsx`  
**Current:** ❌ No phase display  
**Priority:** 🟠 **MEDIUM**

**Proposed:**
- **FINALS:** Gold badge above "LIVE" badge
- **PLAYOFFS:** Orange badge
- **REGULAR:** No badge

**Impact:** Users viewing live games

---

#### 8. **Landing Page - Live Tournament Section** 🟠 **MEDIUM PRIORITY**
**Route:** `/` (homepage)  
**Component:** `LiveTournamentSection.tsx`  
**Current:** ❌ No phase display  
**Priority:** 🟠 **MEDIUM**

**Proposed:**
- **FINALS:** Gold badge on live game cards
- **PLAYOFFS:** Orange badge
- **REGULAR:** No badge

**Impact:** First impression for visitors

---

### **Tier 3: Nice to Have (Optional Phase Display)**

#### 9. **Player Dashboard - Game History** 🟡 **LOW PRIORITY**
**Route:** `/dashboard/player`  
**Component:** `GameStatsTable.tsx`  
**Current:** ❌ No phase display  
**Priority:** 🟡 **LOW**

**Proposed:**
- Add phase column or badge
- **FINALS:** Gold badge
- **PLAYOFFS:** Orange badge
- **REGULAR:** No badge

**Impact:** Players viewing their game history

---

#### 10. **Player Tournaments Page** 🟡 **LOW PRIORITY**
**Route:** `/dashboard/player/tournaments`  
**Component:** Game cards in tournament list  
**Current:** ❌ No phase display  
**Priority:** 🟡 **LOW**

**Proposed:**
- Phase badges on game cards
- **FINALS:** Gold badge
- **PLAYOFFS:** Orange badge

**Impact:** Players viewing their tournaments

---

## 📊 Priority Matrix

| Location | Current State | Priority | Impact | Effort |
|----------|---------------|----------|--------|--------|
| **Game Viewer Header** | ❌ Missing | 🔴 Critical | ⭐⭐⭐⭐⭐ | Medium |
| **TeamMatchupCard** | ❌ Missing | 🔴 Critical | ⭐⭐⭐⭐⭐ | Low |
| **Schedule Page GameCard** | ✅ Small badge | 🔴 High | ⭐⭐⭐⭐ | Low |
| **Public ScheduleTab** | ✅ Small badge | 🔴 High | ⭐⭐⭐⭐ | Low |
| **OrganizerGameScheduler** | ✅ Small badge | 🟠 Medium | ⭐⭐⭐ | Low |
| **Tournament Right Rail** | ❌ Missing | 🟠 Medium | ⭐⭐⭐ | Low |
| **Live Games Sections** | ❌ Missing | 🟠 Medium | ⭐⭐ | Low |
| **Player Dashboard** | ❌ Missing | 🟡 Low | ⭐⭐ | Medium |

---

## 🎨 Visual Treatment Summary

### FINALS (Championship Treatment)
- **Font:** Extra bold, large size (text-2xl to text-4xl)
- **Colors:** Gold/amber gradient
- **Effects:** Shimmer animation, gold glow, pulse (if live)
- **Icon:** Large trophy icon
- **Position:** Prominent (banner at top or large badge)

### PLAYOFFS (High Stakes Treatment)
- **Font:** Bold, medium size (text-lg to text-xl)
- **Colors:** Orange/red gradient
- **Effects:** Subtle shadow
- **Icon:** Medium trophy icon
- **Position:** Medium badge

### REGULAR (Default Treatment)
- **Font:** Medium weight, small size (text-xs to text-sm)
- **Colors:** Gray/neutral
- **Effects:** None
- **Icon:** None or small
- **Position:** Small badge or hidden

---

## 🚀 Implementation Order

### Phase 1: Critical (Week 1)
1. Game Viewer Header - Phase banner
2. TeamMatchupCard - Phase banner
3. Schedule Page GameCard - Enhance existing badge

### Phase 2: High Priority (Week 1-2)
4. Public ScheduleTab - Enhance existing badge
5. Add phase filters and sorting

### Phase 3: Medium Priority (Week 2)
6. OrganizerGameScheduler - Enhance existing badge
7. Tournament Right Rail - Add phase badges
8. Live Games Sections - Add phase badges

### Phase 4: Nice to Have (Week 3+)
9. Player Dashboard - Add phase column
10. Other locations - As needed

---

*Map created: December 4, 2024*

