# Backend Requirements: Team Join Approval System

## Overview
When coaches add their teams to tournaments, organizers need to approve/deny the request before the team officially joins.

## Database Changes Required

### 1. Add `approval_status` Column to `teams` Table

```sql
ALTER TABLE teams 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update existing teams to 'approved' status
UPDATE teams SET approval_status = 'approved' WHERE approval_status IS NULL;
```

### 2. Update RLS Policies (if needed)

Ensure that:
- Coaches can see their own teams regardless of approval status
- Organizers can see all teams in their tournaments (pending, approved, rejected)
- Public/stat-admin views only show 'approved' teams

## API Behavior Changes

### When Coach Attaches Team to Tournament
- Set `approval_status = 'pending'` (not 'approved')
- Send notification to organizer (optional for MVP2)

### New Endpoints Needed
None - frontend will use direct Supabase calls for approve/reject actions:
```typescript
// Approve team
await supabase
  .from('teams')
  .update({ approval_status: 'approved' })
  .eq('id', teamId);

// Reject team  
await supabase
  .from('teams')
  .update({ approval_status: 'rejected' })
  .eq('id', teamId);
```

## Migration Notes
- Existing teams should be set to 'approved' by default
- New teams joining tournaments should start as 'pending'
- This is a non-breaking change - existing functionality continues to work

## Frontend Implementation
Frontend will be implemented assuming these changes are in place. If backend is not ready:
- The frontend will gracefully handle missing `approval_status` field
- Treat all teams as 'approved' if field is missing

