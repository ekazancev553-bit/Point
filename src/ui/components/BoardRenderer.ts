import { Point, Player } from '../../types';
import { Board } from '../../engine/Board';
import { theme, playerColor, playerColorAlpha } from '../theme';

export interface RenderOptions {
  lastMove?: Point;
  hoverPoint?: Point | null;
  hoverPlayer?: Player;
}

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private boardWidth: number;
  private boardHeight: number;

  constructor(canvas: HTMLCanvasElement, boardWidth: number, boardHeight: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    const padding = 1;
    const gridW = this.boardWidth - 1;
    const gridH = this.boardHeight - 1;
    this.cellSize = Math.min(
      rect.width / (gridW + padding * 2),
      rect.height / (gridH + padding * 2)
    );
    this.offsetX = (rect.width - gridW * this.cellSize) / 2;
    this.offsetY = (rect.height - gridH * this.cellSize) / 2;
  }

  render(board: Board, options: RenderOptions = {}): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Background
    this.ctx.fillStyle = theme.boardBg;
    this.ctx.fillRect(0, 0, w, h);

    this.drawGrid();
    this.drawCapturedRegions(board);
    this.drawDots(board);

    if (options.lastMove) {
      this.drawLastMoveHighlight(options.lastMove);
    }
    if (options.hoverPoint && options.hoverPlayer) {
      this.drawHoverDot(options.hoverPoint, options.hoverPlayer);
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 0.5;

    for (let x = 0; x < this.boardWidth; x++) {
      const px = this.offsetX + x * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(px, this.offsetY);
      ctx.lineTo(px, this.offsetY + (this.boardHeight - 1) * this.cellSize);
      ctx.stroke();
    }

    for (let y = 0; y < this.boardHeight; y++) {
      const py = this.offsetY + y * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, py);
      ctx.lineTo(this.offsetX + (this.boardWidth - 1) * this.cellSize, py);
      ctx.stroke();
    }

    // Draw center point
    const cx = Math.floor(this.boardWidth / 2);
    const cy = Math.floor(this.boardHeight / 2);
    const cpx = this.offsetX + cx * this.cellSize;
    const cpy = this.offsetY + cy * this.cellSize;
    ctx.fillStyle = theme.gridAccent;
    ctx.beginPath();
    ctx.arc(cpx, cpy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawDots(board: Board): void {
    const dots = board.getAllDots();
    const radius = this.cellSize * 0.3;

    for (const dot of dots) {
      const px = this.offsetX + dot.point.x * this.cellSize;
      const py = this.offsetY + dot.point.y * this.cellSize;
      const color = playerColor(dot.owner);

      this.ctx.beginPath();
      this.ctx.arc(px, py, radius, 0, Math.PI * 2);

      if (dot.captured) {
        this.ctx.fillStyle = playerColorAlpha(dot.owner, 0.35);
        this.ctx.fill();
        this.ctx.strokeStyle = playerColorAlpha(dot.owner, 0.5);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // X mark
        const xr = radius * 0.6;
        this.ctx.strokeStyle = playerColorAlpha(dot.capturedBy || dot.owner, 0.7);
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(px - xr, py - xr);
        this.ctx.lineTo(px + xr, py + xr);
        this.ctx.moveTo(px + xr, py - xr);
        this.ctx.lineTo(px - xr, py + xr);
        this.ctx.stroke();
      } else {
        // Gradient fill for nice look
        const gradient = this.ctx.createRadialGradient(
          px - radius * 0.3, py - radius * 0.3, 0,
          px, py, radius
        );
        gradient.addColorStop(0, this.lightenColor(color, 30));
        gradient.addColorStop(1, color);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = this.darkenColor(color, 20);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
  }

  private drawCapturedRegions(board: Board): void {
    const dots = board.getAllDots();
    const capturedDots = dots.filter(d => d.captured && d.capturedBy);
    if (capturedDots.length === 0) return;

    // Group by capturedBy player and draw filled regions
    for (const dot of capturedDots) {
      const px = this.offsetX + dot.point.x * this.cellSize;
      const py = this.offsetY + dot.point.y * this.cellSize;
      const halfCell = this.cellSize / 2;

      this.ctx.fillStyle = playerColorAlpha(dot.capturedBy!, theme.captureAlpha);
      this.ctx.fillRect(px - halfCell, py - halfCell, this.cellSize, this.cellSize);
    }
  }

  private drawLastMoveHighlight(point: Point): void {
    const px = this.offsetX + point.x * this.cellSize;
    const py = this.offsetY + point.y * this.cellSize;
    const radius = this.cellSize * 0.45;

    this.ctx.strokeStyle = theme.accent;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Glow effect
    this.ctx.strokeStyle = theme.accentGlow;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius + 2, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawHoverDot(point: Point, player: Player): void {
    const px = this.offsetX + point.x * this.cellSize;
    const py = this.offsetY + point.y * this.cellSize;
    const radius = this.cellSize * 0.3;

    this.ctx.fillStyle = playerColorAlpha(player, 0.4);
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  canvasToGrid(canvasX: number, canvasY: number): Point | null {
    const gridX = Math.round((canvasX - this.offsetX) / this.cellSize);
    const gridY = Math.round((canvasY - this.offsetY) / this.cellSize);

    if (gridX < 0 || gridX >= this.boardWidth || gridY < 0 || gridY >= this.boardHeight) {
      return null;
    }

    // Check if click is close enough to intersection
    const px = this.offsetX + gridX * this.cellSize;
    const py = this.offsetY + gridY * this.cellSize;
    const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
    if (dist > this.cellSize * 0.45) return null;

    return { x: gridX, y: gridY };
  }

  private lightenColor(hex: string, amount: number): string {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private darkenColor(hex: string, amount: number): string {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
