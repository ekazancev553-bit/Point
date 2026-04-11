import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { OnlineGameController } from './OnlineGameController';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;
const roomManager = new RoomManager();

// Serve client in production
app.use(express.static('dist'));

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Player joins a room
  socket.on('room:join', (data: { roomId?: string; playerName: string; boardWidth: number; boardHeight: number }) => {
    let roomId = data.roomId;

    // If no room specified, find or create one
    if (!roomId) {
      roomId = roomManager.findAvailableRoom(data.boardWidth, data.boardHeight);
      if (!roomId) {
        roomId = roomManager.createRoom(data.boardWidth, data.boardHeight);
      }
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('room:error', { message: 'Room not found' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('room:error', { message: 'Room is full' });
      return;
    }

    // Add player to room
    const playerColor = room.players.length === 0 ? 'red' : 'blue';
    roomManager.addPlayerToRoom(roomId, socket.id, data.playerName, playerColor);

    // Join socket to room
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = socket.id;

    console.log(`Player ${data.playerName} (${socket.id}) joined room ${roomId} as ${playerColor}`);

    // Notify all players in room
    const updatedRoom = roomManager.getRoom(roomId);
    if (updatedRoom) {
      io.to(roomId).emit('room:updated', {
        roomId,
        players: updatedRoom.players.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
        })),
        gameStarted: updatedRoom.gameController !== null,
      });
    }

    // If room is full, start the game
    if (room.players.length === 2) {
      setTimeout(() => {
        const fullRoom = roomManager.getRoom(roomId!);
        if (fullRoom && fullRoom.players.length === 2 && !fullRoom.gameController) {
          fullRoom.gameController = new OnlineGameController(
            {
              boardWidth: fullRoom.boardWidth,
              boardHeight: fullRoom.boardHeight,
              gameMode: 'online',
            },
            roomId!,
            io,
          );
          console.log(`Game started in room ${roomId}`);
          io.to(roomId).emit('game:start', {
            config: {
              boardWidth: fullRoom.boardWidth,
              boardHeight: fullRoom.boardHeight,
            },
            players: fullRoom.players.map(p => ({
              id: p.id,
              name: p.name,
              color: p.color,
            })),
          });
        }
      }, 1000);
    }
  });

  // Player makes a move
  socket.on('move:make', (data: { roomId: string; point: { x: number; y: number } }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room || !room.gameController) {
      socket.emit('move:error', { message: 'Game not found' });
      return;
    }

    // Validate that current player is making the move
    const currentPlayer = room.gameController.getCurrentPlayer();
    const playerId = socket.data.playerId;
    const player = room.players.find(p => p.id === playerId);

    if (!player || player.color !== currentPlayer) {
      socket.emit('move:error', { message: 'Not your turn' });
      return;
    }

    const result = room.gameController.makeMove(data.point);
    if (!result.success) {
      socket.emit('move:error', { message: result.error || 'Invalid move' });
      return;
    }

    // Broadcast move to all players
    io.to(data.roomId).emit('move:made', {
      point: data.point,
      player: currentPlayer,
      captures: result.captures,
      gameOver: result.gameOver,
      winner: result.winner,
    });

    // If game over, announce winner
    if (result.gameOver) {
      io.to(data.roomId).emit('game:over', {
        winner: result.winner,
        score: room.gameController.getScore(),
      });
    }
  });

  // Player passes
  socket.on('move:pass', (data: { roomId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room || !room.gameController) {
      socket.emit('move:error', { message: 'Game not found' });
      return;
    }

    const currentPlayer = room.gameController.getCurrentPlayer();
    const player = room.players.find(p => p.id === socket.data.playerId);

    if (!player || player.color !== currentPlayer) {
      socket.emit('move:error', { message: 'Not your turn' });
      return;
    }

    room.gameController.pass();

    io.to(data.roomId).emit('move:passed', {
      currentPlayer: room.gameController.getCurrentPlayer(),
    });

    // Check if game is over after pass
    if (room.gameController.getPhase() === 'gameOver') {
      io.to(data.roomId).emit('game:over', {
        winner: room.gameController.getWinner(),
        score: room.gameController.getScore(),
      });
    }
  });

  // Player disconnects
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      roomManager.removePlayerFromRoom(roomId, socket.id);
      console.log(`Player ${socket.id} disconnected from room ${roomId}`);

      const room = roomManager.getRoom(roomId);
      if (room && room.players.length === 0) {
        roomManager.deleteRoom(roomId);
        console.log(`Room ${roomId} deleted (no players)`);
      } else if (room) {
        // Notify remaining players
        io.to(roomId).emit('player:disconnected', {
          playerId: socket.id,
        });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`✨ Point Server listening on port ${PORT}`);
  console.log(`CORS enabled for http://localhost:5173 and http://localhost:4173`);
});
