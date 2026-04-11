import { Point, Player } from '../types';
import { Board } from '../engine/Board';
import { CaptureDetector } from '../engine/CaptureDetector';
import { AIPlayer } from './AIPlayer';

export class EasyAI implements AIPlayer {
  getDifficulty(): 'easy' | 'medium' | 'hard' {
    return 'easy';
  }

  chooseMove(board: Board, player: Player): Point {
    const emptyPoints = board.getEmptyPoints();

    if (emptyPoints.length === 0) {
      throw new Error('No valid moves available');
    }

    // First, check if any move captures opponent dots — always prefer capturing
    const capturingMoves = this.findCapturingMoves(board, player, emptyPoints);
    if (capturingMoves.length > 0) {
      return capturingMoves[Math.floor(Math.random() * capturingMoves.length)];
    }

    // 70% chance: pick a random empty point adjacent to own dots
    if (Math.random() < 0.7) {
      const adjacentMoves = this.findAdjacentMoves(board, player, emptyPoints);
      if (adjacentMoves.length > 0) {
        return adjacentMoves[Math.floor(Math.random() * adjacentMoves.length)];
      }
    }

    // 30% chance (or fallback): completely random empty point
    return emptyPoints[Math.floor(Math.random() * emptyPoints.length)];
  }

  private findCapturingMoves(board: Board, player: Player, emptyPoints: Point[]): Point[] {
    const capturingMoves: Point[] = [];
    const detector = new CaptureDetector();
    const moveNumber = board.getAllDots().length + 1;

    for (const point of emptyPoints) {
      const simBoard = board.clone();
      simBoard.placeDot(point, player, moveNumber);
      const captures = detector.detectCaptures(simBoard, point, player);
      if (captures.length > 0) {
        capturingMoves.push(point);
      }
    }

    return capturingMoves;
  }

  private findAdjacentMoves(board: Board, player: Player, emptyPoints: Point[]): Point[] {
    const ownDots = board.getDotsForPlayer(player);

    if (ownDots.length === 0) {
      return [];
    }

    const ownDotSet = new Set<string>(
      ownDots.map(d => `${d.point.x},${d.point.y}`)
    );

    return emptyPoints.filter(point => {
      const adjacent = board.getAdjacentPoints(point);
      return adjacent.some(adj => ownDotSet.has(`${adj.x},${adj.y}`));
    });
  }
}
