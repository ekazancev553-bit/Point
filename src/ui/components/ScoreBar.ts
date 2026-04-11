import { Player, Score, GameConfig } from '../../types';
import { theme, playerColor } from '../theme';

export class ScoreBar {
  private el: HTMLElement | null = null;
  private p1ScoreEl: HTMLElement | null = null;
  private p2ScoreEl: HTMLElement | null = null;
  private p1Block: HTMLElement | null = null;
  private p2Block: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; margin-bottom: 8px; gap: 12px;
      background: ${theme.surface}; border-radius: ${theme.borderRadius};
      border: 1px solid ${theme.border}; width: 100%; max-width: 500px;
    `;

    this.p1Block = this.createPlayerBlock('red', 'Игрок 1', true);
    const vs = document.createElement('span');
    vs.textContent = 'vs';
    vs.style.cssText = `color: ${theme.textMuted}; font-size: 14px; font-weight: 500;`;
    this.p2Block = this.createPlayerBlock('blue', 'Игрок 2', false);

    this.el.appendChild(this.p1Block);
    this.el.appendChild(vs);
    this.el.appendChild(this.p2Block);
    container.appendChild(this.el);
  }

  private createPlayerBlock(player: Player, name: string, isLeft: boolean): HTMLElement {
    const block = document.createElement('div');
    block.style.cssText = `
      display: flex; flex-direction: column; align-items: ${isLeft ? 'flex-start' : 'flex-end'};
      flex: 1; padding: 4px 8px; border-radius: ${theme.borderRadiusSm};
      transition: ${theme.transition};
    `;

    const nameEl = document.createElement('div');
    nameEl.style.cssText = `
      font-size: 13px; color: ${theme.textSecondary}; margin-bottom: 2px;
      font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 120px;
    `;
    nameEl.textContent = name;
    nameEl.dataset.role = 'name';

    const scoreEl = document.createElement('div');
    scoreEl.style.cssText = `
      font-size: 28px; font-weight: 700; color: ${playerColor(player)};
      line-height: 1; font-variant-numeric: tabular-nums;
    `;
    scoreEl.textContent = '0';

    block.appendChild(nameEl);
    block.appendChild(scoreEl);

    if (player === 'red') this.p1ScoreEl = scoreEl;
    else this.p2ScoreEl = scoreEl;

    return block;
  }

  update(score: Score, currentPlayer: Player, config: GameConfig): void {
    if (this.p1ScoreEl) this.p1ScoreEl.textContent = String(score.red);
    if (this.p2ScoreEl) this.p2ScoreEl.textContent = String(score.blue);

    // Update names
    const p1Name = this.p1Block?.querySelector('[data-role="name"]') as HTMLElement;
    const p2Name = this.p2Block?.querySelector('[data-role="name"]') as HTMLElement;
    if (p1Name) p1Name.textContent = config.player1Name;
    if (p2Name) p2Name.textContent = config.player2Name;

    // Highlight current player
    if (this.p1Block) {
      this.p1Block.style.background = currentPlayer === 'red'
        ? 'rgba(239, 68, 68, 0.1)' : 'transparent';
      this.p1Block.style.boxShadow = currentPlayer === 'red'
        ? '0 0 8px rgba(239, 68, 68, 0.15)' : 'none';
    }
    if (this.p2Block) {
      this.p2Block.style.background = currentPlayer === 'blue'
        ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
      this.p2Block.style.boxShadow = currentPlayer === 'blue'
        ? '0 0 8px rgba(59, 130, 246, 0.15)' : 'none';
    }
  }

  unmount(): void {
    this.el?.remove();
    this.el = null;
  }
}
