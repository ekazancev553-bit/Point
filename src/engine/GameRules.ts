import { Point, Player, Score } from '../types';
import { Board } from './Board';

export class GameRules {
  static isValidMove(board: Board, point: Point): boolean {
    return board.isInBounds(point) && board.isEmpty(point);
  }

  static isGameOver(board: Board, consecutivePasses: number): boolean {
    return board.isFull() || consecutivePasses >= 2;
  }

  static getValidMoves(board: Board): Point[] {
    return board.getEmptyPoints();
  }

  static calculateScore(board: Board): Score {
    const score: Score = { red: 0, blue: 0 };
    for (const dot of board.getAllDots()) {
      if (dot.captured) {
        if (dot.owner === 'red') score.blue++;
        else score.red++;
      }
    }
    return score;
  }

  static getWinner(board: Board): Player | null {
    const score = GameRules.calculateScore(board);
    if (score.red > score.blue) return 'red';
    if (score.blue > score.red) return 'blue';
    return null;
  }
}
