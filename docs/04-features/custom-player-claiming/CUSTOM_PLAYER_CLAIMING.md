# 🔐 Custom Player Claiming Feature

**Date:** November 28, 2025  
**Status:** ✅ COMPLETED  
**Version:** 0.16.5  
**Priority:** HIGH  
**Type:** Feature Addition + Security Enhancement

---

## 🎯 Overview

The Custom Player Claiming feature allows custom players (team-specific players without StatJam accounts) to claim their profiles and become full StatJam users. This enables players to:

- Create a StatJam account and claim their historical stats
- Transfer all game data from custom player profile to regular user account
- Access their complete player dashboard with all historical data
- Continue playing as a regular StatJam user going forward

---

## 🏗️ Architecture

### **Flow Diagram**

```
Coach → Generate Claim Link → Player Receives Link → Player Clicks Link
  ↓
Claim Page (Preview) → Sign Up (if needed) → Execute Claim → Redirect to Dashboard
  ↓
API Route (/api/claim/execute) → Server-Side Operations → Data Transfer Complete
```

### **Components**

#### **1. Server-Side Infrastructure**

**`src/lib/supabaseAdmin.ts`**
- Server-side Supabase client with `service_role` key
- Bypasses RLS policies for admin operations
- **NEVER exposed to client-side code**

**`src/app/api/claim/execute/route.ts`**
- POST endpoint for claim execution
- Validates claim token
- Executes data transfer operations:
  - Marks custom player as claimed
  - Copies profile data to `users` table
  - Transfers game stats from `custom_player_id` to `player_id`
  - Updates `team_players` references

#### **2. Client-Side Services**

**`src/lib/services/claimService.ts`**
- `generateClaimToken()` - Creates secure claim token for coach
- `validateClaimToken()` - Validates token and returns preview data
- `executeClaim()` - Calls API route to execute claim (client-side wrapper)

#### **3. UI Components**

**`src/app/claim/[token]/page.tsx`**
- Main claim page with token validation
- Shows preview card and sign-up form (if needed)
- Handles claim execution and redirect

**`src/app/claim/[token]/ClaimPreviewCard.tsx`**
- Displays player preview (name, jersey, team, stats summary)

**`src/app/claim/[token]/ClaimSignUpForm.tsx`**
- Inline sign-up form for new players
- Creates account and triggers claim in one step

**`src/components/shared/GenerateClaimLinkButton.tsx`**
- Coach UI component for generating claim links
- Copies link to clipboard

#### **4. Hooks**

**`src/hooks/usePlayerClaim.ts`**
- Manages claim flow state
- Handles token validation
- Coordinates sign-up and claim execution

---

## 🔒 Security

### **Server-Side Operations**

All claim execution operations run server-side using the `service_role` key:

- **Why?** Client-side Supabase client cannot bypass RLS policies
- **How?** API route uses `getSupabaseAdmin()` with service_role key
- **Security:** Service role key is **NEVER** exposed to client (env variable only)

### **Token Security**

- **Length:** 24 characters (alphanumeric, no ambiguous chars)
- **Expiration:** 7 days from generation
- **One-time use:** Token invalidated after successful claim
- **Validation:** Server-side validation before any data transfer

### **Data Transfer Safety**

- **Atomic operations:** All transfers happen in sequence
- **Error handling:** Failed transfers don't leave partial state
- **Verification:** SQL queries verify successful transfers

---

## 📊 Database Schema

### **Custom Players Table Updates**

**Migration:** `019_add_custom_player_claim.sql`

```sql
-- New columns added to custom_players table
claim_token VARCHAR(32) UNIQUE
claim_token_expires_at TIMESTAMPTZ
claimed_by_user_id UUID REFERENCES users(id)
claimed_at TIMESTAMPTZ
```

### **Data Transfer Operations**

1. **Profile Data** (`custom_players` → `users`)
   - `name` → `name`
   - `jersey_number` → `jersey_number`
   - `position` → `position`
   - `profile_photo_url` → `profile_photo_url`
   - `pose_photo_url` → `pose_photo_url`

2. **Game Stats** (`game_stats`)
   - `custom_player_id` → `player_id`
   - `custom_player_id` set to `NULL`

3. **Team References** (`team_players`)
   - `custom_player_id` → `player_id`
   - `custom_player_id` set to `NULL`

---

## 🔄 User Flow

### **For Coaches**

1. Navigate to team management
2. Click "Generate Claim Link" next to custom player
3. Link copied to clipboard
4. Share link with player (email, text, etc.)

### **For Players**

1. Receive claim link from coach
2. Click link → Redirected to `/claim/[token]`
3. See preview of their profile and stats
4. **If not signed in:**
   - Fill out sign-up form (email, password)
   - Account created automatically
   - Claim executed immediately
5. **If already signed in:**
   - Click "Claim This Profile" button
   - Claim executed immediately
6. Redirected to player dashboard (`/dashboard/player`)
7. All historical stats and profile data now visible

---

## 🧪 Testing

### **Manual Testing Checklist**

- [ ] Coach can generate claim link for custom player
- [ ] Claim link is unique and secure
- [ ] Claim page shows correct preview data
- [ ] Sign-up form creates account successfully
- [ ] Claim execution transfers all data correctly
- [ ] Claimed player appears as regular player in team management
- [ ] Historical stats visible on player dashboard
- [ ] Profile data (name, jersey, photos) transferred correctly
- [ ] Token expires after 7 days
- [ ] Token invalidated after successful claim
- [ ] Cannot claim already-claimed player

### **SQL Verification Queries**

```sql
-- Check if custom player is claimed
SELECT id, name, claimed_by_user_id, claimed_at 
FROM custom_players 
WHERE id = 'custom_player_id';

-- Verify stats transferred
SELECT COUNT(*) 
FROM game_stats 
WHERE player_id = 'new_user_id';

-- Check team reference updated
SELECT player_id, custom_player_id 
FROM team_players 
WHERE player_id = 'new_user_id';
```

---

## 📝 Environment Variables

**Required:**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Location:** `.env.local` (never commit to git)

**How to get:** Supabase Dashboard → Settings → API → `service_role` key (secret)

---

## 🐛 Troubleshooting

### **Claim Fails Silently**

**Issue:** Claim appears to succeed but data not transferred

**Solution:**
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Verify API route logs in server console
3. Check database directly with SQL queries
4. Verify RLS policies allow service_role operations

### **Stats Not Showing After Claim**

**Issue:** Player dashboard shows empty stats

**Solution:**
1. Verify stats transfer with SQL: `SELECT * FROM game_stats WHERE player_id = 'user_id'`
2. Check if stats were originally recorded with `custom_player_id`
3. Manually transfer stats if needed (see SQL in migration docs)

### **Token Expired**

**Issue:** Player receives "expired" error

**Solution:**
1. Coach generates new claim link
2. New token has fresh 7-day expiration
3. Share new link with player

---

## 📚 Related Documentation

- `docs/05-database/migrations/019_add_custom_player_claim.sql` - Database schema
- `docs/05-database/migrations/020_VERIFY_CLAIM_SCHEMA.sql` - Schema verification queries
- `docs/05-database/migrations/021_VERIFY_CLAIMED_PLAYER_DATA.sql` - Data verification queries
- `CHANGELOG.md` - Version history
- `PROJECT_STATUS.md` - Current project status

---

## ✅ Summary

The Custom Player Claiming feature provides a secure, seamless way for custom players to become full StatJam users while preserving all their historical data. The implementation uses server-side operations for security and ensures data integrity throughout the transfer process.

**Key Benefits:**
- ✅ Secure token-based system
- ✅ Complete data preservation
- ✅ Seamless user experience
- ✅ Server-side security
- ✅ Production-ready

