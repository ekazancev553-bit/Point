import { Point, Player } from '../types';
import { Board } from '../engine/Board';
import { CaptureDetector } from '../engine/CaptureDetector';
import { AIPlayer } from './AIPlayer';
import { Evaluator } from './Evaluator';

const CAPTURE_BONUS = 10;

interface ScoredMove {
  point: Point;
  score: number;
}

export class MediumAI implements AIPlayer {
  private evaluator: Evaluator;

  constructor() {
    this.evaluator = new Evaluator();
  }

  getDifficulty(): 'easy' | 'medium' | 'hard' {
    return 'medium';
  }

  chooseMove(board: Board, player: Player): Point {
    const emptyPoints = board.getEmptyPoints();

    if (emptyPoints.length === 0) {
      throw new Error('No valid moves available');
    }

    if (emptyPoints.length === 1) {
      return emptyPoints[0];
    }

    const detector = new CaptureDetector();
    const moveNumber = board.getAllDots().length + 1;
    const scoredMoves: ScoredMove[] = [];

    for (const point of emptyPoints) {
      const simBoard = board.clone();
      simBoard.placeDot(point, player, moveNumber);

      // Check for captures and add bonus
      const captures = detector.detectCaptures(simBoard, point, player);
      let captureBonus = 0;
      if (captures.length > 0) {
        for (const region of captures) {
          captureBonus += region.capturedDots.length * CAPTURE_BONUS;
          simBoard.markCaptured(region.capturedDots, player);
        }
      }

      // Evaluate the resulting position
      const positionScore = this.evaluator.evaluate(simBoard, player);
      const totalScore = positionScore + captureBonus;

      scoredMoves.push({ point, score: totalScore });
    }

    // Sort by score descending
    scoredMoves.sort((a, b) => b.score - a.score);

    // Pick from the top 3 moves with weighted random selection
    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return this.weightedRandomSelect(topMoves);
  }

  /**
   * Weighted random selection: higher scored moves are more likely to be chosen.
   * Uses softmax-like weighting based on score differences.
   */
  private weightedRandomSelect(moves: ScoredMove[]): Point {
    if (moves.length === 1) {
      return moves[0].point;
    }

    // Shift scores so the minimum is 0, then add 1 to avoid zero weights
    const minScore = Math.min(...moves.map(m => m.score));
    const weights = moves.map(m => m.score - minScore + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < moves.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return moves[i].point;
      }
    }

    // Fallback: return the best move
    return moves[0].point;
  }
}
