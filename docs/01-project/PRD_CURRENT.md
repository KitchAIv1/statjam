# StatJam Product Requirements Document (PRD) - Current Version

**Version**: 2.0  
**Date**: October 30, 2025  
**Status**: Production Ready (v0.15.0+)  
**Previous Version**: [LEGACY_PRD_ORIGINAL.md](../08-archive/LEGACY_PRD_ORIGINAL.md)

---

## 🔥 Project Summary

StatJam is a professional-grade sports tournament management platform built for real-time stat tracking, tournament organizing, and team/player performance management. The platform targets basketball tournaments initially and provides NBA-level statistical tracking with intelligent automation, comprehensive tournament management, and real-time fan engagement.

**Current Status**: ✅ **MVP1 LIVE** - Complete MVP with advanced automation suite, coach system, and enterprise-grade architecture. **Now live in production at [www.statjam.net](https://www.statjam.net)**

---

## 👥 Target User Roles

### 1. **Organizers** 
- Create and manage tournaments
- Team and player roster management
- Assign statisticians to games
- Tournament scheduling and bracket management
- Public/private tournament visibility controls
- Comprehensive organizer guide system

### 2. **Stat Admins** 
- Real-time game stat tracking with NBA-level precision
- Advanced automation suite (clock, possession, sequences)
- Pre-flight automation configuration
- Shot clock violation detection
- Comprehensive play-by-play recording

### 3. **Coaches** 
- Team management and player rosters
- Custom player creation and management
- Quick Track integration for non-tournament games
- Opponent stat tracking
- Mixed roster support (existing users + custom players)

### 4. **Players** 
- Personal dashboard with performance analytics
- Game statistics and career tracking
- Team membership and tournament participation
- Profile management with photo uploads
- Real-time validation and error handling

### 5. **Fans** 
- Public tournament viewing
- Live game streaming with real-time updates
- Team and player statistics
- Play-by-play feeds
- Mobile-optimized viewing experience

---

## 🚀 Core Platform Features

### ✅ **Stat Tracker V3 System** (NBA-Level Tracking)

#### **Real-Time Stat Recording**
- **Scoring Stats**: 2PT, 3PT, Free Throws (made/missed)
- **Non-Scoring Stats**: Assists, Rebounds (offensive/defensive), Steals, Blocks, Turnovers
- **Foul Management**: 7 foul types with automatic free throw sequences
- **Team Stats**: Team fouls, timeouts, possession tracking
- **Validation**: Real-time input validation with user-friendly error messages

#### **Dual Clock System**
- **Game Clock**: Start/stop/reset with manual time editing
- **Shot Clock**: 24-second NBA standard with 14-second reset
- **Shot Clock Violation**: Automatic detection with modal prompts
- **Quarter Management**: Support for overtime periods (1-8 quarters)

#### **Advanced Automation Suite** (Phases 2-6)
- **Clock Automation**: Auto-pause on fouls/timeouts, auto-reset shot clock
- **Possession Tracking**: Auto-flip on events, jump ball arrow, database persistence
- **Play Sequences**: Assist prompts, rebound prompts, block prompts, event linking
- **Free Throw Sequences**: Automatic FT flow after shooting fouls
- **Foul Possession Logic**: Technical/flagrant foul possession retention

#### **Pre-Flight Check System**
- **Automation Presets**: Minimal, Balanced, Full Automation
- **Custom Settings**: Per-game automation configuration
- **Settings Hierarchy**: Game → Tournament → Default settings
- **Real-time Configuration**: Before game launch

#### **Modal System** (10 Specialized Modals)
- Shot Clock Violation Modal
- Assist Prompt Modal
- Rebound Prompt Modal
- Block Prompt Modal
- Turnover Prompt Modal
- Foul Type Selection Modal
- Victim Player Selection Modal
- Free Throw Sequence Modal
- Substitution Modal
- Timeout Modal

#### **Responsive Design**
- **Desktop Layout**: Three-column layout with full stat grid
- **Mobile Layout**: Optimized touch interface with compact scoreboard
- **Tablet Layout**: Hybrid approach with responsive components
- **Touch Optimization**: All interactions optimized for mobile devices

---

### ✅ **Marketing Homepage** (MVP1 Production Ready)

#### **Hero Section**
- **Value Proposition**: "NBA-Level Stats. Real-Time. Zero Friction"
- **Clear Messaging**: Automation-focused headline and description
- **Optimized CTAs**: Primary "Start Tracking Like the Pros" + Secondary "Watch Live Games"
- **Visual Impact**: Full-screen hero image with gradient overlay
- **Performance**: High-priority image loading with WebP format

#### **Marketing Sections**
- **Differentiators**: 4-card grid highlighting Smart Automation, Real-Time Reliability, Pro-Grade Stats, Built for Everyone
- **Live Tournament Action**: Real-time game updates with WebSocket connection status indicators
- **Audience Grid**: Role-based value propositions (Organizers, Stat Admins, Coaches, Players, Fans)
- **Player Premium**: Player-focused features with visual mockups
- **Proof/Trust**: Technology badges (Automation Suite, <3s Updates, Enterprise-Grade)
- **Roadmap**: Coming Soon features (Live Streaming, NBA Card Generation) with waitlist CTAs
- **Final CTA**: Strong conversion-focused section with dual CTAs

#### **Performance Optimizations**
- **Code Splitting**: Lazy loading of below-the-fold components (40% bundle reduction)
- **Image Optimization**: WebP format, lazy loading, priority hints
- **SEO**: Comprehensive meta tags, Open Graph, Twitter Cards
- **Browser Hints**: Preconnect/dns-prefetch for external resources
- **Mobile**: Proper viewport settings, theme color, touch optimization

#### **Social Sharing**
- **Open Graph**: Rich preview cards for Facebook/LinkedIn
- **Twitter Cards**: Large image cards for Twitter
- **Canonical URLs**: Proper SEO canonicalization
- **Structured Data**: Ready for rich snippets (future)

---

### ✅ **Coach System** (Complete Team Management)

#### **Team Management**
- Create and manage multiple teams
- Public/private team visibility
- Team sharing and import functionality
- Quick Track integration for non-tournament games

#### **Player Management**
- Mixed roster support (StatJam users + custom players)
- Search and add existing users
- Create custom players for team-specific rosters
- Player removal and roster management
- Minimum 5 players validation

#### **Quick Track Integration**
- Reuses Stat Tracker V3 interface
- Opponent team panel for stat tracking
- Non-tournament game creation
- Coach-specific data management

---

### ✅ **Tournament Management System**

#### **Organizer Dashboard**
- Tournament creation and management
- Team and player roster management
- Stat admin assignment per game
- Tournament scheduling and bracket management
- Public/private tournament controls
- Comprehensive organizer guide system

#### **Tournament Features**
- Country selection across UI
- Tournament visibility controls
- Game scheduling with date/time/venue
- Bracket builder and pool play scheduler
- Games list with advanced filtering

#### **Guide System**
- 3-surface guide implementation
- React Context state management
- WhatsApp support integration
- Session tracking and user preferences

---

### ✅ **Live Viewer V2 System**

#### **Real-Time Streaming**
- WebSocket-based real-time updates
- Silent updates (no loading screens)
- Zero flickering on data changes
- Professional 800px centered design

#### **Play-by-Play Feed**
- NBA-style play-by-play with player points
- Substitution events with indigo styling
- Timeout events with amber styling
- Running scores with lead indicators
- Chronological event integration

#### **Team Stats Tab**
- Team performance summary with aggregate stats
- On-court vs bench player display
- Player statistics grid (MIN, PTS, REB, AST, STL, BLK, +/-)
- Color-coded plus/minus display
- Mobile responsive layout (3x2 grid)

#### **Game Information**
- Team names and scores
- Game clock and quarter
- Team fouls and timeouts remaining
- Live game status indicators

---

### ✅ **Player Dashboard System**

#### **Profile Management**
- Editable profiles with photo uploads
- Real-time validation with inline errors
- Type conversion (height/weight parsing)
- Jersey number and personal information

#### **Performance Analytics**
- Game statistics table (NBA-style box scores)
- Season averages and career highs
- Upcoming games display
- Achievement tracking

#### **Team Integration**
- Team membership display
- Tournament participation
- Game history and statistics

---

### ✅ **Authentication & Security**

#### **Centralized Authentication**
- AuthContext with React Context API
- JWT auto-refresh every 45 minutes
- 97% reduction in authentication API calls
- Enterprise-grade reliability with timeouts

#### **Security Features**
- Content Security Policy (CSP) headers
- Strict-Transport-Security (HSTS)
- Permissions-Policy headers
- CORS validation with origin whitelist
- XSS protection with DOMPurify

#### **User Management**
- Role-based access control (organizer, stat_admin, coach, player)
- Profile validation and metadata checking
- Password strength indicators
- Enhanced email and name validation

---

### ✅ **Validation & Error Handling**

#### **Input Validation**
- Real-time validation across all forms
- Soft warnings for unusual values
- Hard errors for impossible values
- Toast notifications for user feedback

#### **Stat Validation Rules**
- Points: 0-100 per player (warning at 50+)
- 3-Pointers: 0-20 per player (warning at 12+)
- Rebounds: 0-40 per player (warning at 25+)
- Assists: 0-30 per player (warning at 20+)
- Steals/Blocks: 0-15 each (warning at 10+)
- Fouls: 0-6 per player (hard limit)

#### **Profile Validation**
- Jersey Number: 0-99
- Height: 48-96 inches (4'0" - 8'0")
- Weight: 50-400 lbs
- Age: 10-99 years

---

## 🏗️ Technical Architecture

### **Frontend Stack**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Icons**: Lucide React

### **Backend Stack**
- **Database**: Supabase (PostgreSQL)
- **Real-time**: WebSocket subscriptions
- **Authentication**: Supabase Auth with JWT
- **API**: Raw HTTP requests (bypasses client issues)
- **Storage**: Supabase Storage for images

### **Service Architecture**
- **GameServiceV3**: Primary API layer with raw HTTP
- **TeamServiceV3**: Team and player data management
- **AuthServiceV2**: Centralized authentication
- **CoachTeamService**: Coach-specific team management
- **NotificationService**: Platform-abstracted notifications

### **Database Schema**
- **Core Tables**: games, game_stats, game_substitutions, game_timeouts, game_possessions
- **User Tables**: users, teams, team_players, custom_players
- **Tournament Tables**: tournaments, tournament_teams
- **RLS Policies**: Comprehensive row-level security
- **Indexes**: Optimized for performance

---

## 📱 Platform Support

### **Web Application**
- **Desktop**: Full-featured interface (1280px+)
- **Tablet**: Hybrid responsive design (768-1024px)
- **Mobile**: Touch-optimized interface (<768px)
- **Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

### **Future Mobile Apps**
- **React Native**: Architecture prepared for mobile apps
- **Notification Service**: Platform abstraction layer ready
- **Offline Sync**: IndexedDB foundation for offline support

---

## 🎯 User Experience

### **Design Principles**
- **NBA-Level Precision**: Professional-grade stat tracking
- **Mobile-First**: Touch-optimized for all devices
- **Real-Time**: Instant updates and feedback
- **Intuitive**: Minimal learning curve for new users
- **Accessible**: Clear error messages and validation

### **Performance Standards**
- **Page Load**: < 1 second
- **Stat Recording**: < 100ms
- **Real-time Updates**: < 500ms
- **API Calls**: 97% reduction through optimization
- **Bundle Size**: Optimized with code splitting

---

## 🔄 Development Phases

### **Phase 1: Core MVP** ✅ **COMPLETE**
- Authentication system
- Basic stat tracking
- Tournament management
- Player dashboards
- Live viewer

### **Phase 2: Clock Automation** ✅ **COMPLETE**
- Shot clock auto-reset
- Game clock auto-pause
- NBA rules compliance

### **Phase 3: Possession Tracking** ✅ **COMPLETE**
- Auto-flip possession on events
- Jump ball arrow
- Database persistence

### **Phase 4: Play Sequences** ✅ **COMPLETE**
- Assist prompts after made shots
- Rebound prompts after missed shots
- Block prompts after missed shots
- Event linking with sequence_id

### **Phase 5: Free Throw Sequences** ✅ **COMPLETE**
- Automatic FT flow after shooting fouls
- Victim player selection
- FT result recording

### **Phase 6: Foul Possession Logic** ✅ **COMPLETE**
- Technical/flagrant foul possession retention
- Advanced foul handling

### **Phase 7: Undo/Redo System** 🔄 **PLANNED**
- Command pattern for all actions
- Undo last stat/substitution/timeout
- History panel

### **Phase 8: Advanced Analytics** 🔄 **PLANNED**
- Real-time shot charts
- Player efficiency ratings
- Plus/minus tracking
- Lineup analytics

### **Phase 9: Offline Mode** 🔄 **PLANNED**
- IndexedDB for offline storage
- Sync queue for pending operations
- Conflict resolution

### **Phase 10: Multi-User Collaboration** 🔄 **PLANNED**
- Real-time sync between multiple stat keepers
- Role-based permissions
- Conflict resolution

---

## 📊 Success Metrics

### **Technical Metrics**
- **Uptime**: 99.9% availability
- **Performance**: < 1s page load, < 100ms stat recording
- **Security**: Zero critical vulnerabilities
- **Code Quality**: < 500 lines per file, TypeScript throughout

### **User Experience Metrics**
- **Learning Curve**: < 5 minutes for basic stat tracking
- **Error Rate**: < 1% user errors with validation
- **Mobile Usage**: 60%+ mobile traffic
- **Real-time Latency**: < 500ms updates

### **Business Metrics**
- **Tournament Completion**: 95%+ games fully tracked
- **User Retention**: 80%+ monthly active users
- **Feature Adoption**: 90%+ automation usage
- **Support Tickets**: < 5% of active users

---

## 🚀 Deployment & Operations

### **Production Environment**
- **MVP1 Status**: ✅ **LIVE IN PRODUCTION**
- **Live Site**: [www.statjam.net](https://www.statjam.net)
- **Hosting**: Vercel (Next.js optimized)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Global edge caching
- **Monitoring**: Real-time error tracking
- **Backups**: Automated daily backups

### **Marketing Homepage** (MVP1)
- **Hero Section**: NBA-level messaging with clear value proposition and optimized CTAs
- **Differentiators Section**: 4 key features highlighting automation, real-time updates, pro-grade stats
- **Live Tournament Section**: Real-time game updates with WebSocket connection status
- **Audience Grid**: Role-based value propositions for all user types
- **Player Premium Section**: Player-focused features and benefits
- **Proof/Trust Section**: Technology badges and trust indicators
- **Roadmap Section**: Coming Soon features (Live Streaming, NBA Card Generation)
- **Performance**: 40% bundle size reduction via lazy loading, WebP images, SEO optimization
- **SEO**: Comprehensive meta tags, Open Graph, Twitter Cards for social sharing

### **Security Standards**
- **HTTPS**: Enforced across all connections
- **CSP**: Content Security Policy headers
- **HSTS**: HTTP Strict Transport Security
- **RLS**: Row-level security on all data
- **Audit Logs**: Comprehensive activity tracking

### **Scalability**
- **Database**: Horizontal scaling ready
- **API**: Stateless architecture
- **Caching**: Redis for session management
- **CDN**: Global content delivery

---

## 📚 Documentation

### **Comprehensive Documentation Suite**
- **Architecture Map**: Complete system overview (2,015 lines)
- **Component Map**: Visual component hierarchy (674 lines)
- **Quick Reference**: Developer quick reference guide
- **Audit Summary**: Production readiness assessment (664 lines)
- **Documentation Index**: Master navigation hub (644 lines)

### **Feature Documentation**
- **Implementation Guides**: Step-by-step feature implementation
- **API Reference**: Complete service layer documentation
- **Troubleshooting**: Common issues and solutions
- **Testing Guides**: Comprehensive testing procedures

### **Maintenance Documentation**
- **Deployment Guide**: Production deployment procedures
- **Monitoring Guide**: System health monitoring
- **Security Checklist**: Security compliance procedures
- **Update Procedures**: Version update processes

---

## 🎯 Future Roadmap

### **Short-term (Q1 2026)**
- Undo/Redo system implementation
- Advanced analytics dashboard
- Performance optimizations
- Mobile app development start

### **Medium-term (Q2-Q3 2026)**
- Offline mode implementation
- Multi-user collaboration
- Advanced tournament features
- Public tournament pages

### **Long-term (Q4 2026+)**
- Multi-sport support
- AI-powered insights
- Advanced reporting
- Enterprise features

---

## ✅ Production Readiness

### **Current Status**: ✅ **PRODUCTION READY**

**All Core Features Complete**:
- ✅ Stat Tracker V3 with NBA-level precision
- ✅ Complete automation suite (Phases 2-6)
- ✅ Coach system with team management
- ✅ Live viewer with real-time updates
- ✅ Tournament management system
- ✅ Player dashboard with analytics
- ✅ Comprehensive validation and error handling
- ✅ Mobile-responsive design
- ✅ Enterprise-grade security
- ✅ Complete documentation suite

**Quality Assurance**:
- ✅ 100% TypeScript coverage
- ✅ Zero critical security vulnerabilities
- ✅ Comprehensive error handling
- ✅ Real-time testing completed
- ✅ Mobile optimization verified
- ✅ Performance benchmarks met

**Documentation**:
- ✅ Complete architecture documentation
- ✅ Developer quick reference guides
- ✅ Troubleshooting procedures
- ✅ Deployment and maintenance guides

---

## 📞 Support & Contact

### **Technical Support**
- **Documentation**: Complete self-service documentation
- **Troubleshooting**: Comprehensive issue resolution guides
- **Developer Resources**: API documentation and examples

### **Feature Requests**
- **Roadmap**: Public roadmap with planned features
- **Feedback**: User feedback integration process
- **Community**: User community for feature discussions

---

**StatJam v2.0 PRD** - Complete, current, and production-ready. This PRD reflects the actual implemented features as of October 30, 2025, representing a mature, enterprise-grade sports tournament management platform.

---

**Last Updated**: October 30, 2025  
**Maintained By**: Development Team  
**Status**: ✅ Production Ready (v0.15.0+)  
**Next Review**: Q1 2026
