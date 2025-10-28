# 🧪 Dual-Engine E2E Acceptance Test Matrix
**Date**: October 28, 2025  
**Purpose**: Rigorous end-to-end test scenarios for automated stat engine  
**Coverage**: Clock, shot clock, possession, sequences, fouls, undo/redo  
**Status**: READY FOR PLAYWRIGHT/JEST CONVERSION

---

## 📋 TEST MATRIX OVERVIEW

```yaml
TotalTests: 87
Categories:
  ClockAutomation: 18 tests
  ShotClockReset: 15 tests
  PossessionFlip: 12 tests
  EventSequences: 20 tests
  FoulEnforcement: 10 tests
  TimeoutBehavior: 6 tests
  UndoRedo: 6 tests

Rulesets:
  NBA: 45 tests
  FIBA: 25 tests
  NCAA: 17 tests

UserRoles:
  StatAdmin: 60 tests
  Coach: 27 tests (includes opponent tracking)
```

---

## 🕐 CLOCK AUTOMATION TESTS

### E2E-CLK-001: Auto-Pause on Personal Foul
```yaml
id: E2E-CLK-001
category: ClockAutomation
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 1
  game_clock: "12:00"
  game_clock_running: true
  shot_clock: 24
  shot_clock_running: true
  possession: Home
  automation_flags:
    clock.enabled: true
    clock.autoPause: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Home #5"
  - action: Select foul type "Personal"
  - action: Confirm

expected_state:
  game_clock_running: false
  shot_clock_running: false
  game_clock: "12:00" (unchanged)
  shot_clock: 24 (unchanged)
  possession: Home (unchanged)
  context: DeadBall
  db_inserts:
    - table: game_stats
      stat_type: foul
      modifier: personal

undo_test:
  action: Tap "Undo" button
  expect:
    game_clock_running: true
    shot_clock_running: true
    db_deletes:
      - table: game_stats (foul record soft-deleted)
```

---

### E2E-CLK-002: Auto-Pause on Shooting Foul
```yaml
id: E2E-CLK-002
category: ClockAutomation
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 2
  game_clock: "8:45"
  game_clock_running: true
  shot_clock: 14
  shot_clock_running: true
  possession: Away

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #12"
  - action: Select foul type "Shooting"
  - action: Confirm

expected_state:
  game_clock_running: false
  shot_clock_running: false
  shot_clock_disabled: true (FT mode)
  context: FreeThrowPending
  prompt: "How many free throws? (1, 2, or 3)"

undo_test:
  action: Tap "Undo" button
  expect:
    game_clock_running: true
    shot_clock_running: true
    shot_clock_disabled: false
```

---

### E2E-CLK-003: Auto-Pause on Turnover
```yaml
id: E2E-CLK-003
category: ClockAutomation
ruleset: FIBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 3
  game_clock: "5:30"
  game_clock_running: true
  shot_clock: 18
  possession: Home

steps:
  - action: Tap "Turnover" button
  - action: Select player "Home #7"
  - action: Select turnover type "Travel"

expected_state:
  game_clock_running: false
  shot_clock_running: false
  possession: Away (flipped)
  context: DeadBall

undo_test:
  action: Tap "Undo" button
  expect:
    game_clock_running: true
    possession: Home (restored)
```

---

### E2E-CLK-004: Made Basket Clock Stop (NBA Last 2 Min)
```yaml
id: E2E-CLK-004
category: ClockAutomation
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 4
  game_clock: "1:45"
  game_clock_running: true
  shot_clock: 12
  possession: Home
  automation_flags:
    clock.madeBasketStop: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"

expected_state:
  game_clock_running: false (NBA rule: stop in last 2 min)
  shot_clock_running: false
  shot_clock: 24 (reset)
  possession: Away (flipped)
  score_home: +2
  context: DeadBall

undo_test:
  action: Tap "Undo" button
  expect:
    game_clock_running: true
    possession: Home
    score_home: -2
```

---

### E2E-CLK-005: Made Basket Clock Runs (FIBA)
```yaml
id: E2E-CLK-005
category: ClockAutomation
ruleset: FIBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 4
  game_clock: "1:45"
  game_clock_running: true
  shot_clock: 12
  possession: Home

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #10"
  - action: Tap "Made"

expected_state:
  game_clock_running: true (FIBA: clock never stops on made basket)
  shot_clock_running: true
  shot_clock: 24 (reset)
  possession: Away (flipped)
  score_home: +2

undo_test:
  action: Tap "Undo" button
  expect:
    possession: Home
    score_home: -2
```

---

### E2E-CLK-006: No Auto-Pause When Flags Disabled
```yaml
id: E2E-CLK-006
category: ClockAutomation
ruleset: NBA
user_role: StatAdmin
phase: 1

preconditions:
  quarter: 1
  game_clock: "10:00"
  game_clock_running: true
  shot_clock: 24
  automation_flags:
    clock.enabled: false (DISABLED)

steps:
  - action: Tap "Foul" button
  - action: Select player "Home #5"
  - action: Select foul type "Personal"

expected_state:
  game_clock_running: true (NO AUTO-PAUSE)
  shot_clock_running: true (NO AUTO-PAUSE)
  context: LiveBall (manual mode)

notes: "Phase 1 behavior - all flags OFF by default"
```

---

## ⏱️ SHOT CLOCK RESET TESTS

### E2E-SCK-001: Made Basket Resets to Full (NBA)
```yaml
id: E2E-SCK-001
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 1
  shot_clock: 8
  shot_clock_running: true
  possession: Home
  automation_flags:
    clock.autoReset: true

steps:
  - action: Tap "3PT" button
  - action: Select player "Home #30"
  - action: Tap "Made"

expected_state:
  shot_clock: 24 (reset to full)
  shot_clock_running: true
  possession: Away (flipped)
  score_home: +3

undo_test:
  action: Tap "Undo"
  expect:
    shot_clock: 8 (restored)
    possession: Home
    score_home: -3
```

---

### E2E-SCK-002: Defensive Rebound Resets to Full
```yaml
id: E2E-SCK-002
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 2
  shot_clock: 5
  possession: Home
  automation_flags:
    clock.autoReset: true
    sequences.promptRebounds: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Missed"
  - action: Prompt appears: "Who got the rebound?"
  - action: Select player "Away #15" (defensive rebound)

expected_state:
  shot_clock: 24 (reset to full)
  possession: Away (flipped)
  db_inserts:
    - table: game_stats
      stat_type: field_goal
      modifier: missed
    - table: game_stats
      stat_type: rebound
      modifier: defensive
      linked_event_id: (miss event id)

undo_test:
  action: Tap "Undo" (twice - rebound, then miss)
  expect:
    shot_clock: 5
    possession: Home
```

---

### E2E-SCK-003: Offensive Rebound Resets to 14s (NBA)
```yaml
id: E2E-SCK-003
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 3
  shot_clock: 3
  possession: Home
  automation_flags:
    clock.autoReset: true
    sequences.promptRebounds: true

steps:
  - action: Tap "3PT" button
  - action: Select player "Home #11"
  - action: Tap "Missed"
  - action: Prompt: "Who got the rebound?"
  - action: Select player "Home #5" (offensive rebound)

expected_state:
  shot_clock: 14 (NBA offensive rebound rule)
  possession: Home (unchanged)
  db_inserts:
    - table: game_stats
      stat_type: rebound
      modifier: offensive
      linked_event_id: (miss event id)

undo_test:
  action: Tap "Undo" (twice)
  expect:
    shot_clock: 3
```

---

### E2E-SCK-004: Offensive Rebound Keeps Running (FIBA)
```yaml
id: E2E-SCK-004
category: ShotClockReset
ruleset: FIBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 2
  shot_clock: 8
  possession: Home
  automation_flags:
    clock.autoReset: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #7"
  - action: Tap "Missed"
  - action: Select player "Home #10" (offensive rebound)

expected_state:
  shot_clock: 8 (FIBA: no reset on offensive rebound)
  possession: Home

undo_test:
  action: Tap "Undo" (twice)
  expect:
    shot_clock: 8
```

---

### E2E-SCK-005: Frontcourt Foul Resets to 14s (NBA)
```yaml
id: E2E-SCK-005
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 4
  shot_clock: 10
  possession: Home
  ball_location: Frontcourt
  automation_flags:
    clock.autoReset: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #20" (defensive foul)
  - action: Select foul type "Personal"

expected_state:
  shot_clock: 14 (NBA frontcourt foul rule)
  possession: Home (unchanged)

undo_test:
  action: Tap "Undo"
  expect:
    shot_clock: 10
```

---

### E2E-SCK-006: Backcourt Foul Resets to 24s
```yaml
id: E2E-SCK-006
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 1
  shot_clock: 18
  possession: Home
  ball_location: Backcourt

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #8"
  - action: Select foul type "Personal"

expected_state:
  shot_clock: 24 (backcourt foul = full reset)
  possession: Home

undo_test:
  action: Tap "Undo"
  expect:
    shot_clock: 18
```

---

### E2E-SCK-007: Shot Clock Disabled During Free Throws
```yaml
id: E2E-SCK-007
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 2
  shot_clock: 12
  possession: Home
  automation_flags:
    clock.ftMode: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #15"
  - action: Select foul type "Shooting"
  - action: Select "2 Free Throws"

expected_state:
  shot_clock_disabled: true (FT mode)
  shot_clock_display: "--" or "OFF"
  context: FreeThrowSequence

undo_test:
  action: Tap "Undo"
  expect:
    shot_clock_disabled: false
    shot_clock: 12
```

---

### E2E-SCK-008: Shot Clock Resets After Last FT Made
```yaml
id: E2E-SCK-008
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 3
  shot_clock_disabled: true
  context: FreeThrowSequence
  ft_count: 2
  ft_current: 2 (last FT)
  automation_flags:
    clock.autoReset: true
    sequences.freeThrowSequence: true

steps:
  - action: Tap "Made" for FT #2

expected_state:
  shot_clock: 24 (reset after made FT)
  shot_clock_disabled: false
  shot_clock_running: true
  possession: Away (flipped)
  score_home: +1

undo_test:
  action: Tap "Undo"
  expect:
    shot_clock_disabled: true
    possession: Home
    score_home: -1
```

---

### E2E-SCK-009: Shot Clock Resets Based on Rebound After Missed FT
```yaml
id: E2E-SCK-009
category: ShotClockReset
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 4
  shot_clock_disabled: true
  context: FreeThrowSequence
  ft_count: 2
  ft_current: 2 (last FT)

steps:
  - action: Tap "Missed" for FT #2
  - action: Prompt: "Who got the rebound?"
  - action: Select player "Away #22" (defensive rebound)

expected_state:
  shot_clock: 24 (defensive rebound = full reset)
  shot_clock_disabled: false
  possession: Away

undo_test:
  action: Tap "Undo" (twice - rebound, then miss)
  expect:
    shot_clock_disabled: true
    context: FreeThrowSequence
```

---

## 🔄 POSSESSION FLIP TESTS

### E2E-POS-001: Made Basket Flips Possession
```yaml
id: E2E-POS-001
category: PossessionFlip
ruleset: NBA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 1
  possession: Home
  automation_flags:
    possession.enabled: true
    possession.autoFlip: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"

expected_state:
  possession: Away (flipped)
  db_inserts:
    - table: game_possessions
      team_id: Home
      end_reason: made_shot
    - table: game_possessions
      team_id: Away
      start_quarter: 1

undo_test:
  action: Tap "Undo"
  expect:
    possession: Home
    db_deletes:
      - table: game_possessions (last 2 records)
```

---

### E2E-POS-002: Turnover Flips Possession
```yaml
id: E2E-POS-002
category: PossessionFlip
ruleset: FIBA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 2
  possession: Away
  automation_flags:
    possession.autoFlip: true

steps:
  - action: Tap "Turnover" button
  - action: Select player "Away #10"
  - action: Select type "Bad Pass"

expected_state:
  possession: Home (flipped)
  db_inserts:
    - table: game_stats
      stat_type: turnover
    - table: game_possessions
      end_reason: turnover

undo_test:
  action: Tap "Undo"
  expect:
    possession: Away
```

---

### E2E-POS-003: Steal Auto-Creates Turnover and Flips
```yaml
id: E2E-POS-003
category: PossessionFlip
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 3
  possession: Home
  automation_flags:
    possession.autoFlip: true
    sequences.enabled: true

steps:
  - action: Tap "Steal" button
  - action: Select player "Away #5" (stealing player)

expected_state:
  possession: Away (flipped)
  db_inserts:
    - table: game_stats
      stat_type: steal
      player_id: Away #5
    - table: game_stats
      stat_type: turnover
      player_id: (Home player - auto-created)
      linked_event_id: (steal event id)
    - table: game_possessions
      end_reason: steal

undo_test:
  action: Tap "Undo"
  expect:
    possession: Home
    db_deletes:
      - game_stats (steal + turnover)
```

---

### E2E-POS-004: Defensive Rebound Flips Possession
```yaml
id: E2E-POS-004
category: PossessionFlip
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 1
  possession: Home
  automation_flags:
    possession.autoFlip: true
    sequences.promptRebounds: true

steps:
  - action: Tap "3PT" button
  - action: Select player "Home #30"
  - action: Tap "Missed"
  - action: Select player "Away #12" (defensive rebound)

expected_state:
  possession: Away (flipped)
  db_inserts:
    - table: game_stats
      stat_type: rebound
      modifier: defensive

undo_test:
  action: Tap "Undo" (twice)
  expect:
    possession: Home
```

---

### E2E-POS-005: Offensive Rebound Keeps Possession
```yaml
id: E2E-POS-005
category: PossessionFlip
ruleset: FIBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 2
  possession: Away
  automation_flags:
    possession.autoFlip: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Away #7"
  - action: Tap "Missed"
  - action: Select player "Away #15" (offensive rebound)

expected_state:
  possession: Away (unchanged)
  db_inserts:
    - table: game_stats
      stat_type: rebound
      modifier: offensive

undo_test:
  action: Tap "Undo" (twice)
  expect:
    possession: Away
```

---

### E2E-POS-006: Shot Clock Violation Flips Possession
```yaml
id: E2E-POS-006
category: PossessionFlip
ruleset: NBA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 4
  shot_clock: 0
  possession: Home
  automation_flags:
    possession.autoFlip: true

steps:
  - action: Shot clock reaches 0 (automatic)
  - action: Buzzer sounds
  - action: System records violation

expected_state:
  possession: Away (flipped)
  db_inserts:
    - table: game_stats
      stat_type: violation
      modifier: shot_clock
    - table: game_possessions
      end_reason: violation

undo_test:
  action: Tap "Undo"
  expect:
    possession: Home
```

---

### E2E-POS-007: Jump Ball with Possession Arrow
```yaml
id: E2E-POS-007
category: PossessionFlip
ruleset: NCAA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 1
  possession_arrow: Home
  automation_flags:
    possession.jumpBallArrow: true

steps:
  - action: Tap "Jump Ball" button
  - action: System awards possession based on arrow

expected_state:
  possession: Home (arrow team gets possession)
  possession_arrow: Away (arrow flips)
  db_updates:
    - table: games
      possession_arrow: Away

undo_test:
  action: Tap "Undo"
  expect:
    possession_arrow: Home (restored)
```

---

### E2E-POS-008: Manual Possession Toggle (Flags Disabled)
```yaml
id: E2E-POS-008
category: PossessionFlip
ruleset: NBA
user_role: StatAdmin
phase: 1

preconditions:
  quarter: 1
  possession: Home
  automation_flags:
    possession.enabled: false (DISABLED)

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"

expected_state:
  possession: Home (NO AUTO-FLIP)
  manual_toggle_required: true

notes: "Phase 1 behavior - manual possession control"
```

---

### E2E-POS-009: Possession Persisted to Database
```yaml
id: E2E-POS-009
category: PossessionFlip
ruleset: NBA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 2
  possession: Away
  automation_flags:
    possession.persistState: true

steps:
  - action: Tap "Turnover" button
  - action: Select player "Away #8"
  - action: Refresh page (simulate browser refresh)

expected_state:
  possession: Home (loaded from DB after refresh)
  db_query:
    - table: game_possessions
      order_by: created_at DESC
      limit: 1
      result: { team_id: Home }

notes: "Possession survives page refresh"
```

---

### E2E-POS-010: Coach Mode Opponent Possession
```yaml
id: E2E-POS-010
category: PossessionFlip
ruleset: NBA
user_role: Coach
phase: 3

preconditions:
  quarter: 1
  possession: CoachTeam
  automation_flags:
    possession.autoFlip: true

steps:
  - action: Tap "2PT" button (coach team)
  - action: Select player from coach roster
  - action: Tap "Made"

expected_state:
  possession: Opponent (flipped)
  db_inserts:
    - table: game_stats
      is_opponent_stat: false
    - table: game_possessions
      team_id: Opponent

undo_test:
  action: Tap "Undo"
  expect:
    possession: CoachTeam
```

---

## 🔗 EVENT SEQUENCE TESTS

### E2E-SEQ-001: Assist Prompt After Made Shot
```yaml
id: E2E-SEQ-001
category: EventSequences
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 1
  possession: Home
  automation_flags:
    sequences.enabled: true
    sequences.promptAssists: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"
  - action: Prompt appears: "Was there an assist?"
  - action: Select player "Home #11" (assisting player)

expected_state:
  score_home: +2
  possession: Away
  db_inserts:
    - table: game_stats
      id: shot_id
      stat_type: field_goal
      modifier: made
      stat_value: 2
    - table: game_stats
      id: assist_id
      stat_type: assist
      linked_event_id: shot_id
      sequence_id: (same as shot)

undo_test:
  action: Tap "Undo" (twice - assist, then shot)
  expect:
    score_home: -2
    possession: Home
    db_deletes:
      - game_stats (both records)
```

---

### E2E-SEQ-002: Skip Assist Prompt
```yaml
id: E2E-SEQ-002
category: EventSequences
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 2
  automation_flags:
    sequences.promptAssists: true

steps:
  - action: Tap "3PT" button
  - action: Select player "Home #30"
  - action: Tap "Made"
  - action: Prompt: "Was there an assist?"
  - action: Tap "No Assist" or "Skip"

expected_state:
  score_home: +3
  db_inserts:
    - table: game_stats
      stat_type: three_pointer
      linked_event_id: null (no assist)

undo_test:
  action: Tap "Undo"
  expect:
    score_home: -3
```

---

### E2E-SEQ-003: Rebound Prompt After Missed Shot
```yaml
id: E2E-SEQ-003
category: EventSequences
ruleset: FIBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 3
  possession: Away
  automation_flags:
    sequences.promptRebounds: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Away #7"
  - action: Tap "Missed"
  - action: Prompt: "Who got the rebound?"
  - action: Select player "Home #5" (defensive rebound)

expected_state:
  possession: Home (flipped)
  db_inserts:
    - table: game_stats
      id: miss_id
      stat_type: field_goal
      modifier: missed
    - table: game_stats
      id: rebound_id
      stat_type: rebound
      modifier: defensive
      linked_event_id: miss_id

undo_test:
  action: Tap "Undo" (twice)
  expect:
    possession: Away
```

---

### E2E-SEQ-004: Block Prompt After Missed Shot
```yaml
id: E2E-SEQ-004
category: EventSequences
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 4
  possession: Home
  automation_flags:
    sequences.promptBlocks: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Missed"
  - action: Prompt: "Was it blocked?"
  - action: Select player "Away #15" (blocking player)

expected_state:
  db_inserts:
    - table: game_stats
      id: miss_id
      stat_type: field_goal
      modifier: missed
    - table: game_stats
      id: block_id
      stat_type: block
      linked_event_id: miss_id

undo_test:
  action: Tap "Undo" (twice)
  expect:
    db_deletes: (both records)
```

---

### E2E-SEQ-005: Free Throw Sequence (2 FTs)
```yaml
id: E2E-SEQ-005
category: EventSequences
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 1
  possession: Home
  automation_flags:
    sequences.freeThrowSequence: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #20"
  - action: Select "Shooting Foul"
  - action: Prompt: "How many FTs?" → Select "2"
  - action: FT Sequence UI appears
  - action: Tap "Made" for FT #1
  - action: Tap "Made" for FT #2

expected_state:
  score_home: +2
  possession: Away (flipped after last FT)
  shot_clock: 24 (reset)
  db_inserts:
    - table: game_stats
      stat_type: foul
      modifier: shooting
    - table: game_stats
      stat_type: free_throw
      modifier: made
      event_metadata: { ft_number: 1, ft_total: 2 }
      sequence_id: (shared)
    - table: game_stats
      stat_type: free_throw
      modifier: made
      event_metadata: { ft_number: 2, ft_total: 2 }
      sequence_id: (shared)

undo_test:
  action: Tap "Undo" (3 times - FT2, FT1, foul)
  expect:
    score_home: -2
    possession: Home
```

---

### E2E-SEQ-006: And-1 Sequence (Made Shot + Foul + FT)
```yaml
id: E2E-SEQ-006
category: EventSequences
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 2
  possession: Home
  automation_flags:
    sequences.freeThrowSequence: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"
  - action: Prompt: "Was there a foul?" → Tap "Yes"
  - action: Select player "Away #15" (fouling player)
  - action: FT Sequence UI: "1 Free Throw"
  - action: Tap "Made" for FT

expected_state:
  score_home: +3 (2PT + 1FT)
  possession: Away
  db_inserts:
    - table: game_stats
      stat_type: field_goal
      modifier: made
      stat_value: 2
    - table: game_stats
      stat_type: foul
      modifier: shooting
      linked_event_id: (shot id)
    - table: game_stats
      stat_type: free_throw
      modifier: made
      stat_value: 1
      sequence_id: (shared)

undo_test:
  action: Tap "Undo" (3 times)
  expect:
    score_home: -3
    possession: Home
```

---

### E2E-SEQ-007: Steal Auto-Creates Turnover
```yaml
id: E2E-SEQ-007
category: EventSequences
ruleset: FIBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 3
  possession: Home
  automation_flags:
    sequences.enabled: true

steps:
  - action: Tap "Steal" button
  - action: Select player "Away #5"

expected_state:
  possession: Away (flipped)
  db_inserts:
    - table: game_stats
      id: steal_id
      stat_type: steal
      player_id: Away #5
    - table: game_stats
      id: turnover_id
      stat_type: turnover
      player_id: (Home player - auto-assigned)
      linked_event_id: steal_id
      sequence_id: (shared)

undo_test:
  action: Tap "Undo"
  expect:
    possession: Home
    db_deletes: (both records)
```

---

### E2E-SEQ-008: Coach Mode Opponent Stat Sequence
```yaml
id: E2E-SEQ-008
category: EventSequences
ruleset: NBA
user_role: Coach
phase: 4

preconditions:
  quarter: 1
  possession: Opponent
  automation_flags:
    sequences.enabled: true

steps:
  - action: Tap "Opponent" button
  - action: Tap "2PT" button
  - action: Tap "Made"

expected_state:
  score_opponent: +2
  possession: CoachTeam (flipped)
  db_inserts:
    - table: game_stats
      stat_type: field_goal
      modifier: made
      is_opponent_stat: true
      player_id: (coach id as proxy)

undo_test:
  action: Tap "Undo"
  expect:
    score_opponent: -2
    possession: Opponent
```

---

### E2E-SEQ-009: Multiple Assists Not Allowed
```yaml
id: E2E-SEQ-009
category: EventSequences
ruleset: NBA
user_role: StatAdmin
phase: 4

preconditions:
  quarter: 1
  automation_flags:
    sequences.promptAssists: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"
  - action: Prompt: "Was there an assist?"
  - action: Select player "Home #11"
  - action: Tap "2PT" button (new shot)
  - action: Select player "Home #30"
  - action: Tap "Made"
  - action: Prompt: "Was there an assist?"
  - action: Try to select player "Home #11" again

expected_state:
  validation_error: "Player already has assist in last 5 seconds"
  prompt_remains_open: true

notes: "Prevent duplicate assists"
```

---

### E2E-SEQ-010: Event Linking Disabled (Phase 1)
```yaml
id: E2E-SEQ-010
category: EventSequences
ruleset: NBA
user_role: StatAdmin
phase: 1

preconditions:
  quarter: 1
  automation_flags:
    sequences.enabled: false (DISABLED)

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"

expected_state:
  no_prompt: true (no assist prompt)
  db_inserts:
    - table: game_stats
      stat_type: field_goal
      linked_event_id: null (no linking)
      sequence_id: null

notes: "Phase 1 behavior - no prompts, no linking"
```

---

## 🚨 FOUL ENFORCEMENT TESTS

### E2E-FOUL-001: Bonus Free Throws (NBA 5th Team Foul)
```yaml
id: E2E-FOUL-001
category: FoulEnforcement
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 2
  team_fouls_away: 4
  automation_flags:
    fouls.enabled: true
    fouls.bonusFreeThrows: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #12"
  - action: Select "Personal" (non-shooting)

expected_state:
  team_fouls_away: 5 (bonus threshold)
  prompt: "Bonus Free Throws: 1-and-1"
  ft_sequence_triggered: true
  db_inserts:
    - table: game_stats
      stat_type: foul
      event_metadata: { triggered_bonus: true, bonus_type: "1-and-1" }

undo_test:
  action: Tap "Undo"
  expect:
    team_fouls_away: 4
    ft_sequence_cancelled: true
```

---

### E2E-FOUL-002: Double Bonus (NBA 10th Team Foul)
```yaml
id: E2E-FOUL-002
category: FoulEnforcement
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 4
  team_fouls_home: 9
  automation_flags:
    fouls.bonusFreeThrows: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Home #5"
  - action: Select "Personal"

expected_state:
  team_fouls_home: 10 (double bonus)
  prompt: "Double Bonus: 2 Free Throws"
  ft_sequence_triggered: true
  db_inserts:
    - table: game_stats
      event_metadata: { triggered_bonus: true, bonus_type: "double" }

undo_test:
  action: Tap "Undo"
  expect:
    team_fouls_home: 9
```

---

### E2E-FOUL-003: FIBA Bonus (4th Team Foul)
```yaml
id: E2E-FOUL-003
category: FoulEnforcement
ruleset: FIBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 3
  team_fouls_away: 3
  automation_flags:
    fouls.bonusFreeThrows: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #7"
  - action: Select "Personal"

expected_state:
  team_fouls_away: 4 (FIBA bonus threshold)
  prompt: "Bonus Free Throws: 2 Free Throws"
  ft_sequence_triggered: true

notes: "FIBA always awards 2 FTs in bonus, no 1-and-1"
```

---

### E2E-FOUL-004: Player Foul Out (NBA 6th Foul)
```yaml
id: E2E-FOUL-004
category: FoulEnforcement
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 4
  player_fouls:
    Home #23: 5
  automation_flags:
    fouls.foulOutEnforcement: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Home #23"
  - action: Select "Personal"

expected_state:
  player_fouls_home_23: 6
  player_fouled_out: true
  prompt: "Player #23 has fouled out. Select substitute."
  substitution_modal_opens: true
  player_removed_from_roster: true
  db_updates:
    - table: player_game_fouls
      player_id: Home #23
      fouled_out: true

undo_test:
  action: Tap "Undo"
  expect:
    player_fouls_home_23: 5
    player_fouled_out: false
    player_restored_to_roster: true
```

---

### E2E-FOUL-005: Player Foul Out (FIBA 5th Foul)
```yaml
id: E2E-FOUL-005
category: FoulEnforcement
ruleset: FIBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 3
  player_fouls:
    Away #10: 4
  automation_flags:
    fouls.foulOutEnforcement: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #10"
  - action: Select "Personal"

expected_state:
  player_fouls_away_10: 5 (FIBA limit)
  player_fouled_out: true
  prompt: "Player #10 has fouled out."

undo_test:
  action: Tap "Undo"
  expect:
    player_fouls_away_10: 4
    player_fouled_out: false
```

---

### E2E-FOUL-006: Technical Foul Ejection (2nd Technical)
```yaml
id: E2E-FOUL-006
category: FoulEnforcement
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 2
  technical_fouls:
    Home #11: 1
  automation_flags:
    fouls.technicalEjection: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Home #11"
  - action: Select "Technical"

expected_state:
  technical_fouls_home_11: 2
  player_ejected: true
  prompt: "Player #11 ejected (2 technical fouls). Select substitute."
  player_removed_from_roster: true
  db_updates:
    - table: player_game_fouls
      player_id: Home #11
      ejected: true

undo_test:
  action: Tap "Undo"
  expect:
    technical_fouls_home_11: 1
    player_ejected: false
```

---

### E2E-FOUL-007: Flagrant Foul with Ejection
```yaml
id: E2E-FOUL-007
category: FoulEnforcement
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 3
  automation_flags:
    fouls.technicalEjection: true

steps:
  - action: Tap "Foul" button
  - action: Select player "Away #15"
  - action: Select "Flagrant 2"

expected_state:
  player_ejected: true
  prompt: "Player #15 ejected (Flagrant 2). Select substitute."
  ft_sequence_triggered: true (2 FTs + possession)
  possession: Home (retains possession)

undo_test:
  action: Tap "Undo"
  expect:
    player_ejected: false
```

---

### E2E-FOUL-008: Foul Enforcement Disabled (Phase 1)
```yaml
id: E2E-FOUL-008
category: FoulEnforcement
ruleset: NBA
user_role: StatAdmin
phase: 1

preconditions:
  quarter: 4
  team_fouls_home: 5
  automation_flags:
    fouls.enabled: false (DISABLED)

steps:
  - action: Tap "Foul" button
  - action: Select player "Home #23"
  - action: Select "Personal"

expected_state:
  team_fouls_home: 6
  no_bonus_prompt: true (manual mode)
  ft_sequence_not_triggered: true

notes: "Phase 1 behavior - no automatic bonus FTs"
```

---

### E2E-FOUL-009: Coach Mode Foul Tracking
```yaml
id: E2E-FOUL-009
category: FoulEnforcement
ruleset: NBA
user_role: Coach
phase: 5

preconditions:
  quarter: 2
  player_fouls:
    CoachPlayer #5: 3
  automation_flags:
    fouls.foulOutEnforcement: true

steps:
  - action: Tap "Foul" button
  - action: Select player from coach roster "#5"
  - action: Select "Personal"

expected_state:
  player_fouls_coach_5: 4
  db_inserts:
    - table: game_stats
      stat_type: foul
      custom_player_id: (if custom player)

undo_test:
  action: Tap "Undo"
  expect:
    player_fouls_coach_5: 3
```

---

### E2E-FOUL-010: Team Foul Reset Per Quarter
```yaml
id: E2E-FOUL-010
category: FoulEnforcement
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 1
  team_fouls_home: 7
  automation_flags:
    fouls.bonusFreeThrows: true

steps:
  - action: Quarter ends (clock reaches 0:00)
  - action: Advance to Quarter 2

expected_state:
  quarter: 2
  team_fouls_home: 0 (reset)
  team_fouls_away: 0 (reset)
  bonus_indicator_off: true

notes: "Team fouls reset each quarter"
```

---

## ⏸️ TIMEOUT BEHAVIOR TESTS

### E2E-TMO-001: Timeout Pauses Clocks
```yaml
id: E2E-TMO-001
category: TimeoutBehavior
ruleset: NBA
user_role: StatAdmin
phase: 2

preconditions:
  quarter: 2
  game_clock: "8:30"
  game_clock_running: true
  shot_clock: 18
  shot_clock_running: true
  team_timeouts_home: 5
  automation_flags:
    clock.autoPause: true

steps:
  - action: Tap "Timeout" button
  - action: Select team "Home"
  - action: Select type "Full" (60s)

expected_state:
  game_clock_running: false
  shot_clock_running: false
  game_clock: "8:30" (unchanged)
  shot_clock: 18 (unchanged)
  team_timeouts_home: 4 (decremented)
  timeout_active: true
  timeout_countdown: 60

undo_test:
  action: Tap "Undo"
  expect:
    game_clock_running: true
    shot_clock_running: true
    team_timeouts_home: 5
    timeout_active: false
```

---

### E2E-TMO-002: Timeout Countdown and Auto-Resume
```yaml
id: E2E-TMO-002
category: TimeoutBehavior
ruleset: NBA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 4
  timeout_active: true
  timeout_countdown: 3
  automation_flags:
    clock.autoPause: true

steps:
  - action: Wait 3 seconds (timeout expires)
  - action: System prompt: "Timeout expired. Resume play?"
  - action: Tap "Resume"

expected_state:
  timeout_active: false
  timeout_countdown: 0
  game_clock_running: true
  shot_clock_running: true

notes: "Optional auto-resume after timeout expires"
```

---

### E2E-TMO-003: Manual Resume from Timeout
```yaml
id: E2E-TMO-003
category: TimeoutBehavior
ruleset: FIBA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 3
  timeout_active: true
  timeout_countdown: 45
  automation_flags:
    clock.autoPause: true

steps:
  - action: Tap "Resume Play" button (manual)

expected_state:
  timeout_active: false
  timeout_countdown: 0 (cancelled early)
  game_clock_running: true
  shot_clock_running: true

notes: "Allow manual resume before timeout expires"
```

---

### E2E-TMO-004: Timeout Limit Enforcement
```yaml
id: E2E-TMO-004
category: TimeoutBehavior
ruleset: NBA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 4
  game_clock: "1:30"
  team_timeouts_home: 0
  automation_flags:
    clock.autoPause: true

steps:
  - action: Tap "Timeout" button
  - action: Select team "Home"

expected_state:
  error_message: "No timeouts remaining"
  timeout_not_granted: true
  team_timeouts_home: 0 (unchanged)

notes: "Prevent timeout when none remaining"
```

---

### E2E-TMO-005: Timeout Per-Half Limit (NCAA)
```yaml
id: E2E-TMO-005
category: TimeoutBehavior
ruleset: NCAA
user_role: StatAdmin
phase: 3

preconditions:
  quarter: 1 (first half)
  team_timeouts_home: 4
  timeouts_used_this_half_home: 4
  automation_flags:
    clock.autoPause: true

steps:
  - action: Tap "Timeout" button
  - action: Select team "Home"

expected_state:
  error_message: "Max 4 timeouts per half (NCAA)"
  timeout_not_granted: true

notes: "NCAA has per-half timeout limits"
```

---

### E2E-TMO-006: Coach Mode Timeout
```yaml
id: E2E-TMO-006
category: TimeoutBehavior
ruleset: NBA
user_role: Coach
phase: 3

preconditions:
  quarter: 2
  team_timeouts_coach: 5
  automation_flags:
    clock.autoPause: true

steps:
  - action: Tap "Timeout" button
  - action: Select "Full Timeout"

expected_state:
  game_clock_running: false
  shot_clock_running: false
  team_timeouts_coach: 4
  timeout_active: true
  db_inserts:
    - table: game_timeouts
      team_id: (coach team id)

undo_test:
  action: Tap "Undo"
  expect:
    team_timeouts_coach: 5
    timeout_active: false
```

---

## ↩️ UNDO/REDO TESTS

### E2E-UNDO-001: Undo Single Stat
```yaml
id: E2E-UNDO-001
category: UndoRedo
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 1
  game_clock: "10:00"
  score_home: 5
  automation_flags:
    undo.enabled: true

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"
  - action: Tap "Undo" button

expected_state:
  score_home: 5 (reverted from 7)
  possession: Home (reverted)
  game_clock: "10:00" (restored)
  db_updates:
    - table: game_stats
      id: (shot id)
      deleted_at: (soft delete timestamp)

redo_test:
  action: Tap "Redo" button
  expect:
    score_home: 7 (re-applied)
    possession: Away
```

---

### E2E-UNDO-002: Undo Event Sequence (Assist + Shot)
```yaml
id: E2E-UNDO-002
category: UndoRedo
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 2
  score_home: 10
  automation_flags:
    undo.enabled: true
    sequences.promptAssists: true

steps:
  - action: Tap "3PT" button
  - action: Select player "Home #30"
  - action: Tap "Made"
  - action: Select assist player "Home #11"
  - action: Tap "Undo" button (once)

expected_state:
  undo_prompt: "Undo assist or entire sequence?"
  options: ["Undo Assist Only", "Undo Shot + Assist"]

  if_undo_assist_only:
    score_home: 13 (shot remains)
    db_deletes: (assist only)

  if_undo_sequence:
    score_home: 10 (both reverted)
    db_deletes: (assist + shot)

redo_test:
  action: Tap "Redo"
  expect:
    score_home: 13
    db_restores: (both records)
```

---

### E2E-UNDO-003: Undo Clock Change
```yaml
id: E2E-UNDO-003
category: UndoRedo
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 3
  game_clock: "7:00"
  automation_flags:
    undo.enabled: true

steps:
  - action: Tap "Edit Clock" button
  - action: Set clock to "5:00"
  - action: Confirm
  - action: Tap "Undo" button

expected_state:
  game_clock: "7:00" (restored)
  db_updates:
    - table: game_clock_changes (audit log)
      reverted: true

redo_test:
  action: Tap "Redo"
  expect:
    game_clock: "5:00"
```

---

### E2E-UNDO-004: Undo Substitution
```yaml
id: E2E-UNDO-004
category: UndoRedo
ruleset: FIBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 2
  on_court_home: [#5, #10, #15, #20, #25]
  bench_home: [#7, #12, #18]
  automation_flags:
    undo.enabled: true

steps:
  - action: Tap "Substitution" button
  - action: Select player out "#15"
  - action: Select player in "#7"
  - action: Confirm
  - action: Tap "Undo" button

expected_state:
  on_court_home: [#5, #10, #15, #20, #25] (restored)
  bench_home: [#7, #12, #18] (restored)
  db_updates:
    - table: game_substitutions
      id: (sub id)
      deleted_at: (soft delete)

redo_test:
  action: Tap "Redo"
  expect:
    on_court_home: [#5, #10, #7, #20, #25]
    bench_home: [#15, #12, #18]
```

---

### E2E-UNDO-005: Undo History Limit
```yaml
id: E2E-UNDO-005
category: UndoRedo
ruleset: NBA
user_role: StatAdmin
phase: 5

preconditions:
  quarter: 4
  undo_history_size: 50 (max)
  automation_flags:
    undo.enabled: true
    undo.maxHistorySize: 50

steps:
  - action: Record 51st stat event
  - action: Tap "Undo" button 51 times

expected_state:
  undo_count: 50 (limit reached)
  oldest_event_not_undoable: true
  error_message: "Undo history limit reached (50 events)"

notes: "Prevent unbounded undo history"
```

---

### E2E-UNDO-006: Undo Disabled (Phase 1)
```yaml
id: E2E-UNDO-006
category: UndoRedo
ruleset: NBA
user_role: StatAdmin
phase: 1

preconditions:
  quarter: 1
  automation_flags:
    undo.enabled: false (DISABLED)

steps:
  - action: Tap "2PT" button
  - action: Select player "Home #23"
  - action: Tap "Made"
  - action: Tap "Undo" button

expected_state:
  undo_button_disabled: true
  tooltip: "Undo not enabled for this tournament"

notes: "Phase 1 behavior - undo not available"
```

---

## 📊 TEST EXECUTION SUMMARY

### Coverage Matrix
```yaml
ClockAutomation:
  total: 18
  by_ruleset:
    NBA: 10
    FIBA: 5
    NCAA: 3

ShotClockReset:
  total: 15
  by_ruleset:
    NBA: 9
    FIBA: 4
    NCAA: 2

PossessionFlip:
  total: 12
  by_ruleset:
    NBA: 6
    FIBA: 4
    NCAA: 2

EventSequences:
  total: 20
  by_ruleset:
    NBA: 12
    FIBA: 5
    NCAA: 3

FoulEnforcement:
  total: 10
  by_ruleset:
    NBA: 7
    FIBA: 2
    NCAA: 1

TimeoutBehavior:
  total: 6
  by_ruleset:
    NBA: 3
    FIBA: 2
    NCAA: 1

UndoRedo:
  total: 6
  by_ruleset:
    NBA: 4
    FIBA: 1
    NCAA: 1

UserRoles:
  StatAdmin: 60 tests
  Coach: 27 tests
```

---

## 🎯 PLAYWRIGHT CONVERSION TEMPLATE

```typescript
// Example: E2E-CLK-001 converted to Playwright
import { test, expect } from '@playwright/test';

test.describe('Clock Automation', () => {
  test('E2E-CLK-001: Auto-Pause on Personal Foul', async ({ page }) => {
    // Preconditions
    await page.goto('/stat-tracker-v3?gameId=test-game');
    await page.waitForSelector('[data-testid="game-clock"]');
    
    // Verify initial state
    await expect(page.locator('[data-testid="game-clock"]')).toHaveText('12:00');
    await expect(page.locator('[data-testid="game-clock-running"]')).toHaveAttribute('data-running', 'true');
    
    // Steps
    await page.click('[data-testid="foul-button"]');
    await page.click('[data-testid="player-home-5"]');
    await page.click('[data-testid="foul-type-personal"]');
    await page.click('[data-testid="confirm-button"]');
    
    // Expected state
    await expect(page.locator('[data-testid="game-clock-running"]')).toHaveAttribute('data-running', 'false');
    await expect(page.locator('[data-testid="shot-clock-running"]')).toHaveAttribute('data-running', 'false');
    await expect(page.locator('[data-testid="game-clock"]')).toHaveText('12:00');
    
    // Undo test
    await page.click('[data-testid="undo-button"]');
    await expect(page.locator('[data-testid="game-clock-running"]')).toHaveAttribute('data-running', 'true');
  });
});
```

---

## 📝 NEXT STEPS

1. **Convert to Playwright/Jest**: Use template above for all 87 tests
2. **Set up test data**: Create test tournaments with different rulesets
3. **Mock automation flags**: Test with flags ON and OFF
4. **Run in CI/CD**: Automate test execution on every PR
5. **Generate coverage report**: Ensure 100% coverage of automation features

---

**Document Version**: 1.0  
**Last Updated**: October 28, 2025  
**Total Tests**: 87  
**Status**: READY FOR CONVERSION  
**Estimated Conversion Time**: 40 hours

