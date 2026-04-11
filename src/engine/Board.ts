import { Point, Dot, Player } from '../types';

export class Board {
  readonly width: number;
  readonly height: number;
  private grid: (Dot | null)[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null)
    );
  }

  isInBounds(point: Point): boolean {
    return point.x >= 0 && point.x < this.width && point.y >= 0 && point.y < this.height;
  }

  getDot(point: Point): Dot | null {
    if (!this.isInBounds(point)) return null;
    return this.grid[point.y][point.x];
  }

  isEmpty(point: Point): boolean {
    return this.isInBounds(point) && this.grid[point.y][point.x] === null;
  }

  placeDot(point: Point, player: Player, moveNumber: number): void {
    if (!this.isInBounds(point)) throw new Error('Point out of bounds');
    if (this.grid[point.y][point.x] !== null) throw new Error('Cell occupied');
    this.grid[point.y][point.x] = {
      point: { x: point.x, y: point.y },
      owner: player,
      captured: false,
      moveNumber,
    };
  }

  removeDot(point: Point): void {
    if (this.isInBounds(point)) {
      this.grid[point.y][point.x] = null;
    }
  }

  markCaptured(points: Point[], capturedBy: Player): void {
    for (const p of points) {
      const dot = this.grid[p.y]?.[p.x];
      if (dot) {
        dot.captured = true;
        dot.capturedBy = capturedBy;
      }
    }
  }

  unmarkCaptured(points: Point[]): void {
    for (const p of points) {
      const dot = this.grid[p.y]?.[p.x];
      if (dot) {
        dot.captured = false;
        dot.capturedBy = undefined;
      }
    }
  }

  getDotsForPlayer(player: Player): Dot[] {
    const dots: Dot[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dot = this.grid[y][x];
        if (dot && dot.owner === player) dots.push(dot);
      }
    }
    return dots;
  }

  getAdjacentPoints(point: Point): Point[] {
    const dirs = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                     { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
    ];
    return dirs
      .map(d => ({ x: point.x + d.x, y: point.y + d.y }))
      .filter(p => this.isInBounds(p));
  }

  getAllDots(): Dot[] {
    const dots: Dot[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dot = this.grid[y][x];
        if (dot) dots.push(dot);
      }
    }
    return dots;
  }

  isFull(): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === null) return false;
      }
    }
    return true;
  }

  getEmptyPoints(): Point[] {
    const points: Point[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === null) points.push({ x, y });
      }
    }
    return points;
  }

  clone(): Board {
    const board = new Board(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dot = this.grid[y][x];
        if (dot) {
          board.grid[y][x] = { ...dot, point: { ...dot.point } };
        }
      }
    }
    return board;
  }
}
