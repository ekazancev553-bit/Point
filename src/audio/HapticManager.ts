type HapticType = 'light' | 'medium' | 'heavy' | 'error';

export class HapticManager {
  private enabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('point-haptic-enabled');
    if (saved !== null) this.enabled = saved === 'true';
  }

  vibrate(type: HapticType): void {
    if (!this.enabled) return;
    if (!navigator.vibrate) return;

    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(30);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'error':
        navigator.vibrate([10, 30, 10, 30, 10]);
        break;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('point-haptic-enabled', String(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
