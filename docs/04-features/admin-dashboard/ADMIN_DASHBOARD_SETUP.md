# Admin Dashboard Setup Guide

**Created**: November 6, 2025  
**Status**: ✅ Complete  
**Version**: 1.0

---

## Overview

The Admin Dashboard provides a centralized interface for user management, site monitoring, and analytics. It follows StatJam's modular architecture principles with components under 200 lines and services under 200 lines.

---

## Features

### 1. User Statistics Cards
- **Total Users**: All registered users
- **New This Week**: Signups in last 7 days
- **Active Today**: Users with activity today (placeholder)
- **Premium Users**: Count of premium status users

### 2. User Management
- Searchable user list (by email)
- Filter by role (all, admin, organizer, stat_admin, player, coach, fan)
- Inline role editing (click badge to edit)
- Pagination (20 users per page)

### 3. Site Analytics
- Embedded Plausible Analytics dashboard
- Real-time visitor tracking
- Link to full Plausible dashboard

### 4. User Distribution
- Visual breakdown by role
- Percentage distribution
- Bar chart visualization

---

## Setup Instructions

### Step 1: Run Database Migration

Run the RLS policies migration in Supabase SQL Editor:

```bash
# File: database/migrations/004_admin_rls_policies.sql
```

This creates:
- `users_admin_read_all` - Admin can read all users
- `users_admin_update_all` - Admin can update any user

### Step 2: Create Admin User

**Option A: Using Script (Recommended)**
```bash
cd statjam
node scripts/create-admin.js your-email@example.com your-password
```

**Option B: Using SQL**
```sql
-- 1. Sign up normally at /auth
-- 2. Run this in Supabase SQL Editor:
UPDATE users 
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Step 3: Configure Plausible Analytics (Optional)

To display site analytics:

1. Go to your Plausible dashboard
2. Navigate to Settings → Visibility
3. Create a shared link
4. Copy the auth token from the share link
5. Update the iframe src in `/app/admin/dashboard/page.tsx`:

```typescript
// Replace YOUR_SHARE_LINK_AUTH with your actual token
src="https://plausible.io/share/statjam.net?auth=YOUR_ACTUAL_TOKEN&embed=true&theme=light"
```

**Without this step**: Analytics section will show setup instructions instead of the dashboard.

### Step 4: Test Admin Access

1. Sign in with admin credentials
2. Should auto-redirect to `/admin/dashboard`
3. Verify:
   - Stats cards load
   - User list displays
   - Search works
   - Role editing works (click a badge)
   - Pagination works

---

## File Structure

```
statjam/
├── database/migrations/
│   └── 004_admin_rls_policies.sql          # RLS policies
├── src/
│   ├── app/
│   │   ├── admin/dashboard/
│   │   │   └── page.tsx                    # Main dashboard (196 lines)
│   │   └── dashboard/
│   │       └── page.tsx                    # Updated with admin redirect
│   ├── components/admin/
│   │   ├── AdminStatsCards.tsx             # Stats cards (84 lines)
│   │   └── AdminUserList.tsx               # User list (197 lines)
│   └── lib/services/
│       ├── adminService.ts                 # Business logic (177 lines)
│       └── userService.ts                  # Updated with admin role
└── docs/04-features/admin-dashboard/
    └── ADMIN_DASHBOARD_SETUP.md            # This file
```

**Total**: ~650 lines of code across 5 files

---

## Architecture Compliance

✅ **Modular Components**
- AdminStatsCards: 84 lines (< 200)
- AdminUserList: 197 lines (< 200)
- Admin dashboard page: 196 lines (< 200)

✅ **Service Layer**
- adminService.ts: 177 lines (< 200)
- Single responsibility per service

✅ **Separation of Concerns**
- UI components in /components
- Business logic in /services
- Database policies separate
- No mixed UI and business logic

✅ **Naming Conventions**
- PascalCase for components
- camelCase for functions
- Descriptive, intention-revealing names

---

## Usage

### Admin Capabilities

1. **View All Users**
   - See complete user list
   - Search by email
   - Filter by role

2. **Manage User Roles**
   - Click user role badge
   - Select new role from dropdown
   - Click checkmark to save
   - Click X to cancel

3. **Monitor Growth**
   - Track new signups
   - View user distribution
   - Monitor premium conversions

4. **Analyze Traffic** (with Plausible)
   - View visitor statistics
   - Track page views
   - Monitor user engagement

### Common Tasks

**Find a user:**
1. Type email in search box
2. Results filter automatically

**Change user role:**
1. Click the role badge
2. Select new role
3. Click checkmark (✓)

**View analytics:**
1. Scroll to Site Analytics section
2. View embedded Plausible dashboard
3. Click "Open in Plausible" for full view

**Check growth:**
1. View "New This Week" card
2. Scroll to "User Distribution" chart
3. See breakdown by role

---

## API Reference

### AdminService

```typescript
// Get all users with filters
AdminService.getAllUsers({
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminUser[]>

// Get dashboard statistics
AdminService.getUserStats(): Promise<UserStats>

// Update user role
AdminService.updateUserRole(
  userId: string, 
  newRole: string
): Promise<void>

// Get single user
AdminService.getUserById(userId: string): Promise<AdminUser | null>
```

### Types

```typescript
interface AdminUser {
  id: string;
  email: string;
  role: string;
  country?: string;
  premium_status: boolean;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  newUsersThisWeek: number;
  activeUsersToday: number;
  premiumUsers: number;
}
```

---

## Security

### RLS Policies

Admin access is controlled via Row Level Security:

```sql
-- Admin can read all users
CREATE POLICY "users_admin_read_all" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update any user
CREATE POLICY "users_admin_update_all" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Frontend Protection

- Auth check on page load
- Auto-redirect if not admin
- Service layer verifies admin role
- All mutations require admin role

---

## Troubleshooting

### Can't access admin dashboard
**Problem**: Redirected to /auth  
**Solution**: Verify user role is 'admin' in Supabase

### User list not loading
**Problem**: Empty list or error  
**Solution**: Check RLS policies are applied

### Can't change user roles
**Problem**: Update fails  
**Solution**: Verify admin RLS UPDATE policy exists

### Analytics not showing
**Problem**: Plausible iframe not loading  
**Solution**: Add your share link auth token to iframe src

---

## Future Enhancements

Possible additions (not implemented):

1. **Activity Tracking**
   - Page view logging
   - User action history
   - Session tracking

2. **Bulk Operations**
   - Export users to CSV
   - Bulk role changes
   - Batch notifications

3. **Advanced Analytics**
   - User retention metrics
   - Conversion funnels
   - Custom reports

4. **Audit Logging**
   - Track admin actions
   - Role change history
   - Access logs

---

## Related Documentation

- [System Architecture](../../01-project/SYSTEM_ARCHITECTURE.md)
- [Authentication Guide](../authentication/AUTH_V2_GUIDE.md)
- [Database Schema](../../03-architecture/DATABASE_SCHEMA.md)
- [RLS Policies](../../05-database/RLS_COMPLETE_DESIGN.md)

---

## Support

For issues or questions:
1. Check RLS policies in Supabase
2. Verify admin user role
3. Check browser console for errors
4. Review Supabase logs

**Key Files for Debugging**:
- `/app/admin/dashboard/page.tsx` - Main component
- `/lib/services/adminService.ts` - Business logic
- `database/migrations/004_admin_rls_policies.sql` - Permissions

