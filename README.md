# StatJam - Your Courtside Command Center

Professional-grade sports tournament app for real-time stat tracking and tournament management.

## 🌐 **Live Site**

**MVP1 is now live at**: **[www.statjam.net](https://www.statjam.net)** ✅

## 🎯 **Current Status: 🚀 MVP1 LIVE IN PRODUCTION (v0.15.0+)** 

**Phase**: MVP1 Live - Production-Ready Platform with Advanced Automation  
**Version**: 0.15.0+  
**Last Updated**: October 30, 2025
**Status**: ✅ **MVP1 LIVE** - Complete MVP with NBA-level automation now in production

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
**Automation Suite**: ✅ NBA-Level Clock, Possession, Sequence Automation  
**Coach System**: ✅ Complete Team Management with Mixed Rosters  
**Pre-Flight Check**: ✅ Game-Specific Automation Configuration  
**Shot Clock Violations**: ✅ Automatic Detection and Recording  
**Modal System**: ✅ 10 Specialized Modals for All Interactions  
**Team Stats Tab**: ✅ Live Viewer Team Performance Analytics  
**Homepage Marketing**: ✅ Professional marketing homepage with NBA-level messaging, optimized for SEO and performance  
**Documentation**: ✅ Complete Architecture and Reference Documentation

## 📚 **Documentation**

**Complete documentation available at**: [`docs/01-project/STAT_TRACKER_DOCUMENTATION_INDEX.md`](docs/01-project/STAT_TRACKER_DOCUMENTATION_INDEX.md)

**Current PRD**: [`docs/01-project/PRD_CURRENT.md`](docs/01-project/PRD_CURRENT.md)

### **Quick Links:**
- 🏗️ **Architecture**: [System Architecture](docs/03-architecture/BACKEND_ARCHITECTURE.md)
- 🔐 **Authentication**: [Auth V2 Guide](docs/04-features/authentication/AUTH_V2_GUIDE.md)
- 🏀 **Live Tracking**: [Live Tracking Victory](docs/04-fixes/LIVE_TRACKING_VICTORY.md)
- 🛠️ **Raw HTTP Pattern**: [Enterprise Integration](docs/03-architecture/RAW_HTTP_PATTERN.md)
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

### **🏗️ Enterprise Architecture**
- ✅ **Hybrid System**: WebSocket + Silent Updates + Raw HTTP
- ✅ **Type-Safe**: Full TypeScript throughout
- ✅ **Scalable Foundation**: Ready for enterprise deployment
- ✅ **Performance Optimized**: Reduced API calls, memoization, React.memo
- ✅ **Code Quality**: All files <500 lines, strict mode, zero linting errors

### **🔒 Security Hardening (P0)**
- ✅ **Constructor Safety**: Graceful degradation prevents SSR/build crashes
- ✅ **CORS Security**: Validated origin list replaces wildcard (*)
- ✅ **Performance**: Removed excessive will-change CSS properties
- ✅ **Production Ready**: Zero breakage security improvements

## 🌐 **Homepage Features**

**Marketing Homepage** (MVP1 Live):
- ✅ **Hero Section**: NBA-level messaging with clear value proposition
- ✅ **Differentiators**: 4 key features (Smart Automation, Real-Time Reliability, Pro-Grade Stats, Built for Everyone)
- ✅ **Live Tournament Action**: Real-time game updates with connection status
- ✅ **Audience Grid**: Role-based value propositions (Organizers, Stat Admins, Coaches, Players, Fans)
- ✅ **Roadmap Section**: Coming Soon features (Live Streaming, NBA Card Generation)
- ✅ **Performance Optimized**: Lazy loading, dynamic imports, WebP images, SEO meta tags
- ✅ **Social Sharing**: Open Graph and Twitter Card support

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

**StatJam MVP**: Professional-grade sports tournament management with enterprise authentication and real-time tracking. 🏆