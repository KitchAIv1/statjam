# Smart Sequences Section - Asset Requirements

## 📸 **Required Images**

You need to save **4 images** in the `public/images/` directory with these exact filenames:

### Image Specifications

| Filename | Description | Recommended Size | Alt Text |
|----------|-------------|------------------|----------|
| `sequence-1-foul.png` | Wide iPad showing tracker with foul tapped | 1600x1000px | Recording a shooting foul in StatJam tracker |
| `sequence-2-type.png` | Foul-type selector (color-coded list) | 1600x1000px | Selecting the foul type in StatJam |
| `sequence-3-victim.png` | "Who was fouled?" picker | 1600x1000px | Choosing who was fouled in StatJam |
| `sequence-4-freethrows.png` | 3 free throws modal | 1600x1000px | Automatic free throws sequence in StatJam |

---

## 🎯 **Steps to Add Images**

### Option 1: Take Screenshots from Live App

1. **Navigate to**: https://www.statjam.net
2. **Sign in** as a stat admin with access to a game
3. **Open the Stat Tracker** for any game
4. **Take screenshots** of:
   - **Slide 1**: Tap on a player, then tap "FOUL" button
   - **Slide 2**: The foul type selection modal (Personal, Shooting, Technical, etc.)
   - **Slide 3**: The victim selection modal showing player chips
   - **Slide 4**: The free throw sequence modal showing 3 attempts

### Option 2: Use Design Tool

1. Open Figma/design tool with StatJam tracker mockups
2. Export artboards for each sequence step
3. Ensure images show the entire iPad frame (for context)
4. Export as PNG at 2x resolution (3200x2000px, then scale to 1600x1000px)

### Option 3: Create Placeholder Images

For testing purposes, you can create simple placeholder images:

```bash
# Navigate to project
cd /Users/willis/SJAM.v1/statjam/public/images

# Create placeholder images (requires ImageMagick)
convert -size 1600x1000 -background "#1a1a1a" -fill "#f97316" -gravity center \
  -pointsize 72 label:"Foul Detected\nSlide 1" sequence-1-foul.png

convert -size 1600x1000 -background "#1a1a1a" -fill "#f97316" -gravity center \
  -pointsize 72 label:"Foul Type\nSlide 2" sequence-2-type.png

convert -size 1600x1000 -background "#1a1a1a" -fill "#f97316" -gravity center \
  -pointsize 72 label:"Identify Victim\nSlide 3" sequence-3-victim.png

convert -size 1600x1000 -background "#1a1a1a" -fill "#f97316" -gravity center \
  -pointsize 72 label:"Free Throws\nSlide 4" sequence-4-freethrows.png
```

---

## ✅ **Image Optimization**

Once you have the images:

### 1. Convert to WebP (for performance)
```bash
cd /Users/willis/SJAM.v1/statjam/public/images

# Convert PNG to WebP
cwebp -q 85 sequence-1-foul.png -o sequence-1-foul.webp
cwebp -q 85 sequence-2-type.png -o sequence-2-type.webp
cwebp -q 85 sequence-3-victim.png -o sequence-3-victim.webp
cwebp -q 85 sequence-4-freethrows.png -o sequence-4-freethrows.webp
```

### 2. Update Component (Optional)
If you want to use WebP with PNG fallback, update the `slides` array in:
`src/components/marketing/SmartSequencesCarousel.tsx`

```typescript
const slides: Slide[] = [
  {
    image: '/images/sequence-1-foul.webp', // Change to .webp
    alt: 'Recording a shooting foul in StatJam tracker',
    // ...
  },
  // ... rest of slides
];
```

---

## 📊 **Performance Checklist**

- [ ] All images are exactly 1600x1000px (16:10 aspect ratio)
- [ ] File size is under 300KB per image (optimize with compression)
- [ ] Images are placed in `public/images/` directory
- [ ] Filenames match exactly (case-sensitive)
- [ ] Images load without layout shift (CLS)
- [ ] WebP versions created for better performance (optional)

---

## 🎨 **Design Guidelines**

### What to Show in Each Screenshot:

**Slide 1 - Foul Detected:**
- Full tracker interface
- Player selected (highlighted)
- "FOUL" button visible and/or tapped state
- Clock stopped indicator

**Slide 2 - Foul Type:**
- Modal overlay with foul type list
- Color-coded options (Personal, Shooting, Technical, Offensive, Flagrant)
- Clear button states

**Slide 3 - Victim Selection:**
- "Who was fouled?" modal
- List of opposing team players
- Player chips/cards with names and numbers
- Highlight the selected player

**Slide 4 - Free Throws:**
- Free throw sequence modal
- 3 attempts shown (or 2 depending on foul type)
- Make/Miss buttons
- Clear indication of automatic flow

---

## 🚀 **Testing After Adding Images**

1. Run the dev server:
```bash
cd /Users/willis/SJAM.v1/statjam
npm run dev
```

2. Navigate to: http://localhost:3000

3. Scroll down to "Smart Sequences" section

4. Verify:
   - [ ] All 4 images load correctly
   - [ ] Carousel autoplays every 4 seconds
   - [ ] Hover pauses autoplay
   - [ ] Arrow buttons work (left/right)
   - [ ] Dots work (click to jump to slide)
   - [ ] Swipe works on mobile/trackpad
   - [ ] Images are sharp (not blurry or stretched)
   - [ ] No layout shift when images load

---

## 🔧 **Troubleshooting**

### Images not showing?
1. Check file path: `/Users/willis/SJAM.v1/statjam/public/images/sequence-*.png`
2. Verify filenames match exactly (case-sensitive)
3. Clear Next.js cache: `rm -rf .next && npm run dev`
4. Check browser console for 404 errors

### Images blurry?
1. Ensure images are at least 1600x1000px
2. Check that aspect ratio is 16:10
3. Use PNG or WebP format (not JPEG at low quality)

### Images too large (slow loading)?
1. Compress images: https://tinypng.com
2. Convert to WebP format
3. Target file size: 200-300KB per image

---

**Last Updated**: January 2025  
**Component**: `SmartSequencesCarousel.tsx`  
**Location**: `src/components/marketing/`

