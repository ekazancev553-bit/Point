import { theme } from '../theme';

export class Toolbar {
  private el: HTMLElement | null = null;
  private undoBtn: HTMLButtonElement | null = null;
  private redoBtn: HTMLButtonElement | null = null;
  private passBtn: HTMLButtonElement | null = null;
  private menuBtn: HTMLButtonElement | null = null;

  private handlers = {
    undo: () => {},
    redo: () => {},
    pass: () => {},
    menu: () => {},
  };

  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      display: flex; justify-content: center; align-items: center;
      padding: 8px 16px; margin-top: 8px; gap: 8px;
      background: ${theme.surface}; border-radius: ${theme.borderRadius};
      border: 1px solid ${theme.border}; width: 100%; max-width: 500px;
    `;

    this.undoBtn = this.createButton('↩', 'Отменить', () => this.handlers.undo());
    this.redoBtn = this.createButton('↪', 'Повторить', () => this.handlers.redo());
    this.passBtn = this.createButton('⏭', 'Пас', () => this.handlers.pass());
    this.menuBtn = this.createButton('☰', 'Меню', () => this.handlers.menu());

    this.el.appendChild(this.undoBtn);
    this.el.appendChild(this.redoBtn);
    this.el.appendChild(this.createSpacer());
    this.el.appendChild(this.passBtn);
    this.el.appendChild(this.createSpacer());
    this.el.appendChild(this.menuBtn);
    container.appendChild(this.el);
  }

  private createButton(icon: string, label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.style.cssText = `
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      background: ${theme.surfaceLight}; border: 1px solid ${theme.border};
      border-radius: ${theme.borderRadiusSm}; color: ${theme.text};
      padding: 8px 16px; cursor: pointer; font-size: 20px;
      transition: ${theme.transition}; min-width: 56px;
      font-family: ${theme.fontFamily};
    `;
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.cssText = `font-size: 10px; color: ${theme.textSecondary};`;
    btn.appendChild(iconSpan);
    btn.appendChild(labelSpan);

    btn.addEventListener('click', onClick);
    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) btn.style.background = theme.surfaceHover;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = btn.disabled ? theme.surface : theme.surfaceLight;
    });
    return btn;
  }

  private createSpacer(): HTMLElement {
    const s = document.createElement('div');
    s.style.flex = '1';
    return s;
  }

  onUndo(cb: () => void) { this.handlers.undo = cb; }
  onRedo(cb: () => void) { this.handlers.redo = cb; }
  onPass(cb: () => void) { this.handlers.pass = cb; }
  onMenu(cb: () => void) { this.handlers.menu = cb; }

  setUndoEnabled(enabled: boolean): void {
    if (!this.undoBtn) return;
    this.undoBtn.disabled = !enabled;
    this.undoBtn.style.opacity = enabled ? '1' : '0.35';
    this.undoBtn.style.cursor = enabled ? 'pointer' : 'default';
  }

  setRedoEnabled(enabled: boolean): void {
    if (!this.redoBtn) return;
    this.redoBtn.disabled = !enabled;
    this.redoBtn.style.opacity = enabled ? '1' : '0.35';
    this.redoBtn.style.cursor = enabled ? 'pointer' : 'default';
  }

  unmount(): void {
    this.el?.remove();
    this.el = null;
  }
}
