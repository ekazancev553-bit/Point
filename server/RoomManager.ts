import { OnlineGameController } from './OnlineGameController';

export interface Player {
  id: string;
  name: string;
  color: 'red' | 'blue';
}

export interface GameRoom {
  id: string;
  boardWidth: number;
  boardHeight: number;
  players: Player[];
  gameController: OnlineGameController | null;
  createdAt: number;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  /**
   * Create a new room
   */
  createRoom(boardWidth: number, boardHeight: number): string {
    const roomId = this.generateRoomId();
    this.rooms.set(roomId, {
      id: roomId,
      boardWidth,
      boardHeight,
      players: [],
      gameController: null,
      createdAt: Date.now(),
    });
    console.log(`Room ${roomId} created (${boardWidth}x${boardHeight})`);
    return roomId;
  }

  /**
   * Get a room by ID
   */
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Find an available room (not full, same board size)
   */
  findAvailableRoom(boardWidth: number, boardHeight: number): string | null {
    for (const [roomId, room] of this.rooms) {
      if (
        room.players.length < 2 &&
        !room.gameController &&
        room.boardWidth === boardWidth &&
        room.boardHeight === boardHeight
      ) {
        return roomId;
      }
    }
    return null;
  }

  /**
   * Add a player to a room
   */
  addPlayerToRoom(roomId: string, playerId: string, playerName: string, color: 'red' | 'blue'): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.push({
      id: playerId,
      name: playerName,
      color,
    });
    console.log(`Added player ${playerName} (${playerId}) to room ${roomId}`);
  }

  /**
   * Remove a player from a room
   */
  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    console.log(`Removed player ${playerId} from room ${roomId}`);
  }

  /**
   * Delete a room
   */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
    console.log(`Room ${roomId} deleted`);
  }

  /**
   * Get all active rooms
   */
  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get room statistics
   */
  getStats(): {
    totalRooms: number;
    activeGames: number;
    waitingRooms: number;
    totalPlayers: number;
  } {
    let activeGames = 0;
    let waitingRooms = 0;
    let totalPlayers = 0;

    for (const room of this.rooms.values()) {
      if (room.gameController) {
        activeGames++;
      } else {
        waitingRooms++;
      }
      totalPlayers += room.players.length;
    }

    return {
      totalRooms: this.rooms.size,
      activeGames,
      waitingRooms,
      totalPlayers,
    };
  }

  /**
   * Generate a unique room ID
   */
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
