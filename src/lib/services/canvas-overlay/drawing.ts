/**
 * Canvas Overlay Drawing Methods
 * 
 * All drawing logic for rendering game overlay to Canvas.
 * Matches React EnhancedScoreOverlay component exactly.
 * Each method stays under 40 lines to comply with .cursorrules
 */

import { GameOverlayData, getContrastSafeBarColor, getTailwindColor, getTailwindRgba, hexToRgba } from './utils';

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
   * Currently disabled - no background gradient
   */
  drawBackground(): void {
    // Gradient background removed for cleaner NBA-style look
    // No background drawing
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
    const padding = 32;
    const centerX = this.width / 2;
    
    // NBA-style dimensions
    const logoSize = 52; // Increased from 32px - prominent like NBA
    const logoGap = 16; // Gap between logo and badge
    const scoreFontSize = 80; // Increased from 72px for NBA impact
    const scoreTopY = 56;
    const scoreCenterY = scoreTopY + scoreFontSize / 2;
    
    // Badge dimensions (simplified - no logo inside)
    const badgeHeight = 70; // Reduced - cleaner without logo inside
    const badgeTopY = scoreCenterY - badgeHeight / 2;
    
    // Score positions - increased gap from center for breathing room
    const scoreOffsetFromCenter = 180;
    const awayScoreX = centerX - scoreOffsetFromCenter;
    const homeScoreX = centerX + scoreOffsetFromCenter;
    
    // Logo vertical centering
    const logoY = scoreCenterY - logoSize / 2;
    
    if (isHome) {
      // Home: [Score] [Badge] [Logo] (right side)
      const rightEdgeX = containerStartX + this.MAX_WIDTH - padding;
      
      // Logo at far right
      const logoX = rightEdgeX - logoSize;
      this.drawTeamLogo(logoX, logoY, teamLogo, teamLogoFallback, data, side, logoSize);
      
      // Badge next to logo
      const badgeWidth = this.calculateBadgeWidth(data.teamBName);
      const badgeX = logoX - logoGap - badgeWidth;
      this.drawTeamBadge(badgeX, badgeTopY, data, side);
      
      // Score towards center
      this.drawTeamScore(homeScoreX, scoreTopY, data, side);
      
      // Stats below badge
      this.drawTeamStats(badgeX, badgeTopY, data, side, badgeWidth);
    } else {
      // Away: [Logo] [Badge] [Score] (left side)
      const leftStartX = containerStartX + padding;
      
      // Logo at far left
      this.drawTeamLogo(leftStartX, logoY, teamLogo, teamLogoFallback, data, side, logoSize);
      
      // Badge next to logo
      const badgeX = leftStartX + logoSize + logoGap;
      const badgeWidth = this.drawTeamBadge(badgeX, badgeTopY, data, side);
      
      // Score towards center
      this.drawTeamScore(awayScoreX, scoreTopY, data, side);
      
      // Stats below badge
      this.drawTeamStats(badgeX, badgeTopY, data, side, badgeWidth);
    }
  }
  
  /**
   * Draw center section (clock, quarter, shot clock)
   * Grouped together and aligned as a unit with score center
   * Quarter and shot clock on same row
   */
  drawCenterSection(data: GameOverlayData): void {
    const x = this.width / 2;
    
    // Calculate vertical center of score for alignment (matches drawTeamSection)
    const scoreFontSize = 80; // Matches NBA-style score font
    const scoreTopY = 56;
    const scoreCenterY = scoreTopY + scoreFontSize / 2;
    
    // Group dimensions - updated to match enhanced clock
    const clockHeight = 54; // Increased from 50px to match enhanced game clock
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
   * Calculate badge width without drawing (for positioning)
   * NBA-style: simplified badge without logo inside
   */
  private calculateBadgeWidth(teamName: string): number {
    const padding = 24;
    const teamNameFontSize = 26; // Matches drawTeamBadge
    this.ctx.font = `800 ${teamNameFontSize}px Arial, sans-serif`;
    const nameWidth = Math.min(this.ctx.measureText(teamName).width, 220);
    return Math.max(padding + nameWidth + padding, 160);
  }
  
  /**
   * Draw team badge with name only (NBA-style - logo is separate)
   * Clean, minimal badge with team name centered
   * Returns badge width for positioning calculations
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
    const padding = 24;
    let teamNameFontSize = 26; // Increased from 20px
    
    // Measure badge width - simpler without logo
    this.ctx.font = `800 ${teamNameFontSize}px Arial, sans-serif`;
    const nameWidth = Math.min(this.ctx.measureText(teamName).width, 220);
    const badgeWidth = Math.max(padding + nameWidth + padding, 160);
    const badgeHeight = 75; // Slightly increased to accommodate larger font
    const maxNameWidth = badgeWidth - padding * 2;
    
    // Badge background - clean with team color accent
    const bgColor = primaryColor 
      ? hexToRgba(getContrastSafeBarColor(primaryColor), 0.25)
      : 'rgba(255, 255, 255, 0.12)';
    this.drawRoundedRect(x, y, badgeWidth, badgeHeight, 8, bgColor);
    
    // Strong border with team color
    const borderColor = primaryColor 
      ? hexToRgba(getContrastSafeBarColor(primaryColor), 0.8)
      : 'rgba(255, 255, 255, 0.4)';
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.drawRoundedRect(x, y, badgeWidth, badgeHeight, 8, undefined, borderColor);
    
    // Team name - centered vertically and horizontally
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `800 ${teamNameFontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Scale font down if name too wide before truncating
    const fontSizes = [26, 22, 18];
    let chosenSize = 26;
    for (const size of fontSizes) {
      this.ctx.font = `800 ${size}px Arial, sans-serif`;
      if (this.ctx.measureText(teamName).width <= maxNameWidth) {
        chosenSize = size;
        break;
      }
    }
    this.ctx.font = `800 ${chosenSize}px Arial, sans-serif`;
    teamNameFontSize = chosenSize;
    
    // Truncate if needed
    let displayName = teamName;
    let measuredWidth = this.ctx.measureText(displayName).width;
    if (measuredWidth > maxNameWidth) {
      while (measuredWidth > maxNameWidth && displayName.length > 0) {
        displayName = displayName.substring(0, displayName.length - 1);
        measuredWidth = this.ctx.measureText(displayName + '...').width;
      }
      displayName += '...';
    }
    
    // Draw centered text with shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    this.ctx.fillText(displayName, x + badgeWidth / 2, y + badgeHeight / 2);
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    return badgeWidth;
  }
  
  /**
   * Draw large score number (NBA-style bold)
   * Scores aligned towards center, right-aligned for away, left-aligned for home
   */
  private drawTeamScore(
    x: number,
    y: number,
    data: GameOverlayData,
    side: 'away' | 'home'
  ): void {
    const isHome = side === 'home';
    const score = isHome ? data.awayScore : data.homeScore;
    
    // NBA-style large bold score
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '900 80px "Arial Black", Arial, sans-serif';
    this.ctx.letterSpacing = '-0.02em';
    
    // Strong shadow for depth
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    // Away score: right-aligned (points towards center)
    // Home score: left-aligned (points towards center)
    this.ctx.textAlign = isHome ? 'left' : 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(score.toString(), x, y);
    
    // Reset
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.letterSpacing = '0';
  }
  
  /**
   * Draw team logo with fallback (square with rounded corners)
   * Enhanced with shadow for depth
   */
  private drawTeamLogo(
    x: number,
    y: number,
    logo: HTMLImageElement | null,
    useFallback: boolean,
    data: GameOverlayData,
    side: 'away' | 'home',
    logoSize: number = 32
  ): void {
    const isHome = side === 'home';
    const teamColor = isHome 
      ? (data.teamBPrimaryColor || '#3b82f6')
      : (data.teamAPrimaryColor || '#3b82f6');
    const cornerRadius = 6; // Rounded corners for square
    
    if (logo && !useFallback) {
      // Draw logo with shadow in square shape
      this.ctx.save();
      
      // Add drop shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 3;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      
      // Create rounded square path for clipping
      this.ctx.beginPath();
      this.ctx.moveTo(x + cornerRadius, y);
      this.ctx.lineTo(x + logoSize - cornerRadius, y);
      this.ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + cornerRadius);
      this.ctx.lineTo(x + logoSize, y + logoSize - cornerRadius);
      this.ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - cornerRadius, y + logoSize);
      this.ctx.lineTo(x + cornerRadius, y + logoSize);
      this.ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - cornerRadius);
      this.ctx.lineTo(x, y + cornerRadius);
      this.ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.drawImage(logo, x, y, logoSize, logoSize);
      this.ctx.restore();
      
      // Border around square logo
      this.ctx.strokeStyle = hexToRgba(teamColor, 0.4);
      this.ctx.lineWidth = 2;
      this.drawRoundedRect(x, y, logoSize, logoSize, cornerRadius, undefined, hexToRgba(teamColor, 0.4));
    } else {
      // Fallback: simple colored square with enhanced styling
      this.ctx.save();
      
      // Add shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 3;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      
      // Draw rounded square background
      this.ctx.fillStyle = hexToRgba(teamColor, 0.3);
      this.drawRoundedRect(x, y, logoSize, logoSize, cornerRadius, hexToRgba(teamColor, 0.3));
      
      this.ctx.restore();
      
      // Border
      this.ctx.strokeStyle = hexToRgba(teamColor, 0.5);
      this.ctx.lineWidth = 2;
      this.drawRoundedRect(x, y, logoSize, logoSize, cornerRadius, undefined, hexToRgba(teamColor, 0.5));
    }
  }
  
  /**
   * Draw team stats (fouls, timeouts) BELOW the badge
   * NBA-style: clean row of indicators below team name badge
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
    
    const badgeHeight = 70; // Matches simplified badge
    const statsGap = 8; // Gap below badge
    const statsY = y + badgeHeight + statsGap;
    const gap = 10; // Gap between fouls and timeouts
    
    // Calculate foul indicator dimensions
    this.ctx.font = '700 14px Arial, sans-serif';
    const foulText = fouls >= 5 ? `${fouls} BONUS` : fouls.toString();
    const foulWidth = this.ctx.measureText(foulText).width + 24;
    const foulIndicatorHeight = 26;
    const foulIndicatorCenterY = statsY + foulIndicatorHeight / 2;
    
    if (isHome) {
      // Home: Stats right-aligned under badge
      const statsEndX = x + badgeWidth;
      
      // Draw timeouts first (rightmost)
      const timeoutWidth = this.drawTimeoutDots(statsEndX, statsY, timeouts, 'right', foulIndicatorCenterY);
      
      // Draw fouls to the left of timeouts
      this.drawFoulIndicator(statsEndX - timeoutWidth - gap, statsY, fouls, 'right');
    } else {
      // Away: Stats left-aligned under badge
      const statsStartX = x;
      
      // Draw fouls first (leftmost)
      this.drawFoulIndicator(statsStartX, statsY, fouls, 'left');
      
      // Draw timeouts to the right of fouls
      this.drawTimeoutDots(statsStartX + foulWidth + gap, statsY, timeouts, 'left', foulIndicatorCenterY);
    }
  }
  
  /**
   * Draw game clock with red background (text-3xl font-black tabular-nums tracking-wider)
   * Enhanced with gradient, larger size, and stronger shadows for NBA-style
   */
  private drawGameClock(x: number, y: number, minutes: number, seconds: number): void {
    const clockText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Measure text for dynamic width - increased font size
    this.ctx.font = '900 34px "Courier New", monospace'; // Increased from 30px to 34px
    this.ctx.letterSpacing = '0.05em'; // tracking-wider
    const textWidth = this.ctx.measureText(clockText).width;
    const clockWidth = textWidth + 52; // Increased padding
    const clockHeight = 54; // Increased from 50px
    
    const clockX = x - clockWidth / 2;
    
    // Red background with gradient (darker at bottom for depth)
    const gradient = this.ctx.createLinearGradient(clockX, y, clockX, y + clockHeight);
    gradient.addColorStop(0, getTailwindColor('red-600'));
    gradient.addColorStop(1, getTailwindColor('red-700')); // Darker at bottom
    this.drawRoundedRect(clockX, y, clockWidth, clockHeight, 8, gradient);
    
    // Stronger shadow for prominence
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 3;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.fillRect(clockX, y + clockHeight - 3, clockWidth, 3);
    this.ctx.restore();
    
    // Subtle inner highlight at top
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(clockX, y, clockWidth, 2);
    
    // Clock text with shadow
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Add text shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 2;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    
    this.ctx.fillText(clockText, x, y + clockHeight / 2);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
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
   * Returns black or white text color for sufficient contrast on team-color backgrounds
   */
  private getContrastSafeTextColor(hexColor: string): string {
    try {
      const hex = hexColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.7 ? '#111111' : '#ffffff';
    } catch {
      return '#ffffff';
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
    this.ctx.fillStyle = this.getContrastSafeTextColor(teamColor);
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
