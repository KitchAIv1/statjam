/**
 * On-Court Players Side-by-Side Overlay Drawer
 * Mirrors drawLineupOverlay visual patterns — same card, gradient, borders,
 * gold label, team names, avatars with photo loading. Two columns with live stats.
 */

import { LogoCache, OnCourtPlayersOverlayPayload, OverlayPosition } from './utils';

export class OnCourtPlayersDrawer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private logoCache: LogoCache,
    private canvasWidth: number,
    private canvasHeight: number
  ) {}

  async draw(
    data: OnCourtPlayersOverlayPayload,
    position: OverlayPosition = 'top',
    nbaBarAnchorY?: number
  ): Promise<void> {
    const colorA = data.teamAPrimaryColor || '#3B82F6';
    const colorB = data.teamBPrimaryColor || '#F97316';

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const cardW = 1500;
    const cardX = (this.canvasWidth - cardW) / 2;
    const rowH = 110;
    const headerH = 48;
    const teamBarH = 88;
    const footerH = 36;
    const topLabelH = 64;
    const cardH = topLabelH + teamBarH + headerH + rowH * 5 + footerH;
    let cardY: number;
    if (nbaBarAnchorY !== undefined) {
      // NBA mode — anchor to score bar
      cardY = position === 'bottom'
        ? nbaBarAnchorY - cardH  // sit above bar
        : nbaBarAnchorY;          // sit below bar
    } else {
      // Classic mode or fallback — vertically centered
      cardY = (this.canvasHeight - cardH) / 2;
    }
    const centerX = 960;

    this.ctx.save();

    if (!data?.teamAPlayers?.length || !data?.teamBPlayers?.length || !data.teamAName || !data.teamBName) {
      this.ctx.restore();
      return;
    }

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
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('ON-COURT PLAYERS', centerX, labelY);

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
    this.ctx.fillText(data.teamAName, centerX - 40, bandY + teamBarH * 0.62);

    this.ctx.textAlign = 'left';
    this.ctx.fillText(data.teamBName, centerX + 40, bandY + teamBarH * 0.62);
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
    const colWidth = 52;
    const statCols = ['PTS', 'REB', 'AST', 'STL', 'BLK'];

    const avatarACenterX = cardX + cardW * 0.08 + avatarRadius;
    const avatarBCenterX = cardX + cardW * 0.52 + avatarRadius;

    const statsStartA = centerX - 16 - statCols.length * colWidth;
    const statsStartB = cardX + cardW * 0.52 + avatarRadius * 2 + 12 + 280;

    const headerRowY = playersY - 24;
    this.ctx.fillStyle = 'rgba(255,255,255,0.55)';
    this.ctx.font = '600 20px Arial, sans-serif';
    this.ctx.textBaseline = 'middle';
    statCols.forEach((col, i) => {
      this.ctx.textAlign = 'center';
      this.ctx.fillText(col, statsStartA + i * colWidth + colWidth / 2, headerRowY);
    });
    statCols.forEach((col, i) => {
      this.ctx.textAlign = 'center';
      this.ctx.fillText(col, statsStartB + i * colWidth + colWidth / 2, headerRowY);
    });

    const getInitials = (name: string) => {
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const capitalizeName = (name: string) =>
      name.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const formatName = (name: string): string => {
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0];
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      return `${firstName[0].toUpperCase()}. ${lastName}`;
    };

    const teamAPlayers = data.teamAPlayers.slice(0, 5);
    const teamBPlayers = data.teamBPlayers.slice(0, 5);

    for (let i = 0; i < 5; i++) {
      const playerA = teamAPlayers[i];
      const playerB = teamBPlayers[i];
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

        if (playerA.photo_url && playerA.photo_url.trim() !== '') {
          const photo = await Promise.race([
            this.logoCache.load(playerA.photo_url),
            new Promise<HTMLImageElement | null>((resolve) => setTimeout(() => resolve(null), 3000)),
          ]);
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
        if (jNum !== null && jNum !== undefined) {
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
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 6;
        const origNameA = formatName(playerA.name || 'Unknown');
        let nameA = origNameA;
        const maxNameWA = 280;
        while (this.ctx.measureText(nameA).width > maxNameWA && nameA.length > 1) {
          nameA = nameA.slice(0, -1);
        }
        if (nameA !== origNameA) nameA = nameA.slice(0, -1) + '…';
        this.ctx.fillText(nameA, avatarACenterX + avatarRadius + 12, rowCenterY);
        this.ctx.shadowBlur = 0;

        const statValuesA = [playerA.pts ?? 0, playerA.reb ?? 0, playerA.ast ?? 0, playerA.stl ?? 0, playerA.blk ?? 0];
        statValuesA.forEach((val, si) => {
          this.ctx.fillStyle = val > 0 ? '#ffffff' : 'rgba(255,255,255,0.35)';
          this.ctx.font = val > 0 ? '900 32px Arial, sans-serif' : '400 28px Arial, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(String(val), statsStartA + si * colWidth + colWidth / 2, rowCenterY);
        });
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

        if (playerB.photo_url && playerB.photo_url.trim() !== '') {
          const photo = await Promise.race([
            this.logoCache.load(playerB.photo_url),
            new Promise<HTMLImageElement | null>((resolve) => setTimeout(() => resolve(null), 3000)),
          ]);
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
        if (jNumB !== null && jNumB !== undefined) {
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
        const origNameB = formatName(playerB.name || 'Unknown');
        let nameB = origNameB;
        const maxNameWB = 280;
        while (this.ctx.measureText(nameB).width > maxNameWB && nameB.length > 1) {
          nameB = nameB.slice(0, -1);
        }
        if (nameB !== origNameB) nameB = nameB.slice(0, -1) + '…';
        this.ctx.fillText(nameB, avatarBCenterX + avatarRadius + 12, rowCenterY);
        this.ctx.shadowBlur = 0;

        const statValuesB = [playerB.pts ?? 0, playerB.reb ?? 0, playerB.ast ?? 0, playerB.stl ?? 0, playerB.blk ?? 0];
        statValuesB.forEach((val, si) => {
          this.ctx.fillStyle = val > 0 ? '#ffffff' : 'rgba(255,255,255,0.35)';
          this.ctx.font = val > 0 ? '900 32px Arial, sans-serif' : '400 28px Arial, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(String(val), statsStartB + si * colWidth + colWidth / 2, rowCenterY);
        });
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
}
