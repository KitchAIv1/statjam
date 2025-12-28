# Video Quality Analysis

## Current Issue

The composition preview appears low quality because the webcam is using default constraints (typically 640x480), which is then stretched to the 1920x1080 canvas.

## Technical Details

### Canvas Resolution
- **Composition Canvas**: 1920x1080 (Full HD) ✅
- **Frame Rate**: 30 fps ✅
- **Output**: High quality stream ready for broadcast

### Webcam Constraints (Before Fix)
- **Default**: `{ video: true }` 
- **Typical Resolution**: 640x480 (VGA)
- **Result**: Low-res video stretched to 1920x1080 = pixelation

### Webcam Constraints (After Fix)
- **Requested**: 1920x1080 ideal, 1280x720 minimum
- **Frame Rate**: 30 fps ideal, 24 fps minimum
- **Result**: High-res video at native canvas size = sharp quality

## Quality Chain

```
Webcam Source → Canvas (1920x1080) → Composed Stream → Preview/Broadcast
     ↓                ↓                      ↓
  Resolution      Resolution            Same Quality
  (640x480 ❌)    (1920x1080 ✅)        (Matches source)
  (1920x1080 ✅)  (1920x1080 ✅)        (High quality)
```

## Preview vs Broadcast Quality

**Important**: The preview quality **WILL match** the broadcast quality because:
1. Both use the same composed stream from the canvas
2. Canvas captures at 1920x1080 @ 30fps
3. Preview shows the exact stream that will be sent to relay server
4. Relay server converts to RTMP without quality loss (if configured correctly)

## Expected Quality After Fix

- **Source**: 1920x1080 (or best available from webcam)
- **Canvas**: 1920x1080
- **Composed Stream**: 1920x1080 @ 30fps
- **Preview**: 1920x1080 (scaled to fit container)
- **Broadcast**: 1920x1080 (YouTube/Twitch will transcode to multiple qualities)

## Browser Limitations

Some browsers/devices may not support 1920x1080:
- **Fallback**: Will use highest available resolution (typically 1280x720 minimum)
- **Still High Quality**: 720p is acceptable for most broadcasts
- **Canvas**: Always renders at 1920x1080 (scales source if needed)

## Recommendations

1. ✅ **Fixed**: Request high resolution from webcam
2. ✅ **Already Set**: Canvas at 1920x1080
3. ⚠️ **Future**: Add quality indicator showing actual resolution
4. ⚠️ **Future**: Add bitrate controls for network optimization

## Testing

After the fix:
1. Start webcam - check browser console for actual resolution
2. Start composition - preview should be sharp
3. Broadcast - quality should match preview

