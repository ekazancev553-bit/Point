import { GameConfig, Player, Score } from './types';
import { Router } from './ui/Router';
import { MenuScreen } from './ui/screens/MenuScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT } from './constants';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from './constants';

const app = document.getElementById('app')!;
const router = new Router(app);

let currentConfig: GameConfig = getDefaultConfig('pvp');
const settingsScreen = new SettingsScreen();

function getDefaultConfig(mode: 'pvp' | 'pve'): GameConfig {
  const saved = settingsScreen.getSettings();
  return {
    boardWidth: saved.boardWidth || DEFAULT_BOARD_WIDTH,
    boardHeight: saved.boardHeight || DEFAULT_BOARD_HEIGHT,
    player1Name: saved.player1Name || 'Игрок 1',
    player2Name: mode === 'pve' ? 'ИИ' : (saved.player2Name || 'Игрок 2'),
    player1Color: PLAYER_1_COLOR,
    player2Color: PLAYER_2_COLOR,
    gameMode: mode,
    aiDifficulty: saved.aiDifficulty || 'medium',
    aiPlayer: 'blue',
  };
}

function showMenu(): void {
  const menu = new MenuScreen();
  menu.onNewGameAI = () => {
    currentConfig = getDefaultConfig('pve');
    startGame(currentConfig);
  };
  menu.onNewGamePvP = () => {
    currentConfig = getDefaultConfig('pvp');
    startGame(currentConfig);
  };
  menu.onOnline = () => {
    // TODO: Online mode
  };
  menu.onSettings = () => showSettings();
  router.showScreen(menu);
}

function showSettings(): void {
  settingsScreen.onBack = () => showMenu();
  router.showScreen(settingsScreen);
}

function startGame(config: GameConfig): void {
  const gameScreen = new GameScreen();
  gameScreen.start(config);
  gameScreen.onGameOver = (winner: Player | null) => {
    const ctrl = (gameScreen as any).controller;
    const score: Score = ctrl ? ctrl.getScore() : { red: 0, blue: 0 };
    showGameOver(winner, score, config);
  };
  gameScreen.onMenu = () => showMenu();
  router.showScreen(gameScreen);
}

function showGameOver(winner: Player | null, score: Score, config: GameConfig): void {
  const gameOver = new GameOverScreen(winner, score, config);
  gameOver.onPlayAgain = () => startGame(config);
  gameOver.onMainMenu = () => showMenu();
  gameOver.mount(document.body);
}

// Start
showMenu();
