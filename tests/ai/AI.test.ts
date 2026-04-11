import { describe, it, expect } from 'vitest';
import { Board } from '../../src/engine/Board';
import { createAI } from '../../src/ai/AIPlayer';
import { EasyAI } from '../../src/ai/EasyAI';
import { MediumAI } from '../../src/ai/MediumAI';
import { HardAI } from '../../src/ai/HardAI';
import { Evaluator } from '../../src/ai/Evaluator';

describe('EasyAI', () => {
  it('returns a valid move', () => {
    const board = new Board(10, 10);
    const ai = new EasyAI();
    const move = ai.chooseMove(board, 'red');
    expect(board.isInBounds(move)).toBe(true);
    expect(board.isEmpty(move)).toBe(true);
  });

  it('returns difficulty easy', () => {
    expect(new EasyAI().getDifficulty()).toBe('easy');
  });

  it('works on partially filled board', () => {
    const board = new Board(5, 5);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 4; x++) {
        board.placeDot({ x, y }, x % 2 === 0 ? 'red' : 'blue', y * 5 + x + 1);
      }
    }
    // Only column x=4 is empty (5 cells)
    const ai = new EasyAI();
    const move = ai.chooseMove(board, 'red');
    expect(move.x).toBe(4);
    expect(board.isEmpty(move)).toBe(true);
  });
});

describe('MediumAI', () => {
  it('returns a valid move', () => {
    const board = new Board(10, 10);
    const ai = new MediumAI();
    const move = ai.chooseMove(board, 'blue');
    expect(board.isInBounds(move)).toBe(true);
    expect(board.isEmpty(move)).toBe(true);
  });

  it('returns difficulty medium', () => {
    expect(new MediumAI().getDifficulty()).toBe('medium');
  });
});

describe('HardAI', () => {
  it('returns a valid move', () => {
    const board = new Board(10, 10);
    const ai = new HardAI(2, 1000);
    const move = ai.chooseMove(board, 'red');
    expect(board.isInBounds(move)).toBe(true);
    expect(board.isEmpty(move)).toBe(true);
  });

  it('returns difficulty hard', () => {
    expect(new HardAI().getDifficulty()).toBe('hard');
  });

  it('returns the only available move', () => {
    const board = new Board(2, 2);
    board.placeDot({ x: 0, y: 0 }, 'red', 1);
    board.placeDot({ x: 1, y: 0 }, 'blue', 2);
    board.placeDot({ x: 0, y: 1 }, 'red', 3);
    // Only (1,1) is empty
    const ai = new HardAI();
    const move = ai.chooseMove(board, 'blue');
    expect(move).toEqual({ x: 1, y: 1 });
  });
});

describe('Evaluator', () => {
  it('returns 0 for empty board', () => {
    const board = new Board(10, 10);
    const evaluator = new Evaluator();
    expect(evaluator.evaluate(board, 'red')).toBe(0);
  });

  it('positive score when player has captured', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 5, y: 5 }, 'blue', 1);
    board.markCaptured([{ x: 5, y: 5 }], 'red');
    const evaluator = new Evaluator();
    expect(evaluator.evaluate(board, 'red')).toBeGreaterThan(0);
  });

  it('negative score when opponent has captured', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 5, y: 5 }, 'red', 1);
    board.markCaptured([{ x: 5, y: 5 }], 'blue');
    const evaluator = new Evaluator();
    expect(evaluator.evaluate(board, 'red')).toBeLessThan(0);
  });
});

describe('createAI factory', () => {
  it('creates easy AI', () => {
    expect(createAI('easy').getDifficulty()).toBe('easy');
  });

  it('creates medium AI', () => {
    expect(createAI('medium').getDifficulty()).toBe('medium');
  });

  it('creates hard AI', () => {
    expect(createAI('hard').getDifficulty()).toBe('hard');
  });
});
