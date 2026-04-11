# Point — Development Guide

## Architecture Overview

The Point game is built with a clean separation of concerns:

```
src/
├── engine/          — Pure game logic (NO DOM)
├── ai/              — AI opponents (NO DOM)
├── ui/              — Canvas rendering & UI screens
├── online/          — WebSocket multiplayer client
├── audio/           — Sound & haptic feedback
├── storage/         — Persistence layer
└── utils/           — Shared utilities

server/             — Express + Socket.IO multiplayer server
```

## Core Game Logic (`src/engine/`)

### Board (`Board.ts`)
- 2D grid representation: `grid[y][x]` (row-major)
- Methods: `placeDot()`, `getDot()`, `markCaptured()`, `clone()`
- **Zero DOM dependencies**

### CaptureDetector (`CaptureDetector.ts`)
- Detects enclosed regions using **4-directional flood fill**
- Algorithm:
  1. Mark all current player dots as "walls"
  2. Flood fill from unvisited cells
  3. Region is enclosed if it doesn't touch board edge
  4. If region contains opponent dots → they're captured

### GameRules (`GameRules.ts`)
- Validates moves: `isValidMove(board, point)`
- Calculates score: `calculateScore(board)` → `{red, blue, redCaptured, blueCaptured}`
- Detects game over: 2 consecutive passes or board full
- Determines winner: `getWinner(board)` → Player | null

### GameController (`GameController.ts`)
- **Orchestrates entire game flow**
- Manages phases: `setup` → `playing` → `gameOver`
- Coordinates: Board, CaptureDetector, History, EventBus
- Emits events: `move:made`, `capture:detected`, `turn:changed`, `game:over`

### History (`History.ts`)
- Command pattern for undo/redo
- Stacks: `undoStack` and `redoStack`
- Stores: move and captured dots state for recovery

## AI Opponents (`src/ai/`)

### EasyAI
- 70% prefer adjacent moves, 30% random
- Always captures if possible
- Fast, predictable

### MediumAI
- Evaluates each valid move
- Scoring: captures (+10), position control (+2), blocks (-1)
- Picks from top 3 weighted random
- Balanced difficulty

### HardAI
- **Minimax with alpha-beta pruning**
- Search depth: 3-4 moves
- Time-limited: 2 seconds max
- Move ordering by adjacency
- Runs in Web Worker to not block UI

## UI System (`src/ui/`)

### BoardRenderer (`components/BoardRenderer.ts`)
- Canvas 2D rendering
- Cell size auto-calculated from canvas dimensions
- Renders:
  - Grid lines (thin, translucent)
  - Dots with player colors (gradient fills)
  - Captured dots (darker, strikethrough effect)
  - Hover ghost (semi-transparent preview)
  - Last move highlight (ring overlay)

### Screens
- `MenuScreen`: Main menu with mode selection
- `GameScreen`: Active gameplay (input handling, rendering)
- `GameOverScreen`: Results and replay options
- `SettingsScreen`: Board size, player names, AI difficulty
- `LobbyScreen`: Online game connection setup

### Router
- Simple screen switcher
- Handles mount/unmount lifecycle

## Online Multiplayer (`src/online/`)

### OnlineClient (`OnlineClient.ts`)
- WebSocket wrapper using Socket.IO
- Methods: `connect()`, `makeMove()`, `pass()`, `disconnect()`
- Emits events: `room:updated`, `game:start`, `move:made`, `game:over`

### OnlineGameAdapter (`OnlineGameAdapter.ts`)
- Bridges OnlineClient with GameScreen interface
- Maintains shadow board state
- Syncs with server events in real-time
- No undo/redo (unlike local games)

### Server (`server/index.ts`)
- Express + Socket.IO server
- Endpoints:
  - `room:join` → Match players or create room
  - `move:make` → Validate move server-side
  - `move:pass` → Handle pass, check game over

## Testing

### Unit Tests (`tests/`)
```
engine/
├── Board.test.ts          — Grid operations, placement
├── CaptureDetector.test.ts — Flood fill edge cases
├── GameRules.test.ts      — Move validation, scoring
├── GameController.test.ts — Game flow, turn switching
├── History.test.ts        — Undo/redo stack operations
└── Scorer.test.ts         — Score calculation accuracy

ai/
├── EasyAI.test.ts         — Move selection, randomness
├── MediumAI.test.ts       — Evaluation scoring
└── HardAI.test.ts         — Minimax search

storage/
└── SettingsStore.test.ts  — LocalStorage persistence
```

### Integration Tests (`tests/integration/`)
- `full-game.test.ts`: Scripted game with known moves
- `ai-vs-ai.test.ts`: All AI levels play each other

### Running Tests
```bash
npm test              # Run once
npm run test:watch   # Watch mode
npm run test:coverage # Generate coverage report
```

## Common Tasks

### Add a New Feature
1. Implement in `engine/` if it affects game rules
2. Add unit tests in `tests/engine/`
3. Update `GameController` if needed
4. Add UI in `ui/screens/` or `ui/components/`
5. Integrate in `main.ts` or relevant screen
6. Test with `npm test` and `npm run dev`

### Debug AI Decision
1. Add logging in `Evaluator.ts` move scoring
2. Export `Evaluator` for testing:
   ```typescript
   const evaluator = new Evaluator();
   const moves = board.getEmptyPoints();
   for (const move of moves) {
     const score = evaluator.evaluateMove(board, move, 'red');
     console.log(`${move.x},${move.y}: ${score}`);
   }
   ```
3. Run in test or dev console

### Add New Game Mode
1. Add to `GameConfig` type in `types.ts`
2. Create screen in `ui/screens/`
3. Update `main.ts` to route to new screen
4. If game logic changes, update `GameController` or `GameRules`

### Performance Optimization
1. **Profile**: Open DevTools Performance tab during gameplay
2. **Check hotspots**:
   - `CaptureDetector.detectCaptures()` — runs every move
   - `HardAI.minimax()` — use Web Worker
   - `BoardRenderer.render()` — check canvas redraw frequency
3. **Optimize**:
   - Memoize expensive calculations
   - Use requestAnimationFrame for rendering
   - Cache board state in AI evaluation

## Code Style

### TypeScript
- Strict mode enabled
- Meaningful variable names
- Comments for non-obvious logic

### Formatting
```bash
npm run format  # Auto-format with Prettier
npm run lint    # Check with ESLint
```

### Naming Conventions
- Classes: `PascalCase` (e.g., `GameController`)
- Methods/functions: `camelCase` (e.g., `makeMove()`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_BOARD_WIDTH`)
- Private fields: `_prefixed` or `#private`

## Git Workflow

### Branch Naming
- Features: `feature/description`
- Bugfixes: `fix/description`
- Chores: `chore/description`

### Commit Messages
```
feat: add capture animation
fix: prevent invalid moves on edge cells
docs: update build guide
test: add edge case for flood fill
```

## Deployment

### Web
- Build: `npm run build`
- Deploy: Upload `dist/` to web server
- Version: Tag in git (e.g., `git tag v1.0.0`)

### Android
- See `BUILD.md` for full instructions
- Key steps:
  1. `npm run build`
  2. `npx cap sync android`
  3. `cd android && ./gradlew bundleRelease`

### Online Server
- Deploy Node.js app with `server/index.ts`
- Use environment variables for configuration
- Recommended: Docker container or cloud platform (Heroku, Render, etc.)

## Debugging

### Browser DevTools
- **Console**: Log game events with EventBus
- **Performance**: Profile rendering and AI
- **Network**: Monitor WebSocket traffic for online games

### VSCode Debugging
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/vitest",
  "console": "integratedTerminal"
}
```

### Server Debugging
```bash
NODE_DEBUG=socket.io npm run server:dev
```

## Resources

- [TypeScript Handbook](https://www.typescripthandbook.org/)
- [Vite Docs](https://vitejs.dev/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
