# StatJam - Your Courtside Command Center

<div align="center">
  <a href="https://www.producthunt.com/products/statjam?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-statjam" target="_blank">
    <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1035008&theme=light&t=1762437800195" alt="StatJam - Level stats, real-time, zero friction | Product Hunt" width="250" height="54" />
  </a>
</div>

<br />

Professional-grade sports tournament app for real-time stat tracking and tournament management.

## 🌐 **Live Site**

**Now live at**: **[www.statjam.net](https://www.statjam.net)** ✅

## 🎯 **Current Status: 🚀 ALPHA v0.17.8 - PRODUCTION** 

**Phase**: Alpha - Feature Complete Platform  
**Version**: 0.17.8  
**Last Updated**: January 2025  
**Status**: ✅ **ALPHA LIVE** - Multi-role platform with NBA-level automation, player claim system, tournament management, Coach Mission Control dashboard redesign, Stat Admin Dashboard redesign, video upload reliability improvements, and optimized coach mode tracking in production

**Authentication**: ✅ Centralized Auth Context with JWT Auto-Refresh  
**Live Tracking**: ✅ NBA-Grade V3 Engine with Real-time Sync  
**Stat Tracker**: ✅ V3 Raw HTTP Architecture + Validation + Substitution System  
**Live Viewer**: ✅ Hybrid System with Zero Flickering + Play-by-Play  
**Substitutions**: ✅ Auto-UI Update + Play-by-Play Integration  
**Team Fouls**: ✅ Auto-Tracking with Bonus Indicator  
**Timeouts**: ✅ Interactive Modal with Countdown Timer + Play-by-Play  
**Player Dashboard**: ✅ Profile Management + Validation + Game Stats Table  
**Organizer Dashboard**: ✅ Tournament Management + Team Roster System  
**Validation**: ✅ Comprehensive Input Validation + Error Handling  
**Notifications**: ✅ Toast Notifications for All User Actions  
**Architecture**: ✅ Enterprise-Grade Foundation Complete  
**Automation Suite**: ✅ NBA-Level Clock, Possession, Sequence Automation + Preset Controls  
**Coach System**: ✅ Complete Team Management with Mixed Rosters  
**Pre-Flight Check**: ✅ Game-Specific Automation Configuration  
**Shot Clock Violations**: ✅ Automatic Detection and Recording  
**Modal System**: ✅ 10 Specialized Modals for All Interactions  
**Team Stats Tab**: ✅ Live Viewer Team Performance Analytics  
**Homepage Marketing**: ✅ Professional marketing homepage with NBA-level messaging, optimized for SEO and performance  
**Announcement System**: ✅ Reusable announcement modal system for feature updates  
**Coach Dashboard UX**: ✅ Enhanced UI with 2-column layout, profile stats visibility, and onboarding flows  
**Player Claim System**: ✅ Profile ownership transfer with secure token-based claiming  
**Multi-Role Architecture**: ✅ Coach, Organizer, Player, Stat Admin with role-specific dashboards  
**Performance**: ✅ Optimized queries with parallel execution and reduced payloads  
**Documentation**: ✅ Complete Architecture and Reference Documentation

## 📚 **Documentation**

**Complete documentation available at**: [`docs/01-project/STAT_TRACKER_DOCUMENTATION_INDEX.md`](docs/01-project/STAT_TRACKER_DOCUMENTATION_INDEX.md)

**Current PRD**: [`docs/01-project/PRD_CURRENT.md`](docs/01-project/PRD_CURRENT.md)

### **Quick Links:**
- 🏗️ **Architecture**: [System Architecture](docs/03-architecture/BACKEND_ARCHITECTURE.md)
- 🔐 **Authentication**: [Auth V2 Guide](docs/04-features/authentication/AUTH_V2_GUIDE.md)
- 🏀 **Live Tracking**: [Live Tracking Victory](docs/04-fixes/LIVE_TRACKING_VICTORY.md)
- 🤖 **Automation Presets**: [Automation Guide](docs/04-features/stat-tracker/AUTOMATION_PRESETS_GUIDE.md)
- 🛠️ **Raw HTTP Pattern**: [Enterprise Integration](docs/03-architecture/RAW_HTTP_PATTERN.md)
- 🎉 **Announcements**: [Announcement System](docs/04-features/announcements/ANNOUNCEMENT_SYSTEM.md)
- 👨‍🏫 **Coach Dashboard**: [Coach Dashboard v0.17](docs/04-features/coach-dashboard/COACH_DASHBOARD_V0_17.md)
- 🔍 **Troubleshooting**: [Common Issues](docs/06-troubleshooting/COMMON_ISSUES.md)

## 🏆 **System Achievements**

### **🔐 Centralized Authentication**
- ✅ **AuthContext + Provider**: Centralized authentication with React Context
- ✅ **97% API Call Reduction**: Eliminated redundant useAuthV2 calls
- ✅ **JWT Auto-Refresh**: Automatic token refresh every 45 minutes
- ✅ **Enterprise Reliability**: 10-second timeouts, automatic retries
- ✅ **Clean Architecture**: Single source of truth for auth state

### **🏀 Live Tracking System V3**
- ✅ **Perfect Score Sync**: Tracker ↔ Database ↔ Viewer synchronized
- ✅ **Database Trigger Fix**: Critical scoring bug resolved
- ✅ **NBA-Grade Performance**: Zero flickering, instant updates
- ✅ **Raw HTTP V3**: Bulletproof service architecture
- ✅ **Substitution System**: Real-time roster updates with auto-UI refresh + unified desktop/mobile logic
- ✅ **Team Fouls Tracking**: Auto-aggregation with bonus indicator at 5+ fouls
- ✅ **Timeout Management**: Interactive modal with countdown timer, clock auto-stop, type selection (Full/30s)
- ✅ **Responsive Design**: Mobile, tablet, and desktop optimized
- ✅ **Shot Clock Integration**: Compact mobile and desktop layouts
- ✅ **Automation Presets**: Minimal (manual), Balanced (recommended), Full (NBA-level) with visual comparison guide  
- ✅ **Demo-Friendly**: Stat admins can launch private demo games without affecting live data

### **📘 Automation & Demo Training**
- ✅ **Automation Guide Pages**: `/dashboard/stat-admin/automation-guide` and `/dashboard/coach/automation-guide` show feature-by-feature preset comparisons
- ✅ **Minimal Mode**: Fully manual tracking mode with sequences disabled for training scenarios
- ✅ **Balanced Mode**: Smart prompts and clock automation with manual override
- ✅ **Full Automation**: Maximum automation including foul enforcement and undo history
- ✅ **Private Demo System**: Demo games, stats, and tracker banner visible only to stat admins (no public exposure)
- ✅ **Demo RLS Policies**: Updated `game_stats`, `stats`, and `games` RLS to allow safe demo tracking and automation updates

### **📺 Live Viewer System V2**
- ✅ **Silent Updates**: No loading screens on real-time data changes
- ✅ **Play-by-Play Feed**: NBA-style with player points, running scores, substitutions, and timeouts
- ✅ **Substitution Integration**: Substitutions appear in play-by-play with indigo styling
- ✅ **Timeout Integration**: Timeout events appear with amber styling, team name, and duration
- ✅ **Team Stats Display**: Team fouls and timeouts remaining shown in game summary
- ✅ **Fixed Width Layout**: Professional 800px centered design
- ✅ **Real-time Streaming**: gameSubscriptionManager with WebSocket

### **👤 Player Dashboard**
- ✅ **Profile Management**: Editable profiles with photo uploads
- ✅ **Real-time Validation**: Inline errors on blur with auto-clear
- ✅ **Type Conversion**: Smart height/weight parsing (6'0" → 72 inches)
- ✅ **Game Stats Table**: NBA-style box scores (ready for data)
- ✅ **Performance Analytics**: Season averages, career highs, achievements

### **🔗 Player Claim System**
- ✅ **Secure Token Generation**: Coaches generate unique claim links for custom players
- ✅ **Profile Preview**: Players see their stats before claiming
- ✅ **Inline Registration**: Sign-up form embedded in claim flow
- ✅ **Role-Aware UX**: Coaches see share instructions, players see claim button
- ✅ **Copy Link**: One-click sharing for coaches to distribute claim links
- ✅ **Optimized Performance**: Parallel queries for fast claim page loading

### **🏢 Organizer Dashboard**  
- ✅ **Tournament Management**: Create, edit, status control (draft/active)
- ✅ **Team Roster System**: Add players, manage rosters, substitutions
- ✅ **Visual Improvements**: Enhanced status badges and color coding
- ✅ **Player Validation**: Drafted players hidden from opposing teams
- ✅ **Independent Profiles**: Players control their own names/data

### **✅ Validation & Error Handling**
- ✅ **Toast Notifications**: Sonner-based notifications for all user actions
- ✅ **Input Validation**: Real-time validation with soft warnings and hard errors
- ✅ **Stat Validation**: 0-100 points, 0-20 3PT, 0-6 fouls, etc.
- ✅ **Profile Validation**: Jersey number 0-99, height 4'0"-8'0", weight 50-400 lbs
- ✅ **User-Friendly Errors**: HTTP status codes mapped to helpful messages
- ✅ **Platform Abstraction**: NotificationService ready for mobile (RN) support
- ✅ **Comprehensive Error Handling**: All stat recording paths protected with try-catch
- ✅ **Error Recovery**: State cleanup and modal closure even on failures
- ✅ **Custom Player Support**: Complete coverage for custom players across all flows
- ✅ **Mobile Error Handling**: Inherits desktop error handling via props architecture

### **🏗️ Enterprise Architecture**
- ✅ **Hybrid System**: WebSocket + Silent Updates + Raw HTTP
- ✅ **Type-Safe**: Full TypeScript throughout
- ✅ **Scalable Foundation**: Ready for enterprise deployment
- ✅ **Mobile Architecture**: Mobile uses desktop game engine logic (single source of truth)
- ✅ **Code Duplication Reduction**: Mobile inherits desktop error handling and custom player support
- ✅ **Performance Optimized**: Reduced API calls, memoization, React.memo
- ✅ **Code Quality**: All files <500 lines, strict mode, zero linting errors

### **🔒 Security Hardening (P0)**
- ✅ **Constructor Safety**: Graceful degradation prevents SSR/build crashes
- ✅ **CORS Security**: Validated origin list replaces wildcard (*)
- ✅ **Performance**: Removed excessive will-change CSS properties
- ✅ **Production Ready**: Zero breakage security improvements

## 🌐 **Homepage Features**

**Marketing Homepage** (Alpha Live):
- ✅ **Hero Section**: NBA-level messaging with clear value proposition
  - Main headline: "NBA-Level Stats. Real-Time. Zero Friction"
  - Sub-headline: "Automation handles clock, possession, and shot sequences — you just tap and track."
  - Audience: "Built for tournaments, teams, and coaches who demand pro-level precision — anywhere, anytime."
- ✅ **Differentiators**: 4 key features (Smart Automation, Real-Time Reliability, Pro-Grade Stats, Built for Everyone)
- ✅ **Live Tournament Action**: Real-time game updates with connection status
- ✅ **Audience Grid**: Role-based value propositions (Organizers, Stat Admins, Coaches, Players, Fans)
- ✅ **Roadmap Section**: Coming Soon features (Live Streaming, NBA Card Generation)
- ✅ **Performance Optimized**: Lazy loading, dynamic imports, WebP images, SEO meta tags
- ✅ **Social Sharing**: Open Graph and Twitter Card support
- ✅ **Company Branding**: Footer includes "© 2025 StatJam by Stratpremier. All Rights Reserved."
- ✅ **Automation CTA**: Highlights smart automation with links to the new stat admin guide

**Performance Metrics**:
- 40% reduction in initial bundle size (lazy loading)
- WebP image optimization for faster load times
- Comprehensive SEO metadata for search engines
- Mobile-optimized with proper viewport settings

## 🚀 **Quick Start**

```bash
# Clone and setup
git clone <repository-url>
cd statjam
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

## 🛠️ **Development**

- **Documentation**: [`docs/INDEX.md`](docs/INDEX.md) - Complete navigation hub
- **Architecture**: Enterprise-grade Auth V2 + Raw HTTP services
- **Testing**: All core features production-ready
- **Deployment**: Ready for enterprise deployment

---

**StatJam Alpha**: Professional-grade sports tournament management with multi-role architecture, player ownership, and real-time tracking. 🏆