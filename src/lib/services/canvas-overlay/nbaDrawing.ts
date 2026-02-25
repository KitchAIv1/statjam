/**
 * NBA-Style Overlay Drawing Methods
 * 
 * ESPN/NBA broadcast-style horizontal bar overlay.
 * Option 2 variant - keeps classic overlay as Option 1.
 * Follows .cursorrules: under 500 lines, functions under 40 lines.
 */

import { GameOverlayData, getContrastSafeBarColor, getTailwindColor, hexToRgba } from './utils';

export class NBAOverlayDrawer {
  private readonly MAX_WIDTH = 850;  // Compressed more for tighter layout
  private readonly BAR_HEIGHT = 92;  // +15% from 80
  private readonly HEADER_HEIGHT = 37;  // +15% from 32
  private readonly INFO_BAR_HEIGHT = 46;  // Half of main bar height
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number
  ) {}
  
  /**
   * Draw the complete NBA-style overlay
   */
  draw(
    data: GameOverlayData,
    teamALogo: HTMLImageElement | null,
    teamBLogo: HTMLImageElement | null,
    tournamentLogo: HTMLImageElement | null
  ): void {
    if (data.hideScoreBar) return;

    const centerX = this.width / 2;
    const barY = 20; // Top margin

    // Draw organizer header (always show branding)
    this.drawOrganizerHeader(data, tournamentLogo, centerX, barY);

    // Main scoreboard bar (flush with header - no gap)
    const mainBarY = barY + this.HEADER_HEIGHT;

    this.drawMainBar(data, teamALogo, teamBLogo, centerX, mainBarY);

    // Info bar below main bar (no gap)
    const infoBarY = mainBarY + this.BAR_HEIGHT;
    this.drawInfoBar(data, centerX, infoBarY);
  }
  
  /**
   * Draw organizer header bar
   */
  private drawOrganizerHeader(
    data: GameOverlayData,
    logo: HTMLImageElement | null,
    centerX: number,
    y: number
  ): void {
    const headerWidth = this.MAX_WIDTH;
    const startX = centerX - headerWidth / 2;
    
    // Dark background bar
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.drawRoundedRect(startX, y, headerWidth, this.HEADER_HEIGHT, 5, true);
    
    // Logo + Text centered
    const logoSize = 28;  // +15% from 24
    const textX = centerX;
    
    if (logo) {
      const logoX = centerX - 100;
      const logoY = y + (this.HEADER_HEIGHT - logoSize) / 2;
      this.ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    }
    
    // Branding text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '700 16px Arial, sans-serif';  // +15% from 14px
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      'Powered By STATJAM',
      textX,
      y + this.HEADER_HEIGHT / 2
    );
  }
  
  /**
   * Draw main scoreboard bar with team sections and clock
   */
  private drawMainBar(
    data: GameOverlayData,
    teamALogo: HTMLImageElement | null,
    teamBLogo: HTMLImageElement | null,
    centerX: number,
    y: number
  ): void {
    const clockWidth = 138;  // +15% from 120
    const teamSectionWidth = (this.MAX_WIDTH - clockWidth) / 2;
    const startX = centerX - this.MAX_WIDTH / 2;
    
    // Team A section (left - Away)
    this.drawTeamSection(
      startX,
      y,
      teamSectionWidth,
      data,
      'away',
      teamALogo
    );
    
    // Clock section (center)
    this.drawClockSection(
      startX + teamSectionWidth,
      y,
      clockWidth,
      data
    );
    
    // Team B section (right - Home)
    this.drawTeamSection(
      startX + teamSectionWidth + clockWidth,
      y,
      teamSectionWidth,
      data,
      'home',
      teamBLogo
    );
  }
  
  /**
   * Draw team section with colored background, logo, name, score, and foul indicator
   */
  private drawTeamSection(
    x: number,
    y: number,
    width: number,
    data: GameOverlayData,
    side: 'away' | 'home',
    logo: HTMLImageElement | null
  ): void {
    const isHome = side === 'home';
    const teamColor = isHome 
      ? (data.teamBPrimaryColor || '#1E40AF')
      : (data.teamAPrimaryColor || '#B91C1C');
    const teamName = isHome ? data.teamBName : data.teamAName;
    // FIX: Team A stats → homeScore, Team B stats → awayScore (match useGameOverlayData)
    const score = isHome ? data.awayScore : data.homeScore;
    const fouls = isHome ? data.teamBFouls : data.teamAFouls;
    
    // Team colored background
    this.ctx.fillStyle = getContrastSafeBarColor(teamColor);
    if (isHome) {
      this.drawRoundedRectRight(x, y, width, this.BAR_HEIGHT, 7);
    } else {
      this.drawRoundedRectLeft(x, y, width, this.BAR_HEIGHT, 7);
    }
    
    // Layout: [Logo] [Name + Fouls] ... [Score] for away
    // Layout: [Score] ... [Name + Fouls] [Logo] for home
    const padding = 10;  // +15% from 8
    const logoSize = 83;  // +15% from 72
    const scoreWidth = 69;  // +15% from 60
    const teamInfoWidth = 164;
    const logoY = y + (this.BAR_HEIGHT - logoSize) / 2;  // Center vertically (may overflow)
    
    if (isHome) {
      // Home: Score ... Name+Fouls | Logo (right side)
      // Score at left edge of section
      this.drawScore(x + padding, y, scoreWidth, score, 'left');
      // Logo at right edge
      const logoX = x + width - padding - logoSize;
      this.drawLogo(logoX, logoY, logoSize, logo, teamColor);
      // Team info RIGHT-aligned, positioned before logo
      const teamInfoX = logoX - padding - teamInfoWidth;
      this.drawTeamInfo(teamInfoX, y, teamInfoWidth, teamName, fouls, 'right');
    } else {
      // Away: Logo | Name+Fouls ... Score (left side)
      // Logo at left edge
      this.drawLogo(x + padding, logoY, logoSize, logo, teamColor);
      // Team info LEFT-aligned, positioned after logo
      const teamInfoX = x + padding + logoSize + padding;
      this.drawTeamInfo(teamInfoX, y, teamInfoWidth, teamName, fouls, 'left');
      // Score at right edge of section
      this.drawScore(x + width - scoreWidth - padding, y, scoreWidth, score, 'right');
    }
  }
  
  /**
   * Draw team logo (circular)
   */
  private drawLogo(
    x: number,
    y: number,
    size: number,
    logo: HTMLImageElement | null,
    fallbackColor: string
  ): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2;
    
    // White circle background
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    if (logo) {
      // Clip to circle and draw logo
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(logo, x + 2, y + 2, size - 4, size - 4);
      this.ctx.restore();
    } else {
      // Fallback: colored inner circle
      this.ctx.fillStyle = hexToRgba(fallbackColor, 0.3);
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  /**
   * Draw team name and foul/bonus indicator
   */
  private drawTeamInfo(
    x: number,
    y: number,
    maxWidth: number,
    teamName: string,
    fouls: number,
    align: 'left' | 'right'
  ): void {
    const nameY = y + 38;  // Pushed down (+6px)
    const foulY = y + 68;  // Pushed down (+6px)
    const effectiveWidth = maxWidth - 8;

    // Team name (full name, truncate if needed) - larger font
    this.ctx.fillStyle = '#FFFFFF';
    // Scale font down if name too wide before truncating
    const fontSizes = [28, 24, 20, 18];
    let chosenSize = 28;
    for (const size of fontSizes) {
      this.ctx.font = `800 ${size}px Arial, sans-serif`;
      if (this.ctx.measureText(teamName).width <= effectiveWidth) {
        chosenSize = size;
        break;
      }
    }
    this.ctx.font = `800 ${chosenSize}px Arial, sans-serif`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'middle';

    // Truncate name if too long
    let displayName = teamName;
    let nameWidth = this.ctx.measureText(displayName).width;
    while (nameWidth > effectiveWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
      nameWidth = this.ctx.measureText(displayName + '...').width;
    }
    if (displayName !== teamName) displayName += '...';
    
    const textX = align === 'left' ? x : x + maxWidth;
    this.ctx.fillText(displayName, textX, nameY);
    
    // Foul indicator: "BONUS" if >= 5, otherwise "X FOULS"
    this.ctx.font = '600 18px Arial, sans-serif';  // Slightly larger (16px → 18px)
    this.ctx.fillStyle = fouls >= 5 ? '#FBBF24' : 'rgba(255, 255, 255, 0.8)';
    const foulText = fouls >= 5 ? 'BONUS' : `${fouls} FOULS`;
    this.ctx.fillText(foulText, textX, foulY);
  }
  
  /**
   * Draw score number
   */
  private drawScore(
    x: number,
    y: number,
    width: number,
    score: number,
    align: 'left' | 'right'
  ): void {
    this.ctx.fillStyle = '#FFFFFF';
    // Larger, narrower font for score - Impact is condensed/narrow
    this.ctx.font = '900 72px Impact, "Arial Narrow", Haettenschweiler, sans-serif';
    this.ctx.textAlign = align === 'left' ? 'left' : 'right';
    this.ctx.textBaseline = 'middle';
    
    const textX = align === 'left' ? x : x + width;
    this.ctx.fillText(score.toString(), textX, y + this.BAR_HEIGHT / 2);
  }
  
  /**
   * Draw info bar below main scoreboard
   * Supports split layout for simultaneous team_run + milestone (NBA style)
   * Uses team colors for dynamic styling
   */
  private drawInfoBar(
    data: GameOverlayData,
    centerX: number,
    y: number
  ): void {
    const barWidth = this.MAX_WIDTH;
    const startX = centerX - barWidth / 2;
    const isShotMadePrimary = data.infoBarType === 'shot_made';
    const isShotMadeSecondary = data.infoBarSecondaryType === 'shot_made';
    const hasShotMade = isShotMadePrimary || isShotMadeSecondary;
    
    // Background: Gradient for shot_made (fades toward opposite team), dark gray otherwise
    // Works for both single and split layouts - gradient points to scoring team's side
    if (hasShotMade) {
      const shotTeamId = isShotMadePrimary ? data.infoBarTeamId : data.infoBarSecondaryTeamId;
      const teamColor = shotTeamId ? this.getTeamPrimaryColor(data, shotTeamId) : null;
      if (teamColor) {
        const isTeamA = shotTeamId === data.teamAId; // Left side team
        const gradient = this.ctx.createLinearGradient(startX, y, startX + barWidth, y);
        
        if (isTeamA) {
          // Team A (left): color on left, fade to dark on right
          gradient.addColorStop(0, teamColor);
          gradient.addColorStop(0.6, hexToRgba(teamColor, 0.4));
          gradient.addColorStop(1, 'rgba(30, 30, 30, 0.92)');
        } else {
          // Team B (right): dark on left, fade to color on right
          gradient.addColorStop(0, 'rgba(30, 30, 30, 0.92)');
          gradient.addColorStop(0.4, hexToRgba(teamColor, 0.4));
          gradient.addColorStop(1, teamColor);
        }
        this.ctx.fillStyle = gradient;
      } else {
        this.ctx.fillStyle = 'rgba(30, 30, 30, 0.92)';
      }
    } else {
      this.ctx.fillStyle = 'rgba(30, 30, 30, 0.92)';
    }
    this.drawRoundedRect(startX, y, barWidth, this.INFO_BAR_HEIGHT, 5, true);
    
    const textY = y + this.INFO_BAR_HEIGHT / 2;
    const hasSecondary = data.infoBarSecondaryLabel && data.infoBarSecondaryType;
    
    if (hasSecondary) {
      // SPLIT LAYOUT: Primary left, Secondary right
      const halfWidth = barWidth / 2;
      const leftX = startX + halfWidth / 2;
      const rightX = startX + halfWidth + halfWidth / 2;
      
      // Draw divider line
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, y + 8);
      this.ctx.lineTo(centerX, y + this.INFO_BAR_HEIGHT - 8);
      this.ctx.stroke();
      
      this.ctx.font = 'italic 700 28px Impact, "Arial Narrow", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Primary (left) - white if gradient bg (shot_made involved), else colored
      const primaryColor = hasShotMade ? '#FFFFFF' : this.getInfoBarColor(data.infoBarType, data.infoBarTeamId, data);
      this.ctx.fillStyle = this.getContrastSafeTextColor(primaryColor);
      this.ctx.fillText((data.infoBarLabel || '').toUpperCase(), leftX, textY);
      
      // Secondary (right) - white if gradient bg (shot_made involved), else colored
      const secondaryColor = hasShotMade ? '#FFFFFF' : this.getInfoBarColor(data.infoBarSecondaryType, data.infoBarSecondaryTeamId, data);
      this.ctx.fillStyle = this.getContrastSafeTextColor(secondaryColor);
      this.ctx.fillText((data.infoBarSecondaryLabel || '').toUpperCase(), rightX, textY);
    } else if (isShotMadePrimary) {
      // SHOT MADE: White text + animated +3 for 3-pointers
      this.drawShotMadeText(data, centerX, textY);
    } else {
      // SINGLE LAYOUT: Centered
      const displayText = data.infoBarLabel || 'Powered By STATJAM';
      const infoBarType = data.infoBarType || 'tournament_name';
      const color = this.getInfoBarColor(infoBarType, data.infoBarTeamId, data);
      
      this.ctx.fillStyle = this.getContrastSafeTextColor(color);
      this.ctx.font = 'italic 700 34px Impact, "Arial Narrow", Haettenschweiler, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(displayText.toUpperCase(), centerX, textY);
    }
  }
  
  /**
   * Draw shot made text with shake animation for 3-pointers
   */
  private drawShotMadeText(
    data: GameOverlayData,
    centerX: number,
    textY: number
  ): void {
    const label = data.infoBarLabel || '';
    const is3PT = data.shotMadeIs3Pointer;
    const animStart = data.shotMadeAnimationStart || 0;
    
    // Parse label: "#23 J. SMITH +3" or "#23 J. SMITH +2"
    const match = label.match(/^(.+?)\s*(\+\d)$/);
    const playerText = match ? match[1] : label;
    const pointsText = match ? match[2] : '';
    
    // Base font for player name
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'italic 700 34px Impact, "Arial Narrow", Haettenschweiler, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    if (is3PT && pointsText) {
      // Draw player name slightly left of center
      const playerWidth = this.ctx.measureText(playerText.toUpperCase()).width;
      this.ctx.textAlign = 'right';
      this.ctx.fillText(playerText.toUpperCase(), centerX - 10, textY);
      
      // Draw +3 with shake animation (larger font, exceeds bar)
      this.draw3PTWithShake(centerX + 10, textY, animStart);
    } else {
      // Regular shot: just centered text
      this.ctx.fillText(label.toUpperCase(), centerX, textY);
    }
  }
  
  /**
   * Draw +3 with shake animation - oversized font for emphasis
   */
  private draw3PTWithShake(
    x: number,
    y: number,
    animStart: number
  ): void {
    const elapsed = Date.now() - animStart;
    const shakeDuration = 1000; // 1 second of shaking
    
    // Calculate shake offset (6 oscillations, damped)
    let shakeX = 0;
    if (elapsed < shakeDuration) {
      const progress = elapsed / shakeDuration;
      const amplitude = 8 * (1 - progress); // Decays from 8px to 0
      shakeX = amplitude * Math.sin(progress * 6 * Math.PI * 2);
    }
    
    // Large font that exceeds the bar height
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'italic 900 56px Impact, "Arial Narrow", Haettenschweiler, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    // Glow effect for emphasis
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    this.ctx.shadowBlur = 8;
    
    this.ctx.fillText('+3', x + shakeX, y);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
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
   * Get team primary color by team ID
   */
  private getTeamPrimaryColor(data: GameOverlayData, teamId: string): string | null {
    if (teamId === data.teamAId) return data.teamAPrimaryColor || null;
    if (teamId === data.teamBId) return data.teamBPrimaryColor || null;
    return null;
  }
  
  /**
   * Get color for info bar item - uses team colors when available
   */
  private getInfoBarColor(
    type: string | undefined,
    teamId: string | undefined,
    data: GameOverlayData
  ): string {
    // Use team color for team_run and milestone when teamId is provided
    if (teamId && (type === 'team_run' || type === 'milestone')) {
      if (teamId === data.teamAId && data.teamAPrimaryColor) {
        return data.teamAPrimaryColor;
      }
      if (teamId === data.teamBId && data.teamBPrimaryColor) {
        return data.teamBPrimaryColor;
      }
    }
    
    // Fallback to type-based colors
    switch (type) {
      case 'team_run':
        return '#FBBF24'; // Amber fallback
      case 'timeout':
        return '#EF4444'; // Red for urgency
      case 'milestone':
        return '#10B981'; // Green fallback
      case 'halftime':
      case 'overtime':
        return '#60A5FA'; // Blue for game state
      case 'tournament_name':
      default:
        return '#FFFFFF'; // White default
    }
  }
  
  /**
   * Draw center clock section
   */
  private drawClockSection(
    x: number,
    y: number,
    width: number,
    data: GameOverlayData
  ): void {
    const centerX = x + width / 2;
    
    // Dark background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(x, y, width, this.BAR_HEIGHT);
    
    // Quarter badge at top
    const quarterY = y + 9;  // +15% from 8
    const quarterText = data.quarter > 4 ? `OT${data.quarter - 4}` : `${data.quarter}${this.getOrdinalSuffix(data.quarter)}`;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.font = '700 16px Arial, sans-serif';  // +15% from 14px
    const qWidth = this.ctx.measureText(quarterText).width + 18;
    this.drawRoundedRect(centerX - qWidth / 2, quarterY, qWidth, 25, 5, true);  // +15% height
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(quarterText, centerX, quarterY + 12);  // Center in 25px height
    
    // Game clock (large, red background)
    const clockY = y + 42;  // +15% from 36
    const clockHeight = 41;  // +15% from 36
    const clockWidth = 103;  // +15% from 90
    
    // Red clock background
    this.ctx.fillStyle = getTailwindColor('red-600');
    this.drawRoundedRect(centerX - clockWidth / 2, clockY, clockWidth, clockHeight, 7, true);
    
    // Clock time
    const minutes = data.gameClockMinutes.toString();
    const seconds = data.gameClockSeconds.toString().padStart(2, '0');
    const clockText = `${minutes}:${seconds}`;
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '900 28px "Courier New", monospace';  // +15% from 24px
    this.ctx.fillText(clockText, centerX, clockY + clockHeight / 2);
  }
  
  /**
   * Get ordinal suffix (1st, 2nd, 3rd, 4th)
   */
  private getOrdinalSuffix(n: number): string {
    if (n > 4) return ''; // OT doesn't need suffix
    const suffixes = ['', 'st', 'nd', 'rd', 'th'];
    return suffixes[n] || 'th';
  }
  
  /**
   * Draw rounded rectangle (all corners)
   */
  private drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: boolean
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
    if (fill) this.ctx.fill();
  }
  
  /**
   * Draw rounded rectangle (left side rounded only)
   */
  private drawRoundedRectLeft(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width, y);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  /**
   * Draw rounded rectangle (right side rounded only)
   */
  private drawRoundedRectRight(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x, y + height);
    this.ctx.lineTo(x, y);
    this.ctx.closePath();
    this.ctx.fill();
  }
}
