import { theme } from '../theme';
import { Screen } from '../Router';

export class MenuScreen implements Screen {
  private el: HTMLElement | null = null;
  onNewGameAI: () => void = () => {};
  onNewGamePvP: () => void = () => {};
  onOnline: () => void = () => {};
  onSettings: () => void = () => {};

  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; padding: 24px;
      font-family: ${theme.fontFamily}; gap: 16px;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'ТОЧКИ';
    title.style.cssText = `
      font-size: 56px; font-weight: 800; letter-spacing: 8px;
      color: ${theme.text}; margin: 0 0 4px 0;
      text-shadow: 0 0 30px rgba(245, 158, 11, 0.3),
                   0 0 60px rgba(245, 158, 11, 0.1);
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Классическая стратегическая игра';
    subtitle.style.cssText = `
      font-size: 15px; color: ${theme.textSecondary};
      margin: 0 0 32px 0; letter-spacing: 1px;
    `;

    // Decorative dots
    const dotsRow = document.createElement('div');
    dotsRow.style.cssText = `display: flex; gap: 8px; margin-bottom: 32px;`;
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement('div');
      const color = i % 2 === 0 ? theme.player1 : theme.player2;
      dot.style.cssText = `
        width: 10px; height: 10px; border-radius: 50%;
        background: ${color}; opacity: ${0.4 + i * 0.15};
      `;
      dotsRow.appendChild(dot);
    }

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
      display: flex; flex-direction: column; gap: 12px;
      width: 100%; max-width: 280px;
    `;

    const aiBtn = this.createButton('Игра с ИИ', theme.player1, () => this.onNewGameAI());
    const pvpBtn = this.createButton('Два игрока', theme.player2, () => this.onNewGamePvP());
    const onlineBtn = this.createButton('Онлайн', theme.textMuted, () => this.onOnline());
    onlineBtn.style.opacity = '0.5';
    onlineBtn.style.cursor = 'default';
    const settingsBtn = this.createButton('Настройки', theme.textSecondary, () => this.onSettings());

    btnContainer.appendChild(aiBtn);
    btnContainer.appendChild(pvpBtn);
    btnContainer.appendChild(onlineBtn);
    btnContainer.appendChild(settingsBtn);

    // Version
    const version = document.createElement('div');
    version.textContent = 'v1.0.0';
    version.style.cssText = `
      font-size: 12px; color: ${theme.textMuted};
      margin-top: 24px;
    `;

    this.el.appendChild(title);
    this.el.appendChild(subtitle);
    this.el.appendChild(dotsRow);
    this.el.appendChild(btnContainer);
    this.el.appendChild(version);
    container.appendChild(this.el);
  }

  private createButton(text: string, accentColor: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 14px 24px; font-size: 16px; font-weight: 600;
      background: ${theme.surface}; color: ${theme.text};
      border: 1px solid ${theme.border}; border-radius: ${theme.borderRadius};
      cursor: pointer; transition: all 0.25s ease;
      font-family: ${theme.fontFamily}; letter-spacing: 0.5px;
      border-left: 3px solid ${accentColor};
    `;
    btn.addEventListener('click', onClick);
    btn.addEventListener('mouseenter', () => {
      btn.style.background = theme.surfaceHover;
      btn.style.borderLeftWidth = '5px';
      btn.style.transform = 'translateX(2px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = theme.surface;
      btn.style.borderLeftWidth = '3px';
      btn.style.transform = 'none';
    });
    return btn;
  }

  unmount(): void {
    this.el?.remove();
    this.el = null;
  }
}
