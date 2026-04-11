import { GameConfig, Player } from '../../types';
import { theme } from '../theme';
import { Screen } from '../Router';

export class LobbyScreen implements Screen {
  private el: HTMLElement | null = null;
  private serverUrl: string = '';
  private playerName: string = '';
  private boardSize: { width: number; height: number } = { width: 10, height: 10 };
  private isConnecting: boolean = false;

  onGameStart: (config: GameConfig, playerName: string, serverUrl: string) => void = () => {};
  onMenu: () => void = () => {};

  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 20px;
      font-family: ${theme.fontFamily};
      background: linear-gradient(135deg, ${theme.colors.darkBg}, ${theme.colors.boardBg});
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Онлайн игра';
    title.style.cssText = `
      color: ${theme.colors.text};
      margin-bottom: 30px;
      font-size: 28px;
    `;
    this.el.appendChild(title);

    // Form container
    const form = document.createElement('div');
    form.style.cssText = `
      background: ${theme.colors.boardBg};
      padding: 20px;
      border-radius: ${theme.borderRadius};
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    // Server URL input
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'Адрес сервера:';
    urlLabel.style.cssText = `
      display: block;
      color: ${theme.colors.text};
      margin-bottom: 8px;
      font-size: 14px;
    `;
    form.appendChild(urlLabel);

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'ws://localhost:3000';
    urlInput.value = 'ws://localhost:3000';
    urlInput.style.cssText = `
      width: 100%;
      padding: 10px;
      margin-bottom: 20px;
      border: 1px solid ${theme.colors.border};
      border-radius: 4px;
      background: ${theme.colors.darkBg};
      color: ${theme.colors.text};
      font-size: 14px;
      box-sizing: border-box;
    `;
    urlInput.addEventListener('change', (e) => {
      this.serverUrl = (e.target as HTMLInputElement).value;
    });
    form.appendChild(urlInput);

    // Player name input
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Ваше имя:';
    nameLabel.style.cssText = `
      display: block;
      color: ${theme.colors.text};
      margin-bottom: 8px;
      font-size: 14px;
    `;
    form.appendChild(nameLabel);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Игрок 1';
    nameInput.maxLength = 20;
    nameInput.style.cssText = `
      width: 100%;
      padding: 10px;
      margin-bottom: 20px;
      border: 1px solid ${theme.colors.border};
      border-radius: 4px;
      background: ${theme.colors.darkBg};
      color: ${theme.colors.text};
      font-size: 14px;
      box-sizing: border-box;
    `;
    nameInput.addEventListener('change', (e) => {
      this.playerName = (e.target as HTMLInputElement).value;
    });
    form.appendChild(nameInput);

    // Board size selector
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Размер доски:';
    sizeLabel.style.cssText = `
      display: block;
      color: ${theme.colors.text};
      margin-bottom: 8px;
      font-size: 14px;
    `;
    form.appendChild(sizeLabel);

    const sizeSelect = document.createElement('select');
    const sizes = [
      { label: '10x10', width: 10, height: 10 },
      { label: '15x15', width: 15, height: 15 },
      { label: '20x20', width: 20, height: 20 },
    ];
    for (const size of sizes) {
      const option = document.createElement('option');
      option.value = `${size.width}x${size.height}`;
      option.textContent = size.label;
      sizeSelect.appendChild(option);
    }
    sizeSelect.style.cssText = `
      width: 100%;
      padding: 10px;
      margin-bottom: 20px;
      border: 1px solid ${theme.colors.border};
      border-radius: 4px;
      background: ${theme.colors.darkBg};
      color: ${theme.colors.text};
      font-size: 14px;
      box-sizing: border-box;
    `;
    sizeSelect.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      const [width, height] = value.split('x').map(Number);
      this.boardSize = { width, height };
    });
    form.appendChild(sizeSelect);

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 20px;
    `;

    const connectBtn = document.createElement('button');
    connectBtn.textContent = 'Подключиться';
    connectBtn.style.cssText = `
      flex: 1;
      padding: 12px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      border-radius: ${theme.borderRadius};
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    connectBtn.addEventListener('mouseenter', () => {
      connectBtn.style.transform = 'scale(1.05)';
      connectBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    });
    connectBtn.addEventListener('mouseleave', () => {
      connectBtn.style.transform = 'scale(1)';
      connectBtn.style.boxShadow = 'none';
    });
    connectBtn.addEventListener('click', () => {
      this.handleConnect();
    });
    buttonContainer.appendChild(connectBtn);

    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'Меню';
    menuBtn.style.cssText = `
      flex: 1;
      padding: 12px;
      background: ${theme.colors.boardBg};
      color: ${theme.colors.text};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius};
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    `;
    menuBtn.addEventListener('click', () => {
      this.onMenu();
    });
    buttonContainer.appendChild(menuBtn);

    form.appendChild(buttonContainer);
    this.el.appendChild(form);

    // Status message
    const status = document.createElement('div');
    status.id = 'lobby-status';
    status.style.cssText = `
      color: ${theme.colors.text};
      margin-top: 20px;
      font-size: 14px;
      text-align: center;
    `;
    this.el.appendChild(status);

    container.appendChild(this.el);

    // Set initial values
    this.serverUrl = urlInput.value;
  }

  private handleConnect(): void {
    if (this.isConnecting) return;

    const status = document.getElementById('lobby-status');
    if (!status) return;

    if (!this.playerName) {
      status.textContent = 'Введите имя игрока';
      status.style.color = '#ef4444';
      return;
    }

    if (!this.serverUrl) {
      status.textContent = 'Введите адрес сервера';
      status.style.color = '#ef4444';
      return;
    }

    this.isConnecting = true;
    status.textContent = 'Подключение...';
    status.style.color = '#3b82f6';

    // Emit event to start online game
    const config: GameConfig = {
      boardWidth: this.boardSize.width,
      boardHeight: this.boardSize.height,
      gameMode: 'online',
    };

    // Give async nature of connection some time
    setTimeout(() => {
      this.onGameStart(config, this.playerName, this.serverUrl);
    }, 100);
  }

  unmount(): void {
    this.el?.remove();
    this.el = null;
  }
}
