import { describe, it, expect } from 'vitest';
import { GameController } from '../../src/engine/GameController';
import { EventBus } from '../../src/utils/EventBus';
import { GameConfig } from '../../src/types';

function createGame(): GameController {
  const config: GameConfig = {
    boardWidth: 10,
    boardHeight: 10,
    player1Name: 'Red',
    player2Name: 'Blue',
    player1Color: '#e74c3c',
    player2Color: '#3498db',
    gameMode: 'pvp',
  };
  const ctrl = new GameController(config, new EventBus());
  ctrl.startGame();
  return ctrl;
}

describe('Full game integration', () => {
  it('plays a complete game with capture, undo all, redo all', () => {
    const ctrl = createGame();

    // Play moves: red builds enclosure around blue
    const moves = [
      { x: 3, y: 3 }, // red 1
      { x: 4, y: 4 }, // blue 1 (will be captured)
      { x: 4, y: 3 }, // red 2
      { x: 0, y: 0 }, // blue 2
      { x: 5, y: 3 }, // red 3
      { x: 0, y: 1 }, // blue 3
      { x: 3, y: 4 }, // red 4
      { x: 0, y: 2 }, // blue 4
      { x: 5, y: 4 }, // red 5
      { x: 0, y: 3 }, // blue 5
      { x: 3, y: 5 }, // red 6
      { x: 0, y: 4 }, // blue 6
      { x: 4, y: 5 }, // red 7
      { x: 0, y: 5 }, // blue 7
      { x: 5, y: 5 }, // red 8 - closes the loop
    ];

    for (const move of moves) {
      const result = ctrl.makeMove(move);
      expect(result.success).toBe(true);
    }

    // Check capture happened
    const scoreAfterCapture = ctrl.getScore();
    expect(scoreAfterCapture.red).toBeGreaterThanOrEqual(1);

    // Verify board state
    expect(ctrl.getMoveHistory()).toHaveLength(15);
    const dot = ctrl.getBoard().getDot({ x: 4, y: 4 });
    expect(dot).not.toBeNull();
    expect(dot!.captured).toBe(true);

    // Undo ALL moves
    for (let i = 0; i < 15; i++) {
      expect(ctrl.undo()).toBe(true);
    }
    expect(ctrl.undo()).toBe(false); // nothing left to undo

    // Board should be empty
    expect(ctrl.getBoard().getAllDots()).toHaveLength(0);
    expect(ctrl.getCurrentPlayer()).toBe('red');

    // Redo ALL moves
    for (let i = 0; i < 15; i++) {
      expect(ctrl.redo()).toBe(true);
    }
    expect(ctrl.redo()).toBe(false);

    // Board should match end state
    expect(ctrl.getMoveHistory()).toHaveLength(15);
    const dot2 = ctrl.getBoard().getDot({ x: 4, y: 4 });
    expect(dot2!.captured).toBe(true);
  });

  it('game ends with two passes', () => {
    const ctrl = createGame();
    ctrl.makeMove({ x: 5, y: 5 });
    ctrl.makeMove({ x: 3, y: 3 });
    ctrl.pass();
    ctrl.pass();
    expect(ctrl.getPhase()).toBe('gameOver');
  });

  it('game ends when small board is full', () => {
    const config: GameConfig = {
      boardWidth: 3, boardHeight: 3,
      player1Name: 'R', player2Name: 'B',
      player1Color: '#f00', player2Color: '#00f',
      gameMode: 'pvp',
    };
    const ctrl = new GameController(config, new EventBus());
    ctrl.startGame();

    const positions = [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
      { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
    ];

    let lastResult;
    for (const pos of positions) {
      lastResult = ctrl.makeMove(pos);
    }

    expect(lastResult!.gameOver).toBe(true);
    expect(ctrl.getPhase()).toBe('gameOver');
  });
});
