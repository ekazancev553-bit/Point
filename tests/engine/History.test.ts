import { describe, it, expect } from 'vitest';
import { History } from '../../src/engine/History';
import { Move } from '../../src/types';

function makeMoveRecord(x: number, y: number, player: 'red' | 'blue', num: number) {
  const move: Move = {
    point: { x, y },
    player,
    moveNumber: num,
    captures: [],
    timestamp: Date.now(),
  };
  return { move, capturedDotsBefore: [] };
}

describe('History', () => {
  it('starts empty', () => {
    const h = new History();
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
    expect(h.getLength()).toBe(0);
  });

  it('push adds to undo stack', () => {
    const h = new History();
    h.push(makeMoveRecord(0, 0, 'red', 1));
    expect(h.canUndo()).toBe(true);
    expect(h.getLength()).toBe(1);
  });

  it('undo moves to redo stack', () => {
    const h = new History();
    h.push(makeMoveRecord(0, 0, 'red', 1));
    const record = h.undo();
    expect(record).not.toBeNull();
    expect(record!.move.point).toEqual({ x: 0, y: 0 });
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(true);
  });

  it('redo moves back to undo stack', () => {
    const h = new History();
    h.push(makeMoveRecord(0, 0, 'red', 1));
    h.undo();
    const record = h.redo();
    expect(record).not.toBeNull();
    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);
  });

  it('new push clears redo stack', () => {
    const h = new History();
    h.push(makeMoveRecord(0, 0, 'red', 1));
    h.push(makeMoveRecord(1, 1, 'blue', 2));
    h.undo(); // undo move 2
    expect(h.canRedo()).toBe(true);
    h.push(makeMoveRecord(2, 2, 'red', 3)); // new move clears redo
    expect(h.canRedo()).toBe(false);
    expect(h.getLength()).toBe(2);
  });

  it('getMoveList returns ordered moves', () => {
    const h = new History();
    h.push(makeMoveRecord(0, 0, 'red', 1));
    h.push(makeMoveRecord(1, 1, 'blue', 2));
    h.push(makeMoveRecord(2, 2, 'red', 3));
    const moves = h.getMoveList();
    expect(moves).toHaveLength(3);
    expect(moves[0].moveNumber).toBe(1);
    expect(moves[2].moveNumber).toBe(3);
  });

  it('clear resets everything', () => {
    const h = new History();
    h.push(makeMoveRecord(0, 0, 'red', 1));
    h.push(makeMoveRecord(1, 1, 'blue', 2));
    h.clear();
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
    expect(h.getLength()).toBe(0);
  });

  it('undo returns null when empty', () => {
    const h = new History();
    expect(h.undo()).toBeNull();
  });

  it('redo returns null when empty', () => {
    const h = new History();
    expect(h.redo()).toBeNull();
  });
});
