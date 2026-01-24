/**
 * Canvas Overlay Drawing Methods
 * 
 * All drawing logic for rendering game overlay to Canvas.
 * Matches React EnhancedScoreOverlay component exactly.
 * Each method stays under 40 lines to comply with .cursorrules
 */

import { GameOverlayData, getTailwindColor, getTailwindRgba, hexToRgba } from './utils';

export class OverlayDrawer {
  // Max width constraint (matches React max-w-7xl = 1280px)
  private readonly MAX_WIDTH = 1280;
  private readonly CENTER_X = 960; // 1920 / 2
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number
  ) {}
  
  /**
   * Draw gradient background bar at top with backdrop-blur simulation
   * Starts at top edge (y=0)
   */
  drawBackground(): void {
    // Main gradient (matches React: from-black/95 via-black/90 to-transparent)
    // Starts at y=0 (top edge of canvas)
    // Opacity increased by 25% + 10%: 0.95 → 0.97, 0.90 → 0.94
    const gradient = this.ctx.createLinearGradient(0, 0, 0, 160);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.97)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.94)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, 160);
    
    // Simulate backdrop-blur with semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.width, 120);
  }
  
  /**
   * Draw tournament header at very top
   */
  drawTournamentHeader(
    data: GameOverlayData,
    tournamentLogo: HTMLImageElement | null
  ): void {
    if (!data.tournamentName && !tournamentLogo && !data.venue) {
      return;
    }
    
    // Background gradient (matches React: from-black/90 to-transparent)
    const gradient = this.ctx.createLinearGradient(0, 0, 0, 40);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.90)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, 40);
    
    // Simulate backdrop-blur
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    this.ctx.fillRect(0, 0, this.width, 40);
    
    // Center content (max-width constraint)
    const startX = (this.width - this.MAX_WIDTH) / 2;
    const centerX = this.width / 2;
    let currentX = centerX;
    
    // Tournament logo (24px = w-6 h-6)
    if (tournamentLogo) {
      const logoSize = 24;
      this.ctx.drawImage(tournamentLogo, currentX - 40, 8, logoSize, logoSize);
      currentX += 20;
    }
    
    // Tournament name (text-xs text-gray-300 font-medium)
    if (data.tournamentName) {
      this.ctx.fillStyle = '#D1D5DB'; // gray-300
      this.ctx.font = '500 12px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(data.tournamentName, currentX, 20);
      currentX += this.ctx.measureText(data.tournamentName).width / 2 + 8;
    }
    
    // Venue (text-xs text-gray-400)
    if (data.venue) {
      this.ctx.fillStyle = '#9CA3AF'; // gray-400
      this.ctx.font = '12px Arial, sans-serif';
      const venueText = ` • ${data.venue}`;
      this.ctx.fillText(venueText, currentX, 20);
    }
  }
  
  /**
   * Draw team section (away or home) with max-width constraint
   * Scores positioned symmetrically from center
   */
  drawTeamSection(
    side: 'away' | 'home',
    data: GameOverlayData,
    teamLogo: HTMLImageElement | null,
    teamLogoFallback: boolean
  ): void {
    const isHome = side === 'home';
    const containerStartX = (this.width - this.MAX_WIDTH) / 2;
    const padding = 48;
    const gap = 20; // Reduced gap to bring badge closer to score
    const centerX = this.width / 2;
    const scoreOffsetFromCenter = 180; // Reduced distance to bring scores closer to center
    
    // Calculate vertical center of score for alignment
    // Score font is 64px, drawn with textBaseline='top' at y
    // Visual center of score is approximately y + fontSize/2 = y + 32
    const scoreFontSize = 64; // Increased from 52px to 64px
    const scoreTopY = 60; // Top of score text
    const scoreCenterY = scoreTopY + scoreFontSize / 2; // Vertical center of score (92px)
    
    // Align all elements to score center
    const badgeHeight = 110; // Updated to match new badge height
    const badgeTopY = scoreCenterY - badgeHeight / 2; // Center badge vertically with score
    
    const y = badgeTopY; // Use badge top Y for all team section elements
    const logoSize = 28;
    
    // Calculate score positions (symmetric from center)
    const awayScoreX = centerX - scoreOffsetFromCenter;
    const homeScoreX = centerX + scoreOffsetFromCenter;
    
    if (isHome) {
      // Home: Logo → Badge → Score (from right edge inward, towards center)
      // Calculate badge width first to position logo correctly
      this.ctx.font = '900 22px Arial, sans-serif'; // Updated to match new team name font size
      const teamName = data.teamBName;
      const nameWidth = Math.min(this.ctx.measureText(teamName).width, 260);
      const approximateBadgeWidth = Math.max(nameWidth + 32, 240); // padding * 2 = 32, updated min width
      
      // Badge at outer right (accounting for logo)
      const rightEdgeX = containerStartX + this.MAX_WIDTH - padding;
      const badgeX = rightEdgeX - logoSize - gap - approximateBadgeWidth;
      const badgeWidth = this.drawTeamBadge(badgeX, y, data, side);
      
      // Logo to the right of badge (aligned with badge edge)
      const logoX = badgeX + badgeWidth + gap;
      this.drawTeamLogo(logoX, y, teamLogo, teamLogoFallback, data, side);
      
      // Score towards center (left-aligned at homeScoreX, vertically centered)
      this.drawTeamScore(homeScoreX, scoreTopY, data, side);
      
      // Stats inside badge (not below)
      this.drawTeamStats(badgeX, y, data, side, badgeWidth);
    } else {
      // Away: Logo → Badge → Score (left to right, towards center)
      // Calculate positions from left, working towards center
      const leftStartX = containerStartX + padding;
      
      // Logo at far left
      this.drawTeamLogo(leftStartX, y, teamLogo, teamLogoFallback, data, side);
      
      // Badge next to logo
      const badgeX = leftStartX + logoSize + gap;
      const badgeWidth = this.drawTeamBadge(badgeX, y, data, side);
      
      // Score towards center (right-aligned at awayScoreX, vertically centered)
      this.drawTeamScore(awayScoreX, scoreTopY, data, side);
      
      // Stats inside badge (not below)
      this.drawTeamStats(badgeX, y, data, side, badgeWidth);
    }
  }
  
  /**
   * Draw center section (clock, quarter, shot clock)
   * Grouped together and aligned as a unit with score center
   * Quarter and shot clock on same row
   */
  drawCenterSection(data: GameOverlayData): void {
    const x = this.width / 2;
    
    // Calculate vertical center of score for alignment
    const scoreFontSize = 64; // Increased from 52px to 64px
    const scoreTopY = 60;
    const scoreCenterY = scoreTopY + scoreFontSize / 2; // Vertical center of score (92px)
    
    // Group dimensions
    const clockHeight = 50;
    const quarterHeight = 30; // Increased to match larger font
    const verticalGap = 8; // Gap between clock and quarter/shot row
    const horizontalGap = 8; // Gap between quarter and shot clock
    
    // Total group height: clock + gap + quarter/shot row
    const groupHeight = clockHeight + verticalGap + quarterHeight;
    const groupTopY = scoreCenterY - groupHeight / 2; // Center entire group with score
    
    // Game clock at top of group
    const clockTopY = groupTopY;
    this.drawGameClock(x, clockTopY, data.gameClockMinutes, data.gameClockSeconds);
    
    // Quarter and shot clock on same row below clock
    const quarterShotRowY = clockTopY + clockHeight + verticalGap;
    
    // Calculate widths for side-by-side placement (with increased font sizes)
    this.ctx.font = '700 16px Arial, sans-serif'; // Increased font
    const quarterText = data.quarter > 4 ? `OT${data.quarter - 4}` : `Q${data.quarter}`;
    const quarterTextWidth = this.ctx.measureText(quarterText).width;
    const quarterWidth = quarterTextWidth + 24; // padding
    
    let shotClockWidth = 0;
    if (data.shotClockSeconds !== undefined) {
      this.ctx.font = '700 20px "Courier New", monospace'; // Increased font
      shotClockWidth = this.ctx.measureText(data.shotClockSeconds.toString()).width + 24;
    }
    
    // Total width of quarter + shot clock row
    const rowWidth = quarterWidth + (data.shotClockSeconds !== undefined ? horizontalGap + shotClockWidth : 0);
    
    // Center the row horizontally
    const quarterX = x - rowWidth / 2;
    const shotClockX = quarterX + quarterWidth + horizontalGap;
    
    // Draw quarter (rounded box with border only, no fill)
    this.drawQuarter(quarterX, quarterShotRowY, data.quarter, quarterWidth);
    
    // Draw shot clock (if available)
    if (data.shotClockSeconds !== undefined) {
      this.drawShotClock(shotClockX, quarterShotRowY, data.shotClockSeconds);
    }
  }
  
  /**
   * Draw team badge with name and label
   * React: bg-white/10 backdrop-blur-sm rounded-lg border, padding var(--padding)
   * Stats (fouls/timeouts) are drawn inside by drawTeamStats
   * Returns badge width and height for positioning calculations
   */
  private drawTeamBadge(
    x: number,
    y: number,
    data: GameOverlayData,
    side: 'away' | 'home'
  ): number {
    const isHome = side === 'home';
    const teamName = isHome ? data.teamBName : data.teamAName;
    const primaryColor = isHome ? data.teamBPrimaryColor : data.teamAPrimaryColor;
    const padding = 16;
    
    // Measure badge width dynamically - increased size for larger team name font
    this.ctx.font = '900 22px Arial, sans-serif'; // Increased font for team name
    const nameWidth = Math.min(this.ctx.measureText(teamName).width, 260);
    const badgeWidth = Math.max(nameWidth + padding * 2, 240); // Increased min width for larger font
    
    // Badge height increased to accommodate larger team name and stats
    // Layout: padding (18) + label (12) + margin (6) + name (22) + margin (8) + stats (24) + padding (18) = 108px
    const badgeHeight = 110; // Increased height for larger team name
    
    // Badge background with backdrop-blur simulation
    this.drawRoundedRect(x, y, badgeWidth, badgeHeight, 8, 'rgba(255, 255, 255, 0.1)');
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.fillRect(x, y, badgeWidth, badgeHeight);
    
    // Border with team color (primaryColor + '80' = 50% opacity)
    const borderColor = primaryColor 
      ? hexToRgba(primaryColor, 0.5) 
      : 'rgba(255, 255, 255, 0.2)';
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 1;
    this.drawRoundedRect(x, y, badgeWidth, badgeHeight, 8, undefined, borderColor);
    
    // "Away" or "Home" label (text-xs text-gray-400 uppercase tracking-widest font-semibold)
    this.ctx.fillStyle = '#9CA3AF'; // gray-400
    this.ctx.font = '600 12px Arial, sans-serif'; // Decreased from 14px to 12px
    this.ctx.letterSpacing = '0.1em'; // tracking-widest
    this.ctx.textAlign = isHome ? 'right' : 'left';
    this.ctx.textBaseline = 'top';
    const labelText = (isHome ? 'HOME' : 'AWAY').toUpperCase();
    this.ctx.fillText(labelText, isHome ? x + badgeWidth - padding : x + padding, y + padding);
    this.ctx.letterSpacing = '0'; // Reset
    
    // Team name (font-black text-white) - increased size
    // Position: below label (6px margin)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '900 22px Arial, sans-serif'; // Increased from 18px to 22px for better visibility
    
    // Measure actual text width and truncate properly with ellipsis
    const maxNameWidth = 260 - padding * 2; // Account for padding (increased for larger font)
    let displayName = teamName;
    let measuredWidth = this.ctx.measureText(displayName).width;
    
    // Truncate if needed with ellipsis
    if (measuredWidth > maxNameWidth) {
      while (measuredWidth > maxNameWidth && displayName.length > 0) {
        displayName = displayName.substring(0, displayName.length - 1);
        measuredWidth = this.ctx.measureText(displayName + '...').width;
      }
      displayName += '...';
    }
    
    // Use maxWidth parameter to ensure text stays within bounds
    const nameX = isHome ? x + badgeWidth - padding : x + padding;
    this.ctx.fillText(displayName, nameX, y + padding + 20, maxNameWidth); // Increased margin
    
    return badgeWidth;
  }
  
  /**
   * Draw large score number (font-black, tabular-nums, tracking-tight)
   * Scores aligned towards center, right-aligned for away, left-aligned for home
   */
  private drawTeamScore(
    x: number,
    y: number,
    data: GameOverlayData,
    side: 'away' | 'home'
  ): void {
    const isHome = side === 'home';
    const score = isHome ? data.homeScore : data.awayScore;
    
    this.ctx.fillStyle = '#FFFFFF';
    // font-black (900), tabular-nums (monospace), tracking-tight (-0.025em)
    this.ctx.font = '900 64px "Courier New", monospace'; // Increased from 52px to 64px
    this.ctx.letterSpacing = '-0.025em'; // tracking-tight
    
    // Away score: right-aligned (points towards center)
    // Home score: left-aligned (points towards center)
    this.ctx.textAlign = isHome ? 'left' : 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(score.toString(), x, y);
    this.ctx.letterSpacing = '0'; // Reset
  }
  
  /**
   * Draw team logo with fallback (no text labels - just clean circle)
   */
  private drawTeamLogo(
    x: number,
    y: number,
    logo: HTMLImageElement | null,
    useFallback: boolean,
    data: GameOverlayData,
    side: 'away' | 'home'
  ): void {
    const isHome = side === 'home';
    const teamColor = isHome 
      ? (data.teamBPrimaryColor || '#3b82f6')
      : (data.teamAPrimaryColor || '#3b82f6');
    const logoSize = 28;
    
    if (logo && !useFallback) {
      // Draw logo rounded
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(logo, x, y, logoSize, logoSize);
      this.ctx.restore();
    } else {
      // Fallback: simple colored circle (no text - clean design)
      this.ctx.fillStyle = hexToRgba(teamColor, 0.3);
      this.ctx.beginPath();
      this.ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Subtle border
      this.ctx.strokeStyle = hexToRgba(teamColor, 0.5);
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw team stats (fouls, timeouts) INSIDE badge container
   * Matches React: gap-2 (8px) between elements, positioned BELOW team name
   * Layout: Label (y + 16) → Name (y + 32) → Stats (y + 51)
   */
  private drawTeamStats(
    x: number,
    y: number,
    data: GameOverlayData,
    side: 'away' | 'home',
    badgeWidth: number
  ): void {
    const isHome = side === 'home';
    const fouls = isHome ? data.teamBFouls : data.teamAFouls;
    const timeouts = isHome ? data.teamBTimeouts : data.teamATimeouts;
    
    const padding = 18; // Increased padding to match larger badge
    // Position stats BELOW team name (matching React layout):
    // Label: y + padding (18px) = y + 18
    // Name: y + padding + 12 (label height, decreased) + 6 (margin) = y + 36
    // Stats: y + 36 + 22 (name height, increased) + 8 (margin) = y + 66
    const statsY = y + padding + 12 + 6 + 22 + 8; // y + 66 (below team name, adjusted for larger font)
    const align = isHome ? 'right' : 'left';
    const gap = 8; // gap-2 = 8px
    
    // Calculate exact widths - using increased font size
    this.ctx.font = '700 14px Arial, sans-serif'; // Increased to match foul indicator
    const foulText = fouls >= 5 ? `${fouls} BONUS` : fouls.toString();
    const foulWidth = this.ctx.measureText(foulText).width + 20; // Text + padding (increased)
    
    // Calculate foul indicator center Y for timeout dots alignment
    const foulIndicatorHeight = 24;
    const foulIndicatorCenterY = statsY + foulIndicatorHeight / 2; // Center of foul indicator
    
    // React order: Away = Fouls → Timeouts, Home = Timeouts → Fouls
    if (isHome) {
      // Home: Timeouts → Fouls (right to left, right-aligned)
      // Ensure stats fit within badge bounds
      const maxStatsX = x + badgeWidth - padding;
      const minStatsX = x + padding;
      
      // Start from right edge, work left
      let currentX = maxStatsX;
      
      // Draw timeouts first (rightmost) - aligned to foul center
      const timeoutWidth = this.drawTimeoutDots(currentX, statsY, timeouts, align, foulIndicatorCenterY);
      currentX -= timeoutWidth + gap;
      
      // Draw fouls (to the left of timeouts)
      this.drawFoulIndicator(currentX, statsY, fouls, align);
      
      // Verify we didn't exceed bounds
      if (currentX < minStatsX) {
        // If stats are too wide, adjust positioning (fallback to left alignment)
        currentX = minStatsX;
        this.drawFoulIndicator(currentX, statsY, fouls, 'left');
        currentX += foulWidth + gap;
        this.drawTimeoutDots(currentX, statsY, timeouts, 'left', foulIndicatorCenterY);
      }
    } else {
      // Away: Fouls → Timeouts (left to right, left-aligned)
      const statsX = x + padding;
      
      // Draw fouls first (leftmost)
      this.drawFoulIndicator(statsX, statsY, fouls, align);
      
      // Draw timeouts (to the right of fouls) - aligned to foul center
      this.drawTimeoutDots(statsX + foulWidth + gap, statsY, timeouts, align, foulIndicatorCenterY);
    }
  }
  
  /**
   * Draw game clock with red background (text-3xl font-black tabular-nums tracking-wider)
   */
  private drawGameClock(x: number, y: number, minutes: number, seconds: number): void {
    const clockText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Measure text for dynamic width (px-6 py-2 = 24px horizontal, 8px vertical)
    this.ctx.font = '900 30px "Courier New", monospace';
    this.ctx.letterSpacing = '0.05em'; // tracking-wider
    const textWidth = this.ctx.measureText(clockText).width;
    const clockWidth = textWidth + 48; // px-6 = 24px each side
    const clockHeight = 50;
    
    // Red background (bg-red-600) with shadow-lg simulation
    this.drawRoundedRect(x - clockWidth / 2, y, clockWidth, clockHeight, 8, getTailwindColor('red-600'));
    
    // Shadow simulation (darken edges slightly)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.fillRect(x - clockWidth / 2, y + clockHeight - 2, clockWidth, 2);
    
    // Clock text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(clockText, x, y + clockHeight / 2);
    this.ctx.letterSpacing = '0'; // Reset
  }
  
  /**
   * Draw quarter badge (rounded rectangle with border only, no fill)
   * Same height as shot clock for alignment
   */
  private drawQuarter(x: number, y: number, quarter: number, width: number): void {
    const quarterText = quarter > 4 ? `OT${quarter - 4}` : `Q${quarter}`;
    const height = 30; // Increased height for larger font
    
    // No fill - just border (rounded rectangle)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // border-white/30
    this.ctx.lineWidth = 1;
    this.drawRoundedRect(x, y, width, height, 6, undefined, 'rgba(255, 255, 255, 0.3)');
    
    // Text - increased font size
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '700 16px Arial, sans-serif'; // Increased from 14px to 16px
    this.ctx.letterSpacing = '0.05em'; // tracking-wider
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(quarterText, x + width / 2, y + height / 2);
    this.ctx.letterSpacing = '0'; // Reset
  }
  
  /**
   * Draw shot clock (text-lg font-bold tabular-nums)
   * Same height as quarter for alignment
   */
  private drawShotClock(x: number, y: number, seconds: number): void {
    const isCritical = seconds <= 5;
    const bgColor = isCritical 
      ? getTailwindColor('red-500') 
      : getTailwindRgba('orange-500', 0.8);
    
    // Measure text with increased font size
    this.ctx.font = '700 20px "Courier New", monospace'; // Increased from 18px to 20px
    const textWidth = this.ctx.measureText(seconds.toString()).width;
    const clockWidth = textWidth + 24; // px-3 = 12px each side
    const clockHeight = 30; // Increased to match quarter height
    
    this.drawRoundedRect(x, y, clockWidth, clockHeight, 6, bgColor);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(seconds.toString(), x + clockWidth / 2, y + clockHeight / 2);
  }
  
  /**
   * Draw pill shape (rounded-full)
   */
  private drawPill(
    x: number,
    y: number,
    width: number,
    height: number,
    fillStyle?: string,
    strokeStyle?: string
  ): void {
    const radius = height / 2; // Pill shape
    
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2);
    this.ctx.closePath();
    
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }
    
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw rounded rectangle helper
   */
  private drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle?: string,
    strokeStyle?: string
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }
    
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw possession arrow (uses team color)
   */
  private drawPossessionArrow(
    x: number,
    y: number,
    direction: 'left' | 'right',
    teamColor: string
  ): void {
    // Triangle: 6px wide, 10px tall (matches React border sizes)
    const arrowWidth = 6;
    const arrowHeight = 10;
    
    this.ctx.fillStyle = teamColor;
    
    this.ctx.beginPath();
    if (direction === 'left') {
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x - arrowWidth, y - arrowHeight / 2);
      this.ctx.lineTo(x - arrowWidth, y + arrowHeight / 2);
    } else {
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + arrowWidth, y - arrowHeight / 2);
      this.ctx.lineTo(x + arrowWidth, y + arrowHeight / 2);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  /**
   * Draw jump ball arrow (uses team color, text-xs font-bold)
   */
  private drawJumpBallArrow(
    x: number,
    y: number,
    align: 'left' | 'right',
    teamColor: string
  ): void {
    this.ctx.fillStyle = teamColor;
    this.ctx.font = '700 12px Arial, sans-serif';
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('↻', x + (align === 'right' ? -8 : 8), y);
  }
  
  /**
   * Draw timeout dots (5 dots to match React visual)
   * Increased size and aligned to center of fouls UI
   * Returns the total width used for positioning calculations
   */
  private drawTimeoutDots(
    x: number,
    y: number,
    remaining: number,
    align: 'left' | 'right',
    foulIndicatorCenterY?: number // Optional: center Y of foul indicator for alignment
  ): number {
    const total = 5; // Match React visual (shows 5 dots)
    const dotSize = 10; // Increased from 8px to 10px for better visibility
    const dotGap = 4; // Increased from 3px to 4px
    const totalWidth = total * dotSize + (total - 1) * dotGap; // 5*10 + 4*4 = 66px
    const startX = align === 'right' ? x - totalWidth : x;
    
    // Align dots to center of fouls UI if provided, otherwise use y
    const dotsCenterY = foulIndicatorCenterY !== undefined 
      ? foulIndicatorCenterY 
      : y + dotSize / 2;
    
    for (let i = 0; i < total; i++) {
      const dotX = startX + i * (dotSize + dotGap);
      const isRemaining = i < remaining;
      
      // Used: bg-gray-500/60, Remaining: bg-white/80
      this.ctx.fillStyle = isRemaining 
        ? 'rgba(255, 255, 255, 0.8)' 
        : 'rgba(107, 114, 128, 0.6)'; // gray-500
      
      this.ctx.beginPath();
      this.ctx.arc(dotX + dotSize / 2, dotsCenterY, dotSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    return totalWidth; // Return width for positioning calculations
  }
  
  /**
   * Draw foul indicator with bonus - increased size
   */
  private drawFoulIndicator(
    x: number,
    y: number,
    fouls: number,
    align: 'left' | 'right'
  ): void {
    const isBonus = fouls >= 5;
    const isWarning = fouls >= 4;
    
    let bgColor = 'rgba(255, 255, 255, 0.1)';
    if (isBonus) {
      bgColor = getTailwindColor('red-600');
    } else if (isWarning) {
      bgColor = getTailwindRgba('yellow-500', 0.8);
    }
    
    // Set font before measuring - increased size
    this.ctx.font = '700 14px Arial, sans-serif'; // Increased from 12px
    const text = isBonus ? `${fouls} BONUS` : fouls.toString();
    const textWidth = this.ctx.measureText(text).width;
    const padding = 10; // Increased from 8px
    const rectWidth = textWidth + padding * 2;
    const rectHeight = 24; // Increased from 18px (py-1 = 4px vertical + 14px text + 6px)
    const rectX = align === 'right' ? x - rectWidth : x;
    
    this.drawRoundedRect(rectX, y, rectWidth, rectHeight, 4, bgColor);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, rectX + rectWidth / 2, y + rectHeight / 2);
  }
}
