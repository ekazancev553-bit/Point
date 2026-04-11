import { io, Socket } from 'socket.io-client';
import { Point, Player, GameConfig, Score, CapturedRegion } from '../types';

export interface OnlineGameEvent {
  type:
    | 'room:updated'
    | 'game:start'
    | 'move:made'
    | 'move:passed'
    | 'game:over'
    | 'player:disconnected'
    | 'error';
  data: any;
}

export class OnlineClient {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private playerId: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Connect to the server and join a room
   */
  connect(serverUrl: string, playerName: string, boardWidth: number, boardHeight: number, roomId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('Connected to server');
          this.playerId = this.socket!.id;

          // Join room
          this.socket!.emit('room:join', {
            roomId,
            playerName,
            boardWidth,
            boardHeight,
          });
        });

        this.socket.on('room:updated', (data) => {
          this.roomId = data.roomId;
          this.emit('room:updated', data);
        });

        this.socket.on('game:start', (data) => {
          this.emit('game:start', data);
          resolve();
        });

        this.socket.on('move:made', (data) => {
          this.emit('move:made', data);
        });

        this.socket.on('move:passed', (data) => {
          this.emit('move:passed', data);
        });

        this.socket.on('game:over', (data) => {
          this.emit('game:over', data);
        });

        this.socket.on('player:disconnected', (data) => {
          this.emit('player:disconnected', data);
        });

        this.socket.on('room:error', (data) => {
          console.error('Room error:', data.message);
          this.emit('error', data);
          reject(new Error(data.message));
        });

        this.socket.on('move:error', (data) => {
          console.error('Move error:', data.message);
          this.emit('error', data);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.emit('disconnect');
        });

        this.socket.on('reconnect', () => {
          console.log('Reconnected to server');
          this.emit('reconnect');
        });

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.roomId) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Make a move on the server
   */
  makeMove(point: Point): void {
    if (!this.socket || !this.roomId) {
      console.error('Not connected to room');
      return;
    }

    this.socket.emit('move:make', {
      roomId: this.roomId,
      point,
    });
  }

  /**
   * Pass your turn
   */
  pass(): void {
    if (!this.socket || !this.roomId) {
      console.error('Not connected to room');
      return;
    }

    this.socket.emit('move:pass', {
      roomId: this.roomId,
    });
  }

  /**
   * Listen to events
   */
  on(event: string, handler: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Stop listening to events
   */
  off(event: string, handler: (data: any) => void): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(handler);
    }
  }

  /**
   * Emit an event to listeners
   */
  private emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)!) {
        handler(data);
      }
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get current room ID
   */
  getRoomId(): string | null {
    return this.roomId;
  }

  /**
   * Get current player ID
   */
  getPlayerId(): string | null {
    return this.playerId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}
