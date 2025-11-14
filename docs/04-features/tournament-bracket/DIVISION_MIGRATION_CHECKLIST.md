# Division Feature Migration Checklist

## ✅ Migration File Created

**File**: `docs/05-database/migrations/013_tournament_divisions.sql`

**Changes**:
1. ✅ `teams.division` column (TEXT, nullable)
2. ✅ `tournaments.has_divisions` column (BOOLEAN, default FALSE)
3. ✅ `tournaments.division_count` column (INTEGER, nullable)
4. ✅ `tournaments.division_names` column (JSONB, nullable)
5. ✅ Index on `teams(tournament_id, division)` for performance

---

## 📋 Code Updates Required (After Migration)

### 1. TypeScript Types

**File**: `src/lib/types/tournament.ts`

**Updates Needed**:
```typescript
export interface Tournament {
  // ... existing fields ...
  has_divisions?: boolean;        // NEW
  division_count?: number;        // NEW
  division_names?: string[];      // UPDATE (was optional, now with DB backing)
}

export interface Team {
  // ... existing fields ...
  division?: string;              // NEW (was referenced but not in type)
}

export interface TournamentCreateRequest {
  // ... existing fields ...
  has_divisions?: boolean;        // NEW
  division_count?: number;        // NEW
  division_names?: string[];      // NEW
}
```

---

### 2. Tournament Service

**File**: `src/lib/services/tournamentService.ts`

**Updates Needed**:

#### `createTournament()`:
```typescript
const tournamentData = {
  // ... existing fields ...
  has_divisions: data.has_divisions || false,
  division_count: data.has_divisions ? data.division_count : null,
  division_names: data.division_names ? JSON.stringify(data.division_names) : null,
};
```

#### `getTournament()`:
```typescript
// Add to SELECT query:
has_divisions,
division_count,
division_names,

// Map in return:
has_divisions: tournament.has_divisions || false,
division_count: tournament.division_count || undefined,
division_names: tournament.division_names ? JSON.parse(tournament.division_names) : undefined,
```

#### `updateTournament()`:
```typescript
// Add division fields to update data if provided
if (updateData.has_divisions !== undefined) {
  updateData.has_divisions = updateData.has_divisions;
}
if (updateData.division_count !== undefined) {
  updateData.division_count = updateData.division_count;
}
if (updateData.division_names !== undefined) {
  updateData.division_names = JSON.stringify(updateData.division_names);
}
```

---

### 3. Team Service

**File**: `src/lib/services/tournamentService.ts` (TeamService class)

**Updates Needed**:

#### `createTeam()`:
```typescript
// Add division to teamData if provided
const teamData = {
  // ... existing fields ...
  division: data.division || null,  // NEW
};

// Add to SELECT query:
division,

// Map in return:
division: team.division || undefined,
```

#### `getTeamsByTournament()`:
```typescript
// Add to SELECT query:
division,

// Map in return:
division: team.division || undefined,
```

#### `updateTeam()`:
```typescript
// Add division to updates if provided
if (updates.division !== undefined) {
  updateData.division = updates.division;
}
```

---

### 4. Tournament Creation Form

**File**: `src/app/dashboard/create-tournament/page.tsx`

**Updates Needed**:

#### Step 2 (Tournament Setup):
```typescript
// Add to form state:
has_divisions: false,
division_count: undefined,
division_names: undefined,

// Add UI section:
<div style={styles.fieldGroup}>
  <label style={styles.label}>Tournament Structure</label>
  <div style={styles.typeGrid}>
    <div
      style={{
        ...styles.typeOption,
        ...(data.has_divisions === false ? styles.typeOptionSelected : {})
      }}
      onClick={() => updateData('has_divisions', false)}
    >
      <div style={styles.typeOptionTitle}>Single Bracket</div>
      <div style={styles.typeOptionDesc}>All teams compete together</div>
    </div>
    <div
      style={{
        ...styles.typeOption,
        ...(data.has_divisions === true ? styles.typeOptionSelected : {})
      }}
      onClick={() => updateData('has_divisions', true)}
    >
      <div style={styles.typeOptionTitle}>Divisions</div>
      <div style={styles.typeOptionDesc}>Teams compete in groups first</div>
    </div>
  </div>
  
  {data.has_divisions && (
    <>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Number of Divisions</label>
        <select
          value={data.division_count || 2}
          onChange={(e) => updateData('division_count', parseInt(e.target.value))}
          style={styles.select}
        >
          {[2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>{num} Divisions</option>
          ))}
        </select>
      </div>
    </>
  )}
</div>
```

---

### 5. Tournament Form Hook

**File**: `src/lib/hooks/useTournamentForm.ts`

**Updates Needed**:
```typescript
const [state, setState] = useState<TournamentFormState>({
  data: {
    // ... existing fields ...
    has_divisions: false,        // NEW
    division_count: undefined,   // NEW
    division_names: undefined,   // NEW
  },
  // ... rest ...
});
```

---

### 6. Team Creation Modal

**File**: `src/components/shared/TeamCreationModal.tsx`

**Updates Needed**:

#### Add division selector (if tournament has divisions):
```typescript
// Get tournament to check if divisions enabled
const [tournament, setTournament] = useState<Tournament | null>(null);

useEffect(() => {
  const loadTournament = async () => {
    const t = await TournamentService.getTournament(tournamentId);
    setTournament(t);
  };
  loadTournament();
}, [tournamentId]);

// Add to form state:
const [selectedDivision, setSelectedDivision] = useState<string>('');

// Add to form UI (if tournament.has_divisions):
{tournament?.has_divisions && (
  <div className="space-y-1.5">
    <Label>Division</Label>
    <Select
      value={selectedDivision}
      onValueChange={setSelectedDivision}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select division" />
      </SelectTrigger>
      <SelectContent>
        {tournament.division_names?.map((name, idx) => (
          <SelectItem key={idx} value={name}>
            {name}
          </SelectItem>
        )) || 
        Array.from({ length: tournament.division_count || 2 }, (_, i) => 
          String.fromCharCode(65 + i) // A, B, C, etc.
        ).map(div => (
          <SelectItem key={div} value={`Division ${div}`}>
            Division {div}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}

// Update handleCreate to include division:
const newTeam = await TeamService.createTeam({
  name: teamName.trim(),
  coach: coachName.trim() || undefined,
  logo: logoUrl || undefined,
  tournamentId: tournamentId,
  division: selectedDivision || undefined,  // NEW
});
```

---

### 7. Team Management Page

**File**: `src/app/dashboard/tournaments/[id]/teams/page.tsx`

**Updates Needed**:

#### Update Team interface usage:
- Already references `team.division` in display (line 1091)
- Ensure `TeamService.getTeamsByTournament()` includes `division` in SELECT (already planned above)

---

### 8. Bracket Builder

**File**: `src/app/dashboard/tournaments/[id]/schedule/page.tsx`

**Updates Needed**:

#### Filter teams by division:
```typescript
// In BracketBuilderModal:
const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

// Filter teams if division selected:
const availableTeams = selectedDivision
  ? teams.filter(t => t.division === selectedDivision)
  : teams;

// Add division selector UI:
{tournament.has_divisions && (
  <div>
    <Label>Division</Label>
    <Select
      value={selectedDivision || 'all'}
      onValueChange={(val) => setSelectedDivision(val === 'all' ? null : val)}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Divisions (Championship)</SelectItem>
        {tournament.division_names?.map((name, idx) => (
          <SelectItem key={idx} value={name}>{name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

---

## 🎯 Implementation Order

1. ✅ **Migration**: Run `013_tournament_divisions.sql` in Supabase
2. **TypeScript Types**: Update `tournament.ts` interfaces
3. **Tournament Service**: Update CRUD operations
4. **Team Service**: Update CRUD operations
5. **Tournament Form**: Add division UI to Step 2
6. **Team Creation**: Add division selector
7. **Bracket Builder**: Add division filtering
8. **Testing**: Verify division workflow end-to-end

---

## ⚠️ Important Notes

1. **Backward Compatibility**: 
   - All division columns are nullable
   - Existing tournaments default to `has_divisions = false`
   - Existing teams will have `division = NULL`

2. **Data Migration**:
   - No existing data needs migration
   - New tournaments can opt into divisions
   - Existing tournaments continue working without divisions

3. **JSONB Handling**:
   - `division_names` stored as JSONB in DB
   - Parse with `JSON.parse()` when reading
   - Stringify with `JSON.stringify()` when writing

4. **Default Division Names**:
   - If `division_names` is NULL, use auto-generated names: "A", "B", "C", etc.
   - Application logic should handle this fallback

---

## ✅ Verification Steps

After migration and code updates:

1. ✅ Create tournament with divisions enabled
2. ✅ Create teams and assign to divisions
3. ✅ Verify teams show correct division in UI
4. ✅ Generate bracket filtered by division
5. ✅ Verify championship bracket includes all divisions
6. ✅ Test tournament without divisions (backward compatibility)

