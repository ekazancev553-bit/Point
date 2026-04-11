import { GameSummary, GameConfig, Score, Move, Player } from '../types';
import { StorageService } from './StorageService';

const HISTORY_KEY = 'point-game-history';
const CURRENT_GAME_KEY = 'point-current-game';
const MAX_HISTORY = 50;

export interface SavedGame {
  config: GameConfig;
  moves: Array<{ x: number; y: number; player: Player }>;
  timestamp: number;
}

export class GameHistoryStore {
  private storage: StorageService;

  constructor() {
    this.storage = new StorageService();
  }

  saveCurrentGame(config: GameConfig, moves: Move[]): void {
    const saved: SavedGame = {
      config,
      moves: moves.map(m => ({ x: m.point.x, y: m.point.y, player: m.player })),
      timestamp: Date.now(),
    };
    this.storage.set(CURRENT_GAME_KEY, saved);
  }

  loadCurrentGame(): SavedGame | null {
    return this.storage.get<SavedGame>(CURRENT_GAME_KEY);
  }

  clearCurrentGame(): void {
    this.storage.remove(CURRENT_GAME_KEY);
  }

  addToHistory(config: GameConfig, finalScore: Score, winner: Player | null, moves: Move[], duration: number): void {
    const history = this.getHistory();
    const summary: GameSummary = {
      id: `game-${Date.now()}`,
      date: Date.now(),
      config,
      finalScore,
      winner,
      totalMoves: moves.length,
      duration,
      moves,
    };
    history.unshift(summary);
    if (history.length > MAX_HISTORY) history.pop();
    this.storage.set(HISTORY_KEY, history);
  }

  getHistory(): GameSummary[] {
    return this.storage.get<GameSummary[]>(HISTORY_KEY) || [];
  }

  clearHistory(): void {
    this.storage.remove(HISTORY_KEY);
  }
}
