import { describe, it, expect } from 'vitest';
import { Board } from '../../src/engine/Board';
import { CaptureDetector } from '../../src/engine/CaptureDetector';

describe('CaptureDetector', () => {
  const detector = new CaptureDetector();

  it('detects simple square capture', () => {
    // Red dots form a square around a blue dot
    //  R . R
    //  . B .
    //  R . R
    const board = new Board(10, 10);
    board.placeDot({ x: 3, y: 3 }, 'red', 1);
    board.placeDot({ x: 5, y: 3 }, 'red', 3);
    board.placeDot({ x: 3, y: 5 }, 'red', 5);
    board.placeDot({ x: 5, y: 5 }, 'red', 7);
    board.placeDot({ x: 4, y: 3 }, 'red', 9);
    board.placeDot({ x: 3, y: 4 }, 'red', 11);
    board.placeDot({ x: 5, y: 4 }, 'red', 13);
    board.placeDot({ x: 4, y: 5 }, 'red', 15);

    // Blue dot inside
    board.placeDot({ x: 4, y: 4 }, 'blue', 2);

    const captures = detector.detectCaptures(board, { x: 4, y: 5 }, 'red');
    expect(captures.length).toBeGreaterThan(0);

    const allCaptured = captures.flatMap(c => c.capturedDots);
    expect(allCaptured).toEqual(
      expect.arrayContaining([expect.objectContaining({ x: 4, y: 4 })])
    );
  });

  it('no capture when loop is empty', () => {
    // Red dots form a square with no blue dots inside
    const board = new Board(10, 10);
    board.placeDot({ x: 3, y: 3 }, 'red', 1);
    board.placeDot({ x: 4, y: 3 }, 'red', 2);
    board.placeDot({ x: 5, y: 3 }, 'red', 3);
    board.placeDot({ x: 3, y: 4 }, 'red', 4);
    board.placeDot({ x: 5, y: 4 }, 'red', 5);
    board.placeDot({ x: 3, y: 5 }, 'red', 6);
    board.placeDot({ x: 4, y: 5 }, 'red', 7);
    board.placeDot({ x: 5, y: 5 }, 'red', 8);

    const captures = detector.detectCaptures(board, { x: 5, y: 5 }, 'red');
    expect(captures).toHaveLength(0);
  });

  it('no capture when loop is open (touches edge)', () => {
    // Red dots near the edge, not fully enclosing
    const board = new Board(10, 10);
    // Place blue at (0,1)
    board.placeDot({ x: 0, y: 1 }, 'blue', 1);
    // Red partially surrounding but touching edge
    board.placeDot({ x: 1, y: 0 }, 'red', 2);
    board.placeDot({ x: 1, y: 1 }, 'red', 3);
    board.placeDot({ x: 1, y: 2 }, 'red', 4);

    const captures = detector.detectCaptures(board, { x: 1, y: 2 }, 'red');
    // Blue at (0,1) is adjacent to edge, so it should NOT be captured
    const allCaptured = captures.flatMap(c => c.capturedDots);
    const blueCaptured = allCaptured.some(p => p.x === 0 && p.y === 1);
    expect(blueCaptured).toBe(false);
  });

  it('detects multiple captures from single move', () => {
    const board = new Board(10, 10);

    // Two separate enclosures sharing a wall piece
    // Enclosure 1: blue at (2,2)
    board.placeDot({ x: 1, y: 1 }, 'red', 1);
    board.placeDot({ x: 2, y: 1 }, 'red', 2);
    board.placeDot({ x: 3, y: 1 }, 'red', 3);
    board.placeDot({ x: 1, y: 2 }, 'red', 4);
    board.placeDot({ x: 3, y: 2 }, 'red', 5);
    board.placeDot({ x: 1, y: 3 }, 'red', 6);
    board.placeDot({ x: 2, y: 3 }, 'red', 7);
    board.placeDot({ x: 3, y: 3 }, 'red', 8);
    board.placeDot({ x: 2, y: 2 }, 'blue', 9);

    // Enclosure 2: blue at (5,2)
    board.placeDot({ x: 4, y: 1 }, 'red', 10);
    board.placeDot({ x: 5, y: 1 }, 'red', 11);
    board.placeDot({ x: 6, y: 1 }, 'red', 12);
    board.placeDot({ x: 4, y: 2 }, 'red', 13);
    board.placeDot({ x: 6, y: 2 }, 'red', 14);
    board.placeDot({ x: 4, y: 3 }, 'red', 15);
    board.placeDot({ x: 5, y: 3 }, 'red', 16);
    board.placeDot({ x: 6, y: 3 }, 'red', 17);
    board.placeDot({ x: 5, y: 2 }, 'blue', 18);

    const captures = detector.detectCaptures(board, { x: 6, y: 3 }, 'red');
    const allCaptured = captures.flatMap(c => c.capturedDots);
    expect(allCaptured.length).toBe(2);
  });

  it('captured dots do not act as walls', () => {
    const board = new Board(10, 10);
    // Red encloses blue at (4,4)
    board.placeDot({ x: 3, y: 3 }, 'red', 1);
    board.placeDot({ x: 4, y: 3 }, 'red', 2);
    board.placeDot({ x: 5, y: 3 }, 'red', 3);
    board.placeDot({ x: 3, y: 4 }, 'red', 4);
    board.placeDot({ x: 5, y: 4 }, 'red', 5);
    board.placeDot({ x: 3, y: 5 }, 'red', 6);
    board.placeDot({ x: 4, y: 5 }, 'red', 7);
    board.placeDot({ x: 5, y: 5 }, 'red', 8);
    board.placeDot({ x: 4, y: 4 }, 'blue', 9);

    // Capture blue
    const captures1 = detector.detectCaptures(board, { x: 5, y: 5 }, 'red');
    expect(captures1.length).toBeGreaterThan(0);
    board.markCaptured([{ x: 4, y: 4 }], 'red');

    // Verify the captured dot state
    const dot = board.getDot({ x: 4, y: 4 });
    expect(dot!.captured).toBe(true);
    expect(dot!.capturedBy).toBe('red');

    // The captured blue dot at (4,4) should NOT act as a wall for blue.
    // Verify: blue's captured dot doesn't help blue form enclosures.
    const captures2 = detector.detectCaptures(board, { x: 4, y: 4 }, 'blue');
    expect(captures2).toHaveLength(0);
  });

  it('handles capture on larger board', () => {
    const board = new Board(20, 20);

    // Create a larger enclosure
    // Red ring around blue at (10,10)
    const ring = [
      { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 },
      { x: 9, y: 10 },                   { x: 11, y: 10 },
      { x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 },
    ];
    ring.forEach((p, i) => board.placeDot(p, 'red', i + 1));
    board.placeDot({ x: 10, y: 10 }, 'blue', 20);

    const captures = detector.detectCaptures(board, { x: 11, y: 11 }, 'red');
    expect(captures.length).toBeGreaterThan(0);
    const capturedBlue = captures.flatMap(c => c.capturedDots)
      .some(p => p.x === 10 && p.y === 10);
    expect(capturedBlue).toBe(true);
  });
});
