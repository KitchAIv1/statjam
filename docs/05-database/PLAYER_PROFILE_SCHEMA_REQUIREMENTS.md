# Player Profile - Backend Requirements

## Overview

The new public Player Profile page (`/player/[id]`) requires additional columns in the `players` table to support bio, school information, and recruitment features.

---

## Required Schema Changes

### New Columns for `players` Table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `bio` | TEXT | NULL | Player's "About Me" description (max 500 chars) |
| `school` | TEXT | NULL | School or organization name |
| `graduation_year` | TEXT | NULL | Class of YYYY (e.g., "2025") |
| `is_public_profile` | BOOLEAN | true | Whether profile is publicly visible |
| `is_recruitable` | BOOLEAN | false | Show recruitment CTA on profile |
| `recruitment_note` | TEXT | NULL | Optional message for scouts |
| `contact_email` | TEXT | NULL | Contact email for recruitment inquiries |

---

## Notes

1. **Profile Visibility**: Only regular players (not custom players) should have public profiles. The `is_custom_player` column already exists to differentiate.

2. **SEO Indexing**: Consider adding `is_seo_indexed` BOOLEAN for players who want their profile discoverable on Google. Default should be `false`.

3. **Data Privacy**: The `contact_email` should only be shown when `is_recruitable = true`.

---

## Frontend Status

✅ **Completed:**
- `/player/[id]` page route created
- `usePublicPlayerProfile` hook created
- `PlayerProfileHero` component (cream theme)
- `PlayerProfileStats` component (career + tournament stats)
- `PlayerProfileGameLog` component (recent games + career highs)
- `PlayerProfileAwards` component (badges)
- `PlayerProfileRecruitment` component (recruitment CTA)
- `EditProfileModal` updated with bio, school, graduationYear fields

---

## Testing Checklist

After backend updates:

1. [ ] Add bio in Edit Profile → verify it saves
2. [ ] Add school/graduation year → verify it saves
3. [ ] Visit `/player/[id]` → verify all data displays
4. [ ] Check custom players → should show "not found"
5. [ ] Check recruitment toggle → CTA section appears/hides

