import { Player, Score, GameConfig } from '../../types';
import { theme, playerColor } from '../theme';
import { Screen } from '../Router';

export class GameOverScreen implements Screen {
  private el: HTMLElement | null = null;
  private winner: Player | null;
  private score: Score;
  private config: GameConfig;
  onPlayAgain: () => void = () => {};
  onMainMenu: () => void = () => {};

  constructor(winner: Player | null, score: Score, config: GameConfig) {
    this.winner = winner;
    this.score = score;
    this.config = config;
  }

  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; z-index: 100;
      background: rgba(15, 15, 35, 0.92); backdrop-filter: blur(8px);
      font-family: ${theme.fontFamily}; padding: 24px;
      animation: fadeIn 0.3s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: ${theme.surface}; border-radius: 16px;
      border: 1px solid ${theme.border}; padding: 32px;
      text-align: center; max-width: 340px; width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.4s ease;
    `;

    // Result
    const resultText = document.createElement('h2');
    if (this.winner) {
      const name = this.winner === 'red' ? this.config.player1Name : this.config.player2Name;
      resultText.textContent = `${name} победил!`;
      resultText.style.cssText = `
        color: ${playerColor(this.winner)}; font-size: 26px;
        margin: 0 0 24px 0; font-weight: 700;
      `;
    } else {
      resultText.textContent = 'Ничья!';
      resultText.style.cssText = `
        color: ${theme.accent}; font-size: 26px;
        margin: 0 0 24px 0; font-weight: 700;
      `;
    }

    // Scores
    const scoreRow = document.createElement('div');
    scoreRow.style.cssText = `
      display: flex; justify-content: center; gap: 32px; margin-bottom: 28px;
    `;

    scoreRow.appendChild(this.createScoreBlock(this.config.player1Name, this.score.red, 'red'));
    scoreRow.appendChild(this.createScoreBlock(this.config.player2Name, this.score.blue, 'blue'));

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const playAgainBtn = document.createElement('button');
    playAgainBtn.textContent = 'Играть снова';
    playAgainBtn.style.cssText = `
      padding: 12px; font-size: 15px; font-weight: 600;
      background: ${theme.accent}; color: #000; border: none;
      border-radius: ${theme.borderRadiusSm}; cursor: pointer;
      font-family: ${theme.fontFamily}; transition: ${theme.transition};
    `;
    playAgainBtn.addEventListener('click', () => this.onPlayAgain());

    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'Главное меню';
    menuBtn.style.cssText = `
      padding: 12px; font-size: 15px; font-weight: 500;
      background: ${theme.surfaceLight}; color: ${theme.text};
      border: 1px solid ${theme.border}; border-radius: ${theme.borderRadiusSm};
      cursor: pointer; font-family: ${theme.fontFamily}; transition: ${theme.transition};
    `;
    menuBtn.addEventListener('click', () => this.onMainMenu());

    btnContainer.appendChild(playAgainBtn);
    btnContainer.appendChild(menuBtn);

    card.appendChild(resultText);
    card.appendChild(scoreRow);
    card.appendChild(btnContainer);

    // Animations style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
    `;

    this.el.appendChild(style);
    this.el.appendChild(card);
    container.appendChild(this.el);
  }

  private createScoreBlock(name: string, score: number, player: Player): HTMLElement {
    const block = document.createElement('div');
    block.style.cssText = 'text-align: center;';

    const nameEl = document.createElement('div');
    nameEl.textContent = name;
    nameEl.style.cssText = `
      font-size: 13px; color: ${theme.textSecondary}; margin-bottom: 4px;
    `;

    const scoreEl = document.createElement('div');
    scoreEl.textContent = String(score);
    scoreEl.style.cssText = `
      font-size: 42px; font-weight: 800; color: ${playerColor(player)};
      line-height: 1;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = 'захвачено';
    labelEl.style.cssText = `font-size: 11px; color: ${theme.textMuted}; margin-top: 2px;`;

    block.appendChild(nameEl);
    block.appendChild(scoreEl);
    block.appendChild(labelEl);
    return block;
  }

  unmount(): void {
    this.el?.remove();
    this.el = null;
  }
}
