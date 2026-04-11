type SoundName = 'place' | 'capture' | 'undo' | 'gameOver';

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    const saved = localStorage.getItem('point-sound-enabled');
    if (saved !== null) this.enabled = saved === 'true';
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  play(sound: SoundName): void {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      gainNode.gain.value = this.volume * 0.3;

      const now = ctx.currentTime;

      switch (sound) {
        case 'place':
          oscillator.frequency.setValueAtTime(600, now);
          oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
        case 'capture':
          oscillator.frequency.setValueAtTime(400, now);
          oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          oscillator.start(now);
          oscillator.stop(now + 0.25);
          break;
        case 'undo':
          oscillator.frequency.setValueAtTime(500, now);
          oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
        case 'gameOver':
          oscillator.frequency.setValueAtTime(523, now);
          oscillator.frequency.setValueAtTime(659, now + 0.15);
          oscillator.frequency.setValueAtTime(784, now + 0.3);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;
      }
    } catch {
      // Audio not available
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('point-sound-enabled', String(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }
}
