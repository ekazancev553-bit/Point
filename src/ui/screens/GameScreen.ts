import { Point, Player, GameConfig } from '../../types';
import { GameController } from '../../engine/GameController';
import { createAI, AIPlayer } from '../../ai/AIPlayer';
import { EventBus } from '../../utils/EventBus';
import { BoardRenderer } from '../components/BoardRenderer';
import { ScoreBar } from '../components/ScoreBar';
import { Toolbar } from '../components/Toolbar';
import { SoundManager } from '../../audio/SoundManager';
import { HapticManager } from '../../audio/HapticManager';
import { theme } from '../theme';
import { Screen } from '../Router';

export class GameScreen implements Screen {
  private el: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: BoardRenderer | null = null;
  private scoreBar: ScoreBar | null = null;
  private sound = new SoundManager();
  private haptic = new HapticManager();
  private toolbar: Toolbar | null = null;
  private controller: GameController | null = null;
  private eventBus: EventBus | null = null;
  private ai: AIPlayer | null = null;
  private config: GameConfig | null = null;

  private hoverPoint: Point | null = null;
  private lastMove: Point | undefined;
  private isAiThinking: boolean = false;
  private resizeHandler: (() => void) | null = null;

  onGameOver: (winner: Player | null) => void = () => {};
  onMenu: () => void = () => {};

  start(config: GameConfig): void {
    this.config = config;
    this.eventBus = new EventBus();
    this.controller = new GameController(config, this.eventBus);

    if (config.gameMode === 'pve' && config.aiDifficulty) {
      this.ai = createAI(config.aiDifficulty);
    }

    this.controller.startGame();
  }

  mount(container: HTMLElement): void {
    if (!this.controller || !this.config || !this.eventBus) return;

    this.el = document.createElement('div');
    this.el.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; padding: 12px;
      font-family: ${theme.fontFamily}; gap: 0;
    `;

    // Score bar
    this.scoreBar = new ScoreBar();
    this.scoreBar.mount(this.el);
    this.scoreBar.update(
      this.controller.getScore(),
      this.controller.getCurrentPlayer(),
      this.config
    );

    // Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      flex: 1; width: 100%; max-width: 500px; max-height: 70vh;
      border-radius: ${theme.borderRadius}; cursor: crosshair;
      touch-action: none;
    `;
    this.el.appendChild(this.canvas);

    // Toolbar
    this.toolbar = new Toolbar();
    this.toolbar.mount(this.el);
    this.toolbar.setUndoEnabled(false);
    this.toolbar.setRedoEnabled(false);
    this.toolbar.onUndo(() => this.handleUndo());
    this.toolbar.onRedo(() => this.handleRedo());
    this.toolbar.onPass(() => this.handlePass());
    this.toolbar.onMenu(() => this.onMenu());

    container.appendChild(this.el);

    // Initialize renderer after DOM insertion
    requestAnimationFrame(() => {
      if (!this.canvas || !this.config) return;
      this.renderer = new BoardRenderer(this.canvas, this.config.boardWidth, this.config.boardHeight);
      this.renderBoard();
      this.setupInput();
      this.setupResize();
    });

    // Listen to events
    this.eventBus.on('turn:changed', () => this.onTurnChanged());
    this.eventBus.on('game:over', (winner: unknown) => {
      this.renderBoard();
      setTimeout(() => this.onGameOver(winner as Player | null), 500);
    });

    // If AI goes first
    if (this.config.gameMode === 'pve' && this.config.aiPlayer === 'red') {
      setTimeout(() => this.doAiMove(), 300);
    }
  }

  private setupInput(): void {
    if (!this.canvas) return;

    const getPoint = (e: MouseEvent | Touch): Point | null => {
      if (!this.canvas || !this.renderer) return null;
      const rect = this.canvas.getBoundingClientRect();
      return this.renderer.canvasToGrid(e.clientX - rect.left, e.clientY - rect.top);
    };

    // Mouse
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isAiThinking) return;
      this.hoverPoint = getPoint(e);
      this.renderBoard();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverPoint = null;
      this.renderBoard();
    });

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      const p = getPoint(e);
      if (p) this.handleClick(p);
    });

    // Touch
    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length !== 1) return;
      const p = getPoint(e.touches[0]);
      if (p) {
        this.hoverPoint = p;
        this.renderBoard();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault();
      if (this.hoverPoint) {
        this.handleClick(this.hoverPoint);
        this.hoverPoint = null;
      }
    }, { passive: false });
  }

  private setupResize(): void {
    this.resizeHandler = () => {
      if (this.renderer) {
        this.renderer.resize();
        this.renderBoard();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  private handleClick(point: Point): void {
    if (!this.controller || this.isAiThinking) return;
    if (this.controller.getPhase() !== 'playing') return;

    // In PvE mode, only allow clicks on human player's turn
    if (this.config?.gameMode === 'pve') {
      const aiPlayer = this.config.aiPlayer || 'blue';
      if (this.controller.getCurrentPlayer() === aiPlayer) return;
    }

    const result = this.controller.makeMove(point);
    if (result.success) {
      this.lastMove = point;
      this.hoverPoint = null;
      this.renderBoard();
      this.updateToolbar();

      // Sound and haptic feedback
      if (result.captures && result.captures.length > 0) {
        this.sound.play('capture');
        this.haptic.vibrate('medium');
      } else {
        this.sound.play('place');
        this.haptic.vibrate('light');
      }

      if (result.gameOver) {
        this.sound.play('gameOver');
        this.haptic.vibrate('heavy');
      }

      // Trigger AI move
      if (!result.gameOver && this.config?.gameMode === 'pve' && this.ai) {
        setTimeout(() => this.doAiMove(), 400);
      }
    } else {
      this.haptic.vibrate('error');
    }
  }

  private doAiMove(): void {
    if (!this.controller || !this.ai) return;
    if (this.controller.getPhase() !== 'playing') return;

    this.isAiThinking = true;
    const board = this.controller.getBoard();
    const player = this.controller.getCurrentPlayer();

    // Run AI in next frame to not block UI
    requestAnimationFrame(() => {
      const move = this.ai!.chooseMove(board, player);
      const result = this.controller!.makeMove(move);
      this.isAiThinking = false;

      if (result.success) {
        this.lastMove = move;
        this.renderBoard();
        this.updateToolbar();
        if (result.captures && result.captures.length > 0) {
          this.sound.play('capture');
        } else {
          this.sound.play('place');
        }
      }
    });
  }

  private handleUndo(): void {
    if (!this.controller) return;

    // In PvE, undo both AI and player moves
    if (this.config?.gameMode === 'pve') {
      this.controller.undo(); // undo AI move
      this.controller.undo(); // undo player move
    } else {
      this.controller.undo();
    }

    this.sound.play('undo');
    const moves = this.controller.getMoveHistory();
    this.lastMove = moves.length > 0 ? moves[moves.length - 1].point : undefined;
    this.renderBoard();
    this.updateToolbar();
  }

  private handleRedo(): void {
    if (!this.controller) return;

    if (this.config?.gameMode === 'pve') {
      this.controller.redo(); // redo player move
      this.controller.redo(); // redo AI move
    } else {
      this.controller.redo();
    }

    const moves = this.controller.getMoveHistory();
    this.lastMove = moves.length > 0 ? moves[moves.length - 1].point : undefined;
    this.renderBoard();
    this.updateToolbar();
  }

  private handlePass(): void {
    if (!this.controller) return;
    this.controller.pass();
    this.renderBoard();
  }

  private onTurnChanged(): void {
    if (!this.controller || !this.config || !this.scoreBar) return;
    this.scoreBar.update(
      this.controller.getScore(),
      this.controller.getCurrentPlayer(),
      this.config
    );
  }

  private renderBoard(): void {
    if (!this.renderer || !this.controller) return;
    this.renderer.render(this.controller.getBoard(), {
      lastMove: this.lastMove,
      hoverPoint: this.hoverPoint,
      hoverPlayer: this.controller.getCurrentPlayer(),
    });
  }

  private updateToolbar(): void {
    if (!this.toolbar || !this.controller) return;
    this.toolbar.setUndoEnabled(this.controller.canUndo());
    this.toolbar.setRedoEnabled(this.controller.canRedo());
  }

  unmount(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.eventBus?.clear();
    this.scoreBar?.unmount();
    this.toolbar?.unmount();
    this.el?.remove();
    this.el = null;
    this.canvas = null;
    this.renderer = null;
    this.controller = null;
  }
}
