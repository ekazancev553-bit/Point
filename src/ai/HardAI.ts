import { Point, Player } from '../types';
import { Board } from '../engine/Board';
import { CaptureDetector } from '../engine/CaptureDetector';
import { AIPlayer } from './AIPlayer';
import { Evaluator } from './Evaluator';

const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_TIME_LIMIT_MS = 2000;
const MAX_BRANCHING_FACTOR = 20;

interface SearchResult {
  score: number;
  move: Point | null;
}

export class HardAI implements AIPlayer {
  private evaluator: Evaluator;
  private detector: CaptureDetector;
  private maxDepth: number;
  private timeLimitMs: number;
  private searchStartTime: number = 0;
  private timeExpired: boolean = false;

  constructor(maxDepth: number = DEFAULT_MAX_DEPTH, timeLimitMs: number = DEFAULT_TIME_LIMIT_MS) {
    this.evaluator = new Evaluator();
    this.detector = new CaptureDetector();
    this.maxDepth = maxDepth;
    this.timeLimitMs = timeLimitMs;
  }

  getDifficulty(): 'easy' | 'medium' | 'hard' {
    return 'hard';
  }

  chooseMove(board: Board, player: Player): Point {
    const emptyPoints = board.getEmptyPoints();

    if (emptyPoints.length === 0) {
      throw new Error('No valid moves available');
    }

    if (emptyPoints.length === 1) {
      return emptyPoints[0];
    }

    this.searchStartTime = Date.now();
    this.timeExpired = false;

    // Order moves: prioritize those near existing dots
    const orderedMoves = this.orderMoves(board, emptyPoints, player);

    // Limit branching factor
    const candidateMoves = orderedMoves.slice(0, MAX_BRANCHING_FACTOR);

    const result = this.minimax(
      board,
      player,
      player,
      this.maxDepth,
      -Infinity,
      Infinity,
      candidateMoves
    );

    // If minimax found a move, return it; otherwise fall back to best ordered move
    if (result.move) {
      return result.move;
    }

    return candidateMoves[0];
  }

  /**
   * Minimax with alpha-beta pruning.
   * @param board Current board state
   * @param currentPlayer Player whose turn it is at this node
   * @param maximizingPlayer The AI player (always maximizing for this player)
   * @param depth Remaining search depth
   * @param alpha Alpha bound
   * @param beta Beta bound
   * @param candidateMoves Pre-ordered candidate moves (only used at root)
   */
  private minimax(
    board: Board,
    currentPlayer: Player,
    maximizingPlayer: Player,
    depth: number,
    alpha: number,
    beta: number,
    candidateMoves?: Point[]
  ): SearchResult {
    // Check time limit
    if (this.isTimeExpired()) {
      return { score: this.evaluator.evaluate(board, maximizingPlayer), move: null };
    }

    // Terminal conditions
    if (depth === 0 || board.isFull()) {
      return { score: this.evaluator.evaluate(board, maximizingPlayer), move: null };
    }

    const moves = candidateMoves || this.getOrderedMoves(board, currentPlayer);

    if (moves.length === 0) {
      return { score: this.evaluator.evaluate(board, maximizingPlayer), move: null };
    }

    const isMaximizing = currentPlayer === maximizingPlayer;
    const opponent: Player = currentPlayer === 'red' ? 'blue' : 'red';
    const moveNumber = board.getAllDots().length + 1;

    let bestMove: Point | null = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (const move of moves) {
      if (this.isTimeExpired()) {
        break;
      }

      // Simulate the move
      const simBoard = board.clone();
      simBoard.placeDot(move, currentPlayer, moveNumber);

      // Apply captures
      const captures = this.detector.detectCaptures(simBoard, move, currentPlayer);
      for (const region of captures) {
        simBoard.markCaptured(region.capturedDots, currentPlayer);
      }

      // Recurse
      const result = this.minimax(
        simBoard,
        opponent,
        maximizingPlayer,
        depth - 1,
        alpha,
        beta
      );

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }

      // Alpha-beta pruning
      if (beta <= alpha) {
        break;
      }
    }

    return { score: bestScore, move: bestMove };
  }

  /**
   * Order moves by priority: moves adjacent to existing dots first,
   * then by proximity to board center.
   */
  private orderMoves(board: Board, emptyPoints: Point[], player: Player): Point[] {
    const centerX = (board.width - 1) / 2;
    const centerY = (board.height - 1) / 2;

    const allDots = board.getAllDots();
    const dotPositions = new Set<string>(
      allDots.map(d => `${d.point.x},${d.point.y}`)
    );

    const scored = emptyPoints.map(point => {
      let priority = 0;

      // Check adjacency to any existing dot (8-directional)
      const hasAdjacentDot = this.getNeighbors(point).some(
        n => dotPositions.has(`${n.x},${n.y}`)
      );
      if (hasAdjacentDot) {
        priority += 100;
      }

      // Check adjacency to own dots specifically (higher priority)
      const ownDots = board.getDotsForPlayer(player);
      const ownDotSet = new Set<string>(
        ownDots.map(d => `${d.point.x},${d.point.y}`)
      );
      const hasAdjacentOwnDot = this.getNeighbors(point).some(
        n => ownDotSet.has(`${n.x},${n.y}`)
      );
      if (hasAdjacentOwnDot) {
        priority += 50;
      }

      // Center proximity bonus
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      priority += (1 - dist / maxDist) * 10;

      return { point, priority };
    });

    scored.sort((a, b) => b.priority - a.priority);
    return scored.map(s => s.point);
  }

  /**
   * Get ordered moves for non-root nodes with limited branching.
   */
  private getOrderedMoves(board: Board, player: Player): Point[] {
    const emptyPoints = board.getEmptyPoints();
    const ordered = this.orderMoves(board, emptyPoints, player);
    return ordered.slice(0, MAX_BRANCHING_FACTOR);
  }

  /**
   * Get 8-directional neighbors of a point.
   */
  private getNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        neighbors.push({ x: point.x + dx, y: point.y + dy });
      }
    }
    return neighbors;
  }

  /**
   * Check if the time limit has been exceeded.
   */
  private isTimeExpired(): boolean {
    if (this.timeExpired) return true;
    if (Date.now() - this.searchStartTime >= this.timeLimitMs) {
      this.timeExpired = true;
      return true;
    }
    return false;
  }
}
