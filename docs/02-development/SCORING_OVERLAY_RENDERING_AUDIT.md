# Scoring Overlay Rendering System — Audit

**Purpose:** Audit for two upcoming changes: (1) team name overflow, (2) overlay position variants.

**Date:** 2025-02-23

---

## Change 1 — Team Name Overflow

### 1.1 Where team names are rendered

| Location | File | Function/Component | Lines |
|----------|------|--------------------|-------|
| **Canvas NBA** | [statjam/src/lib/services/canvas-overlay/nbaDrawing.ts](statjam/src/lib/services/canvas-overlay/nbaDrawing.ts) | `drawTeamInfo` | 227–265 |
| **Canvas Classic** | [statjam/src/lib/services/canvas-overlay/drawing.ts](statjam/src/lib/services/canvas-overlay/drawing.ts) | `drawTeamBadge` | 230–293 |
| **React Enhanced** | [statjam/src/components/live-streaming/ScoreOverlaySections.tsx](statjam/src/components/live-streaming/ScoreOverlaySections.tsx) | `TeamBadge` | 180–184 |
| **React Organizer** | [statjam/src/components/OrganizerLiveStream.tsx](statjam/src/components/OrganizerLiveStream.tsx) | `ScoreOverlay` | 85, 129 |
| **React Box Score** | [statjam/src/components/overlay/BoxScoreOverlayPanel.tsx](statjam/src/components/overlay/BoxScoreOverlayPanel.tsx) | `TeamColumn` | 127–130 |
| **React Enhanced wrapper** | [statjam/src/components/live-streaming/EnhancedScoreOverlay.tsx](statjam/src/components/live-streaming/EnhancedScoreOverlay.tsx) | passes to `TeamSection` | 158, 168 |

Video composition uses **Canvas** overlays (nbaDrawing + drawing), not React DOM. React components are for DOM preview (OrganizerLiveStream, EnhancedScoreOverlay).

---

### 1.2 Current fixed width / container size for team name area

| Renderer | Team name area width | Source |
|----------|----------------------|--------|
| **nbaDrawing.ts** | `teamInfoWidth = 184` (L163) | Fixed constant; passed to `drawTeamInfo(x, y, teamInfoWidth, ...)` |
| **drawing.ts** | Badge width is dynamic: `Math.max(padding + nameWidth + padding, 160)`; `nameWidth` capped at `220` (L221) | `calculateBadgeWidth` L217–224; `drawTeamBadge` L247 |
| **ScoreOverlaySections** | `max-w-[200px]` (L181) | Tailwind CSS |
| **OrganizerLiveStream** | `max-w-[200px]` (L85, L129) | Tailwind CSS |
| **BoxScoreOverlayPanel** | `flex-1 min-w-0` + `truncate` (L127–130) | No explicit max; relies on flex truncation |

---

### 1.3 Text sizing — fixed or dynamic

| Location | Font size | Notes |
|----------|-----------|--------|
| **nbaDrawing.drawTeamInfo** | Fixed `'800 28px Arial, sans-serif'` (L244) | No scaling |
| **drawing.drawTeamBadge** | Fixed `26px` (L240, L246) | `teamNameFontSize = 26` |
| **ScoreOverlaySections.TeamBadge** | Dynamic via `var(--team-name-size, 1.25rem)` (L182) | CSS variable from EnhancedScoreOverlay variant |
| **OrganizerLiveStream** | Fixed `text-xl` (L85, L129) | ~1.25rem |
| **BoxScoreOverlayPanel** | Fixed `text-xs` (L128) | Small font |

---

### 1.4 Coordinates and dimensions (relative layout)

**NBA overlay (nbaDrawing.ts):**

```
Constants:
  MAX_WIDTH = 850
  BAR_HEIGHT = 92
  HEADER_HEIGHT = 37
  clockWidth = 138
  teamSectionWidth = (850 - 138) / 2 = 356
  padding = 10
  logoSize = 83
  scoreWidth = 69
  teamInfoWidth = 184

Layout (Away / Left):
  Logo:  x + padding, logoY  (x = startX = centerX - 425)
  Team info:  x + padding + logoSize + padding  (x + 103)
  Team info box:  width 184, height implied by nameY/foulY
  Score:  x + width - scoreWidth - padding  (right edge of section)

  nameY = y + 38
  foulY = y + 68

Layout (Home / Right):
  Score:  x + padding
  Team info:  logoX - padding - teamInfoWidth  (before logo)
  Logo:  x + width - padding - logoSize

Relative: [Logo 83px] [gap 10] [Name+Fouls 184px] ... [Score 69px] (Away)
          [Score 69px] ... [Name+Fouls 184px] [gap 10] [Logo 83px] (Home)
```

**Classic overlay (drawing.ts):**

```
  logoSize = 52
  logoGap = 16
  badgeWidth = calculateBadgeWidth() → min 160, max ~268 (padding 24 + cap 220 + padding 24)
  scoreOffsetFromCenter = 180
  Away: [Logo 52] [gap 16] [Badge] [Score at center-180]
  Home: [Score at center+180] [Badge] [gap 16] [Logo 52]
```

---

### 1.5 Existing text truncation / font scaling

| Location | Logic | Lines |
|----------|--------|-------|
| **nbaDrawing.drawTeamInfo** | Character-by-character truncation with `...`; `while (nameWidth > maxWidth && displayName.length > 0)` | 248–255 |
| **drawing.drawTeamBadge** | `nameWidth` capped at 220; `displayName` truncated by removing chars until `measuredWidth <= maxNameWidth`, then append `...` | 272–281 |
| **drawing.calculateBadgeWidth** | `Math.min(measureText(teamName).width, 220)` | L221 |
| **React** | CSS `truncate` (text-overflow: ellipsis) on TeamBadge, OrganizerLiveStream | L128, L181, L85, L129 |

**No font scaling** — all Canvas drawing uses fixed font sizes. Only React TeamBadge uses a CSS variable for size.

---

## Change 2 — Overlay Position Variants

### 2.1 Current overlay position

| Variant | Position | Notes |
|---------|----------|-------|
| **NBA** | Top bar | `barY = 20` (L35); header at top, main bar below, info bar below that |
| **Classic** | Top | Tournament header and team sections drawn from top; no explicit “position” prop |
| **Player stats** | Bottom-center | `playerStatsDrawer.ts` L36: "Position: bottom-center with safe margin" |

Overlay position is **not configurable**; score overlay is always at the top. Player stats overlay is always bottom-center.

---

### 2.2 Where overlay position / layout is determined

| Responsibility | File | Function/Method | Lines |
|----------------|--------|------------------|-------|
| **Variant selection** | [statjam/src/lib/services/canvas-overlay/renderer.ts](statjam/src/lib/services/canvas-overlay/renderer.ts) | `render()` | 108–125 |
| **NBA layout** | [statjam/src/lib/services/canvas-overlay/nbaDrawing.ts](statjam/src/lib/services/canvas-overlay/nbaDrawing.ts) | `draw()`, `drawMainBar()` | 26–51, 89–128 |
| **Classic layout** | [statjam/src/lib/services/canvas-overlay/drawing.ts](statjam/src/lib/services/canvas-overlay/drawing.ts) | `drawTeamSection()`, `drawCenterSection()` | 87–153, 159–211 |
| **Player stats position** | [statjam/src/lib/services/canvas-overlay/playerStatsDrawer.ts](statjam/src/lib/services/canvas-overlay/playerStatsDrawer.ts) | `draw()` | 27–78 |

**Renderer.ts L108–125:**
```ts
if (this.variant === 'nba') {
  this.nbaDrawer.draw(overlayData, teamALogo, teamBLogo, tournamentLogo);
} else {
  this.drawer.drawBackground();
  // ... drawTournamentHeader, drawTeamSection, drawCenterSection
}
```

---

### 2.3 Left/right stacked vs vertical stack

**Current layout (both variants):**

- **NBA:** Horizontal bar — Team A (left) | Clock (center) | Team B (right). `drawMainBar` L101–127 draws three sections left-to-right.
- **Classic:** Horizontal — Away [Logo][Badge][Score] … [Score][Badge][Logo] Home, with center section (clock) between.

**For a vertical stack:**

- NBA `drawMainBar` assumes horizontal layout: `startX`, `startX + teamSectionWidth`, `startX + teamSectionWidth + clockWidth`.
- To support vertical: need a new layout path (e.g. `drawMainBarVertical` or a layout mode parameter) that stacks Team A, Clock, Team B vertically.
- Classic `drawTeamSection` lays out Logo, Badge, Score horizontally; vertical stack would require a different arrangement per team.

---

### 2.4 Existing overlayVariant / overlayStyle

| Symbol | Type | Location | Values |
|--------|------|----------|--------|
| **OverlayVariant** | Type | [statjam/src/lib/services/canvas-overlay/utils.ts](statjam/src/lib/services/canvas-overlay/utils.ts) L13 | `'classic' \| 'nba'` |
| **variant** | State/prop | renderer.ts L22, L48–56 | Set via `setVariant()` |
| **overlayVariant** | State | [statjam/src/app/dashboard/video-composition-test/page.tsx](statjam/src/app/dashboard/video-composition-test/page.tsx) L56 | `useState<OverlayVariant>('classic')` |
| **setVariant** | Callback | useVideoComposition L104–107 | Calls `composerRef.current.setOverlayVariant(variant)` |

There is **no** `overlayStyle` or position (top/bottom/left/right) config. Layout variants are only `classic` vs `nba`. Position is implied by draw logic (top for score, bottom for player stats).

---

## Summary Tables

### Team name dimensions (Canvas)

| Drawer | Team name max width | Font | Truncation |
|--------|---------------------|------|------------|
| nbaDrawing | 184px | 28px fixed | Char truncate + "..." |
| drawing | 220px (cap in calc) | 26px fixed | Char truncate + "..." |

### Team name dimensions (React)

| Component | Max width | Font | Truncation |
|-----------|-----------|------|------------|
| ScoreOverlaySections.TeamBadge | 200px | var | CSS truncate |
| OrganizerLiveStream | 200px | text-xl | CSS truncate |
| BoxScoreOverlayPanel | flex | text-xs | CSS truncate |

### Layout ownership

| Concern | Primary file | Secondary |
|---------|--------------|------------|
| Variant choice | renderer.ts | video-composition-test, useVideoComposition |
| NBA horizontal bar | nbaDrawing.ts | — |
| Classic horizontal layout | drawing.ts | — |
| Player stats bottom | playerStatsDrawer.ts | — |

---

## Re-Audit Confirmation (Exact Code References)

### Change 1 — Team names: verified locations and values

**nbaDrawing.ts — team name area**

| Item | Line(s) | Exact value / logic |
|------|---------|---------------------|
| Team info width constant | 163 | `teamInfoWidth = 184` |
| drawTeamInfo signature | 227–234 | `drawTeamInfo(x, y, maxWidth, teamName, fouls, align)` — maxWidth is teamInfoWidth |
| Name Y position | 235 | `nameY = y + 38` |
| Foul Y position | 236 | `foulY = y + 68` |
| Font (team name) | 244 | `this.ctx.font = '800 28px Arial, sans-serif'` |
| Truncation loop | 248–255 | `while (nameWidth > maxWidth && displayName.length > 0)`; slice from end; append `...` |
| Team section width | 98 | `teamSectionWidth = (this.MAX_WIDTH - clockWidth) / 2` → (850 − 138)/2 = 356 |

**drawing.ts — team name (badge)**

| Item | Line(s) | Exact value / logic |
|------|---------|---------------------|
| calculateBadgeWidth | 217–224 | `nameWidth = Math.min(measureText(teamName).width, 220)`; return `Math.max(padding + nameWidth + padding, 160)`; padding 24 → min width 160, max ~268 |
| drawTeamBadge team name | 237, 247 | `teamName = isHome ? data.teamBName : data.teamAName`; `nameWidth = Math.min(..., 220)` |
| Badge dimensions | 247, 248 | `badgeWidth = Math.max(24 + nameWidth + 24, 160)`; `badgeHeight = 75` |
| Font | 240, 246 | `teamNameFontSize = 26`; `800 ${teamNameFontSize}px Arial` |
| Truncation | 272–281 | `maxNameWidth = badgeWidth - padding * 2`; while measuredWidth > maxNameWidth trim and add `...` |

**React — team name**

| File | Line(s) | Exact |
|------|---------|--------|
| ScoreOverlaySections.tsx | 181–184 | `className={... truncate max-w-[200px] ...}`; `style={{ fontSize: 'var(--team-name-size, 1.25rem)' }}`; `{teamName}` |
| OrganizerLiveStream.tsx | 75, 85, 129 | Container `absolute top-0 left-0 right-0`; Away `truncate max-w-[200px]` L85; Home same L129; `text-xl` |
| BoxScoreOverlayPanel.tsx | 127–130 | `flex-1 min-w-0`; `text-white font-semibold text-xs truncate`; `{team.name}` |

---

### Change 2 — Overlay position/layout: verified

**Position (Y)**

| What | File | Line(s) | Value |
|------|------|---------|--------|
| NBA bar top | nbaDrawing.ts | 35, 41 | `barY = 20`; `mainBarY = barY + this.HEADER_HEIGHT` (20 + 37 = 57) |
| Classic top | drawing.ts | 56, 104 | Tournament header at top; `scoreTopY = 56` for score/badge |
| Player stats | playerStatsDrawer.ts | 36–38 | "Position: bottom-center"; `y = this.canvasHeight - this.CARD_HEIGHT - this.SAFE_MARGIN` |

**Variant and draw path**

| Step | File | Line(s) |
|------|------|---------|
| OverlayVariant type | utils.ts | 13: `export type OverlayVariant = 'classic' \| 'nba'` |
| Renderer variant | renderer.ts | 22: `private variant: OverlayVariant = 'classic'`; 48–50: `setVariant(variant)` |
| Branch in render | renderer.ts | 108–125: `if (this.variant === 'nba')` → nbaDrawer.draw; else drawer.drawBackground/drawTeamSection/drawCenterSection |
| NBA draw entry | nbaDrawing.ts | 26–51: `draw()` → drawOrganizerHeader, drawMainBar, drawInfoBar |
| Main bar layout | nbaDrawing.ts | 89–128: drawMainBar → Team A at startX, Clock at startX+teamSectionWidth, Team B at startX+teamSectionWidth+clockWidth |

**Left/right layout (NBA)**

- `startX = centerX - this.MAX_WIDTH / 2` (L99).
- Team A: `drawTeamSection(startX, y, teamSectionWidth, ...)` (L102–109).
- Clock: `drawClockSection(startX + teamSectionWidth, y, clockWidth, ...)` (L112–117).
- Team B: `drawTeamSection(startX + teamSectionWidth + clockWidth, y, teamSectionWidth, ...)` (L120–127).
- No vertical-stack path; all horizontal.

**Config surface**

- No `overlayStyle` in codebase (canvas-overlay).
- No top/bottom/left/right position config for score overlay; position is fixed by draw methods.
- Only variant switch: `classic` vs `nba` (renderer.ts L108).

---

### Data flow map (scoring overlay → canvas)

```
video-composition-test: overlayVariant state (L56)
  → useVideoComposition setVariant(overlayVariant) (L274)
  → VideoComposer.setOverlayVariant (useVideoCompositionHelpers / videoComposer.ts L71–72)
  → CanvasOverlayRenderer.setVariant (renderer.ts L48)

On each frame:
  CanvasOverlayRenderer.render(data) (renderer.ts L77)
  → if variant === 'nba': nbaDrawer.draw(...) (L111)
      → draw(barY=20) → drawMainBar(mainBarY=57)
      → drawTeamSection(x, 57, 356, ...) ×2 (Away left, Home right)
      → drawTeamInfo(teamInfoX, 57, 184, teamName, ...) — team name at 184px width, 28px font
  → else: drawer.drawTeamSection('away'|'home', ...) + drawCenterSection (L121–123)
      → drawTeamBadge / calculateBadgeWidth — name cap 220px, badge min 160, 26px font
```

Re-audit confirms: all line numbers and values above match the current codebase. No additional team-name or overlay-position call sites found.

---

## Outputs Confirmation Map

**Inputs (user actions) → Outputs (what changes)**

| User action | State/output changed | Propagation path |
|-------------|----------------------|------------------|
| Click "Classic" button | `overlayVariant = 'classic'` (L56) | `setOverlayVariant('classic')` (L641) |
| Click "NBA" button | `overlayVariant = 'nba'` (L56) | `setOverlayVariant('nba')` (L650) |
| overlayVariant changes | `useEffect` L273–275 | `setVariant(overlayVariant)` → `composerRef.current.setOverlayVariant(variant)` |
| Composer receives variant | `videoComposer.setOverlayVariant` L71–72 | `this.overlayRenderer.setVariant(variant)`; `compositionLoop.invalidateCache()` |
| Renderer receives variant | `renderer.variant` L48–50 | Stored; used on next `render()` call |

**Canvas outputs (what is drawn per variant)**

| Variant | Draw path | Team name output | Score/output position |
|---------|-----------|-------------------|------------------------|
| `nba` | nbaDrawer.draw L111 | drawTeamInfo(184px, 28px font, truncate) L227–265 | Top bar Y=57; Team A left, Clock center, Team B right |
| `classic` | drawer.drawTeamSection L121–122, drawCenterSection L123 | drawTeamBadge(220 cap, 26px, truncate) L230–293 | Top; Logo-Badge-Score left, Score-Badge-Logo right |

**UI outputs (what user sees in controls)**

| Element | Location | Output |
|---------|----------|--------|
| Overlay Style card | video-composition-test L636–660 | Two buttons: "Classic / Floating" and "NBA / ESPN Bar" |
| Selected state | L643, L652 | `variant={overlayVariant === 'classic' ? 'default' : 'outline'}` — highlighted = selected |
| OverlayControlPanel | L662–695 | Renders when `isComposing && selectedGameId`; `showInfoBarTab={overlayVariant === 'nba'}` gates Info Bar tab |
| useVideoComposition return | useVideoComposition L128–134 | `{ composedStream, state, error, start, stop, setVariant }` — setVariant is the only variant-related output |

**Confirmed: no other outputs** — overlayVariant is not passed to useVideoComposition as input; it flows out via setVariant in useEffect. The composed video stream (composedStream) is the final visual output; variant only affects which drawer (nbaDrawer vs drawer) produces that stream's overlay layer.

---

*End of audit. Outputs confirmation map added; no code changes.*
