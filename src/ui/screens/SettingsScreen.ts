import { GameConfig } from '../../types';
import { theme } from '../theme';
import { Screen } from '../Router';
import { DEFAULT_BOARD_WIDTH, MIN_BOARD_SIZE, MAX_BOARD_SIZE } from '../../constants';

const STORAGE_KEY = 'point-settings';

interface Settings {
  boardSize: number;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  player1Name: string;
  player2Name: string;
}

function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return {
    boardSize: DEFAULT_BOARD_WIDTH,
    aiDifficulty: 'medium',
    player1Name: 'Игрок 1',
    player2Name: 'Игрок 2',
  };
}

function saveSettings(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export class SettingsScreen implements Screen {
  private el: HTMLElement | null = null;
  private settings: Settings;
  onBack: () => void = () => {};

  constructor() {
    this.settings = loadSettings();
  }

  mount(container: HTMLElement): void {
    this.settings = loadSettings();
    this.el = document.createElement('div');
    this.el.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      height: 100%; padding: 24px; font-family: ${theme.fontFamily};
      overflow-y: auto;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; align-items: center; width: 100%; max-width: 400px;
      margin-bottom: 24px; gap: 12px;
    `;
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Назад';
    backBtn.style.cssText = `
      background: none; border: none; color: ${theme.accent};
      font-size: 15px; cursor: pointer; padding: 8px 0;
      font-family: ${theme.fontFamily};
    `;
    backBtn.addEventListener('click', () => {
      saveSettings(this.settings);
      this.onBack();
    });
    const titleEl = document.createElement('h2');
    titleEl.textContent = 'Настройки';
    titleEl.style.cssText = `color: ${theme.text}; margin: 0; font-size: 22px;`;
    header.appendChild(backBtn);
    header.appendChild(titleEl);

    const card = document.createElement('div');
    card.style.cssText = `
      background: ${theme.surface}; border-radius: ${theme.borderRadius};
      border: 1px solid ${theme.border}; padding: 20px;
      width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 20px;
    `;

    // Board size slider
    const sizeLabel = document.createElement('div');
    const sizeValue = document.createElement('span');
    sizeValue.textContent = `${this.settings.boardSize}×${this.settings.boardSize}`;
    sizeValue.style.cssText = `color: ${theme.accent}; font-weight: 600;`;
    sizeLabel.style.cssText = `color: ${theme.text}; font-size: 14px; margin-bottom: 6px;`;
    sizeLabel.textContent = 'Размер поля: ';
    sizeLabel.appendChild(sizeValue);

    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = String(MIN_BOARD_SIZE);
    sizeSlider.max = String(MAX_BOARD_SIZE);
    sizeSlider.value = String(this.settings.boardSize);
    sizeSlider.style.cssText = `width: 100%; accent-color: ${theme.accent};`;
    sizeSlider.addEventListener('input', () => {
      this.settings.boardSize = Number(sizeSlider.value);
      sizeValue.textContent = `${this.settings.boardSize}×${this.settings.boardSize}`;
    });

    const sizeGroup = this.createGroup();
    sizeGroup.appendChild(sizeLabel);
    sizeGroup.appendChild(sizeSlider);

    // AI difficulty
    const diffGroup = this.createGroup();
    const diffLabel = document.createElement('div');
    diffLabel.textContent = 'Сложность ИИ';
    diffLabel.style.cssText = `color: ${theme.text}; font-size: 14px; margin-bottom: 8px;`;
    diffGroup.appendChild(diffLabel);

    const diffBtns = document.createElement('div');
    diffBtns.style.cssText = `display: flex; gap: 8px;`;
    const difficulties: Array<{ key: 'easy' | 'medium' | 'hard'; label: string }> = [
      { key: 'easy', label: 'Лёгкий' },
      { key: 'medium', label: 'Средний' },
      { key: 'hard', label: 'Сложный' },
    ];
    const diffButtons: HTMLButtonElement[] = [];
    for (const d of difficulties) {
      const btn = document.createElement('button');
      btn.textContent = d.label;
      btn.style.cssText = `
        flex: 1; padding: 8px; font-size: 13px; border-radius: ${theme.borderRadiusSm};
        border: 1px solid ${theme.border}; cursor: pointer;
        font-family: ${theme.fontFamily}; transition: ${theme.transition};
        background: ${this.settings.aiDifficulty === d.key ? theme.accent : theme.surfaceLight};
        color: ${this.settings.aiDifficulty === d.key ? '#000' : theme.text};
        font-weight: ${this.settings.aiDifficulty === d.key ? '600' : '400'};
      `;
      btn.addEventListener('click', () => {
        this.settings.aiDifficulty = d.key;
        diffButtons.forEach((b, i) => {
          const isActive = difficulties[i].key === d.key;
          b.style.background = isActive ? theme.accent : theme.surfaceLight;
          b.style.color = isActive ? '#000' : theme.text;
          b.style.fontWeight = isActive ? '600' : '400';
        });
      });
      diffButtons.push(btn);
      diffBtns.appendChild(btn);
    }
    diffGroup.appendChild(diffBtns);

    // Player names
    const namesGroup = this.createGroup();
    const p1Input = this.createInput('Имя игрока 1', this.settings.player1Name, v => {
      this.settings.player1Name = v || 'Игрок 1';
    });
    const p2Input = this.createInput('Имя игрока 2', this.settings.player2Name, v => {
      this.settings.player2Name = v || 'Игрок 2';
    });
    namesGroup.appendChild(p1Input);
    namesGroup.appendChild(p2Input);

    card.appendChild(sizeGroup);
    card.appendChild(diffGroup);
    card.appendChild(namesGroup);

    this.el.appendChild(header);
    this.el.appendChild(card);
    container.appendChild(this.el);
  }

  private createGroup(): HTMLElement {
    const g = document.createElement('div');
    g.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
    return g;
  }

  private createInput(placeholder: string, value: string, onChange: (v: string) => void): HTMLElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = value;
    input.style.cssText = `
      padding: 10px 12px; font-size: 14px; border-radius: ${theme.borderRadiusSm};
      border: 1px solid ${theme.border}; background: ${theme.surfaceLight};
      color: ${theme.text}; outline: none; font-family: ${theme.fontFamily};
      transition: ${theme.transition};
    `;
    input.addEventListener('focus', () => { input.style.borderColor = theme.accent; });
    input.addEventListener('blur', () => { input.style.borderColor = theme.border; });
    input.addEventListener('input', () => onChange(input.value));
    return input;
  }

  getSettings(): Partial<GameConfig> {
    return {
      boardWidth: this.settings.boardSize,
      boardHeight: this.settings.boardSize,
      aiDifficulty: this.settings.aiDifficulty,
      player1Name: this.settings.player1Name,
      player2Name: this.settings.player2Name,
    };
  }

  unmount(): void {
    saveSettings(this.settings);
    this.el?.remove();
    this.el = null;
  }
}
