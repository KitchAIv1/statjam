# Canvas Overlay UI Audit - React vs Canvas Comparison

## Source of Truth: React EnhancedScoreOverlay Component

This document compares the React overlay (source of truth) with the Canvas implementation to identify all visual discrepancies.

---

## 1. Overall Layout & Structure

### React (Source of Truth)
- **Container**: `max-w-7xl mx-auto` (centered, max 1280px)
- **Layout**: Flexbox with `justify-between` (space between teams)
- **Responsive**: Uses CSS variables with `clamp()` for all sizes
- **Background**: `bg-gradient-to-b from-black/95 via-black/90 to-transparent backdrop-blur-md`
- **Height**: Dynamic based on content + 32px fade (`h-8`)

### Canvas (Current)
- **Container**: Full width (1920px), no max-width constraint
- **Layout**: Fixed pixel positioning
- **Responsive**: Fixed sizes (not responsive)
- **Background**: Gradient matches but NO backdrop-blur effect
- **Height**: Fixed 160px

**Issues:**
- ❌ No max-width constraint (should be 1280px centered)
- ❌ No backdrop-blur effect
- ❌ Fixed positioning instead of flexbox spacing
- ❌ Not responsive

---

## 2. Tournament Header

### React (Source of Truth)
- **Height**: ~40px (py-2 = 8px top/bottom)
- **Background**: `bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm`
- **Container**: `max-w-7xl mx-auto px-6 py-2`
- **Layout**: `flex items-center justify-center gap-2`
- **Logo**: `w-6 h-6` (24px)
- **Tournament Name**: `text-xs text-gray-300 font-medium` (12px, #D1D5DB)
- **Venue**: `text-xs text-gray-400` (12px, #9CA3AF)

### Canvas (Current)
- **Height**: 40px ✓
- **Background**: Gradient matches ✓
- **Container**: Full width, centered text
- **Layout**: Centered but no gap between elements
- **Logo**: Not implemented ❌
- **Tournament Name**: 12px Arial, #D1D5DB ✓
- **Venue**: 12px Arial, #9CA3AF ✓

**Issues:**
- ❌ Tournament logo not drawn
- ❌ No gap between logo/name/venue
- ❌ No max-width constraint

---

## 3. Team Section Layout

### React (Source of Truth)
- **Layout**: `flex items-center` with `gap: var(--gap, 2rem)` (16-24px)
- **Order (Away)**: Logo → Badge → Score
- **Order (Home)**: Score → Badge → Logo
- **Flex**: `flex-1` (takes available space)
- **Justify**: Away = left, Home = `justify-end` (right)

### Canvas (Current)
- **Layout**: Fixed positioning (x=50 for away, x=width-450 for home)
- **Order**: Matches React ✓
- **Gap**: Fixed ~10px between elements (not responsive)
- **Positioning**: Absolute coordinates, not flex-based

**Issues:**
- ❌ Fixed positioning instead of flexbox
- ❌ Gap not responsive (should be 16-24px)
- ❌ Not centered with max-width constraint

---

## 4. Team Badge

### React (Source of Truth)
- **Background**: `bg-white/10 backdrop-blur-sm` (rgba(255,255,255,0.1) with blur)
- **Border**: `border` with `borderColor: primaryColor + '80'` (50% opacity) or `rgba(255,255,255,0.2)`
- **Border Radius**: `rounded-lg` (8px)
- **Padding**: `var(--padding, 1rem)` = clamp(0.75rem, 2vw, 1.25rem) = 12-20px
- **Width**: Dynamic (content-based, max 200px for team name)
- **Height**: Dynamic (content-based)

### Canvas (Current)
- **Background**: `rgba(255,255,255,0.1)` ✓ (but NO backdrop-blur)
- **Border**: `primaryColor + 0.5` (50% opacity) ✓
- **Border Radius**: 8px ✓
- **Padding**: Fixed 10px (not responsive)
- **Width**: Fixed 200px (not dynamic)
- **Height**: Fixed 50px (not dynamic)

**Issues:**
- ❌ No backdrop-blur effect
- ❌ Fixed dimensions instead of content-based
- ❌ Padding not responsive

---

## 5. Team Badge Header (Away/Home Label)

### React (Source of Truth)
- **Text**: `text-xs text-gray-400 uppercase tracking-widest font-semibold`
  - Size: 12px (0.75rem)
  - Color: #9CA3AF (gray-400)
  - Transform: uppercase
  - Letter spacing: tracking-widest (0.1em)
  - Weight: font-semibold (600)
- **Layout**: `flex items-center gap-2 mb-1`
- **Position**: Above team name

### Canvas (Current)
- **Text**: `12px Arial, sans-serif`
  - Size: 12px ✓
  - Color: #9CA3AF ✓
  - Transform: Uppercase ✓
  - Letter spacing: NOT implemented ❌
  - Weight: NOT bold ❌
- **Layout**: Fixed position
- **Position**: y + 5 (matches) ✓

**Issues:**
- ❌ Missing letter spacing (tracking-widest)
- ❌ Font weight should be semibold (600), not normal

---

## 6. Team Name

### React (Source of Truth)
- **Text**: `font-black text-white truncate max-w-[200px]`
  - Size: `var(--team-name-size)` = clamp(0.75rem, 1.5vw, 0.875rem) = 12-14px
  - Weight: font-black (900)
  - Color: #FFFFFF
  - Truncate: ellipsis if too long
  - Max width: 200px
- **Alignment**: `text-right` for home, left for away

### Canvas (Current)
- **Text**: `bold 20px Arial, sans-serif`
  - Size: 20px ❌ (should be 12-14px)
  - Weight: bold (700) ❌ (should be black/900)
  - Color: #FFFFFF ✓
  - Truncate: NOT implemented ❌
  - Max width: NOT enforced ❌
- **Alignment**: Matches ✓

**Issues:**
- ❌ Font size too large (20px vs 12-14px)
- ❌ Font weight too light (bold vs black)
- ❌ No text truncation
- ❌ No max-width constraint

---

## 7. Score Display

### React (Source of Truth)
- **Text**: `font-black text-white tabular-nums tracking-tight`
  - Size: `var(--score-size)` = clamp(2.5rem, 6vw, 4rem) = 40-64px
  - Weight: font-black (900)
  - Color: #FFFFFF
  - Font: tabular-nums (monospace numbers)
  - Letter spacing: tracking-tight (-0.025em)
- **Animation**: Framer Motion scale [1, 1.05, 1] on score change

### Canvas (Current)
- **Text**: `bold 60px Arial, sans-serif`
  - Size: 60px ✓ (within 40-64px range)
  - Weight: bold (700) ❌ (should be black/900)
  - Color: #FFFFFF ✓
  - Font: Arial (not tabular-nums) ❌
  - Letter spacing: NOT implemented ❌
- **Animation**: NOT implemented ❌

**Issues:**
- ❌ Font weight too light (should be 900)
- ❌ Not using tabular-nums (monospace)
- ❌ Missing letter spacing (tracking-tight)
- ❌ No animation on score change

---

## 8. Team Logo

### React (Source of Truth)
- **Size**: `var(--logo-size)` = clamp(1.5rem, 3vw, 2rem) = 24-32px
- **Shape**: Rounded (`rounded`)
- **Fallback**: Circular with team initial if logo missing
- **Position**: Next to badge (gap spacing)

### Canvas (Current)
- **Size**: Fixed 40px ❌ (should be 24-32px)
- **Shape**: Square (not rounded) ❌
- **Fallback**: NOT implemented ❌
- **Position**: Fixed offset from badge ✓

**Issues:**
- ❌ Logo size too large (40px vs 24-32px)
- ❌ Not rounded
- ❌ No fallback for missing logos

---

## 9. Game Clock

### React (Source of Truth)
- **Background**: `bg-red-600` (#DC2626)
- **Border Radius**: `rounded-lg` (8px)
- **Padding**: `px-6 py-2` (24px horizontal, 8px vertical)
- **Text**: `text-3xl font-black text-white tabular-nums tracking-wider`
  - Size: 30px (1.875rem)
  - Weight: font-black (900)
  - Font: tabular-nums
  - Letter spacing: tracking-wider (0.05em)
- **Shadow**: `shadow-lg`
- **Width**: Dynamic (content-based, min 160px)

### Canvas (Current)
- **Background**: #DC2626 ✓
- **Border Radius**: 8px ✓
- **Padding**: Fixed 160px width, 50px height
- **Text**: `bold 30px Arial, sans-serif`
  - Size: 30px ✓
  - Weight: bold (700) ❌ (should be 900)
  - Font: Arial (not tabular-nums) ❌
  - Letter spacing: NOT implemented ❌
- **Shadow**: NOT implemented ❌
- **Width**: Fixed 160px (not dynamic)

**Issues:**
- ❌ Font weight too light
- ❌ Not using tabular-nums
- ❌ Missing letter spacing
- ❌ No shadow
- ❌ Fixed dimensions instead of dynamic

---

## 10. Quarter Badge

### React (Source of Truth)
- **Background**: `bg-white/10 backdrop-blur-sm` (rgba(255,255,255,0.1) with blur)
- **Border**: `border border-white/30` (rgba(255,255,255,0.3))
- **Border Radius**: `rounded-full` (9999px - pill shape)
- **Padding**: `px-4 py-1` (16px horizontal, 4px vertical)
- **Text**: `text-sm font-bold text-white tracking-wider`
  - Size: 14px (0.875rem)
  - Weight: font-bold (700)
  - Letter spacing: tracking-wider (0.05em)
- **Width**: Dynamic (content-based)

### Canvas (Current)
- **Background**: `rgba(255,255,255,0.1)` ✓ (but NO backdrop-blur)
- **Border**: `rgba(255,255,255,0.3)` ✓
- **Border Radius**: 15px ❌ (should be 9999px for pill)
- **Padding**: Fixed 80px width, 30px height
- **Text**: `bold 14px Arial, sans-serif`
  - Size: 14px ✓
  - Weight: bold (700) ✓
  - Letter spacing: NOT implemented ❌
- **Width**: Fixed 80px (not dynamic)

**Issues:**
- ❌ Border radius not pill-shaped (15px vs 9999px)
- ❌ No backdrop-blur
- ❌ Missing letter spacing
- ❌ Fixed dimensions

---

## 11. Shot Clock

### React (Source of Truth)
- **Background**: `bg-red-500` if ≤5, else `bg-orange-500/80`
- **Border Radius**: `rounded-lg` (8px)
- **Padding**: `px-3 py-1` (12px horizontal, 4px vertical)
- **Text**: `text-lg font-bold text-white tabular-nums`
  - Size: 18px (1.125rem)
  - Weight: font-bold (700)
  - Font: tabular-nums
- **Animation**: Framer Motion scale pulse if ≤5

### Canvas (Current)
- **Background**: Matches logic ✓
- **Border Radius**: 8px ✓
- **Padding**: Fixed 60px width, 30px height
- **Text**: `bold 18px Arial, sans-serif`
  - Size: 18px ✓
  - Weight: bold (700) ✓
  - Font: Arial (not tabular-nums) ❌
- **Animation**: NOT implemented ❌

**Issues:**
- ❌ Not using tabular-nums
- ❌ No animation
- ❌ Fixed dimensions

---

## 12. Foul Count Badge

### React (Source of Truth)
- **Background**: 
  - Bonus (5+): `bg-red-600` (#DC2626)
  - Warning (4): `bg-yellow-500/80` (rgba(234, 179, 8, 0.8))
  - Normal: `bg-white/10` (rgba(255,255,255,0.1))
- **Padding**: `px-2 py-0.5` (8px horizontal, 2px vertical)
- **Border Radius**: `rounded` (4px)
- **Text**: `text-xs font-bold text-white`
  - Size: 12px (0.75rem)
  - Weight: font-bold (700)
- **Bonus Text**: `text-[10px]` (10px) with "BONUS"
- **Animation**: Framer Motion scale pulse if bonus

### Canvas (Current)
- **Background**: Matches logic ✓
- **Padding**: Fixed width based on text + 16px
- **Border Radius**: 4px ✓
- **Text**: `bold 12px Arial, sans-serif`
  - Size: 12px ✓
  - Weight: bold (700) ✓
- **Bonus Text**: Included ✓
- **Animation**: NOT implemented ❌

**Issues:**
- ❌ No animation on bonus
- ❌ Padding calculation may differ

---

## 13. Timeout Dots

### React (Source of Truth)
- **Max**: 7 dots (default)
- **Size**: `w-1.5 h-1.5` (6px)
- **Gap**: `gap-0.5` (2px)
- **Shape**: `rounded-full` (circle)
- **Colors**:
  - Used: `bg-gray-500/60` (rgba(107, 114, 128, 0.6))
  - Remaining: `bg-white/80` (rgba(255, 255, 255, 0.8))
- **Layout**: `flex items-center`

### Canvas (Current)
- **Max**: 5 dots ❌ (should be 7)
- **Size**: 6px ✓
- **Gap**: 4px ❌ (should be 2px)
- **Shape**: Circle ✓
- **Colors**: 
  - Used: `rgba(156, 163, 175, 0.6)` ❌ (should be gray-500, not gray-400)
  - Remaining: `rgba(255, 255, 255, 0.8)` ✓
- **Layout**: Fixed positioning ✓

**Issues:**
- ❌ Wrong number of dots (5 vs 7)
- ❌ Gap too large (4px vs 2px)
- ❌ Wrong gray shade for used dots

---

## 14. Possession Arrow

### React (Source of Truth)
- **Shape**: Triangle using CSS borders
  - `border-l-[6px] border-l-transparent`
  - `border-r-[6px] border-r-transparent`
  - `border-b-[10px]` with team color
- **Color**: Team primary color or `#3b82f6` (blue-500)
- **Size**: 6px wide, 10px tall
- **Animation**: Framer Motion scale/rotate on appear

### Canvas (Current)
- **Shape**: Triangle using path ✓
- **Color**: Fixed `#3B82F6` ❌ (should use team color)
- **Size**: 10px ✓
- **Animation**: NOT implemented ❌

**Issues:**
- ❌ Not using team color
- ❌ No animation

---

## 15. Jump Ball Arrow

### React (Source of Truth)
- **Symbol**: `↻` (rotating arrow)
- **Text**: `text-xs font-bold`
  - Size: 12px
  - Weight: font-bold (700)
- **Color**: Team color or `#fbbf24` (yellow-400)
- **Animation**: Framer Motion fade in

### Canvas (Current)
- **Symbol**: `↻` ✓
- **Text**: `bold 16px Arial, sans-serif`
  - Size: 16px ❌ (should be 12px)
  - Weight: bold (700) ✓
- **Color**: Fixed `#FBBF24` ❌ (should use team color)
- **Animation**: NOT implemented ❌

**Issues:**
- ❌ Font size too large (16px vs 12px)
- ❌ Not using team color
- ❌ No animation

---

## 16. Spacing & Padding

### React (Source of Truth)
- **Main Padding**: `var(--padding)` = clamp(0.75rem, 2vw, 1.25rem) = 12-20px
- **Gap Between Elements**: `var(--gap)` = clamp(1rem, 2vw, 1.5rem) = 16-24px
- **Badge Padding**: Same as main padding
- **Badge Header Gap**: `gap-2` (8px)
- **Badge Stats Gap**: `gap-2` (8px)
- **Badge Stats Margin**: `mt-1.5` (6px)

### Canvas (Current)
- **Main Padding**: Fixed 50px offset ❌
- **Gap Between Elements**: Fixed ~10px ❌
- **Badge Padding**: Fixed 10px ❌
- **Badge Header Gap**: NOT implemented ❌
- **Badge Stats Gap**: Fixed 20px vertical ❌
- **Badge Stats Margin**: NOT implemented ❌

**Issues:**
- ❌ All spacing is fixed, not responsive
- ❌ Gaps don't match React values
- ❌ No margin between badge header and stats

---

## 17. Colors (Exact Hex Values)

### React Tailwind Classes → Hex
- `black/95` = rgba(0, 0, 0, 0.95) ✓
- `black/90` = rgba(0, 0, 0, 0.90) ✓
- `white/10` = rgba(255, 255, 255, 0.1) ✓
- `white/20` = rgba(255, 255, 255, 0.2) ✓
- `white/30` = rgba(255, 255, 255, 0.3) ✓
- `white/80` = rgba(255, 255, 255, 0.8) ✓
- `gray-300` = #D1D5DB ✓
- `gray-400` = #9CA3AF ✓
- `gray-500/60` = rgba(107, 114, 128, 0.6) ❌ (Canvas uses gray-400)
- `red-500` = #EF4444 ✓
- `red-600` = #DC2626 ✓
- `yellow-500/80` = rgba(234, 179, 8, 0.8) ✓
- `orange-500/80` = rgba(249, 115, 22, 0.8) ✓

**Issues:**
- ❌ Used timeout dots use wrong gray shade

---

## 18. Typography

### React Font Weights
- `font-semibold` = 600
- `font-bold` = 700
- `font-black` = 900

### Canvas Font Weights
- `bold` = 700 (used everywhere)
- Missing: 600 (semibold) and 900 (black)

**Issues:**
- ❌ Not using correct font weights
- ❌ Should use 900 for scores and team names
- ❌ Should use 600 for "Away"/"Home" labels

---

## 19. Missing Features

### React Has, Canvas Missing:
1. ❌ Backdrop-blur effects (backdrop-blur-sm, backdrop-blur-md)
2. ❌ Text truncation (ellipsis)
3. ❌ Animations (score change, bonus pulse, possession arrow)
4. ❌ Responsive sizing (clamp())
5. ❌ Max-width constraint (max-w-7xl)
6. ❌ Tournament logo rendering
7. ❌ Team logo fallback (circular with initial)
8. ❌ Tabular-nums font (monospace numbers)
9. ❌ Letter spacing (tracking-tight, tracking-wider, tracking-widest)
10. ❌ Shadow effects (shadow-lg)
11. ❌ Proper pill shape for quarter badge (rounded-full)
12. ❌ Team color usage for possession arrow and jump ball arrow

---

## 20. Summary of Critical Issues

### High Priority (Visual Impact)
1. ❌ Font sizes incorrect (team name, jump ball arrow)
2. ❌ Font weights incorrect (should use 900 for scores/names, 600 for labels)
3. ❌ Missing backdrop-blur effects
4. ❌ Wrong number of timeout dots (5 vs 7)
5. ❌ Wrong gray shade for used timeout dots
6. ❌ Not using team colors for possession/jump ball arrows
7. ❌ Quarter badge not pill-shaped
8. ❌ No max-width constraint (full 1920px vs centered 1280px)

### Medium Priority (Polish)
9. ❌ Missing letter spacing
10. ❌ Not using tabular-nums for numbers
11. ❌ Missing shadows
12. ❌ No animations
13. ❌ Fixed dimensions instead of responsive
14. ❌ Tournament logo not rendered
15. ❌ Team logo fallback not implemented

### Low Priority (Nice to Have)
16. ❌ Text truncation
17. ❌ Spacing not exactly matching

---

## Next Steps

1. Fix all High Priority issues
2. Implement Medium Priority features
3. Add Low Priority polish
4. Re-test visual comparison

