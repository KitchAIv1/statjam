# 🎥 Video Stat Tracking - Feature Documentation

**Last Updated**: December 27, 2025  
**Status**: ✅ Production Ready

---

## 📚 Documentation Index

### Primary Documentation

#### [VIDEO_STAT_TRACKING.md](./VIDEO_STAT_TRACKING.md)
**Complete feature documentation** - 500+ lines  
**Purpose**: Comprehensive guide to video stat tracking system  
**Audience**: Developers, Stat Admins, Product Managers

**Contents**:
- User workflows (stat admin and coach)
- Architecture and component structure
- Coach game support (custom players, opponent stats)
- Keyboard shortcuts reference
- Auto-sequences documentation
- Database schema
- Troubleshooting guide
- Performance considerations
- Future enhancements

**When to Use**:
- Understanding video tracking system
- Implementing new features
- Troubleshooting issues
- Onboarding new developers

---

## 🎯 Quick Reference

### Key Features

- ✅ Video upload & processing (Bunny.net Stream)
- ✅ Clock synchronization (jumpball timestamp)
- ✅ Keyboard-driven workflow
- ✅ Real-time stat recording with video timestamps
- ✅ Auto-sequences (assists, rebounds, turnovers, fouls)
- ✅ Stats timeline with edit/delete
- ✅ **Coach game support** (custom players, opponent stats)

### User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **Stat Admin** | Video Tracking Studio | Upload, sync clock, track stats, edit/delete |
| **Coach** (Premium) | Video Upload Page | Upload videos, view status, track assignment |
| **Admin** | Video Queue Dashboard | Assign videos, manage queue, view status |

### Routes

- `/dashboard/stat-admin/video/[gameId]` - Video Tracking Studio
- `/dashboard/coach/video-select` - Coach video game selection
- `/dashboard/coach/video/[gameId]` - Coach video upload
- `/dashboard/admin/video-queue` - Admin video queue

---

## 🔗 Related Documentation

### Feature Documentation
- [Stat Tracker V3](../stat-tracker/STAT_TRACKER_V3.md) - Live game tracking system
- [Coach Team Card](../coach-team-card/COACH_TEAM_CARD_IMPLEMENTATION.md) - Coach game system
- [Video Assignment Workflow](../video-tracking/VIDEO_STAT_TRACKING.md#video-assignment-workflow) - Admin-to-stat-admin assignment

### Database Documentation
- [Database Migrations](../../05-database/migrations/README.md) - Video tracking schema
- Migration 007 - Custom player support (`custom_players`, `is_opponent_stat`)
- Migration 027 - Video assignment workflow

### Architecture Documentation
- [Stat Tracker Documentation Index](../../01-project/STAT_TRACKER_DOCUMENTATION_INDEX.md) - Complete tracker documentation
- [CHANGELOG](../../01-project/CHANGELOG.md) - Video tracking updates

---

## 🚀 Getting Started

### For Stat Admins

1. **Access Video Tracking Studio**
   - Go to Stat Admin Dashboard
   - Click "Assigned Videos" section
   - Select a video from the list

2. **Upload Video** (if needed)
   - Click "Upload Game Video"
   - Select MP4 or MOV file (up to 40GB)
   - Wait for processing (1-5 minutes)

3. **Sync Game Clock**
   - Click "Sync Clock" button
   - Enter jumpball time (MM:SS)
   - Enter quarter length (default: 10 minutes)
   - Click "Save Sync"

4. **Track Stats**
   - Select player (1-5 for Team A, 6-0 for Team B)
   - Press stat shortcuts (P for made shot, M for missed, etc.)
   - Stats appear in timeline below video

### For Coaches

1. **Access Video Tracking**
   - Go to Coach Dashboard
   - Click "Video Track" button on team card (premium feature)
   - Select team from dropdown

2. **Create New Game**
   - Click "Create a new game"
   - Enter opponent name
   - Game is created and redirects to video setup

3. **Setup & Upload**
   - Enter final scores
   - Review/edit player jersey numbers
   - Click "Save & Continue"
   - Upload video (MP4 or MOV, up to 40GB)
   - Track assignment status

---

## 🐛 Troubleshooting

### Common Issues

**Video Not Loading**
- Check Bunny.net video status (should be "ready")
- Verify video URL format
- Check CORS settings

**Clock Sync Not Working**
- Verify clock sync is saved
- Check `isCalibrated` flag
- Re-sync clock using "Re-sync Clock" button

**Stats Not Recording**
- Check `localStorage` for `sb-access-token`
- Verify user is authenticated
- Check browser console for errors

**Coach Game Players Not Loading**
- Verify game has `is_coach_game = true` or `opponent_name` set
- Check `CoachPlayerService.getCoachTeamPlayers()` is being called
- Verify custom players exist in database

See [VIDEO_STAT_TRACKING.md](./VIDEO_STAT_TRACKING.md#troubleshooting) for detailed troubleshooting guide.

---

## 📊 Recent Updates

### December 27, 2025 - Coach Game Support
- ✅ Full support for coach-made games
- ✅ Custom player loading
- ✅ Opponent stat tracking
- ✅ UI adaptations for coach mode

### December 24, 2025 - Video Assignment Workflow
- ✅ Admin video queue dashboard
- ✅ Stat admin assigned videos section
- ✅ Coach video status card
- ✅ 24-hour turnaround tracking

---

**Last Updated**: December 27, 2025  
**Maintained By**: Development Team

