type EventHandler = (...args: unknown[]) => void;

export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(handler => handler(...args));
  }

  once(event: string, handler: EventHandler): void {
    const wrapper: EventHandler = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    this.on(event, wrapper);
  }

  clear(): void {
    this.listeners.clear();
  }
}
