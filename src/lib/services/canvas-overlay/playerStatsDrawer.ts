/**
 * Player Stats Overlay Drawer
 * 
 * NBA-style player stats card that displays during free throws.
 * Follows existing overlay design patterns (gradients, colors, typography).
 * Separated from main drawing.ts to comply with .cursorrules (<500 lines).
 */

import { LogoCache, PlayerStatsOverlayData } from './utils';

export class PlayerStatsDrawer {
  // Card dimensions (NBA broadcast style - larger for TV visibility)
  private readonly CARD_WIDTH = 800;
  private readonly CARD_HEIGHT = 160;
  private readonly CARD_RADIUS = 16;
  private readonly PHOTO_SIZE = 120;
  private readonly SAFE_MARGIN = 80; // Safe area from bottom edge

  constructor(
    private ctx: CanvasRenderingContext2D,
    private logoCache: LogoCache,
    private canvasWidth: number,
    private canvasHeight: number
  ) {}
  
  /**
   * Draw the player stats overlay card at bottom-center
   * Only draws if player data is visible and not expired
   */
  async draw(data: PlayerStatsOverlayData): Promise<void> {
    if (!data.isVisible) return;

    // Check if overlay should auto-hide
    if (data.showUntil && Date.now() > data.showUntil) return;

    // Position: bottom-center with safe margin
    const x = (this.canvasWidth - this.CARD_WIDTH) / 2;
    const y = this.canvasHeight - this.CARD_HEIGHT - this.SAFE_MARGIN;

    this.ctx.save();
    this.drawCardBackground(x, y, data.teamPrimaryColor);
    await this.drawPlayerPhoto(x, y, data.profilePhotoUrl);
    this.drawPlayerInfo(x, y, data);
    this.drawGameStats(x, y, data);
    this.ctx.restore();
  }
  
  /**
   * Draw card background with team color accent
   */
  private drawCardBackground(x: number, y: number, teamColor?: string): void {
    // Shadow first
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    this.ctx.shadowBlur = 30;
    this.ctx.shadowOffsetY = 8;
    
    // Main background: semi-transparent dark
    const bgGradient = this.ctx.createLinearGradient(x, y, x, y + this.CARD_HEIGHT);
    bgGradient.addColorStop(0, 'rgba(15, 15, 20, 0.95)');
    bgGradient.addColorStop(1, 'rgba(10, 10, 15, 0.95)');
    
    this.drawRoundedRect(x, y, this.CARD_WIDTH, this.CARD_HEIGHT, this.CARD_RADIUS, bgGradient);
    
    // Reset shadow for other elements
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Team color accent border on left side
    const accentColor = teamColor || '#3B82F6'; // Default blue
    const accentWidth = 6;
    
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, accentWidth, this.CARD_HEIGHT, [this.CARD_RADIUS, 0, 0, this.CARD_RADIUS]);
    this.ctx.fillStyle = accentColor;
    this.ctx.fill();
    
    // Subtle top highlight line
    this.ctx.beginPath();
    this.ctx.moveTo(x + this.CARD_RADIUS, y);
    this.ctx.lineTo(x + this.CARD_WIDTH - this.CARD_RADIUS, y);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
  
  /**
   * Draw player photo (circular, with fallback)
   */
  private async drawPlayerPhoto(cardX: number, cardY: number, photoUrl?: string): Promise<void> {
    const photoX = cardX + 20;
    const photoY = cardY + (this.CARD_HEIGHT - this.PHOTO_SIZE) / 2;
    const radius = this.PHOTO_SIZE / 2;
    const centerX = photoX + radius;
    const centerY = photoY + radius;

    // Always draw background circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    if (photoUrl) {
      const photo = await this.logoCache.load(photoUrl);
      if (photo) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.drawImage(photo, photoX, photoY, this.PHOTO_SIZE, this.PHOTO_SIZE);
        this.ctx.restore();
        return;
      }
    }

    // Fallback — placeholder silhouette
    this.drawPhotoPlaceholder(centerX, centerY, radius);
  }
  
  /**
   * Format player name as NBA style: "F. LASTNAME" (first initial + last name)
   * Includes suffixes (JR, SR, I, II, III, etc.) with last name
   */
  private formatPlayerNameForOverlay(fullName: string): string {
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) return fullName;
    if (nameParts.length === 1) return nameParts[0].toUpperCase();
    
    // Common name suffixes
    const suffixes = ['JR', 'SR', 'I', 'II', 'III', 'IV', 'V'];
    const lastPart = nameParts[nameParts.length - 1].toUpperCase();
    const secondLastPart = nameParts.length > 1 ? nameParts[nameParts.length - 2].toUpperCase() : '';
    
    // Check if last part is a suffix
    const isSuffix = suffixes.includes(lastPart);
    
    // Build last name: if suffix exists, include it
    let lastName = '';
    if (isSuffix && nameParts.length >= 2) {
      // Last name + suffix (e.g., "JAMESON JR")
      lastName = `${secondLastPart} ${lastPart}`;
    } else {
      // Just last name
      lastName = lastPart;
    }
    
    // First initial + last name (with suffix if applicable)
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    return `${firstInitial}. ${lastName}`;
  }
  
  /**
   * Draw placeholder icon when no photo available
   */
  private drawPhotoPlaceholder(centerX: number, centerY: number, radius: number): void {
    // Simple person silhouette
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    
    // Head
    const headRadius = radius * 0.28;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - radius * 0.18, headRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body (shoulders arc)
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY + radius * 0.55, radius * 0.45, Math.PI, 0);
    this.ctx.fill();
  }
  
  /**
   * Draw player info: Team name on top, Player name below (aligned), FT line at bottom
   */
  private drawPlayerInfo(cardX: number, cardY: number, data: PlayerStatsOverlayData): void {
    const infoX = cardX + this.PHOTO_SIZE + 36;
    const topY = cardY + 35;
    
    // Team name (gray, on TOP)
    this.ctx.fillStyle = '#9CA3AF'; // gray-400
    this.ctx.font = '600 18px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(data.teamName.toUpperCase(), infoX, topY);
    
    // Player name line (below team name) - ALIGNED with team name
    const nameY = topY + 40;
    
    // Build player display: "#23 PLAYER NAME" as single string, aligned to infoX
    let playerDisplay = '';
    if (data.jerseyNumber !== undefined) {
      playerDisplay = `#${data.jerseyNumber} `;
    }
    playerDisplay += data.playerName.toUpperCase();
    
    // Format player name as NBA style (first initial + last name)
    const formattedPlayerName = this.formatPlayerNameForOverlay(data.playerName);
    
    // Draw jersey number part - use bright yellow/gold for visibility (NBA style)
    if (data.jerseyNumber !== undefined) {
      this.ctx.fillStyle = '#FBBF24'; // Bright amber/gold - always visible on dark bg
      this.ctx.font = '800 32px "Arial Black", Arial, sans-serif';
      this.ctx.textAlign = 'left';
      const jerseyText = `#${data.jerseyNumber}`;
      this.ctx.fillText(jerseyText, infoX, nameY);
      
      // Measure jersey text width to position player name
      const jerseyWidth = this.ctx.measureText(jerseyText + ' ').width;
      
      // Draw player name in white, continuing after jersey (NBA format)
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(formattedPlayerName, infoX + jerseyWidth, nameY);
    } else {
      // No jersey number, just player name (NBA format)
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '800 32px "Arial Black", Arial, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(formattedPlayerName, infoX, nameY);
    }
    
    // Free throw line (at bottom of info section)
    this.drawFreeThrowLine(infoX, topY + 85, data);
  }
  
  /**
   * Draw free throw shooting line (e.g., "FT: 8/10 (80%)")
   */
  private drawFreeThrowLine(x: number, y: number, data: PlayerStatsOverlayData): void {
    const ftMade = data.freeThrowMade;
    const ftAttempts = data.freeThrowAttempts;
    const ftPercent = ftAttempts > 0 ? Math.round((ftMade / ftAttempts) * 100) : 0;
    
    // Label - LARGER
    this.ctx.fillStyle = '#9CA3AF'; // gray-400
    this.ctx.font = '700 22px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('FT:', x, y);
    
    // Stats (highlighted) - LARGER
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '800 28px "Arial Black", Arial, sans-serif';
    const statsText = `${ftMade}/${ftAttempts}`;
    this.ctx.fillText(statsText, x + 50, y);
    
    // Percentage (colored based on performance) - LARGER
    const percentColor = ftPercent >= 80 ? '#22C55E' : ftPercent >= 60 ? '#EAB308' : '#EF4444';
    this.ctx.fillStyle = percentColor;
    this.ctx.font = '800 24px Arial, sans-serif';
    this.ctx.fillText(`(${ftPercent}%)`, x + 140, y);
  }
  
  /**
   * Draw current game stats (PTS, REB, AST columns) - NBA STYLE
   */
  private drawGameStats(cardX: number, cardY: number, data: PlayerStatsOverlayData): void {
    const statsStartX = cardX + this.CARD_WIDTH - 220;
    const centerY = cardY + this.CARD_HEIGHT / 2;
    const columnWidth = 70;
    
    const stats = [
      { label: 'PTS', value: data.points },
      { label: 'REB', value: data.rebounds },
      { label: 'AST', value: data.assists },
    ];
    
    // Separator line before stats
    this.ctx.beginPath();
    this.ctx.moveTo(statsStartX - 20, cardY + 25);
    this.ctx.lineTo(statsStartX - 20, cardY + this.CARD_HEIGHT - 25);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    stats.forEach((stat, index) => {
      const colX = statsStartX + index * columnWidth;
      
      // Label (gray, uppercase) - LARGER
      this.ctx.fillStyle = '#6B7280'; // gray-500
      this.ctx.font = '700 14px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(stat.label, colX, centerY - 25);
      
      // Value (white, bold) - NBA SIZE
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '800 36px "Arial Black", Arial, sans-serif';
      this.ctx.fillText(stat.value.toString(), colX, centerY + 18);
    });
  }
  
  /**
   * Helper: Draw rounded rectangle
   */
  private drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string | CanvasGradient
  ): void {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.ctx.fillStyle = fillStyle;
    this.ctx.fill();
  }
}
