# 🏆 Tournament Photo/Avatar Implementation - Comprehensive Audit

**Date**: November 10, 2025  
**Status**: 🔍 AUDIT PHASE  
**Goal**: Add photo/logo upload to tournaments (creation + edit)

---

## 📊 CURRENT STATE VERIFICATION

### 1. Database Schema Check

**Run this SQL in Supabase to verify current tournament schema:**

```sql
-- ============================================================================
-- TOURNAMENT TABLE SCHEMA VERIFICATION
-- ============================================================================

-- Check all columns in tournaments table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tournaments'
ORDER BY ordinal_position;

-- Check for any existing logo/image/photo columns
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tournaments'
AND (
  column_name LIKE '%logo%' OR 
  column_name LIKE '%image%' OR 
  column_name LIKE '%photo%' OR
  column_name LIKE '%avatar%'
);

-- Verify Supabase Storage buckets
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('tournament-images', 'tournament-logos', 'profile-images');
```

**Expected Columns to ADD:**
- `logo_url` (TEXT) - Tournament logo/avatar image URL from Supabase Storage

---

## 🗂️ COMPONENT ARCHITECTURE MAP

### Tournament Display Locations

```
📦 Tournament Photo Display Points:

1️⃣ Organizer Dashboard (src/components/OrganizerTournamentManager.tsx)
   ├─ TournamentCard Component (line 73-261)
   │  ├─ Current: Trophy icon hardcoded (line 89-91)
   │  └─ Target: Show logo if exists, fallback to Trophy

2️⃣ Tournament Creation Page (src/app/dashboard/create-tournament/page.tsx)
   ├─ Step 1: Basic Info (line 387-471)
   │  ├─ Current: Name, Description, Venue, Country
   │  └─ Target: Add PhotoUploadField for logo

3️⃣ Tournament Settings/Edit Modal (src/components/OrganizerTournamentManager.tsx)
   ├─ Settings Modal (line 553-721)
   │  └─ Target: Add PhotoUploadField for logo edit

4️⃣ Tournament Public View (src/components/TournamentPage.tsx)
   ├─ Header display
   └─ Target: Show logo in header

5️⃣ Coach Tournament List (src/app/dashboard/coach/tournaments/page.tsx)
   └─ Tournament cards display
```

---

## 🔧 EXISTING INFRASTRUCTURE (Ready to Reuse)

### Photo Upload Components

✅ **PhotoUploadField** (`src/components/ui/PhotoUploadField.tsx`)
```typescript
interface PhotoUploadFieldProps {
  label: string;
  value: string | null;
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
  disabled?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  className?: string;
}
```

✅ **usePhotoUpload Hook** (`src/hooks/usePhotoUpload.ts`)
```typescript
interface UsePhotoUploadOptions {
  userId: string;
  photoType: 'profile' | 'pose';  // ⚠️ NEEDS: 'tournament_logo'
  currentPhotoUrl?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}
```

✅ **imageUploadService** (`src/lib/services/imageUploadService.ts`)
- Already has: `uploadPlayerPhoto()`, `deletePlayerPhoto()`
- **NEEDS**: `uploadTournamentLogo()`, `deleteTournamentLogo()`

---

## 📸 TOURNAMENT PHOTO SPECIFICATIONS

### Visual Requirements

```typescript
Tournament Logo/Avatar Specs:
├─ Aspect Ratio: Square (1:1) - matches profile photos
├─ Min Size: 256x256px
├─ Max Size: 2048x2048px
├─ Max File Size: 5MB
├─ Formats: JPG, PNG, WebP
├─ Compression: Auto (via compressImage function)
└─ Storage: Supabase 'tournament-images' bucket
```

### Display Locations

| Location | Size | Fallback |
|----------|------|----------|
| Tournament Card (Dashboard) | 48x48px | Trophy icon + gradient |
| Tournament Header (Detail) | 96x96px | Trophy icon + gradient |
| Tournament List (Mobile) | 40x40px | Trophy icon + gradient |
| Create/Edit Modal Preview | 128x128px | Upload placeholder |

---

## 🛠️ IMPLEMENTATION PLAN

### Phase 1: Database Setup

```sql
-- ============================================================================
-- MIGRATION: Add Tournament Logo Support
-- ============================================================================

-- Step 1: Add logo_url column to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN tournaments.logo_url IS 'Tournament logo image URL from Supabase Storage';

-- Step 2: Create tournament-images storage bucket (run in Supabase dashboard)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tournament-images', 'tournament-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Storage policies for tournament images
CREATE POLICY "Public read tournament images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'tournament-images');

CREATE POLICY "Organizers upload tournament images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'tournament-images' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'organizer'
  )
);

CREATE POLICY "Organizers update own tournament images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'tournament-images' AND
  auth.uid() IN (
    SELECT organizer_id FROM tournaments 
    WHERE logo_url LIKE '%' || name || '%'
  )
);

CREATE POLICY "Organizers delete own tournament images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'tournament-images' AND
  auth.uid() IN (
    SELECT organizer_id FROM tournaments 
    WHERE logo_url LIKE '%' || name || '%'
  )
);
```

### Phase 2: Service Layer

**Update: `src/lib/services/imageUploadService.ts`**
```typescript
// Add new function
export async function uploadTournamentLogo(
  file: File,
  tournamentId: string,
  organizerId: string
): Promise<ImageUploadResult> {
  return uploadImage({
    file,
    bucket: 'tournament-images',
    folder: organizerId, // Organize by organizer
    filePrefix: `tournament-${tournamentId}`,
    maxSizeKB: 5120, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  });
}

export async function deleteTournamentLogo(publicUrl: string): Promise<void> {
  const filePath = extractFilePathFromUrl(publicUrl, 'tournament-images');
  if (filePath) {
    await deleteImage('tournament-images', filePath);
  }
}
```

**Update: `src/hooks/usePhotoUpload.ts`**
```typescript
// Extend photoType union
photoType: 'profile' | 'pose' | 'tournament_logo';

// Update uploadImage logic
if (photoType === 'tournament_logo') {
  result = await uploadTournamentLogo(file, userId, userId);
}
```

### Phase 3: UI Components

**Update: `src/app/dashboard/create-tournament/page.tsx`**
```typescript
// Add to Step 1 (Basic Info) around line 405
<div style={styles.fieldGroup}>
  <label style={styles.label}>Tournament Logo (Optional)</label>
  <PhotoUploadField
    label="Upload Logo"
    value={data.logoUrl || null}
    previewUrl={logoPreview}
    uploading={logoUploading}
    error={logoError}
    aspectRatio="square"
    onFileSelect={handleLogoUpload}
    onRemove={handleLogoRemove}
  />
  <span style={styles.helpText}>
    Square image recommended (min 256x256px, max 5MB)
  </span>
</div>
```

**Update: `src/components/OrganizerTournamentManager.tsx`**
```typescript
// TournamentCard component (line 89-91)
// REPLACE Trophy icon with:
<div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
  {tournament.logoUrl ? (
    <img 
      src={tournament.logoUrl} 
      alt={`${tournament.name} logo`} 
      className="w-full h-full object-cover rounded-xl"
    />
  ) : (
    <Trophy className="w-6 h-6 text-white" />
  )}
</div>
```

### Phase 4: Types Update

**Update: `src/lib/types/tournament.ts`**
```typescript
export interface Tournament {
  // ... existing fields
  logoUrl?: string; // Add this
}

export interface TournamentCreateRequest {
  // ... existing fields
  logoUrl?: string; // Add this
}
```

---

## ✅ SUCCESS CRITERIA

- [ ] Database column `tournaments.logo_url` added
- [ ] Supabase bucket `tournament-images` created with policies
- [ ] `uploadTournamentLogo()` service function working
- [ ] Photo upload in create-tournament Step 1
- [ ] Photo edit in settings modal
- [ ] Logo displays in tournament cards
- [ ] Logo displays in tournament detail page
- [ ] Fallback to Trophy icon when no logo
- [ ] Image compression working (< 500KB after upload)
- [ ] Old logo cleanup on new upload
- [ ] Mobile responsive upload UI

---

## 🎯 NEXT STEPS (User to Confirm)

1. **Run SQL verification** - Verify tournament schema
2. **Confirm display locations** - Which views need logo display?
3. **Approve implementation plan** - Review phases above
4. **Execute migration** - Add database column + storage bucket

**Ready to proceed?** 🚀

