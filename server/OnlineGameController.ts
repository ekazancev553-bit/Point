import { Server } from 'socket.io';
import {
  Point,
  Player,
  GameConfig,
  GamePhase,
  Score,
  Move,
  MoveResult,
  CapturedRegion,
} from '../src/types';

// Server-side copies of engine classes (minimal versions for validation)

class Board {
  readonly width: number;
  readonly height: number;
  private grid: (Dot | null)[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null),
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
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
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
}

interface Dot {
  point: Point;
  owner: Player;
  captured: boolean;
  moveNumber: number;
  capturedBy?: Player;
}

class GameRules {
  static isValidMove(board: Board, point: Point): boolean {
    return board.isEmpty(point);
  }

  static calculateScore(board: Board): Score {
    const redDots = board.getDotsForPlayer('red');
    const blueDots = board.getDotsForPlayer('blue');

    const redCaptured = redDots.filter(d => d.captured).length;
    const blueCaptured = blueDots.filter(d => d.captured).length;

    return {
      red: redDots.length - redCaptured,
      blue: blueDots.length - blueCaptured,
      redCaptured,
      blueCaptured,
    };
  }

  static isGameOver(board: Board, consecutivePasses: number): boolean {
    return board.getAllDots().length === board.width * board.height || consecutivePasses >= 2;
  }

  static getWinner(board: Board): Player | null {
    const score = this.calculateScore(board);
    if (score.red > score.blue) return 'red';
    if (score.blue > score.red) return 'blue';
    return null;
  }
}

class CaptureDetector {
  detectCaptures(board: Board, _lastMove: Point, player: Player): CapturedRegion[] {
    const currentRegions = this.findEnclosedRegions(board, player);
    return currentRegions;
  }

  private findEnclosedRegions(board: Board, wallPlayer: Player): CapturedRegion[] {
    const { width, height } = board;
    const visited: boolean[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false),
    );

    const isWall = (x: number, y: number): boolean => {
      const dot = board.getDot({ x, y });
      return dot !== null && dot.owner === wallPlayer && !dot.captured;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isWall(x, y)) {
          visited[y][x] = true;
        }
      }
    }

    const regions: CapturedRegion[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (visited[y][x]) continue;

        const component: Point[] = [];
        const opponentDots: Point[] = [];
        let touchesEdge = false;
        const queue: Point[] = [{ x, y }];
        visited[y][x] = true;

        while (queue.length > 0) {
          const current = queue.shift()!;
          component.push(current);

          const dot = board.getDot(current);
          if (dot && dot.owner !== wallPlayer && !dot.captured) {
            opponentDots.push(current);
          }

          if (current.x === 0 || current.x === width - 1 || current.y === 0 || current.y === height - 1) {
            touchesEdge = true;
          }

          const neighbors: Point[] = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 },
          ];

          for (const neighbor of neighbors) {
            if (
              neighbor.x >= 0 &&
              neighbor.x < width &&
              neighbor.y >= 0 &&
              neighbor.y < height &&
              !visited[neighbor.y][neighbor.x]
            ) {
              visited[neighbor.y][neighbor.x] = true;
              queue.push(neighbor);
            }
          }
        }

        if (!touchesEdge && opponentDots.length > 0) {
          const boundary = this.findBoundary(board, component, wallPlayer);
          regions.push({
            boundary,
            interior: component,
            capturedDots: opponentDots,
            owner: wallPlayer,
          });
        }
      }
    }

    return regions;
  }

  private findBoundary(board: Board, interior: Point[], wallPlayer: Player): Point[] {
    const boundarySet = new Set<string>();
    const boundary: Point[] = [];

    for (const point of interior) {
      const neighbors = board.getAdjacentPoints(point);
      for (const neighbor of neighbors) {
        const dot = board.getDot(neighbor);
        if (dot && dot.owner === wallPlayer && !dot.captured) {
          const key = `${neighbor.x},${neighbor.y}`;
          if (!boundarySet.has(key)) {
            boundarySet.add(key);
            boundary.push(neighbor);
          }
        }
      }
    }

    return boundary;
  }
}

export class OnlineGameController {
  private board: Board;
  private captureDetector: CaptureDetector;
  private config: GameConfig;
  private phase: GamePhase = 'playing';
  private currentPlayer: Player = 'red';
  private consecutivePasses: number = 0;
  private moveCount: number = 0;
  private roomId: string;
  private io: Server;

  constructor(config: GameConfig, roomId: string, io: Server) {
    this.config = config;
    this.roomId = roomId;
    this.io = io;
    this.board = new Board(config.boardWidth, config.boardHeight);
    this.captureDetector = new CaptureDetector();
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  getBoard(): Board {
    return this.board;
  }

  getScore(): Score {
    return GameRules.calculateScore(this.board);
  }

  getWinner(): Player | null {
    return GameRules.getWinner(this.board);
  }

  makeMove(point: Point): MoveResult {
    if (this.phase !== 'playing') {
      return { success: false, error: 'Game is not in playing phase' };
    }

    if (!GameRules.isValidMove(this.board, point)) {
      return { success: false, error: 'Invalid move' };
    }

    this.moveCount++;
    this.consecutivePasses = 0;

    // Place the dot
    this.board.placeDot(point, this.currentPlayer, this.moveCount);

    // Detect captures
    const captures = this.captureDetector.detectCaptures(this.board, point, this.currentPlayer);

    // Apply captures
    for (const region of captures) {
      const uncapturedDots = region.capturedDots.filter(cp => {
        const dot = this.board.getDot(cp);
        return dot && !dot.captured;
      });
      this.board.markCaptured(uncapturedDots, this.currentPlayer);
    }

    // Check game over
    const gameOver = GameRules.isGameOver(this.board, this.consecutivePasses);
    if (gameOver) {
      this.phase = 'gameOver';
      const winner = GameRules.getWinner(this.board);
      return { success: true, captures, gameOver: true, winner };
    }

    // Switch turn
    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';

    return { success: true, captures, gameOver: false };
  }

  pass(): void {
    if (this.phase !== 'playing') return;

    this.consecutivePasses++;
    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';

    if (GameRules.isGameOver(this.board, this.consecutivePasses)) {
      this.phase = 'gameOver';
    }
  }
}
