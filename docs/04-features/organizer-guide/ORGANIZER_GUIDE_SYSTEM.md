# Organizer Guide UX System

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Created:** October 21, 2025

---

## 📖 Overview

The Organizer Guide UX System is a comprehensive onboarding and reference system designed to help tournament organizers navigate StatJam's features. It implements a 3-surface approach: header button, dashboard callout, and detailed side panel.

### Design Goals

1. **Progressive Disclosure**: Information revealed when needed, not overwhelming
2. **Contextual Help**: Guide appears where organizers naturally look
3. **Self-Dismissing**: Automatically reduces visibility after initial sessions
4. **Always Available**: Guide button remains accessible for reference
5. **Mobile-First**: Responsive design works on all devices

---

## 🎯 Three-Surface Architecture

### Surface 1: Header Guide Button

**Location**: Navigation header (right side, organizer users only)  
**Component**: `OrganizerGuideButton.tsx`  
**Visibility**: Always visible for organizer role

**Features**:
- "New" badge for first 3 sessions (until panel opened once)
- Pulse animation to draw attention
- White text with orange hover state
- Tooltip: "Organizer Guide: setup, statisticians, live tracking"
- Icon + text on desktop, icon-only on mobile

**Badge Logic**:
```typescript
showBadge = sessionCount <= 3 && panelOpenCount === 0
```

### Surface 2: Dashboard Callout Card

**Location**: Top of organizer dashboard overview  
**Component**: `OrganizerGuideCallout.tsx`  
**Visibility**: First 3 sessions or until dismissed

**Features**:
- High-contrast gradient background for visibility
- Three quick-start bullet points
- "Open Guide" CTA button
- "Dismiss" X button (permanent)
- Auto-hides after 3 sessions or manual dismissal

**Quick Start Points**:
1. Create tournament and add teams
2. Assign a Stat Profile in Game Settings
3. Stat admin launches Stat Tracker for live stats

**Callout Logic**:
```typescript
showCallout = sessionCount <= 3 && !calloutDismissed
```

### Surface 3: Comprehensive Guide Panel

**Location**: Right-side slide panel (overlay)  
**Component**: `OrganizerGuidePanel.tsx`  
**Visibility**: On-demand via button/callout click

**Features**:
- Shadcn Sheet component (right-side slide)
- Full-width mobile, 384px max desktop
- Scrollable content with 6 sections
- ESC key and click-outside to close
- WhatsApp support integration
- Beta feedback section

**Content Sections**:
1. **Quick Start**: Welcome and overview
2. **Create Organizer Account**: Profile setup
3. **Create Tournament & Teams**: Core workflow
4. **Assign a Statistician**: Stat profile assignment
5. **Run the Game**: Live tracking process
6. **Review & Share**: Post-game features

---

## 🔧 Technical Architecture

### State Management: React Context

**Why Context?**
- Shared state across multiple components
- Prevents duplicate hook instances
- Single source of truth
- Perfect state synchronization

**Context Provider**:
```typescript
interface OrganizerGuideContextType {
  // State
  isGuideOpen: boolean;        // Panel visibility
  showCallout: boolean;        // Callout visibility
  showBadge: boolean;          // Badge visibility
  sessionCount: number;        // Dashboard visits
  
  // Actions
  openGuide: () => void;       // Open panel
  closeGuide: () => void;      // Close panel
  dismissCallout: () => void;  // Hide callout forever
  incrementSession: () => void; // Track dashboard visits
}
```

### localStorage Persistence

**Schema**:
```typescript
interface GuideState {
  sessionCount: number;        // Number of dashboard visits
  calloutDismissed: boolean;   // Permanent dismissal flag
  panelOpenCount: number;      // Times panel was opened
  lastShown?: string;          // ISO date of last session
}
```

**Storage Key**: `'organizer_guide_state'`

**Session Tracking**:
- Auto-increments on dashboard load
- Only once per day (date comparison)
- Prevents duplicate increments
- Persists across browser sessions

**Code**:
```typescript
const incrementSession = useCallback(() => {
  setGuideState(prevState => {
    const today = new Date().toDateString();
    const lastShownDate = prevState.lastShown 
      ? new Date(prevState.lastShown).toDateString() 
      : '';
    
    if (lastShownDate === today) {
      return prevState; // Same day, don't increment
    }
    
    return {
      ...prevState,
      sessionCount: prevState.sessionCount + 1,
      lastShown: new Date().toISOString(),
    };
  });
}, []);
```

### Component Structure

```
OrganizerGuideProvider (Context)
├── NavigationHeader
│   └── OrganizerGuideButton
├── OrganizerDashboard
│   └── OrganizerDashboardOverview
│       └── OrganizerGuideCallout
└── OrganizerGuidePanel
```

**Integration Points**:

1. **Dashboard Page** (`src/app/dashboard/page.tsx`):
   ```typescript
   return (
     <OrganizerGuideProvider>
       <NavigationHeader />
       <OrganizerDashboard user={user} />
       {userRole === 'organizer' && <OrganizerGuidePanel />}
     </OrganizerGuideProvider>
   );
   ```

2. **Navigation Header** (`src/components/NavigationHeader.tsx`):
   ```typescript
   {userRole === 'organizer' && <OrganizerGuideButton />}
   ```

3. **Dashboard Overview** (`src/components/OrganizerDashboardOverview.tsx`):
   ```typescript
   const { incrementSession } = useOrganizerGuide();
   
   useEffect(() => {
     incrementSession();
   }, [incrementSession]);
   
   return (
     <>
       <OrganizerGuideCallout />
       {/* Dashboard content */}
     </>
   );
   ```

---

## 📁 File Structure

### New Files Created

```
src/
├── contexts/
│   └── OrganizerGuideContext.tsx        (136 lines)
├── components/
│   └── guide/
│       ├── OrganizerGuideButton.tsx     (41 lines)
│       ├── OrganizerGuidePanel.tsx      (295 lines)
│       ├── OrganizerGuideCallout.tsx    (57 lines)
│       ├── GuideSection.tsx             (25 lines)
│       └── index.ts                     (4 lines)
├── hooks/
│   └── useOrganizerGuide.ts             (121 lines)
└── lib/
    └── types/
        └── guide.ts                     (40 lines)
```

### Modified Files

```
src/
├── app/
│   └── dashboard/
│       └── page.tsx                     (Added Provider wrapper)
├── components/
│   ├── NavigationHeader.tsx             (Added Guide button)
│   ├── OrganizerDashboardOverview.tsx   (Added callout + session tracking)
│   └── OrganizerTournamentManager.tsx   (Previous UI refinements)
```

---

## 🎨 UI/UX Design

### Visual Hierarchy

**Header Button**:
- Subtle presence (ghost button)
- "New" badge for attention (first 3 sessions)
- Consistent with navbar styling

**Callout Card**:
- High visibility (gradient background)
- Clear action buttons
- Dismissible but not intrusive

**Guide Panel**:
- Professional slide-in animation
- Clean, readable typography
- Organized sections with icons
- WhatsApp-branded support button

### Mobile Responsiveness

**Breakpoints**:
- `sm` (640px): Show button text
- `md` (768px): Full callout layout
- Desktop: Constrained panel width (384px max)

**Panel Behavior**:
- Mobile: Full-width overlay
- Desktop: Right-side slide (max 384px)
- Both: ESC key and click-outside to close

### Accessibility

- ✅ Semantic HTML structure
- ✅ Keyboard navigation (ESC to close)
- ✅ Focus management in panel
- ✅ ARIA labels on interactive elements
- ✅ Color contrast compliance
- ✅ Screen reader friendly

---

## 🔄 User Flow

### First-Time Organizer

1. **Sign up** as organizer role
2. **Land on dashboard** → Callout card appears
3. **See "Guide" button** in header with "New" badge
4. **Read callout** with 3 quick steps
5. **Click "Open Guide"** → Panel slides in from right
6. **Browse sections** to understand workflow
7. **Close guide** (ESC or click outside)
8. **Badge remains** until panel opened once

### Returning Organizer (Sessions 2-3)

1. **Return to dashboard** → Callout still visible (if not dismissed)
2. **Badge still shows** (until panel opened)
3. **Can dismiss callout** permanently with X
4. **Guide button** always available for reference

### Experienced Organizer (Session 4+)

1. **Land on dashboard** → No callout (auto-hidden)
2. **No badge** on Guide button
3. **Button remains** in header for reference
4. **On-demand access** to guide content anytime

---

## 🛠️ Development Details

### Performance Optimizations

**Memoization**:
```typescript
const openGuide = useCallback(() => {
  setIsGuideOpen(true);
  setGuideState(prevState => ({
    ...prevState,
    panelOpenCount: prevState.panelOpenCount + 1,
  }));
}, []); // Empty deps - functional state updates
```

**Conditional Rendering**:
```typescript
{userRole === 'organizer' && <OrganizerGuideButton />}
```

**Lazy State Initialization**:
```typescript
const [guideState, setGuideState] = useState<GuideState>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(GUIDE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultState;
  }
  return defaultState;
});
```

### SSR Safety

All `localStorage` access wrapped:
```typescript
if (typeof window !== 'undefined') {
  try {
    localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(guideState));
  } catch (error) {
    console.warn('Failed to save guide state:', error);
  }
}
```

### Error Handling

- Try-catch blocks around localStorage operations
- Fallback to default state on parse errors
- Console warnings for debugging (not user-facing errors)
- Graceful degradation if localStorage unavailable

---

## 📱 Support Integration

### WhatsApp Contact

**Number**: +7472189711  
**Link Format**: `https://wa.me/7472189711`  
**Button Style**: Green-themed (WhatsApp branding)

**Location in Guide**:
```typescript
<Button
  variant="outline"
  size="sm"
  className="gap-2 border-green-200 hover:bg-green-100"
  onClick={() => window.open('https://wa.me/7472189711', '_blank')}
>
  <Mail className="w-4 h-4" />
  WhatsApp: +7472189711
  <ExternalLink className="w-3 h-3" />
</Button>
```

**Beta Feedback Section**:
- Clearly labeled as "Beta"
- Encourages user feedback
- Direct WhatsApp contact for support
- Opens in new tab

---

## 🧪 Testing Scenarios

### Manual Testing Checklist

**Initial Load**:
- [ ] Organizer user sees Guide button in header
- [ ] "New" badge is visible on button
- [ ] Callout card appears on dashboard
- [ ] Session count increments by 1

**Button Interaction**:
- [ ] Click button → Panel opens from right
- [ ] Badge disappears after first panel open
- [ ] Button remains clickable after panel close
- [ ] Hover states work correctly

**Callout Interaction**:
- [ ] "Open Guide" button opens panel
- [ ] "Dismiss" X hides callout permanently
- [ ] Callout respects dismissal across sessions
- [ ] Auto-hides after session 3

**Panel Interaction**:
- [ ] Panel slides in smoothly
- [ ] All 6 sections are visible
- [ ] Scroll works correctly
- [ ] ESC key closes panel
- [ ] Click outside closes panel
- [ ] WhatsApp button opens correct link

**Persistence**:
- [ ] Session count persists across page refreshes
- [ ] Callout dismissal persists
- [ ] Panel open count persists
- [ ] State resets only on localStorage clear

**Mobile Testing**:
- [ ] Button shows icon-only on small screens
- [ ] Panel is full-width on mobile
- [ ] Callout is readable on mobile
- [ ] Touch interactions work smoothly

---

## 🔐 Security Considerations

### Data Storage

- **localStorage only** - No sensitive data stored
- **Client-side only** - No server sync required
- **User-specific** - Per browser/device basis
- **Non-critical** - Loss of state is acceptable

### Input Sanitization

- No user input accepted in guide system
- All content is static/hardcoded
- WhatsApp number is validated constant
- No XSS risk in guide content

### Access Control

- Guide only shows for `userRole === 'organizer'`
- Uses existing auth context for role check
- No additional permissions required
- Component-level conditional rendering

---

## 📊 Analytics Opportunities

### Metrics to Track (Future)

1. **Engagement**:
   - Guide button click rate
   - Panel open frequency
   - Average time spent in guide
   - Section scroll depth

2. **Effectiveness**:
   - Callout dismissal rate
   - Session count when first opened
   - Repeat guide access patterns
   - Support contact rate

3. **Onboarding**:
   - Time to first tournament creation after viewing guide
   - Correlation between guide usage and feature adoption
   - Drop-off points in organizer workflow

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Interactive Tutorials**:
   - Step-by-step walkthroughs
   - Highlight elements on actual page
   - Progress tracking

2. **Video Content**:
   - Embed tutorial videos
   - Screen recordings of workflows
   - Voice-over explanations

3. **Search Functionality**:
   - Search guide content
   - Jump to relevant sections
   - Keyword highlighting

4. **Contextual Tips**:
   - Show tips based on current page
   - Feature-specific help
   - Tooltips on first interaction

5. **Multi-language Support**:
   - Translate guide content
   - Locale-based WhatsApp numbers
   - RTL language support

6. **Progress Tracking**:
   - Checkboxes for completed steps
   - Visual progress indicators
   - Achievement badges

---

## 📝 Maintenance Notes

### Regular Updates Required

1. **Content Refresh**:
   - Update guide content when features change
   - Add new sections for new features
   - Remove deprecated information

2. **Support Contact**:
   - Update WhatsApp number if changed
   - Adjust support hours/availability messaging
   - Update beta status when in production

3. **Session Thresholds**:
   - Adjust "3 sessions" limit based on analytics
   - Consider user feedback on visibility
   - A/B test different thresholds

### Monitoring

- Check localStorage usage (browser limits)
- Monitor guide access patterns
- Track support inquiries from guide
- Review user feedback on guide effectiveness

---

## 🎓 Best Practices for Guide Content

### Writing Guidelines

1. **Be Concise**: Short, scannable sentences
2. **Use Active Voice**: "Create a tournament" not "A tournament is created"
3. **Show Steps**: Numbered lists for processes
4. **Use Icons**: Visual cues for sections
5. **Provide Context**: Explain "why" not just "how"
6. **Update Regularly**: Keep content current
7. **Test Clarity**: Have non-technical user review

### Content Structure

- **H2 for sections**: Main topics
- **Bullet lists**: Related items
- **Numbered lists**: Sequential steps
- **Bold for emphasis**: Key terms/actions
- **Code snippets**: Technical details (if needed)

---

## 📞 Support

For technical questions about the guide system:
- **Developer**: Review this documentation
- **Code**: See `/src/components/guide/` and `/src/contexts/OrganizerGuideContext.tsx`
- **State Logic**: See `/src/hooks/useOrganizerGuide.ts`

For user-facing support:
- **WhatsApp**: +7472189711
- **Feedback**: Beta users encouraged to provide feedback via WhatsApp

---

**Last Updated**: October 21, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅

