export interface Screen {
  mount(container: HTMLElement): void;
  unmount(): void;
}

export class Router {
  private container: HTMLElement;
  private currentScreen: Screen | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  showScreen(screen: Screen): void {
    if (this.currentScreen) {
      this.currentScreen.unmount();
    }
    this.container.innerHTML = '';
    this.currentScreen = screen;
    screen.mount(this.container);
  }

  clear(): void {
    if (this.currentScreen) {
      this.currentScreen.unmount();
      this.currentScreen = null;
    }
    this.container.innerHTML = '';
  }
}
