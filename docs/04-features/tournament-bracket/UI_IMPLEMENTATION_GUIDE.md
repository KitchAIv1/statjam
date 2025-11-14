# Bracket UI Implementation Guide

**Visual Design Reference** - How bracket components will look and behave

---

## 🎨 Visual Hierarchy

### Layout Flow (Desktop)
```
┌─────────────────────────────────────────────────────────────────────┐
│                    BRACKET HEADER                                    │
│  [Tournament Type Badge]  [Round Selector]  [View Options]          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Round of 16  │  │ Quarterfinal │  │  Semifinal   │  │    Final    │
│              │  │              │  │              │  │             │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
│ │ Match 1  │─┼──┼▶│ Match 1  │─┼──┼▶│ Match 1  │─┼──┼▶│  Final   │ │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
│              │  │              │  │              │  │             │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │             │
│ │ Match 2  │─┼──┼▶│ Match 2  │─┼──┼▶│ Match 2  │─┼──┼─┘           │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │             │
│              │  │              │  │              │  │             │
│ ┌──────────┐ │  │              │  │              │  │             │
│ │ Match 3  │─┼──┼─┐            │  │              │  │             │
│ └──────────┘ │  │ │            │  │              │  │             │
│              │  │ │            │  │              │  │             │
│ ┌──────────┐ │  │ │            │  │              │  │             │
│ │ Match 4  │─┼──┼─┘            │  │              │  │             │
│ └──────────┘ │  │              │  │              │  │             │
│              │  │              │  │              │  │             │
│ ┌──────────┐ │  │              │  │              │  │             │
│ │ Match 5  │─┼──┼─┐            │  │              │  │             │
│ └──────────┘ │  │ │            │  │              │  │             │
│              │  │ │            │  │              │  │             │
│ ┌──────────┐ │  │ │            │  │              │  │             │
│ │ Match 6  │─┼──┼─┘            │  │              │  │             │
│ └──────────┘ │  │              │  │              │  │             │
│              │  │              │  │              │  │             │
│ ┌──────────┐ │  │              │  │              │  │             │
│ │ Match 7  │─┼──┼─┐            │  │              │  │             │
│ └──────────┘ │  │ │            │  │              │  │             │
│              │  │ │            │  │              │  │             │
│ ┌──────────┐ │  │ │            │  │              │  │             │
│ │ Match 8  │─┼──┼─┘            │  │              │  │             │
│ └──────────┘ │  │              │  │              │  │             │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🎯 Match Card Design

### Desktop Match Card
```
┌─────────────────────────────────────────────┐
│  ┌────┐                                     │
│  │Logo│  Team A Name              Score: 85 │
│  └────┘                                     │
│  ─────────────────────────────────────────  │
│  ┌────┐                                     │
│  │Logo│  Team B Name              Score: 72 │
│  └────┘                    [LIVE] [View]    │
└─────────────────────────────────────────────┘
```

**Styling**:
- Background: `bg-white/5` (glass effect)
- Border: `border-white/10`
- Hover: `hover:border-[#FF3B30]/50 hover:bg-white/10`
- Padding: `p-4` (desktop), `p-3` (mobile)
- Border radius: `rounded-xl`

### Mobile Match Card (Compact)
```
┌──────────────────────┐
│ Team A       85      │
│ ──────────────────── │
│ Team B       72 [▶]  │
└──────────────────────┘
```

**Styling**:
- Height: `h-20` (fixed)
- Padding: `p-3`
- Font size: `text-sm` (team names), `text-base` (scores)

---

## 🎨 Component States

### Match States

#### Scheduled (Not Started)
```
┌─────────────────────────────┐
│  [Logo] Team A              │
│  ─────────────────────────  │
│  [Logo] Team B              │
│              [Scheduled]     │
└─────────────────────────────┘
```
- Border: `border-white/10`
- Background: `bg-white/5`
- Badge: `bg-white/10 text-white/60`

#### Live (In Progress)
```
┌─────────────────────────────┐
│  [Logo] Team A      Score: 45│
│  ─────────────────────────  │
│  [Logo] Team B      Score: 38│
│              [🔴 LIVE] [View]│
└─────────────────────────────┘
```
- Border: `border-[#FF3B30]/50`
- Background: `bg-[#FF3B30]/10`
- Badge: `bg-[#FF3B30] text-white` (pulsing animation)

#### Completed (Winner Highlighted)
```
┌─────────────────────────────┐
│  [Logo] Team A      Score: 85│ ← Winner (highlighted)
│  ─────────────────────────  │
│  [Logo] Team B      Score: 72│
│              [Final] [View]   │
└─────────────────────────────┘
```
- Winner border: `border-[#FF3B30]/30`
- Winner background: `bg-[#FF3B30]/10`
- Loser: Normal styling

---

## 🔗 Connector Lines

### Visual Design
```
Match 1 ──────┐
              ├───▶ Next Match
Match 2 ──────┘
```

**Styling**:
- Color: `rgba(255, 255, 255, 0.2)` (subtle)
- Width: `2px` (desktop), `1px` (mobile)
- Animation: Fade in when winner determined
- Path: SVG `<path>` element

### Winner Path Highlighting
```
Match 1 ──────┐
   [Winner]   │ ← Highlighted path
              ├───▶ Next Match
Match 2 ──────┘
```
- Color: `rgba(255, 59, 48, 0.4)` (red glow)
- Width: `3px`
- Animation: Smooth transition when winner determined

---

## 📱 Responsive Breakpoints

### Desktop (>1024px)
- **Layout**: Horizontal flow (4 columns for 4 rounds)
- **Match width**: `280px` (fixed)
- **Round spacing**: `48px` (horizontal gap)
- **Connectors**: Horizontal SVG lines

### Tablet (768px - 1024px)
- **Layout**: Horizontal with horizontal scroll
- **Match width**: `240px` (condensed)
- **Round spacing**: `32px`
- **Connectors**: Simplified horizontal lines

### Mobile (<768px)
- **Layout**: Vertical stack
- **Match width**: `100%` (full width)
- **Round spacing**: `24px` (vertical gap)
- **Connectors**: Vertical SVG lines
- **Minimap**: Floating button for navigation

---

## 🎯 Interaction Patterns

### Hover States
```typescript
// Match card hover
hover:border-[#FF3B30]/50 
hover:bg-white/10
hover:shadow-lg
transition-all duration-200
```

### Click Actions
```typescript
// Click match card
onClick={() => {
  if (game.status === 'completed' || game.status === 'in_progress') {
    window.open(`/game-viewer/${game.id}`, '_blank');
  }
}}
```

### Loading States
```typescript
// Skeleton loader
<div className="animate-pulse">
  <div className="h-20 bg-white/5 rounded-xl" />
</div>
```

### Empty States
```typescript
// No bracket data
<Card className="text-center p-8">
  <p className="text-white/60">Bracket will appear when games are scheduled</p>
</Card>
```

---

## 🎨 Color Usage

### Status Colors
- **Live**: `#FF3B30` (red) - Primary brand color
- **Completed**: `rgba(255, 255, 255, 0.2)` (subtle white)
- **Scheduled**: `rgba(255, 255, 255, 0.1)` (very subtle)
- **Winner**: `rgba(255, 59, 48, 0.2)` (red glow)

### Background Layers
- **Bracket container**: `bg-black` (base)
- **Round container**: `bg-transparent` (no background)
- **Match card**: `bg-white/5` (glass effect)
- **Match hover**: `bg-white/10` (brighter)

### Border Colors
- **Default**: `rgba(255, 255, 255, 0.1)`
- **Hover**: `rgba(255, 59, 48, 0.5)` (red)
- **Active**: `rgba(255, 59, 48, 0.3)` (red, subtle)
- **Winner**: `rgba(255, 59, 48, 0.3)` (red glow)

---

## 📐 Spacing System

### Match Spacing
- **Between matches**: `12px` (mobile), `16px` (desktop)
- **Match padding**: `12px` (mobile), `16px` (desktop)
- **Match height**: `auto` (desktop), `80px` (mobile fixed)

### Round Spacing
- **Between rounds**: `24px` (mobile), `48px` (desktop)
- **Round label margin**: `0 0 16px 0`
- **Round container padding**: `0` (no padding)

### Container Spacing
- **Bracket container**: `p-4` (mobile), `p-6` (desktop)
- **Outer spacing**: `space-y-4` (mobile), `space-y-6` (desktop)

---

## 🎯 Typography

### Round Labels
```css
font-size: 10px (mobile) / 12px (desktop)
font-weight: 600
text-transform: uppercase
letter-spacing: 0.05em
color: rgba(255, 255, 255, 0.4)
```

### Team Names
```css
font-size: 12px (mobile) / 14px (desktop)
font-weight: 600
color: white
line-height: 1.4
```

### Scores
```css
font-size: 14px (mobile) / 16px (desktop)
font-weight: 700
font-family: ui-monospace (tabular numbers)
color: white
```

### Status Badges
```css
font-size: 10px (mobile) / 11px (desktop)
font-weight: 600
text-transform: uppercase
letter-spacing: 0.05em
```

---

## 🎨 Animation Patterns

### Match Card Hover
```css
transition-all duration-200 ease-in-out
transform: translateY(-2px) (on hover)
box-shadow: 0 10px 30px rgba(255, 59, 48, 0.1) (on hover)
```

### Winner Highlight
```css
animation: winnerGlow 0.5s ease-in-out
@keyframes winnerGlow {
  0% { border-color: rgba(255, 255, 255, 0.1); }
  50% { border-color: rgba(255, 59, 48, 0.5); }
  100% { border-color: rgba(255, 59, 48, 0.3); }
}
```

### Connector Line Draw
```css
animation: drawLine 0.5s ease-in-out
stroke-dasharray: 1000
stroke-dashoffset: 1000 (start)
stroke-dashoffset: 0 (end)
```

### Live Badge Pulse
```css
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 📱 Mobile-Specific Features

### Minimap Navigation
```
┌─────────────────────┐
│  [Bracket View]     │
│                     │
│  ┌───────────────┐  │
│  │ Minimap       │  │ ← Floating button
│  │ [Show Map]    │  │
│  └───────────────┘  │
└─────────────────────┘
```

**Behavior**:
- Floating button in bottom-right corner
- Shows condensed bracket overview
- Click to jump to specific round
- Auto-hides when scrolling

### Swipe Navigation
- Swipe left/right to navigate rounds
- Smooth scroll snapping
- Visual indicators for current round

---

## 🎯 Accessibility

### Keyboard Navigation
- Tab through matches
- Enter/Space to view game
- Arrow keys to navigate rounds

### Screen Reader Support
```html
<article role="region" aria-label="Tournament Bracket">
  <h2>Round of 16</h2>
  <div role="list">
    <div role="listitem" aria-label="Match 1: Team A vs Team B">
      <!-- Match content -->
    </div>
  </div>
</article>
```

### Focus States
```css
focus:outline-2 outline-[#FF3B30]
focus:outline-offset-2
```

---

## 🚀 Performance Considerations

### Virtual Scrolling
- For brackets with 100+ matches
- Only render visible matches
- Lazy load match details

### Image Optimization
- Team logos: Lazy loading
- WebP format with fallback
- Avatar fallback for missing logos

### Animation Performance
- Use `transform` and `opacity` only
- Avoid layout-triggering properties
- Use `will-change` sparingly

---

**This guide provides the visual foundation for bracket implementation. All components should follow these patterns for consistency with existing tournament UI.**

