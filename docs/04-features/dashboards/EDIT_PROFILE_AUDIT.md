# 🏀 EDIT PROFILE COMPONENT - COMPREHENSIVE AUDIT

**Date**: November 5, 2025  
**Last Updated**: January 2025  
**Component**: `EditProfileModal.tsx`  
**Location**: `src/components/EditProfileModal.tsx`  
**Status**: ✅ **ALL ISSUES RESOLVED**

---

## ✅ COMPLETION STATUS

### Issues Resolved:
1. ✅ **HEIGHT INPUT** - Replaced with dual-input system (feet + inches) - **COMPLETE**
2. ✅ **JERSEY NUMBER** - Removed maxLength, increased range to 0-999 - **COMPLETE**
3. ✅ **PHOTO UPLOAD** - Migrated to Supabase Storage with reusable components - **COMPLETE**

### Implementation Details:
- **Height Input**: Dual number inputs (feet: 4-7, inches: 0-11) with auto-formatting
- **Jersey Number**: Type="number" input with min=0, max=999, validation updated
- **Photo Upload**: Complete Supabase Storage integration with `PhotoUploadField` component, `usePhotoUpload` hook, and `imageUploadService`
- **Profile Data Pre-population**: Existing data now displays correctly in edit modal
- **Instant Updates**: Photos update immediately on dashboard after save without refresh

See: [Photo Upload System Documentation](/docs/04-features/shared/PHOTO_UPLOAD_SYSTEM.md)

---

## 📋 EXECUTIVE SUMMARY

### Original Issues (All Resolved):
1. ❌ **HEIGHT INPUT** - Strict text input requiring manual formatting (user-unfriendly) → ✅ **FIXED**
2. ⚠️ **JERSEY NUMBER** - Too restrictive (`maxLength={2}` prevents 3-digit numbers) → ✅ **FIXED**
3. ❌ **PHOTO UPLOAD** - Using base64/DataURL instead of Supabase Storage (inefficient) → ✅ **FIXED**

---

## 🔍 DETAILED FINDINGS

### 1. HEIGHT INPUT ISSUE ❌ CRITICAL

**Current Implementation:**
```typescript
<Input
  id="height"
  value={formData.height}
  onChange={(e) => handleInputChange('height', e.target.value)}
  placeholder="e.g., 6'8\""  // Plain text input
  className="bg-input-background"
/>
```

**Validation Logic:**
- File: `src/lib/validation/profileValidation.ts`
- Expects: Either numeric inches (e.g., "74") OR feet'inches" format (e.g., "6'2\"")
- Range: 4'0" (48 inches) to 8'0" (96 inches)

**Problems:**
1. Users must manually type `'` and `"` symbols
2. No visual guidance on format
3. Error-prone input (easy to miss quotes)
4. Not mobile-friendly
5. Validation doesn't accept "6'2" (without closing quote)

**User Experience Impact:**
- 🔴 **High friction** - Users struggle with format
- 🔴 **Validation errors** - Common for users to type "6 feet 2 inches" or "6-2"
- 🔴 **Mobile keyboard** - Hard to find `'` and `"` symbols

**Recommended Solution:**
Replace with a **dual-input system**:
```typescript
// Separate inputs for feet and inches
<div className="flex gap-2">
  <Input 
    type="number" 
    placeholder="Feet" 
    min={4} 
    max={7}
    value={heightFeet}
  />
  <span>′</span>
  <Input 
    type="number" 
    placeholder="Inches" 
    min={0} 
    max={11}
    value={heightInches}
  />
  <span>″</span>
</div>
// Backend conversion: (feet * 12) + inches
```

**OR** a dropdown approach:
```typescript
<Select>
  <SelectItem value="60">5'0"</SelectItem>
  <SelectItem value="61">5'1"</SelectItem>
  // ... up to 8'0"
</Select>
```

---

### 2. JERSEY NUMBER RESTRICTION ⚠️ MEDIUM

**Current Implementation:**
```typescript
<Input
  id="jersey"
  value={formData.jerseyNumber}
  onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
  maxLength={2}  // ❌ TOO RESTRICTIVE
  placeholder="Enter jersey number"
/>
```

**Validation Logic:**
- Range: 0-99
- Type: Integer
- Database: Need to verify no unique constraint exists

**Problems:**
1. `maxLength={2}` prevents entering 3-digit numbers
2. Validation allows 0-99 only (NBA allows 00-99, some leagues allow 000-999)
3. Cannot enter numbers like "100", "000"

**Current Behavior:**
- ✅ Allows duplicates (good - no unique constraint in validation)
- ❌ Restricts to 2 characters (bad - too limiting)
- ⚠️ Need to verify database schema doesn't have UNIQUE constraint

**Recommended Solution:**
```typescript
<Input
  id="jersey"
  type="number"  // Better than text for jersey numbers
  value={formData.jerseyNumber}
  onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
  min={0}
  max={999}  // Allow up to 3 digits
  // Remove maxLength prop
  placeholder="0-999"
/>
```

**Validation Update:**
```typescript
// Update PROFILE_LIMITS in profileValidation.ts
jerseyNumber: {
  min: 0,
  max: 999,  // Change from 99 to 999
}
```

---

### 3. PHOTO UPLOAD IMPLEMENTATION ❌ CRITICAL

**Current Implementation:**
```typescript
const handlePhotoUpload = (type: 'profile' | 'pose', event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;  // ❌ BASE64 STRING
      if (type === 'profile') {
        setPreviewProfilePhoto(result);
        handleInputChange('profilePhoto', result);  // ❌ STORING BASE64
      } else {
        setPreviewPosePhoto(result);
        handleInputChange('posePhoto', result);
      }
    };
    reader.readAsDataURL(file);  // ❌ CONVERTS TO BASE64
  }
};
```

**Database Storage:**
```typescript
// In PlayerDashboard.tsx
const updateData = {
  profile_photo_url: updatedData.profilePhoto || null,  // ❌ BASE64 STRING
  pose_photo_url: updatedData.posePhoto || null,        // ❌ BASE64 STRING
};
```

**Problems:**
1. ❌ **NOT using Supabase Storage** (per user's architecture preference)
2. ❌ **Base64 in database** - Extremely inefficient:
   - 1MB image → ~1.3MB base64 string
   - Database bloat (text fields storing large data)
   - Slow queries (large TEXT columns)
   - Memory intensive
3. ❌ **No file validation** (type, size, dimensions)
4. ❌ **No image optimization** (compression, resizing)
5. ❌ **No error handling** for large files

**Impact:**
- 🔴 Database performance degrades with many users
- 🔴 Violates user's architecture decision (Supabase Storage)
- 🔴 No CDN caching (base64 can't be cached separately)
- 🔴 Potential memory issues on upload

**Recommended Solution:**
Use Supabase Storage:

```typescript
const handlePhotoUpload = async (type: 'profile' | 'pose', event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 1. Validate file
  if (file.size > 5 * 1024 * 1024) {  // 5MB limit
    notify.error('File too large', 'Please upload an image under 5MB');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    notify.error('Invalid file type', 'Please upload an image file');
    return;
  }

  try {
    // 2. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`;
    const filePath = `player-photos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('player-images')  // Bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('player-images')
      .getPublicUrl(filePath);

    // 4. Update state with URL (not base64)
    if (type === 'profile') {
      setPreviewProfilePhoto(publicUrl);
      handleInputChange('profilePhoto', publicUrl);
    } else {
      setPreviewPosePhoto(publicUrl);
      handleInputChange('posePhoto', publicUrl);
    }
    
    notify.success('Photo uploaded successfully');
  } catch (error) {
    console.error('Photo upload error:', error);
    notify.error('Upload failed', 'Please try again');
  }
};
```

**Required Supabase Setup:**
```sql
-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-images', 'player-images', true);

-- Set storage policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'player-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'player-images');
```

---

## 📊 COMPONENT ARCHITECTURE ANALYSIS

### Data Flow:
```
User Input (EditProfileModal)
   ↓
Validation (profileValidation.ts)
   ↓
handleSave → onSave callback
   ↓
PlayerDashboard.handleSaveProfile
   ↓
Supabase Update (users table)
   ↓
Dashboard Refetch
```

### Validation Strategy:
- ✅ **On Blur**: Real-time validation per field
- ✅ **On Save**: Full form validation
- ✅ **Error Display**: Inline error messages
- ⚠️ **Async Validation**: Dynamic imports (lazy loading validation)

### State Management:
- ✅ Local state for form data
- ✅ Preview state for images
- ✅ Validation errors state
- ✅ Sanitization on mount

---

## 🎯 RECOMMENDATIONS SUMMARY

### Priority 1 - CRITICAL (Must Fix):
1. **Photo Upload**: Migrate to Supabase Storage (architectural issue)
2. **Height Input**: Replace with dual-input or dropdown system

### Priority 2 - MEDIUM (Should Fix):
3. **Jersey Number**: Remove maxLength, increase range to 0-999
4. **Validation Messages**: Improve UX with better error messages

### Priority 3 - NICE TO HAVE:
5. **Image Optimization**: Add compression/resizing before upload
6. **Loading States**: Add spinners during upload
7. **Preview Improvements**: Show file size, dimensions

---

## 🔧 IMPLEMENTATION CHECKLIST

- [ ] Replace height input with feet/inches dropdowns
- [ ] Remove jersey number maxLength restriction
- [ ] Increase jersey number range to 0-999
- [ ] Verify database has no UNIQUE constraint on jersey_number
- [ ] Implement Supabase Storage for photo uploads
- [ ] Create player-images bucket in Supabase
- [ ] Add file validation (size, type)
- [ ] Add upload progress indicator
- [ ] Add image optimization (optional)
- [ ] Update validation rules
- [ ] Test on mobile devices
- [ ] Update documentation

---

## 📝 TESTING NOTES

### Manual Test Cases:
1. **Height Input**:
   - [ ] Try "6'2\"" (with quotes)
   - [ ] Try "6'2" (without closing quote) - should fail currently
   - [ ] Try "6 2" (with space) - should fail
   - [ ] Try "74" (inches only) - should work

2. **Jersey Number**:
   - [ ] Try "00" - should work
   - [ ] Try "100" - currently blocked by maxLength
   - [ ] Try duplicate number - should work

3. **Photo Upload**:
   - [ ] Upload < 1MB image
   - [ ] Upload > 5MB image
   - [ ] Upload non-image file
   - [ ] Check database for base64 string (current)
   - [ ] After fix: Check Supabase Storage bucket

---

## 🚨 BLOCKERS & DEPENDENCIES

### Backend Team Coordination Needed:
- [ ] Confirm jersey_number column has no UNIQUE constraint
- [ ] Confirm height/weight columns are INTEGER (not VARCHAR)
- [ ] Create Supabase Storage bucket 'player-images'
- [ ] Set up storage policies for authenticated uploads
- [ ] Verify column types accept NULL values

### Frontend Dependencies:
- None - all changes can be made in EditProfileModal component

---

## 📚 RELATED FILES

1. `src/components/EditProfileModal.tsx` - Main component
2. `src/lib/validation/profileValidation.ts` - Validation rules
3. `src/components/PlayerDashboard.tsx` - Parent component with save handler
4. `src/lib/supabase.ts` - Supabase client (for storage)

---

**Audit Completed By**: AI Assistant  
**Next Steps**: Implement fixes in priority order starting with photo upload

