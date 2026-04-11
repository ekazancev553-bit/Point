import { Point, Player, GameConfig, GamePhase, Score, Move, MoveResult, CapturedRegion } from '../types';
import { Board } from '../engine/Board';
import { OnlineClient } from './OnlineClient';
import { EventBus } from '../utils/EventBus';

/**
 * Adapts OnlineClient to match the GameController interface.
 * Maintains a local shadow copy of game state that syncs with server.
 */
export class OnlineGameAdapter {
  private onlineClient: OnlineClient;
  private eventBus: EventBus;
  private board: Board;
  private phase: GamePhase = 'setup';
  private currentPlayer: Player = 'red';
  private score: Score = { red: 0, blue: 0, redCaptured: 0, blueCaptured: 0 };
  private moveHistory: Move[] = [];
  private players: { id: string; name: string; color: Player }[] = [];

  constructor(onlineClient: OnlineClient, eventBus: EventBus, config: GameConfig) {
    this.onlineClient = onlineClient;
    this.eventBus = eventBus;
    this.board = new Board(config.boardWidth, config.boardHeight);

    // Listen to server events
    this.onlineClient.on('game:start', (data) => {
      this.phase = 'playing';
      this.currentPlayer = 'red';
      this.players = data.players;
      this.eventBus.emit('game:started', { boardWidth: config.boardWidth, boardHeight: config.boardHeight });
    });

    this.onlineClient.on('move:made', (data) => {
      // Update local board state
      this.board.placeDot(data.point, data.player, this.moveHistory.length + 1);

      // Apply captures
      if (data.captures && data.captures.length > 0) {
        for (const region of data.captures) {
          this.board.markCaptured(region.capturedDots, data.player);
        }
      }

      // Record move
      this.moveHistory.push({
        point: data.point,
        player: data.player,
        moveNumber: this.moveHistory.length + 1,
        captures: data.captures || [],
        timestamp: Date.now(),
      });

      // Update score
      const redDots = this.board.getDotsForPlayer('red');
      const blueDots = this.board.getDotsForPlayer('blue');
      this.score = {
        red: redDots.filter(d => !d.captured).length,
        blue: blueDots.filter(d => !d.captured).length,
        redCaptured: redDots.filter(d => d.captured).length,
        blueCaptured: blueDots.filter(d => d.captured).length,
      };

      // Switch current player
      this.currentPlayer = data.player === 'red' ? 'blue' : 'red';

      // Emit events
      this.eventBus.emit('move:made', {
        point: data.point,
        player: data.player,
        moveNumber: this.moveHistory.length,
        captures: data.captures || [],
        timestamp: Date.now(),
      });

      if (data.captures && data.captures.length > 0) {
        this.eventBus.emit('capture:detected', data.captures);
      }

      // Check game over
      if (data.gameOver) {
        this.phase = 'gameOver';
        this.eventBus.emit('game:over', data.winner, this.score);
      } else {
        this.eventBus.emit('turn:changed', this.currentPlayer);
      }
    });

    this.onlineClient.on('move:passed', (data) => {
      this.currentPlayer = data.currentPlayer;
      this.eventBus.emit('turn:changed', this.currentPlayer);
    });

    this.onlineClient.on('game:over', (data) => {
      this.phase = 'gameOver';
      this.eventBus.emit('game:over', data.winner, data.score);
    });

    this.onlineClient.on('player:disconnected', (data) => {
      this.eventBus.emit('error', { message: 'Opponent disconnected' });
    });

    this.onlineClient.on('error', (data) => {
      this.eventBus.emit('error', data);
    });
  }

  /**
   * Start the game (after joining room)
   */
  startGame(): void {
    // Game is started by server when both players join
  }

  /**
   * Get current game phase
   */
  getPhase(): GamePhase {
    return this.phase;
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  /**
   * Get board
   */
  getBoard(): Board {
    return this.board;
  }

  /**
   * Get current score
   */
  getScore(): Score {
    return this.score;
  }

  /**
   * Get move history
   */
  getMoveHistory(): Move[] {
    return this.moveHistory;
  }

  /**
   * Get players
   */
  getPlayers(): { id: string; name: string; color: Player }[] {
    return this.players;
  }

  /**
   * Make a move
   */
  makeMove(point: Point): MoveResult {
    // Send move to server, response will come via 'move:made' event
    this.onlineClient.makeMove(point);
    // Optimistic return (actual validation happens on server)
    return { success: true, captures: [], gameOver: false };
  }

  /**
   * Pass turn
   */
  pass(): void {
    this.onlineClient.pass();
  }

  /**
   * Undo is not supported in online games
   */
  canUndo(): boolean {
    return false;
  }

  /**
   * Redo is not supported in online games
   */
  canRedo(): boolean {
    return false;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.onlineClient.disconnect();
  }
}
