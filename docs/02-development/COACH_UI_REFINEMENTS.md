# Coach Dashboard UI Refinements

## Date: November 8, 2025

## Overview
Two key UI refinements implemented for the Coach Dashboard to improve usability and team management.

---

## 1. Toggle Switch UI Enhancement

### Problem
The Switch component (used for Official/Practice team toggle) appeared as a subtle circle dot in the OFF state, making it unclear whether the toggle was interactive or what state it was in.

### Solution
Enhanced the Switch component with clear visual states:

**OFF State (Practice Team):**
- Gray background (`bg-gray-300` / `bg-gray-600` dark mode)
- White circular thumb on the left
- Larger size (h-6 w-11) for better visibility
- Clear shadow on the thumb

**ON State (Official Team):**
- Blue background (`bg-blue-600`)
- White circular thumb slides to the right
- Smooth transition animation

### Files Modified
- `src/components/ui/switch.tsx`

### Visual Improvements
- Increased toggle size from `h-[1.15rem] w-8` to `h-6 w-11`
- Enhanced thumb size from `size-4` to `h-5 w-5`
- Added `shadow-lg` to thumb for depth
- Clear color distinction: Gray (OFF) vs Blue (ON)
- Smooth slide animation with proper transform values

---

## 2. Delete Team Functionality

### Problem
Coaches had no way to delete teams they no longer needed, leading to cluttered team lists.

### Solution
Implemented a complete delete team feature with safety measures:

**Delete Button:**
- Added red-styled "Delete" button next to "Edit" button
- Uses Trash2 icon for clear visual indication
- Responsive sizing matching other action buttons

**Confirmation Dialog:**
- Red-themed warning dialog with AlertTriangle icon
- Clear warning message with team name
- Lists consequences:
  - All team data permanently deleted
  - Game history removed
  - Players unlinked from team
- Two-button layout: Cancel (outline) and Delete (red)
- Loading state during deletion

**Backend Service:**
- New `deleteTeam()` method in `CoachTeamService`
- Proper error handling
- Triggers parent component refresh after deletion

### Files Modified
- `src/components/coach/CoachTeamCard.tsx`
  - Added delete state management
  - Added `handleDeleteTeam()` handler
  - Added Delete button in action section
  - Added confirmation dialog
- `src/lib/services/coachTeamService.ts`
  - Added `deleteTeam()` method

### Safety Features
1. **Confirmation Required**: Cannot delete without explicit confirmation
2. **Clear Warnings**: Lists all consequences before deletion
3. **Loading States**: Prevents double-clicks during deletion
4. **Error Handling**: Shows alert if deletion fails
5. **UI Feedback**: Button shows "Deleting..." during operation

---

## User Experience Improvements

### Toggle Switch
- **Before**: Subtle dot, unclear state
- **After**: Clear gray/blue toggle with smooth animation
- **Impact**: Coaches immediately understand the toggle state and can confidently change team type

### Delete Team
- **Before**: No way to remove unwanted teams
- **After**: One-click delete with safety confirmation
- **Impact**: Coaches can maintain clean team lists without backend intervention

---

## Testing Checklist

### Toggle Switch
- [ ] OFF state shows gray background with white thumb on left
- [ ] ON state shows blue background with white thumb on right
- [ ] Smooth slide animation when toggling
- [ ] Works in both Create Team and Edit Team modals
- [ ] Dark mode displays correctly

### Delete Team
- [ ] Delete button appears next to Edit button
- [ ] Delete button has red styling
- [ ] Clicking Delete shows confirmation dialog
- [ ] Confirmation dialog shows team name
- [ ] Cancel button closes dialog without deleting
- [ ] Delete button removes team and refreshes list
- [ ] Loading state prevents double-deletion
- [ ] Error handling works if deletion fails

---

## Database Considerations

### Delete Team Operation
The delete operation uses Supabase's cascade behavior:
- `teams` table row is deleted
- Related `team_players` entries are handled by foreign key constraints
- Related `games` entries may need manual cleanup (check cascade rules)

**Note**: Ensure database has proper cascade rules set up for `team_id` foreign keys.

---

## Future Enhancements

### Toggle Switch
- Consider adding labels ("OFF" / "ON") inside the toggle for extra clarity
- Add haptic feedback on mobile devices

### Delete Team
- Add "Archive" option as alternative to permanent deletion
- Show count of games/players before deletion
- Add bulk delete for multiple teams
- Add undo functionality (soft delete with recovery period)

---

## Commit Message
```
feat(coach): enhance toggle UI and add delete team functionality

- Improve Switch component visibility with clear gray/blue states
- Increase toggle size and add shadow for better UX
- Add delete team button with red styling
- Implement confirmation dialog with safety warnings
- Add deleteTeam() service method
- Prevent accidental deletions with explicit confirmation

UI Impact:
- Toggle switches now clearly show OFF (gray) vs ON (blue) states
- Coaches can delete unwanted teams safely
- Better visual feedback for all toggle interactions
```

