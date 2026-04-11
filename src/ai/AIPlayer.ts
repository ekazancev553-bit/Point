import { Point, Player } from '../types';
import { Board } from '../engine/Board';
import { EasyAI } from './EasyAI';
import { MediumAI } from './MediumAI';
import { HardAI } from './HardAI';

export interface AIPlayer {
  chooseMove(board: Board, player: Player): Point;
  getDifficulty(): 'easy' | 'medium' | 'hard';
}

export function createAI(difficulty: 'easy' | 'medium' | 'hard'): AIPlayer {
  switch (difficulty) {
    case 'easy':
      return new EasyAI();
    case 'medium':
      return new MediumAI();
    case 'hard':
      return new HardAI();
  }
}
