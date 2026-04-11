# Point — Точки (Dots) Strategy Game

A modern implementation of the classic "Точки" (Dots) strategy game for the web and Android (Google Play Market). Two players take turns placing dots on a grid; when your dots enclose opponent dots, they're captured. Win by capturing the most dots!

## Features

- 🎮 **Multiple Game Modes**
  - Play against AI (Easy, Medium, Hard)
  - Local 2-player on one device
  - Online multiplayer

- 🤖 **Intelligent AI**
  - Easy: Random moves with basic heuristics
  - Medium: Greedy evaluation of each move
  - Hard: Minimax with alpha-beta pruning

- 📱 **Cross-Platform**
  - Web: Modern browsers (Chrome, Firefox, Safari, Edge)
  - Android: Via Capacitor, ready for Google Play Store

- 🎨 **Modern UI**
  - Canvas-based grid rendering
  - Interactive hover previews
  - Smooth animations
  - Dark theme

- 🔊 **Audio & Haptics**
  - Sound effects
  - Haptic feedback on mobile

- 💾 **Persistence**
  - Game history
  - Player settings
  - Undo/redo in local games

## Quick Start

### Play Online (No Install)
Open `game.html` in any modern browser. No build or installation needed.

### Development Setup
```bash
npm install
npm run dev          # Start dev server
npm test             # Run tests
npm run build        # Build for production
```

### Android Build
See [BUILD.md](BUILD.md) for complete instructions.

## Documentation

- **[BUILD.md](BUILD.md)** — Building for web and Android
- **[DEVELOPMENT.md](DEVELOPMENT.md)** — Architecture and development guide
- **[CLAUDE.md](CLAUDE.md)** — Development workflow

## Game Rules

1. Players alternate placing dots on a grid
2. When your dots enclose opponent dots, they're captured
3. Captured dots become inactive but stay visible
4. Game ends after 2 consecutive passes or when board is full
5. Winner has more non-captured dots

## Tech Stack

- **Language**: TypeScript
- **Build**: Vite
- **Testing**: Vitest
- **Rendering**: HTML5 Canvas 2D
- **Mobile**: Capacitor 6
- **Online**: Socket.IO
- **Backend**: Node.js + Express

## Project Structure

```
├── src/engine/          — Game logic (pure, no DOM)
├── src/ai/              — AI opponents
├── src/ui/              — UI components & screens
├── src/online/          — Multiplayer client
├── server/              — Express + Socket.IO server
├── tests/               — Unit & integration tests
├── game.html            — Standalone game file
├── BUILD.md             — Build instructions
└── DEVELOPMENT.md       — Development guide
```

## Development

```bash
# Development
npm run dev              # Watch mode with hot reload
npm run test:watch      # Run tests in watch mode

# Production
npm run build            # Build for web/Android
npm run lint             # Check code
npm run format           # Format code

# Server (Online multiplayer)
npm run server:dev       # Run development server
npm run server:build     # Build for production
```

## Roadmap

- [x] Phase 1-6: Core engine, AI, UI, persistence, standalone HTML
- [x] Phase 7: Online multiplayer with Socket.IO
- [ ] Phase 8: Android build with Capacitor
- [ ] Phase 9: QA and Google Play Store release

## Testing

```bash
npm test                 # Run all tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

Comprehensive tests for:
- Board operations and grid state
- Capture detection with flood-fill algorithm
- Game rules and scoring
- AI move evaluation
- Game controller state transitions
- Undo/redo functionality
- Full integration tests

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and write tests
3. Run `npm run format && npm run lint && npm test`
4. Create pull request

## License

MIT

## Acknowledgments

- Classic "Точки" / "Dots" strategy game tradition
- Modern TypeScript tooling ecosystem
- Socket.IO for real-time multiplayer
- Capacitor team for web-to-mobile bridge
