# Profile Photos Storage Setup

## ✅ RESOLVED: Using Existing Bucket

The code now uses the existing `profile-images` bucket in your Supabase project.

---

## ✅ QUICK FIX (2 minutes)

### Option 1: Supabase Dashboard (Easiest)

1. Go to **Supabase Dashboard**
2. Click **Storage** in left sidebar
3. Click **New Bucket**
4. Enter:
   - **Name:** `profile-photos`
   - **Public:** ✅ Check this box (photos need to be publicly viewable)
5. Click **Create Bucket**
6. Done! Refresh your app and try uploading again.

---

### Option 2: Run SQL (Alternative)

If you prefer SQL, copy this into **SQL Editor**:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
CREATE POLICY "Public profile photos are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🔍 How It Works

**File Structure:**
```
profile-photos/
  └── {user-id}/
      └── {user-id}-{timestamp}.{ext}
```

**Example:**
```
profile-photos/
  └── d243f854-b9ef-4de2-a122-58c42440a754/
      └── d243f854-b9ef-4de2-a122-58c42440a754-1762794472726.png
```

**Security:**
- ✅ Anyone can VIEW photos (public bucket)
- ✅ Users can only UPLOAD to their own folder
- ✅ Users can only UPDATE/DELETE their own photos

---

## ✅ After Setup

1. Refresh your Organizer Dashboard
2. Click "Edit Profile"
3. Click "Upload Photo"
4. Select an image
5. Click "Save Changes"
6. Photo should upload successfully! 🎉

---

## 🐛 Troubleshooting

### Still getting "Bucket not found"?
- Make sure bucket name is exactly `profile-photos` (with dash, not underscore)
- Make sure "Public" is checked
- Try refreshing your browser

### Upload works but photo doesn't show?
- Check if the URL is correct in browser console
- Verify RLS policies are set up
- Check if file size is too large (max 50MB by default)

---

## 💡 Note

This is the SAME bucket structure used for player profile photos, so if you already have player photos working, you might already have this bucket! Just verify it exists in Storage → Buckets.

