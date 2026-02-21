/**
 * Canvas Overlay Renderer
 * 
 * Main orchestration class for rendering game overlay to Canvas.
 * Composites video + overlay for YouTube/Twitch broadcasting.
 * Supports multiple overlay variants: 'classic' and 'nba'.
 */

import { GameOverlayData, LogoCache, OverlayVariant } from './utils';
import { OverlayDrawer } from './drawing';
import { PlayerStatsDrawer } from './playerStatsDrawer';
import { NBAOverlayDrawer } from './nbaDrawing';

export class CanvasOverlayRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logoCache: LogoCache;
  private drawer: OverlayDrawer;
  private nbaDrawer: NBAOverlayDrawer;
  private playerStatsDrawer: PlayerStatsDrawer;
  private initialized = false;
  private variant: OverlayVariant = 'classic';
  private readonly width: number;
  private readonly height: number;
  
  constructor(width: number = 1920, height: number = 1080) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
    
    this.logoCache = new LogoCache();
    this.drawer = new OverlayDrawer(this.ctx, width, height);
    this.nbaDrawer = new NBAOverlayDrawer(this.ctx, width, height);
    this.playerStatsDrawer = new PlayerStatsDrawer(this.ctx, width, height);
  }
  
  /**
   * Set overlay variant ('classic' or 'nba')
   */
  setVariant(variant: OverlayVariant): void {
    this.variant = variant;
  }
  
  /**
   * Get current overlay variant
   */
  getVariant(): OverlayVariant {
    return this.variant;
  }
  
  /**
   * Initialize renderer (set up fonts, anti-aliasing)
   */
  async initialize(): Promise<void> {
    // Set up default font (web-safe for MVP)
    this.ctx.font = '16px Arial, sans-serif';
    
    // Enable anti-aliasing for smooth rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    this.initialized = true;
  }
  
  /**
   * Render overlay to canvas
   * Returns the canvas element with overlay drawn
   */
  async render(data: GameOverlayData): Promise<HTMLCanvasElement> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = performance.now();
    
    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Apply defaults for missing data (matches React component)
      const overlayData: GameOverlayData = {
        ...data,
        teamAFouls: data.teamAFouls ?? 0,
        teamBFouls: data.teamBFouls ?? 0,
        teamATimeouts: data.teamATimeouts ?? 5,
        teamBTimeouts: data.teamBTimeouts ?? 5,
      };
      
      // Preload logos if needed
      const teamALogo = overlayData.teamALogo 
        ? await this.logoCache.load(overlayData.teamALogo) 
        : null;
      const teamBLogo = overlayData.teamBLogo 
        ? await this.logoCache.load(overlayData.teamBLogo) 
        : null;
      const tournamentLogo = overlayData.tournamentLogo
        ? await this.logoCache.load(overlayData.tournamentLogo)
        : null;
      
      // Draw based on selected variant
      if (this.variant === 'nba') {
        // NBA-style horizontal bar overlay
        this.nbaDrawer.draw(overlayData, teamALogo, teamBLogo, tournamentLogo);
      } else {
        // Classic floating elements overlay — skip scoreboard when hideScoreBar (schedule overlay active)
        if (!overlayData.hideScoreBar) {
          this.drawer.drawBackground();

          if (overlayData.tournamentName || tournamentLogo || overlayData.venue) {
            this.drawer.drawTournamentHeader(overlayData, tournamentLogo);
          }

          this.drawer.drawTeamSection('away', overlayData, teamALogo, !teamALogo);
          this.drawer.drawTeamSection('home', overlayData, teamBLogo, !teamBLogo);
          this.drawer.drawCenterSection(overlayData);
        }
      }
      
      // Player stats overlay works with both variants
      if (overlayData.activePlayerStats) {
        this.playerStatsDrawer.draw(overlayData.activePlayerStats);
      }

      // Draw schedule overlay on canvas
      if (overlayData.scheduleOverlayVisible && overlayData.scheduleOverlayPayload) {
        await this.drawScheduleOverlay(overlayData.scheduleOverlayPayload);
      }

      // Draw lineup overlay on canvas
      if (overlayData.lineupOverlayVisible && overlayData.lineupOverlayPayload) {
        await this.drawLineupOverlay(
          overlayData.lineupOverlayPayload,
          overlayData.teamAPrimaryColor,
          overlayData.teamBPrimaryColor
        );
      }
      
      // Log performance (only if slow or every 100 frames)
      const renderTime = performance.now() - startTime;
      
      // Only log if slow (>50ms) or every 100 frames to reduce console spam
      if (renderTime > 50) {
        console.warn('⚠️ Canvas render slow:', renderTime.toFixed(2), 'ms');
      }
      
      return this.canvas;
      
    } catch (error) {
      console.error('Canvas render error:', error);
      return this.drawFallbackOverlay(data);
    }
  }
  
  /**
   * Draw rounded rectangle path (does not fill or stroke)
   */
  private drawRoundedRectPath(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  /**
   * Draw schedule overlay (wide centered card, 2-col grid for 8+ games)
   */
  private async drawScheduleOverlay(
    payload: NonNullable<GameOverlayData['scheduleOverlayPayload']>
  ): Promise<void> {
    const W = this.width;
    const H = this.height;

    const cardW = 1400;
    const cardH = Math.min(payload.games.length <= 4 ? 480 : 680, H - 60);
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;
    const radius = 20;

    this.ctx.save();

    this.ctx.globalAlpha = 0.88;
    this.ctx.fillStyle = 'rgba(8,8,12,0.92)';
    this.drawRoundedRectPath(cardX, cardY, cardW, cardH, radius);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;
    this.drawRoundedRectPath(cardX, cardY, cardW, cardH, radius);
    this.ctx.stroke();

    const headerH = 80;
    this.ctx.fillStyle = 'rgba(255,255,255,0.05)';
    this.ctx.fillRect(cardX, cardY, cardW, headerH);

    this.ctx.fillStyle = 'rgba(255,185,0,0.65)';
    this.ctx.font = '700 16px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('DAY SCHEDULE', cardX + 32, cardY + 26);

    this.ctx.fillStyle = 'rgba(255,185,0,0.45)';
    this.ctx.font = '700 14px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('STATJAM', cardX + cardW - 32, cardY + 26);

    const tournamentName =
      (payload as { tournamentName?: string }).tournamentName ?? '';
    this.ctx.fillStyle = 'rgba(255,255,255,0.55)';
    this.ctx.font = '700 16px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(tournamentName.toUpperCase(), cardX + cardW - 32, cardY + 56);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '800 42px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(payload.date, cardX + 32, cardY + 58);

    this.ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(cardX, cardY + headerH);
    this.ctx.lineTo(cardX + cardW, cardY + headerH);
    this.ctx.stroke();

    const games = payload.games;
    const useGrid = games.length > 4;
    const cols = useGrid ? 2 : 1;
    const colW = cardW / cols;
    const rowH = useGrid
      ? (cardH - headerH - 40) / Math.ceil(games.length / 2)
      : (cardH - headerH - 40) / games.length;
    const logoSize = 54;
    const logoGap = 38;

    if (useGrid) {
      this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(cardX + colW, cardY + headerH + 10);
      this.ctx.lineTo(cardX + colW, cardY + cardH - 10);
      this.ctx.stroke();
    }

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const col = useGrid ? i % 2 : 0;
      const row = useGrid ? Math.floor(i / 2) : i;
      const cellX = cardX + col * colW;
      const cellY = cardY + headerH + row * rowH;
      const cellCenterY = cellY + rowH / 2;
      const cellCenterX = cellX + colW / 2;

      if (row > 0 && col === 0) {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cardX + 20, cellY);
        this.ctx.lineTo(cardX + cardW - 20, cellY);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '800 26px Arial, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      let awayName = game.awayTeamName;
      const awayMaxW = colW / 2 - logoSize - logoGap - 70;
      while (
        this.ctx.measureText(awayName).width > awayMaxW &&
        awayName.length > 1
      ) {
        awayName = awayName.slice(0, -1);
      }
      this.ctx.fillText(
        awayName,
        cellCenterX - logoSize - logoGap - 24,
        cellCenterY - 10
      );

      if (game.awayTeamLogo) {
        const logo = await this.logoCache.load(game.awayTeamLogo);
        if (logo) {
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(
            cellCenterX - logoSize / 2 - logoGap,
            cellCenterY - 10,
            logoSize / 2,
            0,
            Math.PI * 2
          );
          this.ctx.clip();
          this.ctx.drawImage(
            logo,
            cellCenterX - logoSize - logoGap,
            cellCenterY - 10 - logoSize / 2,
            logoSize,
            logoSize
          );
          this.ctx.restore();
        }
      }

      this.ctx.fillStyle = 'rgba(255,255,255,0.06)';
      this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      this.ctx.lineWidth = 1;
      const vsW = 44;
      const vsH = 24;
      this.ctx.fillRect(
        cellCenterX - vsW / 2,
        cellCenterY - vsH / 2 - 10,
        vsW,
        vsH
      );
      this.ctx.strokeRect(
        cellCenterX - vsW / 2,
        cellCenterY - vsH / 2 - 10,
        vsW,
        vsH
      );
      this.ctx.fillStyle = 'rgba(255,255,255,0.35)';
      this.ctx.font = '800 13px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('VS', cellCenterX, cellCenterY - 10);

      if (game.homeTeamLogo) {
        const logo = await this.logoCache.load(game.homeTeamLogo);
        if (logo) {
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(
            cellCenterX + logoSize / 2 + logoGap,
            cellCenterY - 10,
            logoSize / 2,
            0,
            Math.PI * 2
          );
          this.ctx.clip();
          this.ctx.drawImage(
            logo,
            cellCenterX + logoGap,
            cellCenterY - 10 - logoSize / 2,
            logoSize,
            logoSize
          );
          this.ctx.restore();
        }
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '800 26px Arial, sans-serif';
      this.ctx.textAlign = 'left';
      let homeName = game.homeTeamName;
      while (
        this.ctx.measureText(homeName).width > awayMaxW &&
        homeName.length > 1
      ) {
        homeName = homeName.slice(0, -1);
      }
      this.ctx.fillText(
        homeName,
        cellCenterX + logoSize + logoGap + 24,
        cellCenterY - 10
      );

      this.ctx.fillStyle = 'rgba(255,255,255,0.92)';
      this.ctx.font = '700 18px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      const metaText = [game.time, game.status || 'TBD'].filter(Boolean).join('  ·  ');
      this.ctx.fillText(metaText, cellCenterX, cellCenterY + rowH * 0.38);
    }

    this.ctx.fillStyle = 'rgba(255,255,255,0.14)';
    this.ctx.font = '700 13px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('POWERED BY STATJAM', W / 2, cardY + cardH - 16);

    this.ctx.restore();
  }

  /**
   * Draw lineup overlay (centered card)
   */
  private async drawLineupOverlay(
    payload: NonNullable<GameOverlayData['lineupOverlayPayload']>,
    teamAPrimaryColor?: string,
    teamBPrimaryColor?: string
  ): Promise<void> {
    const W = this.width;
    const H = this.height;

    const colorA = teamAPrimaryColor || '#3B82F6';
    const colorB = teamBPrimaryColor || '#F97316';

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const cardW = 1500;
    const cardX = (W - cardW) / 2;
    const rowH = 110;
    const headerH = 48;
    const teamBarH = 88;
    const footerH = 36;
    const topLabelH = 64;
    const cardH = topLabelH + teamBarH + headerH + rowH * 5 + footerH;
    const cardY = (H - cardH) / 2;

    this.ctx.save();

    const centerX = 960;

    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.font = '700 20px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      (payload.tournamentName || '').toUpperCase(),
      centerX,
      cardY + 18
    );

    const labelY = cardY + 42;
    this.ctx.strokeStyle = 'rgba(255,185,0,0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 280, labelY);
    this.ctx.lineTo(centerX - 160, labelY);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + 160, labelY);
    this.ctx.lineTo(centerX + 280, labelY);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255,185,0,0.95)';
    this.ctx.font = '900 28px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STARTING LINEUP', centerX, labelY);

    const bandY = cardY + topLabelH;
    const bandH = teamBarH + headerH + rowH * 5;

    const gradient = this.ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.05, 'transparent');
    gradient.addColorStop(0.18, hexToRgba(colorA, 0.18));
    gradient.addColorStop(0.38, hexToRgba(colorA, 0.30));
    gradient.addColorStop(0.495, hexToRgba(colorA, 0.40));
    gradient.addColorStop(0.495, 'transparent');
    gradient.addColorStop(0.505, 'transparent');
    gradient.addColorStop(0.505, hexToRgba(colorB, 0.40));
    gradient.addColorStop(0.62, hexToRgba(colorB, 0.30));
    gradient.addColorStop(0.82, hexToRgba(colorB, 0.18));
    gradient.addColorStop(0.95, 'transparent');
    gradient.addColorStop(1, 'transparent');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(cardX, bandY, cardW, bandH);

    this.ctx.strokeStyle = hexToRgba(colorA, 0.4);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(cardX + cardW * 0.1, bandY);
    this.ctx.lineTo(cardX + cardW * 0.5, bandY);
    this.ctx.stroke();
    this.ctx.strokeStyle = hexToRgba(colorB, 0.4);
    this.ctx.beginPath();
    this.ctx.moveTo(cardX + cardW * 0.5, bandY);
    this.ctx.lineTo(cardX + cardW * 0.9, bandY);
    this.ctx.stroke();
    this.ctx.strokeStyle = hexToRgba(colorA, 0.4);
    this.ctx.beginPath();
    this.ctx.moveTo(cardX + cardW * 0.1, bandY + bandH);
    this.ctx.lineTo(cardX + cardW * 0.5, bandY + bandH);
    this.ctx.stroke();
    this.ctx.strokeStyle = hexToRgba(colorB, 0.4);
    this.ctx.beginPath();
    this.ctx.moveTo(cardX + cardW * 0.5, bandY + bandH);
    this.ctx.lineTo(cardX + cardW * 0.9, bandY + bandH);
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '900 52px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(payload.teamA.name, centerX - 40, bandY + teamBarH * 0.62);

    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.font = '700 18px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('VS', centerX, bandY + teamBarH * 0.62);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '900 52px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(payload.teamB.name, centerX + 40, bandY + teamBarH * 0.62);
    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, bandY + teamBarH);
    this.ctx.lineTo(centerX, bandY + bandH);
    this.ctx.stroke();

    const playersY = bandY + teamBarH + headerH;
    const avatarSize = 88;
    const avatarRadius = 44;

    const capitalizeName = (name: string) =>
      name.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const getInitials = (name: string) => {
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    for (let i = 0; i < 5; i++) {
      const playerA = payload.teamA.players[i];
      const playerB = payload.teamB.players[i];
      const rowY = playersY + i * rowH;
      const rowCenterY = rowY + rowH / 2;

      if (i > 0) {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cardX + cardW * 0.05, rowY);
        this.ctx.lineTo(cardX + cardW * 0.95, rowY);
        this.ctx.stroke();
      }

      const avatarACenterX = centerX - 80 - avatarRadius;
      const avatarBCenterX = centerX + 80 + avatarRadius;

      if (playerA) {
        this.ctx.fillStyle = 'rgba(28, 28, 32, 0.95)';
        this.ctx.beginPath();
        this.ctx.arc(avatarACenterX, rowCenterY, avatarRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = hexToRgba(colorA, 0.4);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(avatarACenterX, rowCenterY, avatarRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        if (playerA.photo_url) {
          const photo = await this.logoCache.load(playerA.photo_url);
          if (photo) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(avatarACenterX, rowCenterY, avatarRadius, 0, Math.PI * 2);
            this.ctx.clip();
            this.ctx.drawImage(
              photo,
              avatarACenterX - avatarRadius,
              rowCenterY - avatarRadius,
              avatarSize,
              avatarSize
            );
            this.ctx.restore();
          } else {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '700 28px Arial, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(getInitials(playerA.name), avatarACenterX, rowCenterY);
          }
        } else {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '700 28px Arial, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(getInitials(playerA.name), avatarACenterX, rowCenterY);
        }

        const jNum = playerA.jerseyNumber;
        if (jNum !== null && jNum !== undefined && String(jNum) !== '0') {
          const badgeR = 10;
          const badgeX = avatarACenterX + avatarRadius - badgeR;
          const badgeY = rowCenterY + avatarRadius - badgeR;
          this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
          this.ctx.beginPath();
          this.ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '700 9px Arial, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(String(jNum), badgeX, badgeY);
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '700 32px Arial, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 6;
        let nameA = capitalizeName(playerA.name);
        const maxNameW = 260;
        while (this.ctx.measureText(nameA).width > maxNameW && nameA.length > 1) {
          nameA = nameA.slice(0, -1);
        }
        this.ctx.fillText(nameA, avatarACenterX - avatarRadius - 12, rowCenterY);
        this.ctx.shadowBlur = 0;
      }

      if (playerB) {
        this.ctx.fillStyle = 'rgba(28, 28, 32, 0.95)';
        this.ctx.beginPath();
        this.ctx.arc(avatarBCenterX, rowCenterY, avatarRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = hexToRgba(colorB, 0.4);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(avatarBCenterX, rowCenterY, avatarRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        if (playerB.photo_url) {
          const photo = await this.logoCache.load(playerB.photo_url);
          if (photo) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(avatarBCenterX, rowCenterY, avatarRadius, 0, Math.PI * 2);
            this.ctx.clip();
            this.ctx.drawImage(
              photo,
              avatarBCenterX - avatarRadius,
              rowCenterY - avatarRadius,
              avatarSize,
              avatarSize
            );
            this.ctx.restore();
          } else {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '700 28px Arial, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(getInitials(playerB.name), avatarBCenterX, rowCenterY);
          }
        } else {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '700 28px Arial, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(getInitials(playerB.name), avatarBCenterX, rowCenterY);
        }

        const jNumB = playerB.jerseyNumber;
        if (jNumB !== null && jNumB !== undefined && String(jNumB) !== '0') {
          const badgeR = 10;
          const badgeX = avatarBCenterX + avatarRadius - badgeR;
          const badgeY = rowCenterY + avatarRadius - badgeR;
          this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
          this.ctx.beginPath();
          this.ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '700 9px Arial, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(String(jNumB), badgeX, badgeY);
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '700 32px Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 6;
        let nameB = capitalizeName(playerB.name);
        while (this.ctx.measureText(nameB).width > 260 && nameB.length > 1) {
          nameB = nameB.slice(0, -1);
        }
        this.ctx.fillText(nameB, avatarBCenterX + avatarRadius + 12, rowCenterY);
        this.ctx.shadowBlur = 0;
      }
    }

    const footerY = bandY + bandH + 12;
    this.ctx.fillStyle = 'rgba(255,255,255,0.14)';
    this.ctx.font = '700 13px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('POWERED BY STATJAM', centerX, footerY);

    this.ctx.restore();
  }

  /**
   * Draw minimal fallback overlay if main render fails
   */
  private drawFallbackOverlay(data: GameOverlayData): HTMLCanvasElement {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Simple background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, 150);
    
    // Simple text fallback
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 60px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const scoreText = `${data.teamAName} ${data.awayScore} - ${data.homeScore} ${data.teamBName}`;
    this.ctx.fillText(scoreText, this.canvas.width / 2, 80);
    
    return this.canvas;
  }
  
  /**
   * Clear canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    this.logoCache.clear();
    this.initialized = false;
  }
  
  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

