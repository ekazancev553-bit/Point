import { describe, it, expect } from 'vitest';
import { Board } from '../../src/engine/Board';

describe('Board', () => {
  it('creates empty board with correct dimensions', () => {
    const board = new Board(10, 10);
    expect(board.width).toBe(10);
    expect(board.height).toBe(10);
    expect(board.getAllDots()).toHaveLength(0);
  });

  it('places dot on valid position', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 5, y: 5 }, 'red', 1);
    const dot = board.getDot({ x: 5, y: 5 });
    expect(dot).not.toBeNull();
    expect(dot!.owner).toBe('red');
    expect(dot!.moveNumber).toBe(1);
    expect(dot!.captured).toBe(false);
  });

  it('rejects dot on occupied position', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 5, y: 5 }, 'red', 1);
    expect(() => board.placeDot({ x: 5, y: 5 }, 'blue', 2)).toThrow('Cell occupied');
  });

  it('rejects dot out of bounds', () => {
    const board = new Board(10, 10);
    expect(() => board.placeDot({ x: -1, y: 0 }, 'red', 1)).toThrow('out of bounds');
    expect(() => board.placeDot({ x: 10, y: 5 }, 'red', 1)).toThrow('out of bounds');
  });

  it('isEmpty returns true for empty cell', () => {
    const board = new Board(10, 10);
    expect(board.isEmpty({ x: 0, y: 0 })).toBe(true);
    board.placeDot({ x: 0, y: 0 }, 'red', 1);
    expect(board.isEmpty({ x: 0, y: 0 })).toBe(false);
  });

  it('isInBounds validates coordinates', () => {
    const board = new Board(10, 10);
    expect(board.isInBounds({ x: 0, y: 0 })).toBe(true);
    expect(board.isInBounds({ x: 9, y: 9 })).toBe(true);
    expect(board.isInBounds({ x: -1, y: 0 })).toBe(false);
    expect(board.isInBounds({ x: 10, y: 10 })).toBe(false);
  });

  it('getDotsForPlayer returns only player dots', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 0, y: 0 }, 'red', 1);
    board.placeDot({ x: 1, y: 1 }, 'blue', 2);
    board.placeDot({ x: 2, y: 2 }, 'red', 3);
    expect(board.getDotsForPlayer('red')).toHaveLength(2);
    expect(board.getDotsForPlayer('blue')).toHaveLength(1);
  });

  it('getAdjacentPoints returns 8-directional neighbors', () => {
    const board = new Board(10, 10);
    const adj = board.getAdjacentPoints({ x: 5, y: 5 });
    expect(adj).toHaveLength(8);
  });

  it('getAdjacentPoints handles corners', () => {
    const board = new Board(10, 10);
    expect(board.getAdjacentPoints({ x: 0, y: 0 })).toHaveLength(3);
    expect(board.getAdjacentPoints({ x: 9, y: 9 })).toHaveLength(3);
  });

  it('getAdjacentPoints handles edges', () => {
    const board = new Board(10, 10);
    expect(board.getAdjacentPoints({ x: 5, y: 0 })).toHaveLength(5);
  });

  it('removeDot removes a placed dot', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 3, y: 3 }, 'red', 1);
    expect(board.getDot({ x: 3, y: 3 })).not.toBeNull();
    board.removeDot({ x: 3, y: 3 });
    expect(board.getDot({ x: 3, y: 3 })).toBeNull();
  });

  it('markCaptured marks dots as captured', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 3, y: 3 }, 'red', 1);
    board.markCaptured([{ x: 3, y: 3 }], 'blue');
    const dot = board.getDot({ x: 3, y: 3 });
    expect(dot!.captured).toBe(true);
    expect(dot!.capturedBy).toBe('blue');
  });

  it('unmarkCaptured restores dot state', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 3, y: 3 }, 'red', 1);
    board.markCaptured([{ x: 3, y: 3 }], 'blue');
    board.unmarkCaptured([{ x: 3, y: 3 }]);
    const dot = board.getDot({ x: 3, y: 3 });
    expect(dot!.captured).toBe(false);
  });

  it('isFull returns true when board is full', () => {
    const board = new Board(2, 2);
    expect(board.isFull()).toBe(false);
    board.placeDot({ x: 0, y: 0 }, 'red', 1);
    board.placeDot({ x: 1, y: 0 }, 'blue', 2);
    board.placeDot({ x: 0, y: 1 }, 'red', 3);
    board.placeDot({ x: 1, y: 1 }, 'blue', 4);
    expect(board.isFull()).toBe(true);
  });

  it('getEmptyPoints returns all empty positions', () => {
    const board = new Board(3, 3);
    expect(board.getEmptyPoints()).toHaveLength(9);
    board.placeDot({ x: 1, y: 1 }, 'red', 1);
    expect(board.getEmptyPoints()).toHaveLength(8);
  });

  it('clone creates independent copy', () => {
    const board = new Board(10, 10);
    board.placeDot({ x: 5, y: 5 }, 'red', 1);
    const clone = board.clone();
    clone.placeDot({ x: 6, y: 6 }, 'blue', 2);
    expect(board.getDot({ x: 6, y: 6 })).toBeNull();
    expect(clone.getDot({ x: 6, y: 6 })).not.toBeNull();
  });
});
