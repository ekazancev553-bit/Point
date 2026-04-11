import { describe, it, expect } from 'vitest';
import { Board } from '../../src/engine/Board';
import { GameRules } from '../../src/engine/GameRules';

describe('GameRules', () => {
  it('isValidMove returns true for empty cell in bounds', () => {
    const board = new Board(10, 10);
    expect(GameRules.isValidMove(board, { x: 5, y: 5 })).toBe(true);
  });

  it('isValidMove returns false for occupied cell', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 5, y: 5 }, 'red', 1);
    expect(GameRules.isValidMove(board, { x: 5, y: 5 })).toBe(false);
  });

  it('isValidMove returns false for out of bounds', () => {
    const board = new Board(10, 10);
    expect(GameRules.isValidMove(board, { x: -1, y: 0 })).toBe(false);
    expect(GameRules.isValidMove(board, { x: 10, y: 10 })).toBe(false);
  });

  it('getValidMoves returns all empty positions', () => {
    const board = new Board(3, 3);
    expect(GameRules.getValidMoves(board)).toHaveLength(9);
    board.placeDot({ x: 1, y: 1 }, 'red', 1);
    expect(GameRules.getValidMoves(board)).toHaveLength(8);
  });

  it('isGameOver with full board', () => {
    const board = new Board(2, 2);
    board.placeDot({ x: 0, y: 0 }, 'red', 1);
    board.placeDot({ x: 1, y: 0 }, 'blue', 2);
    board.placeDot({ x: 0, y: 1 }, 'red', 3);
    board.placeDot({ x: 1, y: 1 }, 'blue', 4);
    expect(GameRules.isGameOver(board, 0)).toBe(true);
  });

  it('isGameOver with two passes', () => {
    const board = new Board(10, 10);
    expect(GameRules.isGameOver(board, 2)).toBe(true);
    expect(GameRules.isGameOver(board, 1)).toBe(false);
  });

  it('calculateScore counts captured dots', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 0, y: 0 }, 'red', 1);
    board.placeDot({ x: 1, y: 1 }, 'blue', 2);
    board.markCaptured([{ x: 1, y: 1 }], 'red');
    const score = GameRules.calculateScore(board);
    expect(score.red).toBe(1);
    expect(score.blue).toBe(0);
  });

  it('getWinner returns player with more captures', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 0, y: 0 }, 'blue', 1);
    board.markCaptured([{ x: 0, y: 0 }], 'red');
    expect(GameRules.getWinner(board)).toBe('red');
  });

  it('getWinner returns null on draw', () => {
    const board = new Board(10, 10);
    expect(GameRules.getWinner(board)).toBeNull();
  });
});
