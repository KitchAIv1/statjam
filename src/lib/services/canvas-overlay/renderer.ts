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

