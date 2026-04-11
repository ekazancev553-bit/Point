export type Player = 'red' | 'blue';

export interface Point {
  x: number;
  y: number;
}

export interface Dot {
  point: Point;
  owner: Player;
  captured: boolean;
  capturedBy?: Player;
  moveNumber: number;
}

export interface CapturedRegion {
  boundary: Point[];
  interior: Point[];
  capturedDots: Point[];
  owner: Player;
}

export interface Move {
  point: Point;
  player: Player;
  moveNumber: number;
  captures: CapturedRegion[];
  timestamp: number;
}

export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  player1Name: string;
  player2Name: string;
  player1Color: string;
  player2Color: string;
  gameMode: 'pvp' | 'pve' | 'online';
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  aiPlayer?: Player;
}

export type GamePhase = 'menu' | 'setup' | 'playing' | 'paused' | 'gameOver';

export interface Score {
  red: number;
  blue: number;
}

export interface MoveResult {
  success: boolean;
  error?: string;
  captures?: CapturedRegion[];
  gameOver?: boolean;
  winner?: Player | null;
}

export interface SerializedGameState {
  config: GameConfig;
  moves: Move[];
  phase: GamePhase;
  currentPlayer: Player;
  score: Score;
  timestamp: number;
  id: string;
}

export interface GameSummary {
  id: string;
  date: number;
  config: GameConfig;
  finalScore: Score;
  winner: Player | null;
  totalMoves: number;
  duration: number;
  moves: Move[];
}
