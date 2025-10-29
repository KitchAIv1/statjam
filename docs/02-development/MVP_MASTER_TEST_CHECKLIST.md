# StatJam MVP Master Test Checklist

**Version**: 0.15.0  
**Date**: October 29, 2025  
**Purpose**: Comprehensive testing checklist for 100% MVP validation  
**Scope**: Stat Admin & Coach Tracker

---

## 📋 How to Use This Checklist

1. **Test in Order**: Follow the sequence for logical flow
2. **Mark Progress**: Check off ✅ as you complete each test
3. **Document Issues**: Note any bugs or unexpected behavior
4. **Test Both Modes**: Complete all tests for Stat Admin AND Coach Tracker
5. **Use Real Data**: Test with actual tournaments, teams, and players

---

## 🎯 STAT ADMIN MODE TESTS

### **Prerequisites**
- [ ] Logged in as user with `stat_admin` role
- [ ] Tournament created with at least 2 teams
- [ ] Each team has at least 5 players
- [ ] Game created and ready to track
- [ ] Automation enabled for tournament (run SQL scripts if needed)

---

### **Section 1: Game Setup & Navigation** (5 tests)

#### Test 1.1: Access Stat Tracker
- [ ] Navigate to game from organizer dashboard
- [ ] Stat tracker page loads without errors
- [ ] Game header shows correct team names
- [ ] Quarter shows "Q1"
- [ ] Clock shows "12:00" (or configured quarter length)
- [ ] Shot clock shows "24"

#### Test 1.2: Initial UI State
- [ ] Both team rosters visible (5 players each)
- [ ] All player names display correctly
- [ ] Jersey numbers visible (if set)
- [ ] Score shows "0 - 0"
- [ ] Possession indicator shows (either team or neutral)
- [ ] "Back to Dashboard" button visible

#### Test 1.3: Responsive Layout
- [ ] Desktop view: 3-column layout (Team A | Tracker | Team B)
- [ ] Mobile view: Compact scoreboard at top
- [ ] Mobile view: Dual roster section visible
- [ ] All buttons accessible on mobile
- [ ] No horizontal scrolling on mobile

#### Test 1.4: Player Selection
- [ ] Click on Team A player → Player highlights
- [ ] Click on Team B player → Player highlights
- [ ] Selected player name shows in tracker
- [ ] Can switch between players
- [ ] Selection persists when recording stats

#### Test 1.5: Navigation
- [ ] "Back to Dashboard" returns to organizer dashboard
- [ ] Browser back button works correctly
- [ ] Page refresh maintains game state
- [ ] No data loss on refresh

---

### **Section 2: Basic Stat Recording** (10 tests)

#### Test 2.1: Field Goal Made
- [ ] Select player
- [ ] Click "2PT" (made)
- [ ] Score increases by 2 points
- [ ] Stat recorded in database
- [ ] Last action shows "Player Name - 2PT Made"
- [ ] **AUTOMATION**: Assist prompt appears
- [ ] **AUTOMATION**: Possession flips to opponent

#### Test 2.2: Field Goal Missed
- [ ] Select player
- [ ] Click "2PT" (missed)
- [ ] Score does NOT increase
- [ ] Stat recorded in database
- [ ] **AUTOMATION**: Block prompt appears (optional)
- [ ] **AUTOMATION**: Rebound prompt appears (required)
- [ ] **AUTOMATION**: Possession does NOT flip yet

#### Test 2.3: Three-Pointer Made
- [ ] Select player
- [ ] Click "3PT" (made)
- [ ] Score increases by 3 points
- [ ] Stat recorded in database
- [ ] **AUTOMATION**: Assist prompt appears
- [ ] **AUTOMATION**: Possession flips to opponent

#### Test 2.4: Three-Pointer Missed
- [ ] Select player
- [ ] Click "3PT" (missed)
- [ ] Score does NOT increase
- [ ] **AUTOMATION**: Block prompt appears (optional)
- [ ] **AUTOMATION**: Rebound prompt appears (required)

#### Test 2.5: Free Throw Made
- [ ] Select player
- [ ] Click "FT" (made)
- [ ] Score increases by 1 point
- [ ] Stat recorded in database
- [ ] **AUTOMATION**: Assist prompt does NOT appear
- [ ] **AUTOMATION**: Possession flips to opponent

#### Test 2.6: Free Throw Missed
- [ ] Select player
- [ ] Click "FT" (missed)
- [ ] Score does NOT increase
- [ ] **AUTOMATION**: Rebound prompt appears

#### Test 2.7: Assist
- [ ] Record made shot (2PT or 3PT)
- [ ] Assist prompt modal appears
- [ ] Select assisting player from list
- [ ] Assist recorded in database
- [ ] Modal closes automatically
- [ ] Can skip assist (click "Skip" or close)

#### Test 2.8: Rebound (Defensive)
- [ ] Record missed shot
- [ ] Rebound prompt modal appears
- [ ] Select "Defensive Rebound"
- [ ] Select rebounding player (opposing team)
- [ ] Rebound recorded in database
- [ ] **AUTOMATION**: Possession flips to rebounding team

#### Test 2.9: Rebound (Offensive)
- [ ] Record missed shot
- [ ] Rebound prompt modal appears
- [ ] Select "Offensive Rebound"
- [ ] Select rebounding player (same team)
- [ ] Rebound recorded in database
- [ ] **AUTOMATION**: Possession stays with same team
- [ ] **AUTOMATION**: Shot clock resets to 14s (if > 14s remaining)

#### Test 2.10: Block
- [ ] Record missed shot
- [ ] Block prompt modal appears
- [ ] Select blocking player
- [ ] Block recorded in database
- [ ] Rebound prompt appears next
- [ ] Both block and rebound linked via `sequence_id`

---

### **Section 3: Advanced Stats** (8 tests)

#### Test 3.1: Steal
- [ ] Select player
- [ ] Click "STL"
- [ ] Steal recorded in database
- [ ] **AUTOMATION**: Turnover auto-generated for opponent
- [ ] **AUTOMATION**: Possession flips to stealing team
- [ ] Last action shows "Player Name - Steal"

#### Test 3.2: Turnover
- [ ] Select player
- [ ] Click "TOV"
- [ ] Turnover recorded in database
- [ ] **AUTOMATION**: Possession flips to opponent
- [ ] Last action shows "Player Name - Turnover"

#### Test 3.3: Personal Foul
- [ ] Select player (fouler)
- [ ] Click "FOUL"
- [ ] Foul type modal appears
- [ ] Select "Personal Foul"
- [ ] Foul recorded immediately
- [ ] No free throw modal
- [ ] **AUTOMATION**: Possession flips to opponent
- [ ] **AUTOMATION**: Clock pauses

#### Test 3.4: Offensive Foul
- [ ] Select player (fouler)
- [ ] Click "FOUL"
- [ ] Select "Offensive Foul"
- [ ] Foul recorded
- [ ] Turnover auto-generated
- [ ] No free throw modal
- [ ] **AUTOMATION**: Possession flips to opponent

#### Test 3.5: Shooting Foul (2PT)
- [ ] Select player (fouler)
- [ ] Click "FOUL"
- [ ] Select "Shooting Foul - 2PT"
- [ ] Victim selection modal appears
- [ ] Select victim player (opposing team)
- [ ] Free throw modal appears with 2 shots
- [ ] Record both FTs (made/missed)
- [ ] Foul and FTs linked via `sequence_id`
- [ ] **AUTOMATION**: Possession flips after FTs

#### Test 3.6: Shooting Foul (3PT)
- [ ] Select player (fouler)
- [ ] Click "FOUL"
- [ ] Select "Shooting Foul - 3PT"
- [ ] Select victim player
- [ ] Free throw modal appears with 3 shots
- [ ] Record all 3 FTs
- [ ] All events linked

#### Test 3.7: Technical Foul
- [ ] Select player (fouler)
- [ ] Click "FOUL"
- [ ] Select "Technical Foul"
- [ ] Select victim player (opposing team)
- [ ] Free throw modal appears with 1 shot
- [ ] Record FT
- [ ] **AUTOMATION**: Possession RETAINED by fouled team after FT
- [ ] Verify possession does NOT flip

#### Test 3.8: Flagrant Foul
- [ ] Select player (fouler)
- [ ] Click "FOUL"
- [ ] Select "Flagrant Foul"
- [ ] Select victim player
- [ ] Free throw modal appears with 2 shots
- [ ] Record both FTs
- [ ] **AUTOMATION**: Possession RETAINED by fouled team after FTs

---

### **Section 4: Clock Automation** (10 tests)

#### Test 4.1: Game Clock Start/Stop
- [ ] Click "Start" → Clock counts down
- [ ] Click "Stop" → Clock pauses
- [ ] Time displayed correctly (MM:SS)
- [ ] Clock continues from paused time when restarted

#### Test 4.2: Shot Clock Start/Stop
- [ ] Game clock running → Shot clock counts down
- [ ] Shot clock syncs with game clock (no desync)
- [ ] Shot clock reaches 0 → Violation warning (if implemented)

#### Test 4.3: Auto-Pause on Foul
- [ ] Start game clock
- [ ] Record a foul (any type)
- [ ] **AUTOMATION**: Clock auto-pauses
- [ ] Shot clock also pauses

#### Test 4.4: Auto-Pause on Timeout
- [ ] Start game clock
- [ ] Click "TIME OUT"
- [ ] Select timeout type
- [ ] **AUTOMATION**: Clock auto-pauses
- [ ] Timeout recorded

#### Test 4.5: Shot Clock Reset (Possession Change)
- [ ] Record made shot
- [ ] **AUTOMATION**: Shot clock resets to 24s
- [ ] Game clock continues running

#### Test 4.6: Shot Clock Reset (Offensive Rebound)
- [ ] Record missed shot
- [ ] Select offensive rebound
- [ ] **AUTOMATION**: Shot clock resets to 14s (if > 14s)
- [ ] **AUTOMATION**: Shot clock continues if < 14s

#### Test 4.7: Manual Shot Clock Reset
- [ ] Click shot clock reset button
- [ ] Shot clock resets to 24s
- [ ] Clock syncs with game clock running state

#### Test 4.8: Manual Shot Clock Edit
- [ ] Click shot clock edit button
- [ ] Enter custom time (e.g., 10s)
- [ ] Shot clock updates to custom time
- [ ] Clock continues running if game clock running

#### Test 4.9: NBA Last 2-Minute Rule
- [ ] Advance to Q4, under 2:00 remaining
- [ ] Record made basket
- [ ] **AUTOMATION**: Game clock stops
- [ ] Must manually restart clock

#### Test 4.10: Quarter Advancement
- [ ] Let clock run to 0:00
- [ ] Quarter advances automatically (Q1 → Q2 → Q3 → Q4)
- [ ] Clock resets to quarter length
- [ ] Shot clock resets to 24s

---

### **Section 5: Substitutions** (5 tests)

#### Test 5.1: Basic Substitution
- [ ] Click "SUB" button
- [ ] Substitution modal appears
- [ ] Shows active players (on court)
- [ ] Shows bench players
- [ ] Select player to sub out
- [ ] Select player to sub in
- [ ] Confirm substitution
- [ ] Roster updates on UI
- [ ] Substitution recorded in database

#### Test 5.2: Multiple Substitutions
- [ ] Open substitution modal
- [ ] Make 2-3 substitutions
- [ ] All changes reflected in roster
- [ ] All substitutions recorded

#### Test 5.3: Substitution Validation
- [ ] Try to sub in a player already on court
- [ ] Should show error or prevent action
- [ ] Try to sub out a player already on bench
- [ ] Should show error or prevent action

#### Test 5.4: Substitution Timing
- [ ] Record substitution
- [ ] Check `game_substitutions` table
- [ ] Verify `game_time_minutes` and `game_time_seconds` recorded
- [ ] Verify quarter recorded

#### Test 5.5: Player Minutes Calculation
- [ ] Make several substitutions
- [ ] Check player stats
- [ ] Verify minutes reflect actual on-court time
- [ ] Not just game clock time

---

### **Section 6: Possession Tracking** (8 tests)

#### Test 6.1: Initial Possession
- [ ] Start game
- [ ] Possession indicator shows one team (or neutral)
- [ ] Record first stat
- [ ] Possession updates correctly

#### Test 6.2: Made Shot Possession Flip
- [ ] Record made shot (any type)
- [ ] **AUTOMATION**: Possession flips to opponent
- [ ] Possession indicator updates
- [ ] Last change reason: "made_shot"

#### Test 6.3: Turnover Possession Flip
- [ ] Record turnover
- [ ] **AUTOMATION**: Possession flips to opponent
- [ ] Possession indicator updates

#### Test 6.4: Steal Possession Flip
- [ ] Record steal
- [ ] **AUTOMATION**: Possession flips to stealing team
- [ ] Possession indicator updates

#### Test 6.5: Defensive Rebound Possession Flip
- [ ] Record missed shot
- [ ] Select defensive rebound (opposing team)
- [ ] **AUTOMATION**: Possession flips to rebounding team

#### Test 6.6: Offensive Rebound Possession Retention
- [ ] Record missed shot
- [ ] Select offensive rebound (same team)
- [ ] **AUTOMATION**: Possession stays with same team

#### Test 6.7: Manual Possession Control
- [ ] Click on possession indicator (team badge)
- [ ] Possession manually changes
- [ ] Change persists on refresh
- [ ] Recorded in `game_possessions` table

#### Test 6.8: Foul Possession Logic
- [ ] Record standard foul (personal/offensive)
- [ ] **AUTOMATION**: Possession flips to opponent
- [ ] Record technical/flagrant foul + FTs
- [ ] **AUTOMATION**: Possession RETAINED after FTs

---

### **Section 7: Timeouts & Team Fouls** (5 tests)

#### Test 7.1: Full Timeout
- [ ] Click "TIME OUT"
- [ ] Timeout modal appears
- [ ] Select "Full Timeout"
- [ ] Select team
- [ ] Timeout recorded
- [ ] Team timeout count decreases
- [ ] **AUTOMATION**: Clock pauses

#### Test 7.2: 30-Second Timeout
- [ ] Click "TIME OUT"
- [ ] Select "30-Second Timeout"
- [ ] Select team
- [ ] Timeout recorded
- [ ] Countdown timer shows (if implemented)

#### Test 7.3: Team Foul Tracking
- [ ] Record multiple fouls for Team A
- [ ] Team foul count increases
- [ ] Check database `team_fouls` column
- [ ] Verify auto-increment working

#### Test 7.4: Bonus Indicator
- [ ] Record 5+ fouls for one team in a quarter
- [ ] Bonus indicator appears (if implemented)
- [ ] Shooting fouls now trigger 1-and-1 or 2 FTs

#### Test 7.5: Timeout Validation
- [ ] Use all timeouts for a team
- [ ] Try to call another timeout
- [ ] Should show error or prevent action

---

### **Section 8: Live Viewer Integration** (5 tests)

#### Test 8.1: Real-Time Score Updates
- [ ] Open game in Live Viewer (separate tab/device)
- [ ] Record stats in Stat Tracker
- [ ] Verify score updates in Live Viewer (within 15s)
- [ ] No page refresh needed

#### Test 8.2: Play-by-Play Feed
- [ ] Record various stats (shots, fouls, subs)
- [ ] Check Live Viewer play-by-play
- [ ] All events appear in feed
- [ ] Events in correct chronological order
- [ ] Player names and stat types correct

#### Test 8.3: Team Stats Tab
- [ ] Open Team Stats tab in Live Viewer
- [ ] Verify team aggregate stats (FG%, 3P%, FT%, etc.)
- [ ] Verify player stats (PTS, REB, AST, etc.)
- [ ] Stats update in real-time
- [ ] Player minutes calculated correctly

#### Test 8.4: Live Status Indicator
- [ ] Game in progress → Shows "LIVE" badge
- [ ] Game ended → Shows "FINAL" badge
- [ ] Scheduled game → Shows date/time

#### Test 8.5: Mobile Responsiveness (Live Viewer)
- [ ] Open Live Viewer on mobile
- [ ] All tabs accessible
- [ ] Stats display correctly
- [ ] No layout issues

---

### **Section 9: Game Completion** (5 tests)

#### Test 9.1: End Game
- [ ] Click "END GAME" button
- [ ] Confirmation modal appears
- [ ] Confirm end game
- [ ] Game status changes to "completed"
- [ ] Final score recorded
- [ ] Clock stops

#### Test 9.2: Overtime Handling
- [ ] Game tied at end of Q4
- [ ] Overtime prompt appears
- [ ] Start overtime period
- [ ] Clock resets to OT length (5 min)
- [ ] Quarter shows "OT" or "Q5"

#### Test 9.3: Post-Game Stats
- [ ] End game
- [ ] Navigate to game details
- [ ] All stats visible
- [ ] Box score accurate
- [ ] Player stats accurate

#### Test 9.4: Winner Determination
- [ ] End game with score difference
- [ ] Correct winner determined
- [ ] Winner displayed in game details
- [ ] Tournament bracket updated (if applicable)

#### Test 9.5: Game History
- [ ] Navigate to organizer dashboard
- [ ] Completed game appears in history
- [ ] Can view game details
- [ ] Cannot edit completed game stats

---

### **Section 10: Data Integrity** (5 tests)

#### Test 10.1: Database Persistence
- [ ] Record 10+ different stats
- [ ] Check `game_stats` table in database
- [ ] All stats present with correct values
- [ ] `sequence_id` links related events
- [ ] Timestamps accurate

#### Test 10.2: Score Calculation
- [ ] Record various scoring stats
- [ ] Check database score vs UI score
- [ ] Scores match exactly
- [ ] No phantom points

#### Test 10.3: Player Stats Aggregation
- [ ] Record stats for multiple players
- [ ] Check `stats` table (aggregated)
- [ ] Player totals accurate
- [ ] No duplicate entries

#### Test 10.4: Event Linking
- [ ] Record made shot + assist
- [ ] Check `sequence_id` in database
- [ ] Both events share same `sequence_id`
- [ ] Record foul + FTs
- [ ] All linked via `sequence_id`

#### Test 10.5: RLS Policy Verification
- [ ] Log out and try to access game
- [ ] Should be blocked (unauthorized)
- [ ] Log in as different user
- [ ] Can only access own games/tournaments

---

## 🎯 COACH TRACKER MODE TESTS

### **Prerequisites**
- [ ] Logged in as user with `coach` role
- [ ] Coach team created with at least 5 players
- [ ] Quick Track game created
- [ ] Opponent name set

---

### **Section 11: Coach Mode Setup** (5 tests)

#### Test 11.1: Access Coach Dashboard
- [ ] Navigate to coach dashboard
- [ ] "My Teams" section visible
- [ ] "Quick Track" section visible
- [ ] All created teams listed

#### Test 11.2: Create Coach Team
- [ ] Click "Create Team"
- [ ] Enter team name
- [ ] Set visibility (public/private)
- [ ] Team created successfully
- [ ] Team appears in "My Teams"

#### Test 11.3: Add Players to Team
- [ ] Click "Manage Players" on team card
- [ ] Player management modal appears
- [ ] Search for existing StatJam users
- [ ] Add existing player
- [ ] Create custom player (name only)
- [ ] Both types added to roster
- [ ] Minimum 5 players required

#### Test 11.4: Quick Track Game Creation
- [ ] Click "Quick Track" on team card
- [ ] Enter opponent name
- [ ] Game created successfully
- [ ] Redirected to stat tracker

#### Test 11.5: Coach Tracker UI
- [ ] Coach team roster on left (5 players)
- [ ] Opponent button on right (no roster)
- [ ] Tracker in center
- [ ] All automation features visible

---

### **Section 12: Coach Mode - Basic Stats** (10 tests)

#### Test 12.1: Home Team Field Goal Made
- [ ] Select home team player
- [ ] Click "2PT" (made)
- [ ] Score increases for home team
- [ ] Stat recorded with correct player
- [ ] **AUTOMATION**: Assist prompt appears
- [ ] **AUTOMATION**: Possession flips

#### Test 12.2: Opponent Team Field Goal Made
- [ ] Click "OPPONENT" button
- [ ] Opponent selected (no player list)
- [ ] Click "2PT" (made)
- [ ] Score increases for opponent
- [ ] Stat recorded with `is_opponent_stat = true`
- [ ] **AUTOMATION**: Possession flips

#### Test 12.3: Home Team Three-Pointer
- [ ] Select home team player
- [ ] Click "3PT" (made)
- [ ] Score increases by 3
- [ ] **AUTOMATION**: Assist prompt shows home team players only

#### Test 12.4: Opponent Three-Pointer
- [ ] Select opponent
- [ ] Click "3PT" (made)
- [ ] Score increases by 3 for opponent
- [ ] No assist prompt (opponent has no roster)

#### Test 12.5: Home Team Missed Shot
- [ ] Select home team player
- [ ] Click "2PT" (missed)
- [ ] **AUTOMATION**: Block prompt (optional)
- [ ] **AUTOMATION**: Rebound prompt
- [ ] Can select opponent for defensive rebound

#### Test 12.6: Opponent Missed Shot
- [ ] Select opponent
- [ ] Click "2PT" (missed)
- [ ] **AUTOMATION**: Rebound prompt
- [ ] Can select home team player for defensive rebound

#### Test 12.7: Custom Player Stats
- [ ] Select custom player (created manually)
- [ ] Record various stats (2PT, 3PT, REB, etc.)
- [ ] All stats recorded correctly
- [ ] Custom player stats visible in UI
- [ ] Stored in `custom_players` table

#### Test 12.8: Regular Player Stats
- [ ] Select regular player (existing StatJam user)
- [ ] Record various stats
- [ ] Stats recorded in `game_stats` with `player_id`
- [ ] Stats also aggregate to player's profile

#### Test 12.9: Mixed Roster Stats
- [ ] Record stats for both custom and regular players
- [ ] All stats display correctly
- [ ] No conflicts or errors
- [ ] Both types appear in team stats

#### Test 12.10: Opponent Scoring Display
- [ ] Record multiple opponent scores
- [ ] Opponent score displays on right side
- [ ] Opponent stats show in stats panel
- [ ] Team aggregate includes opponent stats

---

### **Section 13: Coach Mode - Advanced Stats** (8 tests)

#### Test 13.1: Home Team Steal
- [ ] Select home team player
- [ ] Click "STL"
- [ ] Steal recorded
- [ ] **AUTOMATION**: Turnover prompt appears
- [ ] Select home team player who turned it over
- [ ] Both steal and turnover recorded

#### Test 13.2: Opponent Steal
- [ ] Select opponent
- [ ] Click "STL"
- [ ] Steal recorded for opponent
- [ ] **AUTOMATION**: Turnover prompt appears
- [ ] Select home team player who turned it over
- [ ] Possession flips to opponent

#### Test 13.3: Home Team Foul (Personal)
- [ ] Select home team player
- [ ] Click "FOUL"
- [ ] Select "Personal Foul"
- [ ] Foul recorded
- [ ] No FT modal
- [ ] Possession flips

#### Test 13.4: Opponent Foul (Personal)
- [ ] Select opponent
- [ ] Click "FOUL"
- [ ] Select "Personal Foul"
- [ ] Foul recorded for opponent
- [ ] Possession flips to home team

#### Test 13.5: Home Team Shooting Foul
- [ ] Select home team player (fouler)
- [ ] Click "FOUL"
- [ ] Select "Shooting Foul - 2PT"
- [ ] Victim selection shows "Opponent Team" (not player list)
- [ ] Select "Opponent Team"
- [ ] FT modal appears
- [ ] Record FTs for opponent

#### Test 13.6: Opponent Shooting Foul
- [ ] Select opponent
- [ ] Click "FOUL"
- [ ] Select "Shooting Foul - 2PT"
- [ ] Victim selection shows home team players
- [ ] Select home team player
- [ ] FT modal appears
- [ ] Record FTs for home team player

#### Test 13.7: Technical Foul (Home Team)
- [ ] Select home team player
- [ ] Click "FOUL"
- [ ] Select "Technical Foul"
- [ ] Victim: Opponent Team
- [ ] FT modal: 1 shot
- [ ] Record FT for opponent
- [ ] **AUTOMATION**: Possession RETAINED by opponent

#### Test 13.8: Technical Foul (Opponent)
- [ ] Select opponent
- [ ] Click "FOUL"
- [ ] Select "Technical Foul"
- [ ] Victim: Select home team player
- [ ] FT modal: 1 shot
- [ ] Record FT for home team
- [ ] **AUTOMATION**: Possession RETAINED by home team

---

### **Section 14: Coach Mode - Clock & Automation** (8 tests)

#### Test 14.1: Clock Automation Always On
- [ ] Verify automation is enabled (no SQL needed)
- [ ] Record foul → Clock auto-pauses
- [ ] Record made shot → Shot clock resets
- [ ] All automation features work

#### Test 14.2: Shot Clock Sync
- [ ] Start game clock
- [ ] Shot clock counts down in sync
- [ ] No desync between clocks
- [ ] Reset shot clock → Syncs with game clock state

#### Test 14.3: Possession Tracking
- [ ] Record made shot → Possession flips
- [ ] Record steal → Possession flips
- [ ] Record rebound → Possession updates
- [ ] Possession indicator accurate

#### Test 14.4: Manual Possession Control
- [ ] Click possession indicator
- [ ] Possession changes manually
- [ ] Change persists
- [ ] Recorded in database

#### Test 14.5: Substitution (Home Team Only)
- [ ] Click "SUB"
- [ ] Shows home team roster only
- [ ] Make substitution
- [ ] Roster updates
- [ ] Opponent section unchanged

#### Test 14.6: Timeout (Home Team)
- [ ] Click "TIME OUT"
- [ ] Select team: Home team
- [ ] Timeout recorded
- [ ] Clock pauses

#### Test 14.7: Team Stats Display
- [ ] Stats panel shows home team stats
- [ ] Player stats scrollable
- [ ] Team aggregates visible
- [ ] Opponent team aggregates visible

#### Test 14.8: Last Action Display
- [ ] Record home team stat → Shows player name
- [ ] Record opponent stat → Shows "Opponent Team"
- [ ] Last action updates correctly

---

### **Section 15: Coach Mode - UI/UX Specific** (7 tests)

#### Test 15.1: Opponent Button Functionality
- [ ] Click "OPPONENT" button
- [ ] Button highlights/selected
- [ ] Can record stats for opponent
- [ ] Click home team player → Opponent deselects

#### Test 15.2: Player Roster Display (Desktop)
- [ ] Home team: 5 players visible on court
- [ ] Bench players in substitution modal
- [ ] Opponent: Single "OPPONENT" button
- [ ] No opponent player list

#### Test 15.3: Player Roster Display (Mobile)
- [ ] Compact view
- [ ] Home team roster visible
- [ ] Opponent button visible
- [ ] All stats accessible

#### Test 15.4: Stats Panel Layout
- [ ] Top: Home team player stats (scrollable)
- [ ] Middle: Home team aggregates
- [ ] Bottom: Opponent team aggregates
- [ ] Labels and values aligned

#### Test 15.5: Possession Indicator
- [ ] Shows home team vs opponent
- [ ] Clickable for manual control
- [ ] Updates automatically
- [ ] Visible in both desktop and mobile

#### Test 15.6: Scoreboard Display
- [ ] Home team name and score (left)
- [ ] Opponent name and score (right)
- [ ] "LIVE" indicator visible
- [ ] Clock and shot clock visible

#### Test 15.7: Back to Dashboard
- [ ] Click "Back to Dashboard"
- [ ] Returns to coach dashboard
- [ ] Not organizer dashboard
- [ ] Game saved and accessible

---

### **Section 16: Coach Mode - Data Integrity** (5 tests)

#### Test 16.1: Custom Player Storage
- [ ] Record stats for custom player
- [ ] Check `custom_players` table
- [ ] Player exists with correct `team_id`
- [ ] Check `game_stats` table
- [ ] Stats have `custom_player_id` (not `player_id`)

#### Test 16.2: Opponent Stats Storage
- [ ] Record opponent stats
- [ ] Check `game_stats` table
- [ ] `is_opponent_stat = true`
- [ ] `player_id` is coach's user ID (proxy)
- [ ] `team_id` is home team ID

#### Test 16.3: Mixed Player Types
- [ ] Record stats for:
  - Regular player (existing user)
  - Custom player
  - Opponent
- [ ] All stored correctly
- [ ] No data conflicts
- [ ] All retrievable

#### Test 16.4: Game Association
- [ ] Check `games` table
- [ ] `tournament_id` is NULL or dummy tournament
- [ ] `team_a_id` is coach's team
- [ ] `team_b_id` is coach's team (placeholder)
- [ ] `stat_admin_id` is coach's user ID

#### Test 16.5: Stats Aggregation
- [ ] End game
- [ ] Check `stats` table
- [ ] Regular players: Stats aggregate to profile
- [ ] Custom players: Stats stored separately
- [ ] Opponent stats: Not in `stats` table

---

## 🔍 CROSS-MODE TESTS (Both Stat Admin & Coach)

### **Section 17: Performance & Stability** (5 tests)

#### Test 17.1: Rapid Stat Recording
- [ ] Record 20+ stats in quick succession
- [ ] No lag or freezing
- [ ] All stats recorded
- [ ] UI remains responsive

#### Test 17.2: Long Game Session
- [ ] Track full 40-minute game
- [ ] No memory leaks
- [ ] No performance degradation
- [ ] All features work at end of game

#### Test 17.3: Network Interruption
- [ ] Disable network mid-game
- [ ] Record stats (should queue)
- [ ] Re-enable network
- [ ] Stats sync to database
- [ ] No data loss

#### Test 17.4: Browser Refresh
- [ ] Record several stats
- [ ] Refresh page
- [ ] Game state restored
- [ ] Score accurate
- [ ] Clock state preserved
- [ ] Possession preserved

#### Test 17.5: Multiple Concurrent Games
- [ ] Start 2-3 games simultaneously (different tabs)
- [ ] Record stats in each
- [ ] No data conflicts
- [ ] Each game independent

---

### **Section 18: Error Handling** (5 tests)

#### Test 18.1: Invalid Player Selection
- [ ] Try to record stat without selecting player
- [ ] Should show error message
- [ ] Stat not recorded

#### Test 18.2: Database Constraint Violations
- [ ] All stats follow database constraints
- [ ] No 400 errors in console
- [ ] Modifiers correct for each stat type

#### Test 18.3: RLS Policy Blocks
- [ ] Try to access unauthorized game
- [ ] Should be blocked with clear message
- [ ] No data leakage

#### Test 18.4: Network Errors
- [ ] Simulate 500 error from server
- [ ] Error message displayed
- [ ] User can retry
- [ ] No app crash

#### Test 18.5: Malformed Data
- [ ] Try to enter invalid values (if manual input exists)
- [ ] Validation prevents submission
- [ ] Clear error messages

---

### **Section 19: Mobile Experience** (5 tests)

#### Test 19.1: Touch Interactions
- [ ] All buttons tappable
- [ ] No accidental double-taps
- [ ] Modals open/close smoothly
- [ ] Scrolling works correctly

#### Test 19.2: Portrait vs Landscape
- [ ] Test in portrait mode
- [ ] Test in landscape mode
- [ ] Layout adapts correctly
- [ ] No content cutoff

#### Test 19.3: Small Screen (iPhone SE)
- [ ] Test on smallest supported device
- [ ] All elements visible
- [ ] Text readable
- [ ] Buttons accessible

#### Test 19.4: Large Screen (iPad)
- [ ] Test on tablet
- [ ] Uses desktop or optimized layout
- [ ] No wasted space
- [ ] Touch targets appropriate size

#### Test 19.5: Keyboard Behavior
- [ ] Input fields trigger keyboard
- [ ] Keyboard doesn't hide important UI
- [ ] Can dismiss keyboard
- [ ] Form submission works

---

### **Section 20: Final Validation** (5 tests)

#### Test 20.1: Complete Game Walkthrough (Stat Admin)
- [ ] Create tournament
- [ ] Add teams and players
- [ ] Create game
- [ ] Track full game with all stat types
- [ ] End game
- [ ] Verify all data in database
- [ ] View in Live Viewer
- [ ] Check player profiles

#### Test 20.2: Complete Game Walkthrough (Coach)
- [ ] Create coach team
- [ ] Add mix of regular and custom players
- [ ] Start Quick Track
- [ ] Track full game
- [ ] Use all automation features
- [ ] End game
- [ ] Verify data integrity

#### Test 20.3: Multi-User Scenario
- [ ] Organizer creates tournament
- [ ] Stat admin tracks game
- [ ] Players view Live Viewer
- [ ] Coach tracks separate game
- [ ] All users see correct data
- [ ] No cross-contamination

#### Test 20.4: Documentation Accuracy
- [ ] Follow setup guide
- [ ] All steps work as documented
- [ ] No missing information
- [ ] Screenshots/examples accurate

#### Test 20.5: Production Readiness
- [ ] No console errors
- [ ] No console warnings (except expected)
- [ ] All features functional
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Data integrity verified

---

## 📊 TEST RESULTS SUMMARY

### **Stat Admin Mode**
- Total Tests: **XXX**
- Passed: **XXX**
- Failed: **XXX**
- Blocked: **XXX**
- Pass Rate: **XX%**

### **Coach Tracker Mode**
- Total Tests: **XXX**
- Passed: **XXX**
- Failed: **XXX**
- Blocked: **XXX**
- Pass Rate: **XX%**

### **Overall MVP Status**
- [ ] All critical features working
- [ ] All automation features working
- [ ] No blocking bugs
- [ ] Performance acceptable
- [ ] Data integrity verified
- [ ] Security validated

**MVP Ready for Production**: ✅ YES / ❌ NO

---

## 🐛 Issues Found

### **Critical Issues** (Blocks MVP)
1. 
2. 
3. 

### **Major Issues** (Impacts UX)
1. 
2. 
3. 

### **Minor Issues** (Polish)
1. 
2. 
3. 

---

## 📝 Notes

- Test Date: _______________
- Tester: _______________
- Environment: Production / Staging / Local
- Browser: _______________
- Device: _______________

---

**Last Updated**: October 29, 2025  
**Version**: 0.15.0  
**Total Tests**: 200+

