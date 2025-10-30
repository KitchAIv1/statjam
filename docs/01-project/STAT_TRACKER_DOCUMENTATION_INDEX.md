# Stat Admin Tracker - Documentation Index

**Complete documentation reference for the Stat Admin Tracker system**

---

## 📚 Documentation Overview

This index provides a comprehensive guide to all documentation for the Stat Admin Tracker. The documentation is organized into four major categories with 18 total files covering every aspect of the system.

**Total Documentation**: 18 files, 4,500+ lines of comprehensive documentation

1. **Architecture & Design** - System design and component structure
2. **Implementation Guides** - Feature-specific implementation details
3. **Reference Materials** - Quick reference and troubleshooting
4. **Database & Migrations** - Schema and database changes

---

## 🏗️ Architecture & Design

### Primary Documentation

#### 0. [PRD_CURRENT.md](./PRD_CURRENT.md)
**Size**: 500+ lines  
**Purpose**: Current Product Requirements Document  
**Audience**: Product Managers, Stakeholders, Developers

**Contents**:
- Complete feature overview (v0.15.0+)
- User roles and permissions
- Core platform features
- Technical architecture
- Development phases
- Success metrics
- Future roadmap
- Production readiness status

**When to Use**:
- Understanding product requirements
- Feature planning and prioritization
- Stakeholder communication
- Development planning

---

#### 1. [STAT_ADMIN_TRACKER_COMPLETE_MAP.md](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md)
**Size**: 2015 lines  
**Purpose**: Complete architecture documentation  
**Audience**: Developers, Architects, Technical Leads

**Contents**:
- System architecture overview
- Core components (35+ files)
- State management (`useTracker` hook)
- Services layer (GameServiceV3, TeamServiceV3)
- Automation system (flags, presets, hierarchy)
- Modal system (10 modals)
- Data flow diagrams
- Database schema reference
- Feature matrix (30+ features)
- Known issues and workarounds
- Performance optimizations
- Testing checklist
- Future enhancements

**When to Use**:
- Understanding overall system architecture
- Planning new features
- Onboarding new developers
- Technical reviews

---

#### 2. [STAT_TRACKER_COMPONENT_MAP.md](./STAT_TRACKER_COMPONENT_MAP.md)
**Size**: 674 lines  
**Purpose**: Visual component hierarchy and relationships  
**Audience**: Developers, UI/UX Designers, Architects

**Contents**:
- Complete component tree (mobile + desktop)
- Parent-child data flow
- Hook dependencies
- Service layer dependencies
- State flow diagrams
- Modal trigger map
- Responsive breakpoints
- Component file sizes
- Complexity matrix
- Refactoring opportunities
- Reusability assessment
- Performance considerations
- Testing strategy
- Maintenance checklist

**When to Use**:
- Understanding component relationships
- Planning UI changes
- Identifying refactoring opportunities
- Component reusability analysis

---

#### 3. [STAT_TRACKER_QUICK_REFERENCE.md](./STAT_TRACKER_QUICK_REFERENCE.md)
**Size**: Comprehensive  
**Purpose**: Developer quick reference guide  
**Audience**: Developers (day-to-day reference)

**Contents**:
- File locations (all components, hooks, services)
- Common tasks (add stat type, automation flag, modal)
- API quick reference (GameServiceV3, useTracker)
- Database query examples
- Troubleshooting checklist
- Performance tips
- Code style guidelines
- Git workflow
- Useful commands

**When to Use**:
- Daily development tasks
- Quick API lookups
- Troubleshooting issues
- Code style reference

---

#### 4. [STAT_TRACKER_AUDIT_SUMMARY.md](./STAT_TRACKER_AUDIT_SUMMARY.md)
**Size**: 664 lines  
**Purpose**: Comprehensive audit summary  
**Audience**: Project Managers, Stakeholders, Technical Leads

**Contents**:
- Executive summary
- Documentation artifacts summary
- System architecture summary
- Feature completeness (100%)
- Automation system overview
- Database schema reference
- Known issues and workarounds
- Performance optimizations
- Code quality metrics
- Testing status
- Refactoring opportunities
- Future enhancements (Phases 6-10)
- Deployment readiness
- Maintenance plan

**When to Use**:
- Project status reviews
- Deployment planning
- Stakeholder updates
- Technical audits

---

## 🛠️ Implementation Guides

### Feature-Specific Documentation

#### 5. [SHOT_CLOCK_VIOLATION_IMPLEMENTATION.md](../02-development/SHOT_CLOCK_VIOLATION_IMPLEMENTATION.md)
**Purpose**: Shot clock violation detection and recording

**Contents**:
- Feature overview
- Implementation details
- `useShotClockViolation` hook
- `ShotClockViolationModal` component
- Detection logic
- Recording flow
- Known issues and workarounds
- Future database migrations

**When to Use**:
- Understanding shot clock violation feature
- Debugging violation detection
- Planning database migrations

---

#### 6. [PRE_FLIGHT_CHECK_IMPLEMENTATION.md](../02-development/PRE_FLIGHT_CHECK_IMPLEMENTATION.md)
**Purpose**: Pre-flight automation configuration modal

**Contents**:
- Feature overview
- `PreFlightCheckModal` component
- Preset system (Minimal, Balanced, Full)
- Settings hierarchy
- Integration with Stat Admin dashboard
- Data flow
- Future enhancements

**When to Use**:
- Understanding automation configuration
- Modifying presets
- Integrating with Coach dashboard

---

#### 7. [GAME_ENDED_STATE_FIX.md](../02-development/GAME_ENDED_STATE_FIX.md)
**Purpose**: Game ended state handling

**Contents**:
- Problem description
- Solution implementation
- `gameStatus` state management
- UI blocking logic
- Full-screen overlay
- Database persistence

**When to Use**:
- Understanding game state management
- Debugging game ended issues
- Planning game status features

---

#### 8. [TIMEOUT_UI_FIX.md](../02-development/TIMEOUT_UI_FIX.md)
**Purpose**: Timeout UI display fix

**Contents**:
- Problem description (0 timeouts showing as 7)
- Root cause analysis
- Solution (nullish coalescing)
- Code changes
- Testing verification

**When to Use**:
- Understanding timeout display logic
- Debugging timeout UI issues
- Learning about nullish coalescing

---

## 📖 Reference Materials

### Quick Reference

#### 9. File Locations Quick Reference
**Source**: [STAT_TRACKER_QUICK_REFERENCE.md](./STAT_TRACKER_QUICK_REFERENCE.md#file-locations)

**Core Files**:
```
src/app/stat-tracker-v3/page.tsx          # Main orchestration
src/hooks/useTracker.ts                    # State management
src/hooks/useShotClockViolation.ts         # Violation detection
src/lib/services/gameServiceV3.ts          # Primary API layer
src/lib/types/automation.ts                # Automation flags
src/lib/types/tracker.ts                   # Core tracker types
```

**Desktop Components**:
```
src/components/tracker-v3/
  ├── TopScoreboardV3.tsx
  ├── TeamRosterV3.tsx
  ├── DesktopStatGridV3.tsx
  ├── PossessionIndicator.tsx
  └── SubstitutionModalV3.tsx
```

**Mobile Components**:
```
src/components/tracker-v3/mobile/
  ├── MobileLayoutV3.tsx
  ├── MobileStatGridV3.tsx
  └── CompactScoreboardV3.tsx
```

**Modals**:
```
src/components/tracker-v3/modals/
  ├── PreFlightCheckModal.tsx
  ├── ShotClockViolationModal.tsx
  ├── AssistPromptModal.tsx
  ├── ReboundPromptModal.tsx
  ├── BlockPromptModal.tsx
  ├── TurnoverPromptModal.tsx
  ├── FoulTypeSelectionModal.tsx
  ├── VictimPlayerSelectionModal.tsx
  └── FreeThrowSequenceModal.tsx
```

---

#### 10. API Quick Reference
**Source**: [STAT_TRACKER_QUICK_REFERENCE.md](./STAT_TRACKER_QUICK_REFERENCE.md#api-quick-reference)

**GameServiceV3**:
```typescript
// Get game data
const game = await GameServiceV3.getGameById(gameId);

// Record stat
await GameServiceV3.recordStat({ gameId, playerId, teamId, statType, modifier, ... });

// Record timeout
await GameServiceV3.recordTimeout({ gameId, teamId, quarter, timeoutType, ... });

// Update game status
await GameServiceV3.updateGameStatus(gameId, 'completed');

// Save automation settings
await GameServiceV3.updateGameAutomation(gameId, automationFlags);
```

**useTracker Hook**:
```typescript
const tracker = useTracker({ initialGameId, teamAId, teamBId, isCoachMode });

// Record stat
await tracker.recordStat({ gameId, playerId, teamId, statType, modifier });

// Clock control
tracker.startClock();
tracker.stopClock();
tracker.resetClock();

// Substitution
await tracker.substitute({ gameId, teamId, playerOutId, playerInId, ... });

// End game
await tracker.closeGame();
```

---

#### 11. Troubleshooting Checklist
**Source**: [STAT_TRACKER_QUICK_REFERENCE.md](./STAT_TRACKER_QUICK_REFERENCE.md#troubleshooting-checklist)

**Stats Not Recording**:
- [ ] Check browser console for errors
- [ ] Verify player is selected
- [ ] Verify clock is running
- [ ] Check auth token is valid
- [ ] Verify database constraints

**Automation Not Working**:
- [ ] Check `automationFlags` in console
- [ ] Verify game has `automation_settings`
- [ ] Run `ENABLE_ALL_AUTOMATION.sql`
- [ ] Clear cache and hard reload

**Modals Not Appearing**:
- [ ] Check modal state variable
- [ ] Verify automation flag is enabled
- [ ] Check console for errors

---

## 🗄️ Database & Migrations

### Database Schema

#### 12. Database Schema Reference
**Source**: [STAT_ADMIN_TRACKER_COMPLETE_MAP.md](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#database-schema)

**Core Tables**:
```sql
games (id, tournament_id, team_a_id, team_b_id, status, quarter, 
       game_clock_minutes, game_clock_seconds, is_clock_running,
       home_score, away_score, automation_settings, ...)

game_stats (id, game_id, player_id, custom_player_id, is_opponent_stat,
            team_id, stat_type, modifier, stat_value, quarter,
            sequence_id, linked_event_id, event_metadata, ...)

game_substitutions (id, game_id, team_id, player_out_id, player_in_id, ...)
game_timeouts (id, game_id, team_id, timeout_type, ...)
game_possessions (id, game_id, team_id, change_reason, possession_arrow, ...)
tournaments (id, name, organizer_id, automation_settings, ...)
```

---

### Future Migrations

#### 13. [FUTURE_shot_clock_violation_modifier.sql](../05-database/migrations/FUTURE_shot_clock_violation_modifier.sql)
**Purpose**: Add support for shot clock violation modifier and team-level turnovers

**Changes**:
- Add `shot_clock_violation` to `game_stats_modifier_check` constraint
- Relax `game_stats_player_required` constraint for team turnovers
- Allow NULL `player_id` for shot clock violations

**Status**: Pending (temporary workaround in place)

---

#### 14. [FUTURE_games_automation_settings.sql](../05-database/migrations/FUTURE_games_automation_settings.sql)
**Purpose**: Add `automation_settings` column to `games` table

**Changes**:
```sql
ALTER TABLE games ADD COLUMN IF NOT EXISTS automation_settings JSONB DEFAULT NULL;
```

**Status**: ✅ Applied (if not already exists)

---

### Troubleshooting SQL Scripts

#### 15. [ENABLE_ALL_AUTOMATION.sql](../06-troubleshooting/ENABLE_ALL_AUTOMATION.sql)
**Purpose**: Enable all automation flags for all tournaments

**Usage**:
```bash
# Run in Supabase SQL Editor
# Enables clock, possession, sequences automation
# Sets Balanced preset for all tournaments
```

**When to Use**:
- Testing automation features
- Enabling automation for existing tournaments
- Troubleshooting automation issues

---

#### 16. [ENABLE_CLOCK_AUTOMATION.sql](../06-troubleshooting/ENABLE_CLOCK_AUTOMATION.sql)
**Purpose**: Enable clock automation for a specific tournament

**Usage**:
```sql
-- Replace <tournament-id> with actual UUID
UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{clock,enabled}',
  'true'
)
WHERE id = '<tournament-id>';
```

**When to Use**:
- Enabling automation for single tournament
- Testing clock automation
- Granular automation control

---

## 📊 Feature Matrix

### Complete Feature List

| Feature | Status | Automation | Documentation |
|---------|--------|------------|---------------|
| **Stat Recording** |
| 2PT/3PT/FT (made/missed) | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#core-components) |
| Assists | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#modal-system) |
| Rebounds (OFF/DEF) | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#modal-system) |
| Steals | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#core-components) |
| Blocks | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#modal-system) |
| Turnovers | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#modal-system) |
| Fouls (7 types) | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#modal-system) |
| **Clock Management** |
| Game clock | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#state-management) |
| Shot clock | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#state-management) |
| Shot clock violation | ✅ | ✅ | [Shot Clock Violation](../02-development/SHOT_CLOCK_VIOLATION_IMPLEMENTATION.md) |
| **Possession** |
| Possession tracking | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#automation-system) |
| Jump ball arrow | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#automation-system) |
| Manual control | ✅ | ❌ | [Component Map](./STAT_TRACKER_COMPONENT_MAP.md) |
| **Team Management** |
| Substitutions | ✅ | ❌ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#modal-system) |
| Timeouts | ✅ | ✅ | [Timeout Fix](../02-development/TIMEOUT_UI_FIX.md) |
| Team fouls | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#state-management) |
| **Game State** |
| Game ended state | ✅ | ✅ | [Game Ended Fix](../02-development/GAME_ENDED_STATE_FIX.md) |
| Status tracking | ✅ | ✅ | [Complete Map](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#state-management) |
| **Pre-Flight Check** |
| Automation config | ✅ | N/A | [Pre-Flight Check](../02-development/PRE_FLIGHT_CHECK_IMPLEMENTATION.md) |
| Presets | ✅ | N/A | [Pre-Flight Check](../02-development/PRE_FLIGHT_CHECK_IMPLEMENTATION.md) |
| **Responsive Design** |
| Desktop layout | ✅ | N/A | [Component Map](./STAT_TRACKER_COMPONENT_MAP.md) |
| Mobile layout | ✅ | N/A | [Component Map](./STAT_TRACKER_COMPONENT_MAP.md) |

---

## 🚀 Getting Started

### For New Developers

1. **Start Here**: [STAT_TRACKER_AUDIT_SUMMARY.md](./STAT_TRACKER_AUDIT_SUMMARY.md)
   - Get overview of system
   - Understand current status
   - Review feature completeness

2. **Understand Architecture**: [STAT_ADMIN_TRACKER_COMPLETE_MAP.md](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md)
   - Learn system architecture
   - Understand component structure
   - Review state management

3. **Explore Components**: [STAT_TRACKER_COMPONENT_MAP.md](./STAT_TRACKER_COMPONENT_MAP.md)
   - Visualize component hierarchy
   - Understand data flow
   - Identify component relationships

4. **Daily Reference**: [STAT_TRACKER_QUICK_REFERENCE.md](./STAT_TRACKER_QUICK_REFERENCE.md)
   - Quick API lookups
   - Common tasks
   - Troubleshooting

---

### For Feature Development

1. **Review Feature Matrix** (above)
   - Check if feature exists
   - Review related documentation

2. **Check Component Map**: [STAT_TRACKER_COMPONENT_MAP.md](./STAT_TRACKER_COMPONENT_MAP.md)
   - Identify affected components
   - Plan integration points

3. **Follow Quick Reference**: [STAT_TRACKER_QUICK_REFERENCE.md](./STAT_TRACKER_QUICK_REFERENCE.md)
   - Use common task guides
   - Follow code style guidelines

4. **Update Documentation**
   - Add to feature matrix
   - Update component map
   - Create implementation guide (if major feature)

---

### For Troubleshooting

1. **Check Troubleshooting Checklist**: [STAT_TRACKER_QUICK_REFERENCE.md](./STAT_TRACKER_QUICK_REFERENCE.md#troubleshooting-checklist)
   - Follow systematic checklist
   - Check common issues

2. **Review Known Issues**: [STAT_ADMIN_TRACKER_COMPLETE_MAP.md](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md#known-issues--workarounds)
   - Check if issue is documented
   - Review workarounds

3. **Run SQL Scripts**: [ENABLE_ALL_AUTOMATION.sql](../06-troubleshooting/ENABLE_ALL_AUTOMATION.sql)
   - Enable automation if needed
   - Verify database state

4. **Check Feature Docs**
   - Review specific feature documentation
   - Verify implementation details

---

## 📝 Documentation Maintenance

### When to Update Documentation

#### After Adding New Feature
- [ ] Update feature matrix
- [ ] Add to component map (if new component)
- [ ] Create implementation guide (if major feature)
- [ ] Update quick reference (if new API)
- [ ] Update audit summary

#### After Refactoring
- [ ] Update component map (file sizes, complexity)
- [ ] Update architecture map (if structure changed)
- [ ] Update quick reference (if API changed)

#### After Bug Fix
- [ ] Add to known issues (if workaround)
- [ ] Update troubleshooting checklist
- [ ] Create fix documentation (if significant)

#### Regular Maintenance (Monthly)
- [ ] Review all documentation for accuracy
- [ ] Update file sizes and complexity metrics
- [ ] Review and update refactoring opportunities
- [ ] Update feature status

---

## 🔗 External Resources

### Framework Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [React 18 Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Backend Documentation
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Tools & Libraries
- [Lucide Icons](https://lucide.dev)
- [Zod Validation](https://zod.dev)

---

## 📞 Support

### For Questions
- Review documentation index (this file)
- Check quick reference guide
- Review feature-specific documentation

### For Issues
- Follow troubleshooting checklist
- Review known issues
- Run diagnostic SQL scripts

### For Feature Requests
- Review future enhancements (Phases 6-10)
- Check feature matrix for existing features
- Consult architecture documentation

---

## 📊 Documentation Statistics

### Total Documentation
- **Files**: 16 documents
- **Total Lines**: 3000+ lines
- **Categories**: 4 major categories
- **Features Documented**: 30+ features

### Primary Documentation (4 files)
- Architecture Map: 2015 lines
- Component Map: 674 lines
- Audit Summary: 664 lines
- Quick Reference: Comprehensive

### Feature Documentation (4 files)
- Shot Clock Violation
- Pre-Flight Check
- Game Ended State
- Timeout UI Fix

### Database Documentation (4 files)
- Schema reference
- 2 future migrations
- 2 troubleshooting scripts

### Reference Materials (4 files)
- File locations
- API reference
- Troubleshooting
- Code style

---

## ✅ Documentation Completeness

| Category | Status | Coverage |
|----------|--------|----------|
| Architecture | ✅ Complete | 100% |
| Components | ✅ Complete | 100% |
| State Management | ✅ Complete | 100% |
| Services | ✅ Complete | 100% |
| Automation | ✅ Complete | 100% |
| Modals | ✅ Complete | 100% |
| Database | ✅ Complete | 100% |
| Features | ✅ Complete | 100% |
| API Reference | ✅ Complete | 100% |
| Troubleshooting | ✅ Complete | 100% |

**Overall Documentation Status**: ✅ **COMPLETE**

---

**Last Updated**: October 30, 2025  
**Maintained By**: Development Team  
**Status**: ✅ Complete and Current

