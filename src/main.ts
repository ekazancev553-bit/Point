import { GameConfig, Player, Score } from './types';
import { Router } from './ui/Router';
import { MenuScreen } from './ui/screens/MenuScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { LobbyScreen } from './ui/screens/LobbyScreen';
import { DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT } from './constants';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from './constants';
import { EventBus } from './utils/EventBus';
import { OnlineClient } from './online/OnlineClient';
import { OnlineGameAdapter } from './online/OnlineGameAdapter';

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
    showOnlineLobby();
  };
  menu.onSettings = () => showSettings();
  router.showScreen(menu);
}

function showSettings(): void {
  settingsScreen.onBack = () => showMenu();
  router.showScreen(settingsScreen);
}

function showOnlineLobby(): void {
  const lobby = new LobbyScreen();
  lobby.onMenu = () => showMenu();
  lobby.onGameStart = async (config: GameConfig, playerName: string, serverUrl: string) => {
    try {
      const eventBus = new EventBus();
      const onlineClient = new OnlineClient();

      // Connect to server
      await onlineClient.connect(serverUrl, playerName, config.boardWidth, config.boardHeight);

      // Wait for game to start
      await new Promise<void>((resolve) => {
        onlineClient.on('game:start', () => {
          resolve();
        });
      });

      // Create online game adapter
      const adapter = new OnlineGameAdapter(onlineClient, eventBus, config);

      // Show game screen
      const gameScreen = new GameScreen();
      gameScreen.onMenu = () => {
        adapter.disconnect();
        showMenu();
      };

      // Use adapter as controller in game screen
      (gameScreen as any).controller = adapter;
      (gameScreen as any).eventBus = eventBus;
      (gameScreen as any).config = config;

      gameScreen.onGameOver = (winner: Player | null) => {
        adapter.disconnect();
        const score: Score = adapter.getScore();
        showGameOver(winner, score, config);
      };

      router.showScreen(gameScreen);

      // Mount game screen
      requestAnimationFrame(() => {
        if ((gameScreen as any).canvas) {
          (gameScreen as any).renderBoard();
          (gameScreen as any).setupInput();
        }
      });
    } catch (error) {
      console.error('Failed to connect to online game:', error);
      alert('Ошибка подключения: ' + (error as Error).message);
      showMenu();
    }
  };
  router.showScreen(lobby);
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
