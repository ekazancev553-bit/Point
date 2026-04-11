import { Player, Point, GameConfig, GamePhase, Score, Move, MoveResult } from '../types';
import { Board } from './Board';
import { CaptureDetector } from './CaptureDetector';
import { GameRules } from './GameRules';
import { History, MoveRecord } from './History';
import { EventBus } from '../utils/EventBus';

export class GameController {
  private board: Board;
  private history: History;
  private captureDetector: CaptureDetector;
  private config: GameConfig;
  private phase: GamePhase;
  private currentPlayer: Player;
  private consecutivePasses: number = 0;
  private moveCount: number = 0;
  private eventBus: EventBus;

  constructor(config: GameConfig, eventBus: EventBus) {
    this.config = config;
    this.eventBus = eventBus;
    this.board = new Board(config.boardWidth, config.boardHeight);
    this.history = new History();
    this.captureDetector = new CaptureDetector();
    this.phase = 'setup';
    this.currentPlayer = 'red';
  }

  startGame(): void {
    this.phase = 'playing';
    this.eventBus.emit('game:started', this.config);
  }

  getPhase(): GamePhase { return this.phase; }
  getCurrentPlayer(): Player { return this.currentPlayer; }
  getBoard(): Board { return this.board; }
  getConfig(): GameConfig { return this.config; }
  getMoveHistory(): Move[] { return this.history.getMoveList(); }
  canUndo(): boolean { return this.history.canUndo(); }
  canRedo(): boolean { return this.history.canRedo(); }

  getScore(): Score {
    return GameRules.calculateScore(this.board);
  }

  makeMove(point: Point): MoveResult {
    if (this.phase !== 'playing') {
      return { success: false, error: 'Game is not in playing phase' };
    }
    if (!GameRules.isValidMove(this.board, point)) {
      return { success: false, error: 'Invalid move' };
    }

    this.moveCount++;
    this.consecutivePasses = 0;

    // Place the dot
    this.board.placeDot(point, this.currentPlayer, this.moveCount);

    // Detect captures
    const captures = this.captureDetector.detectCaptures(this.board, point, this.currentPlayer);

    // Store dots that were not captured before but are now being captured
    const newlyCapturedDots: { point: Point; owner: Player }[] = [];
    for (const region of captures) {
      for (const cp of region.capturedDots) {
        const dot = this.board.getDot(cp);
        if (dot && !dot.captured) {
          newlyCapturedDots.push({ point: cp, owner: dot.owner });
        }
      }
    }

    // Apply captures
    for (const region of captures) {
      const uncapturedDots = region.capturedDots.filter(cp => {
        const dot = this.board.getDot(cp);
        return dot && !dot.captured;
      });
      this.board.markCaptured(uncapturedDots, this.currentPlayer);
    }

    // Create move record
    const move: Move = {
      point,
      player: this.currentPlayer,
      moveNumber: this.moveCount,
      captures,
      timestamp: Date.now(),
    };

    const record: MoveRecord = {
      move,
      capturedDotsBefore: newlyCapturedDots,
    };

    this.history.push(record);

    this.eventBus.emit('move:made', move);
    if (captures.length > 0) {
      this.eventBus.emit('capture:detected', captures);
    }

    // Check game over
    const gameOver = GameRules.isGameOver(this.board, this.consecutivePasses);
    if (gameOver) {
      this.phase = 'gameOver';
      const winner = GameRules.getWinner(this.board);
      this.eventBus.emit('game:over', winner, this.getScore());
      return { success: true, captures, gameOver: true, winner };
    }

    // Switch turn
    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
    this.eventBus.emit('turn:changed', this.currentPlayer);

    return { success: true, captures, gameOver: false };
  }

  pass(): void {
    if (this.phase !== 'playing') return;
    this.consecutivePasses++;
    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
    this.eventBus.emit('turn:changed', this.currentPlayer);

    if (GameRules.isGameOver(this.board, this.consecutivePasses)) {
      this.phase = 'gameOver';
      const winner = GameRules.getWinner(this.board);
      this.eventBus.emit('game:over', winner, this.getScore());
    }
  }

  undo(): boolean {
    if (this.phase === 'gameOver') {
      this.phase = 'playing';
    }
    const record = this.history.undo();
    if (!record) return false;

    // Undo captures
    for (const { point } of record.capturedDotsBefore) {
      this.board.unmarkCaptured([point]);
    }

    // Remove the dot
    this.board.removeDot(record.move.point);
    this.moveCount--;
    this.currentPlayer = record.move.player;
    this.consecutivePasses = 0;

    this.eventBus.emit('undo:performed');
    this.eventBus.emit('turn:changed', this.currentPlayer);
    return true;
  }

  redo(): boolean {
    const record = this.history.redo();
    if (!record) return false;

    this.moveCount++;
    this.board.placeDot(record.move.point, record.move.player, this.moveCount);

    // Re-apply captures
    for (const { point } of record.capturedDotsBefore) {
      this.board.markCaptured([point], record.move.player);
    }

    this.currentPlayer = record.move.player === 'red' ? 'blue' : 'red';
    this.consecutivePasses = 0;

    // Check game over after redo
    if (GameRules.isGameOver(this.board, this.consecutivePasses)) {
      this.phase = 'gameOver';
      const winner = GameRules.getWinner(this.board);
      this.eventBus.emit('game:over', winner, this.getScore());
    }

    this.eventBus.emit('redo:performed');
    this.eventBus.emit('turn:changed', this.currentPlayer);
    return true;
  }

  endGame(): void {
    this.phase = 'gameOver';
    const winner = GameRules.getWinner(this.board);
    this.eventBus.emit('game:over', winner, this.getScore());
  }
}
