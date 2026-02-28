/**
 * Team Stats Comparison Overlay Drawer
 * Mirrors drawLineupOverlay visual patterns exactly — same gradient,
 * borders, gold label, team name style. Only content rows differ.
 */

import { LogoCache, TeamStatsOverlayPayload } from './utils';

export class TeamStatsDrawer {
  private readonly topLabelH = 36;
  private readonly teamBarH = 44;
  private readonly HEADER_HEIGHT = 80;
  private readonly ROW_HEIGHT = 56;
  private readonly CARD_WIDTH = 1500;
  private readonly GAP_AFTER_TEAM_NAMES = 16;
  private readonly CARD_HEIGHT = 372; // topLabelH(36) + teamBarH(44) + GAP(16) + ROW_HEIGHT*5(280) - 4

  constructor(
    private ctx: CanvasRenderingContext2D,
    private logoCache: LogoCache,
    private canvasWidth: number,
    private canvasHeight: number
  ) {}

  async draw(data: TeamStatsOverlayPayload): Promise<void> {
    const cardW = this.CARD_WIDTH;
    const cardX = (this.canvasWidth - cardW) / 2;
    const cardY = (this.canvasHeight - this.CARD_HEIGHT) / 2;

    const colorA = data.teamAPrimaryColor || '#3B82F6';
    const colorB = data.teamBPrimaryColor || '#F97316';

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const centerX = 960;

    this.ctx.save();

    if (!data?.stats?.length || !data.teamAName || !data.teamBName) {
      this.ctx.restore();
      return;
    }

    // --- Top label: "TEAM STATS" with gold lines (same pattern as lineup) ---
    const labelY = cardY + this.topLabelH / 2;
    this.ctx.strokeStyle = 'rgba(255,185,0,0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 200, labelY);
    this.ctx.lineTo(centerX - 110, labelY);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + 110, labelY);
    this.ctx.lineTo(centerX + 200, labelY);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255,185,0,0.95)';
    this.ctx.font = '700 22px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('TEAM STATS', centerX, labelY);

    // --- Band: gradient + borders (exact lineup color stops) ---
    const bandY = cardY + this.topLabelH;
    const bandH = this.teamBarH + this.GAP_AFTER_TEAM_NAMES + this.ROW_HEIGHT * 5 - 4;

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

    // Top border lines (lineup pattern: w*0.1 to w*0.5, w*0.5 to w*0.9)
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

    // Bottom border lines
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

    // Center vertical divider
    this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, bandY);
    this.ctx.lineTo(centerX, bandY + bandH);
    this.ctx.stroke();

    // --- Team names (lineup style: 900 weight, shadow, 40px gap each side) ---
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '900 48px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(data.teamAName, centerX - 40, bandY + this.teamBarH * 0.62);

    this.ctx.textAlign = 'left';
    this.ctx.fillText(data.teamBName, centerX + 40, bandY + this.teamBarH * 0.62);
    this.ctx.shadowBlur = 0;

    // --- Stat rows ---
    const rowsStartY = bandY + this.teamBarH + this.GAP_AFTER_TEAM_NAMES;
    const stats = data.stats.slice(0, 5);

    stats.forEach((stat, i) => {
      if (!stat?.label || !stat.teamAValue || !stat.teamBValue) return;

      const rowY = rowsStartY + i * this.ROW_HEIGHT;
      const rowCenterY = rowY + this.ROW_HEIGHT / 2;

      // Row divider (lineup pattern)
      if (i > 0) {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cardX + cardW * 0.05, rowY);
        this.ctx.lineTo(cardX + cardW * 0.95, rowY);
        this.ctx.stroke();
      }

      // Stat label — centered
      this.ctx.fillStyle = 'rgba(255,255,255,0.70)';
      this.ctx.font = '700 24px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(stat.label, centerX, rowCenterY);

      // Team A value — right of center
      this.ctx.fillStyle = stat.teamALeads ? '#ffffff' : 'rgba(255,255,255,0.50)';
      this.ctx.font = stat.teamALeads ? '900 52px Arial, sans-serif' : '400 40px Arial, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(stat.teamAValue, centerX - 120, rowCenterY);

      // Team B value — left of center
      this.ctx.fillStyle = !stat.teamALeads ? '#ffffff' : 'rgba(255,255,255,0.50)';
      this.ctx.font = !stat.teamALeads ? '900 52px Arial, sans-serif' : '400 40px Arial, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(stat.teamBValue, centerX + 120, rowCenterY);
    });

    this.ctx.restore();
  }
}
