import { describe, it, expect } from 'vitest';
import { GameController } from '../../src/engine/GameController';
import { EventBus } from '../../src/utils/EventBus';
import { GameConfig } from '../../src/types';

function createController(overrides: Partial<GameConfig> = {}): GameController {
  const config: GameConfig = {
    boardWidth: 10,
    boardHeight: 10,
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    player1Color: '#e74c3c',
    player2Color: '#3498db',
    gameMode: 'pvp',
    ...overrides,
  };
  const eventBus = new EventBus();
  const ctrl = new GameController(config, eventBus);
  ctrl.startGame();
  return ctrl;
}

describe('GameController', () => {
  it('starts in playing phase', () => {
    const ctrl = createController();
    expect(ctrl.getPhase()).toBe('playing');
  });

  it('red moves first', () => {
    const ctrl = createController();
    expect(ctrl.getCurrentPlayer()).toBe('red');
  });

  it('alternates turns after valid moves', () => {
    const ctrl = createController();
    ctrl.makeMove({ x: 0, y: 0 });
    expect(ctrl.getCurrentPlayer()).toBe('blue');
    ctrl.makeMove({ x: 1, y: 1 });
    expect(ctrl.getCurrentPlayer()).toBe('red');
  });

  it('rejects invalid moves', () => {
    const ctrl = createController();
    ctrl.makeMove({ x: 5, y: 5 });
    const result = ctrl.makeMove({ x: 5, y: 5 }); // occupied
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid move');
  });

  it('rejects moves when game is not playing', () => {
    const config: GameConfig = {
      boardWidth: 10, boardHeight: 10,
      player1Name: 'P1', player2Name: 'P2',
      player1Color: '#f00', player2Color: '#00f',
      gameMode: 'pvp',
    };
    const ctrl = new GameController(config, new EventBus());
    // Phase is 'setup', not 'playing'
    const result = ctrl.makeMove({ x: 0, y: 0 });
    expect(result.success).toBe(false);
  });

  it('undo reverts a move', () => {
    const ctrl = createController();
    ctrl.makeMove({ x: 5, y: 5 });
    expect(ctrl.getBoard().getDot({ x: 5, y: 5 })).not.toBeNull();
    ctrl.undo();
    expect(ctrl.getBoard().getDot({ x: 5, y: 5 })).toBeNull();
    expect(ctrl.getCurrentPlayer()).toBe('red');
  });

  it('redo restores an undone move', () => {
    const ctrl = createController();
    ctrl.makeMove({ x: 5, y: 5 });
    ctrl.undo();
    ctrl.redo();
    expect(ctrl.getBoard().getDot({ x: 5, y: 5 })).not.toBeNull();
    expect(ctrl.getCurrentPlayer()).toBe('blue');
  });

  it('score starts at 0-0', () => {
    const ctrl = createController();
    const score = ctrl.getScore();
    expect(score.red).toBe(0);
    expect(score.blue).toBe(0);
  });

  it('detects capture and updates score', () => {
    const ctrl = createController();
    // Red builds enclosure around blue
    // Blue at (4,4)
    const moves = [
      { x: 3, y: 3 }, // red
      { x: 4, y: 4 }, // blue
      { x: 4, y: 3 }, // red
      { x: 0, y: 0 }, // blue (elsewhere)
      { x: 5, y: 3 }, // red
      { x: 0, y: 1 }, // blue
      { x: 3, y: 4 }, // red
      { x: 0, y: 2 }, // blue
      { x: 5, y: 4 }, // red
      { x: 0, y: 3 }, // blue
      { x: 3, y: 5 }, // red
      { x: 0, y: 4 }, // blue
      { x: 4, y: 5 }, // red
      { x: 0, y: 5 }, // blue
      { x: 5, y: 5 }, // red - closing the loop!
    ];

    for (const move of moves) {
      ctrl.makeMove(move);
    }

    const score = ctrl.getScore();
    expect(score.red).toBeGreaterThanOrEqual(1); // Should have captured blue at (4,4)
  });

  it('pass switches turn', () => {
    const ctrl = createController();
    expect(ctrl.getCurrentPlayer()).toBe('red');
    ctrl.pass();
    expect(ctrl.getCurrentPlayer()).toBe('blue');
  });

  it('two consecutive passes end the game', () => {
    const ctrl = createController();
    ctrl.pass();
    ctrl.pass();
    expect(ctrl.getPhase()).toBe('gameOver');
  });

  it('game ends when board is full', () => {
    const ctrl = createController({ boardWidth: 2, boardHeight: 2 });
    ctrl.makeMove({ x: 0, y: 0 });
    ctrl.makeMove({ x: 1, y: 0 });
    ctrl.makeMove({ x: 0, y: 1 });
    const result = ctrl.makeMove({ x: 1, y: 1 });
    expect(result.gameOver).toBe(true);
    expect(ctrl.getPhase()).toBe('gameOver');
  });

  it('move history tracks all moves', () => {
    const ctrl = createController();
    ctrl.makeMove({ x: 0, y: 0 });
    ctrl.makeMove({ x: 1, y: 1 });
    ctrl.makeMove({ x: 2, y: 2 });
    expect(ctrl.getMoveHistory()).toHaveLength(3);
  });

  it('canUndo / canRedo reflect state', () => {
    const ctrl = createController();
    expect(ctrl.canUndo()).toBe(false);
    expect(ctrl.canRedo()).toBe(false);
    ctrl.makeMove({ x: 0, y: 0 });
    expect(ctrl.canUndo()).toBe(true);
    ctrl.undo();
    expect(ctrl.canRedo()).toBe(true);
    expect(ctrl.canUndo()).toBe(false);
  });
});
